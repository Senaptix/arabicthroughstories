-- Open sign-up: the order number / QK code is optional.
-- A blank code creates the account with no entitlement and no activations row.
-- Non-blank behaviour is unchanged (copied from 202608240001_per_book_entitlements.sql).
-- check_activation_code_for_signup is only called by the app for non-blank QK
-- codes, so it needs no change.
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
    return new;
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

revoke execute on function public.create_activation_from_signup() from public, anon, authenticated;

-- Online purchases require an account. A purchase with no resolvable parent is
-- recorded 'unmatched' for annual too when the caller sends a blank code (the app
-- now always does). The guest QK- code branch below is kept for safety and is
-- reachable only with a non-blank code. Otherwise identical to 202610170003.
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

  -- Monthly, or any purchase sent without a code, needs a signed-in parent: no guest codes.
  if p_kind = 'monthly' or btrim(coalesce(p_code, '')) = '' then
    insert into public.paddle_transactions (transaction_id, book_slug, customer_email, kind, status)
    values (p_transaction, p_book, lower(btrim(p_email)), coalesce(p_kind, 'annual'), 'unmatched');

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
