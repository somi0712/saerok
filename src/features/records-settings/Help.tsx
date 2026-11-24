import { useNavigate } from 'react-router-dom';
import { Button, Card, PetArt, Screen } from '@/design/ui';
import { P } from '@/app/paths';
import { useApp } from '@/store/state';
import { CounselInfo } from './Settings';
import './records.css';

const FAQ = [
  ['글자가 작아요', '설정에서 글자 크기를 "크게"나 "더 크게"로 바꿔 보세요.'],
  ['소리가 안 들려요', '휴대폰 소리를 키우고, 설정에서 "소리로 읽어 주기"가 켜져 있는지 봐 주세요.'],
  ['가족과 나누고 싶어요', '설정 → 가족 공유에서 보여 줄 항목을 골라요. 일기는 내가 켤 때만 보여요.'],
];

/** 시안 12 도움과 쉬어가기 */
export default function Help() {
  const nav = useNavigate();
  const pet = useApp((s) => s.pet.kind);
  return (
    <Screen title="도움" back help={false}>
      <span className="rs-tag">도움과 쉬어가기</span>
      <div className="stack" style={{ gap: 4 }}>
        <h2 className="title">잠시 쉬어도 괜찮아요.</h2>
        <p className="sub">지금 편한 방법을 골라 주세요.</p>
      </div>
      <Card tone="pet">
        <PetArt kind={pet} size={120} />
        <p className="title">준비되면 이어가요.</p>
      </Card>
      <div className="stack">
        <Button variant="secondary" to={P.settings}>설정 바꾸기</Button>
        <Button onClick={() => nav(-1)}>계속 연습하기</Button>
        <Button variant="secondary" to={P.home}>오늘은 여기까지</Button>
      </div>
      <Card>
        <p className="rs-h">자주 묻는 것</p>
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary style={{ minHeight: 'var(--tap)', display: 'flex', alignItems: 'center', fontWeight: 700, cursor: 'pointer' }}>{q}</summary>
            <p className="sub">{a}</p>
          </details>
        ))}
      </Card>
      <CounselInfo />
    </Screen>
  );
}
