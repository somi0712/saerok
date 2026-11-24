import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Icon, Screen, toast, type IconName } from '@/design/ui';
import { app, useApp, WEEKDAYS } from '@/store/state';
import './practice.css';

const GOALS: { key: string; goal: string; desc: string; icon: IconName }[] = [
  { key: '장보기', goal: '장 볼 물건 묶어 기억하기', desc: '장을 보기 전 살 물건을 종류별로 묶어 볼게요.', icon: 'apple' },
  { key: '약속', goal: '약속 시간 기억하기', desc: '약속 시간과 장소를 한 장면으로 떠올려 볼게요.', icon: 'calendar' },
  { key: '물건', goal: '물건 둔 곳 기억하기', desc: '안경·열쇠를 둔 곳을 말로 한 번 짚어 볼게요.', icon: 'key' },
];

// 09 생활 목표와 주간 계획 (F03) — 본인이 확인·수정, 미이행에 비난 없음
export function Plan() {
  const nav = useNavigate();
  const plan = useApp((s) => s.plan);
  const preset = GOALS.filter((g) => plan.goals.includes(g.goal)).map((g) => g.key);
  const [keys, setKeys] = useState<string[]>(preset.length || plan.goals.length ? preset : ['장보기']);
  const [own, setOwn] = useState(plan.goals.find((g) => !GOALS.some((x) => x.goal === g)) ?? '');
  const [days, setDays] = useState<string[]>(plan.days.length ? plan.days : ['월', '수', '금']);
  const goals = [...GOALS.filter((g) => keys.includes(g.key)).map((g) => g.goal), ...(own.trim() ? [own.trim()] : [])];
  const shown = GOALS.find((g) => keys.includes(g.key));

  const flip = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const save = (to: string) => {
    const at = new Date().toISOString();
    const ordered = WEEKDAYS.filter((d) => days.includes(d));
    app.set((s) => ({ ...s, plan: { days: [...ordered], goals, at, history: [...s.plan.history, { at, days: [...ordered], goals }] } }));
    toast('이번 주 계획을 정했어요.');
    nav(to);
  };
  const ready = goals.length > 0 && days.length > 0;

  return (
    <Screen title="오늘의 기억 연습" back footer={
      <>
        <Button onClick={() => save(P.petGrowth)} disabled={!ready}>이 계획으로 시작하기</Button>
        <Button variant="secondary" onClick={() => save(P.home)} disabled={!ready}>저장하고 홈으로</Button>
      </>
    }>
      <span className="pr-tag">생활에 써먹기</span>
      <h2 className="title">배운 방법을<br />어디에 써 볼까요?</h2>
      <p className="sub">내가 고른 목표로 이어가요.</p>

      {shown && (
        <div className="pr-demo">
          <strong className="pr-goal"><Icon name={shown.icon} size={32} /> {shown.goal}</strong>
          <p>{shown.desc}</p>
        </div>
      )}

      <div className="pr-goal-pick" role="group" aria-label="생활 목표">
        {GOALS.map((g) => (
          <button key={g.key} aria-pressed={keys.includes(g.key)} onClick={() => setKeys(flip(keys, g.key))}>{g.key}</button>
        ))}
      </div>
      <label className="stack">
        <span className="sub">직접 쓰기 (선택)</span>
        <input className="pr-input" value={own} maxLength={40} placeholder="예: 손주 생일 기억하기" onChange={(e) => setOwn(e.target.value)} />
      </label>

      <Card>
        <strong>언제 연습하면 편할까요?</strong>
        <div className="pr-week-pick" role="group" aria-label="연습할 요일">
          {WEEKDAYS.map((d) => (
            <button key={d} aria-pressed={days.includes(d)} onClick={() => setDays(flip(days, d))}>{d}</button>
          ))}
        </div>
        <span className="sub">{WEEKDAYS.filter((d) => days.includes(d)).join(' · ') || '요일을 골라 주세요'}</span>
      </Card>

      <p className="sub">못 한 날이 있어도 괜찮아요. 계획은 언제든 바꿀 수 있어요.</p>
    </Screen>
  );
}
