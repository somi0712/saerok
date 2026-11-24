import { createClient } from '@supabase/supabase-js';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
}

type NoticeInput = Pick<Announcement, 'title' | 'body' | 'published'>;

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const database = url && publishableKey?.startsWith('sb_publishable_')
  ? createClient(url, publishableKey)
  : null;

export async function listAnnouncements(
  client: NonNullable<typeof database>,
  publishedOnly: boolean,
): Promise<Announcement[]> {
  const query = client.from('announcements')
    .select('id,title,body,published,created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  const { data, error } = publishedOnly ? await query.eq('published', true).limit(3) : await query;
  if (error) throw error;
  return data;
}

export async function saveAnnouncement(
  client: NonNullable<typeof database>, notice: NoticeInput, id?: string,
): Promise<Announcement> {
  const input = { ...notice, title: notice.title.trim(), body: notice.body.trim() };
  const table = client.from('announcements');
  const query = id ? table.update(input).eq('id', id) : table.insert(input);
  const { data, error } = await query.select('id,title,body,published,created_at').single();
  if (error) throw error;
  return data;
}
