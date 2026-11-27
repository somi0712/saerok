import type { DiaryEntry } from '@/store/state';
import { shuffle } from './bank';

// 내 일기로 훈련하기 — 일기 문장에서 ‘어디에서 · 무엇을’ 일화기억 문제를 만든다 (노션 정보 구조 › 기록 · 일기 작성과 활용).
// ponytail: 규칙 기반 문장 분석 — ‘~에서/에 … ~을/를 …했어요’ 꼴만 읽는다. 더 자유로운 문장은 LLM 활용 논의 때 바꾼다.

export interface DiaryQ { q: string; a: string; o: string[]; h: string }

/** 일기 기분: 이모지 + 글 */
export const MOODS = ['😊 기뻐요', '😌 편안해요', '🙂 그저 그래요', '😪 피곤해요', '😢 속상해요', '😠 화나요'];

const FILL_OBJ = ['사과', '두부', '우유', '책', '커피', '빵', '꽃', '약', '신문', '편지', '친구', '이웃'];
const FILL_PLACE = ['공원', '시장', '약국', '복지관', '은행', '카페', '도서관', '병원', '마트', '우체국'];
const TIME_WORDS = /^(오늘|어제|아침|점심|저녁|오전|오후|밤|낮|새벽|주말|\d+시)$/;
const batchim = (w: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0; };
const eul = (w: string) => w + (batchim(w) ? '을' : '를');
const firstHint = (w: string) => `첫 글자는 ‘${w[0]}’${batchim(w[0]) ? '이에요' : '예요'}.`;

/** ‘샀어요’·‘먹었다’ → ‘샀나요’·‘먹었나요’ */
export const asQuestion = (verb: string) => verb.replace(/[.!~]+$/, '').replace(/(어요|아요|어|다|요)$/, '') + '나요';

/** 문장 하나에서 장소(에서/에)·대상(을/를)·동사를 찾는다 */
export function parseSentence(s: string) {
  const words = s.trim().split(/\s+/);
  let place: string | undefined, obj: string | undefined, verb: string | undefined;
  words.forEach((w, i) => {
    const pm = w.match(/^(.+?)(에서|에)$/);
    if (pm && !place && !TIME_WORDS.test(pm[1])) place = pm[1];
    const om = w.match(/^(.+?)(을|를)$/);
    if (om && !obj && words[i + 1]) { obj = om[1]; verb = words[i + 1]; }
  });
  return { place, obj, verb };
}

export function diaryQuestions(e: DiaryEntry, others: DiaryEntry[] = [], r: () => number = Math.random): DiaryQ[] {
  const sentences = e.text.split(/(?<=[.!?。])\s+|\n+/).map(parseSentence);
  const parsed = (list: DiaryEntry[]) => list.flatMap((d) => d.text.split(/(?<=[.!?。])\s+|\n+/).map(parseSentence));
  const words = (list: DiaryEntry[], k: 'obj' | 'place') => parsed(list).map((p) => p[k]).filter(Boolean) as string[];
  // 보기는 같은 종류끼리: 무엇을 → 물건·사람, 어디에서 → 장소. 이 일기에 나온 다른 낱말은 헷갈리지 않게 뺀다.
  const pick3 = (a: string, k: 'obj' | 'place') => {
    const mine = [...words([e], 'obj'), ...words([e], 'place')];
    const pool = [...new Set([...words(others, k), ...(k === 'obj' ? FILL_OBJ : FILL_PLACE)])];
    return shuffle(pool.filter((x) => x !== a && !mine.includes(x)), r).slice(0, 3);
  };
  const qs: DiaryQ[] = [];
  for (const { place, obj, verb } of sentences) {
    if (!obj || !verb) continue;
    const v = asQuestion(verb);
    const who = /만났|봤|보았/.test(verb) ? '누구를' : '무엇을';
    qs.push({ q: `${place ? `${place}에서 ` : ''}${who} ${v}?`, a: obj, o: pick3(obj, 'obj'), h: firstHint(obj) });
    if (place) qs.push({ q: `어디에서 ${eul(obj)} ${v}?`, a: place, o: pick3(place, 'place'), h: firstHint(place) });
  }
  if (e.mood) {
    qs.push({ q: '이 일기를 쓴 날 기분은 어땠나요?', a: e.mood, o: shuffle(MOODS.filter((m) => m !== e.mood), r).slice(0, 3), h: '일기 위쪽에 적어 둔 기분을 떠올려 보세요.' });
  }
  return qs.filter((q) => q.o.length === 3).slice(0, 5);
}
