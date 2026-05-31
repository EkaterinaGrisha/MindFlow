import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  RotateCcw,
  Sigma,
  Wand2,
  ZoomIn,
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  text: '#1e293b',
  muted: '#64748b',
  mutedLight: '#94a3b8',
  primary: '#6366f1',
  primaryLight: '#eef2ff',
  primaryBorder: '#c7d2fe',
  primaryDark: '#4f46e5',
  accent: '#7c3aed',
  green: '#10b981',
  greenLight: '#d1fae5',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  red: '#ef4444',
  redLight: '#fee2e2',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  pink: '#ec4899',
  white: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
};

// ─── Math helpers ─────────────────────────────────────────────────────────────
type Vec2 = [number, number];
type Matrix2 = [[number, number], [number, number]];
const EPS = 1e-9;

const dot2 = (a: Vec2, b: Vec2) => a[0] * b[0] + a[1] * b[1];
const norm2 = ([x, y]: Vec2) => Math.hypot(x, y);
const normalize = (v: Vec2): Vec2 => { const n = norm2(v); return n < EPS ? [1, 0] : [v[0] / n, v[1] / n]; };
const apply = (A: Matrix2, [x, y]: Vec2): Vec2 => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
const perp = ([x, y]: Vec2): Vec2 => [-y, x];
const fmt = (x: number) => (Math.abs(x) < 1e-10 ? '0' : Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));

function svd2x2(A: Matrix2) {
  const [[a, b], [c, d]] = A;
  const s11 = a * a + c * c, s12 = a * b + c * d, s22 = b * b + d * d;
  const tr = s11 + s22;
  const delta = Math.hypot(s11 - s22, 2 * s12);
  const l1 = Math.max(0, (tr + delta) / 2), l2 = Math.max(0, (tr - delta) / 2);
  const sigma1 = Math.sqrt(l1), sigma2 = Math.sqrt(l2);
  const v1 = delta < 1e-10 ? ([1, 0] as Vec2) : normalize(Math.abs(s12) > 1e-10 ? [l1 - s22, s12] : (s11 >= s22 ? [1, 0] : [0, 1]));
  const v2 = perp(v1);
  const u1 = sigma1 > EPS ? normalize(apply(A, v1)) : ([1, 0] as Vec2);
  const u2 = sigma2 > EPS ? normalize(apply(A, v2)) : perp(u1);
  return { sigma1, sigma2, u1, u2, v1, v2 };
}

const layerMatrix = (sigma: number, u: Vec2, v: Vec2): Matrix2 => [
  [sigma * u[0] * v[0], sigma * u[0] * v[1]],
  [sigma * u[1] * v[0], sigma * u[1] * v[1]],
];
const addM = (A: Matrix2, B: Matrix2): Matrix2 => [[A[0][0]+B[0][0], A[0][1]+B[0][1]], [A[1][0]+B[1][0], A[1][1]+B[1][1]]];
const scaleM = (A: Matrix2, t: number): Matrix2 => [[A[0][0]*t, A[0][1]*t], [A[1][0]*t, A[1][1]*t]];
const ZERO: Matrix2 = [[0,0],[0,0]];

function ellipsePath(A: Matrix2, cx: number, cy: number, s = 72) {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const [x, y] = apply(A, [Math.cos(t), Math.sin(t)]);
    pts.push(`${i === 0 ? 'M' : 'L'} ${(cx + x * s).toFixed(2)} ${(cy - y * s).toFixed(2)}`);
  }
  return `${pts.join(' ')} Z`;
}

function circlePath(cx: number, cy: number, r: number) {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
}

function arrow(x1: number, y1: number, x2: number, y2: number, color: string, width = 2.5) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2) return null;
  const nx = dx / len, ny = dy / len;
  const ax = x2 - nx * 10 + ny * 5, ay = y2 - ny * 10 - nx * 5;
  const bx = x2 - nx * 10 - ny * 5, by = y2 - ny * 10 + nx * 5;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${ax},${ay} ${bx},${by}`} fill={color} />
    </g>
  );
}

// ─── UI primitives ────────────────────────────────────────────────────────────
function InfoBox({ icon: Icon, title, children, color = T.primary }: { icon: any; title: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: `${color}0b`, border: `1px solid ${color}30`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <Icon size={16} color={color} />
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Callout({ color = T.amber, title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 12, padding: '13px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function Collapsible({ title, children, color = T.primary }: { title: string; children: React.ReactNode; color?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${color}30`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: `${color}0a`, border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{title}</span>
        {open ? <ChevronUp size={15} color={color} /> : <ChevronDown size={15} color={color} />}
      </button>
      {open && <div style={{ padding: '12px 16px', fontSize: 13, color: T.text, lineHeight: 1.75, background: T.white }}>{children}</div>}
    </div>
  );
}

// ─── Layer panel ──────────────────────────────────────────────────────────────
function LayerPanel({ label, sigma, u, rank, color, children }: { label: string; sigma: number; u: Vec2; rank: number; color: string; children?: React.ReactNode }) {
  return (
    <div style={{ background: `${color}08`, border: `1.5px solid ${color}35`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={15} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color }}>{label}</div>
          <div style={{ fontSize: 11, color: T.muted }}>ранг = {rank}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' as const }}>
          <div style={{ fontSize: 20, fontWeight: 900, color }}>σ = {fmt(sigma)}</div>
          <div style={{ fontSize: 10, color: T.mutedLight }}>u = [{fmt(u[0])}, {fmt(u[1])}]</div>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Single ellipse panel ─────────────────────────────────────────────────────
function EllipsePanel({ title, subtitle, M, showOrigin, color, extra, cx = 120, cy = 110 }: {
  title: string; subtitle: string; M: Matrix2; showOrigin?: boolean; color: string; extra?: React.ReactNode; cx?: number; cy?: number;
}) {
  const s = 72;
  const svd = useMemo(() => svd2x2(M), [M]);
  const isDegenerate = svd.sigma2 < 0.05;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px', flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{subtitle}</div>
      <svg viewBox={`0 0 240 220`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid */}
        <line x1={cx} y1={20} x2={cx} y2={200} stroke={T.border} />
        <line x1={20} y1={cy} x2={220} y2={cy} stroke={T.border} />
        {/* Origin circle */}
        {showOrigin && <path d={circlePath(cx, cy, s)} fill="none" stroke={T.border} strokeDasharray="4 4" strokeWidth="1.5" />}
        {/* Ellipse fill */}
        <path d={ellipsePath(M, cx, cy, s)} fill={`${color}14`} stroke={color} strokeWidth="2.5" />
        {/* Axes arrows */}
        {arrow(cx, cy, cx + svd.u1[0] * svd.sigma1 * s, cy - svd.u1[1] * svd.sigma1 * s, color, 2.5)}
        {!isDegenerate && arrow(cx, cy, cx + svd.u2[0] * svd.sigma2 * s, cy - svd.u2[1] * svd.sigma2 * s, T.green, 2)}
        {/* Degenerate label */}
        {isDegenerate && <text x={cx} y={cy + 20} textAnchor="middle" fontSize="11" fill={T.amber} fontWeight="700">→ отрезок (ранг 1)</text>}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill={T.text} />
      </svg>
      {extra}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SVDRank1LayersLab() {
  const [A, setA] = useState<Matrix2>([[2.2, 0.9], [0.4, 1.3]]);
  const [showL1, setShowL1] = useState(true);
  const [showL2, setShowL2] = useState(true);
  const [mix2, setMix2] = useState(1);
  const [intermediate, setIntermediate] = useState(1);

  const svd = useMemo(() => svd2x2(A), [A]);
  const L1 = useMemo(() => layerMatrix(svd.sigma1, svd.u1, svd.v1), [svd]);
  const L2 = useMemo(() => layerMatrix(svd.sigma2, svd.u2, svd.v2), [svd]);
  const L2scaled = useMemo(() => scaleM(L2, mix2), [L2, mix2]);
  const combined = useMemo(() => addM(showL1 ? L1 : ZERO, showL2 ? L2scaled : ZERO), [L1, L2scaled, showL1, showL2]);
  const staged = useMemo(() => addM(L1, scaleM(L2scaled, intermediate)), [L1, L2scaled, intermediate]);

  const setCell = (r: 0|1, c: 0|1, v: number) =>
    setA((p) => { const n: Matrix2 = [[p[0][0], p[0][1]], [p[1][0], p[1][1]]]; n[r][c] = v; return n; });

  const condNum = svd.sigma2 < EPS ? '∞' : fmt(svd.sigma1 / svd.sigma2);
  const dominanceRatio = svd.sigma1 > EPS ? svd.sigma2 / svd.sigma1 : 0;
  const isRank1 = svd.sigma2 < 0.05;

  const matrixLabel = (M: Matrix2) =>
    `[[${fmt(M[0][0])}, ${fmt(M[0][1])}], [${fmt(M[1][0])}, ${fmt(M[1][1])}]]`;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: '0 0 40px' }}>

      {/* ── Header ── */}
      <div style={{ borderRadius: 20, background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.white} 55%, #fdf4ff 100%)`, border: `1px solid ${T.primaryBorder}`, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Layers size={18} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: T.primary, textTransform: 'uppercase' as const }}>Лаборатория 1 · SVD</span>
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>
          Сборка матрицы из слоёв ранга 1
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.7 }}>
          <strong>Исследовательский вопрос:</strong> SVD говорит: A = σ₁u₁v₁ᵀ + σ₂u₂v₂ᵀ + … Каждое слагаемое — матрица ранга 1. Как выглядит вклад каждого слоя и что происходит, когда они складываются?
        </p>
      </div>

      {/* ── Theory ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <InfoBox icon={Sigma} title="Слой ранга 1: σᵢuᵢvᵢᵀ" color={T.primary}>
          Матрица ранга 1 — это внешнее произведение двух векторов, умноженное на σᵢ. Все её столбцы пропорциональны uᵢ. Применённая к окружности, она «схлопывает» её в отрезок вдоль uᵢ длиной σᵢ.
        </InfoBox>
        <InfoBox icon={Layers} title="Сумма слоёв = матрица" color={T.violet}>
          A = σ₁u₁v₁ᵀ + σ₂u₂v₂ᵀ. Два слоя дают два ортогональных отрезка, которые «разворачивают» окружность в эллипс. σ₁ — длина большой оси, σ₂ — малой.
        </InfoBox>
        <InfoBox icon={ZoomIn} title="Зачем это важно?" color={T.green}>
          Если σ₂ ≪ σ₁ — второй слой почти не влияет на результат. Удалив его, мы получим оптимальное приближение ранга 1. Это и есть идея сжатия через SVD.
        </InfoBox>
      </div>

      {/* ── Matrix controls ── */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Sigma size={15} color={T.primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Матрица A (2×2)</span>
          <button
            onClick={() => { setA([[2.2,0.9],[0.4,1.3]]); setMix2(1); setIntermediate(1); setShowL1(true); setShowL2(true); }}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontSize: 12, cursor: 'pointer', color: T.muted, fontWeight: 600 }}
          >
            <RotateCcw size={13} /> Сбросить
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          {([['a₁₁', 0, 0], ['a₁₂', 0, 1], ['a₂₁', 1, 0], ['a₂₂', 1, 1]] as [string, 0|1, 0|1][]).map(([lbl, r, c]) => (
            <label key={lbl} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 46px', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: T.primary }}>{lbl}</span>
              <input type="range" min={-3} max={3} step={0.1} value={A[r][c]} onChange={(e) => setCell(r, c, Number(e.target.value))} style={{ accentColor: T.primary }} />
              <span style={{ fontSize: 13, fontFamily: 'monospace', textAlign: 'right' as const, color: T.text }}>{fmt(A[r][c])}</span>
            </label>
          ))}
        </div>

        {/* SVD readout */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div style={{ padding: '10px 14px', borderRadius: 12, background: `${T.primary}0d`, border: `1px solid ${T.primaryBorder}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.primary, marginBottom: 4 }}>Первый слой</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>σ₁ = {fmt(svd.sigma1)}</div>
            <div style={{ fontSize: 11, color: T.muted }}>u₁ = [{fmt(svd.u1[0])}, {fmt(svd.u1[1])}]</div>
            <div style={{ fontSize: 11, color: T.muted }}>v₁ = [{fmt(svd.v1[0])}, {fmt(svd.v1[1])}]</div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 12, background: `${T.green}0d`, border: `1px solid ${T.green}35` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 4 }}>Второй слой</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>σ₂ = {fmt(svd.sigma2)}</div>
            <div style={{ fontSize: 11, color: T.muted }}>u₂ = [{fmt(svd.u2[0])}, {fmt(svd.u2[1])}]</div>
            <div style={{ fontSize: 11, color: T.muted }}>v₂ = [{fmt(svd.v2[0])}, {fmt(svd.v2[1])}]</div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 12, background: `${T.amber}0d`, border: `1px solid ${T.amber}35` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 4 }}>Характеристики</div>
            <div style={{ fontSize: 13, color: T.text }}>κ = σ₁/σ₂ = <strong>{condNum}</strong></div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
              {isRank1 ? '⚠ Матрица ранга 1 — второй слой исчез' : dominanceRatio < 0.3 ? 'σ₁ ≫ σ₂ — первый слой доминирует' : dominanceRatio > 0.85 ? 'σ₁ ≈ σ₂ — слои равновесны' : 'Умеренный вклад второго слоя'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Layer controls ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 20 }}>
        <LayerPanel label="Слой 1 (доминантный): σ₁u₁v₁ᵀ" sigma={svd.sigma1} u={svd.u1} rank={1} color={T.primary}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={showL1} onChange={(e) => setShowL1(e.target.checked)} style={{ accentColor: T.primary, width: 16, height: 16 }} />
            <span style={{ color: T.text }}>Показывать в итоговой сумме</span>
          </label>
          <div style={{ marginTop: 8, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            Задаёт главное направление u₁ и «силу» преобразования. Применённый отдельно — схлопывает окружность в отрезок вдоль u₁ длиной σ₁.
          </div>
        </LayerPanel>

        <LayerPanel label="Слой 2 (второстепенный): σ₂u₂v₂ᵀ" sigma={svd.sigma2 * mix2} u={svd.u2} rank={1} color={T.green}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={showL2} onChange={(e) => setShowL2(e.target.checked)} style={{ accentColor: T.green, width: 16, height: 16 }} />
            <span style={{ color: T.text }}>Показывать в итоговой сумме</span>
          </label>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted, marginBottom: 3 }}>
              <span>Убираем слой 2 постепенно</span>
              <span style={{ fontWeight: 700, color: T.green }}>{Math.round(mix2 * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={mix2} onChange={(e) => setMix2(Number(e.target.value))} style={{ width: '100%', accentColor: T.green }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.mutedLight }}>
              <span>0% — ранг 1</span>
              <span>100% — полный ранг</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            Добавляет ортогональное измерение u₂ ⊥ u₁. «Раздувает» отрезок в эллипс. Если убрать — остаётся оптимальное приближение ранга 1.
          </div>
        </LayerPanel>
      </div>

      {/* ── Intermediate slider ── */}
      <div style={{ background: `${T.amber}0d`, border: `1px solid ${T.amber}40`, borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Info size={15} color={T.amber} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>Промежуточное состояние: от отрезка к эллипсу</span>
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 10, lineHeight: 1.6 }}>
          Ползунок показывает, как второй слой «раздувает» отрезок первого слоя в полноценный эллипс. При t=0 — только слой 1 (отрезок). При t=1 — полная сумма (эллипс).
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' as const }}>Отрезок (t=0)</span>
          <input type="range" min={0} max={1} step={0.01} value={intermediate} onChange={(e) => setIntermediate(Number(e.target.value))} style={{ flex: 1, accentColor: T.amber }} />
          <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' as const }}>Эллипс (t=1)</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: T.amber, minWidth: 40, textAlign: 'right' as const }}>t={intermediate.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Visualizations ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ZoomIn size={15} color={T.primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Визуализация: единичная окружность → преобразование</span>
          <span style={{ fontSize: 11, color: T.muted, marginLeft: 4 }}>— каждая фигура показывает образ окружности под действием матрицы</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Original */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 2 }}>Исходная окружность</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>До преобразования</div>
          <svg viewBox="0 0 240 220" style={{ width: '100%', height: 'auto' }}>
            <line x1={120} y1={20} x2={120} y2={200} stroke={T.border} />
            <line x1={20} y1={110} x2={220} y2={110} stroke={T.border} />
            <circle cx={120} cy={110} r={72} fill={`${T.mutedLight}20`} stroke={T.mutedLight} strokeWidth="2" strokeDasharray="5 4" />
            <circle cx={120} cy={110} r={3} fill={T.text} />
            <text x={120} y={198} textAnchor="middle" fontSize="11" fill={T.mutedLight}>||v|| = 1</text>
          </svg>
        </div>

        {/* Layer 1 only */}
        <EllipsePanel
          title="Только слой 1: σ₁u₁v₁ᵀ"
          subtitle="Отрезок вдоль u₁"
          M={L1}
          showOrigin
          color={T.primary}
          extra={
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
              Все точки окружности проецируются на прямую u₁ — результат всегда одномерный (отрезок).
            </div>
          }
        />

        {/* Layer 2 only */}
        <EllipsePanel
          title="Только слой 2: σ₂u₂v₂ᵀ"
          subtitle="Отрезок вдоль u₂"
          M={L2scaled}
          showOrigin
          color={T.green}
          extra={
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
              Отрезок вдоль u₂ — перпендикулярно первому (u₁ ⊥ u₂). Длина = σ₂ × {Math.round(mix2 * 100)}%.
            </div>
          }
        />

        {/* Sum */}
        <EllipsePanel
          title="Сумма: L₁ + L₂"
          subtitle="Эллипс с осями u₁, u₂"
          M={combined}
          showOrigin
          color={T.primaryDark}
          extra={
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
              Два ортогональных слоя складываются в эллипс. Большая ось = σ₁, малая = σ₂ × {Math.round(mix2 * 100)}%.
            </div>
          }
        />
      </div>

      {/* ── Staged transition ── */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Info size={15} color={T.amber} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
            Анимация добавления слоя 2: L₁ + t × L₂ (t = {intermediate.toFixed(2)})
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
          Двигай ползунок выше ← сначала видишь отрезок (только L₁), затем слой 2 постепенно «надувает» его в эллипс. Это и есть добавление ортогонального измерения.
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <svg viewBox="0 0 360 240" style={{ width: '100%', height: 'auto' }}>
              <line x1={180} y1={20} x2={180} y2={220} stroke={T.border} />
              <line x1={20} y1={120} x2={340} y2={120} stroke={T.border} />
              {/* reference unit circle */}
              <circle cx={180} cy={120} r={80} fill="none" stroke={T.border} strokeDasharray="4 4" />
              {/* layer 1 only */}
              <path d={ellipsePath(L1, 180, 120, 80)} fill="none" stroke={`${T.primary}40`} strokeWidth="1.5" strokeDasharray="5 4" />
              {/* staged */}
              <path d={ellipsePath(staged, 180, 120, 80)} fill={`${T.amber}14`} stroke={T.amber} strokeWidth="3" />
              {/* full */}
              <path d={ellipsePath(A, 180, 120, 80)} fill="none" stroke={`${T.primaryDark}50`} strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx={180} cy={120} r={4} fill={T.text} />
              <text x={180} y={234} textAnchor="middle" fontSize="11" fill={T.muted}>— — полная A</text>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {[
                { color: `${T.primary}70`, dash: true, label: 'Только слой 1 (отрезок)' },
                { color: T.amber, dash: false, label: `Текущее: L₁ + ${intermediate.toFixed(2)}×L₂` },
                { color: `${T.primaryDark}70`, dash: true, label: 'Полная матрица A' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="28" height="10">
                    <line x1="0" y1="5" x2="28" y2="5" stroke={item.color} strokeWidth={item.dash ? 1.5 : 2.5} strokeDasharray={item.dash ? '4 3' : undefined} />
                  </svg>
                  <span style={{ fontSize: 12, color: T.muted }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: `${T.amber}0d`, border: `1px solid ${T.amber}35`, fontSize: 12, color: T.text, lineHeight: 1.6 }}>
              При t=0 эллипс вырожден в отрезок → матрица ранга 1.<br />
              При t=1 получаем полную матрицу A → ранг 2.
            </div>
          </div>
        </div>
      </div>

      {/* ── Exploration questions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
        <HelpCircle size={16} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Исследовательские вопросы</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
        <Collapsible title="Включи только слой 1. На что похожа фигура и почему?" color={T.primary}>
          Окружность схлопывается в отрезок вдоль u₁. Это потому, что матрица ранга 1 «видит» только одно измерение: всё пространство проецируется на прямую u₁. Длина отрезка = 2σ₁ (в обе стороны от центра).
        </Collapsible>
        <Collapsible title="Включи только слой 2. Где его отрезок и как он соотносится с первым?" color={T.green}>
          Отрезок направлен вдоль u₂ — перпендикулярно первому! Это следствие того, что u₁ ⊥ u₂ в SVD. Два слоя действуют в ортогональных направлениях — именно поэтому их сумма даёт эллипс, а не «перекошенную» фигуру.
        </Collapsible>
        <Collapsible title="Включи оба слоя. Почему получился эллипс, а не параллелограмм?" color={T.violet}>
          Потому что оси эллипса совпадают с u₁ и u₂, которые ортогональны. Если бы векторы не были перпендикулярны — получился бы параллелограмм (сдвинутый прямоугольник). Ортогональность — ключевое свойство SVD, отличающее его от произвольной факторизации.
        </Collapsible>
        <Collapsible title="Что будет, если σ₂ → 0? Передвинь ползунок «убираем слой 2»." color={T.amber}>
          При σ₂ = 0 второй слой исчезает. Матрица A становится ранга 1: A ≈ σ₁u₁v₁ᵀ. Эллипс вырождается в отрезок. Это и есть аппроксимация ранга 1 — оптимальная по теореме Эккарта–Янга.
        </Collapsible>
        <Collapsible title="Сделай σ₁ ≫ σ₂ (например, a₁₁=3, a₁₂=0, a₂₁=0, a₂₂=0.2). Что изменится?" color={T.red}>
          Эллипс станет очень узким — почти отрезком. Первый слой подавляет второй. Именно в таких данных удаление второго слоя почти не меняет качество описания — отсюда идея сжатия с малой потерей точности.
        </Collapsible>
      </div>

      {/* ── Riddles ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
        <Wand2 size={16} color={T.violet} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
        <Collapsible title="Загадка 1: ранг матрицы σ₁u₁v₁ᵀ всегда равен 1. Почему?" color={T.violet}>
          Потому что все строки матрицы пропорциональны u₁, а все столбцы пропорциональны v₁. Значит, любые две строки линейно зависимы — ранг равен 1. Матрица ранга 1 — это «одномерное» линейное отображение: оно «видит» только одно направление.
        </Collapsible>
        <Collapsible title="Загадка 2: почему u₁ ⊥ u₂ гарантирует эллипс, а не другую фигуру?" color={T.green}>
          Два слоя вносят вклад в ортогональных направлениях — никакого «перекрытия». Образ окружности — линейная комбинация отрезков вдоль u₁ и u₂. Когда базисные направления перпендикулярны, область достижимых точек — ровно эллипс с осями вдоль u₁ и u₂. При непрямом угле — стало бы эллипсом, наклонённым под углом, что и есть знак неортогональной факторизации.
        </Collapsible>
      </div>

      {/* ── Key insight ── */}
      <div style={{ background: `linear-gradient(135deg, ${T.primaryLight}, #fdf4ff)`, border: `1px solid ${T.primaryBorder}`, borderRadius: 16, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Lightbulb size={18} color={T.primary} />
          <span style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Главный вывод</span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 14, color: T.text, lineHeight: 1.8 }}>
          <strong>Матрица — это сумма ортогональных слоёв ранга 1, упорядоченных по важности.</strong> Первый слой задаёт главное направление и «силу» преобразования. Второй добавляет ортогональное измерение. Вместе — эллипс.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.8 }}>
          Отбросив второй слой, мы получаем оптимальное приближение ранга 1 — по теореме Эккарта–Янга, это лучшая матрица ранга 1 по ошибке Фробениуса. Именно так работает сжатие: удаляем слои с малыми σᵢ.
        </p>
      </div>
    </div>
  );
}
