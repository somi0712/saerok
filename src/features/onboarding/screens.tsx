import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Choice, Icon, PetArt, Screen, Steps } from '@/design/ui';
import { app, useApp, WEEKDAYS, type FontSize } from '@/store/state';
import { greeting, useAccount } from '@/store/account';
import {
  AGE_BANDS, EXAMPLE_DONE_DAYS, EXAMPLE_METHODS, EXAMPLE_WEEKS, FAMILIARITY, FONT_LABEL, GENDERS,
  fourWeekLabels, todayIndex, weekRangeLabel,
} from './tour';
import './onboarding.css';

// 체험 시작 전에는 App 의 안내 가드가 /start·/tour 밖 주소를 /start 로 돌려보내므로
// 이 화면들에서는 상단 도움 버튼을 숨긴다 (help={false}).

const fromSettings = (q: URLSearchParams) => q.get('from') === 'settings';

/** 13 로그인과 데모 시작 */
export function StartScreen() {
  return (
    <Screen title="새록" help={false}
      footer={<>
        <Button to={P.fontSize}>로그인 없이 시작하기</Button>
        <Button variant="secondary" to={P.login}>이메일로 로그인하기</Button>
      </>}>
      <span className="chip ob-chip">새록 · 데모 체험</span>
      <div className="ob-hero"><PetArt size={200} /></div>
      <h2 className="title">나만의 기억 방법, 친구와 함께 찾아요.</h2>
    </Screen>
  );
}

/** 14 글자 크기 선택 */
export function FontSizeScreen() {
  const nav = useNavigate();
  const [q] = useSearchParams();
  const current = useApp((s) => s.settings.fontSize);
  const pick = (size: FontSize) => {
    app.set((s) => ({ ...s, settings: { ...s.settings, fontSize: size } }));
    nav(fromSettings(q) ? P.settings : P.profile);
  };
  return (
    <Screen title="나의 기억 연습" back help={false}>
      {!fromSettings(q) && <Steps now={1} total={3} />}
      <span className="chip ob-chip">처음 설정</span>
      <h2 className="title">편안하게 읽히는 글자 크기를 골라요.</h2>
      <p className="sub">누르면 바로 적용돼요.</p>
      <div className="stack ob-web-options" role="radiogroup" aria-label="글자 크기">
        {([20, 22, 24] as FontSize[]).map((size) => (
          <button key={size} type="button" role="radio" aria-checked={current === size} className="choice ob-font" onClick={() => pick(size)}>
            <b className="eyebrow">{FONT_LABEL[size]}</b>
            <span className="sample" style={{ fontSize: size - 4 }}>기억은 천천히 자라요.</span>
          </button>
        ))}
      </div>
      <p className="small">설정에서 언제든 바꿀 수 있어요.</p>
    </Screen>
  );
}

function PillGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="stack">
      <div className="ob-field-head" id={`ob-${label}`}>{label}<em>{value}</em></div>
      <div className="ob-pills" role="radiogroup" aria-labelledby={`ob-${label}`}>
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} className="ob-pill" onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

/** 15 연령대 · 성별 (부르는 이름은 로그인 계정의 닉네임으로만 쓴다) */
export function ProfileScreen() {
  const nav = useNavigate();
  const [q] = useSearchParams();
  const saved = useApp((s) => s.profile);
  const [ageBand, setAge] = useState(saved.ageBand);
  const [gender, setGender] = useState(saved.gender);
  const save = () => {
    app.set((s) => ({ ...s, profile: { ...s.profile, ageBand, gender } }));
    nav(fromSettings(q) ? P.settings : P.method);
  };
  return (
    <Screen title="나의 기억 연습" back help={false}
      footer={<Button onClick={save}>{fromSettings(q) ? '저장하기' : '다음으로'}</Button>}>
      {!fromSettings(q) && <Steps now={2} total={3} />}
      <span className="chip ob-chip">기본 정보</span>
      <h2 className="title">나에 대해 조금 알려 주세요.</h2>
      <p className="sub">연습을 고르는 데만 써요. 이름은 회원가입할 때 적으면 로그인한 뒤 불러 드려요.</p>
      <div className="web-columns">
        <PillGroup label="연령대" options={AGE_BANDS} value={ageBand} onChange={setAge} />
        <PillGroup label="성별" options={GENDERS} value={gender} onChange={setGender} />
      </div>
    </Screen>
  );
}

/** 16 나를 아는 정도 (기억 방법 친숙도) */
export function MethodScreen() {
  const nav = useNavigate();
  const current = useApp((s) => s.profile.methodFamiliarity);
  const pick = (v: string) => {
    app.set((s) => ({ ...s, profile: { ...s.profile, methodFamiliarity: v } }));
    nav(P.ready);
  };
  return (
    <Screen title="나의 기억 연습" back help={false}>
      <Steps now={3} total={3} />
      <span className="chip ob-chip">나를 얼마나 알고 있나요?</span>
      <h2 className="title">나에게 맞는 기억 방법을 얼마나 알고 계신가요?</h2>
      <p className="sub">지금 느끼는 그대로 골라 주세요.</p>
      <div className="stack ob-web-options" role="radiogroup" aria-label="기억 방법을 아는 정도">
        {FAMILIARITY.map((f) => (
          <Choice key={f.value} checked={current === f.value} onSelect={() => pick(f.value)} title={f.value} desc={f.desc} />
        ))}
      </div>
      <p className="small">하나를 고르면 예제 데이터를 준비해 드려요.</p>
    </Screen>
  );
}

/** 체크 표시 목록 — 표시는 선 아이콘으로 */
function Checks({ items }: { items: string[] }) {
  return (
    <ul className="ob-checks">
      {items.map((t) => <li key={t}><span className="ob-tick" aria-hidden="true"><Icon name="check" size={20} /></span>{t}</li>)}
    </ul>
  );
}

function Summary({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="ob-kv">
      {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || '고르지 않음'}</dd></div>)}
    </dl>
  );
}

/** 28 준비 완료 · 예제 데이터 */
export function ReadyScreen() {
  const { profile, settings } = useApp();
  const account = useAccount();
  return (
    <Screen title="나의 기억 연습" back help={false}
      footer={<>
        <Button to={P.tourHome}>예제 데이터로 둘러보기</Button>
        <Button variant="secondary" to={P.startPet}>기억 친구 고르고 시작하기</Button>
      </>}>
      <span className="chip ob-chip">준비 완료</span>
      <h2 className="title">{greeting(account)}</h2>
      <p className="sub">고른 정보에 맞춰 예제 데이터를 준비했어요.</p>
      <Card>
        <strong>내가 고른 정보</strong>
        <Summary rows={[
          ['글자 크기', FONT_LABEL[settings.fontSize]],
          ['연령대', profile.ageBand],
          ['성별', profile.gender],
          ['나를 아는 정도', profile.methodFamiliarity],
        ]} />
        <Link className="ob-again" to={P.start}>처음부터 다시 고르기</Link>
      </Card>
      <Card tone="pet">
        <strong>함께 불러온 예제 데이터</strong>
        <Checks items={['지난 4주 연습 기록 12회', '익힌 전략 · 묶어 기억하기', '생활 목표 · 장 볼 물건 기억하기', '기억 친구 몽글 · 1단계']} />
      </Card>
    </Screen>
  );
}

/** 29 예제 홈 · 한눈에 보기 */
export function TourHomeScreen() {
  const account = useAccount();
  const now = new Date();
  const today = todayIndex(now);
  return (
    <Screen title="예제 둘러보기" back help={false}
      footer={<>
        <Button to={P.startPet + '?next=practice'}>오늘의 연습 시작하기</Button>
        <Button variant="secondary" to={P.tourRecord}>4주 기록 살펴보기</Button>
      </>}>
      <span className="ob-badge">체험 모드 · 예제 데이터로 둘러보는 중</span>
      <h2 className="title">{greeting(account)}</h2>
      <div className="ob-stats">
        <div className="ob-stat lav"><span>이번 주 연습</span><b>3회</b><span className="small">목표 5회 중</span></div>
        <div className="ob-stat peach"><span>연속으로 한 날</span><b>4일</b><span className="small">지난주보다 하루 더</span></div>
        <div className="ob-stat mint"><span>순서대로 고르기</span><b>2.5개</b><span className="small">3개 중 평균</span></div>
        <div className="ob-stat"><span>조금 뒤 떠올리기</span><b>2.4개</b><span className="small">3개 중 평균</span></div>
      </div>
      <Card>
        <strong>이번 주 · {weekRangeLabel(now)}</strong>
        <ul className="ob-week" aria-label="이번 주 연습한 날 (예시)">
          {WEEKDAYS.map((d, i) => {
            const done = EXAMPLE_DONE_DAYS.includes(i);
            return (
              <li key={d} className={[done && 'done', i === today && 'today'].filter(Boolean).join(' ')}
                aria-label={`${d}요일 ${done ? '연습함' : i === today ? '오늘' : '쉬는 날'}`}>
                <i aria-hidden="true">{done && <Icon name="check" size={20} />}</i>{d}
              </li>
            );
          })}
        </ul>
      </Card>
      <p className="small">모든 숫자는 예시 데이터예요.</p>
    </Screen>
  );
}

/** 30 예제 기록 · 4주 흐름 */
export function TourRecordScreen() {
  const now = new Date();
  const labels = fourWeekLabels(now);
  const max = Math.max(...EXAMPLE_WEEKS);
  const total = EXAMPLE_WEEKS.reduce((a, b) => a + b, 0);
  const day = (back: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - back);
    return `${d.getMonth() + 1}.${d.getDate()} ${WEEKDAYS[todayIndex(d)]}`;
  };
  return (
    <Screen title="오늘의 기억 연습" back help={false}
      footer={<Button to={P.tourFinish}>체험 마치고 내 기록 시작하기</Button>}>
      <span className="chip ob-chip">내 기록 · 예제</span>
      <h2 className="title">4주 동안의 작은 실천</h2>
      <Card>
        <div className="ob-head">주별 연습 횟수<em>총 {total}회</em></div>
        <div className="ob-bars" role="img" aria-label={labels.map((l, i) => `${l} ${EXAMPLE_WEEKS[i]}회`).join(', ')}>
          {EXAMPLE_WEEKS.map((n, i) => (
            <div key={labels[i]} className={`ob-bar${i === 3 ? ' now' : ''}`} aria-hidden="true">
              <b>{n}회</b>
              <i style={{ height: `${(n / max) * 70}%` }} />
              <span>{labels[i]}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card tone="lavender">
        <strong>자주 써 본 방법</strong>
        <div className="ob-tags">{EXAMPLE_METHODS.map((m) => <span key={m.name}>{m.name} {m.count}회</span>)}</div>
      </Card>
      <Card>
        <strong>최근 연습</strong>
        <ul className="ob-recent">
          <li><time>{day(1)}</time><strong>순서대로 고르기</strong><em>3개 중 3개</em></li>
          <li><time>{day(2)}</time><strong>조금 뒤 떠올리기</strong><em>3개 중 2개</em></li>
        </ul>
        <p className="small">연습 기록일 뿐, 기억 상태를 진단하지 않아요.</p>
      </Card>
    </Screen>
  );
}

/** 31 체험 마치기 · 계정 만들기 */
export function TourFinishScreen() {
  return (
    <Screen title="나의 기억 연습" back help={false}
      footer={<>
        <Button to={P.login}>이메일로 가입하거나 로그인하기</Button>
        <Button variant="ghost" to={P.tourHome}>조금 더 둘러볼게요</Button>
      </>}>
      <span className="chip ob-chip">체험 마치기</span>
      <div className="ob-hero"><PetArt size={180} /></div>
      <h2 className="title">둘러본 기록을 내 것으로 이어갈까요?</h2>
      <p className="sub">지금까지 본 기록은 예제 데이터예요. 가입하면 오늘부터 나의 연습이 쌓여요.</p>
      <Card>
        <Checks items={['고른 글자 크기·정보 이어가기', '가족과 연습 기록 함께 보기', '몽글이와 처음부터 함께 자라기']} />
      </Card>
    </Screen>
  );
}

/** 32 가입 완료 */
export function SignedUpScreen() {
  return <Navigate to={P.login} replace />;
}
