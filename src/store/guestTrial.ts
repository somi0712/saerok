import { P } from '@/app/paths';
import type { Assessment, PracticeSession } from './state';

const key = 'saerok-guest-test-used';
let preview: string | undefined;
let spent = false;
let assessmentPreview: { assessment: Assessment; session: PracticeSession } | undefined;

export const getGuestAssessment = () => assessmentPreview;
export const setGuestAssessment = (assessment: Assessment, session: PracticeSession) => {
  assessmentPreview = { assessment, session };
};
export function clearGuestPreview() {
  preview = undefined;
  assessmentPreview = undefined;
}

export function hasUsedGuestTest() {
  try {
    return Boolean(spent || localStorage.getItem(key));
  } catch {
    return spent;
  }
}

export function finishGuestTest(resultPath: string) {
  if (hasUsedGuestTest()) return false;
  preview = resultPath;
  spent = true;
  try {
    localStorage.setItem(key, '1');
  } catch {
    // The current page session still enforces the trial limit.
  }
  return true;
}

export const canSeeGuestResult = (pathname: string) => preview === pathname;
export const isGuestTestPath = (pathname: string) =>
  pathname === P.check || pathname === P.checkResult || pathname === P.typeIntro || pathname.startsWith(P.typeIntro + '/');
