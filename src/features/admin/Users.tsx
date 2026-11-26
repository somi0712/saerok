import { useState, type FormEvent } from 'react';
import { adminUsers, confirmUser, setUserStatus, type AdminUser } from '@/data/admins';
import { errorText, formatDate, formatDateTime, userStatus, USER_STATUS_LABEL } from './format';
import { LoadState, Message, useLoad, type Notice, type PageProps } from './shared';

export function Users({ client, userId }: PageProps) {
  const { data, error, reload } = useLoad(() => adminUsers(client), '사용자 목록을 불러오지 못했어요.');
  const [query, setQuery] = useState('');
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<Notice>();
  const [statusFor, setStatusFor] = useState<AdminUser>();

  const shown = data?.filter((u) => u.email.toLowerCase().includes(query.trim().toLowerCase()));

  async function run(task: () => Promise<void>, done: string, fail: string) {
    setWorking(true);
    setNotice(undefined);
    try {
      await task();
      setNotice({ error: false, text: done });
      reload();
      return true;
    } catch (e) {
      setNotice({ error: true, text: errorText(e, fail) });
      return false;
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-heading"><h1>사용자</h1>
        <label className="admin-search">이메일 검색<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>
      <Message notice={notice} />
      {statusFor && (
        <StatusForm user={statusFor} working={working} onCancel={() => setStatusFor(undefined)}
          onSubmit={async (reason) => {
            const active = statusFor.suspended;
            const ok = await run(() => setUserStatus(client, statusFor.user_id, active, reason),
              `${statusFor.email} 계정을 ${active ? '다시 이용할 수 있게 했어요' : '이용 정지했어요'}.`, '상태를 바꾸지 못했어요.');
            if (ok) setStatusFor(undefined);
          }} />
      )}
      <LoadState error={error} loading={!data} onRetry={reload} />
      {shown && (
        <div className="admin-panel admin-table-wrap">
          <p className="admin-muted">{shown.length}명</p>
          <table className="admin-table">
            <thead><tr>
              <th>이메일</th><th>가입일</th><th>마지막 로그인</th><th>상태</th><th>관리자</th>
              <th className="num">연습 수</th><th>마지막 연습</th><th className="num">최근 단계</th><th><span className="sr-only">작업</span></th>
            </tr></thead>
            <tbody>
              {shown.map((u) => {
                const status = userStatus(u);
                const self = u.user_id === userId;
                return (
                  <tr key={u.user_id}>
                    <td>{u.email}{self && <small className="admin-muted"> (나)</small>}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td title={formatDateTime(u.last_sign_in_at)}>{formatDate(u.last_sign_in_at)}</td>
                    <td><span className={`admin-chip admin-chip-${status}`}>{USER_STATUS_LABEL[status]}</span></td>
                    <td>{u.is_admin ? '관리자' : '-'}</td>
                    <td className="num">{u.sessions}</td>
                    <td>{formatDate(u.last_practice_at)}</td>
                    <td className="num">{u.last_level ?? '-'}</td>
                    <td className="admin-actions">
                      {!u.confirmed && (
                        <button type="button" disabled={working} onClick={() => void run(() => confirmUser(client, u.user_id),
                          `${u.email} 계정을 확인 처리했어요.`, '확인 처리하지 못했어요.')}>확인 처리</button>
                      )}
                      {!self && (
                        <button type="button" disabled={working} onClick={() => { setStatusFor(u); setNotice(undefined); }}>
                          {u.suspended ? '정지 해제' : '이용 정지'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shown.length === 0 && <p className="admin-muted">{query ? '검색 결과가 없어요.' : '아직 가입한 사용자가 없어요.'}</p>}
        </div>
      )}
    </div>
  );
}

function StatusForm({ user, working, onSubmit, onCancel }: {
  user: AdminUser; working: boolean; onSubmit: (reason: string) => void; onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(reason); };
  const title = user.suspended ? '이용 정지 해제' : '이용 정지';
  return (
    <form className="admin-panel admin-form" onSubmit={submit}>
      <h2>{user.email} · {title}</h2>
      <label>사유 (필수, 활동 기록에 남아요)
        <input required minLength={2} maxLength={200} value={reason} disabled={working} onChange={(e) => setReason(e.target.value)} /></label>
      <div className="admin-form-actions">
        <button type="submit" className="admin-primary" disabled={working}>{working ? '처리 중' : title}</button>
        <button type="button" disabled={working} onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}
