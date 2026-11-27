import { P } from '@/app/paths';
import { Button, Card, Screen, toast } from '@/design/ui';
import { app, useApp } from '@/store/state';
import { Radar } from '@/features/assessment/Radar';
import { areasOf, weakOf } from '@/features/assessment/LevelScreens';
import { MODULES, MODULE_IDS } from '@/features/assessment/data';
import { courseOf } from '@/features/assessment/scoring';
import { MIN_SETS, nextWeekLevel, weekStats } from './logic';
import './analysis.css';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const TWO_WEEKS = 14 * 86_400_000;

/** 분석 — 5개 영역 점수 · 종합 점수 · 추천 레벨, 이번 주 달성률·정답률, 다음 주 추천 레벨 */
export default function Analysis() {
  const assessments = useApp((s) => s.assessments);
  const sessions = useApp((s) => s.sessions);
  const training = useApp((s) => s.training);
  const last = assessments.at(-1);
  const prev = assessments.at(-2);
  const level = training?.level ?? last?.level ?? 1;
  const week = weekStats(sessions);
  const goal = courseOf(level).perWeek;
  const next = nextWeekLevel(level, week.sets, week.accuracy);

  const accept = () => {
    app.set((s) => ({ ...s, training: { ...(s.training ?? { accepted: true }), level: next.level, at: new Date().toISOString() } }));
    toast(`다음 주는 ${next.level}단계로 연습해요.`);
  };

  return (
    <Screen title="분석" tabs>
      {last ? (
        <Card>
          <span className="eyebrow">기초 테스트 결과 · {new Date(last.at).toLocaleDateString('ko-KR')}</span>
          <div className="an-top">
            <Radar scores={areasOf(last)} />
            <dl className="an-nums">
              <div><dt>종합 점수</dt><dd>{last.score}<small>점</small></dd></div>
              <div><dt>추천 시작 레벨</dt><dd>{last.level}<small>단계</small></dd></div>
              {prev && <div><dt>지난 테스트와 비교</dt><dd className="an-diff">{last.score - prev.score >= 0 ? '+' : ''}{last.score - prev.score}<small>점</small></dd></div>}
            </dl>
          </div>
          <ul className="an-areas">
            {MODULE_IDS.map((m) => <li key={m}><span>{MODULES[m]}</span><b>{areasOf(last)[m]}점</b></li>)}
          </ul>
          <p className="small">더 연습할 영역: {weakOf(last).map((m) => MODULES[m]).join(' · ')}. 점수는 연습 단계를 고르는 데만 써요.</p>
          {Date.now() - Date.parse(last.at) > TWO_WEEKS && (
            <Button variant="secondary" to={P.check}>2주가 지났어요 · 중간 점검하기</Button>
          )}
        </Card>
      ) : (
        <Card tone="lavender">
          <h2 className="title">기초 테스트를 하면 5개 영역 점수를 보여 드려요.</h2>
          <Button to={P.check}>기초 테스트 시작하기</Button>
        </Card>
      )}

      <Card>
        <span className="eyebrow">이번 주 훈련</span>
        <div className="an-week">
          <div><b>{week.days} / {goal}일</b><span>달성률 {pct(Math.min(1, week.days / goal))}</span></div>
          <div><b>{week.sets}세트</b><span>정답률 {week.sets ? pct(week.accuracy) : '–'}</span></div>
        </div>
        <div className="an-bar" aria-hidden="true"><i style={{ width: pct(Math.min(1, week.days / goal)) }} /></div>
        <p className="small">지금 {level}단계 · 권장 {courseOf(level).freq}</p>
      </Card>

      <Card tone="mint">
        <span className="eyebrow">다음 주 추천 레벨</span>
        {week.sets < MIN_SETS ? (
          <p>이번 주 훈련을 {MIN_SETS}세트 이상 하면 다음 주 단계를 제안해 드려요. (지금 {week.sets}세트)</p>
        ) : (
          <>
            <p className="title">{next.level}단계</p>
            <p>{next.change > 0 ? '정답률이 높아요. 한 단계 올려 볼까요?' : next.change < 0 ? '한 단계 편하게 다지며 이어가요.' : '지금 단계가 잘 맞아요. 그대로 이어가요.'}</p>
            {next.change !== 0 && <Button onClick={accept}>{next.level}단계로 바꾸기</Button>}
          </>
        )}
        <p className="small">정답률 85% 이상이면 한 단계 위, 50% 아래면 한 단계 아래를 제안해요. 바꾸는 건 언제나 본인이 정해요.</p>
      </Card>

      <Button to={P.training}>훈련하기</Button>
    </Screen>
  );
}
