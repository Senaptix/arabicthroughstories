-- Anonymise purchase records on account deletion for UK GDPR compliance while
-- preserving financial/tax transaction records for 6 years.
--
-- Nulls customer_email and parent_id for the parent's paddle_transactions rows.
-- Keeps transaction_id, book_slug, kind, status, and created_at.
-- Callable only by the service_role key.

create or replace function public.anonymise_paddle_transactions_for_parent(
  p_parent uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_parent is null then
    return;
  end if;

  update public.paddle_transactions
     set customer_email = null,
         parent_id = null
   where parent_id = p_parent;
end;
$$;

revoke all on function public.anonymise_paddle_transactions_for_parent(uuid) from public, anon, authenticated;
grant execute on function public.anonymise_paddle_transactions_for_parent(uuid) to service_role;
