import { useEffect, useState } from 'react';
import type { RouteObject } from 'react-router-dom';
import { P } from '@/app/paths';
import { Button, Card, Icon, Screen } from '@/design/ui';
import { app, useApp, WEEKDAYS } from '@/store/state';
import { attendanceDate, attendanceStreak, monthCells } from './logic';
import './missions.css';

const monthLabel = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' });
const dayLabel = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' });

function Missions() {
  const dates = new Set(useApp((s) => s.attendance));
  const [now, setNow] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = attendanceDate(now);
  const attended = dates.has(today);
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const cells = monthCells(month);
  const total = cells.filter((date) => date && dates.has(attendanceDate(date))).length;

  function checkIn() {
    const time = new Date();
    const key = attendanceDate(time);
    app.set((state) => state.attendance.includes(key) ? state : ({
      ...state, attendance: [...state.attendance, key],
    }));
    setNow(time);
    setOffset(0);
    setMessage('오늘 출석을 기록했어요.');
  }

  return (
    <Screen title="미션" tabs>
      <span className="mission-tag">미션</span>
      <div className="mission-head">
        <h2 className="title">하루 한 번, 출석해요.</h2>
        <p className="sub">출석한 날은 달력에 표시돼요.</p>
      </div>
      <div className="web-columns mission-layout">
        <Card tone="lavender">
          <p className="mission-h">오늘의 출석</p>
          <p className="mission-streak">연속 <b>{attendanceStreak(dates, now)}</b>일</p>
          <p className="sub">하루 한 번 출석을 기록할 수 있어요.</p>
          <Button disabled={attended} onClick={checkIn}>{attended ? '오늘 출석 완료' : '오늘 출석 체크'}</Button>
          <p className="small" role="status">{message || '출석은 이 브라우저의 내 계정에 저장돼요.'}</p>
        </Card>
        <Card>
          <div className="mission-month">
            <button type="button" className="icon-btn" aria-label="이전 달" onClick={() => setOffset((x) => x - 1)}>
              <Icon name="back" size={20} />
            </button>
            <p className="mission-h" aria-live="polite">{monthLabel.format(month)}</p>
            <button type="button" className="icon-btn" aria-label="다음 달" disabled={offset === 0}
              onClick={() => setOffset((x) => x + 1)}><Icon name="next" size={20} /></button>
          </div>
          <div className="mission-calendar" role="group" aria-label="월별 출석 달력">
            {WEEKDAYS.map((day) => <span key={day} className="small" aria-label={day + '요일'}>{day}</span>)}
            {cells.map((date, i) => {
              if (!date) return <span aria-hidden="true" key={i} />;
              const key = attendanceDate(date);
              const done = dates.has(key);
              return <span key={i} className="mission-day" data-attended={done} aria-current={key === today ? 'date' : undefined}>
                <time dateTime={key} aria-label={dayLabel.format(date) + (done ? ' 출석 완료' : '')}>{date.getDate()}</time>
                {done && <Icon name="check" size={12} />}
              </span>;
            })}
          </div>
          <p className="small">이 달에 출석한 날 {total}일</p>
        </Card>
      </div>
    </Screen>
  );
}

export const routes: RouteObject[] = [{ path: P.missions, element: <Missions /> }];
