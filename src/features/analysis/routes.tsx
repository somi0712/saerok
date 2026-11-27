import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import Analysis from './Analysis';

export const routes: RouteObject[] = [{ path: P.analysis, element: <Analysis /> }];
