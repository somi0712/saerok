import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Screen, toast } from '@/design/ui';
import { P } from '@/app/paths';
import { app, useApp, type FontSize } from '@/store/state';
import './records.css';

const SIZES: [FontSize, string][] = [[20, '보통'], [22, '크게'], [24, '더 크게']];
const RATES: [number, string][] = [[0.75, '느리게'], [0.85, '보통'], [1, '조금 빠르게']];

/** 기획안 10-1 S01 정서 안전: 상담 안내 */
export function CounselInfo() {
  return (
    <Card tone="lavender">
      <p className="rs-h">걱정되는 마음이 들 때</p>
      <p className="sub">혼자 고민하지 말고 전문 상담원과 이야기해 보세요. 24시간, 무료예요.</p>
      <p>치매상담콜센터</p>
      <p className="rs-phone">1899-9988</p>
      <a className="btn btn-secondary" href="tel:18999988">전화 걸기</a>
    </Card>
  );
}

/** 시안 11 설정과 가족 공유 */
export default function Settings() {
  const nav = useNavigate();
  const { profile, settings, family } = useApp();
  const [stopAsk, setStopAsk] = useState(false);
  const [wipeAsk, setWipeAsk] = useState(false);

  const setSettings = (patch: Partial<typeof settings>) => app.set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const shared = [family.share.access && '접속 여부', family.share.practice && '연습 기록', family.share.diary && '일기'].filter(Boolean);

  const stopSharing = () => {
    app.set((s) => ({ ...s, family: { ...s.family, linked: false } }));
    setStopAsk(false);
    toast('가족 공유를 그만했어요. 언제든 다시 켤 수 있어요.');
  };
  const wipe = () => {
    app.reset();
    toast('모든 기록을 지웠어요.');
    nav(P.start, { replace: true });
  };

  return (
    <Screen title="설정" back>
      <span className="rs-tag">내게 맞게</span>
      <div className="stack" style={{ gap: 4 }}>
        <h2 className="title">내게 맞게 정해요.</h2>
        <p className="sub">설정과 공유를 언제든 바꿔요.</p>
      </div>

      <Card>
        <p className="rs-h">내 프로필</p>
        {profile.name ? (
          <div className="stack" style={{ gap: 4 }}>
            <p>{profile.name}</p>
            {profile.ageBand && <p>{profile.ageBand}</p>}
            {profile.gender && <p>{profile.gender}</p>}
            {profile.methodFamiliarity && <p>{profile.methodFamiliarity}</p>}
          </div>
        ) : (
          <p className="sub">아직 정하지 않았어요.</p>
        )}
        <Button variant="secondary" to={`${P.profile}?from=settings`}>프로필 고치기</Button>
      </Card>

      <Card>
        <p className="rs-h" id="fs-l">글자 크기</p>
        <div className="rs-seg" role="group" aria-labelledby="fs-l">
          {SIZES.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={settings.fontSize === v} onClick={() => setSettings({ fontSize: v })}>{l}</button>
          ))}
        </div>
        <hr className="rs-divider" />
        <p className="rs-h" id="rate-l">읽어 주는 속도</p>
        <div className="rs-seg" role="group" aria-labelledby="rate-l">
          {RATES.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={settings.voiceRate === v} onClick={() => setSettings({ voiceRate: v })}>{l}</button>
          ))}
        </div>
        <label className="rs-check">
          <input type="checkbox" checked={settings.soundOn} onChange={(e) => setSettings({ soundOn: e.target.checked })} />
          소리로 읽어 주기
        </label>
      </Card>

      <section className="card card-lavender">
        <span className="rs-tag rs-tag-white">{family.linked ? `가족과 공유 중 · ${shared.length ? shared.join(', ') : '공유 항목 없음'}` : '현재 공유하지 않아요'}</span>
        <p className="rs-h">공유는 내가 선택해요.</p>
        <p className="sub">가족은 연습 방법을 제안할 수 있어요. 바꿀지는 언제나 내가 정해요.</p>
        <Button variant="secondary" to={P.family}>가족 공유 살펴보기</Button>
        {family.linked &&
          (stopAsk ? (
            <div className="card rs-confirm">
              <p>가족 공유를 그만할까요? 가족 화면에 더 이상 아무것도 보이지 않아요.</p>
              <Button onClick={stopSharing}>공유 그만하기</Button>
              <Button variant="secondary" onClick={() => setStopAsk(false)}>계속 공유하기</Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setStopAsk(true)}>공유 그만하기</Button>
          ))}
      </section>

      <CounselInfo />

      <Card>
        <p className="rs-h">기록 지우기</p>
        {wipeAsk ? (
          <div className="stack rs-confirm card" style={{ boxShadow: 'none' }}>
            <p>연습 기록, 일기, 설정을 모두 지울까요? 지우면 되돌릴 수 없어요.</p>
            <Button onClick={wipe}>모두 지우기</Button>
            <Button variant="secondary" onClick={() => setWipeAsk(false)}>그대로 두기</Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setWipeAsk(true)}>이 기기의 기록 모두 지우기</Button>
        )}
      </Card>
    </Screen>
  );
}
