import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { Admin } from './Admin';

export const routes: RouteObject[] = [{ path: P.admin, element: <Admin /> }];
