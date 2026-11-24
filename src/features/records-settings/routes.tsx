import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import Records from './Records';
import Diary from './Diary';
import Settings from './Settings';
import Family from './Family';
import Help from './Help';

export const routes: RouteObject[] = [
  { path: P.records, element: <Records /> },
  { path: P.diary, element: <Diary /> },
  { path: P.settings, element: <Settings /> },
  { path: P.family, element: <Family /> },
  { path: P.help, element: <Help /> },
];
