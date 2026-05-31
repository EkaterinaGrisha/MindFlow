// @ts-nocheck
import { useMemo, useState } from 'react';
 
// ─── Color tokens (mirrored from theory content) ─────────────────────────────
const T = {
  text:          '#1e293b',
  muted:         '#64748b',
  mutedLight:    '#94a3b8',
  primary:       '#6366f1',
  primaryLight:  '#eef2ff',
  primaryBorder: '#c7d2fe',
  primaryDark:   '#4f46e5',
  accent:        '#7c3aed',
  green:         '#10b981',
  greenLight:    '#d1fae5',
  amber:         '#f59e0b',
  amberLight:    '#fef3c7',
  red:           '#ef4444',
  redLight:      '#fee2e2',
  cyan:          '#06b6d4',
  violet:        '#8b5cf6',
  pink:          '#ec4899',
  white:         '#ffffff',
  surface:       '#f8fafc',
  border:        '#e2e8f0',
};
 
// ─── Layer theme ──────────────────────────────────────────────────────────────
const LAYERS = [
  {
    id: 'vt',
    symbol: 'Vᵀ',
    label: 'Слой 1 — Поворот входа',
    hint: 'Вращает базис так, чтобы ось растяжения совпала с координатными осями. Окружность остаётся окружностью.',
    color: T.primary,
    lightBg: T.primaryLight,
    border: T.primaryBorder,
    dot: '#4f46e5',
  },
  {
    id: 'sigma',
    symbol: 'Σ',
    label: 'Слой 2 — Растяжение',
    hint: 'Растягивает по осям X и Y на σ₁ и σ₂. Окружность превращается в эллипс с горизонтальными и вертикальными осями.',
    color: T.green,
    lightBg: T.greenLight,
    border: '#6ee7b7',
    dot: '#059669',
  },
  {
    id: 'u',
    symbol: 'U',
    label: 'Слой 3 — Поворот выхода',
    hint: 'Доворачивает эллипс в итоговое положение. Оси эллипса теперь смотрят вдоль левых сингулярных векторов.',
    color: T.amber,
    lightBg: T.amberLight,
    border: '#fcd34d',
    dot: '#d97706',
  },
];
 
// ─── Presets for guided exploration ─────────────────────────────────────────
const PRESETS = [
  { label: 'Общий случай',   A: [[2.1, 0.8], [0.3, 1.4]] },
  { label: 'Симметричная',   A: [[2,   1  ], [1,   0.5]] },
  { label: 'Диагональная',   A: [[2.5, 0  ], [0,   1  ]] },
  { label: 'Поворот 90°',    A: [[0,  -1  ], [1,   0  ]] },
  { label: 'Сдвиг',          A: [[1,   1.5], [0,   1  ]] },
];
 
// ─── Math helpers ─────────────────────────────────────────────────────────────
type Matrix2 = [[number, number], [number, number]];
type Vec2    = [number, number];
const EPS  = 1e-9;
const apply = (A: Matrix2, [x, y]: Vec2): Vec2 => [A[0][0]*x+A[0][1]*y, A[1][0]*x+A[1][1]*y];
const norm  = ([x, y]: Vec2) => Math.hypot(x, y);
const normalize = (v: Vec2): Vec2 => { const n = norm(v); return n < EPS ? [1, 0] : [v[0]/n, v[1]/n]; };
const perp  = ([x, y]: Vec2): Vec2 => [-y, x];
const mul   = (A: Matrix2, B: Matrix2): Matrix2 => [
  [A[0][0]*B[0][0]+A[0][1]*B[1][0], A[0][0]*B[0][1]+A[0][1]*B[1][1]],
  [A[1][0]*B[0][0]+A[1][1]*B[1][0], A[1][0]*B[0][1]+A[1][1]*B[1][1]],
];
const fmt = (x: number) => Math.abs(x) < 1e-10 ? '0' : x.toFixed(2).replace(/\.?0+$/, '');
 
function svd2x2(A: Matrix2) {
  const [[a, b], [c, d]] = A;
  const s11 = a*a+c*c, s12 = a*b+c*d, s22 = b*b+d*d;
  const tr = s11+s22, delta = Math.hypot(s11-s22, 2*s12);
  const l1 = Math.max(0, (tr+delta)/2), l2 = Math.max(0, (tr-delta)/2);
  const sigma1 = Math.sqrt(l1), sigma2 = Math.sqrt(l2);
  const v1 = delta < 1e-10 ? ([1, 0] as Vec2) : normalize(Math.abs(s12) > 1e-10 ? [l1-s22, s12] : (s11 >= s22 ? [1, 0] : [0, 1]));
  const v2 = perp(v1);
  const u1: Vec2 = sigma1 > EPS ? normalize(apply(A, v1)) : [1, 0];
  const u2: Vec2 = sigma2 > EPS ? normalize(apply(A, v2)) : perp(u1);
  return {
    U:  [[u1[0], u2[0]], [u1[1], u2[1]]] as Matrix2,
    S:  [[sigma1, 0], [0, sigma2]]        as Matrix2,
    VT: [[v1[0], v1[1]], [v2[0], v2[1]]] as Matrix2,
    sigma1, sigma2,
  };
}
 
function ellipsePath(A: Matrix2, cx: number, cy: number, sc: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * Math.PI * 2;
    const [x, y] = apply(A, [Math.cos(t), Math.sin(t)]);
    pts.push(`${i === 0 ? 'M' : 'L'} ${(cx + x*sc).toFixed(2)} ${(cy - y*sc).toFixed(2)}`);
  }
  return pts.join(' ') + ' Z';
}
 
// ─── Subcomponents ────────────────────────────────────────────────────────────
function LayerToggle({ layer, active, onToggle }: { layer: typeof LAYERS[0]; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: active ? layer.lightBg : T.white,
        border: `1.5px solid ${active ? layer.border : T.border}`,
        borderRadius: 12, padding: '11px 14px',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s ease',
        boxShadow: active ? `0 0 0 3px ${layer.color}18` : 'none',
      }}
    >
      {/* Toggle pill */}
      <div style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: active ? layer.color : T.border,
        position: 'relative', transition: 'background 0.18s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: active ? 19 : 3,
          width: 14, height: 14, borderRadius: '50%', background: T.white,
          transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'Georgia', serif", fontSize: 16, fontWeight: 700,
            color: active ? layer.color : T.muted,
          }}>{layer.symbol}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: active ? layer.color : T.muted }}>{layer.label}</span>
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginTop: 2 }}>{layer.hint}</div>
      </div>
    </button>
  );
}
 
function MatrixDisplay({ label, data, color }: { label: string; data: Matrix2; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 0,
        background: `${color}0d`, border: `1px solid ${color}30`,
        borderRadius: 10, padding: '6px 10px', fontFamily: "'Georgia', serif", fontSize: 13,
      }}>
        <div style={{ borderLeft: `2px solid ${color}`, borderTop: `2px solid ${color}`, borderBottom: `2px solid ${color}`, height: 44, width: 6, borderRadius: '3px 0 0 3px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px', padding: '0 8px', color: T.text }}>
          {data.flat().map((v, i) => <span key={i} style={{ color: Math.abs(v) < 1e-10 ? T.mutedLight : color === T.muted ? T.text : color }}>{fmt(v)}</span>)}
        </div>
        <div style={{ borderRight: `2px solid ${color}`, borderTop: `2px solid ${color}`, borderBottom: `2px solid ${color}`, height: 44, width: 6, borderRadius: '0 3px 3px 0' }} />
      </div>
    </div>
  );
}
 
// ─── Discovery hints ──────────────────────────────────────────────────────────
const DISCOVERIES = [
  {
    title: 'Только Vᵀ + Σ',
    hint: 'Оси эллипса смотрят строго по координатным осям — Σ всегда растягивает горизонтально и вертикально.',
    check: (s: boolean[]) => s[0] && s[1] && !s[2],
  },
  {
    title: 'Все три слоя',
    hint: 'Теперь U довернул эллипс в итоговое положение. Три шага в сумме дают полное преобразование A.',
    check: (s: boolean[]) => s[0] && s[1] && s[2],
  },
  {
    title: 'Только растяжение',
    hint: 'Без поворотов виден «чистый» вклад Σ: эллипс выровнен по осям. Это и есть «скелет» преобразования.',
    check: (s: boolean[]) => !s[0] && s[1] && !s[2],
  },
];
 
// ─── Main component ───────────────────────────────────────────────────────────
export default function SVDDecomposeThreeStepsLab() {
  const [A, setA] = useState<Matrix2>([[2.1, 0.8], [0.3, 1.4]]);
  const [active, setActive] = useState([true, true, true]);
  const [activePreset, setActivePreset] = useState(0);
 
  const { U, S, VT, sigma1, sigma2 } = useMemo(() => svd2x2(A), [A]);
 
  // Build composed transform from active layers
  const composed = useMemo(() => {
    let M: Matrix2 = [[1, 0], [0, 1]];
    if (active[0]) M = mul(VT, M);
    if (active[1]) M = mul(S,  M);
    if (active[2]) M = mul(U,  M);
    return M;
  }, [U, S, VT, active]);
 
  const setCell = (r: 0|1, c: 0|1, v: number) =>
    setA(p => { const n: Matrix2 = [[p[0][0],p[0][1]],[p[1][0],p[1][1]]]; n[r][c]=v; return n; });
 
  const applyPreset = (i: number) => {
    setActivePreset(i);
    setA(PRESETS[i].A as Matrix2);
  };
 
  // Dot colors: N, E, S, W
  const dotColors = [T.red, T.primary, T.green, T.amber];
  const cardinalPts: Vec2[] = [[1,0],[0,1],[-1,0],[0,-1]];
 
  const discovery = DISCOVERIES.find(d => d.check(active));
 
  const sc = 82; // scale factor
  const cx = 260, cy = 190; // canvas centre
 
  return (
    <div style={{ padding: '0 0 48px', fontFamily: "'Inter', sans-serif" }}>
 
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke={T.primary} strokeWidth="1.8"/>
              <ellipse cx="8" cy="8" rx="6" ry="3" stroke={T.green} strokeWidth="1.4" transform="rotate(-30 8 8)"/>
            </svg>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: T.primary, textTransform: 'uppercase' }}>Лаборатория</span>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>
          Разложи преобразование на три шага
        </h2>
        <p style={{ margin: 0, color: T.muted, fontSize: 15, lineHeight: 1.65 }}>
          <strong style={{ color: T.text }}>Исследовательский вопрос:</strong> Любое линейное преобразование можно разбить на поворот, растяжение и ещё один поворот. Как найти эти три шага для конкретной матрицы?
        </p>
      </div>
 
      {/* ── What student sees ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 18px', marginBottom: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Что ты видишь</div>
        <p style={{ margin: 0, color: T.text, fontSize: 13, lineHeight: 1.75 }}>
          На холсте — единичная окружность с четырьмя точками-маркерами (<span style={{ color: T.red }}>●</span> Восток, <span style={{ color: T.primary }}>●</span> Север, <span style={{ color: T.green }}>●</span> Запад, <span style={{ color: T.amber }}>●</span> Юг). Включай и выключай слои ниже — и наблюдай, как окружность последовательно превращается в образ преобразования A.
        </p>
      </div>
 
      {/* ── Preset buttons ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => applyPreset(i)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: activePreset === i ? T.primary : T.white,
              color: activePreset === i ? T.white : T.muted,
              border: `1.5px solid ${activePreset === i ? T.primary : T.border}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
 
      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 16, alignItems: 'start' }}>
 
        {/* LEFT: Canvas */}
        <div>
          <svg
            viewBox="0 0 520 380"
            width="100%"
            style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: T.white, display: 'block' }}
            role="img"
            aria-label="Визуализация SVD-разложения"
          >
            {/* Grid */}
            {[-3,-2,-1,1,2,3].map(v => (
              <g key={v}>
                <line x1={cx+v*sc} y1={30} x2={cx+v*sc} y2={350} stroke={T.border} strokeWidth={v===0?1.5:0.8} />
                <line x1={20} y1={cy-v*sc} x2={500} y2={cy-v*sc} stroke={T.border} strokeWidth={v===0?1.5:0.8} />
              </g>
            ))}
            {/* Axis labels */}
            {[-2,-1,1,2].map(v => (
              <g key={v}>
                <text x={cx+v*sc} y={cy+16} textAnchor="middle" fontSize="10" fill={T.mutedLight}>{v}</text>
                <text x={cx-14} y={cy-v*sc+4} textAnchor="middle" fontSize="10" fill={T.mutedLight}>{v}</text>
              </g>
            ))}
 
            {/* Unit circle ghost */}
            <circle cx={cx} cy={cy} r={sc} fill="none" stroke={T.border} strokeWidth="1.2" strokeDasharray="5 4" />
            <text x={cx+sc+6} y={cy-6} fontSize="11" fill={T.mutedLight}>единичная</text>
 
            {/* Singular vector axes (if all active) */}
            {active[0] && active[1] && active[2] && (
              <>
                {/* u1 direction */}
                <line
                  x1={cx} y1={cy}
                  x2={cx + U[0][0]*sigma1*sc} y2={cy - U[1][0]*sigma1*sc}
                  stroke={T.amber} strokeWidth="1.5" strokeDasharray="6 4" opacity={0.5}
                />
                <text x={cx + U[0][0]*sigma1*sc + 6} y={cy - U[1][0]*sigma1*sc - 4}
                  fontSize="11" fill={T.amber} fontWeight="700">σ₁u₁</text>
                {/* u2 direction */}
                <line
                  x1={cx} y1={cy}
                  x2={cx + U[0][1]*sigma2*sc} y2={cy - U[1][1]*sigma2*sc}
                  stroke={T.green} strokeWidth="1.5" strokeDasharray="6 4" opacity={0.5}
                />
                <text x={cx + U[0][1]*sigma2*sc + 6} y={cy - U[1][1]*sigma2*sc - 4}
                  fontSize="11" fill={T.green} fontWeight="700">σ₂u₂</text>
              </>
            )}
 
            {/* Transformed ellipse */}
            <path
              d={ellipsePath(composed, cx, cy, sc)}
              fill={`${T.primary}14`}
              stroke={T.primary}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
 
            {/* Cardinal dots transformed */}
            {cardinalPts.map((p, i) => {
              const [tx, ty] = apply(composed, p);
              const [ox, oy] = p;
              return (
                <g key={i}>
                  {/* faint ghost on unit circle */}
                  <circle cx={cx+ox*sc} cy={cy-oy*sc} r={4} fill={dotColors[i]} opacity={0.18} />
                  {/* transformed dot */}
                  <circle cx={cx+tx*sc} cy={cy-ty*sc} r={7} fill={dotColors[i]} opacity={0.9} />
                  <circle cx={cx+tx*sc} cy={cy-ty*sc} r={7} fill="none" stroke={T.white} strokeWidth={1.5} />
                </g>
              );
            })}
 
            {/* Centre dot */}
            <circle cx={cx} cy={cy} r={4} fill={T.text} />
          </svg>
 
          {/* Discovery callout */}
          {discovery && (
            <div style={{
              background: `${T.primary}0c`, border: `1px solid ${T.primaryBorder}`,
              borderRadius: 12, padding: '11px 15px', marginTop: 12,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, marginBottom: 3 }}>{discovery.title}</div>
                <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.6 }}>{discovery.hint}</div>
              </div>
            </div>
          )}
        </div>
 
        {/* RIGHT: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
 
          {/* Matrix A sliders */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Матрица A</div>
            {([['a₁₁',0,0],['a₁₂',0,1],['a₂₁',1,0],['a₂₂',1,1]] as [string,0|1,0|1][]).map(([label, r, c]) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '34px 1fr 38px', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontFamily: "'Georgia', serif", color: T.text, textAlign: 'right' }}>{label}</span>
                <input
                  type="range" min={-3} max={3} step={0.05} value={A[r][c]}
                  onChange={e => { setActivePreset(-1); setCell(r, c, Number(e.target.value)); }}
                  style={{ accentColor: T.primary, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.primary, textAlign: 'right' }}>{fmt(A[r][c])}</span>
              </div>
            ))}
          </div>
 
          {/* Layer toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LAYERS.map((layer, i) => (
              <LayerToggle
                key={layer.id}
                layer={layer}
                active={active[i]}
                onToggle={() => setActive(prev => prev.map((v, j) => j === i ? !v : v))}
              />
            ))}
          </div>
 
          {/* SVD result */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '13px 15px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>SVD-разложение</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <MatrixDisplay label="U" data={U}  color={T.amber}   />
              <MatrixDisplay label="Σ" data={S}  color={T.green}   />
              <MatrixDisplay label="Vᵀ" data={VT} color={T.primary} />
            </div>
            <div style={{ marginTop: 10, padding: '8px 12px', background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, color: T.text, display: 'flex', justifyContent: 'space-between' }}>
              <span>σ₁ = <strong style={{ color: T.green }}>{fmt(sigma1)}</strong></span>
              <span>σ₂ = <strong style={{ color: T.green }}>{fmt(sigma2)}</strong></span>
              <span>ранг = <strong style={{ color: T.primary }}>{(sigma1 > 1e-8 ? 1 : 0) + (sigma2 > 1e-8 ? 1 : 0)}</strong></span>
            </div>
          </div>
 
        </div>
      </div>
 
      {/* ── Guided exploration ── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.amberLight, color: T.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🔬</div>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Что исследовать</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 12 }}>
          {[
            {
              n: '1', color: T.primary,
              q: 'Включи только Vᵀ и Σ. Что напоминает результат?',
              a: 'Эллипс, оси которого смотрят строго по координатным осям — Σ всегда растягивает вдоль X и Y.',
            },
            {
              n: '2', color: T.green,
              q: 'Добавь слой U. Как изменился эллипс?',
              a: 'Повернулся — теперь оси смотрят вдоль левых сингулярных векторов u₁ и u₂.',
            },
            {
              n: '3', color: T.amber,
              q: 'Выбери «Симметричная» (a₁₂=a₂₁). Что особенного в U и Vᵀ?',
              a: 'Они становятся обратными друг другу — для симметричной матрицы U = V.',
            },
            {
              n: '4', color: T.violet,
              q: 'Выбери «Диагональная». Что происходит со слоями 1 и 3?',
              a: 'Повороты исчезают (U = V = I), остаётся только растяжение Σ.',
            },
            {
              n: '5', color: T.cyan,
              q: 'Выбери «Поворот 90°». Где растяжение?',
              a: 'Его нет — σ₁ = σ₂ = 1, средний слой не меняет форму: это чистый поворот.',
            },
          ].map(step => (
            <div
              key={step.n}
              style={{
                background: T.white, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, background: `${step.color}18`,
                  color: step.color, fontWeight: 900, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{step.n}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.5 }}>{step.q}</div>
              </div>
              <div style={{
                background: `${step.color}0b`, borderRadius: 9, padding: '8px 11px',
                fontSize: 12.5, color: T.text, lineHeight: 1.6,
                borderLeft: `3px solid ${step.color}`,
              }}>{step.a}</div>
            </div>
          ))}
        </div>
      </div>
 
      {/* ── Discovery ── */}
      <div style={{
        marginTop: 22, background: T.primaryLight,
        border: `1px solid ${T.primaryBorder}`, borderRadius: 14, padding: '14px 18px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Открытие</div>
        <p style={{ margin: 0, color: T.text, fontSize: 13, lineHeight: 1.75 }}>
          SVD «разделяет» матрицу на независимые части. Меняя элементы A, ты видишь, как перераспределяется «ответственность» между поворотами и растяжением. Для симметричной матрицы входной и выходной повороты одинаковы. Для диагональной — повороты исчезают вовсе.
        </p>
      </div>
 
    </div>
  );
}
 
