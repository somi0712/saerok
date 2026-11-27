import type { PracticeSession } from '@/store/state';

const DAY = 86_400_000;

/** 그 날짜가 속한 주의 월요일 0시 */
export function mondayOf(d: Date): Date {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

/** 최근 n주(이번 주 포함)의 주별 연습 횟수. 오래된 주가 앞. */
export function weeklyCounts(sessions: PracticeSession[], now = new Date(), weeks = 4) {
  const thisMon = mondayOf(now);
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(thisMon);
    start.setDate(thisMon.getDate() - 7 * (weeks - 1 - i));
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const count = sessions.filter((s) => {
      const t = new Date(s.at);
      return t >= start && t < end;
    }).length;
    return { start, label: i === weeks - 1 ? '이번 주' : `${md(start)}주`, count };
  });
}

/** 이번 주 월–일 중 연습한 요일 */
export function weekDaysDone(sessions: PracticeSession[], now = new Date()): boolean[] {
  const mon = mondayOf(now).getTime();
  const done = Array<boolean>(7).fill(false);
  for (const s of sessions) {
    const i = Math.round((startOfDay(new Date(s.at)).getTime() - mon) / DAY);
    if (i >= 0 && i < 7) done[i] = true;
  }
  return done;
}

/** 오늘 기준 최근 7일(오래된 날이 앞): 그 날 연습 횟수와 분 */
export function last7Days(sessions: PracticeSession[], now = new Date()) {
  const today = startOfDay(now).getTime();
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today - (6 - i) * DAY);
    const same = sessions.filter((s) => startOfDay(new Date(s.at)).getTime() === day.getTime());
    return {
      day,
      label: `${md(day)} ${'일월화수목금토'[day.getDay()]}`,
      count: same.length,
      minutes: same.reduce((a, s) => a + (s.minutes ?? 5), 0),
    };
  });
}

/** 마지막 연습 이후 지난 날 수 (오늘 했으면 0). 기록이 없으면 null. */
export function daysSinceLast(sessions: PracticeSession[], now = new Date()): number | null {
  if (!sessions.length) return null;
  const last = Math.max(...sessions.map((s) => startOfDay(new Date(s.at)).getTime()));
  return Math.round((startOfDay(now).getTime() - last) / DAY);
}

/** 가족 화면 알림 기준: 3일 이상 연습이 없으면 알림 (회의 1주차 "장기 미참여 시 알람") */
export const NO_ACCESS_ALERT_DAYS = 3;
export const needsFamilyAlert = (days: number | null) => days !== null && days >= NO_ACCESS_ALERT_DAYS;

/** 자주 써 본 방법: 전략별 횟수, 많은 순 */
export function strategyCounts(sessions: PracticeSession[]) {
  const m = new Map<string, number>();
  for (const s of sessions) if (s.strategy) m.set(s.strategy, (m.get(s.strategy) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export const TASK_LABEL: Record<PracticeSession['task'], string> = {
  order: '순서대로 고르기',
  recall: '조금 뒤 떠올리기',
  training: '맞춤 훈련',
  check: '정밀 기억력 테스트',
};

/** 보호자 전화번호: 숫자만 9–11자리, 0으로 시작 */
export const onlyDigits = (s: string) => s.replace(/\D/g, '');
export const isPhone = (s: string) => /^0\d{8,10}$/.test(onlyDigits(s));
export const formatPhone = (s: string) => {
  const d = onlyDigits(s);
  if (d.startsWith('02')) return d.replace(/^(02)(\d{3,4})(\d{4})$/, '$1-$2-$3');
  return d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
};

export const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()} ${'일월화수목금토'[d.getDay()]}`;
};
