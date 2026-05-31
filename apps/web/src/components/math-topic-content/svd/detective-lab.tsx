// @ts-nocheck
import { useMemo, useState } from 'react';

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
type Vec2    = [number, number];
type Matrix2 = [[number, number], [number, number]];

const normV  = ([x,y]: Vec2) => Math.hypot(x,y);
const apply  = (A: Matrix2, [x,y]: Vec2): Vec2 => [A[0][0]*x+A[0][1]*y, A[1][0]*x+A[1][1]*y];
const perp   = ([x,y]: Vec2): Vec2 => [-y,x];
const fmt    = (x: number, d=2) => {
  const v = Math.abs(x)<1e-10?0:x;
  return Number.isInteger(v)?String(v):v.toFixed(d).replace(/\.?0+$/,'');
};
const COS30  = Math.cos(Math.PI/6), SIN30 = Math.sin(Math.PI/6);
const COS1_1 = Math.cos(1.1),       SIN1_1 = Math.sin(1.1);
const SQRT2I = Math.SQRT1_2;

// ellipse path
function ellipsePath(A: Matrix2, cx: number, cy: number, sc: number) {
  const pts: string[] = [];
  for (let i=0;i<=240;i++){
    const t=(i/240)*Math.PI*2;
    const [x,y]=apply(A,[Math.cos(t),Math.sin(t)]);
    pts.push(`${i===0?'M':'L'} ${(cx+x*sc).toFixed(2)} ${(cy-y*sc).toFixed(2)}`);
  }
  return pts.join(' ')+'Z';
}

// ─── Case definitions ─────────────────────────────────────────────────────────
type CaseDef = {
  id: string;
  badge: string;
  title: string;
  hint: string;
  sigma1: number;
  sigma2: number;
  v1: Vec2;
  v2: Vec2;
  u1: Vec2;
  u2?: Vec2;
  matrix: Matrix2;
  verdict: string;
  answer: string;
  catchPhrase: string;
  questionChecklist: { q: string; a: string }[];
};

const CASES: CaseDef[] = [
  {
    id: 'c1', badge: '№1', title: 'Диагональный подозреваемый',
    hint: 'v и u совпадают — никакого поворота. Оба σ ненулевые.',
    sigma1: 5, sigma2: 3,
    v1: [1,0], v2: [0,1], u1: [1,0], u2: [0,1],
    matrix: [[5,0],[0,3]],
    verdict: 'Чистое анизотропное растяжение без поворота',
    answer: 'Диагональная матрица diag(5, 3): по горизонтали растяжение ×5, по вертикали ×3.',
    catchPhrase: 'v₁ = u₁ и v₂ = u₂ → никакого поворота. Матрица просто масштабирует оси.',
    questionChecklist: [
      { q: 'Обратима?', a: 'Да — оба σ ненулевые.' },
      { q: 'Поворот?',  a: 'Нет — v и u совпадают.' },
      { q: 'Симметрична?', a: 'Да — для диагональных U = V.' },
    ],
  },
  {
    id: 'c2', badge: '№2', title: 'Невидимый поворот',
    hint: 'Оба σ = 1. v₁ = (1,0), но u₁ смотрит иначе.',
    sigma1: 1, sigma2: 1,
    v1: [1,0], v2: [0,1],
    u1: [COS30, SIN30], u2: [-SIN30, COS30],
    matrix: [[COS30,-SIN30],[SIN30,COS30]],
    verdict: 'Изотропный масштаб (= чистый поворот / отражение)',
    answer: 'Матрица поворота на 30°. σ₁ = σ₂ = 1 → длины не меняются, только направление.',
    catchPhrase: 'σ₁ = σ₂ = 1 и все точки на расстоянии 1 → матрица ортогональна.',
    questionChecklist: [
      { q: 'Обратима?', a: 'Да — det = σ₁σ₂ = 1.' },
      { q: 'Растяжение?', a: 'Нет — σ₁ = σ₂ = 1.' },
      { q: 'Поворот на сколько?', a: 'На угол между v₁ и u₁: 30°.' },
    ],
  },
  {
    id: 'c3', badge: '№3', title: 'Схлопнувшийся мир',
    hint: 'σ₂ = 0. Второй левый вектор u₂ не определён.',
    sigma1: 5, sigma2: 0,
    v1: [SQRT2I, SQRT2I], v2: [-SQRT2I, SQRT2I],
    u1: [0,1],
    matrix: [[0,0],[SQRT2I*5, SQRT2I*5]],
    verdict: 'Необратима: ранг 1, целое измерение «убито»',
    answer: 'Проекция-растяжение ранга 1: любой вектор отображается на луч u₁ = (0,1) с коэффициентом σ₁·|cos(v₁,x)|.',
    catchPhrase: 'σ₂ = 0 → плоскость схлопнулась в прямую. Пространство «потеряло» одно измерение.',
    questionChecklist: [
      { q: 'Обратима?', a: 'Нет — σ₂ = 0, det = 0.' },
      { q: 'Что убито?', a: 'Направление v₂ — оно отображается в 0.' },
      { q: 'Образ?', a: 'Вся плоскость сжимается в луч вдоль u₁.' },
    ],
  },
  {
    id: 'c4', badge: '№4', title: 'Почти вырожденный',
    hint: 'σ₁ огромный, σ₂ крошечный. κ = 1 000 000.',
    sigma1: 1000, sigma2: 0.001,
    v1: [1,0], v2: [0,1], u1: [1,0], u2: [0,1],
    matrix: [[1000,0],[0,0.001]],
    verdict: 'Обратима, но κ = 10⁶: крайне неустойчива',
    answer: 'diag(1000, 0.001): горизонталь растянута в 10⁶ раз сильнее вертикали. Малый шум вдоль v₂ исчезает, вдоль v₁ — взрывается.',
    catchPhrase: 'κ = σ₁/σ₂ = 10⁶: матрица почти вырождена. Любая погрешность входа в направлении v₁ усиливается в миллион раз.',
    questionChecklist: [
      { q: 'Обратима?', a: 'Формально да, но численно опасна.' },
      { q: 'Что происходит вдоль v₂?', a: 'Вектор сжимается до 0.001 — практически до нуля.' },
      { q: 'Чем опасна?', a: 'Решение системы Ax = b крайне чувствительно к ошибкам в b.' },
    ],
  },
  {
    id: 'c5', badge: '№5', title: 'Обычный подозреваемый',
    hint: 'σ₁ ≠ σ₂, v и u не совпадают и не ортогональны.',
    sigma1: 3, sigma2: 1,
    v1: [1,0], v2: [0,1],
    u1: [Math.cos(0.7), Math.sin(0.7)], u2: [-Math.sin(0.7), Math.cos(0.7)],
    matrix: [[Math.cos(0.7)*3, -Math.sin(0.7)],[Math.sin(0.7)*3, Math.cos(0.7)]],
    verdict: 'Анизотропное растяжение + поворот выхода',
    answer: 'Несимметричная матрица: масштабирование (σ₁=3 по v₁, σ₂=1 по v₂) + поворот выхода на ≈40°.',
    catchPhrase: 'v ≠ u и σ₁ ≠ σ₂ — самый распространённый случай. Именно для таких матриц SVD наиболее полезен.',
    questionChecklist: [
      { q: 'Обратима?', a: 'Да — det = σ₁σ₂ = 3.' },
      { q: 'Симметрична?', a: 'Нет — для симм. матриц U = V.' },
      { q: 'Поворот есть?', a: 'Да — u₁ отличается от v₁.' },
    ],
  },
  {
    id: 'c6', badge: '№6 ⚠', title: 'Ловушка',
    hint: 'σ₁ = σ₂ = 4. κ = 1. Но v и u разные!',
    sigma1: 4, sigma2: 4,
    v1: [1,0], v2: [0,1],
    u1: [COS1_1, SIN1_1], u2: [-SIN1_1, COS1_1],
    matrix: [[COS1_1*4, -SIN1_1*4],[SIN1_1*4, COS1_1*4]],
    verdict: 'Изотропный масштаб = 4 × ортогональная матрица',
    answer: 'A = 4·Q, где Q — поворот на ≈63°. Равные σ означают, что любой круг остаётся кругом — только растягивается и поворачивается.',
    catchPhrase: 'σ₁ = σ₂ ≠ 1 и κ = 1 — не значит «поворот»! Это масштаб × поворот. Ловушка: многие думают, что изотропность = поворот.',
    questionChecklist: [
      { q: 'Ортогональна?', a: 'Нет — det = 16 ≠ 1. Ортогональна только Q = A/4.' },
      { q: 'Число обусловл.?', a: 'κ = 1 — идеально устойчива.' },
      { q: 'Как отличить от поворота?', a: 'σ = 4 ≠ 1: поворот масштабирует всё в 4 раза.' },
    ],
  },
];

// ─── Hypothesis checkboxes ────────────────────────────────────────────────────
type HypKey = 'invertible'|'rotation'|'projection'|'symmetric'|'illCond';
const HYP_OPTIONS: { key: HypKey; label: string }[] = [
  { key: 'invertible',  label: 'Матрица обратима' },
  { key: 'rotation',    label: 'Содержит поворот (v ≠ u)' },
  { key: 'projection',  label: 'Это проекция (σ₂ = 0)' },
  { key: 'symmetric',   label: 'Симметричная (U = V)' },
  { key: 'illCond',     label: 'Плохо обусловлена (κ ≫ 1)' },
];

function correctHyp(c: CaseDef): Record<HypKey,boolean> {
  const kappa = c.sigma2 === 0 ? Infinity : c.sigma1 / c.sigma2;
  const [u10,u11]=[c.u1[0],c.u1[1]], [v10,v11]=[c.v1[0],c.v1[1]];
  return {
    invertible:  c.sigma2 > 1e-9,
    rotation:    !(Math.abs(u10-v10)<0.02 && Math.abs(u11-v11)<0.02),
    projection:  c.sigma2 < 1e-9,
    symmetric:   Math.abs(u10-v10)<0.05 && Math.abs(u11-v11)<0.05,
    illCond:     isFinite(kappa) ? kappa > 50 : true,
  };
}

// ─── Arrow helper ─────────────────────────────────────────────────────────────
function SVGArrow({ from, to, color, label, labelOffset=[8,-8] }: { from:[number,number]; to:[number,number]; color:string; label?:string; labelOffset?:[number,number] }) {
  const dx=to[0]-from[0], dy=to[1]-from[1];
  const len=Math.hypot(dx,dy); if(len<2) return null;
  const ux=dx/len,uy=dy/len,px=-uy,py=ux;
  const tip=to, b1=[to[0]-ux*10+px*5,to[1]-uy*10+py*5], b2=[to[0]-ux*10-px*5,to[1]-uy*10-py*5];
  return <g>
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <polygon points={`${tip[0]},${tip[1]} ${b1[0]},${b1[1]} ${b2[0]},${b2[1]}`} fill={color}/>
    {label && <text x={to[0]+labelOffset[0]} y={to[1]+labelOffset[1]} fontSize="12" fontWeight="800" fill={color}>{label}</text>}
  </g>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SVDDetectiveLab() {
  const [caseIdx, setCaseIdx]   = useState(0);
  const [angle,   setAngle]     = useState(0.4);
  const [revealed, setRevealed] = useState(false);
  const [hyp, setHyp]           = useState<Record<HypKey,boolean>>({ invertible:false, rotation:false, projection:false, symmetric:false, illCond:false });
  const [checked, setChecked]   = useState(false);

  const c = CASES[caseIdx];
  const correct = useMemo(() => correctHyp(c), [c]);
  const kappa = c.sigma2 === 0 ? Infinity : c.sigma1/c.sigma2;

  const test: Vec2 = [Math.cos(angle), Math.sin(angle)];
  const out  = apply(c.matrix, test);
  const stretch = normV(out) / Math.max(1e-9, normV(test));

  function switchCase(i: number) {
    setCaseIdx(i);
    setRevealed(false);
    setChecked(false);
    setHyp({ invertible:false, rotation:false, projection:false, symmetric:false, illCond:false });
    setAngle(0.4);
  }

  function toggleHyp(k: HypKey) {
    if (checked) return;
    setHyp(h => ({ ...h, [k]: !h[k] }));
  }

  // canvas dims
  const W=480, H=320, cx=W/2, cy=H/2;
  const inSc=90, outSc=Math.max(38, 130/Math.max(c.sigma1,0.5));

  // verdicts
  const autoVerdict = useMemo(() => {
    if (c.sigma2 < 1e-9) return { text: 'Необратима — целое измерение уничтожено', color: T.red };
    if (kappa > 1e4)      return { text: `Обратима, но крайне неустойчива (κ = ${fmt(kappa,0)})`, color: T.amber };
    if (Math.abs(c.sigma1-c.sigma2) < 1e-9) return { text: 'Изотропна: поворот и/или равномерный масштаб', color: T.cyan };
    return { text: 'Анизотропное растяжение + возможный поворот', color: T.primary };
  }, [c, kappa]);

  return (
    <div style={{ padding:'0 0 48px', fontFamily:"'Inter',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:T.primaryLight, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke={T.mutedLight} strokeWidth="1.4"/>
              <circle cx="8" cy="8" r="6" stroke={T.primary} strokeWidth="1.6" strokeDasharray="3 3"/>
              <circle cx="8" cy="8" r="2.5" fill={T.amber}/>
            </svg>
          </div>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.15em', color:T.primary, textTransform:'uppercase' }}>Лаборатория · Детектив</span>
        </div>
        <h2 style={{ margin:'0 0 6px', fontSize:26, fontWeight:800, color:T.text, lineHeight:1.2 }}>
          Что SVD говорит о матрице
        </h2>
        <p style={{ margin:0, color:T.muted, fontSize:15, lineHeight:1.65 }}>
          <strong style={{ color:T.text }}>Исследовательский вопрос:</strong> Вам дали матрицу, но вы не знаете, что она делает. Можно ли «прочитать» её свойства только по SVD — не глядя на саму матрицу?
        </p>
      </div>

      {/* ── Rules ── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:'13px 18px', marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>Правила игры</div>
        <p style={{ margin:0, color:T.text, fontSize:13, lineHeight:1.8 }}>
          Матрица скрыта — виден только её SVD-«след»: сингулярные числа, направления v₁, v₂ и u₁, u₂, число обусловленности. Двигай тестовый вектор и наблюдай за коэффициентом растяжения. Построй гипотезу — и нажми «Проверить». Матрица откроется только после этого.
        </p>
      </div>

      {/* ── Case selector ── */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:22 }}>
        {CASES.map((cas,i) => (
          <button key={cas.id} onClick={() => switchCase(i)} style={{
            padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
            background: i===caseIdx ? T.primary : T.white,
            color:      i===caseIdx ? T.white   : T.muted,
            border:`1.5px solid ${i===caseIdx ? T.primary : T.border}`,
            transition:'all 0.15s',
          }}>{cas.badge} {cas.title}</button>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 310px', gap:16, alignItems:'start' }}>

        {/* LEFT: clues + experiment */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Case hint */}
          <div style={{ background:`${T.amber}0d`, border:`1px solid ${T.amber}35`, borderRadius:12, padding:'11px 15px', display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:18 }}></span>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:T.amber, marginBottom:3 }}>Зацепки</div>
              <div style={{ fontSize:13, color:T.text, lineHeight:1.65 }}>{c.hint}</div>
            </div>
          </div>

          {/* Two SVG panels */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

            {/* Input: v1, v2 on unit circle */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>Правые векторы v₁, v₂</div>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%"
                style={{ borderRadius:16, border:`1px solid ${T.border}`, background:T.white, display:'block' }}>
                {[-2,-1,0,1,2].map(g=>(
                  <g key={g}>
                    <line x1={cx+g*inSc} y1={20} x2={cx+g*inSc} y2={H-20} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.7}/>
                    <line x1={20} y1={cy-g*inSc} x2={W-20} y2={cy-g*inSc} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.7}/>
                  </g>
                ))}
                <circle cx={cx} cy={cy} r={inSc} fill={`${T.primary}07`} stroke={T.mutedLight} strokeWidth="1.6" strokeDasharray="4 3"/>

                {/* v1 */}
                <SVGArrow from={[cx,cy]} to={[cx+c.v1[0]*inSc, cy-c.v1[1]*inSc]} color={T.violet} label="v₁"/>
                {/* v2 */}
                <SVGArrow from={[cx,cy]} to={[cx+c.v2[0]*inSc, cy-c.v2[1]*inSc]} color={T.green} label="v₂"/>

                {/* test vector */}
                <SVGArrow from={[cx,cy]} to={[cx+test[0]*inSc, cy-test[1]*inSc]} color={T.amber} label="x"/>
                <circle cx={cx+test[0]*inSc} cy={cy-test[1]*inSc} r={7} fill={T.amber} stroke={T.white} strokeWidth="2"/>

                <text x={cx} y={H-10} textAnchor="middle" fontSize="11" fill={T.mutedLight}>тяни вектор x ниже</text>
              </svg>
            </div>

            {/* Output: ellipse + u1, u2 */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>Выход: эллипс и u₁, u₂</div>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%"
                style={{ borderRadius:16, border:`1px solid ${T.border}`, background:T.white, display:'block' }}>
                {[-3,-2,-1,0,1,2,3].map(g=>(
                  <g key={g}>
                    <line x1={cx+g*outSc} y1={10} x2={cx+g*outSc} y2={H-10} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.7}/>
                    <line x1={10} y1={cy-g*outSc} x2={W-10} y2={cy-g*outSc} stroke={g===0?'#cbd5e1':T.border} strokeWidth={g===0?1.5:0.7}/>
                  </g>
                ))}

                {/* ellipse */}
                <path d={ellipsePath(c.matrix, cx, cy, outSc)} fill={`${T.primary}0d`} stroke={T.primary} strokeWidth="2"/>

                {/* u1 axis */}
                <SVGArrow from={[cx,cy]} to={[cx+c.u1[0]*c.sigma1*outSc, cy-c.u1[1]*c.sigma1*outSc]} color={T.violet} label="σ₁u₁" labelOffset={[8,-6]}/>
                {/* u2 axis (hidden if sigma2=0) */}
                {c.u2 && c.sigma2 > 1e-9 && (
                  <SVGArrow from={[cx,cy]} to={[cx+c.u2[0]*c.sigma2*outSc, cy-c.u2[1]*c.sigma2*outSc]} color={T.green} label="σ₂u₂" labelOffset={[8,-6]}/>
                )}
                {c.sigma2 < 1e-9 && (
                  <text x={cx+10} y={cy-10} fontSize="11" fontWeight="700" fill={T.red}>u₂ не определён — σ₂=0</text>
                )}

                {/* image of test vector */}
                {normV(out) > 0.01 && (
                  <SVGArrow from={[cx,cy]} to={[cx+out[0]*outSc, cy-out[1]*outSc]} color={T.amber} label="Ax" labelOffset={[6,-8]}/>
                )}
                {normV(out) <= 0.01 && (
                  <text x={cx+8} y={cy-8} fontSize="12" fontWeight="700" fill={T.red}>Ax = 0</text>
                )}
              </svg>
            </div>
          </div>

          {/* Test vector slider */}
          <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em' }}>Тестовый вектор</div>
              <div style={{ display:'flex', gap:10, fontSize:13 }}>
                <span style={{ color:T.muted }}>x = ({fmt(test[0])}, {fmt(test[1])})</span>
                <span style={{ color:T.amber, fontWeight:700 }}>→</span>
                <span style={{ color:T.primary, fontWeight:700 }}>Ax = ({fmt(out[0])}, {fmt(out[1])})</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'54px 1fr 50px', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, color:T.text }}>Угол θ</span>
              <input type="range" min={0} max={Math.PI*2} step={0.01} value={angle}
                onChange={e => setAngle(Number(e.target.value))}
                style={{ accentColor:T.amber, cursor:'pointer' }}/>
              <span style={{ fontSize:12, fontFamily:'monospace', color:T.amber, textAlign:'right' }}>{fmt((angle*180/Math.PI)%360,0)}°</span>
            </div>
            <div style={{ marginTop:12, display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'9px 14px', display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:T.muted }}>Коэффициент растяжения ‖Ax‖/‖x‖</span>
                <span style={{ fontSize:17, fontWeight:900, color:T.amber, fontVariantNumeric:'tabular-nums' }}>{fmt(stretch)}</span>
              </div>
              <div style={{ fontSize:12, color:T.muted, lineHeight:1.5, maxWidth:180 }}>
                Должен лежать в [{fmt(c.sigma2)}, {fmt(c.sigma1)}]
              </div>
            </div>
          </div>

          {/* Auto-verdict chip */}
          <div style={{ background:`${autoVerdict.color}0d`, border:`1px solid ${autoVerdict.color}35`, borderRadius:12, padding:'11px 15px', display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:autoVerdict.color, flexShrink:0 }}/>
            <div style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>
              <strong>Автоматический вердикт по SVD:</strong> {autoVerdict.text}
            </div>
          </div>
        </div>

        {/* RIGHT: clue sheet + hypothesis */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* SVD clue sheet */}
          <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:16, padding:'15px 18px' }}>
            <div style={{ fontSize:11, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>🔍 SVD-улики (матрица скрыта)</div>
            {[
              { label:'σ₁', val:fmt(c.sigma1), color:T.violet },
              { label:'σ₂', val:fmt(c.sigma2), color:T.green },
              { label:'κ = σ₁/σ₂', val:isFinite(kappa)?fmt(kappa,1):'∞', color:kappa>100?T.red:T.text },
              { label:'det A = σ₁σ₂', val:fmt(c.sigma1*c.sigma2,2), color:T.amber },
              { label:'v₁', val:`(${fmt(c.v1[0])}, ${fmt(c.v1[1])})`, color:T.violet },
              { label:'v₂', val:`(${fmt(c.v2[0])}, ${fmt(c.v2[1])})`, color:T.green },
              { label:'u₁', val:`(${fmt(c.u1[0])}, ${fmt(c.u1[1])})`, color:T.violet },
              { label:'u₂', val: c.u2 ? `(${fmt(c.u2[0])}, ${fmt(c.u2[1])})` : 'не определён', color: c.u2 ? T.green : T.red },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 8px', borderRadius:8, marginBottom:4, background:T.surface }}>
                <span style={{ fontSize:12, fontFamily:"'Georgia',serif", color:T.muted }}>{row.label}</span>
                <span style={{ fontSize:13, fontWeight:800, color:row.color, fontVariantNumeric:'tabular-nums' }}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* Hypothesis builder */}
          <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:16, padding:'15px 18px' }}>
            <div style={{ fontSize:11, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Твоя гипотеза</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {HYP_OPTIONS.map(opt => {
                const chosen = hyp[opt.key];
                const isCorrect = checked ? (chosen === correct[opt.key]) : null;
                return (
                  <button key={opt.key} onClick={() => toggleHyp(opt.key)} style={{
                    display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px',
                    borderRadius:10, cursor: checked?'default':'pointer', textAlign:'left',
                    background: isCorrect===null ? (chosen ? T.primaryLight : T.surface)
                              : isCorrect ? T.greenLight : T.redLight,
                    border: `1.5px solid ${isCorrect===null ? (chosen ? T.primaryBorder : T.border)
                              : isCorrect ? '#6ee7b7' : '#fca5a5'}`,
                    transition:'all 0.15s',
                  }}>
                    {/* checkbox */}
                    <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                      background: chosen ? (isCorrect===false ? T.red : T.primary) : T.border,
                      border:`1.5px solid ${chosen ? (isCorrect===false ? T.red : T.primary) : T.border}`,
                    }}>
                      {chosen && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 3L9 1" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                    </div>
                    <span style={{ fontSize:12.5, color:T.text, flex:1 }}>{opt.label}</span>
                    {checked && isCorrect===true  && <span style={{ fontSize:11, color:T.green,  fontWeight:800 }}>✓</span>}
                    {checked && isCorrect===false && <span style={{ fontSize:11, color:T.red,    fontWeight:800 }}>✗</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              {!checked ? (
                <button onClick={() => setChecked(true)} style={{ flex:1, padding:'10px 0', borderRadius:10, fontSize:13, fontWeight:800, background:T.primary, color:T.white, border:'none', cursor:'pointer' }}>
                  Проверить гипотезу
                </button>
              ) : (
                <button onClick={() => setRevealed(v=>!v)} style={{ flex:1, padding:'10px 0', borderRadius:10, fontSize:13, fontWeight:800, background: revealed ? T.surface : '#0f172a', color: revealed ? T.text : T.white, border:`1px solid ${T.border}`, cursor:'pointer' }}>
                  {revealed ? 'Скрыть матрицу' : ' Раскрыть матрицу'}
                </button>
              )}
            </div>
          </div>

          {/* Checklist (always visible after checked) */}
          {checked && (
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Вопросы детектива</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {c.questionChecklist.map(({q,a}) => (
                  <div key={q} style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:9, padding:'9px 12px' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:3 }}>{q}</div>
                    <div style={{ fontSize:12, color:T.green, lineHeight:1.5 }}>{a}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revealed matrix */}
          {revealed && (
            <div style={{ background:'#0f172a', borderRadius:14, padding:'15px 18px' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#c4b5fd', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Раскрытие</div>
              <div style={{ fontFamily:"monospace", fontSize:13, color:'#e2e8f0', marginBottom:10 }}>
                A = [[{fmt(c.matrix[0][0],3)}, {fmt(c.matrix[0][1],3)}],<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;[{fmt(c.matrix[1][0],3)}, {fmt(c.matrix[1][1],3)}]]
              </div>
              <div style={{ fontSize:13, color:'#e2e8f0', lineHeight:1.7, marginBottom:8 }}>{c.answer}</div>
              <div style={{ background:`${T.amber}20`, border:`1px solid ${T.amber}40`, borderRadius:8, padding:'9px 12px', fontSize:12, color:T.amberLight, lineHeight:1.6 }}>
                 {c.catchPhrase}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Guided exploration ── */}
      <div style={{ marginTop:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:T.amberLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🔬</div>
          <span style={{ fontSize:13, fontWeight:800, color:T.text }}>Что исследовать</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(270px, 1fr))', gap:12 }}>
          {[
            { n:'1', color:T.violet, cas:'№1', q:'Как по SVD понять, что матрица диагональная?', a:'v₁ = u₁ и v₂ = u₂: никакого поворота. Только σ показывают масштаб по каждой оси.' },
            { n:'2', color:T.cyan,   cas:'№2', q:'Как определить поворот без доступа к матрице?', a:'σ₁ = σ₂ = 1 → длины не меняются. Угол между v₁ и u₁ — угол поворота.' },
            { n:'3', color:T.red,    cas:'№3', q:'Что значит «убитое» направление?', a:'σ₂ = 0: вектор в направлении v₂ отображается в ноль. u₂ не существует — выходной эллипс стал отрезком.' },
            { n:'4', color:T.amber,  cas:'№4', q:'Когда матрица «почти вырождена» при σ₂ > 0?', a:'Когда κ = σ₁/σ₂ ≫ 1. Формально обратима, но малая погрешность входа вдоль v₁ превращается в огромную на выходе.' },
            { n:'5', color:T.green,  cas:'№6', q:'Почему «ловушка» обманывает?', a:'σ₁ = σ₂ = 4, κ = 1 выглядит как поворот. Но σ = 4 ≠ 1: это масштаб ×4 плюс поворот, а не чистое вращение.' },
          ].map(step => (
            <div key={step.n} style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px 16px' }}>
              <div style={{ display:'flex', gap:10, marginBottom:8 }}>
                <div style={{ width:24, height:24, borderRadius:6, background:`${step.color}18`, color:step.color, fontWeight:900, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{step.n}</div>
                <div>
                  <div style={{ fontSize:10, fontWeight:800, color:step.color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:2 }}>Дело {step.cas}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text, lineHeight:1.5 }}>{step.q}</div>
                </div>
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
          Всё, что нужно знать о характере матрицы, закодировано в её SVD.{' '}
          <strong style={{ color:'#c4b5fd' }}>Сингулярные числа</strong> говорят о масштабе и обратимости.{' '}
          <strong style={{ color:'#fbbf24' }}>Отношение σ₁/σ₂</strong> — о чувствительности к направлению входа.{' '}
          <strong style={{ color:'#86efac' }}>Взаимное расположение vᵢ и uᵢ</strong> — о наличии поворота и симметрии. Глядя только на SVD, можно точно описать, что матрица делает с пространством, даже не видя её элементов.
        </p>
      </div>
    </div>
  );
}
