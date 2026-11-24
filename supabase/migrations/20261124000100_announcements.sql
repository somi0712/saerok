begin;

create table public.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.admin_members enable row level security;
alter table public.announcements enable row level security;

revoke all on public.admin_members, public.announcements from anon, authenticated;
grant select on public.admin_members to authenticated;
grant select on public.announcements to anon, authenticated;
grant insert (title, body, published), update (title, body, published)
  on public.announcements to authenticated;

create policy "Users can check their own admin membership"
  on public.admin_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Anyone can read published announcements"
  on public.announcements for select to anon, authenticated
  using (published);

create policy "Admins can read all announcements"
  on public.announcements for select to authenticated
  using (exists (select 1 from public.admin_members where user_id = (select auth.uid())));

create policy "Admins can create announcements"
  on public.announcements for insert to authenticated
  with check (exists (select 1 from public.admin_members where user_id = (select auth.uid())));

create policy "Admins can edit announcements"
  on public.announcements for update to authenticated
  using (exists (select 1 from public.admin_members where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_members where user_id = (select auth.uid())));

commit;
