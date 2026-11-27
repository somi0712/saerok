import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Icon, Screen, toast } from '@/design/ui';
import { P } from '@/app/paths';
import { database } from '@/data/announcements';
import { saveAccountInfo, useAccount } from '@/store/account';
import { app, useApp, type FontSize } from '@/store/state';
import { CLOUD_NOTICE, disableCloud, enableCloud } from '@/store/cloudSync';
import { formatPhone } from './logic';
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

/** 이름 — 로그인한 계정에만 있고(가입 때 적음), 홈 인사말에서 이 이름으로 부른다 */
function NameCard() {
  const { userId, name } = useAccount();
  const [value, setValue] = useState(name ?? '');
  const [busy, setBusy] = useState(false);
  if (!userId) {
    return (
      <Card>
        <p className="rs-h">이름</p>
        <p className="sub">로그인하지 않으면 이름을 부르지 않아요. 로그인하면 가입할 때 적은 이름으로 불러 드려요.</p>
        <Button variant="secondary" to={P.login}>로그인하기</Button>
      </Card>
    );
  }
  const save = async () => {
    setBusy(true);
    const ok = await saveAccountInfo({ name: value.trim().slice(0, 20) });
    setBusy(false);
    toast(ok ? '이름을 바꿨어요.' : '이름을 저장하지 못했어요. 잠시 후 다시 해 주세요.');
  };
  return (
    <Card>
      <label className="stack">
        <span className="rs-h">이름</span>
        <input className="rs-input" type="text" autoComplete="name" maxLength={20} value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <Button variant="secondary" onClick={save} disabled={busy || !value.trim() || value.trim() === name}>이름 저장하기</Button>
    </Card>
  );
}

/** 시안 11 설정과 보호자 연락처 */
export default function Settings() {
  const nav = useNavigate();
  const { profile, settings, family, consent } = useApp();
  const { userId } = useAccount();
  const [wipeAsk, setWipeAsk] = useState(false);
  const [cloudAsk, setCloudAsk] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);

  const turnOffCloud = async () => {
    setCloudBusy(true);
    const ok = await disableCloud();
    setCloudBusy(false);
    setCloudAsk(false);
    toast(ok ? '서버에 보관한 기록을 지웠어요. 이 기기의 기록은 그대로예요.' : '서버 기록을 지우지 못했어요. 잠시 후 다시 시도해 주세요.');
  };

  const setSettings = (patch: Partial<typeof settings>) => app.set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const wipe = () => {
    app.reset();
    toast('모든 기록을 지웠어요.');
    nav(P.start, { replace: true });
  };

  return (
    <Screen title="설정" back>
      <span className="rs-tag">내게 맞게</span>
      <div className="rs-head">
        <h2 className="title">내게 맞게 정해요.</h2>
        <p className="sub">설정과 공유를 언제든 바꿔요.</p>
      </div>

      <NameCard />

      <Card>
        <p className="rs-h">내 프로필</p>
        {profile.ageBand || profile.gender || profile.methodFamiliarity ? (
          <div className="rs-head">
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
            <button key={v} type="button" aria-pressed={settings.fontSize === v} onClick={() => setSettings({ fontSize: v })}>{settings.fontSize === v && <Icon name="check" size={20} />}{l}</button>
          ))}
        </div>
        <hr className="rs-divider" />
        <p className="rs-h" id="rate-l">읽어 주는 속도</p>
        <div className="rs-seg" role="group" aria-labelledby="rate-l">
          {RATES.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={settings.voiceRate === v} onClick={() => setSettings({ voiceRate: v })}>{settings.voiceRate === v && <Icon name="check" size={20} />}{l}</button>
          ))}
        </div>
        <label className="rs-check">
          <input type="checkbox" checked={settings.soundOn} onChange={(e) => setSettings({ soundOn: e.target.checked })} />
          소리로 읽어 주기
        </label>
      </Card>

      <section className="card card-lavender">
        <span className="rs-tag rs-tag-white">보호자 연락처</span>
        {family.phone ? (
          <>
            <p className="rs-h">{formatPhone(family.phone)}</p>
            <a className="btn btn-primary" href={`tel:${family.phone}`}>보호자에게 전화하기</a>
            <Button variant="secondary" to={P.family}>번호 바꾸기</Button>
          </>
        ) : (
          <>
            <p className="sub">전화번호만 적어 두면, 누를 때 휴대폰 전화 앱으로 바로 걸 수 있어요.</p>
            <Button variant="secondary" to={P.family}>보호자 번호 적기</Button>
          </>
        )}
      </section>

      {userId && (
        <Card>
          <p className="rs-h">내 기록 서버 보관</p>
          <p className="sub">{CLOUD_NOTICE}</p>
          <p>{consent.cloud ? '지금 서버에 보관하고 있어요.' : '지금은 이 기기에만 저장해요.'}</p>
          {!consent.cloud ? (
            <Button variant="secondary" onClick={() => { enableCloud(); toast('이제 연습·테스트 결과를 서버에 보관해요.'); }}>서버에 보관하기</Button>
          ) : cloudAsk ? (
            <div className="stack rs-confirm card">
              <p>서버 보관을 끌까요? 서버에 보관한 연습·테스트 결과를 지워요. 이 기기의 기록은 남아요.</p>
              <Button onClick={() => void turnOffCloud()} disabled={cloudBusy}>{cloudBusy ? '지우는 중' : '끄고 서버 기록 지우기'}</Button>
              <Button variant="secondary" onClick={() => setCloudAsk(false)} disabled={cloudBusy}>계속 보관하기</Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setCloudAsk(true)}>서버 보관 끄기</Button>
          )}
        </Card>
      )}

      <CounselInfo />

      {userId && <Button variant="secondary" onClick={() => {
        void database?.auth.signOut({ scope: 'local' }).then(({ error }) => {
          if (error) toast('로그아웃에 실패했어요. 다시 시도해 주세요.');
          else nav(P.home);
        });
      }}>로그아웃</Button>}

      <Card>
        <p className="rs-h">기록 지우기</p>
        {wipeAsk ? (
          <div className="stack rs-confirm card">
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
