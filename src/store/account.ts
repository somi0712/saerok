import { useEffect, useSyncExternalStore } from 'react';
import { database } from '@/data/announcements';
import { app, initialState, readGuestPreferences } from './state';
import { run } from '@/features/practice/store';
import { typeProgress } from '@/features/typetest-pet/progress';
import { clearGuestPreview } from './guestTrial';
import { setCloudUser } from './cloudSync';

const listeners = new Set<() => void>();
// 회원가입 때 받은 계정 정보는 Supabase user_metadata에 둔다: name(본인 이름) · phone(본인 전화번호) · guardian_phone(보호자 전화번호)
let account = { ready: !database, userId: null as string | null, name: null as string | null };

type Meta = Record<string, unknown> | undefined;
const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 20) : null);
/** 로그인한 계정의 이름. 예전에 닉네임으로 가입한 계정도 읽는다. 비로그인이면 null. */
const nameOf = (meta: Meta) => text(meta?.name) ?? text(meta?.nickname);

/** 인사말 — 비로그인은 이름을 부르지 않고, 로그인하면 그 계정의 이름으로 부른다 */
export const greeting = (a: { userId: string | null; name: string | null }) =>
  a.userId && a.name ? `${a.name}님, 반가워요.` : '반가워요.';

/** 계정 정보 바꾸기 (설정의 이름, 보호자 연락처). 성공하면 onAuthStateChange(USER_UPDATED)로 화면이 바뀐다. */
export async function saveAccountInfo(data: { name?: string; guardian_phone?: string | null }) {
  if (!database || !account.userId) return false;
  const { error } = await database.auth.updateUser({ data });
  return !error;
}

export function useAccountSession() {
  useEffect(() => {
    if (!database) return;
    const { data } = database.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      if (userId !== account.userId) {
        if (account.userId) {
          clearGuestPreview();
          typeProgress.reset();
        }
        setCloudUser(null); // 계정이 바뀌는 동안 이전 계정으로 기록이 오가지 않게 멈춘다
        const preferences = readGuestPreferences();
        app.open(userId ? `saerok-app:${userId}` : 'saerok-guest-v2', {
          ...initialState,
          ...preferences,
        });
        run.open(userId ? `saerok-practice:${userId}` : null);
        setCloudUser(userId);
      }
      // 가입 때 적은 보호자 번호를 보호자 연락처 화면에 채운다 (이 기기에 아직 없을 때만)
      const guardian = session?.user.user_metadata?.guardian_phone;
      if (userId && typeof guardian === 'string' && guardian && !app.get().family.phone) {
        app.set((s) => ({ ...s, family: { ...s.family, phone: guardian } }));
      }
      account = { ready: true, userId, name: nameOf(session?.user.user_metadata) };
      listeners.forEach((listen) => listen());
    });
    return () => data.subscription.unsubscribe();
  }, []);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const getAccount = () => account;
export const useAccount = () => useSyncExternalStore(subscribe, getAccount);
