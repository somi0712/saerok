# 기능 폴더 규칙

- 기능 하나 = `src/features/<이름>/` 폴더 하나. 다른 기능 폴더는 고치지 않는다.
- 폴더 안 `routes.tsx` 가 `export const routes: RouteObject[]` 를 내보내면 앱에 자동 연결된다 (`src/app/App.tsx`).
- 화면 주소는 `src/app/paths.ts` 의 `P` 만 쓴다. 다른 기능 화면으로 갈 때도 `P` 로 이동한다.
- 여러 기능이 함께 읽는 상태는 `src/store/state.ts` 의 `app` / `useApp`. 이 기능만 쓰는 상태는 `createPersisted('saerok-<이름>', 기본값)`.
- 공용 UI: `src/design/ui.tsx` (Screen, Button, Card, Choice, Steps, Ring, PetArt, Icon, toast).
- 시안: `design/새록_2차_디자인_산출물/screens/NN_*.png`, 유저 플로우 `01_user_flow.png`.
- 문구: 한 화면 한 질문, 부정적 피드백 금지, 진단·치매 예방·인지 개선을 말하지 않는다 (기획안 24-2).
