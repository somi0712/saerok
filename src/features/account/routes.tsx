import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { database } from '@/data/announcements';
import { Button, Card, Screen } from '@/design/ui';
import { useAccount } from '@/store/account';
import { isPhone, onlyDigits } from '@/features/records-settings/logic';
import './account.css';

// Supabase 오류 코드별 안내. 그 밖의 코드는 기본 문구로 보여 준다.
const AUTH_ERRORS: Record<string, string> = {
  email_not_confirmed: '아직 이메일 확인이 끝나지 않았어요. 가입할 때 받은 메일의 확인 링크를 먼저 열어 주세요.',
  user_already_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
  over_email_send_rate_limit: '확인 메일을 너무 자주 보냈어요. 잠시 뒤 다시 시도해 주세요.',
  email_address_not_authorized: '지금은 이 이메일로 확인 메일을 보낼 수 없어요. 운영자에게 알려 주세요.',
  weak_password: '비밀번호가 너무 쉬워요. 8자 이상으로 더 길게 만들어 주세요.',
  signup_disabled: '지금은 새 가입을 받지 않고 있어요.',
};

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
    // 회원가입: 본인 이름 · 본인 전화번호 · 보호자 전화번호(선택)
    const name = String(values.get('name') ?? '').trim().slice(0, 20);
    const phone = String(values.get('phone') ?? '');
    const guardian = String(values.get('guardian') ?? '');
    if (signup && (!name || !isPhone(phone) || (guardian.trim() && !isPhone(guardian)))) {
      setMessage({ error: true, text: !name ? '이름을 적어 주세요.' : '전화번호는 숫자 9–11자리로 적어 주세요. 예: 010-1234-5678' });
      return;
    }
    setBusy(true);
    setMessage(undefined);
    try {
      const response = signup
        ? await database.auth.signUp({ email, password, options: {
          emailRedirectTo: new URL(loginLink(next), window.location.origin).href,
          data: { name, phone: onlyDigits(phone), guardian_phone: guardian.trim() ? onlyDigits(guardian) : null },
        } })
        : await database.auth.signInWithPassword({ email, password });
      if (response.error) {
        setMessage({ error: true, text: AUTH_ERRORS[response.error.code ?? '']
          ?? (signup ? '가입을 완료하지 못했어요. 이메일과 비밀번호를 확인하거나 잠시 후 다시 시도해 주세요.'
            : '로그인하지 못했어요. 이메일과 비밀번호를 확인해 주세요.') });
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
            {signup && <>
              <label>이름<input name="name" type="text" autoComplete="name" maxLength={20} required /></label>
              <label>내 전화번호<input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010-1234-5678" required /></label>
              <label>보호자 전화번호 (선택)<input name="guardian" type="tel" inputMode="tel" placeholder="010-1234-5678" /></label>
              <p className="small">로그인하면 홈에서 이 이름으로 불러 드려요. 이름과 전화번호는 새록 계정에 저장되고, 새록이 보호자에게 대신 연락하지는 않아요.</p>
            </>}
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
