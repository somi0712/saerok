import { useEffect, useSyncExternalStore } from 'react';
import { database } from '@/data/announcements';
import { app, initialState, readGuestPreferences } from './state';
import { run } from '@/features/practice/store';
import { typeProgress } from '@/features/typetest-pet/progress';
import { clearGuestPreview } from './guestTrial';
import { setCloudUser } from './cloudSync';

const listeners = new Set<() => void>();
let account = { ready: !database, userId: null as string | null };

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
      account = { ready: true, userId };
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
