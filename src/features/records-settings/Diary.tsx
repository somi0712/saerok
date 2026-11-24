import { useEffect, useRef, useState } from 'react';
import { Button, Card, Screen, toast } from '@/design/ui';
import { P } from '@/app/paths';
import { app, uid, useApp, type AppState, type DiaryEntry } from '@/store/state';
import { shortDate } from './logic';
import './records.css';

const MOODS = ['상쾌해요', '편안해요', '그저 그래요', '피곤해요', '속상해요'];
const MAX_REC_MS = 60_000;
const canRecord = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

/** 사진을 긴 변 480px 이하 JPEG 로 줄인다 (저장 용량 절약) */
async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = fail;
      i.src = url;
    });
    const k = Math.min(1, 480 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = fail;
    r.readAsDataURL(b);
  });

/**
 * 저장 공간이 모자라면 false. 저장소 자체를 못 쓰는 브라우저면 화면 안에서만 쓰도록 true.
 * ponytail: localStorage(약 5MB) 한계 — 사진·음성이 많아지면 서버 저장소로 옮긴다.
 */
function fits(next: AppState): boolean {
  try {
    localStorage.setItem('saerok-app-v1', JSON.stringify(next));
    return true;
  } catch (e) {
    return !(e instanceof DOMException && /quota/i.test(e.name));
  }
}

function Recorder({ audio, onChange }: { audio?: string; onChange: (a?: string) => void }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [sec, setSec] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => () => clearInterval(timer.current), []);

  if (!canRecord) return null;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timer.current);
        setRec(null);
        onChange(await blobToDataUrl(new Blob(chunks, { type: r.mimeType })));
      };
      r.start();
      setRec(r);
      setSec(0);
      const t0 = Date.now();
      timer.current = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        setSec(s);
        if (Date.now() - t0 >= MAX_REC_MS && r.state === 'recording') r.stop();
      }, 250);
    } catch {
      toast('마이크를 쓸 수 없어요. 글이나 사진으로 남겨 주세요.');
    }
  };

  return (
    <div className="stack">
      <span className="rs-label">음성 메모 (최대 1분)</span>
      {rec ? (
        <Button variant="secondary" onClick={() => rec.stop()}>녹음 마치기 · {sec}초</Button>
      ) : (
        <Button variant="secondary" onClick={start}>{audio ? '다시 녹음하기' : '목소리로 남기기'}</Button>
      )}
      {audio && !rec && (
        <div className="row">
          <audio controls src={audio} aria-label="방금 녹음한 음성 메모" />
          <button type="button" className="chip" onClick={() => onChange(undefined)}>음성 빼기</button>
        </div>
      )}
    </div>
  );
}

function Entry({ e }: { e: DiaryEntry }) {
  const [asking, setAsking] = useState(false);
  const remove = () => {
    app.set((s) => ({ ...s, diary: s.diary.filter((d) => d.id !== e.id) }));
    toast('기록을 지웠어요.');
  };
  return (
    <article className="card rs-entry">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="small">{shortDate(e.at)}</span>
        <span className="chip">{e.mood}</span>
      </div>
      {e.text && <p style={{ whiteSpace: 'pre-wrap' }}>{e.text}</p>}
      {e.photo && <img src={e.photo} alt={`${shortDate(e.at)}에 남긴 사진`} />}
      {e.audio && <audio controls src={e.audio} aria-label={`${shortDate(e.at)} 음성 메모`} />}
      {asking ? (
        <div className="card card-lavender rs-confirm">
          <p>이 기록을 지울까요? 지우면 되돌릴 수 없어요.</p>
          <Button onClick={remove}>지우기</Button>
          <Button variant="secondary" onClick={() => setAsking(false)}>그대로 두기</Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setAsking(true)}>이 기록 지우기</Button>
      )}
    </article>
  );
}

/** 노션 1주차: 일기장/기억 기록 (글, 그림, 사진, 음성) */
export default function Diary() {
  const diary = useApp((s) => s.diary);
  const [writing, setWriting] = useState(false);
  const [mood, setMood] = useState('');
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [audio, setAudio] = useState<string>();
  const list = [...diary].sort((a, b) => b.at.localeCompare(a.at));

  const pickPhoto = async (f?: File) => {
    if (!f) return;
    try {
      setPhoto(await shrinkPhoto(f));
    } catch {
      toast('사진을 불러오지 못했어요. 다른 사진으로 해 주세요.');
    }
  };

  const save = () => {
    const entry: DiaryEntry = { id: uid(), at: new Date().toISOString(), mood, text: text.trim(), photo, audio };
    const next = { ...app.get(), diary: [entry, ...app.get().diary] };
    if (!fits(next)) {
      toast('저장 공간이 모자라요. 사진이나 음성을 빼고 다시 저장해 주세요. 쓴 글은 그대로 있어요.');
      return;
    }
    app.set(next);
    setMood('');
    setText('');
    setPhoto(undefined);
    setAudio(undefined);
    setWriting(false);
    toast('오늘의 기억을 남겼어요.');
  };

  if (writing) {
    return (
      <Screen title="오늘 기록하기" back={P.diary}
        footer={<Button onClick={save} disabled={!mood || (!text.trim() && !photo && !audio)}>저장하기</Button>}>
        <div className="stack">
          <span id="mood-l" className="rs-label">오늘 기분은 어떠세요?</span>
          <div className="rs-chips" role="group" aria-labelledby="mood-l">
            {MOODS.map((m) => (
              <button key={m} type="button" className="chip rs-mood" aria-pressed={mood === m} onClick={() => setMood(m)}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <label className="stack">
          <span className="rs-label">오늘 가장 기억에 남는 일은 무엇이었나요?</span>
          <textarea id="diary-text" className="rs-text" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="예: 복지관에서 친구와 차를 마셨어요." maxLength={1000} />
        </label>
        <div className="stack">
          <span className="rs-label">사진</span>
          {photo && <img src={photo} alt="고른 사진 미리보기" className="rs-preview" />}
          <label className="btn btn-secondary" style={{ position: 'relative' }}>
            {photo ? '다른 사진 고르기' : '사진 넣기'}
            <input className="rs-file" type="file" accept="image/*" capture="environment"
              onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </label>
          {photo && <Button variant="ghost" onClick={() => setPhoto(undefined)}>사진 빼기</Button>}
        </div>
        <Recorder audio={audio} onChange={setAudio} />
        <p className="small">기록은 이 기기에만 저장돼요. 가족에게는 내가 허락할 때만 보여요.</p>
      </Screen>
    );
  }

  return (
    <Screen title="기억 일기장" back={P.records}
      footer={<Button onClick={() => setWriting(true)}>오늘 기록하기</Button>}>
      <span className="rs-tag">기억 일기장</span>
      <h2 className="title">오늘을 글, 사진, 목소리로 남겨요.</h2>
      {list.length === 0 ? (
        <Card tone="lavender">
          <p className="rs-h">아직 남긴 기록이 없어요.</p>
          <p className="sub">오늘 있었던 작은 일 하나면 충분해요.</p>
        </Card>
      ) : (
        list.map((e) => <Entry key={e.id} e={e} />)
      )}
    </Screen>
  );
}
