# 새록 공지 운영

- 사용자 웹의 공지 목록은 게시 중인 최신 공지 세 개를 보여 줍니다.
- 관리자 화면은 같은 사이트의 `/admin`에서 열립니다.
- 로컬 개발에서는 `.env.example`을 `.env.local`로 복사해 Supabase URL과 publishable 키를 설정합니다. Vercel 빌드에도 동일한 이름의 두 공개 환경변수를 설정합니다.
- 새 Supabase 프로젝트에 연결할 때는 SQL Editor에서 `migrations/20261124000100_announcements.sql`을 실행합니다.

## 첫 관리자 등록

Supabase 대시보드의 **Authentication → Users**에서 해당 관리자의 이메일 계정을 생성합니다. 사용자의 UUID를 복사한 뒤 아래 SQL의 예시 값을 바꿔 실행합니다.

```sql
insert into public.admin_members (user_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict do nothing;
```

등록한 계정으로 `/admin`에 로그인하여 글을 초안으로 저장할 수 있습니다. 게시 여부를 바꾸고 저장하면 사용자 홈의 공개 목록에 반영됩니다.

## 관리자 추가·해제

`migrations/20261127000100_admin_members_manage.sql`을 SQL Editor에서 한 번 실행하면, `/admin`의 **관리자 목록**에서 이메일로 관리자를 추가하고 해제할 수 있어요.

- 추가할 사람은 먼저 새록에 가입해 있어야 해요.
- 내 계정은 해제할 수 없어서 관리자가 0명이 되지 않아요.
