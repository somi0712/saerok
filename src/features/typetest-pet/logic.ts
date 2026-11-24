import type { AppState } from '@/store/state';

// 유형 코드: 질문 4개, 각 질문의 두 선택지가 한 글자씩.
//   1 기억 단서  V 그림(Visual)   / W 단어(Word)
//   2 정리 방식  G 묶기(Group)    / S 순서(Sequence)
//   3 연습 호흡  S 짧게(Short)    / C 차근차근(Careful)
//   4 동행       T 함께(Together) / A 혼자(Alone)
// 선호를 정리하는 것일 뿐, 성격·능력을 판정하지 않는다.
export interface Question {
  tag: string;
  title: string;
  options: [Option, Option];
}
interface Option { code: string; label: string; line: string; tone: 'lavender' | 'peach' }

export const QUESTIONS: Question[] = [
  {
    tag: '기억 단서',
    title: '장을 볼 목록을 기억할 때 어떤 방법이 편한가요?',
    options: [
      { code: 'V', label: '물건의 모습을 떠올려요', line: '그림으로 떠올려요', tone: 'lavender' },
      { code: 'W', label: '단어를 속으로 말해요', line: '말로 떠올려요', tone: 'peach' },
    ],
  },
  {
    tag: '정리 방식',
    title: '여러 가지를 한꺼번에 기억해야 할 때는요?',
    options: [
      { code: 'G', label: '비슷한 것끼리 묶어요', line: '비슷한 것끼리 묶어요', tone: 'lavender' },
      { code: 'S', label: '하나씩 순서대로 외워요', line: '순서대로 이어요', tone: 'peach' },
    ],
  },
  {
    tag: '연습 호흡',
    title: '연습은 어떻게 하는 게 편한가요?',
    options: [
      { code: 'S', label: '짧게 자주 해요', line: '짧게 자주 연습해요', tone: 'lavender' },
      { code: 'C', label: '한 번에 차근차근 해요', line: '차근차근 연습해요', tone: 'peach' },
    ],
  },
  {
    tag: '동행',
    title: '연습할 때 누가 곁에 있으면 좋을까요?',
    options: [
      { code: 'T', label: '함께 하면 편해요', line: '함께 하면 편해요', tone: 'lavender' },
      { code: 'A', label: '혼자 조용히 해요', line: '혼자 조용히 해요', tone: 'peach' },
    ],
  },
];

export const EXAMPLE_ANSWERS = ['V', 'G', 'S', 'T'];

// 앞의 두 글자(단서 × 정리 방식)로 이름과 추천 전략을 정한다.
const TITLES: Record<string, { title: string; desc: string; strategy: string }> = {
  VG: { title: '장면을 묶는 탐험가', desc: '그림을 묶어 장면으로 떠올려요.', strategy: '그림으로 묶기' },
  VS: { title: '장면을 잇는 산책가', desc: '그림을 차례대로 이어 떠올려요.', strategy: '그림으로 길 따라가기' },
  WG: { title: '말을 묶는 정리가', desc: '비슷한 말끼리 묶어 기억해요.', strategy: '말로 묶기' },
  WS: { title: '말을 잇는 이야기꾼', desc: '말을 이야기처럼 이어 기억해요.', strategy: '이야기로 잇기' },
};

export function typeResultOf(answers: string[]): NonNullable<AppState['typeResult']> & { desc: string; lines: string[] } {
  const filled = QUESTIONS.map((_, i) => answers[i] ?? EXAMPLE_ANSWERS[i]);
  const code = filled.join('');
  const t = TITLES[filled[0] + filled[1]];
  const lines = QUESTIONS.map((q, i) => q.options.find((o) => o.code === filled[i])!.line);
  const record = Object.fromEntries(QUESTIONS.map((q, i) => [q.tag, filled[i]]));
  return { code, title: t.title, desc: t.desc, strategy: t.strategy, answers: record, lines };
}

// 펫 돌보기: 씨앗 2개 = 간식 1개, 간식 3개면 한 단계 자란다. 씨앗은 연습을 마칠 때마다 쌓인다(연습 기능).
export const SEEDS_PER_SNACK = 2;
export const SNACKS_TO_GROW = 3;

export function feedPet(pet: AppState['pet']): AppState['pet'] {
  if (pet.seeds < SEEDS_PER_SNACK) return pet;
  const snacks = pet.snacks + 1;
  return { ...pet, seeds: pet.seeds - SEEDS_PER_SNACK, snacks, grown: pet.grown || snacks >= SNACKS_TO_GROW };
}

/** 함께한 날: 연습을 한 서로 다른 날짜 수 */
export const daysTogether = (sessions: AppState['sessions']) => new Set(sessions.map((s) => s.at.slice(0, 10))).size;
