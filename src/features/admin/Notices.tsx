import { useState, type FormEvent } from 'react';
import { listAnnouncements, saveAnnouncement, type Announcement } from '@/data/announcements';
import { errorText, formatDate, formatDateTime, fromLocalInput, noticeStatus, NOTICE_STATUS_LABEL, toLocalInput } from './format';
import { LoadState, Message, useLoad, type Notice, type PageProps } from './shared';

interface Draft { id?: string; title: string; body: string; published: boolean; publishAt: string }
const emptyDraft: Draft = { title: '', body: '', published: false, publishAt: '' };

export function Notices({ client }: PageProps) {
  const { data, error, reload } = useLoad(() => listAnnouncements(client, false), '공지를 불러오지 못했어요.');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>();

  async function persist(values: Draft, done: (saved: Announcement) => string) {
    setSaving(true);
    setNotice(undefined);
    try {
      const saved = await saveAnnouncement(client, {
        title: values.title, body: values.body, published: values.published,
        publish_at: values.published ? fromLocalInput(values.publishAt) : null,
      }, values.id);
      setDraft(emptyDraft);
      setNotice({ error: false, text: done(saved) });
      reload();
    } catch (e) {
      setNotice({ error: true, text: errorText(e, '저장하지 못했어요. 연결과 권한을 확인한 뒤 다시 시도해 주세요.') });
    } finally {
      setSaving(false);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!draft.title.trim() || !draft.body.trim()) {
      setNotice({ error: true, text: '제목과 내용을 입력해 주세요.' });
      return;
    }
    void persist(draft, (saved) => ({
      draft: '초안을 저장했어요.',
      scheduled: `${formatDateTime(saved.publish_at)}에 게시되도록 예약했어요.`,
      live: '공지사항을 게시했어요.',
    })[noticeStatus(saved)]);
  }

  const takeDown = (n: Announcement) => {
    if (!window.confirm(`'${n.title}' 공지를 내릴까요? 내용은 초안으로 남아요.`)) return;
    void persist({ id: n.id, title: n.title, body: n.body, published: false, publishAt: '' }, () => '공지를 내렸어요. 초안으로 남아 있어요.');
  };

  return (
    <div className="admin-content">
      <div className="admin-heading"><h1>공지</h1></div>
      <div className="admin-grid">
        <section className="admin-panel">
          <h2>공지 목록</h2>
          <LoadState error={error} loading={!data} onRetry={reload} />
          {data?.length === 0 && <p>아직 등록된 공지가 없어요.</p>}
          {data && data.length > 0 && (
            <ul className="admin-list">
              {data.map((n) => {
                const status = noticeStatus(n);
                return (
                  <li key={n.id}>
                    <span>
                      <strong>{n.title}</strong>
                      <small>
                        <span className={`admin-chip admin-chip-${status}`}>{NOTICE_STATUS_LABEL[status]}</span>
                        {' '}{status === 'scheduled' ? `${formatDateTime(n.publish_at)} 게시 예정` : formatDate(n.created_at)}
                      </small>
                    </span>
                    <span className="admin-actions">
                      <button type="button" aria-label={`${n.title} 수정`} disabled={saving} onClick={() => {
                        setDraft({ id: n.id, title: n.title, body: n.body, published: n.published, publishAt: toLocalInput(n.publish_at) });
                        setNotice(undefined);
                      }}>수정</button>
                      {n.published && <button type="button" aria-label={`${n.title} 내리기`} disabled={saving} onClick={() => takeDown(n)}>내리기</button>}
                    </span>
                  </li>
                );
              })}
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
          {draft.published && (
            <label>게시 시각 (비우면 바로 게시)
              <input type="datetime-local" value={draft.publishAt} disabled={saving}
                onChange={(e) => setDraft({ ...draft, publishAt: e.target.value })} /></label>
          )}
          <div className="admin-form-actions">
            <button type="submit" className="admin-primary" disabled={!data || saving}>{saving ? '저장 중' : '저장'}</button>
            {draft.id && <button type="button" disabled={saving} onClick={() => setDraft(emptyDraft)}>새 공지 작성</button>}
          </div>
          <Message notice={notice} />
        </form>
      </div>
    </div>
  );
}
