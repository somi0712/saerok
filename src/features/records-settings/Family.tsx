import { useState } from 'react';
import { Button, Card, Screen, toast } from '@/design/ui';
import { app, useApp } from '@/store/state';
import { formatPhone, isPhone, onlyDigits } from './logic';
import './records.css';

/**
 * 보호자 연동 — 전화번호만 저장하고, 누르면 휴대폰의 전화 앱으로 건다 (tel: 링크).
 * 새록이 보호자에게 대신 연락하거나 기록을 보내지 않는다. 번호는 이 기기에만 저장한다.
 */
export default function Family() {
  const saved = useApp((s) => s.family.phone ?? '');
  const [phone, setPhone] = useState(formatPhone(saved));
  const [editing, setEditing] = useState(!saved);
  const valid = isPhone(phone);

  const save = () => {
    if (!valid) return;
    app.set((s) => ({ ...s, family: { ...s.family, phone: onlyDigits(phone) } }));
    setEditing(false);
    toast('보호자 전화번호를 저장했어요.');
  };
  const remove = () => {
    app.set((s) => ({ ...s, family: { ...s.family, phone: undefined } }));
    setPhone('');
    setEditing(true);
    toast('보호자 전화번호를 지웠어요.');
  };

  return (
    <Screen title="보호자 연락처" back>
      <h2 className="title">필요할 때 바로 전화할 수 있게 해 둬요.</h2>
      {saved && !editing ? (
        <Card tone="mint">
          <span className="eyebrow">보호자</span>
          <p className="rs-phone">{formatPhone(saved)}</p>
          <a className="btn btn-primary" href={`tel:${saved}`}>보호자에게 전화하기</a>
          <Button variant="secondary" onClick={() => setEditing(true)}>번호 바꾸기</Button>
          <Button variant="ghost" onClick={remove}>번호 지우기</Button>
        </Card>
      ) : (
        <Card>
          <label className="stack">
            <span className="rs-label">보호자 전화번호</span>
            <input className="rs-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="010-1234-5678" value={phone}
              onChange={(e) => setPhone(e.target.value)} onBlur={() => valid && setPhone(formatPhone(phone))} />
          </label>
          {phone && !valid && <p className="small" role="status">숫자만 9–11자리로 적어 주세요. 예: 010-1234-5678</p>}
          <Button onClick={save} disabled={!valid}>저장하기</Button>
          {saved && <Button variant="ghost" onClick={() => { setPhone(formatPhone(saved)); setEditing(false); }}>그대로 두기</Button>}
        </Card>
      )}
      <p className="small">번호는 이 기기에만 저장돼요. 새록이 보호자에게 대신 연락하거나 기록을 보내지 않아요. 휴대폰에서 누르면 전화 앱이 열려요.</p>
    </Screen>
  );
}
