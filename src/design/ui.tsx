import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { P, TABS } from '@/app/paths';
import type { PetKind } from '@/store/state';
import './ui.css';

type IconName = 'home' | 'book' | 'grid' | 'chart' | 'gear' | 'help' | 'back' | 'check' | 'calendar' | 'mic' | 'speaker' | 'close';

const PATHS: Record<IconName, ReactNode> = {
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

export function Icon({ name, size = 26 }: { name: IconName; size?: number }) {
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
    <div className="screen">
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
      <main className="screen-body">{children}</main>
      {footer && <div className="screen-foot">{footer}</div>}
      {tabs && <TabBar />}
    </div>
  );
}

const TAB_ICON = { home: 'home', book: 'book', grid: 'grid', chart: 'chart' } as const;

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === P.home} className={({ isActive }) => (isActive ? 'active' : undefined)}>
          <Icon name={TAB_ICON[t.icon]} />
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
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 50 50)" />
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
