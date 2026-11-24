import { useEffect } from 'react';
import { BrowserRouter, Navigate, useLocation, useRoutes, type RouteObject } from 'react-router-dom';
import { P } from './paths';
import { Welcome } from './Welcome';
import { useApp } from '@/store/state';
import { useAccount, useAccountSession } from '@/store/account';
import { canSeeGuestResult, hasUsedGuestTest, isGuestTestPath } from '@/store/guestTrial';
import { loginLink } from '@/features/account/routes';
import { Button, Screen, SiteHeader, ToastHost } from '@/design/ui';

// 기능 폴더(src/features/<이름>/routes.tsx)가 내보내는 routes 를 모두 모은다.
// 새 기능은 이 파일을 고치지 않고 자기 폴더에 routes.tsx 만 두면 연결된다.
const modules = import.meta.glob<{ routes: RouteObject[] }>('../features/*/routes.tsx', { eager: true });
const featureRoutes = Object.values(modules).flatMap((m) => m.routes);

function NotReady() {
  return (
    <Screen title="준비 중" back>
      <p className="title">아직 준비 중인 화면이에요.</p>
      <Button to={P.home}>홈으로</Button>
    </Screen>
  );
}

const OPEN_BEFORE_ONBOARDING = [P.start, '/tour', P.help, P.admin, P.login];
const PRIVATE = [P.records, P.plan, P.training, P.family];

function Routes() {
  const onboarded = useApp((s) => s.onboarded);
  const fontSize = useApp((s) => s.settings.fontSize);
  const pet = useApp((s) => s.pet.kind);
  const { pathname, search } = useLocation();
  const { ready, userId } = useAccount();
  useEffect(() => {
    document.documentElement.dataset.font = String(fontSize);
  }, [fontSize]);
  useEffect(() => {
    document.documentElement.dataset.pet = pet ?? 'mongle';
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, [pet]);
  const element = useRoutes([...featureRoutes, { path: '*', element: <NotReady /> }]);
  const needsAccount = PRIVATE.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const finishedGuestTest = isGuestTestPath(pathname) && hasUsedGuestTest() && !canSeeGuestResult(pathname);
  if (!ready && (needsAccount || isGuestTestPath(pathname) || pathname === P.login)) {
    return <Screen title="로그인 확인"><p role="status">계정을 확인하고 있어요.</p></Screen>;
  }
  if (!userId && (needsAccount || finishedGuestTest)) return <Navigate to={loginLink(pathname + search)} replace />;
  if (userId && needsAccount) return <><SiteHeader />{element}</>;
  if (!onboarded && pathname === P.home) return <Welcome />;
  if (!onboarded && !OPEN_BEFORE_ONBOARDING.some((p) => pathname.startsWith(p)) && featureRoutes.some((r) => r.path === P.start)) {
    return <Navigate to={P.start} replace />;
  }
  return <><SiteHeader />{element}</>;
}

export default function App() {
  useAccountSession();
  return (
    <BrowserRouter>
      <Routes />
      <ToastHost />
    </BrowserRouter>
  );
}
