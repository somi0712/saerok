import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Icon, PetArt, Screen, type IconName } from '@/design/ui';
import { app, uid, useApp, type ModuleId } from '@/store/state';
import { MODULES } from '@/features/assessment/data';
import { courseOf } from '@/features/assessment/scoring';
import { shuffle, type Item } from './bank';
import { AREAS, TIME_LIMIT, allocate, areaLevels, draw, levelsUp, markSolved, weakFor, type Outcome } from './logic';
import './training.css';

// 노션 「유저 플로우와 정보 구조」(A안 공모전 시연): 훈련하기 → 영역·코스·레벨 선택 → 15초 응답 → 힌트 보기/건너뛰기 → 같은 레벨 재학습

export const AREA_INFO: Record<ModuleId, { icon: IconName; desc: string }> = {
  A: { icon: 'book', desc: '일반 지식 · 날짜·장소 파악' },
  B: { icon: 'chat', desc: '들은 이야기 · 사건 정보 회상' },
  C: { icon: 'grid', desc: '정보 잠깐 유지 · 역순·재배열' },
  D: { icon: 'house', desc: '위치·방향 · 공간 관계' },
  E: { icon: 'mic', desc: '범주·첫소리 · 단어 떠올리기' },
};
const isArea = (x: string | undefined): x is ModuleId => AREAS.includes(x as ModuleId);
const levelPath = (area: ModuleId | 'mix', level: number) => `${P.lesson}/${area}?level=${level}`;

function useLevels() {
  const training = useApp((s) => s.training);
  const last = useApp((s) => s.assessments.at(-1));
  return { levels: areaLevels(training?.areas, last), mix: training?.level ?? last?.level ?? 1, last };
}

/** 훈련하기: 오늘의 맞춤 훈련 + 영역별 훈련 */
export function TrainingHub() {
  const { levels, mix, last } = useLevels();
  const weak = weakFor(last);
  const c = courseOf(mix);
  return (
    <Screen title="훈련하기" back={P.home}>
      <Card tone="lavender">
        <span className="eyebrow">오늘의 맞춤 훈련 · {mix}단계</span>
        <h2 className="title">{c.questions}문항 · {c.minutes}</h2>
        <p className="sub">
          {last
            ? <>더 연습할 영역 <b>{weak.map((m) => MODULES[m]).join(' · ')}</b> 문제를 먼저, 나머지 영역도 조금씩 섞었어요.</>
            : '기초 테스트를 하면 나에게 맞는 시작 단계를 제안해 드려요.'}
        </p>
        <Button to={levelPath('mix', mix)}>맞춤 훈련 시작하기</Button>
      </Card>

      <section className="stack">
        <h3>영역별 훈련</h3>
        <div className="tr-areas">
          {AREAS.map((m, i) => (
            <Link key={m} to={`${P.trainingArea}/${m}`} className={`tr-area tone-${i}`}>
              <span className="tr-area-top"><Icon name={AREA_INFO[m].icon} size={28} /><small>Lv.{levels[m]}</small></span>
              <strong>{MODULES[m]}</strong>
              <span>{AREA_INFO[m].desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <Link to={P.diary} className="card pr-link tr-diary">
        <span><strong>내 일기로 훈련하기</strong><span>일기를 고르면 그날의 일로 일화기억 문제를 만들어요</span></span>
        <Icon name="next" />
      </Link>
      {!last && <Button variant="secondary" to={P.check}>기초 테스트로 시작 단계 정하기</Button>}
      <p className="small">문제가 보이고 15초가 지나면 힌트를 볼 수 있어요. 점수와 단계는 연습을 고르는 데만 써요.</p>
    </Screen>
  );
}

const PATH_X = [0, 34, 52, 34, 0, -34, -52, -34, 0, 34];

/** 영역 하나의 레벨 1–10 길 */
export function AreaPath() {
  const { area } = useParams();
  const { levels } = useLevels();
  if (!isArea(area)) return <Navigate to={P.training} replace />;
  const now = levels[area];
  return (
    <Screen title={MODULES[area]} back={P.training} footer={<Button to={levelPath(area, now)}>{now}단계 시작하기</Button>}>
      <p className="sub">{AREA_INFO[area].desc} · 모두 맞히면 다음 단계가 열려요.</p>
      <ol className="tr-path" aria-label="레벨 1–10">
        {PATH_X.map((x, i) => {
          const l = i + 1;
          const state = l < now ? 'done' : l === now ? 'now' : 'locked';
          return (
            <li key={l} className={`tr-node ${state}`} style={{ '--x': `${x}px` } as CSSProperties}>
              {state === 'locked'
                ? <span role="img" aria-label={`${l}단계, 아직 잠겨 있어요`}><Icon name="lock" size={22} /></span>
                : <Link to={levelPath(area, l)} aria-label={`${l}단계 ${state === 'done' ? '다시 하기' : '시작하기'}`}>{state === 'done' ? <Icon name="check" size={26} /> : l}</Link>}
              <small>{l}단계</small>
            </li>
          );
        })}
      </ol>
    </Screen>
  );
}

/** 훈련 문항 — 주소의 영역·레벨로 세트를 만든다 */
export function Lesson() {
  const { area } = useParams();
  const [sp] = useSearchParams();
  const { levels, mix, last } = useLevels();
  const [run, setRun] = useState(0);
  if (area !== 'mix' && !isArea(area)) return <Navigate to={P.training} replace />;
  const current = area === 'mix' ? mix : levels[area];
  const level = Math.min(10, Math.max(1, Number(sp.get('level')) || current));
  return <LessonRun key={`${area}-${level}-${run}`} area={area} level={level} current={current} weak={weakFor(last)} onRestart={() => setRun((n) => n + 1)} />;
}

type Prompt = null | 'hint' | 'retry';
interface Entry { item: Item; slot: number }

function LessonRun({ area, level, current, weak, onRestart }: { area: ModuleId | 'mix'; level: number; current: number; weak: ModuleId[]; onRestart: () => void }) {
  const pet = useApp((s) => s.pet.kind);
  const n = courseOf(level).questions;
  const used = useRef(new Set<string>());
  const take = (m: ModuleId) => {
    const it = draw(m, level, used.current);
    used.current.add(it.id);
    return it;
  };
  const [queue, setQueue] = useState<Entry[]>(() =>
    (area === 'mix' ? allocate(n, weak) : Array<ModuleId>(n).fill(area)).map((m, slot) => ({ item: take(m), slot })));
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'memo' | 'ask' | 'feedback' | 'done'>(queue[0].item.memo ? 'memo' : 'ask');
  const [wrong, setWrong] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [feedback, setFeedback] = useState<Outcome | null>(null);
  const slots = useRef<Outcome[]>(Array(n).fill('skipped'));
  const stats = useRef({ hints: 0, replaced: 0, startedAt: Date.now() });
  const started = useRef(0);
  const cur = queue[i];
  const options = useMemo(() => shuffle([cur.item.a, ...cur.item.o]), [cur.item]);

  // 답할 수 있게 된 때부터 15초
  useEffect(() => {
    if (phase !== 'ask') return;
    started.current = performance.now();
    const t = setTimeout(() => {
      setTimedOut(true);
      setPrompt((p) => p ?? 'hint');
    }, TIME_LIMIT * 1000);
    return () => clearTimeout(t);
  }, [phase, i]);

  const settle = (out: Outcome) => {
    slots.current[cur.slot] = out;
    setFeedback(out);
    setPrompt(null);
    setPhase('feedback');
    // 힌트·시간 초과 뒤 정답 → 같은 레벨의 새 문항으로 바꿔 바로 다음에 낸다 (세트당 최대 n번)
    if (out === 'assisted' && stats.current.replaced < n) {
      stats.current.replaced++;
      const next = { item: take(cur.item.area), slot: cur.slot };
      setQueue((q) => [...q.slice(0, i + 1), next, ...q.slice(i + 1)]);
    }
  };

  const choose = (o: string) => {
    if (phase !== 'ask' || wrong.includes(o)) return;
    const late = timedOut || performance.now() - started.current > TIME_LIMIT * 1000;
    if (o === cur.item.a) return settle(!hint && !late && !wrong.length ? 'perfect' : 'assisted');
    setWrong((w) => [...w, o]);
    setPrompt(hint ? 'retry' : 'hint');
  };

  const showHint = () => {
    stats.current.hints++;
    setHint(true);
    setPrompt(null);
  };

  const next = () => {
    if (i + 1 < queue.length) {
      const it = queue[i + 1].item;
      setI(i + 1);
      setWrong([]);
      setHint(false);
      setTimedOut(false);
      setPrompt(null);
      setFeedback(null);
      setPhase(it.memo ? 'memo' : 'ask');
      return;
    }
    finish();
  };

  const finish = () => {
    const outs = slots.current;
    const up = levelsUp(outs);
    markSolved(queue.slice(0, i + 1).map((e) => e.item.id));
    const at = new Date().toISOString();
    app.set((s) => {
      const base = s.training ?? { level: current, accepted: false, at };
      const training = !up || level !== current || level >= 10 ? s.training
        : area === 'mix' ? { ...base, level: level + 1, at }
        : { ...base, at, areas: { ...base.areas, [area]: level + 1 } };
      return {
        ...s,
        training,
        sessions: [...s.sessions, {
          id: uid(), at, task: 'training' as const,
          correct: outs.filter((o) => o === 'perfect').length, total: i + 1, hints: stats.current.hints,
          minutes: Math.max(1, Math.round((Date.now() - stats.current.startedAt) / 60000)),
        }],
      };
    });
    setPhase('done');
  };

  const label = area === 'mix' ? '맞춤 훈련' : MODULES[area];

  if (phase === 'done') {
    const outs = slots.current;
    const up = levelsUp(outs);
    const skipped = outs.filter((o) => o === 'skipped').length;
    return (
      <Screen title="훈련 완료" back={P.training} footer={<>
        {up && level < 10
          ? <Button to={levelPath(area, level + 1)}>{level + 1}단계 하기</Button>
          : <Button onClick={onRestart}>같은 단계 새 문항으로 다시 하기</Button>}
        <Button variant="secondary" to={`${P.rest}?next=${encodeURIComponent(P.training)}`}>잠깐 쉬어가기</Button>
        <Button variant="ghost" to={P.training}>훈련 목록으로</Button>
      </>}>
        <div className="tr-done">
          <PetArt kind={pet} size={140} />
          <h2 className="title">{up ? (level >= 10 ? '10단계를 모두 마쳤어요' : `${level + 1}단계가 열렸어요`) : '오늘도 끝까지 해내셨어요'}</h2>
          <p className="sub">{label} · {level}단계</p>
        </div>
        <Card>
          <p>15초 안에 맞힌 문제 <b>{outs.filter((o) => o === 'perfect').length} / {n}</b></p>
          <p>힌트 {stats.current.hints}번 · 건너뛴 문제 {skipped}개</p>
          {!up && <p className="small">같은 단계의 아직 풀지 않은 문항으로 한 번 더 하면 다음 단계가 열려요.</p>}
          <p className="small">완료한 세트는 내 기록에 남아요.</p>
        </Card>
      </Screen>
    );
  }

  const progress = (queue.slice(0, i).length + (phase === 'feedback' ? 1 : 0)) / queue.length;
  return (
    <Screen title={`${label} · ${level}단계`} back={P.training} help={false}>
      <div className="tr-progress" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={i + (phase === 'feedback' ? 1 : 0)} aria-label="진행">
        <i style={{ width: `${progress * 100}%` }} />
      </div>

      {phase === 'memo' ? (
        <>
          <span className="eyebrow">{MODULES[cur.item.area]}</span>
          <h2 className="title">잘 보고 기억해 주세요</h2>
          <Card tone="lavender"><p className="tr-memo">{cur.item.memo}</p></Card>
          <Button onClick={() => setPhase('ask')}>기억했어요 · 문제 보기</Button>
          <p className="small">문제가 나오면 그때부터 15초를 재요.</p>
        </>
      ) : (
        <>
          <span className="eyebrow">{MODULES[cur.item.area]}</span>
          <h2 className="title">{cur.item.q}</h2>
          {phase === 'ask' && (
            <div className={`tr-timer${timedOut ? ' over' : ''}`} key={`${cur.item.id}-${i}`} aria-hidden="true"><i /></div>
          )}
          <div className={`tr-options${options.some((o) => o.length > 10) ? ' wide' : ''}`} role="group" aria-label="보기">
            {options.map((o) => {
              const state = wrong.includes(o) ? 'no' : phase === 'feedback' && o === cur.item.a ? 'yes' : '';
              return (
                <button key={o} type="button" className={`tr-option ${state}`} disabled={phase !== 'ask' || wrong.includes(o)} onClick={() => choose(o)}>
                  {o}
                </button>
              );
            })}
          </div>

          <div aria-live="polite" className="stack">
            {hint && phase === 'ask' && <Card tone="mint"><p className="tr-hint"><Icon name="bulb" size={22} /> {cur.item.h}</p></Card>}
            {phase === 'ask' && prompt && (
              <div className="tr-sheet">
                <strong>{prompt === 'retry' ? '다시 골라 볼까요?' : wrong.length ? '힌트 볼까요?' : '15초가 지났어요. 힌트 볼까요?'}</strong>
                <div className="tr-two">
                  {prompt === 'hint'
                    ? <Button onClick={showHint}>힌트 보기</Button>
                    : <Button onClick={() => setPrompt(null)}>다시 풀기</Button>}
                  <Button variant="secondary" onClick={() => settle('skipped')}>건너뛰기</Button>
                </div>
              </div>
            )}
            {phase === 'feedback' && feedback && (
              <div className={`tr-sheet ${feedback}`}>
                <strong>
                  {feedback === 'perfect' ? '맞았어요!' : feedback === 'assisted' ? '맞았어요. 같은 단계의 새 문제로 한 번 더 해 봐요.' : '괜찮아요. 다음 문제로 가요.'}
                </strong>
                <Button onClick={next}>계속</Button>
              </div>
            )}
          </div>
        </>
      )}
    </Screen>
  );
}
