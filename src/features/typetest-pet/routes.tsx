import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { PetCare, PetGrowth, PetPick, TypeIntro, TypePrepFind, TypePrepView, TypeQuestion, TypeResult } from './screens';

// 시안 17–27: 유형 테스트 · 기억 친구(펫)
export const routes: RouteObject[] = [
  { path: P.typeIntro, element: <TypeIntro /> },
  { path: `${P.typeQuestion}/:n`, element: <TypeQuestion /> },
  { path: P.typePrepView, element: <TypePrepView /> },
  { path: P.typePrepFind, element: <TypePrepFind /> },
  { path: P.typeResult, element: <TypeResult /> },
  { path: P.startPet, element: <PetPick firstVisit /> },
  { path: P.petPick, element: <PetPick /> },
  { path: P.petCare, element: <PetCare /> },
  { path: P.petGrowth, element: <PetGrowth /> },
];
