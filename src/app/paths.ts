// 앱 전체 화면 주소. 화면 번호는 design/새록_2차_디자인_산출물/screens 의 시안 번호.
// 모든 기능 폴더가 이 주소로 서로 연결되므로, 주소를 바꿀 때는 여기만 고친다.
export const P = {
  // 체험 시작 (onboarding)
  start: '/start', //               13 로그인과 데모 시작
  fontSize: '/start/font', //       14 글자 크기 선택
  profile: '/start/profile', //     15 이름·연령대·성별
  method: '/start/method', //       16 나를 아는 정도 (기억 방법 친숙도)
  ready: '/start/ready', //         28 준비 완료 · 예제 데이터
  tourHome: '/tour', //             29 예제 홈 · 한눈에 보기
  tourRecord: '/tour/record', //    30 예제 기록 · 4주 흐름
  tourFinish: '/tour/finish', //    31 체험 마치기 · 계정 만들기
  signedUp: '/tour/done', //        32 가입 완료

  // 홈 · 배우기 · 연습 (practice)
  home: '/', //                     01 오늘의 연습 (하단 탭: 홈)
  consent: '/practice/consent', //  02 이용 안내와 동의
  practice: '/practice', //         03 편안하게 준비하기 (하단 탭: 연습)
  learn: '/learn', //               04 묶기 전략 배우기 (하단 탭: 배우기)
  order: '/practice/order', //      05 순서 기억하기
  orderPick: '/practice/order/pick', // 06 순서대로 고르기
  recall: '/practice/recall', //    07 조금 뒤에 떠올리기
  result: '/practice/result', //    08 오늘의 연습 기록
  plan: '/plan', //                 09 생활 목표와 주간 계획

  // 유형 테스트 · 펫 (typetest-pet)
  typeIntro: '/type', //            17 유형 테스트 안내
  typeQuestion: '/type/q', //       18–21 네 가지 선호 (/type/q/1 … /type/q/4)
  typePrepView: '/type/prep', //    22 기억 준비 · 그림 보기
  typePrepFind: '/type/prep/find', // 23 기억 준비 · 다시 찾기
  typeResult: '/type/result', //    24 나의 기억 연습 유형
  petPick: '/pet', //               25 펫 고르기
  petCare: '/pet/care', //          26 펫 돌보기
  petGrowth: '/pet/growth', //      27 펫 성장과 보상

  // 노션 회의 결정 사항 (assessment)
  check: '/check', //               정밀 기억력 테스트 A–E
  checkResult: '/check/result', //  10단계 결과
  training: '/check/training', //   단계별 맞춤 훈련
  talk: '/talk', //                 AI 음성 대화 친구

  // 내 기록 · 설정 (records-settings)
  records: '/records', //           10 나의 기록 (하단 탭: 내 기록)
  diary: '/records/diary', //       기억 일기장
  settings: '/settings', //         11 설정과 가족 공유
  family: '/settings/family', //    보호자 연동 (가족 제안 → 본인 승인)
  help: '/help', //                 12 도움과 쉬어가기
} as const;

export const TABS = [
  { to: P.home, label: '홈', icon: 'home' },
  { to: P.learn, label: '배우기', icon: 'book' },
  { to: P.practice, label: '연습', icon: 'grid' },
  { to: P.records, label: '내 기록', icon: 'chart' },
] as const;
