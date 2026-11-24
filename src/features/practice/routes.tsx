import { Navigate, Outlet, type RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { useApp } from '@/store/state';
import { Home } from './Home';
import { Consent, Learn, Prepare } from './Prepare';
import { Order, OrderPick, Recall, Result } from './Practice';
import { Plan } from './Plan';

function PracticeConsentGate() {
  const consented = useApp((state) => state.consent.use);
  return consented ? <Outlet /> : <Navigate to={P.consent} replace />;
}

// 시안 01–09: 홈 · 이용 안내 · 준비 · 배우기 · 순서 기억 · 고르기 · 지연 회상 · 결과 · 주간 계획
export const routes: RouteObject[] = [
  { path: P.home, element: <Home /> },
  { path: P.consent, element: <Consent /> },
  { path: P.learn, element: <Learn /> },
  {
    element: <PracticeConsentGate />,
    children: [
      { path: P.practice, element: <Prepare /> },
      { path: P.order, element: <Order /> },
      { path: P.orderPick, element: <OrderPick /> },
      { path: P.recall, element: <Recall /> },
      { path: P.result, element: <Result /> },
    ],
  },
  { path: P.plan, element: <Plan /> },
];
