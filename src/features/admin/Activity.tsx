import { auditLog } from '@/data/admins';
import { actionLabel, formatDateTime } from './format';
import { LoadState, useLoad, type PageProps } from './shared';

export function Activity({ client }: PageProps) {
  const { data, error, reload } = useLoad(() => auditLog(client, 100), '활동 기록을 불러오지 못했어요.');
  return (
    <div className="admin-content">
      <div className="admin-heading"><h1>활동 기록</h1>
        <button type="button" onClick={reload}>새로고침</button></div>
      <p className="admin-muted">공지 작성·수정, 관리자 추가·해제, 계정 확인·정지가 자동으로 남아요. 최근 100건을 보여 줘요.</p>
      <LoadState error={error} loading={!data} onRetry={reload} />
      {data?.length === 0 && <p className="admin-muted">아직 남은 기록이 없어요.</p>}
      {data && data.length > 0 && (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>시각</th><th>작업자</th><th>작업</th><th>대상</th><th>사유</th></tr></thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.at)}</td>
                  <td>{row.actor_email ?? 'DB 직접 실행'}</td>
                  <td>{actionLabel(row.action)}</td>
                  <td>{row.target ?? '-'}</td>
                  <td>{typeof row.detail.reason === 'string' ? row.detail.reason : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
