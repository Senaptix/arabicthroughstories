-- Qasas Kids purchase activation and time-limited companion access.
-- Parents can claim an order number, but only an administrator can approve it.

create table public.activations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index activations_one_approval_per_order
  on public.activations (lower(order_number))
  where status = 'approved';

create index activations_parent_id_idx on public.activations(parent_id);

create table public.entitlements (
  parent_id uuid primary key references auth.users(id) on delete cascade,
  source text not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- An activation claim starts a provisional 30-day window immediately.
create or replace function public.grant_provisional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.entitlements (parent_id, source, starts_at, expires_at)
  values (new.parent_id, 'provisional', now(), now() + interval '30 days')
  on conflict (parent_id) do update
    set expires_at = greatest(entitlements.expires_at, excluded.expires_at);
  return new;
end;
$$;

create trigger activations_provisional
after insert on public.activations
for each row execute function public.grant_provisional();

-- Approval is one table-editor action: changing status extends access to a year.
create or replace function public.grant_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and coalesce(old.status, '') <> 'approved' then
    insert into public.entitlements (parent_id, source, starts_at, expires_at)
    values (new.parent_id, 'book_activation', now(), now() + interval '12 months')
    on conflict (parent_id) do update
      set source = 'book_activation',
          expires_at = greatest(entitlements.expires_at, excluded.expires_at);
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

create trigger activations_grant
before update on public.activations
for each row execute function public.grant_on_approval();

-- Email-confirmed signups do not have a client session yet. Bridge the order
-- number in auth metadata into the activation table inside the signup
-- transaction; inserting that row invokes activations_provisional above.
create or replace function public.create_activation_from_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_order_number text;
begin
  claimed_order_number := nullif(btrim(new.raw_user_meta_data ->> 'order_number'), '');
  if claimed_order_number is null then
    raise exception 'An Amazon order number is required to create an account'
      using errcode = '23514';
  end if;

  insert into public.activations (parent_id, order_number)
  values (new.id, claimed_order_number);
  return new;
end;
$$;

create trigger auth_user_activation
after insert on auth.users
for each row execute function public.create_activation_from_signup();

alter table public.activations enable row level security;
alter table public.entitlements enable row level security;

create policy "Parents view their own activation claims"
on public.activations for select to authenticated
using ((select auth.uid()) = parent_id);

create policy "Parents create pending activation claims"
on public.activations for insert to authenticated
with check (
  (select auth.uid()) = parent_id
  and status = 'pending'
  and reviewed_at is null
);

create policy "Parents view their own entitlements"
on public.entitlements for select to authenticated
using ((select auth.uid()) = parent_id);

-- Remove Supabase's broad defaults before granting the exact RLS surface.
-- In particular, authenticated parents receive no UPDATE privilege and
-- therefore cannot approve themselves or write entitlements directly.
revoke all on public.activations from anon, authenticated;
revoke all on public.entitlements from anon, authenticated;
grant select, insert on public.activations to authenticated;
grant select on public.entitlements to authenticated;
