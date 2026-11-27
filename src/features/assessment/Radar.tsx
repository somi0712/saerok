import { MODULES, MODULE_IDS } from './data';
import type { ModuleId } from '@/store/state';

/** 5영역 점수 오각형 (0–100). 글자 라벨과 함께 읽히도록 aria-label에 점수를 모두 적는다. */
export function Radar({ scores, size = 260 }: { scores: Record<ModuleId, number>; size?: number }) {
  const c = size / 2;
  const R = c - 46;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / MODULE_IDS.length;
    return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v] as const;
  };
  const poly = (v: (i: number) => number) => MODULE_IDS.map((_, i) => pt(i, v(i)).join(',')).join(' ');
  const label = MODULE_IDS.map((m) => `${MODULES[m]} ${scores[m]}점`).join(', ');
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label={`영역별 점수: ${label}`}>
      {[0.25, 0.5, 0.75, 1].map((v) => <polygon key={v} points={poly(() => v)} className="radar-ring" />)}
      {MODULE_IDS.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} className="radar-ring" />)}
      <polygon points={poly((i) => Math.max(0.04, scores[MODULE_IDS[i]] / 100))} className="radar-value" />
      {MODULE_IDS.map((m, i) => {
        const [x, y] = pt(i, 1.24);
        return <text key={m} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="radar-label">{MODULES[m].replace('(지남력)', '')}</text>;
      })}
    </svg>
  );
}
