import { useMemo, useState } from 'react';

type Params = { theta: number; phi: number; len: number };
type V3 = [number, number, number];

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
  white: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  pink: '#ec4899',
};

const VEC_COLORS: [string, string, string] = [T.red, T.primary, T.cyan];
const VEC_LABELS = ['v₁', 'v₂', 'v₃'];

function toV3({ theta, phi, len }: Params): V3 {
  const t = (theta * Math.PI) / 180;
  const p = (phi * Math.PI) / 180;
  return [len * Math.cos(t) * Math.cos(p), len * Math.sin(t) * Math.cos(p), len * Math.sin(p)];
}

function det3(a: V3, b: V3, c: V3) {
  return (
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    b[0] * (a[1] * c[2] - a[2] * c[1]) +
    c[0] * (a[1] * b[2] - a[2] * b[1])
  );
}

function norm(v: V3) { return Math.hypot(...v); }
function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function fmt(v: V3) { return `(${v.map((x) => x.toFixed(1)).join(', ')})`; }

function project([x, y, z]: V3): [number, number] {
  return [230 + 58 * (x - 0.55 * y), 210 + 30 * y - 58 * z];
}

type Verdict = { isBasis: boolean; reason: string; detail: string; color: string; bg: string; border: string };

function diagnose(vs: V3[], d: number): Verdict {
  const EPS = 0.08;
  if (vs.some((v) => norm(v) < EPS))
    return { isBasis: false, reason: 'Нулевой вектор', detail: 'Один из векторов — нулевой (длина ≈ 0). Нулевой вектор линейно зависим с любым набором.', color: T.red, bg: T.redLight, border: '#fca5a5' };
  for (let i = 0; i < 3; i++)
    for (let j = i + 1; j < 3; j++)
      if (norm(cross(vs[i], vs[j])) < EPS)
        return { isBasis: false, reason: 'Два вектора коллинеарны', detail: `Векторы ${VEC_LABELS[i]} и ${VEC_LABELS[j]} параллельны (коллинеарны) — один кратен другому. Смешанное произведение равно нулю.`, color: T.amber, bg: T.amberLight, border: '#fcd34d' };
  if (Math.abs(d) < EPS)
    return { isBasis: false, reason: 'Все три компланарны', detail: 'Все три вектора лежат в одной плоскости. Определитель = 0: линейная зависимость. Оболочка — двумерная, не всё ℝ³.', color: T.amber, bg: T.amberLight, border: '#fcd34d' };
  return { isBasis: true, reason: 'Базис ℝ³', detail: 'Три вектора не компланарны, определитель ≠ 0 — они линейно независимы и порождают всё пространство ℝ³.', color: T.green, bg: T.greenLight, border: '#6ee7b7' };
}

const PRESETS: { label: string; hint: string; items: Params[] }[] = [
  { label: 'Стандартный базис', hint: 'Ортогональные оси e₁, e₂, e₃', items: [{ theta: 0, phi: 0, len: 2 }, { theta: 90, phi: 0, len: 2 }, { theta: 0, phi: 90, len: 2 }] },
  { label: 'Произвольный базис', hint: 'Три независимых вектора', items: [{ theta: -20, phi: 20, len: 1.9 }, { theta: 110, phi: -10, len: 2.1 }, { theta: 35, phi: 62, len: 1.7 }] },
  { label: 'Компланарные', hint: 'Все три вектора в плоскости xy', items: [{ theta: 0, phi: 0, len: 2 }, { theta: 90, phi: 0, len: 2 }, { theta: 45, phi: 0, len: 2 }] },
  { label: 'Коллинеарные v₁,v₂', hint: 'v₁ и v₂ направлены одинаково', items: [{ theta: 0, phi: 0, len: 2 }, { theta: 0, phi: 0, len: 1.5 }, { theta: 90, phi: 45, len: 2 }] },
];

export default function BasisCheckerLab() {
  const [items, setItems] = useState<Params[]>(PRESETS[1].items);
  const [showAxes, setShowAxes] = useState(true);
  const [showShell, setShowShell] = useState(true);

  const vectors = useMemo(() => items.map(toV3), [items]);
  const d = det3(vectors[0], vectors[1], vectors[2]);
  const verdict = diagnose(vectors, d);

  const update = (i: number, key: keyof Params, value: number) =>
    setItems((old) => old.map((item, idx) => (idx === i ? { ...item, [key]: value } : item)));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.primaryLight, border: `1.5px solid ${T.primaryBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🧭</div>
          <h4 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>
            Лаборатория: Базис или не базис?
          </h4>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
          Три вектора образуют базис ℝ³ тогда и только тогда, когда они не лежат в одной плоскости
          — то есть их смешанное произведение (определитель) не равно нулю.
        </p>
      </div>

      {/* What the student does */}
      <div style={{
        background: T.primaryLight, border: `1px solid ${T.primaryBorder}`,
        borderRadius: 14, padding: '12px 16px', marginBottom: 20,
        fontSize: 13, color: T.primaryDark, lineHeight: 1.7,
      }}>
        <b>Что делает студент:</b> вращает и растягивает три вектора с помощью слайдеров
        (θ — поворот в плоскости, φ — наклон вверх/вниз, len — длина) → наблюдает, как
        изменяется определитель и меняется вердикт «Базис / Не базис» → понимает, при каких
        условиях набор перестаёт быть базисом.
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setItems(p.items)}
            title={p.hint}
            style={{
              padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: `1.5px solid ${T.primaryBorder}`, background: T.primaryLight,
              color: T.primaryDark, cursor: 'pointer', transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = T.primaryBorder)}
            onMouseLeave={e => (e.currentTarget.style.background = T.primaryLight)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Verdict banner */}
      <div style={{
        background: verdict.bg, border: `1.5px solid ${verdict.border}`,
        borderRadius: 16, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <div style={{
          fontSize: 28, width: 44, height: 44, borderRadius: 12,
          background: verdict.color, color: T.white, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {verdict.isBasis ? '✓' : '✗'}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: verdict.color }}>{verdict.reason}</div>
          <div style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: 1.5 }}>{verdict.detail}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: T.muted }}>
            Определитель: <b style={{ color: verdict.isBasis ? T.green : T.red, fontFamily: 'monospace' }}>
              {d.toFixed(3)}
            </b>
            {verdict.isBasis ? ' ≠ 0 → линейно независимы' : ' ≈ 0 → линейно зависимы'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>

        {/* SVG scene */}
        <div style={{ background: '#0f172a', borderRadius: 20, overflow: 'hidden', border: `1px solid #1e293b` }}>
          {/* Controls over canvas */}
          <div style={{ padding: '10px 14px', display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
            <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showAxes} onChange={e => setShowAxes(e.target.checked)} style={{ accentColor: T.primary }} />
              Оси координат
            </label>
            <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showShell} onChange={e => setShowShell(e.target.checked)} style={{ accentColor: T.primary }} />
              Оболочка (span)
            </label>
          </div>
          <svg viewBox="0 0 480 340" style={{ display: 'block', width: '100%' }}>
            {/* Axes */}
            {showAxes && (['#334155', '#334155', '#334155'] as const).map((col, ai) => {
              const ends: V3[] = [[3, 0, 0], [0, 3, 0], [0, 0, 3]];
              const labels = ['x', 'y', 'z'];
              const [x1, y1] = project([0, 0, 0]);
              const [x2, y2] = project(ends[ai]);
              return (
                <g key={ai}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth="1" />
                  <text x={x2 + 6} y={y2 + 4} fill="#475569" fontSize="11" fontWeight="600">{labels[ai]}</text>
                </g>
              );
            })}

            {/* Shell polygon */}
            {showShell && (
              <polygon
                points={vectors.map((v) => project(v).join(',')).join(' ')}
                fill={verdict.isBasis ? '#6366f1' : '#f59e0b'}
                opacity={0.18}
                stroke={verdict.isBasis ? '#818cf8' : '#fbbf24'}
                strokeWidth="1"
              />
            )}

            {/* Vectors */}
            {vectors.map((v, i) => {
              const [ox, oy] = project([0, 0, 0]);
              const [ex, ey] = project(v);
              const color = VEC_COLORS[i];
              return (
                <g key={i}>
                  <line x1={ox} y1={oy} x2={ex} y2={ey} stroke={color} strokeWidth="4.5" strokeLinecap="round" />
                  {/* arrowhead */}
                  <circle cx={ex} cy={ey} r="7" fill={color} />
                  <text x={ex + 10} y={ey - 8} fill={color} fontSize="14" fontWeight="900">{VEC_LABELS[i]}</text>
                </g>
              );
            })}

            {/* Origin */}
            <circle cx={project([0, 0, 0])[0]} cy={project([0, 0, 0])[1]} r="4" fill="#475569" />
          </svg>
          <div style={{ padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {vectors.map((v, i) => (
              <div key={i} style={{ fontSize: 12, fontFamily: 'monospace', color: VEC_COLORS[i], fontWeight: 700 }}>
                {VEC_LABELS[i]} = {fmt(v)}
              </div>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, i) => (
            <div key={i} style={{
              background: T.white, border: `1.5px solid ${T.border}`,
              borderRadius: 16, padding: '14px 16px',
              borderLeft: `4px solid ${VEC_COLORS[i]}`,
            }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: VEC_COLORS[i], marginBottom: 10 }}>
                Вектор {VEC_LABELS[i]}
                <span style={{ fontWeight: 400, fontSize: 12, color: T.mutedLight, marginLeft: 8 }}>
                  {fmt(toV3(item))}
                </span>
              </div>
              {([ 
                { key: 'theta' as const, label: 'θ — угол в плоскости xy', min: -180, max: 180 },
                { key: 'phi' as const, label: 'φ — наклон (вверх/вниз)', min: -80, max: 80 },
                { key: 'len' as const, label: 'len — длина', min: 0, max: 3, step: 0.1 },
              ]).map(({ key, label, min, max, step = 1 }) => (
                <label key={key} style={{ display: 'block', marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 3 }}>
                    {label}: <b style={{ color: T.text }}>{item[key].toFixed(key === 'len' ? 1 : 0)}</b>
                  </div>
                  <input
                    type="range" min={min} max={max} step={step} value={item[key]}
                    onChange={(e) => update(i, key, Number(e.target.value))}
                    style={{ width: '100%', accentColor: VEC_COLORS[i] }}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Key observation */}
      <div style={{
        marginTop: 16, background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: '14px 16px', fontSize: 13, color: T.muted, lineHeight: 1.7,
      }}>
        <b style={{ color: T.text }}>📌 Что наблюдать:</b>
        {' '}Переключи на пресет «Компланарные» — оболочка сожмётся в плоскость, определитель = 0.
        Затем «Стандартный базис» — три вектора по осям, определитель = 8.
        Попробуй «Коллинеарные v₁,v₂» — два вектора совпадают по направлению, и снова не базис.
        Базис — это ровно три вектора, которые «смотрят» в разные плоскости и могут «описать» всё пространство ℝ³.
      </div>
    </div>
  );
}
