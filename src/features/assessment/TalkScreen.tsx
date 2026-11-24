import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { P } from '@/app/paths';
import { Button, Icon, PET_NAMES, PetArt, Screen } from '@/design/ui';
import { app, useApp } from '@/store/state';
import './assessment.css';

// 노션 2주차 「음성 대화 UX 시나리오」: 평가자가 아닌 다정한 동반자, 1.2배 느린 말, 5~7초 넉넉한 대기,
// 부정적 피드백 금지, 한 번에 질문 하나, 작은 대답에도 즉각 칭찬. 점수는 보여 주지 않는다.
const IDLE_MS = 7000;
const IDLE_TEXT = '천천히 생각하셔도 돼요. 편하게 떠오르는 대로 말씀해 주세요.';
const END_TEXT = '오늘 이야기 나눠 주셔서 고마워요. 친구분과 즐거운 오후 보내세요!';

interface Reply { t: string; k: string[]; r: string }
interface Turn { q: string; a: Reply[] }
interface Msg { who: 'ai' | 'me'; text: string }

function script(today = new Date()): Turn[] {
  const fmt = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  const wrong = new Date(today.getTime() - 3 * 864e5);
  const t = fmt(today);
  return [
    { q: '좋은 아침이에요! 오늘 햇살이 아주 따뜻한데, 식사는 맛있게 드셨어요?', a: [
      { t: '응, 아침에 누룽지를 먹었어', k: ['누룽지', '먹었'], r: '따뜻한 누룽지 드셨군요! 속이 편안하셨겠어요.' },
      { t: '아직 못 먹었어', k: ['아직', '못', '안 먹'], r: '그러셨군요. 이따가 따뜻한 걸로 꼭 챙겨 드세요.' },
      { t: '잘 모르겠어요', k: ['모르'], r: '괜찮아요. 금방 떠오르지 않을 때도 있죠.' } ] },
    { q: '벌써 단풍이 예쁘게 물드는 계절이에요. 혹시 오늘이 며칠인지 기억나시나요?', a: [
      { t: `${t}인가?`, k: [`${today.getDate()}일`], r: `맞아요! ${t}이에요. 기억력이 아주 또렷하시네요.` },
      { t: `${fmt(wrong)}인가?`, k: [`${wrong.getDate()}일`], r: `아, 요즘 날이 비슷해서 헷갈리실 수 있죠! 오늘은 ${t}이에요. 저도 가끔 날짜를 헷갈려요. 괜찮아요!` },
      { t: '잘 모르겠어요', k: ['모르'], r: `괜찮아요. 오늘은 ${t}이에요. 저도 가끔 날짜를 깜빡해요.` } ] },
    { q: '오늘 오후에 약속이나 계획 있으신가요?', a: [
      { t: '오후 3시에 복지관 가서 친구 만나기로 했어', k: ['3시', '세 시', '복지관', '친구'], r: '친구를 만나시는 날이군요! 3시, 복지관, 친구와의 만남이라니 정말 즐거운 시간이 되겠어요.' },
      { t: '특별한 계획은 없어', k: ['없'], r: '편히 쉬는 날도 좋죠. 연습 삼아 하나만 기억해 주세요. 오후 3시, 복지관에서 친구 만나기예요.' },
      { t: '잘 모르겠어요', k: ['모르'], r: '괜찮아요. 연습 삼아 하나만 기억해 주세요. 오후 3시, 복지관에서 친구 만나기예요.' } ] },
    { q: '복지관 가시는 길에 과일도 사 드시면 좋겠어요. 요즘 제철인 가을 과일 두 가지만 말씀해 주시겠어요?', a: [
      { t: '사과와 배', k: ['사과', '배'], r: '사과랑 배! 둘 다 달콤하고 맛있죠. 잘 말씀해 주셨어요!' },
      { t: '감이랑 귤', k: ['감', '귤'], r: '감이랑 귤! 요즘 정말 맛있을 때예요. 잘 말씀해 주셨어요!' },
      { t: '잘 모르겠어요', k: ['모르'], r: '괜찮아요. 요즘은 사과, 배, 감이 참 맛있어요.' } ] },
    { q: '아까 오늘 몇 시에 누구를 만나러 가신다고 하셨죠?', a: [
      { t: '3시에 친구 만나러 가', k: ['3시', '세 시', '친구'], r: '맞아요! 3시에 복지관에서 친구를 만나시죠. 기억력이 정말 꼼꼼하시네요.' },
      { t: '5시에 딸 만나러 가', k: ['5시', '다섯 시', '딸'], r: '아, 헷갈리실 수 있죠! 3시에 복지관에서 친구를 만나신다고 하셨어요. 저도 가끔 약속 시간을 헷갈려요. 괜찮아요!' },
      { t: '잘 모르겠어요', k: ['모르'], r: '괜찮아요. 3시에 복지관에서 친구를 만나신다고 하셨어요. 천천히 떠올려 주셔서 고마워요.' } ] },
  ];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SR: any = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
const tts = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

/** 받침이 있으면 a, 없으면 b (몽글과 / 새봄과 / 반짝과, 몽글이 / …) */
export const josa = (word: string, a: string, b: string) => {
  const c = word.charCodeAt(word.length - 1) - 0xac00;
  return word + (c >= 0 && c <= 11171 && c % 28 !== 0 ? a : b);
};

export function TalkScreen() {
  const turns = useMemo(() => script(), []);
  const kind = useApp((s) => s.pet.kind) ?? 'mongle';
  const name = useApp((s) => s.pet.name) || PET_NAMES[kind];
  const soundOn = useApp((s) => s.settings.soundOn) && !!tts;
  const rate = useApp((s) => s.settings.voiceRate) || 0.85;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(true);
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const lastAi = useRef('');
  const idle = useRef<ReturnType<typeof setTimeout>>();
  const idleShown = useRef(false);
  const question = useRef(0); // 지금 기다리는 질문 번호: 대답하면 바뀌어 이전 질문의 대기 타이머가 시작되지 않는다
  const run = useRef(0); // 대화 회차: 다시 시작하거나 화면을 떠나면 이전 회차의 남은 대사를 버린다
  const logEnd = useRef<HTMLDivElement>(null);
  const sound = useRef(soundOn);
  sound.current = soundOn;

  const speak = useCallback((text: string, force = false) => new Promise<void>((done) => {
    if (!tts || (!sound.current && !force)) return done();
    tts.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = rate;
    u.pitch = 0.95;
    const v = tts.getVoices().find((x) => /^ko/i.test(x.lang));
    if (v) u.voice = v;
    let fired = false;
    const fin = () => { if (!fired) { fired = true; done(); } };
    u.onend = fin;
    u.onerror = fin;
    // ponytail: 일부 브라우저는 onend 를 건너뛰어 글자당 0.35초로 상한을 둔다. 긴 문장이 잘리면 늘린다.
    setTimeout(fin, 2000 + text.length * 350);
    tts.speak(u);
  }), [rate]);

  /** 대사를 보여 주고 읽기 시작한다. 읽기가 끝나면 풀리는 약속을, 그사이 회차가 바뀌었으면 null 을 돌려준다 */
  const show = useCallback(async (text: string) => {
    const my = run.current;
    setTyping(true);
    await sleep(700);
    if (my !== run.current) return null;
    setTyping(false);
    lastAi.current = text;
    setMsgs((m) => [...m, { who: 'ai', text }]);
    return { spoken: speak(text) };
  }, [speak]);

  /** 보여 주고 다 읽을 때까지 기다린다. 회차가 바뀌었으면 false */
  const say = useCallback(async (text: string) => {
    const my = run.current;
    const shown = await show(text);
    if (!shown) return false;
    await shown.spoken;
    return my === run.current;
  }, [show]);

  const clearIdle = () => clearTimeout(idle.current);
  const startIdle = useCallback(() => {
    clearIdle();
    if (idleShown.current) return;
    idle.current = setTimeout(() => { idleShown.current = true; show(IDLE_TEXT); }, IDLE_MS);
  }, [show]);

  const ask = useCallback(async (i: number) => {
    idleShown.current = false;
    setIdx(i);
    if (i >= turns.length) {
      if (await say(END_TEXT)) setBusy(false);
      return;
    }
    const turn = ++question.current;
    const shown = await show(turns[i].q);
    if (!shown) return;
    // 읽는 동안에도 바로 대답할 수 있고, 다 읽은 뒤부터 7초 기다린다.
    setBusy(false);
    shown.spoken.then(() => { if (turn === question.current) startIdle(); });
  }, [say, show, startIdle, turns]);

  const begin = useCallback(() => {
    run.current++;
    clearIdle();
    tts?.cancel();
    setMsgs([]);
    setTyping(false);
    setBusy(true);
    ask(0);
  }, [ask]);

  useEffect(() => {
    begin();
    return () => { run.current++; clearIdle(); tts?.cancel(); };
  }, [begin]);

  useEffect(() => { logEnd.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [msgs, typing]);

  const answer = async (i: number, heard?: string) => {
    if (busy || idx >= turns.length) return;
    setBusy(true);
    question.current++;
    clearIdle();
    tts?.cancel();
    const a = turns[idx].a[i];
    setMsgs((m) => [...m, { who: 'me', text: heard || a.t }]);
    const my = run.current;
    if (!(await say(a.r))) return;
    await sleep(500);
    if (my === run.current) ask(idx + 1);
  };

  const listen = () => {
    if (!SR || busy || listening) return;
    tts?.cancel();
    clearIdle();
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.interimResults = false;
    rec.onresult = (e: { results: { 0: { transcript: string } }[] }) => {
      const said = e.results[0][0].transcript.trim();
      if (!said) return;
      const opts = turns[idx].a;
      const hit = opts.findIndex((o) => o.k.some((k) => said.includes(k)));
      answer(hit < 0 ? opts.length - 1 : hit, said);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    try { rec.start(); setListening(true); } catch { setListening(false); }
  };

  const toggleSound = () => {
    if (soundOn) tts?.cancel();
    app.set((s) => ({ ...s, settings: { ...s.settings, soundOn: !s.settings.soundOn } }));
  };

  const done = idx >= turns.length && !busy;

  return (
    <Screen title={`${josa(name, "과", "와")} 이야기하기`} back={P.home}>
      <div className="as-talk-head">
        <PetArt kind={kind} size={96} />
        <div className="stack" style={{ gap: 8 }}>
          <button type="button" className="chip" aria-pressed={soundOn} onClick={toggleSound} disabled={!tts}>
            <Icon name="speaker" size={20} /> {!tts ? '소리 지원 안 됨' : soundOn ? '소리 켜짐' : '소리 꺼짐'}
          </button>
          <button type="button" className="chip" onClick={() => lastAi.current && speak(lastAi.current, true)} disabled={!tts}>다시 듣기</button>
        </div>
      </div>
      <div className="as-log" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`as-msg ${m.who}`}>
            {m.who === 'ai' && <b>{name}</b>}
            {m.text}
          </div>
        ))}
        {typing && <div className="as-typing" aria-hidden="true">{josa(name, "이", "가")} 말하는 중…</div>}
        <div ref={logEnd} />
      </div>
      <div className="stack">
        {!done && idx < turns.length && turns[idx].a.map((a, i) => (
          <button key={a.t} type="button" className="choice" disabled={busy} onClick={() => answer(i)}>
            <strong>{a.t}</strong>
          </button>
        ))}
        {!done && SR && (
          <Button variant="secondary" onClick={listen} disabled={busy || listening}>
            <Icon name="mic" /> {listening ? '듣는 중…' : '말로 대답하기'}
          </Button>
        )}
        {done && <>
          <Button onClick={begin}>처음부터 다시 이야기하기</Button>
          <Button variant="secondary" to={P.home}>홈으로</Button>
        </>}
      </div>
      <p className="small">정해진 대본으로 진행되는 데모예요.</p>
    </Screen>
  );
}
