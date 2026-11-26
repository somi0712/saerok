import { adminOverview, type Overview as OverviewData } from '@/data/admins';
import { LoadState, useLoad, type PageProps } from './shared';

const NO_RECORDS = '아직 서버에 보관된 기록이 없어요.';
const num = new Intl.NumberFormat('ko-KR');

export function Overview({ client }: PageProps) {
  const { data, error, reload } = useLoad(() => adminOverview(client), '개요를 불러오지 못했어요.');
  return (
    <div className="admin-content">
      <div className="admin-heading"><h1>개요</h1>
        <button type="button" onClick={reload}>새로고침</button></div>
      <LoadState error={error} loading={!data} onRetry={reload} />
      {data && <OverviewBody data={data} />}
    </div>
  );
}

function OverviewBody({ data }: { data: OverviewData }) {
  const stats: [string, number, string?][] = [
    ['가입 사용자', data.users, `확인된 계정 ${num.format(data.confirmed_users)}`],
    ['기록 보관 사용자', data.record_users, '서버 보관에 동의한 계정'],
    ['최근 7일 연습', data.sessions_7d, `전체 ${num.format(data.sessions_total)}회`],
    ['기억력 테스트', data.assessments_total],
    ['게시 중 공지', data.notices_live, `예약 ${data.notices_scheduled} · 초안 ${data.notices_draft}`],
    ['관리자', data.admins],
  ];
  const levels = Array.from({ length: 10 }, (_, i) => data.levels[String(i + 1)] ?? 0);
  return (
    <>
      <ul className="admin-stats">
        {stats.map(([label, value, note]) => (
          <li key={label} className="admin-panel">
            <span className="admin-muted">{label}</span>
            <strong>{num.format(value)}</strong>
            {note && <small className="admin-muted">{note}</small>}
          </li>
        ))}
      </ul>
      <div className="admin-grid">
        <section className="admin-panel">
          <h2>최근 14일 연습</h2>
          <Bars rows={(data.daily ?? []).map((d) => ({ label: d.day.slice(5).replace('-', '.'), n: d.n }))} empty={!data.sessions_total} />
        </section>
        <section className="admin-panel">
          <h2>최근 테스트 단계 분포</h2>
          <Bars rows={levels.map((n, i) => ({ label: `${i + 1}`, n }))} empty={!data.assessments_total} unit="명" />
        </section>
      </div>
    </>
  );
}

/** 막대 하나 = 한 값. 높이는 최댓값 기준 비율 */
function Bars({ rows, empty, unit = '회' }: { rows: { label: string; n: number }[]; empty: boolean; unit?: string }) {
  if (empty) return <p className="admin-muted">{NO_RECORDS}</p>;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <ol className="admin-bars" aria-label="막대그래프">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${r.n}${unit}`}>
          <span className="admin-bar-value">{r.n || ''}</span>
          <span className="admin-bar" style={{ height: `${(r.n / max) * 100}%` }} />
          <span className="admin-bar-label">{r.label}</span>
        </li>
      ))}
    </ol>
  );
}
