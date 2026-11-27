import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { P } from '@/app/paths';
import { PetArt, toast } from '@/design/ui';
import { useApp } from '@/store/state';
import './rest.css';

// 잠깐 쉬어가기 — 레퍼런스 1(밤하늘·앉아 있는 캐릭터·이유 태그·오늘 해볼 쉼 카드)

const REASONS = ['이유 없음', '졸려요', '피곤해요', '머리가 복잡해요', '눈이 피로해요'] as const;
type Reason = (typeof REASONS)[number];
const QUESTS: Record<Reason, string[]> = {
  '이유 없음': ['따뜻한 차 한 잔 마시기', '창밖 구름 천천히 보기', '좋아하는 노래 한 곡 듣기'],
  졸려요: ['찬물로 손 씻고 오기', '창문 열고 바람 쐬기', '제자리에서 기지개 다섯 번'],
  피곤해요: ['따뜻한 차 한 잔 마시기', '어깨 천천히 열 번 돌리기', '눈 감고 숨 다섯 번 쉬기'],
  '머리가 복잡해요': ['떠오르는 생각 한 줄 적기', '집 앞 5분 걷기', '눈 감고 숨 다섯 번 쉬기'],
  '눈이 피로해요': ['먼 곳 20초 바라보기', '눈 감고 손바닥으로 덮기', '창밖 구름 천천히 보기'],
};

export default function Rest() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next') || P.home;
  const pet = useApp((s) => s.pet.kind);
  const [reason, setReason] = useState<Reason>('이유 없음');
  const [pick, setPick] = useState(0);
  const quests = QUESTS[reason];

  const choose = () => {
    toast(`좋아요. ‘${quests[pick]}’ 하고 천천히 돌아오세요.`);
    nav(next);
  };

  return (
    <main className="rest">
      <div className="rest-sky" aria-hidden="true" />
      <section className="rest-body">
        <p className="rest-lead">
          <span className="rest-tags" role="radiogroup" aria-label="쉬는 이유">
            {REASONS.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={r === reason} className="rest-tag" onClick={() => { setReason(r); setPick(0); }}>{r}</button>
            ))}
          </span>
          <span>에 맞춘 추천 중</span>
          <strong>오늘 해볼 쉼을 골라 주세요.</strong>
        </p>

        <div className="rest-cards" role="radiogroup" aria-label="오늘 해볼 쉼">
          {quests.map((q, i) => (
            <button key={q} type="button" role="radio" aria-checked={i === pick} className="rest-card" onClick={() => setPick(i)}>
              <span className="rest-kind">쉬어가기</span>
              <strong>{q}</strong>
            </button>
          ))}
        </div>

        <div className="rest-pet" aria-hidden="true"><PetArt kind={pet} size={120} /></div>
      </section>
      <footer className="rest-foot">
        <button type="button" className="rest-go" onClick={choose}>이걸로 할게요</button>
        <button type="button" className="rest-skip" onClick={() => nav(next)}>선택하지 않고 넘어갈게요</button>
      </footer>
    </main>
  );
}
