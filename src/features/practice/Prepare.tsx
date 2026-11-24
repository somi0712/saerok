import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Choice, Icon, Screen, toast } from '@/design/ui';
import { app, useApp, type FontSize } from '@/store/state';
import { STRATEGIES, strategyOfToday, type StrategyId } from './logic';
import { run, speak, startRun, useRun } from './store';
import './practice.css';

// 02 이용 안내와 동의 (C01: 목적별 동의 + 이해 확인)
export function Consent() {
  const nav = useNavigate();
  const prev = useApp((s) => s.consent);
  const [use, setUse] = useState(prev.use);
  const [share, setShare] = useState(prev.share);
  const [research, setResearch] = useState(prev.research);
  const [check, setCheck] = useState('');
  const understood = check === 'records';

  const save = () => {
    // 이해 확인을 맞히지 못하면 가족 공유는 보류하고 나중에 설정에서 켤 수 있게 한다.
    const shareOk = share && understood;
    app.set((s) => ({ ...s, consent: { use, share: shareOk, research, at: new Date().toISOString() } }));
    if (share && !shareOk) toast('가족 공유는 잠시 미뤄 둘게요. 설정에서 언제든 켤 수 있어요.');
    nav(P.practice);
  };

  return (
    <Screen title="오늘의 기억 연습" back footer={<Button onClick={save} disabled={!use || (share && !check)}>확인했어요</Button>}>
      <span className="pr-tag">이용 안내</span>
      <h2 className="title">시작하기 전에<br />함께 확인해요.</h2>
      <p className="sub">새록은 기억 연습을 돕는 앱이에요. 진단이나 치료를 하지 않아요.</p>

      <label className="pr-toggle">
        <input type="checkbox" checked={use} onChange={(e) => setUse(e.target.checked)} />
        <div><strong>연습 기록 저장 (필수)</strong><span>연습 결과를 이 브라우저에 저장해 다음 연습에 써요.</span></div>
      </label>
      <label className="pr-toggle">
        <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
        <div><strong>가족과 공유 (선택)</strong><span>가족 공유 설정을 체험해요. 실제로 전송되는 기록은 없어요.</span></div>
      </label>
      <label className="pr-toggle">
        <input type="checkbox" checked={research} onChange={(e) => setResearch(e.target.checked)} />
        <div><strong>서비스 개선에 활용 (선택)</strong><span>개선 연구에 참여하는 설정을 체험해요. 이 버전에서는 기록을 수집하지 않아요.</span></div>
      </label>

      {share && (
        <Card tone="lavender">
          <strong>가족 공유를 켜면 가족은 무엇을 볼 수 있을까요?</strong>
          <div className="stack" role="radiogroup" aria-label="이해 확인">
            <Choice checked={check === 'records'} onSelect={() => setCheck('records')} title="연습한 날과 기록" desc="일기는 따로 정해요" />
            <Choice checked={check === 'all'} onSelect={() => setCheck('all')} title="제 모든 일기와 사진" />
            <Choice checked={check === 'none'} onSelect={() => setCheck('none')} title="아무것도 볼 수 없어요" />
          </div>
          {check && !understood && <p>가족은 <b>연습한 날과 기록</b>만 볼 수 있어요. 일기는 본인이 따로 정해요.</p>}
        </Card>
      )}
    </Screen>
  );
}

const FONT_NEXT: Record<FontSize, FontSize> = { 20: 22, 22: 24, 24: 24 };

// 03 편안하게 준비하기 (F00 지각 확인 · F00-RT 반응시간 기준선) — 하단 탭: 연습
export function Prepare() {
  const nav = useNavigate();
  const learned = useRun((r) => r.learned);
  const fontSize = useApp((s) => s.settings.fontSize);
  const [readOk, setReadOk] = useState(false);
  const [tapped, setTapped] = useState(false);
  const shownAt = useRef(performance.now());

  const tap = () => {
    const ms = Math.round(performance.now() - shownAt.current);
    run.set((r) => ({ ...r, baselineMs: ms }));
    setTapped(true);
    if (!speak('잘 들리시나요? 이 소리는 연습 점수에 들어가지 않아요.')) toast('소리가 꺼져 있어요. 설정에서 켤 수 있어요.');
  };
  const bigger = () => {
    app.set((s) => ({ ...s, settings: { ...s.settings, fontSize: FONT_NEXT[s.settings.fontSize] } }));
    toast(fontSize === 24 ? '가장 큰 글자예요.' : '글자를 키웠어요.');
  };
  const go = () => {
    startRun();
    nav(learned ? P.order : P.learn);
  };

  return (
    <Screen title="오늘의 기억 연습" tabs>
      <span className="pr-tag">시작 전 준비</span>
      <h2 className="title">글자와 소리를<br />함께 확인해요.</h2>
      <p className="sub">진행자와 천천히 따라 해 보세요.</p>

      <Card>
        <span className="pr-tag">1 글자 확인</span>
        <p style={{ fontSize: 'calc(var(--fs) + 14px)', fontWeight: 800 }}>사과 · 우유 · 빵</p>
        <p className="sub">편하게 읽을 수 있나요?</p>
        <div className="pr-two">
          <button className="chip" aria-pressed={readOk} onClick={() => setReadOk(true)}>잘 보여요</button>
          <button className="chip" onClick={bigger}>글자 키우기</button>
        </div>
      </Card>

      <button className="pr-big" data-done={tapped} onClick={tap}>
        <strong><Icon name="speaker" /> {tapped ? '잘 눌렀어요.' : '큰 버튼을 눌러 보세요.'}</strong>
        <span className="sub">연습 점수에는 들어가지 않아요.</span>
      </button>

      <Button variant="secondary" to={P.settings}>글자·소리 조정하기</Button>
      <Button onClick={go}>{learned ? '준비 확인 후 연습하기' : '준비 확인 후 배우기'}</Button>

      <div className="stack">
        <strong>다른 연습</strong>
        <Link to={P.check} className="card pr-link">
          <span className="pr-ico" aria-hidden="true">A–E</span>
          <span><strong>정밀 기억력 테스트</strong><span>다섯 영역을 살펴봐요</span></span>
          <span className="pr-go"><Icon name="back" /></span>
        </Link>
        <Link to={P.training} className="card pr-link">
          <span className="pr-ico" aria-hidden="true">🌱</span>
          <span><strong>단계별 훈련</strong><span>나의 단계에 맞춘 연습</span></span>
          <span className="pr-go"><Icon name="back" /></span>
        </Link>
      </div>
    </Screen>
  );
}

// 04 전략 배우기 (하단 탭: 배우기) — 묶기 · 시각화 · 의미 연결, 하루 1개 추천
export function Learn() {
  const nav = useNavigate();
  const typeStrategy = useApp((s) => s.typeResult?.strategy);
  const focus = useRun((r) => r.focus);
  const explanation = useRun((r) => r.explanation);
  const today = focus || strategyOfToday(typeStrategy);
  const [id, setId] = useState<StrategyId>(today);
  const [demo, setDemo] = useState(false);
  const idx = STRATEGIES.findIndex((s) => s.id === id);
  const st = STRATEGIES[idx];

  useEffect(() => setDemo(false), [id]);

  const practice = () => {
    run.set((r) => ({ ...r, learned: true, strategy: id }));
    if (!run.get().startedAt || run.get().saved) startRun();
    nav(P.order);
  };

  return (
    <Screen title="오늘의 기억 연습" tabs>
      <span className="pr-tag">배우기 {idx + 1} / {STRATEGIES.length}{id === today ? ' · 오늘의 추천' : ''}</span>
      <h2 className="title pr-title">{st.title}</h2>
      <p className="sub">{st.sub}</p>

      <div className="pr-demo">
        {st.demo.map((d) => (
          <div className="pr-demo-row" key={d.label}><span className="em" aria-hidden="true">{d.icons}</span>{d.label}</div>
        ))}
        <p>{demo ? st.say : st.tip}</p>
      </div>

      <div className="pr-two">
        <Button variant="secondary" onClick={() => setDemo((v) => !v)}>{demo ? '요약 보기' : '시범 보기'}</Button>
        <Button variant="secondary" onClick={() => { if (!speak(st.say)) toast('소리가 꺼져 있어요. 설정에서 켤 수 있어요.'); }}>
          <Icon name="speaker" /> 다시 듣기
        </Button>
      </div>

      <label className="stack">
        <span className="sub">어떻게 할지 내 말로 이야기해 보세요. (적지 않아도 돼요)</span>
        <textarea className="pr-input" rows={3} value={explanation} placeholder="예: 과일은 과일끼리 묶을래요"
          onChange={(e) => run.set((r) => ({ ...r, explanation: e.target.value }))} />
      </label>

      <div className="pr-chips" role="group" aria-label="다른 방법 보기">
        {STRATEGIES.map((s) => (
          <button key={s.id} className="chip" aria-pressed={s.id === id} onClick={() => setId(s.id)}>{s.name}</button>
        ))}
      </div>

      <Button onClick={practice}>이 방법으로 연습하기</Button>
    </Screen>
  );
}
