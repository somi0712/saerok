import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { Admin } from './Admin';

// /admin 아래 메뉴(개요·사용자·공지·관리자·활동 기록)는 Admin 안에서 나눈다
export const routes: RouteObject[] = [{ path: P.admin + '/*', element: <Admin /> }];
