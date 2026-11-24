import { app, createPersisted } from '@/store/state';
import type { Burden, Cue, StrategyId } from './logic';

// 연습 기능만 쓰는 상태: 지금 진행 중인 연습 한 번 + 본인이 수락한 다음 단계.
export const run = createPersisted(null, {
  length: 4, // 순서 기억 물건 수 (R01 수락 시 3–5)
  focus: '' as StrategyId | '', // 본인이 수락한 다음 전략
  learned: false, // 첫 이용 때 배우기를 거쳤는지
  explanation: '', // 내 말로 설명하기
  baselineMs: 0, // F00-RT 반응시간 기준선 (점수에 들어가지 않음)
  startedAt: '',
  shownAt: '', // 순서를 처음 본 시각 (지연 회상 경과 시간 계산)
  target: [] as string[],
  picks: [] as string[],
  views: 1, // 순서 보기 횟수 (1 = 처음 한 번, 그 이상은 다시 보기)
  strategy: '' as StrategyId | '',
  recall: null as null | { mode: 'self' | 'helper'; correct: number; total: number; cue: Cue; elapsedSec: number },
  burden: '' as Burden | '',
  saved: false,
  reviewedAt: '', // 홈의 "지난주 목표, 써 보셨나요?"에 답한 시각
});

export const useRun = run.use;

/** 새 연습 시작: 진행 기록만 비우고 단계·전략 선택은 유지 */
export function startRun() {
  run.set((r) => ({ ...r, startedAt: new Date().toISOString(), shownAt: '', target: [], picks: [], views: 1, recall: null, burden: '', saved: false }));
}

/** 설정의 소리·속도를 따라 읽어 주기. 소리를 끈 경우나 지원하지 않는 기기에서는 조용히 넘어간다. */
export function speak(text: string) {
  const { soundOn, voiceRate } = app.get().settings;
  if (!soundOn || typeof speechSynthesis === 'undefined') return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = voiceRate;
  speechSynthesis.speak(u);
  return true;
}
