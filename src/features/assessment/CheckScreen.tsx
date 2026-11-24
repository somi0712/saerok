import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Icon, Screen, Steps, toast } from '@/design/ui';
import { app, uid, type Assessment, type ModuleId, type PracticeSession } from '@/store/state';
import { getAccount, useAccount } from '@/store/account';
import { clearGuestPreview, finishGuestTest, setGuestAssessment } from '@/store/guestTrial';
import { loginLink } from '@/features/account/routes';
import { MODULES, MODULE_IDS, RECALL_WORDS, questionsFor } from './data';
import { levelOf, scoreOf, type Answer } from './scoring';
import './assessment.css';

const HINT_DELAY = 10_000; // 노션: 10초간 무응답 시 힌트 제공

const shuffle = <T,>(list: T[]) => list.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

export function saveAssessment(assessment: Assessment, session: PracticeSession) {
  if (!getAccount().userId) return;
  app.set((s) => s.assessments.some(({ id }) => id === assessment.id) ? s : ({
    ...s,
    assessments: [...s.assessments, assessment],
    sessions: [...s.sessions, session],
  }));
}

function complete(answers: Answer[]) {
  const score = scoreOf(answers);
  const modules = Object.fromEntries(
    MODULE_IDS.map((m) => {
      const rs = answers.filter((a) => a.m === m);
      return [m, {
        correct: rs.filter((a) => a.correct).length,
        total: rs.length,
        ms: Math.round(rs.reduce((s, a) => s + a.seconds, 0) * 1000),
        hints: rs.filter((a) => a.hint).length,
      }];
    }),
  ) as Assessment['modules'];
  const at = new Date().toISOString();
  const assessment: Assessment = { id: uid(), at, score, level: levelOf(score), modules };
  const session: PracticeSession = {
    id: uid(), at, task: 'check',
    correct: answers.filter((a) => a.correct).length, total: answers.length,
    hints: answers.filter((a) => a.hint).length,
    minutes: Math.max(1, Math.round(answers.reduce((t, a) => t + a.seconds, 0) / 60)),
  };
  if (getAccount().userId) {
    clearGuestPreview();
    saveAssessment(assessment, session);
    return true;
  }
  if (!finishGuestTest(P.checkResult)) return false;
  setGuestAssessment(assessment, session);
  return true;
}

export function CheckScreen() {
  const nav = useNavigate();
  const { userId } = useAccount();
  const questions = useMemo(() => questionsFor().map((q) => ({ ...q, options: shuffle([q.a, ...q.o]) })), []);
  const [phase, setPhase] = useState<'intro' | 'memorize' | 'ask'>('intro');
  const [i, setI] = useState(0);
  const [hintReady, setHintReady] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const answers = useRef<Answer[]>([]);
  const started = useRef(0);
  const advance = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(advance.current), []);

  useEffect(() => {
    if (phase !== 'ask') return;
    started.current = performance.now();
    setHintReady(false);
    setHintShown(false);
    setPicked(null);
    const t = setTimeout(() => setHintReady(true), HINT_DELAY);
    return () => clearTimeout(t);
  }, [phase, i]);

  if (phase === 'intro') {
    return (
      <Screen title="정밀 기억력 테스트" back footer={<Button onClick={() => setPhase('memorize')}>시작할게요</Button>}>
        <span className="demo-badge">데모 · 진단 도구가 아니에요</span>
        <h2 className="title">오늘의 기억력을 함께 살펴봐요</h2>
        <Card>
          {!userId && <p className="small">이 브라우저에서 로그인 없이 테스트 1회를 완료할 수 있어요. 결과를 저장하려면 로그인해 주세요.</p>}
          <p>다섯 가지 영역에서 짧은 질문 {questions.length}개를 드릴게요. 10분쯤 걸려요.</p>
          <ul className="as-modules">
            {MODULE_IDS.map((m) => <li key={m}><b>{m}</b> {MODULES[m]}</li>)}
          </ul>
          <p className="small">정답보다 편안하게 푸는 게 더 중요해요. 10초가 지나면 힌트를 볼 수 있어요.</p>
        </Card>
      </Screen>
    );
  }

  if (phase === 'memorize') {
    return (
      <Screen title="먼저 기억해 주세요" back footer={<Button onClick={() => setPhase('ask')}>기억했어요</Button>}>
        <h2 className="title">나중에 여쭤볼게요</h2>
        <Card tone="lavender">
          <p>아래 세 가지를 천천히 읽고 기억해 주세요.</p>
          <div className="as-words">{RECALL_WORDS.map((w) => <span key={w.text}><Icon name={w.icon} size={32} />{w.text}</span>)}</div>
          <p className="small">테스트 마지막에 다시 여쭤볼게요.</p>
        </Card>
      </Screen>
    );
  }

  const q = questions[i];
  const choose = (value: string) => {
    if (picked || answers.current.length > i) return;
    setPicked(value);
    answers.current.push({ m: q.m as ModuleId, correct: value === q.a, seconds: (performance.now() - started.current) / 1000, hint: hintShown });
    const last = i + 1 >= questions.length;
    toast(last ? '마지막까지 함께해 주셔서 고마워요.' : '고마워요, 다음 질문으로 갈게요.');
    advance.current = setTimeout(() => {
      if (!last) return setI(i + 1);
      nav(complete(answers.current) ? P.checkResult : loginLink(P.check), { replace: true });
    }, 700);
  };

  return (
    <Screen title={`${q.m} · ${MODULES[q.m]}`} back={P.home}>
      <Steps now={i + 1} total={questions.length} />
      <h2 className="title">{q.q}</h2>
      {q.compass && (
        <div className="as-compass" role="img" aria-label="가운데 집, 위쪽 나무, 오른쪽 우체통, 아래쪽 자동차, 왼쪽 의자">
          <i /><span><Icon name="tree" size={32} /><small>북</small></span><i />
          <span><Icon name="chair" size={32} /><small>서</small></span>
          <span className="as-center"><Icon name="house" size={32} /></span>
          <span><Icon name="mailbox" size={32} /><small>동</small></span>
          <i /><span><Icon name="car" size={32} /><small>남</small></span><i />
        </div>
      )}
      {q.icon && <div className="as-visual" aria-hidden="true"><Icon name={q.icon} size={72} /></div>}
      {q.shapes && (
        <div className="as-visual as-shapes" role="img" aria-label="동그라미, 네모, 동그라미, 네모, 빈칸">
          <i className="circle" /><i className="square" /><i className="circle" /><i className="square" /><i className="blank">?</i>
        </div>
      )}
      <div className="stack as-options" role="radiogroup" aria-label="보기">
        {q.options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={picked === o} className="choice" onClick={() => choose(o)}>
            <strong>{o}</strong>
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {hintReady && !picked && (
          <Card tone="mint">
            <p>천천히 생각하셔도 괜찮아요.</p>
            {hintShown ? <p className="as-hint"><Icon name="bulb" size={20} /> {q.h}</p> : <Button variant="secondary" onClick={() => setHintShown(true)}>힌트 보기</Button>}
          </Card>
        )}
      </div>
    </Screen>
  );
}
