// @ts-nocheck
import { useMemo, useRef, useState } from 'react';

// ─── Color tokens ─────────────────────────────────────────────────────────────
const T = {
  text:          '#1e293b',
  muted:         '#64748b',
  mutedLight:    '#94a3b8',
  primary:       '#6366f1',
  primaryLight:  '#eef2ff',
  primaryBorder: '#c7d2fe',
  primaryDark:   '#4f46e5',
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

// ─── Math ─────────────────────────────────────────────────────────────────────
type Matrix2 = [[number, number], [number, number]];
type Vec2    = [number, number];
const EPS = 1e-9;

const apply     = (A: Matrix2, [x, y]: Vec2): Vec2 => [A[0][0]*x+A[0][1]*y, A[1][0]*x+A[1][1]*y];
const normV     = ([x, y]: Vec2) => Math.hypot(x, y);
const normalize = (v: Vec2): Vec2 => { const n = normV(v); return n < EPS ? [1,0] : [v[0]/n, v[1]/n]; };
const perp      = ([x, y]: Vec2): Vec2 => [-y, x];
const dotP      = (a: Vec2, b: Vec2) => a[0]*b[0]+a[1]*b[1];
const fmt       = (x: number, d = 2) => {
  const v = Math.abs(x) < 1e-10 ? 0 : x;
  return Number.isInteger(v) ? String(v) : v.toFixed(d).replace(/\.?0+$/, '');
};

function svd2x2(A: Matrix2) {
  const [[a,b],[c,d]] = A;
  const s11=a*a+c*c, s12=a*b+c*d, s22=b*b+d*d;
  const tr=s11+s22, delta=Math.hypot(s11-s22, 2*s12);
  const l1=Math.max(0,(tr+delta)/2), l2=Math.max(0,(tr-delta)/2);
  const sigma1=Math.sqrt(l1), sigma2=Math.sqrt(l2);
  const v1: Vec2 = delta<1e-10 ? [1,0] : normalize(Math.abs(s12)>1e-10 ? [l1-s22,s12] : (s11>=s22?[1,0]:[0,1]));
  const v2 = perp(v1);
  const u1: Vec2 = sigma1>EPS ? normalize(apply(A,v1)) : [1,0];
  const u2: Vec2 = sigma2>EPS ? normalize(apply(A,v2)) : perp(u1);
  return { sigma1, sigma2, v1, v2, u1, u2 };
}

// stretch ratio for a unit vector in direction θ
function stretchAt(A: Matrix2, theta: number): number {
  const v: Vec2 = [Math.cos(theta), Math.sin(theta)];
  return normV(apply(A, v));
}

// ─── Seeded random points ─────────────────────────────────────────────────────
function makePoints(n: number): Vec2[] {
  // simple LCG so points are stable across renders
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
  const pts: Vec2[] = [];
  while (pts.length < n) {
    const x = rand()*2-1, y = rand()*2-1;
    if (x*x+y*y <= 1) pts.push([x, y]);
  }
  return pts;
}
const BASE_POINTS = makePoints(320);

// ellipse path helper
function ellipsePath(A: Matrix2, cx: number, cy: number, sc: number) {
  const pts: string[] = [];
  for (let i=0; i<=240; i++) {
    const t=(i/240)*Math.PI*2;
    const [x,y]=apply(A,[Math.cos(t),Math.sin(t)]);
    pts.push(`${i===0?'M':'L'} ${(cx+x*sc).toFixed(2)} ${(cy-y*sc).toFixed(2)}`);
  }
  return pts.join(' ')+'Z';
}

// ─── Presets ──────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Общий случай',   A: [[2, 0.8],[0.3, 1.2]] as Matrix2, note: 'Неравномерное растяжение' },
  { label: 'Узкий эллипс',  A: [[3, 0  ],[0,   0.3]] as Matrix2, note: 'σ₁/σ₂ = 10: почти отрезок' },
  { label: 'Круг → круг',   A: [[0.9,-0.44],[0.44, 0.9]] as Matrix2, note: 'σ₁ ≈ σ₂ ≈ 1: чистый поворот' },
  { label: 'Вырожденная',   A: [[1, 2],[0.5, 1]] as Matrix2, note: 'σ₂ ≈ 0: плоскость схлопнулась' },
  { label: 'Сдвиг',         A: [[1, 1.5],[0, 1]] as Matrix2, note: 'Сдвиговое преобразование' },
];

// ─── Gauge bar ────────────────────────────────────────────────────────────────
function GaugeBar({ ratio, sigma1, sigma2 }: { ratio: number; sigma1: number; sigma2: number }) {
  const max = Math.max(sigma1, 0.01);
  const pct = (v: number) => Math.min(1, v / max) * 100;
  const rPct = pct(ratio);
  const s1Pct = pct(sigma1);
  const s2Pct = pct(sigma2);
  return (
    <div style={{ position: 'relative', height: 32, marginTop: 6 }}>
      {/* track */}
      <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 8, borderRadius: 4, background: T.border }} />
      {/* σ₂ marker */}
      <div style={{ position: 'absolute', top: 4, left: `${s2Pct}%`, transform: 'translateX(-50%)', width: 2, height: 24, background: T.green, borderRadius: 1 }} />
      {/* σ₁ marker */}
      <div style={{ position: 'absolute', top: 4, left: `${s1Pct}%`, transform: 'translateX(-50%)', width: 2, height: 24, background: T.violet, borderRadius: 1 }} />
      {/* ratio thumb */}
      <div style={{ position: 'absolute', top: 6, left: `${rPct}%`, transform: 'translateX(-50%)', width: 20, height: 20, borderRadius: '50%', background: T.amber, border: `3px solid ${T.white}`, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 0.06s' }} />
      {/* labels */}
      <div style={{ position: 'absolute', top: 32, left: `${s2Pct}%`, transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: T.green }}>σ₂</div>
      <div style={{ position: 'absolute', top: 32, left: `${s1Pct}%`, transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: T.violet }}>σ₁</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SVDStretchCoefficientsLab() {
  const [A, setA]           = useState<Matrix2>([[2, 0.8],[0.3, 1.2]]);
  const [theta, setTheta]   = useState(0.3);          // test vector angle
  const [showCircle, setShowCircle] = useState(true);
  const [showCloud, setShowCloud]   = useState(true);
  const [activePreset, setActivePreset] = useState(0);

  const svd = useMemo(() => svd2x2(A), [A]);
  const { sigma1, sigma2, v1, v2, u1, u2 } = svd;

  const ratio = useMemo(() => stretchAt(A, theta), [A, theta]);
  const nearV1 = Math.abs(dotP([Math.cos(theta), Math.sin(theta)], v1)) > 0.992;
  const nearV2 = Math.abs(dotP([Math.cos(theta), Math.sin(theta)], v2)) > 0.992;
  const isDegenerate = sigma2 < 0.05;
  const isCircle     = Math.abs(sigma1 - sigma2) < 0.08 && Math.abs(sigma1 - 1) < 0.15;
  const condNumber   = sigma2 > 0.01 ? sigma1 / sigma2 : Infinity;

  const setCell = (r: 0|1, c: 0|1, v: number) =>
    setA(p => { const n: Matrix2=[[p[0][0],p[0][1]],[p[1][0],p[1][1]]]; n[r][c]=v; return n; });

  function applyPreset(i: number) {
    setActivePreset(i);
    setA(PRESETS[i].A);
  }

  // canvas
  const W = 540, H = 380;
  const cx = W/2, cy = H/2;
  const inSc = 72;   // scale for input (unit circle)
  const outSc = Math.max(40, 140 / Math.max(sigma1, 0.5));

  // test vector
  const tv: Vec2 = [Math.cos(theta), Math.sin(theta)];
  const tvOut  = apply(A, tv);
  const tvOutN = normV(tvOut);

  // snap to v1/v2 magnets
  function snapTheta(raw: number) {
    const candidates = [v1, [-v1[0],-v1[1]] as Vec2, v2, [-v2[0],-v2[1]] as Vec2];
    let best = raw, bestD = Infinity;
    for (const m of candidates) {
      const a = Math.atan2(m[1], m[0]);
      const d = Math.abs(Math.atan2(Math.sin(raw-a), Math.cos(raw-a)));
      if (d < bestD) { bestD=d; best=a; }
    }
    return bestD < 0.13 ? best : raw;
  }

  // arrow polygon
  function arrow(x2: number, y2: number, dx: number, dy: number, color: string, size = 9) {
    const len = Math.hypot(dx, dy); if (len < 1) return null;
    const ux=dx/len, uy=dy/len, px=-uy, py=ux;
    return <polygon points={`${x2},${y2} ${x2-ux*size+px*size*0.5},${y2-uy*size+py*size*0.5} ${x2-ux*size-px*size*0.5},${y2-uy*size-py*size*0.5}`} fill={color}/>;
  }

  // drag on input SVG for test vector
  const svgInputRef = useRef<SVGSVGElement>(null);
  function handleSvgPointer(e: React.PointerEvent<SVGSVGElement>) {
    if (e.buttons !== 1 && e.type !== 'pointerdown') return;
    const r = svgInputRef.current!.getBoundingClientRect();
    const x = ((e.clientX-r.left)/r.width)*W - cx;
    const y = cy - ((e.clientY-r.top)/r.height)*H;
    if (Math.hypot(x,y) < 8) return;
    setTheta(snapTheta(Math.atan2(y, x)));
  }

  return (
    <div style={{ padding: '0 0 48px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5" stroke={T.mutedLight} strokeWidth="1.4" strokeDasharray="3 2"/>
              <ellipse cx="8" cy="8" rx="7" ry="3" stroke={T.primary} strokeWidth="1.6" transform="rotate(-25 8 8)"/>
              <line x1="8" y1="8" x2="14" y2="6" stroke={T.amber} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: T.primary, textTransform: 'uppercase' }}>Лаборатория</span>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>
          Сингулярные числа как коэффициенты растяжения
        </h2>
        <p style={{ margin: 0, color: T.muted, fontSize: 15, lineHeight: 1.65 }}>
          <strong style={{ color: T.text }}>Исследовательский вопрос:</strong> Каждая матрица растягивает пространство неравномерно — в одних направлениях сильнее, в других слабее. Как это измерить и что это говорит о матрице?
        </p>
      </div>

      {/* ── Context ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '13px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Как работает лаборатория</div>
        <p style={{ margin: 0, color: T.text, fontSize: 13, lineHeight: 1.8 }}>
          Слева — облако точек внутри единичного круга и <span style={{ color: T.amber, fontWeight: 700 }}>жёлтая стрелка</span> тестового вектора. Кликни или потяни по канвасу, чтобы повернуть вектор в любое направление. Справа — тот же вектор после преобразования A и облако «разлетевшихся» точек на эллипсе. Индикатор показывает, во сколько раз удлинился вектор.
        </p>
      </div>

      {/* ── Presets ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
        {PRESETS.map((p,i) => (
          <button key={p.label} onClick={() => applyPreset(i)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: activePreset===i ? T.primary : T.white,
            color:      activePreset===i ? T.white   : T.muted,
            border: `1.5px solid ${activePreset===i ? T.primary : T.border}`,
            transition: 'all 0.15s',
          }}>{p.label}</button>
        ))}
        {activePreset >= 0 && (
          <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, color: T.muted, background: T.surface, border: `1px solid ${T.border}` }}>
            {PRESETS[activePreset]?.note}
          </span>
        )}
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 310px', gap: 16, alignItems: 'start' }}>

        {/* LEFT: two canvases */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* INPUT canvas */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Вход</div>
              <svg
                ref={svgInputRef}
                viewBox={`0 0 ${W} ${H}`} width="100%"
                style={{ borderRadius: 16, border: `1px solid ${T.border}`, background: T.white, display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                onPointerDown={handleSvgPointer}
                onPointerMove={handleSvgPointer}
                role="img" aria-label="Входной единичный круг"
              >
                {/* grid */}
                {[-3,-2,-1,0,1,2,3].map(g => (
                  <g key={g}>
                    <line x1={cx+g*inSc} y1={16} x2={cx+g*inSc} y2={H-16} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.7}/>
                    <line x1={16} y1={cy-g*inSc} x2={W-16} y2={cy-g*inSc} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.7}/>
                  </g>
                ))}

                {/* unit circle */}
                <circle cx={cx} cy={cy} r={inSc} fill={`${T.primary}07`} stroke={T.mutedLight} strokeWidth="1.6" strokeDasharray="4 3"/>

                {/* point cloud */}
                {showCloud && BASE_POINTS.map(([px,py],i) => (
                  <circle key={i} cx={cx+px*inSc} cy={cy-py*inSc} r={2.2} fill={T.primary} opacity={0.28}/>
                ))}

                {/* v1, v2 magnets */}
                {[v1, [-v1[0],-v1[1]] as Vec2].map((v,i) => (
                  <circle key={`m1${i}`} cx={cx+v[0]*inSc} cy={cy-v[1]*inSc} r={10} fill={T.violet} opacity={0.18} stroke={T.violet} strokeWidth="1.8"/>
                ))}
                {!isDegenerate && [v2, [-v2[0],-v2[1]] as Vec2].map((v,i) => (
                  <circle key={`m2${i}`} cx={cx+v[0]*inSc} cy={cy-v[1]*inSc} r={10} fill={T.green} opacity={0.16} stroke={T.green} strokeWidth="1.8"/>
                ))}
                <text x={cx+v1[0]*inSc+10} y={cy-v1[1]*inSc-6} fontSize="11" fontWeight="800" fill={T.violet}>v₁</text>
                {!isDegenerate && <text x={cx+v2[0]*inSc+10} y={cy-v2[1]*inSc-6} fontSize="11" fontWeight="800" fill={T.green}>v₂</text>}

                {/* test vector */}
                <line x1={cx} y1={cy} x2={cx+tv[0]*inSc} y2={cy-tv[1]*inSc} stroke={T.amber} strokeWidth="3"/>
                {arrow(cx+tv[0]*inSc, cy-tv[1]*inSc, tv[0]*inSc, -tv[1]*inSc, T.amber)}
                <circle cx={cx+tv[0]*inSc} cy={cy-tv[1]*inSc} r={8} fill={T.amber} stroke={T.white} strokeWidth="2.5"/>
                <text x={cx+tv[0]*inSc*0.55} y={cy-tv[1]*inSc*0.55-8} fontSize="11" fontWeight="700" fill={T.amber}>‖x‖=1</text>

                <text x={cx} y={H-14} textAnchor="middle" fontSize="11" fill={T.mutedLight}>Кликни или потяни для поворота вектора</text>
              </svg>
            </div>

            {/* OUTPUT canvas */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Выход · A(x)</div>
              <svg
                viewBox={`0 0 ${W} ${H}`} width="100%"
                style={{ borderRadius: 16, border: `1px solid ${T.border}`, background: T.white, display: 'block' }}
                role="img" aria-label="Выходной эллипс"
              >
                {/* grid */}
                {[-3,-2,-1,0,1,2,3].map(g => (
                  <g key={g}>
                    <line x1={cx+g*outSc} y1={16} x2={cx+g*outSc} y2={H-16} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.7}/>
                    <line x1={16} y1={cy-g*outSc} x2={W-16} y2={cy-g*outSc} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.7}/>
                  </g>
                ))}

                {/* transformed point cloud */}
                {showCloud && BASE_POINTS.map(([px,py],i) => {
                  const [qx,qy] = apply(A, [px, py]);
                  return <circle key={i} cx={cx+qx*outSc} cy={cy-qy*outSc} r={2.2} fill={T.primary} opacity={0.22}/>;
                })}

                {/* unit circle image (ellipse) */}
                {showCircle && (
                  <path d={ellipsePath(A, cx, cy, outSc)} fill={`${T.primary}0d`} stroke={T.primary} strokeWidth="2.2"/>
                )}

                {/* semi-axes */}
                {(() => {
                  const ax1 = cx+u1[0]*sigma1*outSc, ay1 = cy-u1[1]*sigma1*outSc;
                  const ax2 = cx+u2[0]*sigma2*outSc, ay2 = cy-u2[1]*sigma2*outSc;
                  return <>
                    <line x1={cx} y1={cy} x2={ax1} y2={ay1} stroke={T.violet} strokeWidth="2.5" opacity="0.5"/>
                    {arrow(ax1,ay1, ax1-cx, ay1-cy, T.violet, 8)}
                    <text x={ax1+8} y={ay1-6} fontSize="11" fontWeight="800" fill={T.violet}>σ₁u₁</text>
                    {!isDegenerate && <>
                      <line x1={cx} y1={cy} x2={ax2} y2={ay2} stroke={T.green} strokeWidth="2.5" opacity="0.5"/>
                      {arrow(ax2,ay2, ax2-cx, ay2-cy, T.green, 8)}
                      <text x={ax2+8} y={ay2-6} fontSize="11" fontWeight="800" fill={T.green}>σ₂u₂</text>
                    </>}
                  </>;
                })()}

                {/* transformed test vector */}
                {tvOutN > 0.01 && (
                  <>
                    <line x1={cx} y1={cy} x2={cx+tvOut[0]*outSc} y2={cy-tvOut[1]*outSc} stroke={T.amber} strokeWidth="3"/>
                    {arrow(cx+tvOut[0]*outSc, cy-tvOut[1]*outSc, tvOut[0]*outSc, -tvOut[1]*outSc, T.amber)}
                    <circle cx={cx+tvOut[0]*outSc} cy={cy-tvOut[1]*outSc} r={8} fill={T.amber} stroke={T.white} strokeWidth="2.5"/>
                    <text
                      x={cx+tvOut[0]*outSc*0.5+8}
                      y={cy-tvOut[1]*outSc*0.5-8}
                      fontSize="11" fontWeight="700" fill={T.amber}
                    >‖Ax‖≈{fmt(tvOutN,2)}</text>
                  </>
                )}
                {tvOutN <= 0.01 && (
                  <text x={cx+10} y={cy-10} fontSize="12" fontWeight="700" fill={T.red}>Схлопнулся в 0</text>
                )}
              </svg>
            </div>
          </div>

          {/* ── Stretch ratio indicator ── */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Коэффициент растяжения в текущем направлении
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, color: T.violet, fontWeight: 700 }}>σ₁={fmt(sigma1)}</span>
                <span style={{ fontSize: 12, color: T.green,  fontWeight: 700 }}>σ₂={fmt(sigma2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <GaugeBar ratio={ratio} sigma1={sigma1} sigma2={sigma2}/>
              </div>
              <div style={{
                minWidth: 90, textAlign: 'center', padding: '8px 14px',
                background: nearV1 ? `${T.violet}18` : nearV2 ? `${T.green}18` : T.amberLight,
                border: `1.5px solid ${nearV1 ? T.violet : nearV2 ? T.green : '#fcd34d'}`,
                borderRadius: 12,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: nearV1 ? T.violet : nearV2 ? T.green : T.amber, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {nearV1 ? 'максимум' : nearV2 ? 'минимум' : 'коэф.'}
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: nearV1 ? T.violet : nearV2 ? T.green : T.amber, lineHeight: 1.1 }}>
                  {fmt(ratio)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              <span style={{ color: T.violet, fontWeight: 700 }}>●</span> σ₁ — максимум (направление v₁) &nbsp;·&nbsp;
              <span style={{ color: T.green,  fontWeight: 700 }}>●</span> σ₂ — минимум (направление v₂) &nbsp;·&nbsp;
              <span style={{ color: T.amber,  fontWeight: 700 }}>●</span> текущее значение
            </div>
          </div>

          {/* ── Dynamic commentary ── */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 17px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7 }}>💡 Что сейчас происходит</div>
            <p style={{ margin: 0, color: T.text, fontSize: 13.5, lineHeight: 1.75 }}>
              {isDegenerate
                ? `Матрица близка к вырожденной: σ₂ ≈ ${fmt(sigma2)} ≈ 0. В направлении v₂ любой вектор схлопывается в точку — целое измерение «исчезает». Эллипс почти стал отрезком.`
                : isCircle
                  ? `σ₁ ≈ σ₂ ≈ ${fmt(sigma1)}: коэффициент растяжения одинаков во всех направлениях. Матрица лишь поворачивает (и, возможно, масштабирует) круг — он остаётся кругом.`
                  : nearV1
                    ? `✨ Вектор смотрит вдоль v₁ — это направление максимального растяжения. Коэффициент достигает σ₁ = ${fmt(sigma1)}.`
                    : nearV2
                      ? `✨ Вектор смотрит вдоль v₂ — это направление минимального растяжения. Коэффициент достигает σ₂ = ${fmt(sigma2)}.`
                      : `Текущий коэффициент растяжения ${fmt(ratio,2)} — между σ₂=${fmt(sigma2)} и σ₁=${fmt(sigma1)}. Поверни вектор к фиолетовому магниту (v₁) для максимума или к зелёному (v₂) для минимума.`}
            </p>
          </div>
        </div>

        {/* RIGHT: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Matrix sliders */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Матрица A</div>

            <div style={{ display: 'inline-flex', alignItems: 'stretch', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 10px', fontFamily: "'Georgia',serif", fontSize: 14, marginBottom: 14 }}>
              <div style={{ borderLeft:`2px solid ${T.text}`, borderTop:`2px solid ${T.text}`, borderBottom:`2px solid ${T.text}`, width:7, borderRadius:'3px 0 0 3px' }}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 14px', padding:'0 10px', color: T.text }}>
                {A.flat().map((v,i) => <span key={i} style={{ textAlign:'center', fontVariantNumeric:'tabular-nums' }}>{fmt(v)}</span>)}
              </div>
              <div style={{ borderRight:`2px solid ${T.text}`, borderTop:`2px solid ${T.text}`, borderBottom:`2px solid ${T.text}`, width:7, borderRadius:'0 3px 3px 0' }}/>
            </div>

            {([['a₁₁',0,0],['a₁₂',0,1],['a₂₁',1,0],['a₂₂',1,1]] as [string,0|1,0|1][]).map(([label,r,c]) => (
              <div key={label} style={{ display:'grid', gridTemplateColumns:'36px 1fr 40px', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:12, fontFamily:"'Georgia',serif", color:T.text, textAlign:'right' }}>{label}</span>
                <input type="range" min={-4} max={4} step={0.05} value={A[r][c]}
                  onChange={e => { setActivePreset(-1); setCell(r,c,Number(e.target.value)); }}
                  style={{ accentColor:T.primary, cursor:'pointer' }}/>
                <span style={{ fontSize:12, fontFamily:'monospace', color:T.primary, textAlign:'right' }}>{fmt(A[r][c])}</span>
              </div>
            ))}
          </div>

          {/* Test vector slider */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Тестовый вектор</div>
            <div style={{ display:'grid', gridTemplateColumns:'54px 1fr 50px', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, color:T.text }}>Угол θ</span>
              <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={theta}
                onChange={e => setTheta(snapTheta(Number(e.target.value)))}
                style={{ accentColor:T.amber, cursor:'pointer' }}/>
              <span style={{ fontSize:12, fontFamily:'monospace', color:T.amber, textAlign:'right' }}>{fmt((theta*180/Math.PI+360)%360,0)}°</span>
            </div>
            <div style={{ marginTop:10, display:'flex', gap:8 }}>
              <button onClick={() => setTheta(Math.atan2(v1[1],v1[0]))} style={{ flex:1, padding:'6px 0', borderRadius:8, fontSize:12, fontWeight:700, background:`${T.violet}12`, border:`1px solid ${T.violet}30`, color:T.violet, cursor:'pointer' }}>→ v₁</button>
              <button onClick={() => setTheta(Math.atan2(v2[1],v2[0]))} style={{ flex:1, padding:'6px 0', borderRadius:8, fontSize:12, fontWeight:700, background:`${T.green}12`, border:`1px solid ${T.green}30`, color:T.green, cursor:'pointer' }}>→ v₂</button>
            </div>
          </div>

          {/* Display toggles */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Показывать</div>
            {[
              { label: 'Образ единичного круга (эллипс)', val: showCircle, set: setShowCircle, color: T.primary },
              { label: 'Облако точек', val: showCloud, set: setShowCloud, color: T.primary },
            ].map(opt => (
              <button key={opt.label} onClick={() => opt.set(v => !v)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background: opt.val ? T.primaryLight : T.surface, border:`1.5px solid ${opt.val ? T.primaryBorder : T.border}`, borderRadius:10, padding:'9px 12px', cursor:'pointer', marginBottom:8, textAlign:'left' }}>
                <div style={{ width:28, height:16, borderRadius:8, background: opt.val ? T.primary : T.border, position:'relative', flexShrink:0, transition:'background 0.18s' }}>
                  <div style={{ position:'absolute', top:2, left: opt.val ? 14 : 2, width:12, height:12, borderRadius:'50%', background:T.white, transition:'left 0.18s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                </div>
                <span style={{ fontSize:12, color:T.text }}>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 17px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Параметры матрицы</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label: 'σ₁ (макс. растяжение)', val: fmt(sigma1), color: T.violet },
                { label: 'σ₂ (мин. растяжение)', val: fmt(sigma2), color: T.green },
                { label: 'Число обусловленности σ₁/σ₂', val: isFinite(condNumber) ? fmt(condNumber,1) : '∞', color: condNumber > 20 ? T.red : T.text },
                { label: 'det A = σ₁ · σ₂', val: fmt(sigma1*sigma2,2), color: T.amber },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:T.white, borderRadius:8, border:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:12, color:T.muted }}>{row.label}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:row.color, fontVariantNumeric:'tabular-nums' }}>{row.val}</span>
                </div>
              ))}
            </div>
            {condNumber > 20 && (
              <div style={{ marginTop:10, background:T.redLight, border:`1px solid #fca5a5`, borderRadius:8, padding:'8px 11px', fontSize:12, color:T.red, lineHeight:1.5 }}>
                ⚠ Высокое число обусловленности ({fmt(condNumber,0)}) — матрица почти вырождена и крайне чувствительна к направлению входа.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Guided steps ── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:T.amberLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🔬</div>
          <span style={{ fontSize:13, fontWeight:800, color:T.text }}>Что исследовать</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(270px, 1fr))', gap:12 }}>
          {[
            { n:'1', color:T.violet, q:'Покрути тестовый вектор по кругу. При каком направлении растяжение максимально?', a:'Когда вектор совпадает с v₁ — фиолетовым магнитом. Коэффициент достигает σ₁.' },
            { n:'2', color:T.green,  q:'При каком направлении растяжение минимально?', a:'Когда вектор совпадает с v₂ — зелёным магнитом. Коэффициент падает до σ₂.' },
            { n:'3', color:T.amber,  q:'Выбери «Узкий эллипс» (σ₁/σ₂ = 10). На что похож образ круга?', a:'Очень вытянутый эллипс, почти отрезок. Вдоль v₂ вектор сжимается в 10 раз сильнее, чем вдоль v₁.' },
            { n:'4', color:T.red,    q:'Выбери «Вырожденная». Что происходит с коэффициентом в направлении v₂?', a:'σ₂ ≈ 0: вектор схлопывается в точку. Целое измерение исчезает.' },
            { n:'5', color:T.cyan,   q:'Выбери «Круг → круг». Почему коэффициент одинаков во всех направлениях?', a:'σ₁ ≈ σ₂ — матрица ортогональна (только поворот). Все направления растягиваются одинаково, круг остаётся кругом.' },
          ].map(step => (
            <div key={step.n} style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px 16px' }}>
              <div style={{ display:'flex', gap:10, marginBottom:8 }}>
                <div style={{ width:24, height:24, borderRadius:6, background:`${step.color}18`, color:step.color, fontWeight:900, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{step.n}</div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, lineHeight:1.5 }}>{step.q}</div>
              </div>
              <div style={{ background:`${step.color}0b`, borderRadius:9, padding:'8px 11px', fontSize:12.5, color:T.text, lineHeight:1.6, borderLeft:`3px solid ${step.color}` }}>{step.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Discovery ── */}
      <div style={{ marginTop:22, background:'#0f172a', color:T.white, borderRadius:16, padding:'20px 24px' }}>
        <div style={{ fontSize:11, fontWeight:800, color:'#c4b5fd', textTransform:'uppercase', letterSpacing:'0.16em', marginBottom:8 }}>Открытие</div>
        <p style={{ margin:0, fontSize:14, lineHeight:1.8, color:'#e2e8f0' }}>
          Сингулярные числа — это <strong style={{ color:'#c4b5fd' }}>максимальный и минимальный коэффициенты усиления</strong> матрицы. Что бы вы ни подали на вход, на выходе длина вектора будет между&nbsp;
          <strong style={{ color:'#86efac' }}>σ₂</strong> и <strong style={{ color:'#c4b5fd' }}>σ₁</strong>. Если <strong style={{ color:'#fca5a5' }}>σ₂ = 0</strong> — матрица «схлопывает» целое измерение. Если отношение <strong style={{ color:'#fbbf24' }}>σ₁/σ₂</strong> огромно — матрица почти вырождена и крайне чувствительна к направлению входа.
        </p>
      </div>
    </div>
  );
}
