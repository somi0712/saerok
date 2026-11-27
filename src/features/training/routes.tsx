import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { AreaPath, Lesson, TrainingHub } from './screens';

export const routes: RouteObject[] = [
  { path: P.training, element: <TrainingHub /> },
  { path: `${P.trainingArea}/:area`, element: <AreaPath /> },
  { path: `${P.lesson}/:area`, element: <Lesson /> },
];
