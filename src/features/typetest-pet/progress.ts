import { createPersisted } from '@/store/state';

export const typeProgress = createPersisted(null, {
  answers: [] as string[],
  prep: 'none' as 'none' | 'done' | 'skipped',
});
