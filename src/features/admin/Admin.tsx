import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { P } from '@/app/paths';
import { database } from '@/data/announcements';
import { Activity } from './Activity';
import { Members } from './Members';
import { Notices } from './Notices';
import { Overview } from './Overview';
import { Users } from './Users';
import type { Client, PageProps } from './shared';
import './admin.css';

// 관리자 메뉴. 주소는 /admin 아래 상대 경로
const MENU: { path: string; label: string; Page: (props: PageProps) => JSX.Element }[] = [
  { path: '', label: '개요', Page: Overview },
  { path: 'users', label: '사용자', Page: Users },
  { path: 'notices', label: '공지', Page: Notices },
  { path: 'admins', label: '관리자', Page: Members },
  { path: 'activity', label: '활동 기록', Page: Activity },
];

export function Admin() {
  return (
    <div className="saerok-admin">
      <header className="admin-header">
        <strong><img src="/icon.svg" alt="" width="32" height="32" />새록 관리자</strong>
        <Link to={P.home}>사용자 사이트</Link>
      </header>
      {database ? <AdminSession client={database} /> : (
        <main id="main-content" className="admin-login">
          <h1>데이터베이스 연결이 필요해요</h1>
          <p>배포 환경의 Supabase 설정을 확인해 주세요.</p>
        </main>
      )}
    </div>
  );
}

function AdminSession({ client }: { client: Client }) {
  const [session, setSession] = useState<Session | null>();
  const [access, setAccess] = useState<{ userId: string; state: 'allowed' | 'denied' | 'error' }>();
  const userId = session?.user.id;
  useEffect(() => {
    const { data } = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function checkAccess() {
      const { data, error } = await client.from('admin_members').select('user_id').eq('user_id', userId).maybeSingle();
      if (active && userId) setAccess({ userId, state: error ? 'error' : data ? 'allowed' : 'denied' });
    }
    void checkAccess();
    return () => { active = false; };
  }, [client, userId]);

  if (session === undefined) return <p className="admin-message" role="status">로그인 상태를 확인하는 중이에요.</p>;
  if (!session) return <main id="main-content"><AdminLogin client={client} /></main>;
  if (access?.userId !== userId || !access) return <p className="admin-message" role="status">관리자 권한을 확인하는 중이에요.</p>;
  if (access.state === 'allowed') return <Console client={client} userId={access.userId} email={session.user.email ?? ''} />;
  return (
    <main id="main-content" className="admin-login">
      <h1>{access.state === 'error' ? '권한을 확인하지 못했어요' : '관리자 계정이 필요해요'}</h1>
      <p>{access.state === 'error' ? '연결을 확인한 뒤 다시 로그인해 주세요.' : '관리자 권한이 등록된 계정으로 로그인해 주세요.'}</p>
      <SignOut client={client} />
    </main>
  );
}

function Console({ client, userId, email }: PageProps & { email: string }) {
  return (
    <div className="admin-shell">
      <nav className="admin-nav" aria-label="관리 메뉴">
        <ul>
          {MENU.map(({ path, label }) => (
            <li key={label}><NavLink end to={path ? `${P.admin}/${path}` : P.admin}>{label}</NavLink></li>
          ))}
        </ul>
        <div className="admin-account">
          <small className="admin-muted">{email}</small>
          <SignOut client={client} />
        </div>
      </nav>
      <main id="main-content" className="admin-main">
        <Routes>
          {MENU.map(({ path, label, Page }) => (
            <Route key={label} index={!path} path={path || undefined} element={<Page client={client} userId={userId} />} />
          ))}
          <Route path="*" element={<Navigate to={P.admin} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminLogin({ client }: { client: Client }) {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setWorking(true);
    setMessage('');
    try {
      const { error } = await client.auth.signInWithPassword({
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
      });
      if (error) setMessage('로그인할 수 없어요. 이메일과 비밀번호를 확인해 주세요.');
    } catch {
      setMessage('로그인 연결에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <form className="admin-login admin-form" onSubmit={login}>
      <h1>관리자 로그인</h1>
      <p>관리자 계정으로 로그인하면 새록의 사용자·공지·관리자를 관리할 수 있어요.</p>
      <label>이메일<input type="email" name="email" autoComplete="username" required /></label>
      <label>비밀번호<input type="password" name="password" autoComplete="current-password" required /></label>
      <button className="admin-primary" type="submit" disabled={working}>{working ? '로그인 중' : '로그인'}</button>
      {message && <p role="alert" className="admin-error">{message}</p>}
    </form>
  );
}

function SignOut({ client }: { client: Client }) {
  const [failed, setFailed] = useState(false);
  async function signOut() {
    const { error } = await client.auth.signOut({ scope: 'local' });
    setFailed(Boolean(error));
  }

  return (
    <div>
      <button type="button" onClick={() => void signOut()}>로그아웃</button>
      {failed && <p role="alert" className="admin-error">로그아웃에 실패했어요. 다시 시도해 주세요.</p>}
    </div>
  );
}
