import { useMemo, useState } from 'react';

const T = {
  text: '#1e293b', muted: '#64748b', mutedLight: '#94a3b8',
  primary: '#6366f1', primaryLight: '#eef2ff', primaryBorder: '#c7d2fe', primaryDark: '#4f46e5',
  accent: '#7c3aed', green: '#10b981', greenLight: '#d1fae5',
  amber: '#f59e0b', amberLight: '#fef3c7', red: '#ef4444', redLight: '#fee2e2',
  white: '#ffffff', surface: '#f8fafc', border: '#e2e8f0',
  cyan: '#06b6d4', violet: '#8b5cf6', pink: '#ec4899',
};

type M = { a: number; b: number; c: number; d: number };
type V2 = [number, number];

const CX = 170, CY = 170, SC = 46;
const proj = ([x, y]: V2): V2 => [CX + x * SC, CY - y * SC];

function eig(m: M) {
  const tr = m.a + m.d, det = m.a * m.d - m.b * m.c;
  const disc = tr * tr - 4 * det;
  if (disc < 0) {
    // SVD-like: show semi-axes from singular values
    const svd1 = Math.sqrt(Math.max(0, (m.a * m.a + m.b * m.b + m.c * m.c + m.d * m.d
      + Math.sqrt(Math.pow(m.a * m.a + m.b * m.b - m.c * m.c - m.d * m.d, 2)
        + 4 * Math.pow(m.a * m.c + m.b * m.d, 2))) / 2));
    const svd2 = Math.sqrt(Math.max(0, (m.a * m.a + m.b * m.b + m.c * m.c + m.d * m.d
      - Math.sqrt(Math.pow(m.a * m.a + m.b * m.b - m.c * m.c - m.d * m.d, 2)
        + 4 * Math.pow(m.a * m.c + m.b * m.d, 2))) / 2));
    return { complex: true, vals: [svd1, svd2] as number[], vecs: [[1, 0], [0, 1]] as V2[], det };
  }
  const s = Math.sqrt(disc);
  const vals = [(tr + s) / 2, (tr - s) / 2];
  const vecs: V2[] = vals.map(l => {
    if (Math.abs(m.b) > 1e-9) return [m.b, l - m.a] as V2;
    if (Math.abs(m.c) > 1e-9) return [l - m.d, m.c] as V2;
    return l === m.a ? [1, 0] as V2 : [0, 1] as V2;
  });
  return { complex: false, vals, vecs, det };
}

const PRESETS = [
  { n: 'Растяжение', m: { a: 3, b: 0, c: 0, d: 1 }, hint: 'Диагональная матрица: собственные векторы — это оси координат. Каждое направление растягивается независимо.' },
  { n: 'Сдвиг', m: { a: 1, b: 1.4, c: 0, d: 1 }, hint: 'Сдвиг наклоняет эллипс. Один λ = 1 (не меняет масштаб), но направление поворачивается.' },
  { n: 'Поворот', m: { a: 0, b: -1, c: 1, d: 0 }, hint: 'Комплексные λ = ±i. Никакой вещественный вектор не сохраняет направление — поэтому нет выделенных осей.' },
  { n: 'Проекция', m: { a: 1, b: 0, c: 0, d: 0 }, hint: 'det = 0: матрица необратима. Весь эллипс схлопывается на ось X — одна полуось нулевая.' },
];

export default function EigenCircleEllipseLab() {
  const [m, setM] = useState<M>({ a: 2, b: 0, c: 0, d: 1 });
  const [activePreset, setActivePreset] = useState<string | null>('Растяжение');
  const [hintText, setHintText] = useState(PRESETS[0].hint);

  const e = useMemo(() => eig(m), [m]);

  const circlePts: V2[] = Array.from({ length: 120 }, (_, i) => {
    const t = (i / 120) * 2 * Math.PI;
    return [Math.cos(t), Math.sin(t)];
  });

  const ellipsePts: V2[] = circlePts.map(([x, y]) => [
    m.a * x + m.b * y,
    m.c * x + m.d * y,
  ]);

  const set = (k: keyof M, v: number) => {
    setM(x => ({ ...x, [k]: v }));
    setActivePreset(null);
    setHintText('Меняй матрицу — наблюдай, как деформируется эллипс и меняются его оси.');
  };

  const det = m.a * m.d - m.b * m.c;

  const tipText = () => {
    if (e.complex) return 'Собственные значения комплексные → вещественных осей нет. Показаны сингулярные значения.';
    if (Math.abs(det) < 0.05) return 'det ≈ 0: матрица вырожденная. Эллипс схлопывается в отрезок.';
    const sorted = [...e.vals].sort((a, b) => Math.abs(b) - Math.abs(a));
    if (sorted[1] < 0) return `λ₂ < 0: вектор вдоль синей оси отражается (переворачивается).`;
    return `Длинная ось: |λ₁| = ${Math.abs(e.vals[0]).toFixed(2)}. Короткая: |λ₂| = ${Math.abs(e.vals[1]).toFixed(2)}.`;
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: T.text }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>
          Лаборатория 3: Окружность → эллипс
        </h4>
        <p style={{ marginTop: 6, fontSize: 14, color: T.muted, lineHeight: 1.5 }}>
          Матрица 2×2 деформирует единичную окружность в эллипс. Оси эллипса — это собственные
          направления матрицы, а длины полуосей равны модулям собственных значений |λ|.
        </p>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {PRESETS.map(preset => (
          <button
            key={preset.n}
            onClick={() => {
              setM(preset.m);
              setActivePreset(preset.n);
              setHintText(preset.hint);
            }}
            style={{
              borderRadius: 12,
              border: `1.5px solid ${activePreset === preset.n ? T.primaryDark : T.primaryBorder}`,
              background: activePreset === preset.n ? T.primaryDark : T.primaryLight,
              color: activePreset === preset.n ? T.white : T.primaryDark,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {preset.n}
          </button>
        ))}
      </div>

      {/* Hint for preset */}
      {hintText && (
        <div style={{
          background: T.amberLight,
          border: `1px solid ${T.amber}`,
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 13,
          color: '#92400e',
          marginBottom: 20,
          lineHeight: 1.5,
        }}>
          💬 {hintText}
        </div>
      )}

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(280px,340px) 1fr' }}>
        {/* SVG Canvas */}
        <div>
          <svg
            viewBox="0 0 340 340"
            style={{
              width: '100%',
              borderRadius: 20,
              border: `1.5px solid ${T.border}`,
              background: T.white,
            }}
          >
            {/* Grid lines */}
            <line x1="0" x2="340" y1={CY} y2={CY} stroke={T.border} strokeWidth="1" />
            <line x1={CX} x2={CX} y1="0" y2="340" stroke={T.border} strokeWidth="1" />
            {/* Unit circle */}
            <polyline
              points={circlePts.map(v => proj(v).join(',')).join(' ')}
              fill="none"
              stroke={T.mutedLight}
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {/* Ellipse */}
            <polyline
              points={ellipsePts.map(v => proj(v).join(',')).join(' ')}
              fill={`${T.primary}18`}
              stroke={T.primary}
              strokeWidth="3"
            />

            {/* Eigenvector axes */}
            {!e.complex && e.vecs.map((v, i) => {
              const n = Math.hypot(...v) || 1;
              const len = Math.abs(e.vals[i]);
              const u: V2 = [v[0] / n * len, v[1] / n * len];
              const [x1, y1] = proj([-u[0], -u[1]]);
              const [x2, y2] = proj(u);
              const color = i === 0 ? T.red : T.cyan;
              const isNeg = e.vals[i] < 0;
              const label = isNeg
                ? `λ${i + 1}=${e.vals[i].toFixed(1)} (отр.)`
                : `λ${i + 1}=${e.vals[i].toFixed(1)}`;
              return (
                <g key={i}>
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray={isNeg ? '7 5' : undefined}
                    strokeLinecap="round"
                  />
                  <circle cx={x2} cy={y2} r="5" fill={color} />
                  <text x={x2 + 6} y={y2 - 6} fill={color} fontWeight="800" fontSize="12">{label}</text>
                </g>
              );
            })}

            {/* Legend */}
            <rect x="10" y="8" width="200" height="46" rx="8" fill="white" fillOpacity="0.92" />
            <line x1="18" y1="24" x2="38" y2="24" stroke={T.mutedLight} strokeDasharray="4 3" strokeWidth="1.5" />
            <text x="44" y="28" fill={T.muted} fontSize="11" fontWeight="600">единичная окружность</text>
            <line x1="18" y1="42" x2="38" y2="42" stroke={T.primary} strokeWidth="3" />
            <text x="44" y="46" fill={T.primary} fontSize="11" fontWeight="700">образ — эллипс</text>
          </svg>

          {/* Complex notice */}
          {e.complex && (
            <div style={{
              marginTop: 10,
              background: T.redLight,
              border: `1px solid ${T.red}`,
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 12,
              color: '#991b1b',
            }}>
               Комплексные λ — вещественных осей нет. Показаны сингулярные значения матрицы.
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Matrix sliders */}
          <div style={{
            background: T.white,
            border: `1.5px solid ${T.border}`,
            borderRadius: 16,
            padding: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Матрица A
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(Object.entries(m) as [keyof M, number][]).map(([k, val]) => (
                <label key={k} style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.text,
                  display: 'block',
                }}>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', color: T.primaryDark }}>{k}</span>
                    {' = '}
                    <span style={{ color: T.accent }}>{val.toFixed(1)}</span>
                  </div>
                  <input
                    type="range" min={-4} max={4} step={0.1} value={val}
                    onChange={ev => set(k, Number(ev.target.value))}
                    style={{ width: '100%', accentColor: T.primary }}
                  />
                </label>
              ))}
            </div>
            {/* Matrix display */}
            <div style={{
              marginTop: 12,
              background: T.primaryLight,
              border: `1px solid ${T.primaryBorder}`,
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 13,
              fontFamily: 'monospace',
              color: T.primaryDark,
              textAlign: 'center',
              fontWeight: 700,
            }}>
              A = [{m.a.toFixed(1)}, {m.b.toFixed(1)}; {m.c.toFixed(1)}, {m.d.toFixed(1)}]
              {'  '}det = <span style={{ color: Math.abs(det) < 0.05 ? T.red : T.accent }}>{det.toFixed(2)}</span>
            </div>
          </div>

          {/* Eigenvalues info */}
          <div style={{
            background: T.white,
            border: `1.5px solid ${T.border}`,
            borderRadius: 16,
            padding: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Собственные значения
            </div>
            {e.complex ? (
              <div style={{ fontSize: 14, color: T.muted }}>
                λ ∈ ℂ — комплексные. Поворот без фиксированных осей.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {e.vals.map((val, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: i === 0 ? T.redLight : `${T.cyan}18`,
                    border: `1px solid ${i === 0 ? T.red : T.cyan}`,
                    borderRadius: 10,
                    padding: '8px 12px',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: i === 0 ? T.red : T.cyan,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: T.white, fontSize: 12, fontWeight: 800,
                    }}>
                      λ{i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? T.red : T.cyan }}>
                        {val.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: T.muted }}>
                        |λ| = {Math.abs(val).toFixed(2)} · {val < 0 ? 'отражение + масштаб' : val > 1 ? 'растяжение' : val > 0 ? 'сжатие' : 'коллапс'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live tip */}
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 13,
            color: T.muted,
            lineHeight: 1.5,
          }}>
             {tipText()}
          </div>

          {/* Key insight */}
          <div style={{
            background: T.greenLight,
            border: `1px solid ${T.green}`,
            borderRadius: 14,
            padding: '12px 16px',
            fontSize: 13,
            color: '#065f46',
            lineHeight: 1.55,
          }}>
            <b> Главная идея:</b> Образ единичной окружности — это геометрический
            «портрет» матрицы. Оси эллипса показывают собственные направления,
            а длины полуосей = |λ|. При det = 0 эллипс вырождается в отрезок.
          </div>
        </div>
      </div>
    </div>
  );
}
