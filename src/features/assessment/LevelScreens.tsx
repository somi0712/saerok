import { useNavigate } from 'react-router-dom';
import { P } from '@/app/paths';
import { useAccount } from '@/store/account';
import { clearGuestPreview, getGuestAssessment } from '@/store/guestTrial';
import { loginLink } from '@/features/account/routes';
import { saveAssessment } from './CheckScreen';
import { Button, Card, Screen, toast } from '@/design/ui';
import { app, useApp, type Assessment } from '@/store/state';
import { LEVELS, MODULES, MODULE_IDS, type LevelPlan } from './data';
import './assessment.css';

const weakOf = (a: Assessment) => MODULE_IDS.filter((m) => a.modules[m].total && a.modules[m].correct / a.modules[m].total < 0.6);

function Ladder({ level }: { level: number }) {
  return (
    <ol className="as-ladder" aria-label={`10단계 중 ${level}단계`}>
      {LEVELS.map((_, i) => (
        <li key={i} className={i + 1 === level ? 'on' : i + 1 < level ? 'past' : ''} aria-current={i + 1 === level ? 'step' : undefined}>{i + 1}</li>
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
  const weak = weakOf(last);
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
      {weak.length > 0 && (
        <section className="stack">
          <h3>이 영역을 조금 더 연습해요</h3>
          <div className="row">{weak.map((m) => <span key={m} className="chip">{MODULES[m]}</span>)}</div>
        </section>
      )}
      <Plan plan={plan} />
      {plan.family && (
        <Card tone="mint">
          <h3>가족에게 알릴지 본인이 정해요</h3>
          <p className="small">원하시면 연습 소식을 가족에게 전할 수 있어요. 가족이 제안해도, 바꾸는 건 언제나 본인이 정해요.</p>
          <Button variant="secondary" to={P.family}>가족 공유 설정 보기</Button>
        </Card>
      )}
      <p className="small">점수는 연습 방법을 고르는 데만 써요. 건강 상태를 판단하지 않아요.</p>
    </Screen>
  );
}

/** 단계별 맞춤 훈련 — 노션 2주차 「기억력 훈련 메커니즘 설계」 */
export function TrainingScreen() {
  const training = useApp((s) => s.training);
  const last = useApp((s) => s.assessments.at(-1));
  if (!last) return <NoAssessment title="맞춤 훈련" />;
  const level = training?.accepted ? training.level : last.level;
  const plan = LEVELS[level - 1];
  return (
    <Screen title="맞춤 훈련" back={P.home} footer={<>
      <Button to={P.order}>오늘의 훈련 시작하기</Button>
      <Button variant="secondary" to={P.plan}>주간 계획에 담기</Button>
    </>}>
      <p className="eyebrow">{level}단계 · {plan.freq}</p>
      <h2 className="title">오늘은 이렇게 연습해요</h2>
      <div className="stack">
        {plan.train.map((t, i) => (
          <Card key={t}>
            <span className="small">훈련 {i + 1}</span>
            <strong>{t}</strong>
          </Card>
        ))}
      </div>
      <Card tone="mint">
        <span className="eyebrow">생활 속에서 함께해요</span>
        <p>{plan.habit}</p>
      </Card>
      {!training?.accepted && <Button variant="ghost" to={P.checkResult}>단계 결과 다시 보기</Button>}
      <Button variant="ghost" to={P.check}>기억력 테스트 다시 하기</Button>
    </Screen>
  );
}
