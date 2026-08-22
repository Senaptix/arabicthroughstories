-- Asma's queue: every Amazon activation still waiting on a receipt.
--
-- This cannot be a plain select. RLS on public.activations scopes rows to the
-- signed-in parent, so an admin querying the table directly sees only their
-- own claims — correct for the parent-facing app, useless for review. The
-- alternative would be the service_role key in app code, which bypasses RLS
-- entirely and must never appear there.
--
-- So: security definer, gated on the same issuer secret the code-issuing
-- functions already use. Two independent gates, as with code generation — the
-- app checks ADMIN_EMAILS before it will call this, and the database checks
-- the secret before it will answer. Neither alone grants access.
--
-- The email comes from auth.users, which the app can never read directly.

create or replace function public.list_pending_activations(
  p_issuer_secret text,
  p_limit integer default 100
)
returns table (
  activation_id uuid,
  email text,
  order_number text,
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
    -- Return nothing rather than raising. A caller without the secret learns
    -- only that there is nothing for them, not that the function exists and
    -- rejected them.
    return;
  end if;

  return query
    select
      a.id,
      u.email::text,
      a.order_number,
      a.created_at,
      e.expires_at
    from public.activations a
    join auth.users u on u.id = a.parent_id
    left join public.entitlements e on e.parent_id = a.parent_id
    where a.status = 'pending'
    order by a.created_at asc
    limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

revoke all on function public.list_pending_activations(text, integer) from anon, authenticated;
grant execute on function public.list_pending_activations(text, integer) to authenticated;
