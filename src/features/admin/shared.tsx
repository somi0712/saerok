import { useCallback, useEffect, useState } from 'react';
import type { database } from '@/data/announcements';
import { errorText } from './format';

export type Client = NonNullable<typeof database>;
export interface PageProps { client: Client; userId: string }
export type Notice = { error: boolean; text: string };

/** 비동기 목록을 불러오고, 실패하면 안내 문구를 남긴다. reload 로 다시 부른다. */
export function useLoad<T>(load: () => Promise<T>, failText: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    let active = true;
    setError(undefined);
    load().then((value) => { if (active) setData(value); })
      .catch((e) => { if (active) setError(errorText(e, failText)); });
    return () => { active = false; };
    // load 는 화면마다 client 만 바뀌므로 tick 으로만 다시 부른다
  }, [tick]);
  return { data, error, reload };
}

export function LoadState({ error, loading, onRetry }: { error?: string; loading: boolean; onRetry: () => void }) {
  if (error) {
    return (
      <div role="alert" className="admin-stack">
        <p className="admin-error">{error}</p>
        <button type="button" onClick={onRetry}>다시 불러오기</button>
      </div>
    );
  }
  return loading ? <p role="status" className="admin-muted">불러오는 중이에요.</p> : null;
}

export function Message({ notice }: { notice?: Notice }) {
  if (!notice) return null;
  return <p role={notice.error ? 'alert' : 'status'} className={notice.error ? 'admin-error' : 'admin-muted'}>{notice.text}</p>;
}
