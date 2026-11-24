import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { database } from '@/data/announcements';
import { Button, Card, Screen } from '@/design/ui';
import { useAccount } from '@/store/account';
import './account.css';

export const loginLink = (next: string) => P.login + '?next=' + encodeURIComponent(next);

function Login() {
  const { userId } = useAccount();
  const [query] = useSearchParams();
  const target = query.get('next');
  const next = target?.startsWith('/') && !/^\/\/|[\\\r\n]/.test(target) && target !== P.login ? target : P.home;
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string }>();

  if (userId) return <Navigate to={next} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!database || busy) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email')).trim();
    const password = String(values.get('password'));
    setBusy(true);
    setMessage(undefined);
    try {
      const response = signup
        ? await database.auth.signUp({ email, password, options: {
          emailRedirectTo: new URL(loginLink(next), window.location.origin).href,
        } })
        : await database.auth.signInWithPassword({ email, password });
      if (response.error) {
        setMessage({ error: true, text: signup ? '가입을 완료하지 못했어요. 이메일과 비밀번호를 확인하거나 잠시 후 다시 시도해 주세요.'
          : '로그인하지 못했어요. 이메일과 비밀번호를 확인해 주세요.' });
      } else if (signup && !response.data.session) {
        setMessage({ error: false, text: '가입을 마치려면 받은 이메일의 확인 링크를 열어 주세요.' });
      }
    } catch {
      setMessage({ error: true, text: '연결에 실패했어요. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={signup ? '새록 회원가입' : '새록 로그인'} back={P.home}>
      <div className="web-columns account-layout">
        <div className="stack">
          <h2 className="title">{signup ? '새록 계정을 만들어요' : '로그인하고 내 기록을 이어가요'}</h2>
          <p className="sub">로그인하면 이 브라우저에서 계정별로 연습과 일기를 저장하고 확인할 수 있어요.</p>
        </div>
        <Card>
          {database ? <form className="stack account-form" onSubmit={submit}>
            <label>이메일<input name="email" type="email" autoComplete="username" required /></label>
            <label>비밀번호<input name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'}
              minLength={signup ? 8 : undefined} required /></label>
            {signup && <p className="small">비밀번호는 8자 이상 입력해 주세요.</p>}
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? '처리 중' : signup ? '회원가입' : '로그인'}</button>
            <Button variant="ghost" disabled={busy} onClick={() => { setSignup(!signup); setMessage(undefined); }}>
              {signup ? '계정이 있어요 · 로그인' : '계정 만들기'}
            </Button>
          </form> : <p role="status">이 배포 환경에는 로그인 연결이 설정되어 있지 않아요.</p>}
          {message && <p role={message.error ? 'alert' : 'status'}>{message.text}</p>}
        </Card>
      </div>
    </Screen>
  );
}

export const routes: RouteObject[] = [{ path: P.login, element: <Login /> }];
