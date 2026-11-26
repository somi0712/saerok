import { useSyncExternalStore } from 'react';

// 여러 기능이 함께 읽는 앱 상태. 기능 하나만 쓰는 상태는 그 기능 폴더에서 createPersisted 로 만든다.
// ponytail: 기기 안 localStorage 저장 — 계정·가족 실시간 공유가 필요해지면 서버 저장소로 옮긴다.

export type FontSize = 20 | 22 | 24;
export type PetKind = 'mongle' | 'saebom' | 'banjjak';
export type ModuleId = 'A' | 'B' | 'C' | 'D' | 'E';

export interface PracticeSession {
  id: string;
  at: string; // ISO
  task: 'order' | 'recall' | 'training' | 'check';
  correct: number;
  total: number;
  hints: number;
  strategy?: string; // 사용한 전략 (예: 묶기)
  burden?: 'easy' | 'ok' | 'hard'; // 느낀 부담
  minutes?: number;
}

export interface Assessment {
  id: string;
  at: string;
  score: number; // 0–100
  level: number; // 1–10
  modules: Record<ModuleId, { correct: number; total: number; ms: number; hints: number }>;
}

export interface DiaryEntry {
  id: string;
  at: string;
  mood: string;
  text: string;
  photo?: string; // data URL (축소본)
  audio?: string; // data URL
}

export interface FamilyProposal {
  id: string;
  at: string;
  from: string; // 예: '딸 수진'
  kind: string; // 예: '횟수 줄이기'
  detail: string;
  status: 'pending' | 'accepted' | 'changed' | 'declined';
  answer?: string;
}

export interface AppState {
  version: 1;
  onboarded: boolean; // 체험 시작(13–16, 28)을 마쳤는지
  member: boolean; // 32 가입 완료 (데모 가입)
  profile: { name: string; ageBand: string; gender: string; methodFamiliarity: string };
  settings: { fontSize: FontSize; soundOn: boolean; voiceRate: number };
  consent: { use: boolean; share: boolean; research: boolean; cloud: boolean; at?: string }; // cloud: 내 기록을 서버에 보관
  typeResult?: { code: string; title: string; strategy: string; answers: Record<string, string> };
  pet: { kind?: PetKind; name?: string; seeds: number; snacks: number; grown: boolean };
  sessions: PracticeSession[];
  plan: { days: string[]; goals: string[]; at?: string; history: { at: string; days: string[]; goals: string[] }[] };
  assessments: Assessment[];
  attendance: string[];
  training?: { level: number; accepted: boolean; at: string };
  diary: DiaryEntry[];
  family: {
    linked: boolean;
    share: { access: boolean; practice: boolean; diary: boolean };
    proposals: FamilyProposal[];
  };
}

export const initialState: AppState = {
  version: 1,
  onboarded: false,
  member: false,
  profile: { name: '', ageBand: '', gender: '', methodFamiliarity: '' },
  settings: { fontSize: 20, soundOn: true, voiceRate: 0.85 },
  consent: { use: false, share: false, research: false, cloud: false },
  pet: { seeds: 2, snacks: 0, grown: false },
  sessions: [],
  plan: { days: [], goals: [], history: [] },
  assessments: [],
  attendance: [],
  diary: [],
  family: { linked: true, share: { access: true, practice: true, diary: false }, proposals: [] },
};

/** localStorage 에 저장되는 작은 상태 저장소. 저장이 막힌 브라우저에서도 메모리로 동작한다. */
function readStorage<T extends object>(key: string | null, initial: T): T {
  try {
    const raw = key && localStorage.getItem(key);
    if (raw) return { ...initial, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    /* 저장소를 못 쓰면 기본값으로 시작 */
  }
  return initial;
}

export function createPersisted<T extends object>(key: string | null, initial: T) {
  let storageKey = key;
  let value = readStorage(key, initial);
  const listeners = new Set<() => void>();
  const get = () => value;
  const set = (next: T | ((prev: T) => T)) => {
    value = typeof next === 'function' ? (next as (p: T) => T)(value) : next;
    try {
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* 용량 초과 등: 화면 상태는 유지 */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  function use(): T;
  function use<S>(select: (s: T) => S): S;
  function use<S>(select?: (s: T) => S) {
    return useSyncExternalStore(subscribe, () => (select ? select(value) : value));
  }
  const reset = () => set(initial);
  const open = (key: string | null, seed = initial) => {
    storageKey = key;
    value = readStorage(key, seed);
    listeners.forEach((l) => l());
  };
  return { get, set, use, subscribe, reset, open };
}

export function readGuestPreferences() {
  const legacy = readStorage('saerok-app-v1', initialState);
  const guest = readStorage('saerok-guest-v2', legacy);
  const { onboarded, profile, settings, consent, pet } = guest;
  return { onboarded, profile, settings, consent, pet: { ...initialState.pet, kind: pet.kind, name: pet.name } };
}

export const app = createPersisted<AppState>('saerok-guest-v2', { ...initialState, ...readGuestPreferences() });
export const useApp = app.use;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** 이번 주(월요일 시작)의 날짜인지 */
export function isThisWeek(iso: string, now = new Date()): boolean {
  const d = new Date(iso);
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const next = new Date(monday);
  next.setDate(monday.getDate() + 7);
  return d >= monday && d < next;
}

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;
