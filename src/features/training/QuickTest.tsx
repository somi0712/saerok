import { useMemo, useState } from 'react';
import { P } from '@/app/paths';
import { Button, Card, Screen } from '@/design/ui';
import { MODULES } from '@/features/assessment/data';
import { itemsFor, shuffle } from './bank';
import { AREAS } from './logic';
import './training.css';

/** 간단 테스트 — 영역마다 한 문제씩 빠르게 체험하고 기초 테스트로 이어진다. 저장하지 않는다. */
export default function QuickTest() {
  const items = useMemo(() => AREAS.map((m) => {
    const bank = itemsFor(m, 3);
    const it = bank[Math.floor(Math.random() * bank.length)];
    return { ...it, options: shuffle([it.a, ...it.o]) };
  }), []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [seenMemo, setSeenMemo] = useState(false);

  if (i >= items.length) {
    return (
      <Screen title="간단 테스트" tabs footer={<><Button to={P.check}>기초 테스트로 자세히 보기</Button><Button variant="secondary" to={P.training}>훈련하기</Button></>}>
        <h2 className="title">5문제 중 {right}문제를 맞혔어요.</h2>
        <p className="sub">기초 테스트는 5개 영역을 더 자세히 살펴보고, 나에게 맞는 시작 레벨을 알려 드려요.</p>
      </Screen>
    );
  }
  const it = items[i];
  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    if (o === it.a) setRight((n) => n + 1);
  };
  return (
    <Screen title="간단 테스트" tabs>
      <div className="tr-progress" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={i} aria-label="진행"><i style={{ width: `${(i / items.length) * 100}%` }} /></div>
      <span className="eyebrow">{MODULES[it.area]} · {i + 1} / {items.length}</span>
      {it.memo && !seenMemo ? (
        <>
          <h2 className="title">잘 보고 기억해 주세요</h2>
          <Card tone="lavender"><p className="tr-memo">{it.memo}</p></Card>
          <Button onClick={() => setSeenMemo(true)}>기억했어요 · 문제 보기</Button>
        </>
      ) : <>
      <h2 className="title">{it.q}</h2>
      <div className={`tr-options${it.options.some((o) => o.length > 10) ? ' wide' : ''}`} role="group" aria-label="보기">
        {it.options.map((o) => (
          <button key={o} type="button" className={`tr-option ${picked && o === it.a ? 'yes' : picked === o ? 'no' : ''}`} disabled={!!picked} onClick={() => choose(o)}>{o}</button>
        ))}
      </div>
      {picked && (
        <Card tone={picked === it.a ? 'mint' : 'lavender'}>
          <strong>{picked === it.a ? '맞았어요!' : `괜찮아요. 정답: ${it.a}`}</strong>
          <Button onClick={() => { setI(i + 1); setPicked(null); setSeenMemo(false); }}>{i + 1 < items.length ? '다음 문제' : '결과 보기'}</Button>
        </Card>
      )}
      </>}
    </Screen>
  );
}
