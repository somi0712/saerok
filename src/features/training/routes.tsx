import { Navigate, Outlet, type RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { useApp } from '@/store/state';
import { AreaPath, Lesson, TrainingHub } from './screens';
import QuickTest from './QuickTest';
import DiaryLesson from './DiaryLesson';

// 결과를 기록에 남기는 훈련은 연습과 같이 이용 동의 뒤에만 연다 (AGENTS.md)
function ConsentGate() {
  const consented = useApp((s) => s.consent.use);
  return consented ? <Outlet /> : <Navigate to={P.consent} replace />;
}

export const routes: RouteObject[] = [
  { path: P.training, element: <TrainingHub /> },
  { path: `${P.trainingArea}/:area`, element: <AreaPath /> },
  { path: P.quick, element: <QuickTest /> },
  {
    element: <ConsentGate />,
    children: [
      { path: `${P.lesson}/:area`, element: <Lesson /> },
      { path: `${P.diaryLesson}/:id`, element: <DiaryLesson /> },
    ],
  },
];
