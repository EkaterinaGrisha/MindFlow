// @ts-nocheck
import { useMemo, useState, type PointerEvent } from 'react';

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

// probe colours
const ROSE   = '#e11d48';
const BLUE   = T.primary;

// ─── Math helpers ─────────────────────────────────────────────────────────────
type Matrix2 = [[number, number], [number, number]];
type Vec2    = [number, number];
const EPS = 1e-9;

const apply     = (A: Matrix2, [x, y]: Vec2): Vec2 => [A[0][0]*x+A[0][1]*y, A[1][0]*x+A[1][1]*y];
const norm      = ([x, y]: Vec2) => Math.hypot(x, y);
const normalize = (v: Vec2): Vec2 => { const n = norm(v); return n < EPS ? [1,0] : [v[0]/n, v[1]/n]; };
const perp      = ([x, y]: Vec2): Vec2 => [-y, x];
const dotP      = (a: Vec2, b: Vec2) => a[0]*b[0]+a[1]*b[1];
const fmt       = (x: number, d = 2) => {
  const v = Math.abs(x) < 1e-10 ? 0 : x;
  return Number.isInteger(v) ? String(v) : v.toFixed(d).replace(/\.?0+$/, '');
};
const deg = (r: number) => (r * 180) / Math.PI;

function angleToVec(a: number): Vec2 { return [Math.cos(a), Math.sin(a)]; }
function vecToAngle([x, y]: Vec2) { const a = Math.atan2(y, x); return a < 0 ? a + Math.PI*2 : a; }

function angleBetween(a: Vec2, b: Vec2): number | null {
  const na = norm(a), nb = norm(b);
  if (na < 1e-7 || nb < 1e-7) return null;
  return deg(Math.acos(Math.max(-1, Math.min(1, dotP(a, b) / (na * nb)))));
}

function axisAngleBetween(a: Vec2, b: Vec2): number | null {
  const raw = angleBetween(a, b);
  return raw === null ? null : Math.min(raw, 180 - raw);
}

function svd2x2(A: Matrix2) {
  const [[a,b],[c,d]] = A;
  const s11=a*a+c*c, s12=a*b+c*d, s22=b*b+d*d;
  const tr=s11+s22, delta=Math.hypot(s11-s22, 2*s12);
  const l1=Math.max(0,(tr+delta)/2), l2=Math.max(0,(tr-delta)/2);
  const sigma1=Math.sqrt(l1), sigma2=Math.sqrt(l2);
  const v1: Vec2 = delta < 1e-10 ? [1,0] : normalize(Math.abs(s12)>1e-10 ? [l1-s22,s12] : (s11>=s22?[1,0]:[0,1]));
  const v2 = perp(v1);
  const u1: Vec2 = sigma1 > EPS ? normalize(apply(A,v1)) : [1,0];
  const u2: Vec2 = sigma2 > EPS ? normalize(apply(A,v2)) : perp(u1);
  return { sigma1, sigma2, v1, v2, u1, u2 };
}

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
  { label: 'Общий случай',    A: [[2, 1.1],[0.4, 1.35]] as Matrix2, note: 'Столбцы не ортогональны — найди магниты вручную' },
  { label: 'Симметричная',    A: [[2, 0.8],[0.8, 1]]    as Matrix2, note: 'Магниты совпадают с собственными векторами A' },
  { label: 'Нулевой столбец', A: [[2, 0  ],[1,   0]]    as Matrix2, note: 'σ₂ = 0: эллипс схлопнулся в отрезок' },
  { label: 'Диагональная',    A: [[2.2, 0],[0,  0.8]]   as Matrix2, note: 'Особые оси — X и Y: магниты на осях координат' },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────
function AngleBadge({ label, value, isGood }: { label: string; value: string; isGood: boolean }) {
  return (
    <div style={{
      flex: 1, borderRadius: 14,
      background: isGood ? T.greenLight : T.primaryLight,
      border: `1.5px solid ${isGood ? '#6ee7b7' : T.primaryBorder}`,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.13em', color: isGood ? T.green : T.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: isGood ? T.green : T.primary }}>{value}</div>
    </div>
  );
}

function InfoBox({ title, children, color = T.primary }: { title: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: `${color}0d`, border: `1px solid ${color}35`, borderRadius: 12, padding: '12px 15px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SVDOrthogonalAxesLab() {
  const [A, setA]   = useState<Matrix2>([[2, 1.1],[0.4, 1.35]]);
  const [probeAngle, setProbeAngle] = useState(0.55);
  const [freeAngle,  setFreeAngle]  = useState(2.05);
  const [locked, setLocked]         = useState(true);
  const [activePreset, setActivePreset] = useState(0);

  const svd = useMemo(() => svd2x2(A), [A]);

  const p1 = angleToVec(probeAngle);
  const p2 = angleToVec(locked ? probeAngle + Math.PI/2 : freeAngle);
  const q1 = apply(A, p1);
  const q2 = apply(A, p2);

  const inAngle  = angleBetween(p1, p2);
  const outAngle = angleBetween(q1, q2);
  const axisAng  = axisAngleBetween(q1, q2);
  const isGoodIn  = inAngle  !== null && Math.abs(inAngle  - 90) < 1.2;
  const isGoodOut = outAngle !== null && Math.abs(outAngle - 90) < 1.5;

  const isRankOne   = svd.sigma2 < 0.08;
  const onMagnets   = Math.abs(dotP(p1, svd.v1)) > 0.992 && Math.abs(dotP(p2, svd.v2)) > 0.992;
  const isSymmetric = Math.abs(A[0][1] - A[1][0]) < 0.05;

  // canvas constants
  const W = 540, H = 340;
  const cx = W/2, cy = H/2, sc = 90;
  const outSc = Math.max(55, 150/Math.max(1, svd.sigma1));

  // magnet snap
  function snapToMagnets(angle: number) {
    const candidates = [svd.v1, [-svd.v1[0],-svd.v1[1]] as Vec2, svd.v2, [-svd.v2[0],-svd.v2[1]] as Vec2];
    let best = angle, bestDist = Infinity;
    for (const m of candidates) {
      const a = vecToAngle(m);
      const d = Math.abs(Math.atan2(Math.sin(angle-a), Math.cos(angle-a)));
      if (d < bestDist) { bestDist = d; best = a; }
    }
    return bestDist < 0.14 ? best : angle;
  }

  function updateProbe(clientX: number, clientY: number, svg: SVGSVGElement, isP1: boolean) {
    const r = svg.getBoundingClientRect();
    const x = ((clientX-r.left)/r.width)*W - cx;
    const y = cy - ((clientY-r.top)/r.height)*H;
    const next = snapToMagnets(Math.atan2(y, x));
    if (isP1 || locked) setProbeAngle(next);
    else setFreeAngle(next);
  }

  function handlers(isP1: boolean) {
    return {
      onPointerDown: (e: PointerEvent<SVGCircleElement>) => { e.currentTarget.setPointerCapture(e.pointerId); updateProbe(e.clientX, e.clientY, e.currentTarget.ownerSVGElement!, isP1); },
      onPointerMove: (e: PointerEvent<SVGCircleElement>) => { if (e.buttons!==1) return; updateProbe(e.clientX, e.clientY, e.currentTarget.ownerSVGElement!, isP1); },
    };
  }

  function setCell(r: 0|1, c: 0|1, v: number) {
    setA(p => { const n: Matrix2 = [[p[0][0],p[0][1]],[p[1][0],p[1][1]]]; n[r][c]=v; return n; });
  }

  function applyPreset(i: number) {
    setActivePreset(i);
    setA(PRESETS[i].A);
    setProbeAngle(0.55);
    setFreeAngle(2.05);
  }

  // arrow tip helper
  function arrowHead(x: number, y: number, dx: number, dy: number, color: string) {
    const len = Math.hypot(dx, dy); if (len < 1) return null;
    const ux = dx/len, uy = dy/len;
    const px = -uy, py = ux;
    const tip = [x, y];
    const b1 = [x - ux*10 + px*5, y - uy*10 + py*5];
    const b2 = [x - ux*10 - px*5, y - uy*10 - py*5];
    return <polygon points={`${tip[0]},${tip[1]} ${b1[0]},${b1[1]} ${b2[0]},${b2[1]}`} fill={color} />;
  }

  // right-angle mark between two vectors
  function rightAngleMark(ox2: number, oy2: number, v1: Vec2, v2: Vec2, size: number, color: string) {
    const s = size;
    const [ax,ay] = normalize(v1), [bx,by] = normalize(v2);
    const c1 = [ox2+ax*s, oy2-ay*s];
    const c2 = [ox2+(ax+bx)*s, oy2-(ay+by)*s];
    const c3 = [ox2+bx*s, oy2-by*s];
    return <polyline points={`${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${c3[0]},${c3[1]}`} fill="none" stroke={color} strokeWidth="1.8" opacity="0.7" />;
  }

  return (
    <div style={{ padding: '0 0 48px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* small ellipse icon */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4" stroke={T.primary} strokeWidth="1.8"/>
              <line x1="8" y1="4" x2="8" y2="12" stroke={T.green} strokeWidth="1.5"/>
              <line x1="1" y1="8" x2="15" y2="8" stroke={T.amber} strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: T.primary, textTransform: 'uppercase' }}>Лаборатория</span>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>
          Почему оси эллипса всегда ортогональны?
        </h2>
        <p style={{ margin: 0, color: T.muted, fontSize: 15, lineHeight: 1.65 }}>
          <strong style={{ color: T.text }}>Исследовательский вопрос:</strong> Образ единичной окружности под действием матрицы — эллипс. Его оси — сингулярные векторы. Почему они всегда перпендикулярны, даже если исходные столбцы матрицы не ортогональны?
        </p>
      </div>

      {/* ── What to do ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '13px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Что делать</div>
        <p style={{ margin: 0, color: T.text, fontSize: 13, lineHeight: 1.75 }}>
          Перетащи <span style={{ color: ROSE, fontWeight: 700 }}>красный зонд</span> по единичной окружности. <span style={{ color: BLUE, fontWeight: 700 }}>Синий зонд</span> держится перпендикулярно (или отсоединяй его ниже). Смотри, как меняется угол между их образами на эллипсе справа. Ищи «магнитные» точки — позиции, где выходной угол тоже станет&nbsp;90°.
        </p>
      </div>

      {/* ── Presets ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => applyPreset(i)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: activePreset === i ? T.primary : T.white,
              color:      activePreset === i ? T.white   : T.muted,
              border: `1.5px solid ${activePreset === i ? T.primary : T.border}`,
              transition: 'all 0.15s',
            }}
          >{p.label}</button>
        ))}
        {activePreset >= 0 && (
          <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, color: T.muted, background: T.surface, border: `1px solid ${T.border}` }}>
            {PRESETS[activePreset]?.note}
          </span>
        )}
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 310px', gap: 16, alignItems: 'start' }}>

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Two canvases side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* INPUT canvas */}
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Вход · единичная окружность</div>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                width="100%"
                style={{ borderRadius: 16, border: `1px solid ${T.border}`, background: T.white, display: 'block', touchAction: 'none' }}
                role="img"
                aria-label="Входная единичная окружность с зондами"
              >
                {/* grid */}
                {[-2,-1,0,1,2].map(g => (
                  <g key={g}>
                    <line x1={cx+g*sc} y1={20} x2={cx+g*sc} y2={H-20} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.8}/>
                    <line x1={20} y1={cy-g*sc} x2={W-20} y2={cy-g*sc} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.8}/>
                  </g>
                ))}

                {/* unit circle */}
                <circle cx={cx} cy={cy} r={sc} fill={`${T.primary}07`} stroke={T.mutedLight} strokeWidth="1.8" strokeDasharray="5 4"/>

                {/* singular direction magnets */}
                {[svd.v1, [-svd.v1[0],-svd.v1[1]] as Vec2].map((v,i) => (
                  <circle key={`v1m${i}`} cx={cx+v[0]*sc} cy={cy-v[1]*sc} r={11}
                    fill={T.violet} opacity={0.18} stroke={T.violet} strokeWidth="2"/>
                ))}
                {!isRankOne && [svd.v2, [-svd.v2[0],-svd.v2[1]] as Vec2].map((v,i) => (
                  <circle key={`v2m${i}`} cx={cx+v[0]*sc} cy={cy-v[1]*sc} r={11}
                    fill={T.green} opacity={0.18} stroke={T.green} strokeWidth="2"/>
                ))}

                {/* magnet labels */}
                <text x={cx+svd.v1[0]*sc+12} y={cy-svd.v1[1]*sc-8} fontSize="12" fontWeight="800" fill={T.violet}>v₁</text>
                {!isRankOne && <text x={cx+svd.v2[0]*sc+12} y={cy-svd.v2[1]*sc-8} fontSize="12" fontWeight="800" fill={T.green}>v₂</text>}

                {/* right angle mark if both probes exactly on magnets */}
                {onMagnets && rightAngleMark(cx, cy, p1, p2, 18, T.amber)}

                {/* probe lines */}
                <line x1={cx} y1={cy} x2={cx+p1[0]*sc} y2={cy-p1[1]*sc} stroke={ROSE} strokeWidth="2.5"/>
                <line x1={cx} y1={cy} x2={cx+p2[0]*sc} y2={cy-p2[1]*sc} stroke={BLUE} strokeWidth="2.5"/>

                {/* probe dots */}
                <circle cx={cx+p1[0]*sc} cy={cy-p1[1]*sc} r={12} fill={ROSE} stroke={T.white} strokeWidth="3"
                  style={{ cursor: 'grab' }} {...handlers(true)}/>
                <circle cx={cx+p2[0]*sc} cy={cy-p2[1]*sc} r={12} fill={BLUE} stroke={T.white} strokeWidth="3"
                  style={{ cursor: locked ? 'default' : 'grab' }} {...(locked ? {} : handlers(false))}/>

                {/* angle arc */}
                {(() => {
                  const a1 = Math.atan2(-p1[1], p1[0]), a2 = Math.atan2(-p2[1], p2[0]);
                  const r2 = 28;
                  const x1 = cx + r2*Math.cos(a1), y1 = cy + r2*Math.sin(a1);
                  const x2 = cx + r2*Math.cos(a2), y2 = cy + r2*Math.sin(a2);
                  return <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r2} ${r2} 0 0 1 ${x2} ${y2} Z`}
                    fill={isGoodIn ? `${T.green}30` : `${ROSE}18`} stroke="none"/>;
                })()}

                {/* angle value */}
                <text x={cx} y={cy+H*0.38} textAnchor="middle" fontSize="13" fontWeight="700" fill={isGoodIn ? T.green : T.muted}>
                  {inAngle !== null ? `${fmt(inAngle,1)}°` : '—'}
                </text>
              </svg>
            </div>

            {/* OUTPUT canvas */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Выход · эллипс A(x)</div>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                width="100%"
                style={{ borderRadius: 16, border: `1px solid ${T.border}`, background: T.white, display: 'block' }}
                role="img"
                aria-label="Выходной эллипс с образами зондов"
              >
                {/* grid */}
                {[-3,-2,-1,0,1,2,3].map(g => (
                  <g key={g}>
                    <line x1={cx+g*outSc} y1={10} x2={cx+g*outSc} y2={H-10} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.8}/>
                    <line x1={10} y1={cy-g*outSc} x2={W-10} y2={cy-g*outSc} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.8}/>
                  </g>
                ))}

                {/* ellipse */}
                <path d={ellipsePath(A, cx, cy, outSc)} fill={`${T.primary}0f`} stroke={T.primary} strokeWidth="2.5"/>

                {/* semi-axes σ₁u₁ and σ₂u₂ */}
                {(() => {
                  const ex1 = cx+svd.u1[0]*svd.sigma1*outSc, ey1 = cy-svd.u1[1]*svd.sigma1*outSc;
                  const ex2 = cx+svd.u2[0]*svd.sigma2*outSc, ey2 = cy-svd.u2[1]*svd.sigma2*outSc;
                  return <>
                    <line x1={cx} y1={cy} x2={ex1} y2={ey1} stroke={T.violet} strokeWidth="3" opacity="0.45"/>
                    {arrowHead(ex1, ey1, ex1-cx, ey1-cy, T.violet)}
                    <text x={ex1+9} y={ey1-7} fontSize="12" fontWeight="800" fill={T.violet}>σ₁u₁</text>
                    {!isRankOne && <>
                      <line x1={cx} y1={cy} x2={ex2} y2={ey2} stroke={T.green} strokeWidth="3" opacity="0.45"/>
                      {arrowHead(ex2, ey2, ex2-cx, ey2-cy, T.green)}
                      <text x={ex2+9} y={ey2-7} fontSize="12" fontWeight="800" fill={T.green}>σ₂u₂</text>
                    </>}
                    {/* right angle between axes */}
                    {!isRankOne && rightAngleMark(cx, cy, svd.u1, svd.u2, 16, T.amber)}
                  </>;
                })()}

                {/* probe image lines */}
                <line x1={cx} y1={cy} x2={cx+q1[0]*outSc} y2={cy-q1[1]*outSc} stroke={ROSE} strokeWidth="2.5"/>
                <line x1={cx} y1={cy} x2={cx+q2[0]*outSc} y2={cy-q2[1]*outSc} stroke={BLUE} strokeWidth="2.5"/>

                {/* right-angle mark when on magnets */}
                {onMagnets && rightAngleMark(cx, cy, normalize(q1), normalize(q2), 18, T.amber)}

                {/* image dots */}
                <circle cx={cx+q1[0]*outSc} cy={cy-q1[1]*outSc} r={9} fill={ROSE} stroke={T.white} strokeWidth="2.5"/>
                <circle cx={cx+q2[0]*outSc} cy={cy-q2[1]*outSc} r={9} fill={BLUE} stroke={T.white} strokeWidth="2.5"/>

                {/* output angle arc */}
                {outAngle !== null && (() => {
                  const nq1 = normalize(q1), nq2 = normalize(q2);
                  const a1 = Math.atan2(-nq1[1]*outSc, nq1[0]*outSc);
                  const a2 = Math.atan2(-nq2[1]*outSc, nq2[0]*outSc);
                  const r2 = 26;
                  const x1 = cx+r2*Math.cos(a1), y1 = cy+r2*Math.sin(a1);
                  const x2 = cx+r2*Math.cos(a2), y2 = cy+r2*Math.sin(a2);
                  return <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r2} ${r2} 0 0 1 ${x2} ${y2} Z`}
                    fill={isGoodOut ? `${T.green}30` : `${T.amber}25`} stroke="none"/>;
                })()}

                {/* output angle value */}
                <text x={cx} y={cy+H*0.38} textAnchor="middle" fontSize="13" fontWeight="700" fill={isGoodOut ? T.green : T.amber}>
                  {outAngle !== null ? `${fmt(outAngle,1)}°` : 'вектор 0'}
                </text>

                {isRankOne && (
                  <text x={cx} y={H-18} textAnchor="middle" fontSize="11" fill={T.amber}>σ₂ ≈ 0: эллипс стал отрезком</text>
                )}
              </svg>
            </div>
          </div>

          {/* Angle badges */}
          <div style={{ display: 'flex', gap: 10 }}>
            <AngleBadge
              label="Угол на входе"
              value={inAngle !== null ? `${fmt(inAngle,1)}°` : '—'}
              isGood={isGoodIn}
            />
            <AngleBadge
              label="Угол на выходе"
              value={outAngle !== null ? `${fmt(outAngle,1)}°` : 'вектор 0'}
              isGood={isGoodOut}
            />
            <AngleBadge
              label="Угол осей эллипса"
              value={axisAng !== null ? `${fmt(axisAng,1)}°` : '—'}
              isGood={axisAng !== null && Math.abs(axisAng-90) < 1.5}
            />
          </div>

          {/* Dynamic commentary */}
          <div style={{
            background: T.white, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: '14px 17px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7 }}>
              💡 Что сейчас происходит
            </div>
            <p style={{ margin: 0, color: T.text, fontSize: 13.5, lineHeight: 1.75 }}>
              {isRankOne
                ? 'Матрица близка к рангу 1: σ₂ ≈ 0, поэтому вся окружность отображается в отрезок. Второй правый сингулярный вектор v₂ существует, но его образ имеет нулевую длину — он не виден как полуось.'
                : onMagnets
                  ? '✨ Ты нашёл сингулярные направления! Зонды стоят в v₁ и v₂ — их образы Av₁ = σ₁u₁ и Av₂ = σ₂u₂ взаимно перпендикулярны. Это и есть оси эллипса.'
                  : isGoodIn && !isGoodOut
                    ? 'Входной угол 90°, но выходной — нет. Матрица «сломала» ортогональность. Только в сингулярных направлениях v₁ и v₂ она сохраняется — ищи магниты!'
                    : 'Входной угол почти никогда не сохраняется при преобразовании. Потяни красный зонд к фиолетовым или зелёным кружкам на окружности — это магниты, притягивающие к v₁ и v₂.'}
            </p>
          </div>
        </div>

        {/* RIGHT: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Matrix sliders */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Матрица A</div>

            {/* matrix display */}
            <div style={{ display: 'inline-flex', alignItems: 'stretch', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 10px', fontFamily: "'Georgia', serif", fontSize: 14, marginBottom: 14 }}>
              <div style={{ borderLeft: `2px solid ${T.text}`, borderTop: `2px solid ${T.text}`, borderBottom: `2px solid ${T.text}`, width: 7, borderRadius: '3px 0 0 3px' }}/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 14px', padding: '0 10px', color: T.text }}>
                {A.flat().map((v,i) => <span key={i} style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span>)}
              </div>
              <div style={{ borderRight: `2px solid ${T.text}`, borderTop: `2px solid ${T.text}`, borderBottom: `2px solid ${T.text}`, width: 7, borderRadius: '0 3px 3px 0' }}/>
            </div>

            {([['a₁₁',0,0],['a₁₂',0,1],['a₂₁',1,0],['a₂₂',1,1]] as [string,0|1,0|1][]).map(([label,r,c]) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 40px', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontFamily: "'Georgia', serif", color: T.text, textAlign: 'right' }}>{label}</span>
                <input type="range" min={-3} max={3} step={0.05} value={A[r][c]}
                  onChange={e => { setActivePreset(-1); setCell(r,c,Number(e.target.value)); }}
                  style={{ accentColor: T.primary, cursor: 'pointer' }}/>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.primary, textAlign: 'right' }}>{fmt(A[r][c])}</span>
              </div>
            ))}

            {/* lock toggle */}
            <button
              onClick={() => setLocked(v => !v)}
              style={{
                marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
                background: locked ? T.primaryLight : T.surface,
                border: `1.5px solid ${locked ? T.primaryBorder : T.border}`,
                borderRadius: 12, padding: '10px 13px', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 32, height: 18, borderRadius: 9, background: locked ? T.primary : T.border, position: 'relative', flexShrink: 0, marginTop: 1, transition: 'background 0.18s' }}>
                <div style={{ position: 'absolute', top: 2, left: locked ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: T.white, transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
              </div>
              <span style={{ fontSize: 12, color: T.text, lineHeight: 1.55 }}>
                <strong>Держать зонды ортогонально.</strong> Выключи, чтобы свободно двигать синий зонд независимо.
              </span>
            </button>
          </div>

          {/* Magnet info */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '15px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}> Магнитные точки</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div style={{ background: `${T.violet}0d`, border: `1px solid ${T.violet}30`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.violet, marginBottom: 3 }}>v₁</div>
                <div style={{ fontSize: 12, color: T.text }}>θ ≈ {fmt(deg(vecToAngle(svd.v1)),1)}°</div>
                <div style={{ fontSize: 12, color: T.muted }}>σ₁ = {fmt(svd.sigma1)}</div>
              </div>
              <div style={{ background: isRankOne ? T.amberLight : T.greenLight, border: `1px solid ${isRankOne ? '#fcd34d' : '#6ee7b7'}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: isRankOne ? T.amber : T.green, marginBottom: 3 }}>v₂</div>
                <div style={{ fontSize: 12, color: T.text }}>{isRankOne ? 'ось исчезла' : `θ ≈ ${fmt(deg(vecToAngle(svd.v2)),1)}°`}</div>
                <div style={{ fontSize: 12, color: T.muted }}>σ₂ = {fmt(svd.sigma2)}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
              Зонды «притягиваются», когда оказываются ближе 8° к v₁, −v₁, v₂ или −v₂. Знак не важен: ось — направление, не стрелка.
            </div>
          </div>

          {/* Symmetry note */}
          <div style={{
            background: isSymmetric ? T.greenLight : T.surface,
            border: `1px solid ${isSymmetric ? '#6ee7b7' : T.border}`,
            borderRadius: 12, padding: '11px 14px',
            fontSize: 12, color: isSymmetric ? '#065f46' : T.muted, lineHeight: 1.6,
          }}>
            {isSymmetric
              ? '✓ A почти симметрична (a₁₂ ≈ a₂₁): магнитные точки совпадают с собственными векторами A.'
              : '• A несимметрична: собственные векторы A и сингулярные направления v₁, v₂ — разные объекты.'}
          </div>
        </div>
      </div>

      {/* ── Guided exploration ── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}></div>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Что исследовать</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 12 }}>
          {[
            {
              n: '1', color: T.primary,
              q: 'Поставь зонды ортогонально, но не на магниты. Что с углом на выходе?',
              a: 'Он не 90° — матрица «сломала» ортогональность. Это типичное поведение линейных преобразований.',
            },
            {
              n: '2', color: T.green,
              q: 'Подведи красный зонд к фиолетовому кружку на окружности. Что произошло?',
              a: 'Зонды «примагнитились» к v₁ и v₂, и выходной угол стал ровно 90°. Образы Av₁ и Av₂ перпендикулярны.',
            },
            {
              n: '3', color: T.amber,
              q: 'Выбери «Нулевой столбец». Где второй магнит?',
              a: 'σ₂ = 0, поэтому второй магнит есть на входе, но его образ на выходе — нулевой вектор. Эллипс схлопнулся в отрезок.',
            },
            {
              n: '4', color: T.violet,
              q: 'Выбери «Симметричная». Совпадают ли магниты с собственными векторами A?',
              a: 'Да! Для симметричной матрицы сингулярные направления совпадают с собственными. Именно поэтому SVD симметричных матриц особенно прост.',
            },
            {
              n: '5', color: T.cyan,
              q: 'Выбери «Диагональная». Где магниты?',
              a: 'Строго на осях X и Y — для диагональной матрицы никакого поворота не происходит, v₁ = e₁ и v₂ = e₂.',
            },
          ].map(step => (
            <div key={step.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: `${step.color}18`, color: step.color, fontWeight: 900, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.n}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.5 }}>{step.q}</div>
              </div>
              <div style={{ background: `${step.color}0b`, borderRadius: 9, padding: '8px 11px', fontSize: 12.5, color: T.text, lineHeight: 1.6, borderLeft: `3px solid ${step.color}` }}>{step.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Discovery banner ── */}
      <div style={{ marginTop: 22, background: '#0f172a', color: T.white, borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>Открытие</div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: '#e2e8f0' }}>
          Ортогональность на входе почти никогда не сохраняется при линейном преобразовании. Но у каждой матрицы есть ровно два ортогональных направления, которые она «уважает» и переводит снова в ортогональные. Это <strong style={{ color: '#c4b5fd' }}>правые сингулярные векторы v₁ и v₂</strong>. Они являются ортонормированными собственными векторами симметричной матрицы <strong style={{ color: '#86efac' }}>AᵀA</strong>, а их образы <strong style={{ color: '#fbbf24' }}>σ₁u₁</strong> и <strong style={{ color: '#fbbf24' }}>σ₂u₂</strong> — оси эллипса.
        </p>
      </div>
    </div>
  );
}
