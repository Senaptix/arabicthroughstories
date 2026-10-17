-- Multi-book and bundle purchase support for Paddle transactions.
--
-- WHY THIS CHANGE:
-- A bundle purchase (PADDLE_PRICE_BUNDLE) sells both Ibrahim and Yusuf in a
-- single Paddle transaction.
--
-- 1. paddle_transactions previously used transaction_id as the sole primary key,
--    preventing multiple book rows for one transaction. We widen the primary key
--    to (transaction_id, book_slug).
-- 2. record_paddle_purchase previously checked `where transaction_id = p_transaction`,
--    causing subsequent books in the same transaction to return 'duplicate' without
--    being granted. We change the check to `where transaction_id = p_transaction and book_slug = p_book`.
--
-- Idempotency is preserved: replaying the same (transaction_id, book_slug)
-- returns 'duplicate' and grants nothing new.

alter table public.paddle_transactions drop constraint if exists paddle_transactions_pkey;
alter table public.paddle_transactions
  add constraint paddle_transactions_pkey primary key (transaction_id, book_slug);

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

  select * into v_existing
    from public.paddle_transactions
   where transaction_id = p_transaction
     and book_slug = p_book;

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

revoke execute on function public.record_paddle_purchase(text, text, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.record_paddle_purchase(text, text, uuid, text, text, text) to anon, authenticated;
