import { Link } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Icon, PET_NAMES, PetArt, Ring, Screen, toast } from '@/design/ui';
import { useApp, WEEKDAYS } from '@/store/state';
import { practicedWeekdays } from './logic';
import { run, useRun } from './store';
import './practice.css';

const DEFAULT_DAYS = ['월', '수', '금'];
const SIX_DAYS = 6 * 86_400_000;

// 01 오늘의 연습 (하단 탭: 홈)
export function Home() {
  const s = useApp();
  const reviewedAt = useRun((r) => r.reviewedAt);
  const heading = s.profile.name ? `${s.profile.name}님의 기억 연습` : '오늘의 기억 연습';
  const days = s.plan.days.length ? s.plan.days : DEFAULT_DAYS;
  const done = practicedWeekdays(s.sessions);
  // 계획한 요일 + 계획 밖에 연습한 요일도 함께 보여 준다
  const shownDays = WEEKDAYS.filter((d) => days.includes(d) || done.has(d));
  const last = s.assessments[s.assessments.length - 1];
  const showReview = s.plan.goals.length > 0 && s.plan.at && (!reviewedAt || Date.now() - Date.parse(reviewedAt) > SIX_DAYS)
    && Date.now() - Date.parse(s.plan.at) > 86_400_000;

  const answerReview = (tried: boolean) => {
    run.set((r) => ({ ...r, reviewedAt: new Date().toISOString() }));
    toast(tried ? '생활에서 써 보셨군요. 정말 잘하셨어요!' : '괜찮아요. 이번 주에 한 번 써 봐요.');
  };

  return (
    <Screen brand tabs>
      <div className="stack" style={{ gap: 4 }}>
        <h1 className="title">{heading}</h1>
        {!s.member && <p className="sub">로그인 없이 체험 중</p>}
      </div>

      {showReview && (
        <Card tone="mint">
          <strong>지난주 목표, 써 보셨나요?</strong>
          <p className="sub">{s.plan.goals.join(' · ')}</p>
          <div className="pr-two">
            <Button onClick={() => answerReview(true)}>써 봤어요</Button>
            <Button variant="secondary" onClick={() => answerReview(false)}>아직이에요</Button>
          </div>
        </Card>
      )}

      <div className="pr-home-grid">
        <Link to={s.pet.kind ? P.petCare : P.petPick} className="card card-pet pr-pet">
          <div className="stack">
            <span className="pr-name">{s.pet.kind ? s.pet.name || PET_NAMES[s.pet.kind] : '기억 친구'}</span>
            <strong>{s.pet.kind ? `${s.pet.name || PET_NAMES[s.pet.kind]}${josa(s.pet.name || PET_NAMES[s.pet.kind])}\n함께해요.` : '기억 친구를\n골라 보세요.'}</strong>
            <span>씨앗 {s.pet.seeds}개</span>
          </div>
          <PetArt kind={s.pet.kind} size={120} />
        </Link>

        <Card>
          <div className="pr-week">
            <strong>이번 주 함께한 날</strong>
            <Ring value={done.size} total={days.length} size={88} />
            <div className="pr-days">
              {shownDays.map((d) => (
                <span key={d}>
                  <Icon name={done.has(d) ? 'check' : 'calendar'} size={22} /> {d}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <div className="pr-home-actions">
          <Button to={s.consent.use ? P.practice : P.consent}>오늘의 연습 시작하기</Button>
          <Button variant="secondary" to={P.typeIntro}>유형 테스트 · 펫 고르기</Button>
        </div>

        <Link to={P.talk} className="card pr-link">
          <span className="pr-ico" aria-hidden="true"><Icon name="mic" size={22} /></span>
          <span><strong>기억 친구와 이야기하기</strong><span>천천히 말하는 대화로 오늘을 떠올려요</span></span>
          <span className="pr-go"><Icon name="back" /></span>
        </Link>

        {last ? (
          <Link to={P.training} className="card pr-link">
            <span className="pr-ico" aria-hidden="true">{last.level}</span>
            <span><strong>나의 단계 {last.level} · 맞춤 훈련</strong><span>지금 단계에 맞는 연습을 이어가요</span></span>
            <span className="pr-go"><Icon name="back" /></span>
          </Link>
        ) : (
          <Link to={P.check} className="card pr-link">
            <span className="pr-ico" aria-hidden="true">A–E</span>
            <span><strong>정밀 기억력 테스트</strong><span>다섯 영역을 살펴보고 맞춤 훈련을 받아요</span></span>
            <span className="pr-go"><Icon name="back" /></span>
          </Link>
        )}
      </div>
    </Screen>
  );
}

/** 받침에 따라 '와/과' — 몽글이와 → '몽글이와'처럼 부르는 시안 문구를 따른다 */
function josa(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code % 28 !== 0 ? '이와' : '와';
}
