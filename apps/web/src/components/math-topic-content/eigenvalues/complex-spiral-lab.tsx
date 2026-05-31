import { useEffect, useMemo, useState } from 'react';

const T = {
  text: '#1e293b', muted: '#64748b', mutedLight: '#94a3b8',
  primary: '#6366f1', primaryLight: '#eef2ff', primaryBorder: '#c7d2fe', primaryDark: '#4f46e5',
  accent: '#7c3aed', green: '#10b981', greenLight: '#d1fae5',
  amber: '#f59e0b', amberLight: '#fef3c7', red: '#ef4444', redLight: '#fee2e2',
  white: '#ffffff', surface: '#f8fafc', border: '#e2e8f0',
  cyan: '#06b6d4', violet: '#8b5cf6', pink: '#ec4899',
};

type V2 = [number, number];

const CX = 180, CY = 180, SC = 52;
const proj = ([x, y]: V2): V2 => [CX + x * SC, CY - y * SC];

function applyMatrix(r: number, deg: number, [x, y]: V2): V2 {
  const t = deg * Math.PI / 180;
  const c = Math.cos(t), s = Math.sin(t);
  return [r * (c * x - s * y), r * (s * x + c * y)];
}

const EXAMPLES = [
  { label: 'r=1, θ=90° — чистое вращение', r: 1, theta: 90, hint: 'λ = ±i. Вектор ходит по окружности и никогда не выходит из неё. Вещественной части нет — масштаб не меняется.' },
  { label: 'r=1.2, θ=30° — спираль наружу', r: 1.2, theta: 30, hint: 'r > 1: каждый шаг вектор становится длиннее. Добавляется поворот — траектория закручивается наружу.' },
  { label: 'r=0.8, θ=60° — спираль внутрь', r: 0.8, theta: 60, hint: 'r < 1: каждый шаг вектор сжимается. Спираль закручивается к нулю — система затухает.' },
];

export default function EigenComplexSpiralLab() {
  const [r, setR] = useState(1.1);
  const [theta, setTheta] = useState(35);
  const [auto, setAuto] = useState(false);
  const [trail, setTrail] = useState<V2[]>([[2.4, 0]]);
  const [showReal, setShowReal] = useState(true);
  const [activeExample, setActiveExample] = useState<string | null>(null);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setTrail(t => [...t, applyMatrix(r, theta, t[t.length - 1])].slice(-60));
    }, 400);
    return () => clearInterval(id);
  }, [auto, r, theta]);

  const step = () => setTrail(t => [...t, applyMatrix(r, theta, t[t.length - 1])].slice(-60));
  const reset = () => { setTrail([[2.4, 0]]); setAuto(false); };

  // Real-only trail (b=0, just scaling)
  const realTrail: V2[] = useMemo(() => {
    let v: V2 = [2.4, 0];
    return Array.from({ length: Math.min(trail.length, 20) }, () => {
      v = [r * v[0], r * v[1]];
      return v;
    });
  }, [trail.length, r]);

  const a = r * Math.cos(theta * Math.PI / 180);
  const b = r * Math.sin(theta * Math.PI / 180);

  const spiralKind = r === 1 ? 'чистое вращение' : r > 1 ? 'спираль наружу' : 'спираль внутрь';
  const spiralColor = r === 1 ? T.cyan : r > 1 ? T.red : T.green;

  const liveHint = () => {
    if (r === 1) return 'r = 1: масштаб не меняется → вектор движется по окружности. Это чистое вращение.';
    if (r > 1) return `r = ${r.toFixed(1)} > 1: каждый шаг вектор растёт в ${r.toFixed(1)}× → спираль уходит наружу.`;
    return `r = ${r.toFixed(1)} < 1: каждый шаг вектор сжимается → спираль закручивается к нулю.`;
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: T.text }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>
          Лаборатория 6: Комплексные λ — спираль
        </h4>
        <p style={{ marginTop: 6, fontSize: 14, color: T.muted, lineHeight: 1.55 }}>
          Матрица A = r·R(θ) одновременно масштабирует и поворачивает вектор.
          Ни одна вещественная прямая не сохраняет направление — траектория вектора
          закручивается в спираль.
        </p>
      </div>

      {/* Example presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {EXAMPLES.map(ex => (
          <button
            key={ex.label}
            onClick={() => {
              setR(ex.r); setTheta(ex.theta);
              setActiveExample(ex.label);
              reset();
            }}
            style={{
              borderRadius: 12,
              border: `1.5px solid ${activeExample === ex.label ? T.primaryDark : T.primaryBorder}`,
              background: activeExample === ex.label ? T.primaryDark : T.primaryLight,
              color: activeExample === ex.label ? T.white : T.primaryDark,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Example hint */}
      {activeExample && (
        <div style={{
          background: T.amberLight,
          border: `1px solid ${T.amber}`,
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 13,
          color: '#92400e',
          marginBottom: 16,
          lineHeight: 1.5,
        }}>
           {EXAMPLES.find(e => e.label === activeExample)?.hint}
        </div>
      )}

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(280px,360px) 1fr' }}>
        {/* SVG Canvas */}
        <div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={step} style={{
              background: T.primaryDark, color: T.white,
              border: 'none', borderRadius: 10, padding: '8px 16px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              ▶ Шаг
            </button>
            <button onClick={() => setAuto(x => !x)} style={{
              background: auto ? T.accent : T.primaryLight,
              color: auto ? T.white : T.primaryDark,
              border: `1.5px solid ${T.primaryBorder}`, borderRadius: 10,
              padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              {auto ? '⏸ Стоп' : '⏯ Авто'}
            </button>
            <button onClick={reset} style={{
              background: T.white, color: T.muted,
              border: `1.5px solid ${T.border}`, borderRadius: 10,
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              ↺ Сброс
            </button>
          </div>

          <svg
            viewBox="0 0 360 360"
            style={{
              width: '100%',
              borderRadius: 20,
              border: `1.5px solid ${T.border}`,
              background: T.white,
            }}
          >
            {/* Grid */}
            {[-2, -1, 1, 2].map(i => (
              <g key={i}>
                <line x1={CX + i * SC} x2={CX + i * SC} y1="20" y2="340" stroke={T.border} strokeWidth="0.8" />
                <line x1="20" x2="340" y1={CY + i * SC} y2={CY + i * SC} stroke={T.border} strokeWidth="0.8" />
              </g>
            ))}
            <line x1="20" x2="340" y1={CY} y2={CY} stroke={T.mutedLight} strokeWidth="1.2" />
            <line x1={CX} x2={CX} y1="20" y2="340" stroke={T.mutedLight} strokeWidth="1.2" />

            {/* Unit circle reference */}
            <circle cx={CX} cy={CY} r={SC} fill="none" stroke={T.border} strokeWidth="1" strokeDasharray="3 4" />

            {/* Real-only trail */}
            {showReal && realTrail.length > 1 && (
              <polyline
                points={[[2.4, 0] as V2, ...realTrail].map(v => proj(v).join(',')).join(' ')}
                fill="none" stroke={T.amber} strokeWidth="2" strokeDasharray="7 5" opacity="0.8"
              />
            )}

            {/* Complex spiral trail */}
            {trail.length > 1 && (
              <polyline
                points={trail.map(v => proj(v).join(',')).join(' ')}
                fill="none" stroke={spiralColor} strokeWidth="2.5"
              />
            )}

            {/* Trail dots */}
            {trail.map((v, i) => {
              const [x, y] = proj(v);
              return (
                <circle key={i} cx={x} cy={y} r="4"
                  fill={spiralColor}
                  opacity={0.15 + (i / trail.length) * 0.85}
                />
              );
            })}

            {/* Current vector */}
            {trail.length > 0 && (() => {
              const cur = trail[trail.length - 1];
              const [x2, y2] = proj(cur);
              return (
                <g>
                  <line x1={CX} y1={CY} x2={x2} y2={y2}
                    stroke={spiralColor} strokeWidth="3" strokeLinecap="round" />
                  <circle cx={x2} cy={y2} r="6" fill={spiralColor} />
                </g>
              );
            })()}

            {/* Legend */}
            <rect x="8" y="8" width="210" height="56" rx="8" fill="white" fillOpacity="0.95" />
            <line x1="16" y1="24" x2="36" y2="24" stroke={spiralColor} strokeWidth="2.5" />
            <circle cx="46" cy="24" r="4" fill={spiralColor} />
            <text x="54" y="28" fill={spiralColor} fontSize="11" fontWeight="700">комплексный λ ({spiralKind})</text>
            {showReal && (
              <>
                <line x1="16" y1="46" x2="36" y2="46" stroke={T.amber} strokeWidth="2" strokeDasharray="5 4" />
                <text x="42" y="50" fill={T.amber} fontSize="11" fontWeight="700">b = 0: чистое масштабирование</text>
              </>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Sliders */}
          <div style={{
            background: T.white,
            border: `1.5px solid ${T.border}`,
            borderRadius: 16,
            padding: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Параметры матрицы
            </div>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                  r — масштаб за шаг
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 800,
                  color: r === 1 ? T.cyan : r > 1 ? T.red : T.green,
                }}>
                  {r.toFixed(1)}
                </span>
              </div>
              <input type="range" min={0.5} max={2} step={0.1} value={r}
                onChange={ev => { setR(Number(ev.target.value)); setActiveExample(null); }}
                style={{ width: '100%', accentColor: T.primary }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.mutedLight, marginTop: 2 }}>
                <span>0.5 — сжатие</span><span>1 — окружность</span><span>2 — рост</span>
              </div>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                  θ — угол поворота за шаг
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.violet }}>
                  {theta}°
                </span>
              </div>
              <input type="range" min={0} max={180} step={5} value={theta}
                onChange={ev => { setTheta(Number(ev.target.value)); setActiveExample(null); }}
                style={{ width: '100%', accentColor: T.violet }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.mutedLight, marginTop: 2 }}>
                <span>0° — только масштаб</span><span>180° — отражение</span>
              </div>
            </label>
          </div>

          {/* Lambda display */}
          <div style={{
            background: T.white,
            border: `1.5px solid ${T.border}`,
            borderRadius: 16,
            padding: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Собственные значения
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.primaryDark, letterSpacing: '-0.02em' }}>
              λ = {a.toFixed(2)} ± {Math.abs(b).toFixed(2)}i
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <div style={{
                background: `${T.cyan}18`,
                border: `1px solid ${T.cyan}`,
                borderRadius: 10, padding: '8px 12px',
              }}>
                <div style={{ fontSize: 11, color: T.cyan, fontWeight: 700, marginBottom: 3 }}>
                  Вещественная часть a
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{a.toFixed(3)}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                  = r·cos θ → {a > 1 ? 'рост' : a < 1 ? 'затухание' : 'нейтрально'}
                </div>
              </div>
              <div style={{
                background: `${T.violet}18`,
                border: `1px solid ${T.violet}`,
                borderRadius: 10, padding: '8px 12px',
              }}>
                <div style={{ fontSize: 11, color: T.violet, fontWeight: 700, marginBottom: 3 }}>
                  Мнимая часть b
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{b.toFixed(3)}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                  = r·sin θ → скорость вращения
                </div>
              </div>
            </div>

            {/* Comparison toggle */}
            <button
              onClick={() => setShowReal(x => !x)}
              style={{
                marginTop: 12, width: '100%',
                background: showReal ? `${T.amber}22` : T.surface,
                border: `1.5px solid ${showReal ? T.amber : T.border}`,
                borderRadius: 10, padding: '8px 12px',
                fontSize: 12, fontWeight: 700,
                color: showReal ? '#92400e' : T.muted,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              {showReal ? '✓' : '○'} Показать случай b = 0 (без вращения)
            </button>
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
             {liveHint()}
          </div>

          {/* Steps counter */}
          <div style={{
            background: T.primaryLight,
            border: `1px solid ${T.primaryBorder}`,
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 13,
            color: T.primaryDark,
            fontWeight: 600,
          }}>
            Шагов применено: <b>{trail.length - 1}</b>.
            {trail.length > 1 && (() => {
              const last = trail[trail.length - 1];
              const dist = Math.hypot(...last).toFixed(2);
              return ` Длина вектора сейчас: ${dist}`;
            })()}
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
            <b> Главная идея:</b> Комплексные λ = a ± bi — это не абстракция.
            Вещественная часть <b>a</b> — скорость роста за шаг,
            мнимая <b>b</b> — скорость вращения.
            Вместе дают спираль. r = |λ| определяет, куда она уходит.
          </div>
        </div>
      </div>
    </div>
  );
}
