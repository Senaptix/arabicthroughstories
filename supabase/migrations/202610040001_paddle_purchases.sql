-- Direct digital sales through Paddle (merchant of record).
--
-- WHY THIS SHAPE. A Paddle sale is a stall sale without the stall: money taken,
-- one book opened for a year. So it reuses what Part C already built rather
-- than inventing a second entitlement path:
--
--   signed-in buyer  -> entitlement row for that book, 12 months, immediately
--   guest buyer      -> a single-use QK- code for that book, emailed; they
--                       redeem it at signup exactly like a stall buyer
--
-- The webhook has no user session, so it cannot use issue_activation_code
-- (which demands auth.uid()). It calls record_paddle_purchase below with the
-- same server-held issuer secret instead.
--
-- IDEMPOTENT ON THE PADDLE TRANSACTION ID. Paddle retries a webhook until it
-- gets a 2xx, and may deliver the same event twice. A second delivery returns
-- what the first one did and grants nothing new, so it can resend an email
-- that failed without minting a second code.

create table public.paddle_transactions (
  transaction_id text primary key,       -- Paddle's txn_...
  book_slug      text not null check (btrim(book_slug) <> ''),
  parent_id      uuid references auth.users(id) on delete set null,
  customer_email text,
  code           text references public.activation_codes(code) on delete set null,
  created_at     timestamptz not null default now()
);

alter table public.paddle_transactions enable row level security;
revoke all on public.paddle_transactions from anon, authenticated;

create or replace function public.record_paddle_purchase(
  p_transaction text,
  p_book text,
  p_parent uuid,
  p_email text,
  p_code text,
  p_issuer_secret text
)
returns table (status text, code text, emailed boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_existing public.paddle_transactions;
begin
  if not public.activation_issuer_secret_matches(p_issuer_secret) then
    return query select 'not_authorised'::text, null::text, false;
    return;
  end if;

  select * into v_existing from public.paddle_transactions where transaction_id = p_transaction;
  if found then
    return query
      select 'duplicate'::text, v_existing.code,
             coalesce((select c.emailed_at is not null from public.activation_codes c
                        where c.code = v_existing.code), true);
    return;
  end if;

  -- A parent id from custom_data is only trusted if the account exists. A
  -- forged id can at worst gift the buyer's own purchase to someone else.
  if p_parent is not null and exists (select 1 from auth.users u where u.id = p_parent) then
    insert into public.paddle_transactions (transaction_id, book_slug, parent_id, customer_email)
    values (p_transaction, p_book, p_parent, lower(btrim(p_email)));

    insert into public.entitlements (parent_id, book_slug, source, starts_at, expires_at)
    values (p_parent, p_book, 'direct_sale', now(), now() + interval '12 months')
    on conflict (parent_id, book_slug) do update
      set source = 'direct_sale',
          expires_at = greatest(entitlements.expires_at, excluded.expires_at);

    return query select 'granted'::text, null::text, true;
    return;
  end if;

  if p_email is null or btrim(p_email) = '' then
    return query select 'no_email'::text, null::text, false;
    return;
  end if;

  if p_code !~ '^QK-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$' then
    return query select 'invalid_code'::text, null::text, false;
    return;
  end if;

  begin
    insert into public.activation_codes (code, issued_to, note, book_slug)
    values (p_code, lower(btrim(p_email)), 'paddle ' || p_transaction, p_book);
  exception
    when unique_violation then
      return query select 'collision'::text, null::text, false;
      return;
  end;

  insert into public.paddle_transactions (transaction_id, book_slug, customer_email, code)
  values (p_transaction, p_book, lower(btrim(p_email)), p_code);

  return query select 'code_issued'::text, p_code, false;
end;
$$;

-- The webhook's own "the email went out" marker. mark_activation_code_emailed
-- requires a signed-in admin, which a webhook never is.
create or replace function public.mark_paddle_code_emailed(
  p_code text,
  p_issuer_secret text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.activation_issuer_secret_matches(p_issuer_secret) then
    return false;
  end if;
  update public.activation_codes
     set emailed_at = now()
   where code = p_code
     and emailed_at is null
     and note like 'paddle %';
  return found;
end;
$$;

revoke execute on function public.record_paddle_purchase(text, text, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.record_paddle_purchase(text, text, uuid, text, text, text) to anon, authenticated;

revoke execute on function public.mark_paddle_code_emailed(text, text) from public, anon, authenticated;
grant execute on function public.mark_paddle_code_emailed(text, text) to anon, authenticated;
