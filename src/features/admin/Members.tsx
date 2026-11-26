import { useState, type FormEvent } from 'react';
import { addAdmin, listAdmins, removeAdmin, type AdminMember } from '@/data/admins';
import { errorText } from './format';
import { LoadState, Message, useLoad, type Notice, type PageProps } from './shared';

const NOT_SIGNED_UP = { user_not_found: '이 이메일로 가입한 계정이 없어요. 먼저 새록에 가입해 달라고 알려 주세요.' };

export function Members({ client, userId }: PageProps) {
  const { data, error, reload } = useLoad(() => listAdmins(client), '관리자 목록을 불러오지 못했어요.');
  const [email, setEmail] = useState('');
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<Notice>();

  async function run(task: () => Promise<void>, done: string, fail: string) {
    setWorking(true);
    setNotice(undefined);
    try {
      await task();
      setNotice({ error: false, text: done });
      reload();
      return true;
    } catch (e) {
      setNotice({ error: true, text: errorText(e, fail, NOT_SIGNED_UP) });
      return false;
    } finally {
      setWorking(false);
    }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || working) return;
    if (await run(() => addAdmin(client, email), `${email.trim()} 계정을 관리자로 추가했어요.`, '관리자를 추가하지 못했어요.')) setEmail('');
  }

  function remove(member: AdminMember) {
    if (!window.confirm(`${member.email} 계정의 관리자 권한을 해제할까요?`)) return;
    void run(() => removeAdmin(client, member.user_id), `${member.email} 계정의 관리자 권한을 해제했어요.`, '관리자를 해제하지 못했어요.');
  }

  return (
    <div className="admin-content">
      <div className="admin-heading"><h1>관리자</h1></div>
      <div className="admin-grid">
        <section className="admin-panel">
          <h2>관리자 목록</h2>
          <LoadState error={error} loading={!data} onRetry={reload} />
          {data && (
            <ul className="admin-list">
              {data.map((member) => (
                <li key={member.user_id}>
                  <span><strong>{member.email}</strong>{member.user_id === userId && <small>내 계정</small>}</span>
                  {member.user_id !== userId && (
                    <button type="button" disabled={working} aria-label={`${member.email} 관리자 해제`} onClick={() => remove(member)}>해제</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <form className="admin-panel admin-form" onSubmit={add}>
          <h2>관리자 추가</h2>
          <p className="admin-muted">새록에 가입한 계정의 이메일을 넣으면 관리자 화면을 쓸 수 있어요. 내 계정은 해제할 수 없어요.</p>
          <label>이메일<input type="email" required value={email} disabled={working} onChange={(e) => setEmail(e.target.value)} /></label>
          <div className="admin-form-actions">
            <button type="submit" className="admin-primary" disabled={working}>{working ? '처리 중' : '관리자로 추가'}</button>
          </div>
          <Message notice={notice} />
        </form>
      </div>
    </div>
  );
}
