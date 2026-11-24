import { useState } from 'react';
import { Button, Card, Choice, Screen, toast } from '@/design/ui';
import { app, uid, useApp, type FamilyProposal } from '@/store/state';
import { daysSinceLast, last7Days, needsFamilyAlert } from './logic';
import './records.css';

const KINDS = [
  { kind: '횟수 줄이기', detail: '이번 주는 연습을 주 2회로 줄여 보면 어떨까요?' },
  { kind: '쉬운 단계로', detail: '요즘 힘들어 보여서, 한 단계 쉬운 연습으로 해 보면 어떨까요?' },
  { kind: '알림 시간 바꾸기', detail: '연습 알림을 아침 10시로 옮겨 보면 어떨까요?' },
];
const ALTERNATIVES = ['한 주만 해 보고 다시 정해요', '횟수는 그대로, 시간만 바꿔요', '쉬운 단계는 하루만 해 봐요'];

function Proposal({ p }: { p: FamilyProposal }) {
  const [alt, setAlt] = useState(false);
  const answer = (status: FamilyProposal['status'], text: string) => {
    app.set((s) => ({
      ...s,
      family: { ...s.family, proposals: s.family.proposals.map((x) => (x.id === p.id ? { ...x, status, answer: text } : x)) },
    }));
    toast(text);
  };
  return (
    <Card>
      <span className="rs-tag">{p.from}의 제안 · {p.kind}</span>
      <p>{p.detail}</p>
      {alt ? (
        <div className="stack" role="radiogroup" aria-label="다른 안 고르기">
          {ALTERNATIVES.map((a) => (
            <Choice key={a} checked={false} title={a} onSelect={() => answer('changed', `'${a}'(으)로 답했어요.`)} />
          ))}
          <Button variant="ghost" onClick={() => setAlt(false)}>돌아가기</Button>
        </div>
      ) : (
        <div className="stack">
          <Button onClick={() => answer('accepted', '제안을 받아들였어요.')}>수락하기</Button>
          <Button variant="secondary" onClick={() => setAlt(true)}>다른 안으로</Button>
          <Button variant="ghost" onClick={() => answer('declined', '지금대로 하기로 했어요.')}>지금대로 할게요</Button>
        </div>
      )}
    </Card>
  );
}

function MyView() {
  const family = useApp((s) => s.family);
  const pending = family.proposals.filter((p) => p.status === 'pending');
  const setShare = (key: keyof typeof family.share, v: boolean) =>
    app.set((s) => ({ ...s, family: { ...s.family, share: { ...s.family.share, [key]: v } } }));

  if (!family.linked) {
    return (
      <Card tone="lavender">
        <p className="rs-h">지금은 가족과 공유하지 않아요.</p>
        <p className="sub">다시 켜면 내가 고른 항목만 가족에게 보여요.</p>
        <Button onClick={() => app.set((s) => ({ ...s, family: { ...s.family, linked: true } }))}>가족 공유 다시 켜기</Button>
      </Card>
    );
  }
  return (
    <>
      <h2 className="title">가족의 제안은 내가 정해요.</h2>
      {pending.length ? pending.map((p) => <Proposal key={p.id} p={p} />) : (
        <Card tone="lavender"><p>새로 온 제안이 없어요.</p></Card>
      )}
      <Card>
        <p className="rs-h">가족에게 보여 줄 것</p>
        {([['access', '접속 여부'], ['practice', '연습 기록'], ['diary', '일기']] as const).map(([k, l]) => (
          <label key={k} className="rs-check">
            <input type="checkbox" checked={family.share[k]} onChange={(e) => setShare(k, e.target.checked)} />
            {l}
          </label>
        ))}
        <p className="small">일기는 처음에 꺼져 있어요. 켠 항목만 가족 화면에 보여요.</p>
      </Card>
      {family.proposals.some((p) => p.status !== 'pending') && (
        <Card>
          <p className="rs-h">지난 답변</p>
          {family.proposals.filter((p) => p.status !== 'pending').map((p) => (
            <p key={p.id} className="small">{p.kind} → {p.answer}</p>
          ))}
        </Card>
      )}
    </>
  );
}

function FamilyView() {
  const { sessions, family } = useApp();
  const [away, setAway] = useState(false);
  const [kind, setKind] = useState(KINDS[0].kind);
  const now = new Date();
  // 데모: 3일 미접속 상황은 '지금'을 3일 뒤로 옮겨서 보여 준다
  const viewNow = away ? new Date(now.getTime() + 3 * 86_400_000) : now;
  const days = last7Days(sessions, viewNow);
  const since = away ? Math.max(3, daysSinceLast(sessions, viewNow) ?? 3) : daysSinceLast(sessions, viewNow);
  const max = Math.max(1, ...days.map((d) => d.minutes));
  const lastAnswer = [...family.proposals].reverse().find((p) => p.status !== 'pending');

  const propose = () => {
    const k = KINDS.find((x) => x.kind === kind)!;
    app.set((s) => ({
      ...s,
      family: {
        ...s.family,
        proposals: [...s.family.proposals, { id: uid(), at: new Date().toISOString(), from: '가족', kind: k.kind, detail: k.detail, status: 'pending' }],
      },
    }));
    toast('제안을 보냈어요. 본인이 확인하고 정해요.');
  };

  if (!family.linked) {
    return <Card tone="lavender"><p>본인이 공유를 그만해서 가족 화면에 보여 줄 내용이 없어요.</p></Card>;
  }
  return (
    <>
      <span className="demo-badge">데모 미리보기 · 가족 휴대폰에 보이는 화면</span>
      {family.share.access && needsFamilyAlert(since) && (
        <section className="card rs-alert" role="status">
          <p className="rs-h">{since}일째 연습 소식이 없어요.</p>
          <p className="sub">안부 전화를 드려 보면 어떨까요? 연습을 재촉하기보다 일상 이야기를 나눠 주세요.</p>
        </section>
      )}
      <Card>
        <p className="rs-h">최근 7일</p>
        {family.share.practice ? (
          <ul className="rs-week" aria-label="최근 7일 연습">
            {days.map((d) => (
              <li key={d.label} aria-label={`${d.label} ${d.count ? `${d.minutes}분 연습` : '쉼'}`}>
                <span className={`rs-bar${d.count ? ' on' : ''}`} style={{ height: `${8 + (d.minutes / max) * 80}px` }} />
                <span>{d.label.split(' ')[1]}</span>
              </li>
            ))}
          </ul>
        ) : family.share.access ? (
          <p className="sub">{since === null ? '아직 접속 기록이 없어요.' : since === 0 ? '오늘 들어왔어요.' : `${since}일 전에 들어왔어요.`} 연습 기록은 공유하지 않았어요.</p>
        ) : (
          <p className="sub">본인이 공유하지 않은 항목이에요.</p>
        )}
        <label className="rs-check">
          <input type="checkbox" checked={away} onChange={(e) => setAway(e.target.checked)} />
          3일 미접속 상황 보기 (데모)
        </label>
      </Card>
      <Card>
        <p className="rs-h">훈련 조정 제안하기</p>
        <div className="stack" role="radiogroup" aria-label="제안 종류">
          {KINDS.map((k) => (
            <Choice key={k.kind} checked={kind === k.kind} title={k.kind} desc={k.detail} onSelect={() => setKind(k.kind)} />
          ))}
        </div>
        <Button onClick={propose}>제안 보내기</Button>
        <p className="small">바꾸는 건 본인이 승인할 때만 적용돼요.</p>
        {lastAnswer && <p className="small">최근 답변: {lastAnswer.kind} → {lastAnswer.answer}</p>}
      </Card>
    </>
  );
}

/** 가족 공유 — 기획안 24-4 기본안 A: 가족은 제안하고, 바꾸는 건 본인이 승인 */
export default function Family() {
  const [view, setView] = useState<'me' | 'family'>('me');
  return (
    <Screen title="가족 공유" back>
      <div className="rs-switch" role="group" aria-label="화면 고르기">
        <button type="button" aria-pressed={view === 'me'} onClick={() => setView('me')}>내 화면</button>
        <button type="button" aria-pressed={view === 'family'} onClick={() => setView('family')}>가족 화면</button>
      </div>
      {view === 'me' ? <MyView /> : <FamilyView />}
    </Screen>
  );
}
