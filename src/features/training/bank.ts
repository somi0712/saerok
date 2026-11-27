import type { ModuleId } from '@/store/state';

// 훈련 문항은행 — 노션 「정보 구조」(A안 공모전 시연): 10레벨 × 레벨당 최소 50문항, 테스트 문항과 따로 관리.
// 영역마다 레벨에 따라 길이·단계 수가 늘어나는 문항 틀에서 문항을 만든다. 같은 시드는 늘 같은 문항을 만든다.

export interface Item {
  id: string;
  area: ModuleId;
  level: number;
  memo?: string; // 먼저 보고 기억할 내용. 이 단계가 끝난 뒤부터 15초를 잰다.
  q: string;
  a: string;
  o: string[]; // 다른 보기 3개
  h: string;
}
type Draft = Omit<Item, 'id' | 'area' | 'level'>;
type Rand = () => number;

/** mulberry32 */
export function rng(seed: number): Rand {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T,>(r: Rand, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
export function shuffle<T>(xs: readonly T[], r: Rand = Math.random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const sample = <T,>(r: Rand, xs: readonly T[], n: number) => shuffle(xs, r).slice(0, n);
/** 정답과 다른 보기 3개. 앞쪽 후보를 먼저 쓰고 모자라면 pool에서 채운다. */
function others(r: Rand, a: string, first: readonly string[], pool: readonly string[] = []) {
  const out: string[] = [];
  for (const x of [...shuffle(first, r), ...shuffle(pool, r)]) if (x !== a && !out.includes(x) && out.length < 3) out.push(x);
  return out;
}

const batchim = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
};
const eul = (w: string) => w + (batchim(w) ? '을' : '를');
const iga = (w: string) => w + (batchim(w) ? '이' : '가');
const eun = (w: string) => w + (batchim(w) ? '은' : '는');
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
export const choOf = (w: string) => CHO[Math.floor((w.charCodeAt(0) - 0xac00) / 588)];
const firstSyllable = (cho: string) => String.fromCharCode(0xac00 + CHO.indexOf(cho) * 588);

/* ── 의미기억(지남력): 일반 지식 · 날짜·요일 파악 ── */
const DAYS = '일월화수목금토';
const MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const md = (m: number, d: number) => `${m}월 ${d}일`;
function addDays(m: number, d: number, n: number): [number, number] {
  d += n;
  while (d > MD[m - 1]) { d -= MD[m - 1]; m = (m % 12) + 1; }
  while (d < 1) { m = ((m + 10) % 12) + 1; d += MD[m - 1]; }
  return [m, d];
}
const FACTS: [string, string, string[], string][] = [
  ['우편을 보낼 때 가는 곳은 어디인가요?', '우체국', ['약국', '은행', '시장'], '편지와 소포를 보내는 곳이에요.'],
  ['물이 얼면 무엇이 되나요?', '얼음', ['구름', '눈물', '이슬'], '겨울 냇가에서 볼 수 있어요.'],
  ['몸의 온도를 재는 물건은 무엇인가요?', '체온계', ['저울', '시계', '자'], '열이 나는지 볼 때 써요.'],
  ['추석에 먹는 반달 모양의 떡은 무엇인가요?', '송편', ['절편', '인절미', '가래떡'], '솔잎을 깔고 쪄요.'],
  ['봄 다음에 오는 계절은 무엇인가요?', '여름', ['겨울', '가을', '봄'], '덥고 비가 많이 와요.'],
  ['소의 새끼는 무엇이라고 부르나요?', '송아지', ['망아지', '강아지', '병아리'], '‘송’으로 시작해요.'],
  ['일주일은 며칠인가요?', '7일', ['5일', '6일', '10일'], '월요일부터 일요일까지 세어 보세요.'],
  ['설날에 먹는 대표 음식은 무엇인가요?', '떡국', ['송편', '팥죽', '냉면'], '한 그릇 먹으면 한 살 더 먹는다고 해요.'],
  ['동짓날에 먹는 음식은 무엇인가요?', '팥죽', ['떡국', '삼계탕', '송편'], '붉은 팥으로 쑤어요.'],
  ['해가 뜨는 쪽은 어느 쪽인가요?', '동쪽', ['서쪽', '남쪽', '북쪽'], '해는 서쪽으로 져요.'],
  ['한 해는 몇 달인가요?', '12달', ['10달', '11달', '13달'], '1월부터 12월까지예요.'],
  ['불이 났을 때 거는 전화번호는 무엇인가요?', '119', ['112', '114', '120'], '구급차도 같은 번호로 불러요.'],
  ['범죄 신고 전화번호는 무엇인가요?', '112', ['119', '114', '111'], '경찰을 부르는 번호예요.'],
  ['우리나라의 수도는 어디인가요?', '서울', ['부산', '대전', '인천'], '청와대와 경복궁이 있는 도시예요.'],
  ['무지개는 보통 몇 가지 색으로 말하나요?', '7가지', ['5가지', '6가지', '9가지'], '빨주노초파남보를 세어 보세요.'],
  ['한글을 만든 임금은 누구인가요?', '세종대왕', ['태조', '정조', '영조'], '만 원짜리 지폐에 있어요.'],
  ['2월은 보통 며칠까지 있나요?', '28일', ['30일', '31일', '29일'], '네 해마다 하루가 늘어요.'],
  ['한 시간은 몇 분인가요?', '60분', ['30분', '100분', '50분'], '시계 긴바늘이 한 바퀴 도는 시간이에요.'],
  ['어린이날은 몇 월 며칠인가요?', '5월 5일', ['6월 6일', '3월 1일', '10월 3일'], '가정의 달에 있어요.'],
  ['광복절은 몇 월 며칠인가요?', '8월 15일', ['3월 1일', '10월 9일', '6월 25일'], '한여름 8월이에요.'],
  ['한글날은 몇 월 며칠인가요?', '10월 9일', ['10월 3일', '8월 15일', '5월 5일'], '가을 10월이에요.'],
  ['삼일절은 몇 월 며칠인가요?', '3월 1일', ['3월 3일', '8월 15일', '1월 1일'], '이름에 날짜가 들어 있어요.'],
  ['개천절은 몇 월 며칠인가요?', '10월 3일', ['10월 9일', '3월 1일', '12월 25일'], '하늘이 열린 날, 가을이에요.'],
  ['현충일은 몇 월 며칠인가요?', '6월 6일', ['5월 5일', '6월 25일', '7월 17일'], '초여름 6월, 같은 숫자 두 개예요.'],
];
function semantic(r: Rand, level: number): Draft {
  if (r() < 0.2) {
    const f = level <= 5 ? FACTS.slice(0, 14) : FACTS.slice(10);
    const [q, a, o, h] = pick(r, f);
    return { q, a, o, h };
  }
  const m = int(r, 1, 12), d = int(r, 1, MD[m - 1]), w = int(r, 0, 6);
  const n = level <= 2 ? 1 : level <= 4 ? int(r, 2, 3) : level <= 6 ? int(r, 4, 12) : level <= 8 ? int(r, 5, 20) : int(r, 20, 45);
  const when = n === 1 ? '내일' : `${n}일 뒤`;
  if (level <= 6) {
    const a = `${DAYS[(w + n) % 7]}요일`;
    return {
      q: `오늘이 ${md(m, d)} ${DAYS[w]}요일이라면, ${when}은 무슨 요일일까요?`,
      a, o: others(r, a, [...DAYS].map((x) => `${x}요일`)),
      h: n >= 7 ? '7일이 지나면 같은 요일로 돌아와요. 7을 빼고 남은 날만 세어 보세요.' : '오늘 요일부터 하루씩 손가락으로 세어 보세요.',
    };
  }
  const date = (k: number) => md(...addDays(m, d, k));
  const hint = `${m}월은 ${MD[m - 1]}일까지 있어요.`;
  if (level <= 8) {
    const a = date(n);
    return { q: `오늘이 ${md(m, d)}이라면, ${when}는 몇 월 며칠일까요?`, a, o: others(r, a, [date(n - 1), date(n + 1), date(n + 2), date(n - 2)]), h: hint };
  }
  const day = (k: number) => `${DAYS[(((w + k) % 7) + 7) % 7]}요일`;
  const a = `${date(n)} ${day(n)}`;
  return {
    q: `오늘이 ${md(m, d)} ${DAYS[w]}요일이라면, ${when}는 몇 월 며칠, 무슨 요일일까요?`,
    a, o: others(r, a, [`${date(n)} ${day(n + 1)}`, `${date(n + 1)} ${day(n + 1)}`, `${date(n - 1)} ${day(n)}`, `${date(n + 1)} ${day(n)}`]),
    h: `${hint} 요일은 7일마다 같아져요.`,
  };
}

/* ── 일화기억: 들은 이야기 · 사건 정보 회상 ── */
const NAMES = ['민수', '영희', '지은', '철수', '수진', '현우', '하은', '도윤', '서연', '준호', '미경', '순자', '정훈', '유나'];
const EVENTS = [
  { place: '시장', did: '사과를 샀어요', what: '사과를 산 곳' },
  { place: '약국', did: '감기약을 샀어요', what: '감기약을 산 곳' },
  { place: '도서관', did: '책을 빌렸어요', what: '책을 빌린 곳' },
  { place: '우체국', did: '소포를 보냈어요', what: '소포를 보낸 곳' },
  { place: '공원', did: '산책을 했어요', what: '산책을 한 곳' },
  { place: '병원', did: '진료를 받았어요', what: '진료를 받은 곳' },
  { place: '은행', did: '돈을 찾았어요', what: '돈을 찾은 곳' },
  { place: '카페', did: '커피를 마셨어요', what: '커피를 마신 곳' },
  { place: '빵집', did: '식빵을 샀어요', what: '식빵을 산 곳' },
  { place: '미용실', did: '머리를 잘랐어요', what: '머리를 자른 곳' },
  { place: '꽃집', did: '화분을 샀어요', what: '화분을 산 곳' },
  { place: '복지관', did: '노래 교실에 갔어요', what: '노래 교실에 간 곳' },
];
const TIMES = ['오전 8시', '오전 9시', '오전 10시', '오전 11시', '낮 12시', '오후 1시', '오후 2시', '오후 3시', '오후 4시', '오후 5시'];
const ORD = ['첫 번째', '두 번째', '세 번째', '네 번째'];
function episodic(r: Rand, level: number): Draft {
  const k = level <= 2 ? 1 : level <= 6 ? 2 : level <= 8 ? 3 : 4;
  const name = pick(r, NAMES);
  const evs = sample(r, EVENTS, k);
  const times = level >= 7 ? sample(r, TIMES.map((_, i) => i), k).sort((a, b) => a - b).map((i) => TIMES[i]) : null;
  const memo = evs.map((e, i) => `${i === 0 ? `${name}씨는 ` : '그다음 '}${times ? `${times[i]}에 ` : ''}${e.place}에서 ${e.did}.`).join(' ');
  const types = ['place', 'did', ...(k >= 2 && level >= 5 ? ['order', 'order'] : []), ...(k >= 3 ? ['after'] : []), ...(times ? ['time', 'time'] : [])];
  const i = int(r, 0, k - 1);
  const e = evs[i];
  const places = EVENTS.map((x) => x.place);
  const story = evs.map((x) => x.place);
  const first = (a: string) => `첫 글자는 ‘${a[0]}’${batchim(a[0]) ? '이에요' : '예요'}.`;
  switch (pick(r, types)) {
    case 'did':
      return { memo, q: `${name}씨가 ${e.place}에서 한 일은 무엇인가요?`, a: e.did, o: others(r, e.did, evs.map((x) => x.did), EVENTS.map((x) => x.did)), h: `${e.place}에 간 장면을 떠올려 보세요.` };
    case 'order':
      return { memo, q: `${name}씨가 ${ORD[i]}로 간 곳은 어디인가요?`, a: e.place, o: others(r, e.place, story, places), h: `‘그다음’으로 이어진 순서를 처음부터 떠올려 보세요. ${first(e.place)}` };
    case 'after': {
      const j = Math.min(i, k - 2);
      const a = evs[j + 1].place;
      return { memo, q: `${name}씨가 ${evs[j].place}에 다녀온 다음 간 곳은 어디인가요?`, a, o: others(r, a, story, places), h: first(a) };
    }
    case 'time': {
      const a = times![i];
      return { memo, q: `${name}씨가 ${e.place}에 간 시간은 언제인가요?`, a, o: others(r, a, times!, TIMES), h: '시간은 이른 순서대로 나왔어요.' };
    }
    default:
      return { memo, q: `${name}씨가 ${eun(e.what)} 어디인가요?`, a: e.place, o: others(r, e.place, story, places), h: first(e.place) };
  }
}

/* ── 작업기억: 정보 잠깐 유지 · 역순·재배열 ── */
const WORDS = ['사과', '모자', '기차', '하늘', '구름', '바다', '시계', '안경', '우산', '열쇠', '연필', '의자', '나무', '신발', '편지', '라디오', '가방', '수건'];
const SPAN = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7];
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
/** 헷갈리기 쉬운 오답: 처음 순서 · 이웃 둘 바꾸기 · 하나만 다른 것 */
function variants(r: Rand, a: string[], sep: string, base: string[], pool: readonly string[]) {
  const swap = (xs: string[], i: number) => { const c = [...xs]; [c[i], c[i + 1]] = [c[i + 1], c[i]]; return c; };
  const change = (i: number) => { const c = [...a]; c[i] = pick(r, pool.filter((x) => !a.includes(x))); return c; };
  return [base, swap(a, 0), swap(a, a.length - 2), change(0), change(a.length - 1), shuffle(a, r)].map((x) => x.join(sep));
}
function working(r: Rand, level: number): Draft {
  const span = SPAN[level - 1];
  const kind = pick(r, level <= 2 ? ['digits', 'words'] : level <= 3 ? ['digits', 'words', 'sort'] : ['digits', 'sort', 'words', 'money']);
  if (kind === 'money') {
    const paid = level <= 6 ? 5000 : 10000;
    const price = level <= 6 ? int(r, 11, 49) * 100 : int(r, 11, 45) * 100 + int(r, 11, 45) * 100;
    const what = level <= 6 ? `${won(price)}짜리 빵을` : `빵과 우유를 모두 ${won(price)}어치`;
    const a = won(paid - price);
    return {
      q: `${won(paid)}을 내고 ${what} 샀어요. 거스름돈은 얼마일까요?`,
      a, o: others(r, a, [won(paid - price + 100), won(paid - price - 100), won(paid - price + 1000), won(Math.abs(paid - price - 1000))]),
      h: '먼저 천 원 단위를 빼고, 남은 백 원 단위를 빼 보세요.',
    };
  }
  if (kind === 'words') {
    const ws = sample(r, WORDS, Math.min(span, 5));
    const a = [...ws].reverse();
    return { memo: `낱말을 순서대로 기억해 주세요.\n${ws.join(' · ')}`, q: '방금 본 낱말을 거꾸로 말하면 어떻게 될까요?', a: a.join(' · '), o: others(r, a.join(' · '), variants(r, a, ' · ', ws, WORDS)), h: `마지막 낱말 ‘${ws.at(-1)}’부터 시작해요.` };
  }
  const ds = kind === 'sort' ? sample(r, [1, 2, 3, 4, 5, 6, 7, 8, 9], span).map(String) : Array.from({ length: span }, () => String(int(r, 1, 9)));
  if (new Set(ds).size === 1) ds[0] = String((Number(ds[0]) % 9) + 1);
  const a = kind === 'sort' ? [...ds].sort() : [...ds].reverse();
  const q = kind === 'sort' ? '방금 본 숫자를 작은 수부터 늘어놓으면 어떻게 될까요?' : '방금 본 숫자를 거꾸로 말하면 어떻게 될까요?';
  const h = kind === 'sort' ? `가장 작은 수 ${a[0]}부터 시작해요.` : `마지막 숫자 ${ds.at(-1)}부터 시작해요.`;
  return { memo: `숫자를 순서대로 기억해 주세요.\n${ds.join(' - ')}`, q, a: a.join(' - '), o: others(r, a.join(' - '), variants(r, a, ' - ', ds, ['1', '2', '3', '4', '5', '6', '7', '8', '9'])), h };
}

/* ── 시공간: 위치·방향 · 공간 관계 ── */
const DIRS = ['북', '동', '남', '서'];
const SPOTS = ['나무', '우체통', '자동차', '의자', '자전거', '꽃밭', '벤치', '가로등', '분수', '정자'];
const CELLS = [['왼쪽 위', '가운데 위', '오른쪽 위'], ['왼쪽 가운데', '가운데', '오른쪽 가운데'], ['왼쪽 아래', '가운데 아래', '오른쪽 아래']];
function spatial(r: Rand, level: number): Draft {
  const kind = pick(r, level <= 2 ? ['compass', 'compass', 'mirror'] : level <= 4 ? ['compass', 'turn'] : ['turn', 'grid']);
  if (kind === 'mirror') {
    const obj = pick(r, ['컵', '주전자', '가방', '국자', '머그잔']);
    const side = pick(r, ['왼쪽', '오른쪽']);
    const a = side === '왼쪽' ? '오른쪽' : '왼쪽';
    return { q: `손잡이가 ${side}에 있는 ${eul(obj)} 거울에 비추면, 손잡이는 어느 쪽에 보일까요?`, a, o: [side, '위쪽', '아래쪽'], h: '거울에서는 왼쪽과 오른쪽이 바뀌어 보여요.' };
  }
  if (kind === 'compass') {
    const objs = sample(r, SPOTS, 4);
    const layout = `집을 가운데에 두고 북쪽에 ${objs[0]}, 동쪽에 ${objs[1]}, 남쪽에 ${objs[2]}, 서쪽에 ${iga(objs[3])} 있어요.`;
    const i = int(r, 0, 3);
    if (level <= 2) return { q: `${layout} ${DIRS[i]}쪽에 있는 것은 무엇인가요?`, a: objs[i], o: others(r, objs[i], objs), h: '북쪽은 위, 남쪽은 아래, 동쪽은 오른쪽, 서쪽은 왼쪽이에요.' };
    const a = objs[(i + 2) % 4];
    return { q: `${layout} 집을 사이에 두고 ${objs[i]}의 맞은편에 있는 것은 무엇인가요?`, a, o: others(r, a, objs), h: '북쪽의 맞은편은 남쪽, 동쪽의 맞은편은 서쪽이에요.' };
  }
  if (kind === 'turn') {
    const t = level <= 4 ? 1 : level <= 6 ? 2 : level <= 8 ? 3 : 4;
    const start = int(r, 0, 3);
    const moves = Array.from({ length: t }, () => pick(r, level >= 7 ? ['오른쪽', '왼쪽', '뒤'] : ['오른쪽', '왼쪽']));
    const end = moves.reduce((f, m) => (f + (m === '오른쪽' ? 1 : m === '왼쪽' ? 3 : 2)) % 4, start);
    const a = `${DIRS[end]}쪽`;
    const path = moves.map((m) => (m === '뒤' ? '뒤로' : `${m}으로`)).join(', ');
    return { q: `${DIRS[start]}쪽을 보고 서 있어요. ${path} 차례로 돌면 어느 쪽을 보고 있을까요?`, a, o: others(r, a, DIRS.map((d) => `${d}쪽`)), h: '오른쪽으로 돌 때마다 북 → 동 → 남 → 서 순서로 한 칸씩 옮겨 가요.' };
  }
  const n = level <= 6 ? 2 : level <= 8 ? 3 : 4;
  let [y, x] = [int(r, 0, 2), int(r, 0, 2)];
  const startName = CELLS[y][x];
  const steps: string[] = [];
  const opts = [[-1, 0, '위로'], [1, 0, '아래로'], [0, -1, '왼쪽으로'], [0, 1, '오른쪽으로']] as const;
  for (let s = 0; s < n; s++) {
    const ok = opts.filter(([dy, dx]) => y + dy >= 0 && y + dy <= 2 && x + dx >= 0 && x + dx <= 2);
    const [dy, dx, word] = pick(r, ok);
    y += dy; x += dx;
    steps.push(`${word} 1칸`);
  }
  const a = `${CELLS[y][x]} 칸`;
  return { q: `가로세로 3칸씩인 칸판의 ${startName} 칸에서 ${steps.join(', ')} 움직이면 어느 칸에 있을까요?`, a, o: others(r, a, CELLS.flat().map((c) => `${c} 칸`)), h: '한 번에 한 칸씩 손가락으로 따라가 보세요.' };
}

/* ── 언어유창성: 범주·첫소리 · 단어 떠올리기 ── */
const CATS: Record<string, string[]> = {
  과일: ['사과', '포도', '귤', '감', '수박', '참외', '딸기', '복숭아', '바나나', '자두', '키위', '망고', '레몬', '대추'],
  채소: ['배추', '무', '당근', '오이', '고추', '감자', '고구마', '양파', '시금치', '가지', '호박', '마늘', '버섯', '상추'],
  동물: ['고양이', '강아지', '소', '말', '돼지', '토끼', '사자', '호랑이', '곰', '기린', '다람쥐', '여우', '원숭이', '염소'],
  탈것: ['버스', '기차', '자전거', '비행기', '택시', '지하철', '오토바이', '트럭', '헬리콥터', '유람선'],
  가구: ['의자', '책상', '침대', '소파', '옷장', '식탁', '서랍장', '책장', '화장대'],
  옷: ['바지', '치마', '셔츠', '양말', '모자', '장갑', '목도리', '외투', '조끼'],
  악기: ['피아노', '기타', '북', '장구', '가야금', '바이올린', '피리', '하모니카', '드럼'],
  직업: ['의사', '교사', '경찰', '소방관', '요리사', '농부', '기자', '간호사', '미용사'],
};
const CAT_HINT: Record<string, string> = {
  과일: '나무나 덩굴에 열리는 달콤한 먹거리예요.', 채소: '밭에서 길러 반찬으로 먹어요.', 동물: '숨 쉬고 움직이는 생명이에요.',
  탈것: '사람이 타고 이동해요.', 가구: '집 안에 두고 쓰는 큰 살림이에요.', 옷: '몸에 입거나 걸쳐요.', 악기: '소리를 내어 연주해요.', 직업: '사람이 하는 일의 이름이에요.',
};
const CAT_NAMES = Object.keys(CATS);
const ALL_WORDS = CAT_NAMES.flatMap((c) => CATS[c]);
function verbal(r: Rand, level: number): Draft {
  const kind = pick(r, level <= 2 ? ['member'] : level <= 3 ? ['member', 'odd'] : level <= 5 ? ['odd', 'initial'] : level <= 7 ? ['initial', 'initial', 'both'] : ['both', 'both', 'initial']);
  const cat = pick(r, CAT_NAMES);
  const rest = CAT_NAMES.filter((c) => c !== cat).flatMap((c) => CATS[c]);
  if (kind === 'member') {
    const a = pick(r, CATS[cat]);
    return { q: `다음 중 ${eun(cat)} 무엇인가요?`, a, o: others(r, a, rest), h: CAT_HINT[cat] };
  }
  if (kind === 'odd') {
    const a = pick(r, rest);
    return { q: '다음 중 종류가 다른 하나는 무엇인가요?', a, o: sample(r, CATS[cat], 3), h: `나머지 셋은 모두 ${cat}예요.`.replace(/(.)예요/, (_, c) => (batchim(c) ? `${c}이에요` : `${c}예요`)) };
  }
  if (kind === 'initial') {
    const a = pick(r, ALL_WORDS);
    const ch = choOf(a);
    return { q: `첫소리가 ‘${ch}’인 낱말은 무엇인가요?`, a, o: others(r, a, ALL_WORDS.filter((w) => choOf(w) !== ch)), h: `‘${ch}’에 ‘ㅏ’를 붙이면 ‘${firstSyllable(ch)}’ 소리가 나요.` };
  }
  const a = pick(r, CATS[cat]);
  const ch = choOf(a);
  const sameCat = CATS[cat].filter((w) => choOf(w) !== ch);
  const sameCho = rest.filter((w) => choOf(w) === ch);
  const o = others(r, a, [...sample(r, sameCat, 2), ...sample(r, sameCho, 2)], rest.filter((w) => choOf(w) !== ch));
  return { q: `첫소리가 ‘${ch}’이면서 ${cat}인 것은 무엇인가요?`, a, o, h: `${CAT_HINT[cat]} ‘${firstSyllable(ch)}’ 소리로 시작해요.` };
}

const GEN: Record<ModuleId, (r: Rand, level: number) => Draft> = { A: semantic, B: episodic, C: working, D: spatial, E: verbal };
export const PER_LEVEL = 60;
const cache = new Map<string, Item[]>();

/** 영역·레벨별 문항 (중복 없이 PER_LEVEL개) */
export function itemsFor(area: ModuleId, level: number): Item[] {
  const key = area + level;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = rng(area.charCodeAt(0) * 1000 + level);
  const seen = new Set<string>();
  const items: Item[] = [];
  for (let tries = 0; items.length < PER_LEVEL && tries < 5000; tries++) {
    const d = GEN[area](r, level);
    const sig = `${d.memo ?? ''}|${d.q}|${d.a}`;
    if (seen.has(sig) || d.o.length !== 3) continue;
    seen.add(sig);
    items.push({ ...d, id: `${area}${level}-${items.length}`, area, level });
  }
  cache.set(key, items);
  return items;
}
