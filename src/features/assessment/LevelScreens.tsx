import { useNavigate } from 'react-router-dom';
import { P } from '@/app/paths';
import { useAccount } from '@/store/account';
import { clearGuestPreview, getGuestAssessment } from '@/store/guestTrial';
import { loginLink } from '@/features/account/routes';
import { saveAssessment } from './CheckScreen';
import { Button, Card, Screen, toast } from '@/design/ui';
import { app, useApp, type Assessment } from '@/store/state';
import { LEVELS, MODULES, MODULE_IDS, type LevelPlan } from './data';
import { courseOf, weakAreas } from './scoring';
import { Radar } from './Radar';
import './assessment.css';

/** 영역 점수 S_i. 예전 기록(점수 없음)은 정답률로 대신한다. */
export const areasOf = (a: Assessment) => Object.fromEntries(MODULE_IDS.map((m) => {
  const r = a.modules[m];
  return [m, r?.score ?? (r?.total ? Math.round((r.correct / r.total) * 100) : 0)];
})) as Record<(typeof MODULE_IDS)[number], number>;

export const weakOf = (a: Assessment) => weakAreas(areasOf(a));

function AreaBars({ a }: { a: Assessment }) {
  const areas = areasOf(a);
  const weak = weakOf(a);
  return (
    <Card>
      <span className="eyebrow">영역별 결과</span>
      <div className="as-radar"><Radar scores={areas} /></div>
      <ul className="as-bars">
        {MODULE_IDS.map((m) => (
          <li key={m} className={weak.includes(m) ? 'weak' : undefined}>
            <span>{MODULES[m]}{weak.includes(m) && <small> · 더 연습해요</small>}</span>
            <span className="as-bar" aria-hidden="true"><i style={{ width: `${areas[m]}%` }} /></span>
            <b>{areas[m]}점</b>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CourseCard({ level }: { level: number }) {
  const c = courseOf(level);
  return (
    <Card tone="mint">
      <span className="eyebrow">추천 코스 · {level}단계</span>
      <p><b>한 번에 {c.questions}문항</b> · {c.minutes} · {c.freq}</p>
      <p className="small">난이도 {c.difficulty}. 더 연습할 두 영역 문제를 먼저, 나머지 영역도 조금씩 섞어 드려요.</p>
    </Card>
  );
}

function Ladder({ level }: { level: number }) {
  return (
    <ol className="as-ladder" aria-label={`10단계 중 ${level}단계`}>
      {LEVELS.map((_, i) => (
        <li key={i} className={i + 1 === level ? 'on' : undefined} aria-current={i + 1 === level ? 'step' : undefined}>{i + 1}</li>
      ))}
    </ol>
  );
}

function Plan({ plan }: { plan: LevelPlan }) {
  return (
    <Card>
      <span className="eyebrow">이번 단계의 훈련</span>
      <ul className="as-list">{plan.train.map((t) => <li key={t}>{t}</li>)}</ul>
      <p><b>얼마나 자주</b> · {plan.freq}</p>
      <p><b>생활 속에서</b> · {plan.habit}</p>
    </Card>
  );
}

function NoAssessment({ title }: { title: string }) {
  return (
    <Screen title={title} back={P.home} footer={<Button to={P.check}>기억력 테스트 시작하기</Button>}>
      <h2 className="title">먼저 오늘의 기억력을 살펴볼까요?</h2>
      <p className="sub">질문 16개에 답하면 나에게 맞는 훈련 단계를 알려 드려요. 10분쯤 걸려요.</p>
    </Screen>
  );
}

/** 나의 기억 단계 — 노션 2주차 「기억력 수준 단계별 구분」 */
export function ResultScreen() {
  const nav = useNavigate();
  const { userId } = useAccount();
  const saved = useApp((s) => s.assessments.at(-1));
  const preview = getGuestAssessment();
  const last = preview?.assessment ?? (userId ? saved : undefined);
  if (!last) return <NoAssessment title="나의 기억 단계" />;
  const plan = LEVELS[last.level - 1];
  const accept = () => {
    if (!userId) return;
    if (preview) {
      clearGuestPreview();
      saveAssessment(preview.assessment, preview.session);
      toast('내 기록에 저장했어요.');
      return;
    }
    app.set((s) => ({ ...s, training: { level: last.level, accepted: true, at: new Date().toISOString() } }));
    toast('이번 단계 훈련으로 정했어요.');
    nav(P.training);
  };
  return (
    <Screen title="나의 기억 단계" back={P.home} footer={<>
      {userId
        ? <Button onClick={accept}>{preview ? '이 결과 저장하기' : '이 훈련으로 할게요'}</Button>
        : <Button to={loginLink(P.checkResult)}>로그인하고 결과 저장하기</Button>}
      <Button variant="secondary" to={P.home}>다음에 정할게요</Button>
    </>}>
      <span className="demo-badge">데모 · 진단 결과가 아니에요</span>
      <Card tone="lavender">
        <div className="as-level"><b>{last.level}</b><span>단계 <small>/ 10 · {last.score}점</small></span></div>
        <Ladder level={last.level} />
        <p>{plan.desc}</p>
      </Card>
      <AreaBars a={last} />
      <CourseCard level={last.level} />
      <Plan plan={plan} />
      {plan.family && (
        <Card tone="mint">
          <h3>보호자 연락처를 적어 둘 수 있어요</h3>
          <p className="small">번호만 적어 두면 필요할 때 눌러서 바로 전화할 수 있어요. 새록이 대신 연락하거나 결과를 보내지 않아요.</p>
          <Button variant="ghost" to={P.family}>보호자 연락처 적기</Button>
        </Card>
      )}
      <p className="small">점수는 연습 방법을 고르는 데만 써요. 건강 상태를 판단하지 않아요.</p>
    </Screen>
  );
}
