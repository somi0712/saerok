# 새록

**나만의 기억 방법을 배우고 생활에서 써 보는 시니어 기억 연습 웹사이트.** 팀 휴즈니스.

[새록 웹사이트 열기](https://saerok-lyart.vercel.app)

- 대상: 기억이 예전 같지 않다고 느끼는 60–70대
- 새록은 연습을 돕는 서비스이며 진단·치료 도구가 아니에요.

## 주요 기능

| 주요 메뉴 | 화면 |
| --- | --- |
| 홈 | 오늘의 연습, 기억 친구(펫) 카드, 이번 주 함께한 날, AI 음성 대화 친구 |
| 배우기 | 묶기·시각화·의미 연결 전략 카드 |
| 연습 | 편안하게 준비하기 → 순서 기억 → 조금 뒤에 떠올리기 → 오늘의 기록, 정밀 기억력 테스트(A–E) → 10단계 결과 → 단계별 맞춤 훈련 |
| 내 기록 | 4주 흐름, 생활 목표와 주간 계획, 기억 일기장 |

공통 화면: 체험 시작(글자 크기·프로필), 유형 테스트와 기억 친구 고르기·돌보기, 설정과 가족 공유(가족은 제안, 바꾸는 건 본인), 도움과 쉬어가기.

## 개발

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 단위 테스트 (Vitest)
npm run build      # 타입 검사 + 배포용 빌드 (dist/)
```

- React 18 · TypeScript · Vite · React Router
- 상태: 기기 안 localStorage (`src/store/state.ts`). 계정·가족 실시간 공유는 다음 단계에서 서버로 옮겨요.

## 웹 배포

| 환경 | 접속 방법 | 배포 기준 |
| --- | --- | --- |
| 운영 | [새록 웹사이트](https://saerok-lyart.vercel.app) | `main` 머지 시 Vercel 자동 배포 |
| PR 미리보기 | GitHub PR의 Vercel 검사 또는 봇 댓글 | PR 브랜치 커밋별 배포 |

Vercel은 `npm ci`와 `npm run build`를 실행하고 `dist/`를 배포해요. `vercel.json`에서 `/learn`, `/records` 같은 직접 주소도 열리도록 설정해요.

## 폴더 구조

```
src/
  app/          라우터, 화면 주소(paths.ts)
  design/       디자인 토큰, 공용 UI (Screen, Button, Card …)
  store/        공용 상태
  features/     기능별 화면 (폴더 하나 = 기능 하나, 규칙은 features/README.md)
public/         아이콘, 매니페스트, 기억 친구 그림
design/         Figma 시안·유저 플로우·정보 구조·와이어프레임, 1·2차 HTML 데모
```

## 협업

- `main` 은 PR 로만 바뀌고, 저장소 소유자(@somi0712) 승인 후 머지돼요.
- 브랜치 → PR → CI(타입 검사·테스트·빌드) 통과 → 승인 → 머지 → 자동 배포.
- 시안 화면 번호와 노션 근거를 PR 에 적어 주세요.
