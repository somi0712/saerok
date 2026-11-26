-- 새록 관리자 웹 확장: 서버 보관 기록, 예약 게시, 활동 기록, 관리자 통계·사용자 관리.
-- 기록은 사용자가 '내 기록을 서버에 보관'에 동의한 경우에만 앱이 올린다. 일기·사진·음성은 올리지 않는다.
-- 관리자는 개별 기록을 직접 읽지 않고, 아래 admin_* 함수로 묶음 통계와 사용자 요약만 본다.
begin;

-- 1. 서버에 보관하는 기록 ------------------------------------------------------

create table public.practice_sessions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  at timestamptz not null,
  task text not null check (task in ('order', 'recall', 'training', 'check')),
  correct int not null check (correct >= 0),
  total int not null check (total >= 0),
  hints int not null default 0 check (hints >= 0),
  strategy text check (char_length(strategy) <= 40),
  burden text check (burden in ('easy', 'ok', 'hard')),
  minutes int check (minutes between 0 and 600),
  primary key (user_id, id)
);

create table public.assessments (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  at timestamptz not null,
  score int not null check (score between 0 and 100),
  level int not null check (level between 1 and 10),
  modules jsonb not null default '{}'::jsonb,
  primary key (user_id, id)
);

alter table public.practice_sessions enable row level security;
alter table public.assessments enable row level security;
revoke all on public.practice_sessions, public.assessments from anon, authenticated;
grant select, insert, update, delete on public.practice_sessions, public.assessments to authenticated;

create policy "Users manage their own practice sessions"
  on public.practice_sessions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage their own assessments"
  on public.assessments for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 2. 공지 예약 게시: publish_at 이 지나야 사용자에게 보인다 ---------------------

alter table public.announcements add column publish_at timestamptz;
grant insert (publish_at), update (publish_at) on public.announcements to authenticated;

drop policy "Anyone can read published announcements" on public.announcements;
create policy "Anyone can read published announcements"
  on public.announcements for select to anon, authenticated
  using (published and (publish_at is null or publish_at <= now()));

-- 3. 활동 기록 ---------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  target text,
  detail jsonb not null default '{}'::jsonb
);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;

create or replace function public.write_audit(audit_action text, audit_target text, audit_detail jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor, action, target, detail)
  values ((select auth.uid()), audit_action, audit_target, audit_detail);
$$;
revoke all on function public.write_audit(text, text, jsonb) from public, anon, authenticated;

create or replace function public.audit_announcements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.write_audit(
    case when tg_op = 'INSERT' then 'announcement.create' else 'announcement.update' end,
    new.title,
    jsonb_build_object('id', new.id, 'published', new.published, 'publish_at', new.publish_at)
  );
  return new;
end;
$$;
create trigger audit_announcements after insert or update on public.announcements
  for each row execute function public.audit_announcements();

create or replace function public.audit_admin_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member uuid;
begin
  if tg_op = 'INSERT' then member := new.user_id; else member := old.user_id; end if;
  perform public.write_audit(
    case when tg_op = 'INSERT' then 'admin.add' else 'admin.remove' end,
    (select u.email::text from auth.users u where u.id = member),
    jsonb_build_object('user_id', member)
  );
  return null;
end;
$$;
create trigger audit_admin_members after insert or delete on public.admin_members
  for each row execute function public.audit_admin_members();

-- 4. 관리자 전용 함수 ----------------------------------------------------------

-- 개요 대시보드 숫자. 모두 실제 COUNT 결과다.
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return jsonb_build_object(
    'users', (select count(*) from auth.users),
    'confirmed_users', (select count(*) from auth.users where email_confirmed_at is not null),
    'record_users', (select count(*) from (
      select user_id from public.practice_sessions union select user_id from public.assessments) r),
    'admins', (select count(*) from public.admin_members),
    'sessions_total', (select count(*) from public.practice_sessions),
    'sessions_7d', (select count(*) from public.practice_sessions where at >= now() - interval '7 days'),
    'assessments_total', (select count(*) from public.assessments),
    'notices_live', (select count(*) from public.announcements
      where published and (publish_at is null or publish_at <= now())),
    'notices_scheduled', (select count(*) from public.announcements where published and publish_at > now()),
    'notices_draft', (select count(*) from public.announcements where not published),
    -- 사용자마다 가장 최근 테스트의 단계 → {"단계": 사람 수}
    'levels', (select coalesce(jsonb_object_agg(l.level::text, l.n), '{}'::jsonb) from (
      select latest.level, count(*) as n from (
        select distinct on (a.user_id) a.user_id, a.level
        from public.assessments a order by a.user_id, a.at desc) latest
      group by latest.level) l),
    -- 최근 14일 날짜별 연습 수 (서울 시간 기준) → [{"day": "2026-11-27", "n": 3}, ...]
    'daily', (select jsonb_agg(jsonb_build_object('day', d.day, 'n', d.n) order by d.day) from (
      select g.day::date as day,
        (select count(*) from public.practice_sessions s
          where (s.at at time zone 'Asia/Seoul')::date = g.day::date) as n
      from generate_series(today - 13, today, interval '1 day') as g(day)) d)
  );
end;
$$;

-- 사용자 목록: 계정 정보와 기록 요약만. 비밀번호·인증 비밀값은 내보내지 않는다.
create or replace function public.admin_users()
returns table (
  user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  confirmed boolean, suspended boolean, is_admin boolean,
  sessions bigint, last_practice_at timestamptz, last_level int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at,
      u.email_confirmed_at is not null,
      coalesce(u.banned_until > now(), false),
      exists (select 1 from public.admin_members m where m.user_id = u.id),
      (select count(*) from public.practice_sessions s where s.user_id = u.id),
      (select max(s.at) from public.practice_sessions s where s.user_id = u.id),
      (select a.level from public.assessments a where a.user_id = u.id order by a.at desc limit 1)
    from auth.users u
    order by u.created_at desc;
end;
$$;

-- 이메일 확인이 안 된 계정을 확인 처리한다.
create or replace function public.admin_confirm_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = target;
  if not found then raise exception 'user_not_found'; end if;
  perform public.write_audit('user.confirm', (select u.email::text from auth.users u where u.id = target),
    jsonb_build_object('user_id', target));
end;
$$;

-- 계정 이용 정지·해제. 사유를 꼭 남긴다. 내 계정은 바꿀 수 없다.
create or replace function public.admin_set_user_status(target uuid, active boolean, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if target = (select auth.uid()) then raise exception 'cannot_change_self'; end if;
  if char_length(btrim(coalesce(reason, ''))) < 2 then raise exception 'reason_required'; end if;
  update auth.users set banned_until = case when active then null else 'infinity'::timestamptz end
    where id = target;
  if not found then raise exception 'user_not_found'; end if;
  perform public.write_audit(case when active then 'user.activate' else 'user.suspend' end,
    (select u.email::text from auth.users u where u.id = target),
    jsonb_build_object('user_id', target, 'reason', btrim(reason)));
end;
$$;

-- 활동 기록 조회 (최근 순)
create or replace function public.admin_audit_log(max_rows int default 100)
returns table (id bigint, at timestamptz, actor_email text, action text, target text, detail jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
    select l.id, l.at, u.email::text, l.action, l.target, l.detail
    from public.audit_log l left join auth.users u on u.id = l.actor
    order by l.at desc, l.id desc
    limit least(greatest(max_rows, 1), 500);
end;
$$;

revoke all on function public.admin_overview(), public.admin_users(), public.admin_confirm_user(uuid),
  public.admin_set_user_status(uuid, boolean, text), public.admin_audit_log(int) from public, anon;
grant execute on function public.admin_overview(), public.admin_users(), public.admin_confirm_user(uuid),
  public.admin_set_user_status(uuid, boolean, text), public.admin_audit_log(int) to authenticated;

commit;
