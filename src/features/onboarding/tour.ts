import type { FontSize } from '@/store/state';

export const FONT_LABEL: Record<FontSize, string> = { 20: '보통', 22: '크게', 24: '아주 크게' };

export const AGE_BANDS = ['50대', '60대', '70대', '80대 이상', '기타'];
export const GENDERS = ['여성', '남성', '비공개'];
export const FAMILIARITY = [
  { value: '잘 알고 있어요', desc: '나에게 맞는 방법이 있어요.' },
  { value: '조금 알고 있어요', desc: '몇 가지는 해 본 적 있어요.' },
  { value: '아직 잘 모르겠어요', desc: '함께 찾아보고 싶어요.' },
];

/** 예제 데이터: 지난 4주 주별 연습 횟수 (마지막이 이번 주) */
export const EXAMPLE_WEEKS = [2, 3, 4, 3];
export const EXAMPLE_METHODS = [
  { name: '묶어 기억하기', count: 7 },
  { name: '장면 떠올리기', count: 4 },
  { name: '소리 내어 말하기', count: 1 },
];
/** 예제 이번 주 연습한 요일 (0 = 월) */
export const EXAMPLE_DONE_DAYS = [0, 2, 3];

/** now 가 속한 주의 월요일 0시 */
export function weekStart(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const md = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;

/** '11월 23일 – 11월 29일' */
export function weekRangeLabel(now: Date): string {
  const s = weekStart(now);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  return `${md(s)} – ${md(e)}`;
}

/** 4주 막대 이름: ['11/2주', '11/9주', '11/16주', '이번 주'] */
export function fourWeekLabels(now: Date): string[] {
  const s = weekStart(now);
  return [3, 2, 1, 0].map((back) => {
    if (back === 0) return '이번 주';
    const d = new Date(s);
    d.setDate(s.getDate() - back * 7);
    return `${d.getMonth() + 1}/${d.getDate()}주`;
  });
}

/** 오늘의 요일 번호 (0 = 월 … 6 = 일) */
export const todayIndex = (now: Date) => (now.getDay() + 6) % 7;
