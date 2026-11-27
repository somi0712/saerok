import { Link } from 'react-router-dom';
import { Button, Card, Icon, Screen } from '@/design/ui';
import { P } from '@/app/paths';
import { useApp, WEEKDAYS } from '@/store/state';
import { mondayOf, shortDate, strategyCounts, TASK_LABEL, weekDaysDone, weeklyCounts } from './logic';
import './records.css';

const range = (now: Date) => {
  const mon = mondayOf(now);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const f = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return `${f(mon)} – ${f(sun)}`;
};

/** 시안 10 나의 기록 + 30 4주 흐름. 또래 비교 없이 개인 흐름만 (기획안 10-2) */
export default function Records() {
  const sessions = useApp((s) => s.sessions);
  const assessments = useApp((s) => s.assessments);
  const plan = useApp((s) => s.plan);
  const now = new Date();

  if (!sessions.length && !assessments.length) {
    return (
      <Screen title="기록" tabs>
        <span className="rs-tag">기록 · 마이페이지</span>
        <div className="row"><Link className="chip" to={P.diary}>기억 일기장</Link><Link className="chip" to={P.missions}>미션 · 출석</Link><Link className="chip" to={P.analysis}>분석</Link></div>
        <div className="rs-head">
          <h2 className="title">첫 연습을 하면 여기에 차곡차곡 쌓여요.</h2>
          <p className="sub">연습한 날, 써 본 방법, 생활에서 해 본 일을 함께 돌아볼 수 있어요.</p>
        </div>
        <div className="web-actions">
          <Button to={P.practice}>첫 연습 시작하기</Button>
          <Button variant="secondary" to={P.diary}>기억 일기장 쓰기</Button>
        </div>
      </Screen>
    );
  }

  const days = weekDaysDone(sessions, now);
  const weeks = weeklyCounts(sessions, now);
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const total = weeks.reduce((a, w) => a + w.count, 0);
  const strategies = strategyCounts(sessions);
  const recent = [...sessions].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  const levels = [...assessments].sort((a, b) => a.at.localeCompare(b.at)).slice(-4);
  const goal = plan.goals[0];

  return (
    <Screen title="기록" tabs>
      <span className="rs-tag">기록 · 마이페이지</span>
        <div className="row"><Link className="chip" to={P.diary}>기억 일기장</Link><Link className="chip" to={P.missions}>미션 · 출석</Link><Link className="chip" to={P.analysis}>분석</Link></div>
      <div className="rs-head">
        <h2 className="title">이번 주의 작은 실천</h2>
        <p className="sub">이번 주 · {range(now)}</p>
      </div>

      <div className="web-columns">
        <Card tone="lavender">
          <p className="rs-h">이번 주 연습한 날</p>
          <p className="rs-big">{days.filter(Boolean).length}일</p>
          <ul className="rs-days">
            {WEEKDAYS.map((d, i) => (
              <li key={d}>
                <span className={`rs-dot${days[i] ? ' on' : ''}`} aria-hidden="true">{days[i] && <Icon name="check" size={20} />}</span>
                <span>
                  {d}
                  <span className="rs-sr">{days[i] ? ' 연습함' : ' 쉼'}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {goal && (
          <section className="card card-peach">
            <span className="rs-tag rs-tag-white">생활에서 써 보셨나요?</span>
            <p className="rs-h">{goal}</p>
            <p className="sub">다음 연습에서 함께 돌아봐요.</p>
          </section>
        )}

        <Card>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <p className="rs-h">주별 연습 횟수</p>
            <p className="rs-total">총 {total}회</p>
          </div>
          <ul className="rs-bars" aria-label="최근 4주 연습 횟수">
            {weeks.map((w, i) => (
              <li key={w.label} className={i === weeks.length - 1 ? 'now' : undefined} aria-label={`${w.label} ${w.count}회`}>
                <b>{w.count}회</b>
                <span className="rs-bar" style={{ height: `${8 + (w.count / max) * 112}px` }} />
                <span>{w.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        {strategies.length > 0 && (
          <section className="card card-peach">
            <p className="rs-h">자주 써 본 방법</p>
            <div className="rs-chips">
              {strategies.map(([name, n]) => (
                <span key={name} className="chip">{name} {n}회</span>
              ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <Card>
            <p className="rs-h">최근 연습</p>
            <ul className="rs-list">
              {recent.map((s) => (
                <li key={s.id}>
                  <span className="when">{shortDate(s.at)}</span>
                  <span className="what">{TASK_LABEL[s.task]}</span>
                  <span className="res">{s.total}개 중 {s.correct}개</span>
                </li>
              ))}
            </ul>
            <p className="small">연습 기록일 뿐, 기억 상태를 진단하지 않아요.</p>
          </Card>
        )}

        {levels.length > 0 && (
          <Card>
            <p className="rs-h">정밀 테스트 단계 흐름</p>
            <ul className="rs-list">
              {levels.map((a) => (
                <li key={a.id}>
                  <span className="when">{shortDate(a.at)}</span>
                  <span className="what">{a.level}단계</span>
                  <span className="res">{a.score}점</span>
                </li>
              ))}
            </ul>
            <p className="small">연습 방법을 고르는 데만 쓰는 단계예요.</p>
          </Card>
        )}
      </div>

      <Link to={P.diary} className="card rs-link">
        <span className="ico" aria-hidden="true"><Icon name="book" /></span>
        <span><strong>기억 일기장</strong><span>오늘을 글, 사진, 목소리로 남겨요</span></span>
        <span className="go" aria-hidden="true"><Icon name="next" /></span>
      </Link>

      <div className="web-actions">
        <Button variant="secondary" to={P.plan}>이번 주 계획 바꾸기</Button>
        <Button to={P.home}>홈으로 돌아가기</Button>
      </div>
    </Screen>
  );
}
