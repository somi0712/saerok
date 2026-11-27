import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { P, TABS } from '@/app/paths';
import { useApp, type PetKind } from '@/store/state';
import { useAccount } from '@/store/account';
import './ui.css';

// 앱 전체가 한 세트의 선 아이콘(24px 격자, 굵기 2)을 쓴다. 이모지 대신 이 아이콘을 쓴다.
// 사물 아이콘(apple … sprout)은 연습·테스트에서 기억할 물건 그림으로 쓴다.
export type IconName =
  | 'home' | 'book' | 'grid' | 'chart' | 'gear' | 'help' | 'back' | 'next' | 'check' | 'calendar' | 'mic' | 'speaker' | 'close'
  | 'chat' | 'lock' | 'seed' | 'heart' | 'bulb'
  | 'apple' | 'milk' | 'bread' | 'carrot' | 'fish' | 'cup' | 'pill' | 'glasses' | 'key' | 'umbrella' | 'clock'
  | 'star' | 'tree' | 'chair' | 'house' | 'mailbox' | 'car' | 'newspaper' | 'sprout';

const PATHS: Record<IconName, ReactNode> = {
  next: <path d="m9 5 7 7-7 7" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.4A8 8 0 1 1 21 12z" />,
  lock: <path d="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4" />,
  seed: <path d="M12 21c-3.3 0-6-2.5-6-6 0-4.5 6-12 6-12s6 7.5 6 12c0 3.5-2.7 6-6 6zM12 21v-7" />,
  heart: <path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 8 2.3C20 15.4 12 20 12 20z" />,
  bulb: <path d="M9 18h6M10 21h4M15 14c.2-1 .7-1.7 1.5-2.5A5 5 0 1 0 7.5 11.5c.8.8 1.3 1.5 1.5 2.5z" />,
  apple: <path d="M12 7c-1-.6-2.6-1.6-4.5-1.6A4.3 4.3 0 0 0 3 10c0 4.7 3 11 5.5 11 1.4 0 2.2-.9 3.5-.9s2.1.9 3.5.9C18 21 21 14.7 21 10a4.3 4.3 0 0 0-4.5-4.6C14.6 5.4 13 6.4 12 7zM12 7c0-2 .8-3.6 2.5-4.5" />,
  milk: <path d="M8 3h8M9 3v3l-2 3.5V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5L15 6V3M7 14c1.7-.8 3.3-.8 5 0s3.3.8 5 0" />,
  bread: <path d="M6 20V11a4 4 0 0 1 1-7.5h10A4 4 0 0 1 18 11v9z" />,
  carrot: <path d="M14 10 4 20M14 10c2.5 2.5 1.5 5-1 6.5L4 20l3.5-9c1.5-2.5 4-3.5 6.5-1zM14 10l3-5M14 10l5-3M9 15l-2-2" />,
  fish: <path d="M3 12c2.5-4 6-6 10-6 4 0 7 3 8 6-1 3-4 6-8 6-4 0-7.5-2-10-6zM3 12l-1-4M3 12l-1 4M16 11h.01" />,
  cup: <path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3" />,
  pill: <path d="M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7zM8.5 8.5l7 7" />,
  glasses: <path d="M2 14a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM14 14a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM10 14c.6-.7 1.3-1 2-1s1.4.3 2 1M2.5 12 5 6.5C5.6 5.5 6.3 5 7.5 5M21.5 12 19 6.5c-.6-1-1.3-1.5-2.5-1.5" />,
  key: <path d="M3 15.5a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0zM11 12l9-9M16 7l3 3M18.5 4.5l2 2" />,
  umbrella: <path d="M21 12a9 9 0 0 0-18 0zM12 12v7a2 2 0 0 0 4 0M12 3V2" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />,
  tree: <path d="M8 18a4 4 0 0 1-2.2-7.3A3.5 3.5 0 0 1 9 6V6a3 3 0 1 1 6 0 3.5 3.5 0 0 1 3.2 4.7A4 4 0 0 1 16 18zM12 18v4" />,
  chair: <path d="M7 3h10v8H7zM5 11h14v3H5zM7 14v7M17 14v7" />,
  house: <path d="M3 10.5 12 3l9 7.5M5 9v12h14V9M10 21v-6h4v6" />,
  mailbox: <path d="M4 9a4 4 0 0 1 8 0v10H4zM12 9h6a2 2 0 0 1 2 2v8h-8M7 13h2M16 9V5h3" />,
  car: <path d="M5 16v-4l2-5h10l2 5v4zM3 16h18M7 16v3M17 16v3M5 12h14" />,
  newspaper: <path d="M6 4h14v15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9h3M6 4v15a2 2 0 0 1-1 1.7M9 8h8M9 12h8M9 16h5" />,
  sprout: <path d="M12 21v-9M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5" />,
  home: <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  book: <path d="M4 5a2 2 0 0 1 2-1h5v16H6a2 2 0 0 0-2 1zM20 5a2 2 0 0 0-2-1h-5v16h5a2 2 0 0 1 2 1z" />,
  grid: <path d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z" />,
  chart: <path d="M4 4v16h16M8 16v-4M12 16V8M16 16v-6" />,
  gear: <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm8 3-2-.6-.5-1.3 1-1.8-1.8-1.8-1.8 1-1.3-.5L13 4h-2l-.6 2.1-1.3.5-1.8-1-1.8 1.8 1 1.8-.5 1.3L4 11v2l2 .6.5 1.3-1 1.8 1.8 1.8 1.8-1 1.3.5.6 2h2l.6-2 1.3-.5 1.8 1 1.8-1.8-1-1.8.5-1.3 2-.6z" />,
  help: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01" />,
  back: <path d="M15 5 8 12l7 7" />,
  check: <path d="m5 12 5 5 9-10" />,
  calendar: <path d="M5 6h14v14H5zM5 10h14M9 4v4M15 4v4" />,
  mic: <path d="M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v3" />,
  speaker: <path d="M5 10v4h3l4 4V6L8 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

interface ScreenProps {
  title?: string;
  /** true 면 뒤로 가기, 문자열이면 그 주소로 이동 */
  back?: boolean | string;
  /** 홈 시안(01)처럼 '새록' 로고와 설정·도움 버튼 */
  brand?: boolean;
  /** 하단 탭 4개 표시 (홈·배우기·연습·내 기록) */
  tabs?: boolean;
  /** 상단 오른쪽 도움 버튼 (기본: 표시) */
  help?: boolean;
  /** 화면 아래 고정 버튼 영역 */
  footer?: ReactNode;
  children: ReactNode;
}

/** 모든 화면의 틀. 시안: 상단(뒤로·제목·도움) + 본문 + 하단 버튼 또는 하단 탭 */
export function Screen({ title, back, brand, tabs, help = true, footer, children }: ScreenProps) {
  const nav = useNavigate();
  useEffect(() => {
    document.title = title && title !== '새록' ? `${title} · 새록` : '새록';
    window.scrollTo(0, 0);
  }, [title]);
  return (
    <div className={brand ? "screen screen-wide" : "screen"}>
      <header className="screen-top">
        {back && (
          <button className="icon-btn" aria-label="뒤로" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}>
            <Icon name="back" />
          </button>
        )}
        {brand ? <span className="brand">새록</span> : <h1>{title}</h1>}
        {brand && (
          <Link className="icon-btn" to={P.settings} aria-label="설정">
            <Icon name="gear" />
          </Link>
        )}
        {help && (
          <Link className="icon-btn" to={P.help}>
            <Icon name="help" /> 도움
          </Link>
        )}
      </header>
      <main className="screen-body" id="main-content" tabIndex={-1}>{children}</main>
      {footer && <div className="screen-foot">{footer}</div>}
      {tabs && <TabBar />}
    </div>
  );
}

const TAB_ICON = { home: 'home', book: 'book', grid: 'grid', chart: 'chart', calendar: 'calendar', heart: 'heart' } as const;

export function SiteHeader() {
  const onboarded = useApp((state) => state.onboarded);
  const { userId } = useAccount();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="site-skip" href="#main-content">본문으로 건너뛰기</a>
        <Link className="site-brand" to={P.home}>
          <img src="/icon.svg" alt="" width="34" height="34" />
          새록
        </Link>
        {onboarded && (
          <>
            <TabBar desktop />
            <div className="site-account">
              <Link to={P.settings}>설정</Link>
              {!userId && <Link to={P.login}>로그인</Link>}
              <Link to={P.help}>도움</Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export function TabBar({ desktop = false }: { desktop?: boolean }) {
  return (
    <nav className={desktop ? "site-nav" : "tabbar"} aria-label="주요 메뉴">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === P.home} className={({ isActive }) => (isActive ? 'active' : undefined)}>
          {!desktop && <Icon name={TAB_ICON[t.icon]} />}
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

type BtnProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
};

export function Button({ variant = 'primary', to, onClick, disabled, children }: BtnProps) {
  const cls = `btn btn-${variant}`;
  if (to && !disabled) return <Link className={cls} to={to} onClick={onClick}>{children}</Link>;
  return <button type="button" className={cls} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Card({ tone, children, as: As = 'section' }: { tone?: 'lavender' | 'mint' | 'pet'; children: ReactNode; as?: 'section' | 'div' }) {
  return <As className={`card${tone ? ` card-${tone}` : ''}`}>{children}</As>;
}

/** 큰 선택지 하나. 여러 개를 role="radiogroup" 안에 둔다. */
export function Choice({ checked, onSelect, title, desc }: { checked: boolean; onSelect: () => void; title: ReactNode; desc?: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={checked} className="choice" onClick={onSelect}>
      <strong>{title}</strong>
      {desc && <span>{desc}</span>}
    </button>
  );
}

export function Steps({ now, total, label }: { now: number; total: number; label?: string }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="small">{label ?? `${now} / ${total}`}</span>
      <div className="steps" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={now}>
        <i style={{ width: `${(now / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function Ring({ value, total, size = 96 }: { value: number; total: number; size?: number }) {
  const r = 40, c = 2 * Math.PI * r, pct = total ? Math.min(1, value / total) : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${total}번 중 ${value}번`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--lavender)" strokeWidth="10" />
      {pct > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 50 50)" />}
      <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--ink)">{value}/{total}</text>
    </svg>
  );
}

export const PET_NAMES: Record<PetKind, string> = { mongle: '몽글', saebom: '새봄', banjjak: '반짝' };

/** 기억 친구 그림. public/pets/<kind>.png */
export function PetArt({ kind = 'mongle', size = 160 }: { kind?: PetKind; size?: number }) {
  return <img src={`/pets/${kind}.png`} width={size} height={size} alt={`${PET_NAMES[kind]} 캐릭터`} style={{ objectFit: 'contain' }} />;
}

let showToast: (text: string) => void = () => {};
/** 화면 아래 짧은 안내 */
export const toast = (text: string) => showToast(text);

export function ToastHost() {
  const [text, setText] = useState('');
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    showToast = (s) => {
      setText(s);
      clearTimeout(t);
      t = setTimeout(() => setText(''), 2600);
    };
    return () => clearTimeout(t);
  }, []);
  return text ? <div className="toast" role="status" aria-live="polite">{text}</div> : null;
}
