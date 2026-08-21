-- Qasas Kids parent accounts and child reading progress.
-- Children never authenticate and no DOB, photo or free-text notes are kept.

create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  avatar_key text not null check (avatar_key in ('moon', 'star', 'book', 'lantern', 'leaf')),
  created_at timestamptz not null default now()
);

create index child_profiles_parent_id_idx on public.child_profiles(parent_id);

create table public.book_progress (
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  book_slug text not null check (book_slug ~ '^[a-z0-9-]+$'),
  last_page integer not null check (last_page > 0),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (child_id, book_slug)
);

create table public.page_progress (
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  book_slug text not null check (book_slug ~ '^[a-z0-9-]+$'),
  page_number integer not null check (page_number > 0),
  viewed_at timestamptz not null default now(),
  read_completed_at timestamptz,
  practice_completed_at timestamptz,
  best_correct integer check (best_correct is null or best_correct >= 0),
  graded_total integer check (graded_total is null or graded_total >= 0),
  updated_at timestamptz not null default now(),
  primary key (child_id, book_slug, page_number),
  check (best_correct is null or graded_total is null or best_correct <= graded_total)
);

create index page_progress_completed_idx
  on public.page_progress(child_id, book_slug, read_completed_at);

create or replace function public.limit_child_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.child_profiles where parent_id = new.parent_id) >= 5 then
    raise exception 'A parent account can have at most five child profiles'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger child_profiles_limit
before insert on public.child_profiles
for each row execute function public.limit_child_profiles();

alter table public.child_profiles enable row level security;
alter table public.book_progress enable row level security;
alter table public.page_progress enable row level security;

create policy "Parents manage their child profiles"
on public.child_profiles for all to authenticated
using ((select auth.uid()) = parent_id)
with check ((select auth.uid()) = parent_id);

create policy "Parents manage their children's book progress"
on public.book_progress for all to authenticated
using (
  exists (
    select 1 from public.child_profiles cp
    where cp.id = child_id and cp.parent_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.child_profiles cp
    where cp.id = child_id and cp.parent_id = (select auth.uid())
  )
);

create policy "Parents manage their children's page progress"
on public.page_progress for all to authenticated
using (
  exists (
    select 1 from public.child_profiles cp
    where cp.id = child_id and cp.parent_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.child_profiles cp
    where cp.id = child_id and cp.parent_id = (select auth.uid())
  )
);

-- Automatic table exposure was disabled when the project was created.
-- Grant only authenticated parents access; RLS still scopes every row.
revoke all on public.child_profiles from anon;
revoke all on public.book_progress from anon;
revoke all on public.page_progress from anon;
grant select, insert, update, delete on public.child_profiles to authenticated;
grant select, insert, update, delete on public.book_progress to authenticated;
grant select, insert, update, delete on public.page_progress to authenticated;
