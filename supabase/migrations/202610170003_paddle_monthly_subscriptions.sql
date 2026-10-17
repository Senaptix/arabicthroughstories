-- Monthly subscriptions support for Paddle transactions.
--
-- 1. Table public.paddle_subscriptions stores subscription_id -> parent_id
--    alongside customer_id for customer portal session creation.
-- 2. Alter paddle_transactions to store kind and status ('granted', 'unmatched', etc.).
-- 3. Replace record_paddle_purchase to accept p_kind and p_expires_at,
--    applying greatest() upsert on entitlements and rejecting monthly guest codes.

create table if not exists public.paddle_subscriptions (
  subscription_id text primary key,
  parent_id uuid not null references auth.users(id) on delete cascade,
  customer_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paddle_subscriptions_parent_id_idx
  on public.paddle_subscriptions (parent_id);

alter table public.paddle_subscriptions enable row level security;
grant select on public.paddle_subscriptions to authenticated;

drop policy if exists "Parents can view their own paddle subscriptions" on public.paddle_subscriptions;
create policy "Parents can view their own paddle subscriptions"
  on public.paddle_subscriptions for select
  to authenticated
  using (parent_id = auth.uid());

alter table public.paddle_transactions
  add column if not exists kind text,
  add column if not exists status text default 'granted';

-- Functions to read and write subscription mapping with issuer secret
create or replace function public.get_paddle_subscription_parent(
  p_subscription text,
  p_issuer_secret text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.activation_issuer_secret_matches(p_issuer_secret) then
    return null;
  end if;
  return (select parent_id from public.paddle_subscriptions where subscription_id = p_subscription);
end;
$$;

create or replace function public.store_paddle_subscription(
  p_subscription text,
  p_parent uuid,
  p_customer text,
  p_issuer_secret text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.activation_issuer_secret_matches(p_issuer_secret) then
    return;
  end if;

  insert into public.paddle_subscriptions (subscription_id, parent_id, customer_id, updated_at)
  values (p_subscription, p_parent, coalesce(p_customer, ''), now())
  on conflict (subscription_id) do update
    set parent_id = excluded.parent_id,
        customer_id = case when excluded.customer_id <> '' then excluded.customer_id else paddle_subscriptions.customer_id end,
        updated_at = now();
end;
$$;

revoke execute on function public.get_paddle_subscription_parent(text, text) from public, anon, authenticated;
grant execute on function public.get_paddle_subscription_parent(text, text) to anon, authenticated;

revoke execute on function public.store_paddle_subscription(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.store_paddle_subscription(text, uuid, text, text) to anon, authenticated;

-- Drop old 6-arg version of record_paddle_purchase to avoid overload ambiguity
drop function if exists public.record_paddle_purchase(text, text, uuid, text, text, text);

create or replace function public.record_paddle_purchase(
  p_transaction text,
  p_book text,
  p_parent uuid,
  p_email text,
  p_code text,
  p_kind text,
  p_expires_at timestamptz,
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
  v_expires_at timestamptz;
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
      select 'duplicate'::text,
             v_existing.code,
             coalesce((select c.emailed_at is not null from public.activation_codes c
                        where c.code = v_existing.code), true);
    return;
  end if;

  -- A parent id is only trusted if the account exists.
  if p_parent is not null and exists (select 1 from auth.users u where u.id = p_parent) then
    v_expires_at := coalesce(p_expires_at, now() + interval '12 months');

    insert into public.paddle_transactions (transaction_id, book_slug, parent_id, customer_email, kind, status)
    values (p_transaction, p_book, p_parent, lower(btrim(p_email)), coalesce(p_kind, 'annual'), 'granted');

    insert into public.entitlements (parent_id, book_slug, source, starts_at, expires_at)
    values (p_parent, p_book, 'direct_sale', now(), v_expires_at)
    on conflict (parent_id, book_slug) do update
      set source = 'direct_sale',
          expires_at = greatest(entitlements.expires_at, excluded.expires_at);

    return query select 'granted'::text, null::text, true;
    return;
  end if;

  -- Monthly subscriptions strictly require sign-in; no guest checkout and no QK- codes.
  if p_kind = 'monthly' then
    insert into public.paddle_transactions (transaction_id, book_slug, customer_email, kind, status)
    values (p_transaction, p_book, lower(btrim(p_email)), p_kind, 'unmatched');

    return query select 'unmatched'::text, null::text, false;
    return;
  end if;

  -- Annual guest flow: issues single-use activation code
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

  insert into public.paddle_transactions (transaction_id, book_slug, customer_email, code, kind, status)
  values (p_transaction, p_book, lower(btrim(p_email)), p_code, coalesce(p_kind, 'annual'), 'code_issued');

  return query select 'code_issued'::text, p_code, false;
end;
$$;

revoke execute on function public.record_paddle_purchase(text, text, uuid, text, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.record_paddle_purchase(text, text, uuid, text, text, text, timestamptz, text) to anon, authenticated;
