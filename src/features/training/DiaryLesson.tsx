import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Icon, Screen } from '@/design/ui';
import { app, uid, useApp } from '@/store/state';
import { shuffle } from './bank';
import { diaryQuestions } from './diaryQuiz';
import './training.css';

/** 내 일기로 훈련하기 — 고른 일기를 다시 읽고, 일기 내용으로 만든 일화기억 문제를 푼다 */
export default function DiaryLesson() {
  const { id } = useParams();
  const diary = useApp((s) => s.diary);
  const entry = diary.find((d) => d.id === id);
  const qs = useMemo(() => (entry ? diaryQuestions(entry, diary.filter((d) => d.id !== id)).map((q) => ({ ...q, options: shuffle([q.a, ...q.o]) })) : []), [entry, diary, id]);
  const [phase, setPhase] = useState<'read' | 'ask' | 'done'>('read');
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const [right, setRight] = useState(0);

  if (!entry || !qs.length) {
    return (
      <Screen title="내 일기로 훈련하기" back={P.diary}>
        <p className="title">이 일기로는 문제를 만들기 어려워요.</p>
        <p className="sub">‘시장에 가서 두부를 샀어요.’처럼 어디에서 무엇을 했는지 적으면 문제가 생겨요.</p>
        <Button to={P.diary}>기억 일기장으로</Button>
      </Screen>
    );
  }

  if (phase === 'read') {
    return (
      <Screen title="내 일기로 훈련하기" back={P.diary} footer={<Button onClick={() => setPhase('ask')}>다 읽었어요 · 문제 보기</Button>}>
        <h2 className="title">그날의 일기를 천천히 읽어 보세요</h2>
        <Card tone="lavender">
          <span className="small">{new Date(entry.at).toLocaleDateString('ko-KR')} · {entry.mood}</span>
          <p className="tr-memo">{entry.text}</p>
        </Card>
        <p className="small">일기는 이 기기 안에서만 문제로 바뀌어요.</p>
      </Screen>
    );
  }

  if (phase === 'done') {
    return (
      <Screen title="내 일기로 훈련하기" back={P.diary} footer={<><Button to={P.diary}>다른 일기로 하기</Button><Button variant="secondary" to={P.training}>훈련하기</Button></>}>
        <h2 className="title">{qs.length}문제 중 {right}문제를 바로 떠올렸어요.</h2>
        <p className="sub">내 하루를 다시 떠올리는 것만으로도 좋은 연습이에요.</p>
      </Screen>
    );
  }

  const q = qs[i];
  const choose = (o: string) => {
    if (solved || wrong.includes(o)) return;
    if (o !== q.a) return setWrong((w) => [...w, o]);
    setSolved(true);
    if (!wrong.length && !hint) setRight((n) => n + 1);
  };
  const next = () => {
    if (i + 1 >= qs.length) {
      app.set((s) => ({ ...s, sessions: [...s.sessions, { id: uid(), at: new Date().toISOString(), task: 'training', correct: right, total: qs.length, hints: 0 }] }));
      return setPhase('done');
    }
    setI(i + 1); setWrong([]); setHint(false); setSolved(false);
  };
  return (
    <Screen title="내 일기로 훈련하기" back={P.diary} help={false}>
      <div className="tr-progress" role="progressbar" aria-valuemin={0} aria-valuemax={qs.length} aria-valuenow={i} aria-label="진행"><i style={{ width: `${(i / qs.length) * 100}%` }} /></div>
      <span className="eyebrow">일화기억 · 내 일기</span>
      <h2 className="title">{q.q}</h2>
      <div className={`tr-options${q.options.some((o) => o.length > 10) ? ' wide' : ''}`} role="group" aria-label="보기">
        {q.options.map((o) => (
          <button key={o} type="button" className={`tr-option ${wrong.includes(o) ? 'no' : solved && o === q.a ? 'yes' : ''}`} disabled={solved || wrong.includes(o)} onClick={() => choose(o)}>{o}</button>
        ))}
      </div>
      <div aria-live="polite" className="stack">
        {hint && !solved && <Card tone="mint"><p className="tr-hint"><Icon name="bulb" size={22} /> {q.h}</p></Card>}
        {!solved && wrong.length > 0 && !hint && <div className="tr-sheet"><strong>힌트 볼까요?</strong><Button onClick={() => setHint(true)}>힌트 보기</Button></div>}
        {solved && <div className="tr-sheet perfect"><strong>맞았어요!</strong><Button onClick={next}>계속</Button></div>}
      </div>
    </Screen>
  );
}
