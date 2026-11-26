-- 새록 관리자 화면에서 관리자를 추가·해제한다.
-- auth.users는 브라우저에서 읽을 수 없으므로, 관리자만 부를 수 있는 함수로 이메일을 다룬다.
begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_members where user_id = (select auth.uid()));
$$;

create or replace function public.list_admins()
returns table (user_id uuid, email text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  return query
    select m.user_id, u.email::text
    from public.admin_members m
    join auth.users u on u.id = m.user_id
    order by u.email;
end;
$$;

create or replace function public.add_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  select id into target from auth.users where lower(email) = lower(btrim(target_email));
  if target is null then
    raise exception 'user_not_found';
  end if;
  insert into public.admin_members (user_id) values (target) on conflict do nothing;
end;
$$;

-- 자기 자신은 해제할 수 없다. 그래서 관리자가 한 명도 남지 않는 일이 없다.
create or replace function public.remove_admin(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if target = (select auth.uid()) then
    raise exception 'cannot_remove_self';
  end if;
  delete from public.admin_members where user_id = target;
end;
$$;

revoke all on function public.is_admin(), public.list_admins(), public.add_admin(text), public.remove_admin(uuid)
  from public, anon;
grant execute on function public.is_admin(), public.list_admins(), public.add_admin(text), public.remove_admin(uuid)
  to authenticated;

commit;
