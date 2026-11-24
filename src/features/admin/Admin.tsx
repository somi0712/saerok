import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { P } from '@/app/paths';
import { database, listAnnouncements, saveAnnouncement, type Announcement } from '@/data/announcements';
import './admin.css';

type Client = NonNullable<typeof database>;

interface Draft {
  id?: string;
  title: string;
  body: string;
  published: boolean;
}

const emptyDraft: Draft = { title: '', body: '', published: false };
const date = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

export function Admin() {
  return (
    <div className="saerok-admin">
      <header className="admin-header">
        <strong><img src="/icon.svg" alt="" width="32" height="32" />새록 관리자</strong>
        <Link to={P.home}>사용자 사이트</Link>
      </header>
      <main id="main-content">
        {database ? <AdminSession client={database} /> : (
          <section className="admin-login">
            <h1>데이터베이스 연결이 필요해요</h1>
            <p>배포 환경의 Supabase 설정을 확인해 주세요.</p>
          </section>
        )}
      </main>
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
  if (!session) return <AdminLogin client={client} />;
  if (access?.userId !== userId || !access) return <p className="admin-message" role="status">관리자 권한을 확인하는 중이에요.</p>;
  if (access.state === 'allowed') return <AdminNotices key={userId} client={client} />;
  return (
    <section className="admin-login">
      <h1>{access.state === 'error' ? '권한을 확인하지 못했어요' : '관리자 계정이 필요해요'}</h1>
      <p>{access.state === 'error' ? '연결을 확인한 뒤 다시 로그인해 주세요.' : '관리자 권한이 등록된 계정으로 로그인해 주세요.'}</p>
      <SignOut client={client} />
    </section>
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
      <p>관리자 계정으로 로그인하면 새록의 공지를 관리할 수 있어요.</p>
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

function AdminNotices({ client }: { client: Client }) {
  const [notices, setNotices] = useState<Announcement[]>();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; text: string }>();
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    listAnnouncements(client, false).then((rows) => {
      if (active) setNotices(rows);
    }).catch(() => {
      if (active) setLoadFailed(true);
    });
    return () => { active = false; };
  }, [client, refresh]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!notices || saving) return;
    if (!draft.title.trim() || !draft.body.trim()) {
      setFeedback({ error: true, text: '제목과 내용을 입력해 주세요.' });
      return;
    }
    setSaving(true);
    setFeedback(undefined);
    try {
      const { id, ...values } = draft;
      const saved = await saveAnnouncement(client, values, id);
      setNotices((rows) => id ? rows?.map((row) => row.id === id ? saved : row) : [saved, ...rows ?? []]);
      setDraft(emptyDraft);
      setFeedback({ error: false, text: saved.published ? '공지사항을 게시했어요.' : '초안을 저장했어요.' });
    } catch {
      setFeedback({ error: true, text: '저장하지 못했어요. 연결과 권한을 확인한 뒤 다시 시도해 주세요.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-heading"><h1>공지사항 관리</h1><SignOut client={client} /></div>
      <div className="admin-grid">
        <section className="admin-panel">
          <h2>공지 목록</h2>
          {loadFailed && <div role="alert">
            <p className="admin-error">공지를 불러오지 못했어요.</p>
            <button type="button" onClick={() => { setLoadFailed(false); setRefresh((n) => n + 1); }}>다시 불러오기</button>
          </div>}
          {!loadFailed && !notices && <p role="status">공지 목록을 불러오는 중이에요.</p>}
          {notices?.length === 0 && <p>아직 등록된 공지가 없어요.</p>}
          {notices && notices.length > 0 && (
            <ul className="admin-list">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <span><strong>{notice.title}</strong><small>{notice.published ? '게시 중' : '초안'} · {date.format(new Date(notice.created_at))}</small></span>
                  <button type="button" aria-label={`${notice.title} 수정`} disabled={saving}
                    onClick={() => { setDraft(notice); setFeedback(undefined); }}>수정</button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <form className="admin-panel admin-form" onSubmit={save}>
          <h2>{draft.id ? '공지 수정' : '새 공지'}</h2>
          <label>제목<input required maxLength={100} value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={saving} /></label>
          <label>내용<textarea required maxLength={2000} rows={6} value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })} disabled={saving} /></label>
          <label className="admin-check"><input type="checkbox" checked={draft.published} disabled={saving}
            onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> 사용자 사이트에 게시</label>
          <div className="admin-form-actions">
            <button type="submit" className="admin-primary" disabled={!notices || saving}>{saving ? '저장 중' : '저장'}</button>
            {draft.id && <button type="button" disabled={saving} onClick={() => setDraft(emptyDraft)}>새 공지 작성</button>}
          </div>
          {feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'admin-error' : 'admin-muted'}>{feedback.text}</p>}
        </form>
      </div>
    </div>
  );
}
