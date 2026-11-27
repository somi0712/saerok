import { useNavigate } from 'react-router-dom';
import { Button, Card, PetArt, Screen } from '@/design/ui';
import { P } from '@/app/paths';
import { useApp } from '@/store/state';
import { CounselInfo } from './Settings';
import './records.css';

const FAQ = [
  ['글자가 작아요', '설정에서 글자 크기를 "크게"나 "더 크게"로 바꿔 보세요.'],
  ['소리가 안 들려요', '휴대폰 소리를 키우고, 설정에서 "소리로 읽어 주기"가 켜져 있는지 봐 주세요.'],
  ['보호자에게 전화하고 싶어요', '설정의 보호자 연락처에 번호를 적어 두면, 누를 때 전화 앱으로 바로 걸려요.'],
];

/** 시안 12 도움과 쉬어가기: 캐릭터 카드 → 도움말 → 버튼 셋 */
export default function Help() {
  const nav = useNavigate();
  const pet = useApp((s) => s.pet.kind);
  return (
    <Screen title="도움" back help={false}>
      <span className="rs-tag">도움과 쉬어가기</span>
      <div className="rs-head">
        <h2 className="title">잠시 쉬어도 괜찮아요.</h2>
        <p className="sub">지금 편한 방법을 골라 주세요.</p>
      </div>
      <Card tone="pet">
        <div className="stack rs-rest">
          <PetArt kind={pet} size={120} />
          <p className="title">준비되면 이어가요.</p>
        </div>
      </Card>
      <Card>
        <p className="rs-h">글자가 작거나 소리가 작나요?</p>
        <div className="rs-faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p className="sub">{a}</p>
            </details>
          ))}
        </div>
      </Card>
      <div className="stack">
        <Button variant="secondary" to={P.rest}>오늘 해볼 쉼 고르기</Button>
        <Button variant="secondary" to={P.settings}>설정 바꾸기</Button>
        <Button onClick={() => nav(-1)}>계속 연습하기</Button>
        <Button variant="secondary" to={P.home}>오늘은 여기까지</Button>
      </div>
      <CounselInfo />
    </Screen>
  );
}
