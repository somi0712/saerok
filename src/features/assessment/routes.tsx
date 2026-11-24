import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { CheckScreen } from './CheckScreen';
import { ResultScreen, TrainingScreen } from './LevelScreens';
import { TalkScreen } from './TalkScreen';

export const routes: RouteObject[] = [
  { path: P.check, element: <CheckScreen /> },
  { path: P.checkResult, element: <ResultScreen /> },
  { path: P.training, element: <TrainingScreen /> },
  { path: P.talk, element: <TalkScreen /> },
];
