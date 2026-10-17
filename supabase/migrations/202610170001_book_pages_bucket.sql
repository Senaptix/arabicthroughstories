-- Storage bucket for full book page illustrations.
--
-- Kept strictly private (public = false) so full pages cannot be read publicly via CDN/URLs.
-- With RLS enabled on storage.objects and no SELECT policy granted to anon/authenticated,
-- only the backend service role (which bypasses RLS) can read or write page objects.

insert into storage.buckets (id, name, public)
values ('book-pages', 'book-pages', false)
on conflict (id) do update set public = false;
