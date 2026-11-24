import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Icon, PetArt, PET_NAMES, Screen, Steps, toast, type IconName } from '@/design/ui';
import { app, useApp, type PetKind } from '@/store/state';
import { getAccount, useAccount } from '@/store/account';
import { finishGuestTest } from '@/store/guestTrial';
import { loginLink } from '@/features/account/routes';
import { typeProgress as progress } from './progress';
import { EXAMPLE_ANSWERS, QUESTIONS, SEEDS_PER_SNACK, SNACKS_TO_GROW, daysTogether, feedPet, typeResultOf } from './logic';
import './typetest-pet.css';

const TITLE = '나의 기억 연습';
const Tag = ({ children }: { children: ReactNode }) => <span className="tp-tag">{children}</span>;
/** 씨앗 칩: 씨앗 개수는 늘 이 모양으로 보여 준다 */
const Seeds = ({ n }: { n: number }) => <strong className="tp-seed"><Icon name="seed" />씨앗 {n}개</strong>;

function completeTypeTest() {
  if (getAccount().userId || !progress.get().answers.length || finishGuestTest(P.typeResult)) return P.typeResult;
  return loginLink(P.typeIntro);
}

function saveResult(answers: string[]) {
  if (!getAccount().userId) return;
  const { lines: _lines, desc: _desc, ...result } = typeResultOf(answers);
  app.set((s) => ({ ...s, typeResult: result }));
}

/* 17 유형 테스트 안내 */
export function TypeIntro() {
  const nav = useNavigate();
  const { userId } = useAccount();
  return (
    <Screen title={TITLE} back
      footer={<>
        <Button onClick={() => { progress.set({ answers: [], prep: 'none' }); nav(`${P.typeQuestion}/1`); }}>나의 유형 찾아보기</Button>
        <Button variant="secondary" onClick={() => { saveResult(EXAMPLE_ANSWERS); nav(P.petPick); }}>예시 유형으로 펫 고르기</Button>
      </>}>
      <Tag>나의 기억 연습 스타일</Tag>
      <h2 className="title">나는 어떤 방법이 편할까요?</h2>
      <p className="sub">질문 네 개와 그림 연습 하나를 해요.</p>
      {!userId && <p className="small">이 브라우저에서 로그인 없이 테스트 1회를 완료할 수 있어요.</p>}
      <Card tone="lavender">
        <div className="tp-intro">
          <PetArt kind="mongle" size={96} />
          <strong>정답 없는 질문으로 내 연습 취향을 찾아보세요.</strong>
        </div>
        <p>결과는 네 글자 코드와 쉬운 설명으로 보여 드려요.</p>
      </Card>
      <p className="small">선호를 정리하는 데모예요. 정식 심리검사나 진단은 아니에요.</p>
    </Screen>
  );
}

/* 18–21 네 가지 선호 */
export function TypeQuestion() {
  const nav = useNavigate();
  const n = Number(useParams().n);
  const answers = progress.use((s) => s.answers);
  const q = QUESTIONS[n - 1];
  if (!q) return <Navigate to={`${P.typeQuestion}/1`} replace />;

  const pick = (code: string) => {
    const next = [...answers.slice(0, n - 1), code];
    progress.set((s) => ({ ...s, answers: next }));
    nav(n < QUESTIONS.length ? `${P.typeQuestion}/${n + 1}` : P.typePrepView);
  };
  const skip = () => {
    const next = QUESTIONS.map((_, i) => answers[i] ?? EXAMPLE_ANSWERS[i]);
    progress.set((s) => ({ ...s, answers: next }));
    nav(P.typePrepView);
  };

  return (
    <Screen title={TITLE} back
      footer={<>
        <Button variant="secondary" onClick={skip}>예시 답변으로 건너뛰기</Button>
        <p className="small" style={{ textAlign: 'center' }}>유형은 언제든 다시 알아볼 수 있어요.</p>
      </>}>
      <Steps now={n} total={QUESTIONS.length} label={`질문 ${n} / ${QUESTIONS.length} · ${q.tag}`} />
      <h2 className="title">{q.title}</h2>
      <p className="sub">더 마음이 가는 쪽을 골라 주세요.</p>
      <div className="stack" role="radiogroup" aria-label={q.tag}>
        {q.options.map((o) => (
          <button key={o.code} type="button" role="radio" aria-checked={answers[n - 1] === o.code}
            className={`tp-option tp-${o.tone}`} onClick={() => pick(o.code)}>
            <span className="tp-letter">{o.code}</span>
            <strong>{o.label}</strong>
          </button>
        ))}
      </div>
    </Screen>
  );
}

/* 그림 카드: 앱 공통 사물 아이콘 */
const LABELS: Partial<Record<IconName, string>> = {
  apple: '사과', milk: '우유', bread: '빵', cup: '컵', glasses: '안경', key: '열쇠', umbrella: '우산', clock: '시계',
};
const SEEN: IconName[] = ['apple', 'milk', 'bread'];
const CHOICES: IconName[] = ['cup', 'apple', 'glasses', 'milk', 'key', 'bread', 'umbrella', 'clock'];

/* 22 기억 준비 · 그림 보기 */
export function TypePrepView() {
  const nav = useNavigate();
  return (
    <Screen title={TITLE} back
      footer={<>
        <Button to={P.typePrepFind}>기억했어요 · 그림 가리기</Button>
        <Button variant="secondary" onClick={() => { progress.set((s) => ({ ...s, prep: 'skipped' })); nav(completeTypeTest()); }}>이번에는 건너뛰기</Button>
      </>}>
      <Tag>기억 준비 · 예시 1문항</Tag>
      <h2 className="title">그림 세 개를 천천히 살펴보세요.</h2>
      <p className="sub">시간 제한은 없어요.</p>
      <Card>
        <ul className="tp-pics">
          {SEEN.map((id) => <li key={id}><Icon name={id} size={56} /><strong>{LABELS[id]}</strong></li>)}
        </ul>
      </Card>
      <p className="sub">다음 화면에서 보았던 그림을 다시 찾아볼게요.</p>
    </Screen>
  );
}

/* 23 기억 준비 · 다시 찾기 — 맞힌 수를 매기지 않고, 함께 본 그림을 다시 보여 준다 */
export function TypePrepFind() {
  const nav = useNavigate();
  const [picked, setPicked] = useState<IconName[]>([]);
  const [shown, setShown] = useState(false);
  const toggle = (id: IconName) => !shown && setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <Screen title={TITLE} back
      footer={shown
        ? <Button onClick={() => { progress.set((s) => ({ ...s, prep: 'done' })); nav(completeTypeTest()); }}>나의 유형 보기</Button>
        : <Button disabled={picked.length === 0} onClick={() => setShown(true)}>다 골랐어요</Button>}>
      <Tag>기억 준비 · 다시 찾기</Tag>
      <h2 className="title">아까 본 그림을 골라 주세요.</h2>
      <p className="sub">생각나는 만큼만 눌러도 괜찮아요.</p>
      <div className="tp-grid">
        {CHOICES.map((id) => {
          const on = picked.includes(id);
          const seen = shown && SEEN.includes(id);
          return (
            <button key={id} type="button" aria-pressed={on} className={`tp-pick${on ? ' on' : ''}${seen ? ' seen' : ''}`} onClick={() => toggle(id)}>
              <Icon name={id} size={48} />
              <span>{LABELS[id]}</span>
            </button>
          );
        })}
      </div>
      {shown && (
        <Card tone="mint">
          <strong>떠올려 보신 것만으로 충분해요.</strong>
          <p>함께 본 그림은 사과, 우유, 빵이었어요. 표시된 그림을 한 번 더 살펴보세요.</p>
        </Card>
      )}
    </Screen>
  );
}

/* 24 나의 기억 연습 유형 */
export function TypeResult() {
  const { userId } = useAccount();
  const answers = progress.use((s) => s.answers);
  const prep = progress.use((s) => s.prep);
  const isExample = answers.length === 0;
  const r = typeResultOf(isExample ? EXAMPLE_ANSWERS : answers);
  const nav = useNavigate();
  return (
    <Screen title={TITLE} back
      footer={<>
        {!userId && !isExample && <Button to={loginLink(P.typeResult)}>로그인하고 유형 저장하기</Button>}
        <Button variant={userId ? 'primary' : 'secondary'} onClick={() => {
          saveResult(isExample ? EXAMPLE_ANSWERS : answers);
          nav(P.petPick);
        }}>{userId && !isExample ? '유형 저장하고 펫 만나기' : '펫 만나기'}</Button>
      </>}>
      <Tag>{isExample ? '예시 유형' : '나의 유형'} · {r.code}</Tag>
      <div className="tp-code" aria-label={`유형 코드 ${r.code}`}>
        {r.code.split('').map((c, i) => <span key={i}>{c}</span>)}
      </div>
      <h2 className="title">{r.title}</h2>
      <p className="sub">{r.desc}</p>
      <Card>
        <ul className="tp-lines">{r.lines.map((l) => <li key={l}>{l}</li>)}</ul>
      </Card>
      <Card tone="mint">
        <strong>추천 연습 방법 · {r.strategy}</strong>
        <p className="sub">
          {prep === 'done' ? '그림 다시 찾기를 해 보셨어요. 그림 세 개부터 시작해 볼게요.'
            : '그림 세 개부터 천천히 시작해 볼게요.'}
        </p>
      </Card>
      <p className="small">선호와 이번 연습의 기록이에요. 성격이나 능력을 확정하지 않아요.</p>
    </Screen>
  );
}

const PETS: { kind: PetKind; desc: string; tone: string }[] = [
  { kind: 'mongle', desc: '포근하게 응원하는 구름 친구', tone: 'tp-lavender' },
  { kind: 'saebom', desc: '작은 실천을 함께 쌓는 새싹 친구', tone: 'tp-mint' },
  { kind: 'banjjak', desc: '오늘의 순간을 모으는 별 친구', tone: 'tp-peach' },
];

/* 25 펫 고르기 */
export function PetPick({ firstVisit = false }: { firstVisit?: boolean }) {
  const nav = useNavigate();
  const [query] = useSearchParams();
  const finish = () => {
    app.set((s) => ({ ...s, onboarded: true }));
    nav(query.get('next') === 'practice' ? P.practice : P.home, { replace: true });
  };
  const current = useApp((s) => s.pet.kind);
  const choose = (kind: PetKind) => {
    app.set((s) => ({ ...s, pet: { ...s.pet, kind, name: PET_NAMES[kind] } }));
    toast(`${PET_NAMES[kind]}과 함께해요.`);
    if (firstVisit) finish();
    else nav(P.petCare);
  };
  return (
    <Screen title={TITLE} back footer={firstVisit ? <Button variant="ghost" onClick={finish}>나중에 고르기</Button> : undefined}>
      <Tag>함께 자랄 기억 친구</Tag>
      <h2 className="title">마음이 가는 친구를 골라 주세요.</h2>
      <p className="sub">처음부터 원하는 친구를 고를 수 있어요.</p>
      <div className="stack tp-pets" role="radiogroup" aria-label="기억 친구">
        {PETS.map((p) => (
          <button key={p.kind} type="button" role="radio" aria-checked={current === p.kind} className={`tp-pet ${p.tone}`} onClick={() => choose(p.kind)}>
            <PetArt kind={p.kind} size={80} />
            <span><strong>{PET_NAMES[p.kind]}</strong><span>{p.desc}</span></span>
          </button>
        ))}
      </div>
      <p className="small">다른 친구도 나중에 다시 만날 수 있어요.</p>
    </Screen>
  );
}

/* 26 펫 돌보기 */
export function PetCare() {
  const nav = useNavigate();
  const pet = useApp((s) => s.pet);
  const days = useApp((s) => daysTogether(s.sessions));
  if (!pet.kind) return <Navigate to={P.petPick} replace />;
  if (pet.grown) return <Navigate to={P.petGrowth} replace />;
  const canFeed = pet.seeds >= SEEDS_PER_SNACK;
  const feed = () => {
    const next = feedPet(app.get().pet);
    app.set((s) => ({ ...s, pet: next }));
    if (next.grown) nav(P.petGrowth);
    else toast(`${PET_NAMES[pet.kind!]}이 간식을 맛있게 먹었어요. (간식 ${next.snacks} / ${SNACKS_TO_GROW})`);
  };
  return (
    <Screen title={TITLE} back
      footer={<>
        <Button onClick={feed} disabled={!canFeed}>{canFeed ? `씨앗 ${SEEDS_PER_SNACK}개로 간식 주기` : `씨앗 ${SEEDS_PER_SNACK}개가 모이면 간식을 줄 수 있어요`}</Button>
        <Button variant="secondary" to={P.learn}>오늘의 기억 연습하기</Button>
        <Button variant="ghost" to={P.petPick}>다른 펫 고르기</Button>
      </>}>
      <Tag>나의 펫 돌보기</Tag>
      <h2 className="title">{PET_NAMES[pet.kind]}</h2>
      <Card tone="pet">
        <div className="tp-stage">
          <PetArt kind={pet.kind} size={128} />
          <span className="tp-pill">함께한 날 {days}일</span>
          <Seeds n={pet.seeds} />
          <span className="small tp-count">간식 {pet.snacks} / {SNACKS_TO_GROW} · 다 모으면 한 뼘 자라요</span>
        </div>
      </Card>
      <p className="sub">연습하고 생활에서 써 보면 친구를 키울 씨앗이 쌓여요.</p>
    </Screen>
  );
}

/* 27 펫 성장과 보상 */
export function PetGrowth() {
  const pet = useApp((s) => s.pet);
  if (!pet.kind) return <Navigate to={P.petPick} replace />;
  return (
    <Screen title={TITLE} back
      footer={<>
        <Button to={P.plan}>생활 목표와 계획 보기</Button>
        <Button variant="secondary" to={P.home}>홈으로 돌아가기</Button>
      </>}>
      <Tag>펫 성장 · 보상</Tag>
      <h2 className="title">{pet.grown ? '우리의 작은 실천이 친구를 자라게 했어요.' : '친구가 조금씩 자라고 있어요.'}</h2>
      <p className="sub">정답보다 함께해 본 순간을 모아요.</p>
      <Card tone="pet">
        <div className="tp-stage">
          <PetArt kind={pet.kind} size={pet.grown ? 136 : 120} />
          <span className="tp-pill">{pet.grown ? 'Lv.2 · 함께 자라는 중' : `Lv.1 · 간식 ${pet.snacks} / ${SNACKS_TO_GROW}`}</span>
          <strong className="tp-name">{PET_NAMES[pet.kind]}</strong>
        </div>
      </Card>
      {pet.grown && (
        <Card tone="mint">
          <strong>보상 · 함께 자란 배지</strong>
          <p className="sub">간식 {SNACKS_TO_GROW}개를 모아 한 뼘 자랐어요.</p>
        </Card>
      )}
      <p className="sub">쉬는 날에도 친구는 기다려요. 성장 기록은 줄어들지 않아요.</p>
    </Screen>
  );
}
