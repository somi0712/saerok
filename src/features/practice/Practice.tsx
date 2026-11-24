import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Choice, Icon, Screen, toast } from '@/design/ui';
import { app, uid, type PracticeSession } from '@/store/state';
import { ITEMS, STRATEGIES, itemById, makeOptions, makeTarget, recommend, scoreOrder, type Burden, type Cue } from './logic';
import { run, speak, useRun } from './store';
import './practice.css';

const TITLE = '오늘의 기억 연습';

function strategyName(id: string) {
  return STRATEGIES.find((s) => s.id === id)?.name;
}

// 05 순서 기억하기 (F01-W) — 시간 제한 없음, 다시 보기 가능
export function Order() {
  const nav = useNavigate();
  const r = useRun();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (r.saved || r.target.length === 0) {
      run.set((p) => ({
        ...p, startedAt: p.saved || !p.startedAt ? new Date().toISOString() : p.startedAt,
        target: makeTarget(p.length), picks: [], views: 1, recall: null, burden: '', saved: false, shownAt: new Date().toISOString(),
      }));
    }
  }, [r.saved, r.target.length]);

  if (r.target.length === 0) return null;
  const item = itemById(r.target[idx]);
  const last = idx === r.target.length - 1;
  const replay = () => {
    run.set((p) => ({ ...p, views: p.views + 1 }));
    setIdx(0);
  };

  return (
    <Screen title={TITLE} back footer={
      <>
        {last ? <Button onClick={() => nav(P.orderPick)}>다 봤어요 · 순서대로 고르기</Button>
          : <Button onClick={() => setIdx(idx + 1)}>다음 물건 보기</Button>}
        <Button variant="secondary" to={P.help}>잠시 쉬기</Button>
      </>
    }>
      <span className="pr-tag">연습하기 1 / 2</span>
      <h2 className="title">순서를 천천히<br />기억해 보세요.</h2>
      <p className="sub">시간 제한은 없어요. {r.target.length}개를 하나씩 보여 드려요.</p>
      {r.strategy && <p className="eyebrow">오늘의 방법 · {strategyName(r.strategy)}</p>}

      <div className="pr-show" aria-live="polite">
        <span className="small">{idx + 1}번째</span>
        <span className="em" aria-hidden="true">{item.emoji}</span>
        <strong>{item.label}</strong>
      </div>

      <div className="pr-slots" aria-label="지금까지 본 순서">
        {r.target.slice(0, idx + 1).map((id, i) => (
          <span className="pr-slot" key={id}>{i + 1} {itemById(id).label}</span>
        ))}
      </div>
      {idx > 0 && <Button variant="ghost" onClick={replay}>처음부터 다시 보기</Button>}
    </Screen>
  );
}

// 06 순서대로 고르기
export function OrderPick() {
  const nav = useNavigate();
  const r = useRun();
  const options = useMemo(() => makeOptions(r.target), [r.target]);
  if (r.target.length === 0) return <NoRun />;
  const full = r.picks.length === r.target.length;

  const pick = (id: string) => {
    if (full || r.picks.includes(id)) return;
    run.set((p) => ({ ...p, picks: [...p.picks, id] }));
  };
  const seeAgain = () => {
    run.set((p) => ({ ...p, picks: [], views: p.views + 1 }));
    nav(P.order);
  };

  return (
    <Screen title={TITLE} back footer={<Button onClick={() => nav(P.recall)} disabled={!full}>{full ? '다 골랐어요' : `${r.picks.length} / ${r.target.length} 골랐어요`}</Button>}>
      <span className="pr-tag">연습하기 1 / 2</span>
      <h2 className="title">기억한 순서대로<br />그림을 눌러 주세요.</h2>
      <p className="sub">시간 제한은 없어요.</p>

      <div className="pr-slots" aria-label="고른 순서">
        {r.target.map((_, i) => (
          <span className="pr-slot" key={i}>{i + 1} {r.picks[i] ? itemById(r.picks[i]).label : '—'}</span>
        ))}
      </div>

      <div className="pr-grid">
        {options.map((id) => {
          const it = itemById(id);
          return (
            <button key={id} className="pr-item" aria-pressed={r.picks.includes(id)} onClick={() => pick(id)}>
              <span className="em" aria-hidden="true">{it.emoji}</span>{it.label}
            </button>
          );
        })}
      </div>

      <div className="pr-two">
        <Button variant="secondary" onClick={() => run.set((p) => ({ ...p, picks: p.picks.slice(0, -1) }))} disabled={r.picks.length === 0}>하나 지우기</Button>
        <Button variant="secondary" onClick={seeAgain}>다시 보기</Button>
      </div>
    </Screen>
  );
}

const GAP_QUESTIONS = [
  { q: '오늘 날씨는 어떤가요?', a: ['맑아요', '흐려요', '비가 와요', '잘 모르겠어요'] },
  { q: '오늘 아침은 어떠셨어요?', a: ['든든히 먹었어요', '가볍게 먹었어요', '아직이에요'] },
];

// 07 조금 뒤에 떠올리기 (F01-E 지연 회상) — 혼자 또는 진행자와 구두 회상
export function Recall() {
  const nav = useNavigate();
  const r = useRun();
  const [gap, setGap] = useState(0); // 사이 질문 단계 (GAP_QUESTIONS.length 이면 회상 시작)
  const [mode, setMode] = useState<'self' | 'helper'>('self');
  const [chosen, setChosen] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [count, setCount] = useState(0);
  const [cue, setCue] = useState<Cue>('none');
  if (r.target.length === 0) return <NoRun />;
  const total = r.target.length;

  if (gap < GAP_QUESTIONS.length) {
    const g = GAP_QUESTIONS[gap];
    return (
      <Screen title={TITLE} back>
        <span className="pr-tag">잠깐 다른 이야기</span>
        <h2 className="title">{g.q}</h2>
        <p className="sub">조금 뒤에 아까 본 물건을 떠올려 볼게요. 편하게 골라 주세요.</p>
        <div className="stack">
          {g.a.map((a) => <Button key={a} variant="secondary" onClick={() => setGap(gap + 1)}>{a}</Button>)}
        </div>
      </Screen>
    );
  }

  const finish = (correct: number, usedCue: Cue) => {
    const elapsedSec = r.shownAt ? Math.round((Date.now() - Date.parse(r.shownAt)) / 1000) : 0;
    run.set((p) => ({ ...p, recall: { mode, correct, total, cue: usedCue, elapsedSec } }));
    nav(P.result);
  };
  const toggle = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const ask = '어떤 물건들이 있었나요? 생각나는 만큼 말해 주세요.';

  return (
    <Screen title={TITLE} back footer={
      <>
        {mode === 'self'
          ? <Button onClick={() => finish(chosen.filter((id) => r.target.includes(id)).length, hint ? 'hint' : 'none')} disabled={!chosen.length}>다 떠올렸어요</Button>
          : <Button onClick={() => finish(count, cue)}>말씀 마쳤어요</Button>}
        <Button variant="secondary" to={P.help}>잠시 쉬기</Button>
      </>
    }>
      <span className="pr-tag">연습하기 2 / 2</span>
      <h2 className="title">조금 전에 본 내용을<br />떠올려 보세요.</h2>
      <p className="sub">순서는 몰라도 괜찮아요. 생각나는 만큼이면 돼요.</p>

      <div className="stack" role="radiogroup" aria-label="떠올리는 방법">
        <Choice checked={mode === 'self'} onSelect={() => setMode('self')} title="혼자 떠올리기" desc="생각난 물건을 눌러요" />
        <Choice checked={mode === 'helper'} onSelect={() => setMode('helper')} title="진행자와 함께" desc="말로 답하고 진행자가 기록해요" />
      </div>

      {mode === 'self' ? (
        <>
          <div className="pr-grid">
            {ITEMS.map((it) => (
              <button key={it.id} className="pr-item" aria-pressed={chosen.includes(it.id)} onClick={() => toggle(it.id)}>
                <span className="em" aria-hidden="true">{it.emoji}</span>{it.label}
              </button>
            ))}
          </div>
          {hint ? <p className="sub">힌트 · {r.target.map((id) => itemById(id).group).join(', ')} 종류가 있었어요.</p>
            : <Button variant="ghost" onClick={() => setHint(true)}>힌트 보기</Button>}
        </>
      ) : (
        <>
          <Card tone="mint">
            <span className="pr-tag" style={{ background: '#fff' }}>진행자와 함께</span>
            <button className="icon-btn" style={{ justifySelf: 'start' }} onClick={() => speak(ask)} aria-label="질문 듣기"><Icon name="speaker" /></button>
            <strong style={{ fontSize: 'calc(var(--fs) + 8px)' }}>{ask}</strong>
          </Card>
          <Card>
            <strong>진행자 기록 · 떠올린 물건 수</strong>
            <div className="pr-stepper">
              <button aria-label="하나 빼기" onClick={() => setCount(Math.max(0, count - 1))}>−</button>
              <output aria-live="polite">{count} / {total}</output>
              <button aria-label="하나 더하기" onClick={() => setCount(Math.min(total, count + 1))}>+</button>
            </div>
            <strong>도움 정도</strong>
            <div className="stack" role="radiogroup" aria-label="도움 정도">
              <Choice checked={cue === 'none'} onSelect={() => setCue('none')} title="도움 없이" />
              <Choice checked={cue === 'hint'} onSelect={() => setCue('hint')} title="힌트를 듣고" desc="예: 과일이 있었어요" />
              <Choice checked={cue === 'choices'} onSelect={() => setCue('choices')} title="보기를 보고" />
            </div>
          </Card>
        </>
      )}
    </Screen>
  );
}

const BURDENS: { id: Burden; label: string }[] = [
  { id: 'easy', label: '쉬웠어요' },
  { id: 'ok', label: '적당했어요' },
  { id: 'hard', label: '힘들었어요' },
];
const CUE_LABEL: Record<Cue, string> = { none: '도움 없이', hint: '힌트를 듣고', choices: '보기를 보고' };

// 08 오늘의 연습 기록 (F02 결과 + R01 규칙 추천, 본인 승인 후 적용)
export function Result() {
  const nav = useNavigate();
  const r = useRun();
  const [decision, setDecision] = useState<'' | 'accepted' | 'kept'>('');
  if (r.target.length === 0 || !r.recall) return <NoRun />;
  const order = scoreOrder(r.target, r.picks);
  const recall = r.recall;
  const rec = recommend({ order: { ...order, hints: r.views - 1 }, recall, burden: r.burden || undefined, length: r.length });

  const accept = () => {
    run.set((p) => ({ ...p, length: rec.nextLength, focus: rec.strategy ?? p.focus }));
    setDecision('accepted');
    toast('다음 연습에 적용할게요.');
  };
  const keep = () => {
    setDecision('kept');
    toast('지금처럼 이어 갈게요.');
  };
  const save = () => {
    if (!r.saved) {
      const at = new Date().toISOString();
      const minutes = r.startedAt ? Math.max(1, Math.round((Date.now() - Date.parse(r.startedAt)) / 60000)) : undefined;
      const common = { at, strategy: strategyName(r.strategy), burden: r.burden || undefined, minutes };
      const sessions: PracticeSession[] = [
        { id: uid(), task: 'order', correct: order.correct, total: order.total, hints: r.views - 1, ...common },
        { id: uid(), task: 'recall', correct: recall.correct, total: recall.total, hints: recall.cue === 'none' ? 0 : recall.cue === 'hint' ? 1 : 2, ...common },
      ];
      app.set((s) => ({ ...s, sessions: [...s.sessions, ...sessions], pet: { ...s.pet, seeds: s.pet.seeds + 1 } }));
      run.set((p) => ({ ...p, saved: true }));
      toast('씨앗 1개를 받았어요');
    }
    nav(P.plan);
  };

  return (
    <Screen title={TITLE} back footer={<Button onClick={save}>생활에서 써 볼 목표 정하기</Button>}>
      <span className="pr-tag">돌아보기</span>
      <h2 className="title">오늘의 연습 기록</h2>

      <div className="pr-two">
        <div className="pr-score lav">
          <strong>순서 기억</strong>
          <b>{order.correct} / {order.total}</b>
          <span className="small">순서대로 골랐어요</span>
        </div>
        <div className="pr-score peach">
          <strong>조금 뒤 회상</strong>
          <b>{recall.correct} / {recall.total}</b>
          <span className="small">물건을 떠올렸어요</span>
        </div>
      </div>

      <Card>
        <strong>어떤 방법을 써 보셨나요?</strong>
        <div className="pr-chips">
          {STRATEGIES.map((s) => (
            <button key={s.id} className="chip" aria-pressed={r.strategy === s.id} onClick={() => run.set((p) => ({ ...p, strategy: s.id }))}>{s.name}</button>
          ))}
          <button className="chip" aria-pressed={!r.strategy} onClick={() => run.set((p) => ({ ...p, strategy: '' }))}>따로 없었어요</button>
        </div>
        <strong>연습은 어땠나요?</strong>
        <div className="pr-chips">
          {BURDENS.map((b) => (
            <button key={b.id} className="chip" aria-pressed={r.burden === b.id} onClick={() => run.set((p) => ({ ...p, burden: b.id }))}>{b.label}</button>
          ))}
        </div>
        <span className="small">
          다시 보기 {r.views - 1}번 · {recall.mode === 'helper' ? '진행자와 구두 회상' : '혼자 떠올리기'} · {CUE_LABEL[recall.cue]}
          {recall.elapsedSec > 0 && ` · 본 뒤 ${Math.max(1, Math.round(recall.elapsedSec / 60))}분 뒤 회상`}
        </span>
      </Card>

      {r.burden && (
        <Card tone="lavender">
          <span className="eyebrow">다음 연습 추천</span>
          <strong>{rec.reason}</strong>
          {!rec.hold && (decision ? (
            <p className="sub">{decision === 'accepted' ? '다음 연습에 적용했어요.' : '지금처럼 이어 갈게요.'} 언제든 바꿀 수 있어요.</p>
          ) : (
            <div className="pr-two">
              <Button onClick={accept}>좋아요</Button>
              <Button variant="secondary" onClick={keep}>지금처럼 할게요</Button>
            </div>
          ))}
        </Card>
      )}

      <p className="sub">이 결과는 이번 과제의 기록이에요. 평소의 기억 상태 전체를 뜻하지는 않아요.</p>
    </Screen>
  );
}

function NoRun() {
  return (
    <Screen title={TITLE} back>
      <h2 className="title">진행 중인 연습이 없어요.</h2>
      <p className="sub">준비하기부터 천천히 시작해 볼까요?</p>
      <Button to={P.practice}>연습 준비하기</Button>
    </Screen>
  );
}
