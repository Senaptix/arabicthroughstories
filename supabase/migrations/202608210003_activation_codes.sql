-- Qasas Kids single-use codes for books sold directly at events.
-- The table has no client-facing policy: narrowly scoped security-definer
-- functions are the only way to issue, inspect or redeem a code.

create table public.activation_codes (
  code text primary key,
  issued_to text,
  note text,
  created_at timestamptz not null default now(),
  emailed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz
);

create index activation_codes_issued_to
  on public.activation_codes (lower(issued_to));

-- Persistent attempt windows back the signup preflight and the authenticated
-- redemption RPC. This table is private for the same reason as the codes.
create table public.activation_code_redemption_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0),
  updated_at timestamptz not null default now()
);

-- One server credential digest is configured out-of-band when the environment
-- is provisioned. The plaintext credential exists only in the VPS env file.
create table public.activation_code_settings (
  singleton boolean primary key default true check (singleton),
  issuer_secret_hash text not null check (issuer_secret_hash ~ '^[a-f0-9]{64}$')
);

alter table public.activation_codes enable row level security;
alter table public.activation_code_redemption_limits enable row level security;
alter table public.activation_code_settings enable row level security;
revoke all on public.activation_codes from anon, authenticated;
revoke all on public.activation_code_redemption_limits from anon, authenticated;
revoke all on public.activation_code_settings from anon, authenticated;

create or replace function public.normalise_activation_code(p_code text)
returns text
language sql
immutable
strict
set search_path = public
as $$
  select upper(replace(btrim(p_code), '-', ''))
$$;

create unique index activation_codes_normalised_unique
  on public.activation_codes (public.normalise_activation_code(code));

create or replace function public.activation_issuer_secret_matches(p_secret text)
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select coalesce(
    (select issuer_secret_hash from public.activation_code_settings where singleton) =
      encode(extensions.digest(convert_to(coalesce(p_secret, ''), 'UTF8'), 'sha256'), 'hex'),
    false
  )
$$;

-- Five attempts per stable server-derived key in a rolling 15-minute window.
create or replace function public.consume_activation_code_attempt(p_rate_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts integer;
begin
  if p_rate_key !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  insert into public.activation_code_redemption_limits
    (rate_key, window_started_at, attempts, updated_at)
  values (p_rate_key, now(), 1, now())
  on conflict (rate_key) do update
    set window_started_at = case
          when activation_code_redemption_limits.window_started_at <= now() - interval '15 minutes'
            then now()
          else activation_code_redemption_limits.window_started_at
        end,
        attempts = case
          when activation_code_redemption_limits.window_started_at <= now() - interval '15 minutes'
            then 1
          else activation_code_redemption_limits.attempts + 1
        end,
        updated_at = now()
  returning attempts into v_attempts;

  return v_attempts <= 5;
end;
$$;

-- Server-only signup preflight. The credential is held in the VPS environment;
-- only its SHA-256 digest is configured in Postgres. It protects this anonymous
-- pre-signup call without introducing a service-role key into application code.
create or replace function public.check_activation_code_for_signup(
  p_code text,
  p_rate_key text,
  p_issuer_secret text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_norm text := public.normalise_activation_code(p_code);
begin
  if not public.activation_issuer_secret_matches(p_issuer_secret) then
    return 'not_authorised';
  end if;

  if not public.consume_activation_code_attempt(p_rate_key) then
    return 'rate_limited';
  end if;

  if exists (
    select 1 from public.activation_codes
    where public.normalise_activation_code(code) = v_norm
      and redeemed_by is null
  ) then
    return 'ok';
  end if;

  if exists (
    select 1 from public.activation_codes
    where public.normalise_activation_code(code) = v_norm
  ) then
    return 'already_used';
  end if;

  return 'not_found';
end;
$$;

-- Issuance is callable only with both an authenticated session and the
-- server-held credential. The Server Action separately checks ADMIN_EMAILS.
create or replace function public.issue_activation_code(
  p_code text,
  p_email text,
  p_note text,
  p_issuer_secret text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.activation_issuer_secret_matches(p_issuer_secret) then
    return 'not_authorised';
  end if;

  if p_code !~ '^QK-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$' then
    return 'invalid_code';
  end if;

  insert into public.activation_codes (code, issued_to, note)
  values (p_code, lower(btrim(p_email)), nullif(btrim(p_note), ''));
  return 'ok';
exception
  when unique_violation then return 'collision';
end;
$$;

create or replace function public.mark_activation_code_emailed(
  p_code text,
  p_issuer_secret text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.activation_issuer_secret_matches(p_issuer_secret) then
    return false;
  end if;

  update public.activation_codes
     set emailed_at = now()
   where public.normalise_activation_code(code) = public.normalise_activation_code(p_code)
     and emailed_at is null;
  return found;
end;
$$;

-- The conditional UPDATE is the single redemption point. It prevents two
-- simultaneous requests from both granting a year for one code.
create or replace function public.redeem_activation_code_for_parent(
  p_code text,
  p_parent uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_norm text := public.normalise_activation_code(p_code);
  v_found text;
begin
  if p_parent is null then return 'not_signed_in'; end if;

  update public.activation_codes
     set redeemed_by = p_parent, redeemed_at = now()
   where public.normalise_activation_code(code) = v_norm
     and redeemed_by is null
  returning code into v_found;

  if v_found is null then
    if exists (
      select 1 from public.activation_codes
      where public.normalise_activation_code(code) = v_norm
    ) then
      return 'already_used';
    end if;
    return 'not_found';
  end if;

  insert into public.entitlements (parent_id, source, starts_at, expires_at)
  values (p_parent, 'direct_sale', now(), now() + interval '12 months')
  on conflict (parent_id) do update
    set source = 'direct_sale',
        expires_at = greatest(entitlements.expires_at, excluded.expires_at);

  return 'ok';
end;
$$;

create or replace function public.redeem_activation_code(p_code text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_parent uuid := auth.uid();
  v_rate_key text;
begin
  if v_parent is null then return 'not_signed_in'; end if;
  v_rate_key := encode(extensions.digest(convert_to('user:' || v_parent::text, 'UTF8'), 'sha256'), 'hex');
  if not public.consume_activation_code_attempt(v_rate_key) then
    return 'rate_limited';
  end if;
  return public.redeem_activation_code_for_parent(p_code, v_parent);
end;
$$;

-- Email-confirmed signups have no browser session yet. Branch inside the
-- existing auth trigger so a QK code is consumed in the same transaction as
-- the new user, while Amazon numbers keep the Part B provisional path.
create or replace function public.create_activation_from_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_value text;
  redemption_result text;
begin
  claimed_value := nullif(btrim(new.raw_user_meta_data ->> 'order_number'), '');
  if claimed_value is null then
    raise exception 'An Amazon order number or activation code is required to create an account'
      using errcode = '23514';
  end if;

  if public.normalise_activation_code(claimed_value) like 'QK%' then
    redemption_result := public.redeem_activation_code_for_parent(claimed_value, new.id);
    if redemption_result <> 'ok' then
      raise exception 'Activation code redemption failed: %', redemption_result
        using errcode = '23514';
    end if;
  else
    insert into public.activations (parent_id, order_number)
    values (new.id, claimed_value);
  end if;

  return new;
end;
$$;

-- Functions are executable by PUBLIC unless explicitly revoked. Grant only
-- the exact API surface; helpers stay callable solely by their definer.
revoke execute on function public.normalise_activation_code(text) from public, anon, authenticated;
revoke execute on function public.activation_issuer_secret_matches(text) from public, anon, authenticated;
revoke execute on function public.consume_activation_code_attempt(text) from public, anon, authenticated;
revoke execute on function public.redeem_activation_code_for_parent(text, uuid) from public, anon, authenticated;
revoke execute on function public.create_activation_from_signup() from public, anon, authenticated;

revoke execute on function public.check_activation_code_for_signup(text, text, text) from public, anon, authenticated;
grant execute on function public.check_activation_code_for_signup(text, text, text) to anon, authenticated;

revoke execute on function public.issue_activation_code(text, text, text, text) from public, anon, authenticated;
grant execute on function public.issue_activation_code(text, text, text, text) to authenticated;

revoke execute on function public.mark_activation_code_emailed(text, text) from public, anon, authenticated;
grant execute on function public.mark_activation_code_emailed(text, text) to authenticated;

revoke execute on function public.redeem_activation_code(text) from public, anon, authenticated;
grant execute on function public.redeem_activation_code(text) to authenticated;
