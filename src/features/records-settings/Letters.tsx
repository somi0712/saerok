import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Screen, toast } from '@/design/ui';
import { P } from '@/app/paths';
import { app, uid, useApp } from '@/store/state';
import { askNotify, isArrived, letterLink, markOpened } from './letterStore';

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const whenText = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours() < 12 ? '오전' : '오후'} ${d.getHours() % 12 || 12}시${d.getMinutes() ? ` ${d.getMinutes()}분` : ''}`;
};

/** 기억 일기장 안 ‘미래의 나에게 보내기’ — 쓰기 · 예약 목록 · 도착한 편지 */
export function LettersSection() {
  const letters = useApp((s) => s.letters ?? []);
  const [open, setOpen] = useState(false);
  const tomorrow = new Date(Date.now() + 86_400_000);
  const [text, setText] = useState('');
  const [date, setDate] = useState(localDate(tomorrow));
  const [time, setTime] = useState('09:00');
  const sendAt = new Date(`${date}T${time}`);
  const valid = text.trim() && !Number.isNaN(sendAt.getTime()) && sendAt.getTime() > Date.now();
  const list = [...letters].sort((a, b) => a.sendAt.localeCompare(b.sendAt));

  const save = async () => {
    if (!valid) return;
    app.set((s) => ({ ...s, letters: [...(s.letters ?? []), { id: uid(), at: new Date().toISOString(), sendAt: sendAt.toISOString(), text: text.trim() }] }));
    await askNotify();
    toast(`${whenText(sendAt.toISOString())}에 편지가 도착하도록 예약했어요.`);
    setText('');
    setOpen(false);
  };

  return (
    <Card tone="mint">
      <span className="eyebrow">미래의 나에게 보내기</span>
      {open ? (
        <div className="stack">
          <label className="stack">
            <span className="rs-label">미래의 나에게 하고 싶은 말</span>
            <textarea className="rs-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="예: 오늘 배운 묶기 방법, 다음 주에도 써 봤나요?" />
          </label>
          <div className="rs-when">
            <label className="stack"><span className="rs-label">받을 날짜</span><input type="date" className="rs-input" value={date} min={localDate(new Date())} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="stack"><span className="rs-label">받을 시간</span><input type="time" className="rs-input" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          </div>
          {!valid && text.trim() && <p className="small" role="status">지금보다 뒤의 날짜와 시간을 골라 주세요.</p>}
          <Button onClick={save} disabled={!valid}>예약하기</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>그만 쓰기</Button>
          <p className="small">편지는 이 기기에만 저장돼요. 정한 시간에 새록이 열려 있으면 알림이 뜨고, 닫혀 있었다면 다음에 열 때 홈에서 알려 드려요.</p>
        </div>
      ) : (
        <>
          <p>받을 날짜와 시간을 정하면 그때 편지가 도착해요.</p>
          <Button variant="secondary" onClick={() => setOpen(true)}>편지 쓰기</Button>
        </>
      )}
      {list.length > 0 && (
        <ul className="rs-letters">
          {list.map((l) => (
            <li key={l.id}>
              {isArrived(l)
                ? <Link to={letterLink(l.id)}>{l.openedAt ? '열어 본 편지' : '도착한 편지'} · {whenText(l.sendAt)}</Link>
                : <span>{whenText(l.sendAt)}에 도착해요</span>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** 알림이나 홈 카드를 누르면 여는 편지 */
export function LetterView({ id }: { id: string }) {
  const letter = useApp((s) => (s.letters ?? []).find((l) => l.id === id));
  const arrived = letter && isArrived(letter);
  useEffect(() => { if (arrived) markOpened(id); }, [arrived, id]);
  return (
    <Screen title="미래의 나에게서 온 편지" back={P.diary}>
      {!letter ? <p>편지를 찾지 못했어요.</p> : !arrived ? (
        <Card tone="lavender"><p>{whenText(letter.sendAt)}에 열 수 있어요. 조금만 기다려 주세요.</p></Card>
      ) : (
        <Card tone="lavender">
          <span className="small">{whenText(letter.at)}에 쓴 편지</span>
          <p className="rs-letter">{letter.text}</p>
        </Card>
      )}
      <Button variant="secondary" to={P.diary}>기억 일기장으로</Button>
    </Screen>
  );
}
