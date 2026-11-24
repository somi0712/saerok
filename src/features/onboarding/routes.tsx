import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import {
  FontSizeScreen, MethodScreen, ProfileScreen, ReadyScreen, SignedUpScreen, StartScreen,
  TourFinishScreen, TourHomeScreen, TourRecordScreen,
} from './screens';

export const routes: RouteObject[] = [
  { path: P.start, element: <StartScreen /> }, //            13
  { path: P.fontSize, element: <FontSizeScreen /> }, //      14
  { path: P.profile, element: <ProfileScreen /> }, //        15
  { path: P.method, element: <MethodScreen /> }, //          16
  { path: P.ready, element: <ReadyScreen /> }, //            28
  { path: P.tourHome, element: <TourHomeScreen /> }, //      29
  { path: P.tourRecord, element: <TourRecordScreen /> }, //  30
  { path: P.tourFinish, element: <TourFinishScreen /> }, //  31
  { path: P.signedUp, element: <SignedUpScreen /> }, //      32
];
