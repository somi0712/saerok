import { P } from '@/app/paths';
import { app, type Letter } from '@/store/state';

// 미래의 나에게 보내기 — 받을 날짜·시간을 정해 두면 그때 알림을 띄우고, 누르면 그 편지를 연다.
// ponytail: 서버 푸시 없이 이 브라우저에서만 알린다. 새록이 열려 있으면 그 시각에 브라우저 알림,
// 닫혀 있었으면 다음에 열 때 홈의 '도착한 편지' 카드로 알린다. 휴대폰 잠금 화면 알림은 푸시 서버가 생기면 붙인다.

export const letterLink = (id: string) => `${P.diary}?letter=${id}`;
export const isArrived = (l: Letter, now = Date.now()) => Date.parse(l.sendAt) <= now;
export const arrivedUnread = (letters: Letter[], now = Date.now()) => letters.filter((l) => isArrived(l, now) && !l.openedAt);

export function markOpened(id: string) {
  app.set((s) => ({ ...s, letters: (s.letters ?? []).map((l) => (l.id === id && !l.openedAt ? { ...l, openedAt: new Date().toISOString() } : l)) }));
}

export async function askNotify() {
  if (!('Notification' in window) || Notification.permission !== 'default') return;
  try { await Notification.requestPermission(); } catch { /* 알림을 못 쓰면 홈 카드로 알린다 */ }
}

function notify(l: Letter) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification('미래의 나에게서 편지가 왔어요', { body: '눌러서 편지를 열어 보세요.', tag: l.id });
    n.onclick = () => { window.focus(); window.location.assign(letterLink(l.id)); };
  } catch { /* 휴대폰 브라우저처럼 페이지 알림을 막으면 홈 카드로 알린다 */ }
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const MAX_DELAY = 2_147_000_000; // setTimeout 한계(약 24일)

function schedule() {
  const letters = app.get().letters ?? [];
  timers.forEach((t, id) => { if (!letters.some((l) => l.id === id && !l.openedAt)) { clearTimeout(t); timers.delete(id); } });
  for (const l of letters) {
    const wait = Date.parse(l.sendAt) - Date.now();
    if (l.openedAt || timers.has(l.id) || wait <= 0 || wait > MAX_DELAY) continue;
    timers.set(l.id, setTimeout(() => { timers.delete(l.id); notify(l); app.set((s) => ({ ...s })); }, wait));
  }
}

if (typeof window !== 'undefined') {
  schedule();
  app.subscribe(schedule);
}
