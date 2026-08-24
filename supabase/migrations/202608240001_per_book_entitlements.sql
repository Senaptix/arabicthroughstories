-- Per-book entitlements, and approval moved out of the Supabase table editor.
--
-- WHY. The site hosts the full text and audio of every book, so one shared
-- entitlement let a Book 1 buyer read the whole of Book 2 without buying it.
-- That is a substitute for the product, not a loyalty perk. Buying a book now
-- opens that book, for a year from its own activation.
--
-- WHY NOW. Today there is exactly one book, so the backfill is one line. Once
-- a second book ships under shared access it cannot be taken back without
-- penalising people who already had it.
--
-- There is no code printed inside the Amazon book — KDP cannot do
-- variable-data printing. The receipt names the title and a human already
-- reads it, so the reviewer records which books at approval time. One Amazon
-- order routinely contains both books, so approval grants a SET of books.

/* ------------------------------------------------------------------ *
 * entitlements: one row per parent per book
 * ------------------------------------------------------------------ */

alter table public.entitlements
  add column book_slug text not null default 'ibrahim';

-- The backfill. Every existing row is an Ibrahim entitlement, because Ibrahim
-- is the only book that has ever been sold. The default above does the work;
-- it is dropped afterwards so future writes must be explicit.
alter table public.entitlements drop constraint entitlements_pkey;
alter table public.entitlements
  add constraint entitlements_pkey primary key (parent_id, book_slug);
alter table public.entitlements alter column book_slug drop default;

alter table public.entitlements
  add constraint entitlements_book_slug_nonempty check (btrim(book_slug) <> '');

/* ------------------------------------------------------------------ *
 * activations: which books this order is claimed to contain
 * ------------------------------------------------------------------ */

alter table public.activations
  add column book_slugs text[] not null default array['ibrahim'];

alter table public.activations
  add constraint activations_book_slugs_nonempty
  check (array_length(book_slugs, 1) >= 1);

alter table public.activation_codes
  add column book_slug text not null default 'ibrahim';

/* ------------------------------------------------------------------ *
 * Granting
 * ------------------------------------------------------------------ */

-- A claim starts a provisional 30-day window on each book claimed.
--
-- NOTE, unchanged from before this migration: provisional access is
-- self-service — the parent asserts an order number and is believed for 30
-- days. Asma's approval is the real gate. This migration widens that window
-- from one book to the books claimed; it does not change who can open it.
create or replace function public.grant_provisional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
begin
  foreach v_slug in array new.book_slugs loop
    insert into public.entitlements (parent_id, book_slug, source, starts_at, expires_at)
    values (new.parent_id, v_slug, 'provisional', now(), now() + interval '30 days')
    on conflict (parent_id, book_slug) do update
      set expires_at = greatest(entitlements.expires_at, excluded.expires_at);
  end loop;
  return new;
end;
$$;

-- Approval extends every book on the activation to a year.
create or replace function public.grant_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
begin
  if new.status = 'approved' and coalesce(old.status, '') <> 'approved' then
    foreach v_slug in array new.book_slugs loop
      insert into public.entitlements (parent_id, book_slug, source, starts_at, expires_at)
      values (new.parent_id, v_slug, 'book_activation', now(), now() + interval '12 months')
      on conflict (parent_id, book_slug) do update
        set source = 'book_activation',
            expires_at = greatest(entitlements.expires_at, excluded.expires_at);
    end loop;
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

-- An event code opens the one book it was issued for.
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
  v_book text;
begin
  if p_parent is null then return 'not_signed_in'; end if;

  update public.activation_codes
     set redeemed_by = p_parent, redeemed_at = now()
   where public.normalise_activation_code(code) = v_norm
     and redeemed_by is null
  returning code, book_slug into v_found, v_book;

  if v_found is null then
    if exists (
      select 1 from public.activation_codes
      where public.normalise_activation_code(code) = v_norm
    ) then
      return 'already_used';
    end if;
    return 'not_found';
  end if;

  insert into public.entitlements (parent_id, book_slug, source, starts_at, expires_at)
  values (p_parent, v_book, 'direct_sale', now(), now() + interval '12 months')
  on conflict (parent_id, book_slug) do update
    set source = 'direct_sale',
        expires_at = greatest(entitlements.expires_at, excluded.expires_at);

  return 'ok';
end;
$$;

-- Signup may name the book in auth metadata. Absent, it is Ibrahim: the only
-- book on sale when this shipped, so existing signup forms keep working
-- untouched and the field can be added to them later.
create or replace function public.create_activation_from_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_value text;
  claimed_book text;
  redemption_result text;
begin
  claimed_value := nullif(btrim(new.raw_user_meta_data ->> 'order_number'), '');
  if claimed_value is null then
    raise exception 'An Amazon order number or activation code is required to create an account'
      using errcode = '23514';
  end if;

  claimed_book := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'book_slug'), ''),
    'ibrahim'
  );

  if public.normalise_activation_code(claimed_value) like 'QK%' then
    redemption_result := public.redeem_activation_code_for_parent(claimed_value, new.id);
    if redemption_result <> 'ok' then
      raise exception 'Activation code redemption failed: %', redemption_result
        using errcode = '23514';
    end if;
  else
    insert into public.activations (parent_id, order_number, book_slugs)
    values (new.id, claimed_value, array[claimed_book]);
  end if;

  return new;
end;
$$;

/* ------------------------------------------------------------------ *
 * Asma's queue — approving belongs on the website, not in Supabase
 * ------------------------------------------------------------------ */

-- Now reports the books claimed, and aggregates expiry: a parent has several
-- entitlement rows, so the old left join would have multiplied the queue.
--
-- DROP first, not CREATE OR REPLACE. Adding book_slugs changes the composite
-- return type, and Postgres refuses to replace a function whose return type
-- differs ("cannot change return type of existing function"). The drop leaves
-- a sub-second window where the admin queue returns an error; no parent-facing
-- route touches this function.
drop function if exists public.list_pending_activations(text, integer);

create function public.list_pending_activations(
  p_issuer_secret text,
  p_limit integer default 100
)
returns table (
  activation_id uuid,
  email text,
  order_number text,
  book_slugs text[],
  claimed_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public, extensions, auth
as $$
begin
  if not public.activation_issuer_secret_matches(p_issuer_secret) then
    return;
  end if;

  return query
    select
      a.id,
      u.email::text,
      a.order_number,
      a.book_slugs,
      a.created_at,
      (select max(e.expires_at) from public.entitlements e where e.parent_id = a.parent_id)
    from public.activations a
    join auth.users u on u.id = a.parent_id
    where a.status = 'pending'
    order by a.created_at asc
    limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

-- Approve, granting a year on each book the reviewer ticked. The book list is
-- the reviewer's, not the claimant's: the parent says what they bought, the
-- receipt says what they actually bought, and the receipt wins.
--
-- Same two-gate pattern as every other admin function — the app checks
-- ADMIN_EMAILS before calling, the database checks the issuer secret before
-- answering. Neither alone grants access.
create or replace function public.approve_activation(
  p_activation_id uuid,
  p_book_slugs text[],
  p_issuer_secret text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if not public.activation_issuer_secret_matches(p_issuer_secret) then
    return 'not_authorised';
  end if;
  if p_book_slugs is null or array_length(p_book_slugs, 1) is null then
    return 'no_books';
  end if;

  select status into v_status
    from public.activations where id = p_activation_id;
  if v_status is null then return 'not_found'; end if;
  if v_status = 'approved' then return 'already_approved'; end if;

  -- book_slugs and status change together, so the trigger grants exactly the
  -- ticked set rather than whatever the parent originally claimed.
  update public.activations
     set book_slugs = p_book_slugs,
         status = 'approved'
   where id = p_activation_id;

  return 'ok';
exception
  -- One approval per order number, enforced by activations_one_approval_per_order.
  when unique_violation then return 'order_already_approved';
end;
$$;

create or replace function public.reject_activation(
  p_activation_id uuid,
  p_note text,
  p_issuer_secret text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.activation_issuer_secret_matches(p_issuer_secret) then
    return 'not_authorised';
  end if;

  update public.activations
     set status = 'rejected',
         note = nullif(btrim(p_note), ''),
         reviewed_at = now()
   where id = p_activation_id
     and status = 'pending';

  if not found then return 'not_found'; end if;
  return 'ok';
end;
$$;

-- Re-granted because the function was dropped and recreated above; a dropped
-- function takes its grants with it.
revoke all on function public.list_pending_activations(text, integer) from anon, authenticated;
grant execute on function public.list_pending_activations(text, integer) to authenticated;

revoke execute on function public.approve_activation(uuid, text[], text) from public, anon, authenticated;
grant execute on function public.approve_activation(uuid, text[], text) to authenticated;

revoke execute on function public.reject_activation(uuid, text, text) from public, anon, authenticated;
grant execute on function public.reject_activation(uuid, text, text) to authenticated;

revoke execute on function public.grant_provisional() from public, anon, authenticated;
revoke execute on function public.grant_on_approval() from public, anon, authenticated;
revoke execute on function public.redeem_activation_code_for_parent(text, uuid) from public, anon, authenticated;
revoke execute on function public.create_activation_from_signup() from public, anon, authenticated;
