// 연습 기능의 순수 로직: 순서 채점(F01-W), 규칙 추천(R01), 이번 주 함께한 날.
import { WEEKDAYS, isThisWeek, type PracticeSession } from '@/store/state';
import type { IconName } from '@/design/ui';

export interface Item {
  id: string;
  label: string;
  icon: IconName;
  group: string;
}

export const ITEMS: Item[] = [
  { id: 'apple', label: '사과', icon: 'apple', group: '과일' },
  { id: 'milk', label: '우유', icon: 'milk', group: '유제품' },
  { id: 'bread', label: '빵', icon: 'bread', group: '빵' },
  { id: 'carrot', label: '당근', icon: 'carrot', group: '채소' },
  { id: 'fish', label: '생선', icon: 'fish', group: '생선' },
  { id: 'tea', label: '찻잔', icon: 'cup', group: '그릇' },
  { id: 'pill', label: '약', icon: 'pill', group: '약' },
  { id: 'glasses', label: '안경', icon: 'glasses', group: '물건' },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id)!;

export function shuffle<T>(arr: T[], rand = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 순서 기억 과제: 서로 다른 물건 length 개 */
export const makeTarget = (length: number, rand = Math.random) => shuffle(ITEMS.map((i) => i.id), rand).slice(0, length);

/** 고를 보기 6개: 정답 물건 + 나머지 */
export function makeOptions(target: string[], rand = Math.random): string[] {
  const rest = shuffle(ITEMS.map((i) => i.id).filter((id) => !target.includes(id)), rand);
  return shuffle([...target, ...rest].slice(0, Math.max(6, target.length)), rand);
}

export interface OrderScore {
  correct: number; // 제자리에 고른 수
  total: number;
  orderErrors: number; // 들어 있었지만 자리가 다른 수
  intrusions: number; // 없던 물건을 고른 수
}

export function scoreOrder(target: string[], picks: string[]): OrderScore {
  let correct = 0, orderErrors = 0, intrusions = 0;
  picks.forEach((id, i) => {
    if (target[i] === id) correct++;
    else if (target.includes(id)) orderErrors++;
    else intrusions++;
  });
  return { correct, total: target.length, orderErrors, intrusions };
}

export const STRATEGIES = [
  {
    id: 'group',
    name: '묶어 기억하기',
    short: '묶기',
    title: '비슷한 것끼리\n묶어 보세요.',
    sub: '여러 개를 작은 묶음으로 나눠요.',
    say: '사과 두 개는 과일, 우유 두 개는 유제품. 과일 둘, 유제품 둘처럼 묶음에 이름을 붙여 보세요.',
    demo: [
      { icons: ['apple', 'apple'], label: '과일' },
      { icons: ['milk', 'milk'], label: '유제품' },
    ],
    tip: '“과일 둘, 유제품 둘”\n묶음의 이름을 붙여 보세요.',
  },
  {
    id: 'picture',
    name: '그림 떠올리기',
    short: '시각화',
    title: '머릿속에\n그림을 그려 보세요.',
    sub: '물건이 놓인 장면을 하나로 떠올려요.',
    say: '식탁 위에 사과가 있고, 그 옆에 우유가 서 있어요. 하나의 장면으로 그려 보세요.',
    demo: [
      { icons: ['apple', 'milk'], label: '식탁 위 장면' },
      { icons: ['glasses', 'pill'], label: '서랍 안 장면' },
    ],
    tip: '“식탁 위 사과 옆에 우유”\n장면 하나로 기억해요.',
  },
  {
    id: 'meaning',
    name: '의미 연결하기',
    short: '의미 연결',
    title: '나와 관련된\n이야기로 이어 보세요.',
    sub: '내 생활과 연결하면 오래 남아요.',
    say: '아침에 우유를 마시고, 약을 먹고, 안경을 써요. 내 하루의 순서로 이어 보세요.',
    demo: [
      { icons: ['milk', 'pill'], label: '아침 식사 후' },
      { icons: ['glasses', 'newspaper'], label: '신문 읽을 때' },
    ],
    tip: '“아침 우유, 그다음 약”\n내 하루 순서로 이어요.',
  },
] as const;

export type StrategyId = (typeof STRATEGIES)[number]['id'];

/** 오늘 추천할 전략: 유형 테스트 결과가 있으면 그 전략, 없으면 날짜마다 하나씩 */
export function strategyOfToday(typeStrategy: string | undefined, now = new Date()): StrategyId {
  const match = STRATEGIES.find((s) => typeStrategy && (typeStrategy.includes(s.short) || typeStrategy.includes(s.name)));
  if (match) return match.id;
  const day = Math.floor(now.getTime() / 86_400_000);
  return STRATEGIES[day % STRATEGIES.length].id;
}

export type Burden = 'easy' | 'ok' | 'hard';
export type Cue = 'none' | 'hint' | 'choices';

export interface RecInput {
  order: { correct: number; total: number; hints: number };
  recall: { correct: number; total: number; cue: Cue };
  burden?: Burden;
  length: number;
}

export interface Recommendation {
  ruleId: string;
  reason: string; // 사용자 언어의 추천 이유
  nextLength: number;
  strategy?: StrategyId;
  hold?: boolean; // 데이터 부족 → 추천 보류
}

export const MIN_LEN = 3, MAX_LEN = 5;

/** R01 규칙 추천. 위에서부터 처음 맞는 규칙 하나. 적용은 본인이 수락할 때만. */
export function recommend({ order, recall, burden, length }: RecInput): Recommendation {
  if (order.total === 0 || recall.total === 0) {
    return { ruleId: 'R-HOLD', reason: '기록이 조금 더 쌓이면 다음 방법을 추천해 드릴게요.', nextLength: length, hold: true };
  }
  const orderRate = order.correct / order.total;
  const recallRate = recall.correct / recall.total;
  if (burden === 'hard') {
    const next = Math.max(MIN_LEN, length - 1);
    return {
      ruleId: 'R-BURDEN',
      reason: next < length ? '조금 힘드셨다고 해서, 다음엔 물건을 하나 줄여 편하게 해 볼게요.' : '조금 힘드셨다고 해서, 다음에도 지금처럼 편한 단계로 할게요.',
      nextLength: next,
    };
  }
  if (order.hints >= 2) {
    return { ruleId: 'R-WM-1', reason: '다시 보기를 자주 쓰셔서, 묶기 연습을 먼저 해 볼게요.', nextLength: length, strategy: 'group' };
  }
  if (recallRate < 0.5) {
    return { ruleId: 'R-EM-1', reason: '조금 뒤 떠올리기를 돕는 ‘그림 떠올리기’를 함께 해 볼게요.', nextLength: length, strategy: 'picture' };
  }
  if (orderRate >= 0.8 && recallRate >= 0.8 && recall.cue === 'none' && length < MAX_LEN) {
    return { ruleId: 'R-UP', reason: '두 연습 모두 편안하게 하셨어요. 다음엔 물건을 하나 늘려 볼까요?', nextLength: length + 1 };
  }
  return { ruleId: 'R-KEEP', reason: '지금 단계가 잘 맞아요. 같은 단계로 이어 가요.', nextLength: length };
}

/** 이번 주 연습한 날(요일 이름) */
export function practicedWeekdays(sessions: PracticeSession[], now = new Date()): Set<string> {
  const days = new Set<string>();
  for (const s of sessions) if (isThisWeek(s.at, now)) days.add(WEEKDAYS[(new Date(s.at).getDay() + 6) % 7]);
  return days;
}
