import { database } from '@/data/announcements';
import { deleteRecords, mergeById, pullRecords, uploadRecords } from '@/data/records';
import { app } from './state';

// 로그인 + '내 기록을 서버에 보관' 동의일 때만 연습·테스트 결과를 서버와 맞춘다.
// 실패해도 이 기기의 기록은 그대로 두고, 다음 변경이나 다음 로그인 때 다시 시도한다.

/** 동의 화면과 설정에서 같은 문구로 무엇이 오가는지 알린다. */
export const CLOUD_NOTICE = '연습·테스트 결과(날짜·점수·단계·힌트 수)만 계정에 보관해 다른 기기에서도 이어 봐요. '
  + '일기·사진·음성은 보내지 않아요. 운영자는 전체 통계와 계정별 요약만 봐요. 끄면 서버에 보관한 기록을 지워요.';

let user: string | null = null;
let pulled = false;
const uploaded = new Set<string>(); // 서버에 있는 기록 id ('s:'연습 / 'a:'테스트)
let running = false;
let again = false;

/** account.ts 가 로그인 상태가 바뀔 때 부른다. 게스트(null)는 동기화하지 않는다. */
export function setCloudUser(userId: string | null) {
  if (userId === user) return;
  user = userId;
  pulled = false;
  uploaded.clear();
  void syncRecords();
}

export async function syncRecords() {
  if (!database || !user || !app.get().consent.cloud) {
    pulled = false;
    uploaded.clear();
    return;
  }
  if (running) {
    again = true;
    return;
  }
  running = true;
  const me = user;
  try {
    if (!pulled) {
      const remote = await pullRecords(database);
      if (me !== user) return;
      app.set((s) => {
        const sessions = mergeById(s.sessions, remote.sessions);
        const assessments = mergeById(s.assessments, remote.assessments);
        return sessions === s.sessions && assessments === s.assessments ? s : { ...s, sessions, assessments };
      });
      remote.sessions.forEach((x) => uploaded.add('s:' + x.id));
      remote.assessments.forEach((x) => uploaded.add('a:' + x.id));
      pulled = true;
    }
    const { sessions, assessments } = app.get();
    const newSessions = sessions.filter((x) => !uploaded.has('s:' + x.id));
    const newAssessments = assessments.filter((x) => !uploaded.has('a:' + x.id));
    if (newSessions.length || newAssessments.length) {
      await uploadRecords(database, me, newSessions, newAssessments);
      if (me !== user) return;
      newSessions.forEach((x) => uploaded.add('s:' + x.id));
      newAssessments.forEach((x) => uploaded.add('a:' + x.id));
    }
  } catch (error) {
    console.warn('기록을 서버에 맞추지 못했어요. 다음에 다시 시도해요.', error);
  } finally {
    running = false;
    if (again) {
      again = false;
      void syncRecords();
    }
  }
}

/** 동의를 켜고 바로 맞춘다. */
export function enableCloud() {
  app.set((s) => ({ ...s, consent: { ...s.consent, cloud: true } }));
}

/** 서버 기록을 지운 뒤 동의를 끈다. 지우지 못하면 동의를 그대로 두고 false 를 돌려준다. */
export async function disableCloud() {
  if (database && user) {
    try {
      await deleteRecords(database, user);
    } catch {
      return false;
    }
  }
  app.set((s) => ({ ...s, consent: { ...s.consent, cloud: false } }));
  return true;
}

// 기록이 바뀔 때마다 새 기록만 올린다. 바뀐 게 없으면 서버를 부르지 않는다.
app.subscribe(() => void syncRecords());
