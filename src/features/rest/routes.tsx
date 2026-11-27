import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import Rest from './Rest';

export const routes: RouteObject[] = [{ path: P.rest, element: <Rest /> }];
