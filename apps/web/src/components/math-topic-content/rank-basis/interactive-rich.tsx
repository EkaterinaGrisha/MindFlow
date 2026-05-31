// @ts-nocheck
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Palette ──────────────────────────────────────────────────────────────────
const T = {
  text: '#1e293b', muted: '#64748b', mutedLight: '#94a3b8',
  primary: '#6366f1', primaryLight: '#eef2ff', primaryBorder: '#c7d2fe', primaryDark: '#4f46e5',
  accent: '#7c3aed', green: '#10b981', greenLight: '#d1fae5',
  amber: '#f59e0b', amberLight: '#fef3c7', red: '#ef4444', redLight: '#fee2e2',
  white: '#ffffff', surface: '#f8fafc', border: '#e2e8f0',
  cyan: '#06b6d4', violet: '#8b5cf6', pink: '#ec4899',
};

// ── Math Utilities ────────────────────────────────────────────────────────────
const dot   = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const vNorm = v => Math.sqrt(dot(v, v));
const norm  = v => { const n = vNorm(v); return n < 1e-10 ? v : v.map(x => x / n); };
const mVec  = (M, v) => M.map(row => dot(row, v));
const trans = A => A[0].map((_, j) => A.map(r => r[j]));
const mMul  = (A, B) => { const BT = trans(B); return A.map(row => BT.map(col => dot(row, col))); };
const outer = (u, v) => u.map(x => v.map(y => x * y));

function det3([[a,b,c],[d,e,f],[g,h,i]]) {
  return a*(e*i - f*h) - b*(d*i - f*g) + c*(d*h - e*g);
}

function computeRank(A, eps = 1e-8) {
  const M = A.map(r => r.map(x => +x || 0));
  const m = M.length, n = M[0].length;
  let rank = 0, pr = 0;
  for (let col = 0; col < n && pr < m; col++) {
    let mx = pr;
    for (let r = pr + 1; r < m; r++) if (Math.abs(M[r][col]) > Math.abs(M[mx][col])) mx = r;
    if (Math.abs(M[mx][col]) < eps) continue;
    [M[pr], M[mx]] = [M[mx], M[pr]];
    for (let r = 0; r < m; r++) if (r !== pr) {
      const f = M[r][col] / M[pr][col];
      M[r] = M[r].map((x, j) => x - f * M[pr][j]);
    }
    rank++; pr++;
  }
  return rank;
}

function gaussSteps(inputA, eps = 1e-8) {
  const M = inputA.map(r => r.map(x => +x || 0));
  const m = M.length, n = M[0].length;
  const steps = [{ mat: M.map(r => [...r]), op: 'Исходная матрица', pR: -1, pC: -1 }];
  let rank = 0, pr = 0;
  for (let col = 0; col < n && pr < m; col++) {
    let mx = pr;
    for (let r = pr + 1; r < m; r++) if (Math.abs(M[r][col]) > Math.abs(M[mx][col])) mx = r;
    if (Math.abs(M[mx][col]) < eps) continue;
    if (mx !== pr) {
      [M[pr], M[mx]] = [M[mx], M[pr]];
      steps.push({ mat: M.map(r => [...r]), op: `R${pr+1} ↔ R${mx+1}`, pR: pr, pC: col });
    }
    for (let r = 0; r < m; r++) {
      if (r !== pr && Math.abs(M[r][col]) > eps) {
        const f = +(M[r][col] / M[pr][col]).toFixed(4);
        M[r] = M[r].map((x, j) => x - f * M[pr][j]);
        steps.push({ mat: M.map(r => [...r]), op: `R${r+1} ← R${r+1} − ${f}·R${pr+1}`, pR: pr, pC: col });
      }
    }
    rank++; pr++;
  }
  return { steps, rank };
}

// Truncated SVD via power iteration + deflation (deterministic seed)
function truncatedSVD(A, k) {
  const AT = trans(A);
  let C = mMul(AT, A);
  const result = [];
  for (let i = 0; i < k; i++) {
    let v = norm(Array.from({ length: C.length }, (_, j) => Math.sin(i * 17.3 + j * 7.1 + 1)));
    for (let t = 0; t < 300; t++) v = norm(mVec(C, v));
    const lam = Math.max(0, dot(v, mVec(C, v)));
    const sig = Math.sqrt(lam);
    const Av = mVec(A, v);
    const u = sig > 1e-10 ? Av.map(x => x / sig) : norm(Array.from({ length: A.length }, (_, j) => Math.sin(i*31.7+j*11.3)));
    result.push({ sig, u, v });
    const oo = outer(v, v);
    C = C.map((row, r) => row.map((x, c) => x - lam * oo[r][c]));
  }
  return result;
}

function reconstructSVD(svd, k, m, n) {
  const R = Array.from({ length: m }, () => Array(n).fill(0));
  for (let i = 0; i < Math.min(k, svd.length); i++) {
    const { sig, u, v } = svd[i];
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) R[r][c] += sig * u[r] * v[c];
  }
  return R;
}

// Deterministic LCG pseudo-random samples in [-1, 1]
function lcgSamples(seed, count) {
  const s = []; let st = seed >>> 0;
  for (let i = 0; i < count; i++) {
    st = (Math.imul(1664525, st) + 1013904223) >>> 0;
    s.push((st / 0x100000000) * 2 - 1);
  }
  return s;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function LabSection({ id, color = T.primary, title, badge, desc, insight, children }) {
  return (
    <section id={id} style={{ marginBottom: 40, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', background: T.white }}>
      <div style={{ borderLeft: `4px solid ${color}`, padding: '16px 20px', background: T.surface }}>
        {badge && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color, textTransform: 'uppercase', marginBottom: 4 }}>{badge}</div>}
        <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>{title}</div>
        {desc && <div style={{ fontSize: 13, color: T.muted, marginTop: 3, lineHeight: 1.6 }}>{desc}</div>}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
      {insight && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 20px', background: `${color}08`, fontSize: 13, color: T.text, lineHeight: 1.65 }}>
          <span style={{ fontWeight: 700, color }}>💡 Ключевая идея: </span>{insight}
        </div>
      )}
    </section>
  );
}

function RankBadge({ rank, maxRank = 3 }) {
  const color = rank === maxRank ? T.green : rank === 0 ? T.red : T.amber;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: `${color}15`, border: `1px solid ${color}40` }}>
      <span style={{ fontWeight: 900, fontSize: 18, color }}>{rank}</span>
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>/ {maxRank}</span>
    </div>
  );
}

// ── 1. Span Visualizer ────────────────────────────────────────────────────────
export function SpanVisualizer2D() {
  const W = 280, H = 280, SC = 24, OX = 140, OY = 140;
  const [v1, setV1] = useState([3, 1]);
  const [v2, setV2] = useState([1, 3]);
  const [drag, setDrag] = useState(null);
  const svgRef = useRef(null);

  const toSVG = ([x, y]) => [OX + x * SC, OY - y * SC];
  const toMath = ([px, py]) => [(px - OX) / SC, -(py - OY) / SC];
  const snapClamp = x => Math.round(Math.max(-5, Math.min(5, x)) * 2) / 2;

  const cross2D = v1[0] * v2[1] - v1[1] * v2[0];
  const spanDim = Math.abs(cross2D) > 0.05 ? 2 : (vNorm(v1) > 0.05 || vNorm(v2) > 0.05 ? 1 : 0);
  const spanColor = spanDim === 2 ? T.primary : spanDim === 1 ? T.amber : T.red;

  const getCoords = e => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handleMove = useCallback(e => {
    if (!drag) return;
    const [px, py] = getCoords(e);
    const pt = [snapClamp(toMath([px, py])[0]), snapClamp(toMath([px, py])[1])];
    drag === 1 ? setV1(pt) : setV2(pt);
  }, [drag]);

  const handleUp = useCallback(() => setDrag(null), []);

  const [x1, y1] = toSVG(v1);
  const [x2, y2] = toSVG(v2);

  const arrow = (ax, ay, color) => {
    const len = Math.sqrt((ax - OX) ** 2 + (ay - OY) ** 2);
    if (len < 4) return null;
    const ux = (ax - OX) / len, uy = (ay - OY) / len;
    const sz = 10;
    const bx = ax - ux * sz, by = ay - uy * sz;
    const px = -uy * sz * 0.4, py = ux * sz * 0.4;
    return <polygon points={`${ax},${ay} ${bx+px},${by+py} ${bx-px},${by-py}`} fill={color} />;
  };

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <svg ref={svgRef} width={W} height={H}
        style={{ borderRadius: 14, border: `1px solid ${T.border}`, cursor: drag ? 'grabbing' : 'default', flexShrink: 0 }}
        onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleUp}
      >
        {/* Span fill */}
        {spanDim === 2 && <rect x={0} y={0} width={W} height={H} fill={`${T.primary}18`} />}
        {spanDim === 1 && (() => {
          const dir = vNorm(v1) >= vNorm(v2) ? norm(v1) : norm(v2);
          const [lx1, ly1] = toSVG(dir.map(x => -x * 8));
          const [lx2, ly2] = toSVG(dir.map(x => x * 8));
          return <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={`${T.amber}55`} strokeWidth={14} strokeLinecap="round" />;
        })()}
        {/* Grid */}
        {[-4,-3,-2,-1,0,1,2,3,4].map(g => (
          <g key={g}>
            <line x1={toSVG([g,-5])[0]} y1={toSVG([g,-5])[1]} x2={toSVG([g,5])[0]} y2={toSVG([g,5])[1]}
              stroke={g === 0 ? T.muted : T.border} strokeWidth={g === 0 ? 1.5 : 0.5} />
            <line x1={toSVG([-5,g])[0]} y1={toSVG([-5,g])[1]} x2={toSVG([5,g])[0]} y2={toSVG([5,g])[1]}
              stroke={g === 0 ? T.muted : T.border} strokeWidth={g === 0 ? 1.5 : 0.5} />
          </g>
        ))}
        {/* v1 */}
        <line x1={OX} y1={OY} x2={x1} y2={y1} stroke={T.primary} strokeWidth={2.5} />
        {arrow(x1, y1, T.primary)}
        <circle cx={x1} cy={y1} r={9} fill={T.primary} style={{ cursor: 'grab' }}
          onMouseDown={e => { e.preventDefault(); setDrag(1); }} />
        <text x={x1 + 10} y={y1 - 6} fill={T.primary} fontSize={11} fontWeight={700} fontFamily="monospace">
          v₁({v1[0]},{v1[1]})
        </text>
        {/* v2 */}
        <line x1={OX} y1={OY} x2={x2} y2={y2} stroke={T.accent} strokeWidth={2.5} />
        {arrow(x2, y2, T.accent)}
        <circle cx={x2} cy={y2} r={9} fill={T.accent} style={{ cursor: 'grab' }}
          onMouseDown={e => { e.preventDefault(); setDrag(2); }} />
        <text x={x2 + 10} y={y2 - 6} fill={T.accent} fontSize={11} fontWeight={700} fontFamily="monospace">
          v₂({v2[0]},{v2[1]})
        </text>
        <circle cx={OX} cy={OY} r={4} fill={T.text} />
      </svg>

      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ marginBottom: 12, padding: '14px', borderRadius: 12, background: `${spanColor}10`, border: `1px solid ${spanColor}30` }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: spanColor, marginBottom: 4 }}>{spanDim}D</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: spanColor }}>
            {spanDim === 2 ? 'span(v₁,v₂) = ℝ²' : spanDim === 1 ? 'span(v₁,v₂) = прямая' : 'span = {0}'}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            v₁×v₂ = {cross2D.toFixed(2)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>
          <div style={{ marginBottom: 6, fontWeight: 600, color: T.text }}>Попробуй:</div>
          <div>→ Тяни векторы к одной прямой — оболочка схлопнется в линию</div>
          <div>→ Разведи их — оболочка заполнит всю плоскость</div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Gauss Rank Simulator ───────────────────────────────────────────────────
export function GaussRankSimulator() {
  const [mat, setMat] = useState([['1','2','3'],['4','5','6'],['7','8','9']]);
  const [result, setResult] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);

  const parsed = mat.map(r => r.map(x => +x || 0));
  const liveRank = computeRank(parsed);
  const rankColor = liveRank === 3 ? T.green : liveRank === 2 ? T.amber : T.red;

  function runGauss() {
    const r = gaussSteps(parsed);
    setResult(r);
    setStepIdx(0);
  }

  const fmt = x => { const v = +x.toFixed(2); return Math.abs(v) < 0.005 ? '0' : String(v); };
  const isZeroRow = row => row.every(x => Math.abs(+x) < 0.005);

  const displayMat = result ? result.steps[stepIdx]?.mat : parsed;
  const step = result?.steps[stepIdx];

  const PRESETS = [
    { label: 'Ранг 3', mat: [['1','0','0'],['0','2','0'],['0','0','3']] },
    { label: 'Ранг 2', mat: [['1','2','3'],['4','5','6'],['7','8','9']] },
    { label: 'Ранг 1', mat: [['1','2','3'],['2','4','6'],['3','6','9']] },
    { label: 'Ранг 0', mat: [['0','0','0'],['0','0','0'],['0','0','0']] },
  ];

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: '0 0 auto' }}>
        {/* Matrix inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,64px)', gap: 6, marginBottom: 12 }}>
          {mat.map((row, r) => row.map((val, c) => (
            <input key={`${r}-${c}`} type="number" value={val}
              onChange={e => {
                const nm = mat.map(rr => [...rr]); nm[r][c] = e.target.value;
                setMat(nm); setResult(null);
              }}
              style={{ width: '100%', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace',
                border: `1.5px solid ${T.border}`, borderRadius: 8, padding: '7px 4px', fontSize: 14, color: T.text,
                background: T.white, outline: 'none' }}
            />
          )))}
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { setMat(p.mat); setResult(null); }}
              style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Live rank */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <RankBadge rank={liveRank} maxRank={3} />
          <span style={{ fontSize: 12, color: T.muted }}>ранг матрицы</span>
        </div>

        <button onClick={runGauss}
          style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: T.primary,
            color: T.white, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Метод Гаусса →
        </button>
      </div>

      {/* Step display */}
      {result && (
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: T.surface, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Шаг {stepIdx + 1} / {result.steps.length}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{step?.op}</div>
            </div>
            <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
              {displayMat.map((row, r) => row.map((val, c) => (
                <div key={`${r}-${c}`} style={{
                  textAlign: 'center', padding: '7px 4px', borderRadius: 6,
                  fontWeight: 700, fontSize: 13, fontFamily: 'monospace',
                  background: isZeroRow(row) ? '#f1f5f9' : step?.pR === r ? `${T.primary}15` : T.white,
                  color: isZeroRow(row) ? T.mutedLight : T.text,
                  border: `1px solid ${T.border}`,
                }}>
                  {fmt(val)}
                </div>
              )))}
            </div>
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 6 }}>
              <button onClick={() => setStepIdx(Math.max(0, stepIdx - 1))} disabled={stepIdx === 0}
                style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.white,
                  cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: stepIdx === 0 ? 0.4 : 1 }}>← Назад</button>
              <button onClick={() => setStepIdx(Math.min(result.steps.length - 1, stepIdx + 1))} disabled={stepIdx === result.steps.length - 1}
                style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.white,
                  cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: stepIdx === result.steps.length - 1 ? 0.4 : 1 }}>Вперёд →</button>
              <button onClick={() => setResult(null)}
                style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.white,
                  cursor: 'pointer', fontSize: 12, color: T.muted }}>Сброс</button>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: `${rankColor}10`, border: `1px solid ${rankColor}30`, fontSize: 13, fontWeight: 700, color: rankColor }}>
            Итог: rank = {result.rank}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3. Basis Checker ──────────────────────────────────────────────────────────
export function BasisChecker3D() {
  const [vecs, setVecs] = useState([
    ['1','0','0'],
    ['0','1','0'],
    ['0','0','1'],
  ]);

  const parsed = vecs.map(v => v.map(x => +x || 0));
  const d = det3(parsed);
  const isBasis = Math.abs(d) > 0.001;
  const color = isBasis ? T.green : T.red;

  const update = (vi, ci, val) => {
    const nv = vecs.map(v => [...v]);
    nv[vi][ci] = val;
    setVecs(nv);
  };

  const EXAMPLES = [
    { label: 'Стандартный', vecs: [['1','0','0'],['0','1','0'],['0','0','1']] },
    { label: 'Косой базис', vecs: [['1','1','0'],['0','1','1'],['1','0','1']] },
    { label: 'Зависимые', vecs: [['1','2','3'],['2','4','6'],['0','1','0']] },
    { label: 'Компланарные', vecs: [['1','0','0'],['0','1','0'],['2','3','0']] },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {EXAMPLES.map(ex => (
          <button key={ex.label} onClick={() => setVecs(ex.vecs)}
            style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: 'pointer' }}>
            {ex.label}
          </button>
        ))}
      </div>

      {/* 3 column vectors as a matrix */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 16 }}>
        {vecs.map((vec, vi) => (
          <div key={vi} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: [T.primary, T.accent, T.cyan][vi], marginBottom: 6 }}>
              v{vi + 1}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {vec.map((val, ci) => (
                <input key={ci} type="number" value={val}
                  onChange={e => update(vi, ci, e.target.value)}
                  style={{ width: 60, textAlign: 'center', fontWeight: 700, fontFamily: 'monospace',
                    border: `1.5px solid ${[T.primary, T.accent, T.cyan][vi]}40`, borderRadius: 8,
                    padding: '7px 4px', fontSize: 13, color: T.text, background: T.white, outline: 'none' }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Det display */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ padding: '14px 16px', borderRadius: 12, background: `${color}10`, border: `1px solid ${color}30`, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Определитель</div>
            <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'monospace' }}>{d.toFixed(2)}</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 12, background: `${color}08`, border: `1px solid ${color}25` }}>
            <div style={{ fontWeight: 800, fontSize: 14, color, marginBottom: 4 }}>
              {isBasis ? '✓ Базис!' : '✗ Не базис'}
            </div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
              {isBasis
                ? `|det| = ${Math.abs(d).toFixed(2)} — объём параллелепипеда ≠ 0, векторы независимы`
                : 'det = 0 — векторы компланарны или один нулевой'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: T.muted, padding: '10px 14px', borderRadius: 10, background: T.surface, lineHeight: 1.65 }}>
        <strong style={{ color: T.text }}>Матрица Грама: </strong>
        det([v₁|v₂|v₃]) ≠ 0 ⟺ векторы линейно независимы ⟺ образуют базис ℝ³.
        Определитель = ориентированный объём параллелепипеда, натянутого на три вектора.
      </div>
    </div>
  );
}

// ── 4. Kernel & Image Visualizer ──────────────────────────────────────────────
export function KernelImageViz() {
  const [mat, setMat] = useState([['1','0','1'],['0','1','1']]);

  const parsed = mat.map(r => r.map(x => +x || 0));
  const rank = computeRank(parsed);
  const dimKer = 3 - rank;
  const dimIm = rank;
  const rankColor = rank === 2 ? T.green : rank === 1 ? T.amber : T.red;

  const PRESETS = [
    { label: 'Сюръекция (rank=2)', m: [['1','0','1'],['0','1','1']] },
    { label: 'rank = 1', m: [['1','2','3'],['2','4','6']] },
    { label: 'Нулевая', m: [['0','0','0'],['0','0','0']] },
    { label: 'Инъекция', m: [['1','0','0'],['0','1','0']] },
  ];

  const update = (r, c, val) => {
    const nm = mat.map(rr => [...rr]); nm[r][c] = val; setMat(nm);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => setMat(p.m)}
            style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Matrix inputs (2×3) */}
        <div>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>Матрица A (2×3)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,58px)', gap: 5 }}>
            {mat.map((row, r) => row.map((val, c) => (
              <input key={`${r}-${c}`} type="number" value={val}
                onChange={e => update(r, c, e.target.value)}
                style={{ width: '100%', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace',
                  border: `1.5px solid ${T.border}`, borderRadius: 7, padding: '7px 3px', fontSize: 13, outline: 'none' }}
              />
            )))}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>
            A : ℝ³ → ℝ² · rank(A) = <span style={{ fontWeight: 900, color: rankColor }}>{rank}</span>
          </div>
        </div>

        {/* Visual rank-nullity diagram */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {/* Theorem formula */}
          <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: T.primaryLight, border: `1px solid ${T.primaryBorder}` }}>
            dim(ker) + rank = 3 &nbsp;→&nbsp; {dimKer} + {dimIm} = 3
          </div>

          {/* Stacked bars */}
          {[
            { label: 'ℝ³ (область)', total: 3, parts: [{ w: dimKer, color: T.amber, text: `ker(A)  dim=${dimKer}` }, { w: dimIm, color: T.primary, text: `→ образ  dim=${dimIm}` }] },
            { label: 'ℝ² (область значений)', total: 2, parts: [{ w: dimIm, color: T.primary, text: `im(A)  dim=${dimIm}` }, { w: 2 - dimIm, color: T.border, text: dimIm < 2 ? 'недостижимо' : '' }] },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4 }}>{item.label}</div>
              <div style={{ display: 'flex', height: 32, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                {item.parts.map((part, pi) => part.w > 0 && (
                  <div key={pi} style={{ flex: part.w, background: part.color === T.border ? '#f1f5f9' : `${part.color}25`, borderRight: pi < item.parts.length - 1 ? `2px solid ${T.white}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: part.color, whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 6px' }}>
                    {part.text}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ padding: '10px 12px', borderRadius: 10, background: `${rankColor}10`, border: `1px solid ${rankColor}25`, fontSize: 12 }}>
            {rank === 2 && <span style={{ color: T.green, fontWeight: 700 }}>Сюръекция: каждая точка ℝ² достижима из ℝ³</span>}
            {rank === 1 && <span style={{ color: T.amber, fontWeight: 700 }}>Образ — прямая в ℝ². Ядро — плоскость в ℝ³ (dim=2)</span>}
            {rank === 0 && <span style={{ color: T.red, fontWeight: 700 }}>Нулевое отображение: всё ℝ³ отображается в 0</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. Rank Compression ───────────────────────────────────────────────────────
// 8×8 pixel "face" image
const FACE8 = [
  [0,0,6,6,6,6,0,0],
  [0,6,0,0,0,0,6,0],
  [6,0,6,0,0,6,0,6],
  [6,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,6],
  [6,0,6,0,0,6,0,6],
  [0,6,0,6,6,0,6,0],
  [0,0,6,6,6,6,0,0],
];

function valToColor(v, vmin, vmax) {
  const t = Math.max(0, Math.min(1, (v - vmin) / (vmax - vmin + 0.001)));
  const g = Math.round(255 * (1 - t * 0.85));
  const r = Math.round(255 * (1 - t * 0.7));
  const b = Math.round(255 * (1 - t * 0.2));
  return `rgb(${r},${g},${b})`;
}

export function RankCompression() {
  const [k, setK] = useState(1);
  const CELL = 28, N = 8;

  // SVD computed once
  const svd = useMemo(() => truncatedSVD(FACE8, N), []);

  const recon = useMemo(() => reconstructSVD(svd, k, N, N), [k]);

  const allVals = recon.flat();
  const vmin = Math.min(...allVals), vmax = Math.max(...allVals);

  const singularVals = svd.map(s => s.sig);
  const totalEnergy = singularVals.reduce((s, v) => s + v * v, 0);
  const capturedEnergy = singularVals.slice(0, k).reduce((s, v) => s + v * v, 0);
  const pct = totalEnergy > 0 ? ((capturedEnergy / totalEnergy) * 100).toFixed(1) : 0;

  const renderGrid = (data, title, isRecon) => (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
      <svg width={N * CELL} height={N * CELL} style={{ borderRadius: 10, border: `1px solid ${T.border}` }}>
        {data.map((row, r) => row.map((val, c) => (
          <rect key={`${r}-${c}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL}
            fill={isRecon ? valToColor(val, vmin, vmax) : valToColor(val, 0, 6)} />
        )))}
      </svg>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 16 }}>
        {renderGrid(FACE8, 'Оригинал', false)}
        {renderGrid(recon, `Ранг-${k} аппроксимация`, true)}

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>
              Ранг k = {k} из {N}
            </div>
            <input type="range" min={1} max={N} step={1} value={k}
              onChange={e => setK(+e.target.value)}
              style={{ width: '100%', marginBottom: 4 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.muted }}>
              <span>1 (грубо)</span><span>8 (точно)</span>
            </div>
          </div>

          {/* Singular values bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>Сингулярные числа σ₁ ≥ ... ≥ σ₈</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 50 }}>
              {singularVals.map((s, i) => {
                const h = (s / singularVals[0]) * 46;
                return (
                  <div key={i} title={`σ${i+1} = ${s.toFixed(2)}`}
                    style={{ flex: 1, height: h, borderRadius: 3, background: i < k ? T.primary : T.border, transition: 'background 0.2s' }} />
                );
              })}
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 12, background: `${T.primary}10`, border: `1px solid ${T.primaryBorder}` }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 4 }}>Захваченная энергия</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: T.primary }}>{pct}%</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {k} компонент из {N} · rank({k}) ⟹ {k * 2 * N} параметров вместо {N * N}
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: T.muted, padding: '10px 14px', borderRadius: 10, background: T.surface, lineHeight: 1.65 }}>
        <strong style={{ color: T.text }}>SVD: </strong>
        A ≈ σ₁·u₁·v₁ᵀ + σ₂·u₂·v₂ᵀ + … + σₖ·uₖ·vₖᵀ.
        Каждый слагаемый — ранг-1 матрица (внешнее произведение). Ранг = количество значимых компонент = «сложность» матрицы.
      </div>
    </div>
  );
}

// ── 6. Collinearity & ML ──────────────────────────────────────────────────────
const N_PTS = 35;
const X1S = lcgSamples(42, N_PTS);
const EPS = lcgSamples(137, N_PTS);

export function CollinearityExplorer() {
  const [rho, setRho] = useState(0);

  const points = useMemo(() => X1S.map((x, i) => {
    const x2 = rho * x + Math.sqrt(Math.max(0, 1 - rho * rho)) * EPS[i];
    return [x, x2];
  }), [rho]);

  // Condition number of (X^T X / n), where X = [x1, x2] columns
  const condNum = useMemo(() => {
    const s11 = points.reduce((s, [x]) => s + x * x, 0) / N_PTS;
    const s12 = points.reduce((s, [x, y]) => s + x * y, 0) / N_PTS;
    const s22 = points.reduce((s, [, y]) => s + y * y, 0) / N_PTS;
    const tr = s11 + s22;
    const disc = Math.sqrt(Math.max(0, (s11 - s22) ** 2 + 4 * s12 * s12));
    const lmax = (tr + disc) / 2, lmin = (tr - disc) / 2;
    return lmin > 1e-9 ? lmax / lmin : 1e9;
  }, [points]);

  const condColor = condNum < 10 ? T.green : condNum < 100 ? T.amber : T.red;
  const rank = condNum > 1e4 ? 1 : 2;
  const W = 180, H = 180;

  const toSVG = ([x, y]) => [W / 2 + x * 55, H / 2 - y * 55];

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Scatter plot */}
      <svg width={W} height={H} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, flexShrink: 0 }}>
        <line x1={0} y1={H/2} x2={W} y2={H/2} stroke={T.border} strokeWidth={1} />
        <line x1={W/2} y1={0} x2={W/2} y2={H} stroke={T.border} strokeWidth={1} />
        {/* Diagonal guide */}
        <line x1={toSVG([-1.5,-1.5])[0]} y1={toSVG([-1.5,-1.5])[1]}
          x2={toSVG([1.5,1.5])[0]} y2={toSVG([1.5,1.5])[1]}
          stroke={`${T.red}30`} strokeWidth={1.5} strokeDasharray="4,4" />
        {points.map(([x, y], i) => {
          const [sx, sy] = toSVG([x, y]);
          return <circle key={i} cx={sx} cy={sy} r={3.5} fill={`${T.primary}bb`} />;
        })}
        <text x={W - 6} y={H / 2 - 5} fill={T.muted} fontSize={10} textAnchor="end">x₁</text>
        <text x={W / 2 + 4} y={12} fill={T.muted} fontSize={10}>x₂</text>
      </svg>

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 5 }}>
            Корреляция ρ = {rho.toFixed(2)}
          </div>
          <input type="range" min={0} max={0.999} step={0.001} value={rho}
            onChange={e => setRho(+e.target.value)} style={{ width: '100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.muted, marginTop: 2 }}>
            <span>0 — независимые</span><span>1 — коллинеарные</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'Ранг матрицы X', value: rank, max: 2, color: rank === 2 ? T.green : T.red },
            { label: 'κ(XᵀX)', value: condNum > 1e6 ? '∞' : condNum.toFixed(1), color: condColor, sub: condNum < 10 ? 'Стабильно' : condNum < 100 ? 'Умеренно' : 'Опасно!' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: `${item.color}10`, border: `1px solid ${item.color}30` }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>
                {typeof item.value === 'number' ? item.value : item.value}
              </div>
              {item.sub && <div style={{ fontSize: 10, color: item.color, marginTop: 2 }}>{item.sub}</div>}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: T.text, lineHeight: 1.65, padding: '10px 12px', borderRadius: 10, background: T.surface }}>
          {rho < 0.5 && 'Признаки независимы — ранг полный, регрессия устойчива.'}
          {rho >= 0.5 && rho < 0.9 && 'Умеренная мультиколлинеарность — коэффициенты нестабильны.'}
          {rho >= 0.9 && 'Сильная коллинеарность! β = (XᵀX)⁻¹Xᵀy неустойчиво. Используй Ridge или Lasso.'}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function RankBasisInteractiveLab({ onGoTheory }: { onGoTheory?: () => void }) {
  const sections = [
    { id: 'span',      label: 'Оболочка'           },
    { id: 'gauss',     label: 'Метод Гаусса'        },
    { id: 'basis',     label: 'Базис'               },
    { id: 'kernel',    label: 'Ядро и образ'        },
    { id: 'compress',  label: 'SVD-сжатие'          },
    { id: 'collinear', label: 'Мультиколлинеарность'},
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: T.primary, textTransform: 'uppercase' }}>Лаборатория · Ранг и базис</span>
        </div>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>
          6 интерактивных стендов
        </h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 15 }}>
          Меняй параметры, наблюдай, ищи закономерности. Без правильного ответа.
        </p>
      </div>

      {/* Nav chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 36 }}>
        {sections.map(s => (
          <a key={s.id} href={`#${s.id}`}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: `${T.primary}0f`, color: T.primary, border: `1px solid ${T.primaryBorder}`, textDecoration: 'none' }}>
            {s.label}
          </a>
        ))}
        {onGoTheory && (
          <button onClick={onGoTheory}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
            ← Теория
          </button>
        )}
      </div>

      {/* ── 1. Span ── */}
      <LabSection id="span" color={T.primary} badge="Стенд 1"
        title="Натяни оболочку"
        desc="Перетаскивай концы векторов v₁ и v₂. Наблюдай, как меняется размерность span(v₁, v₂)."
        insight="Два вектора в ℝ² порождают либо {0} (оба нуля), либо прямую (коллинеарны), либо всё ℝ² (независимы). Критерий: v₁ × v₂ ≠ 0.">
        <SpanVisualizer2D />
      </LabSection>

      {/* ── 2. Gauss ── */}
      <LabSection id="gauss" color={T.accent} badge="Стенд 2"
        title="Ранг в реальном времени"
        desc="Введи элементы матрицы 3×3. Ранг обновляется мгновенно. Запусти Гаусса — увидишь каждый шаг."
        insight="Ранг = число ненулевых строк в ступенчатом виде = число «настоящих» уравнений в системе. Каждая линейная зависимость строк уменьшает ранг на 1.">
        <GaussRankSimulator />
      </LabSection>

      {/* ── 3. Basis ── */}
      <LabSection id="basis" color={T.green} badge="Стенд 3"
        title="Базис или нет?"
        desc="Введи три вектора ℝ³. Определитель скажет: образуют ли они базис. Попробуй пресеты."
        insight="Базис ℝ³ — ровно 3 линейно независимых вектора. Критерий: det([v₁|v₂|v₃]) ≠ 0. Геометрически: параллелепипед ненулевого объёма.">
        <BasisChecker3D />
      </LabSection>

      {/* ── 4. Kernel ── */}
      <LabSection id="kernel" color={T.cyan} badge="Стенд 4"
        title="Ядро и образ — теорема о ранге"
        desc="Матрица A : ℝ³ → ℝ². Двигай элементы — смотри, как меняются размерности ker(A) и im(A)."
        insight="dim ker(A) + rank(A) = n (размерность области). Это фундаментальная теорема о ранге. При ранге 2: ядро одномерно (прямая в ℝ³ отображается в 0).">
        <KernelImageViz />
      </LabSection>

      {/* ── 5. Compress ── */}
      <LabSection id="compress" color={T.amber} badge="Стенд 5 · ML"
        title="Ранг и сжатие — SVD в действии"
        desc="8×8 пиксельный образ разложен через SVD. Ползунок выбирает первые k компонент — ранг-k аппроксимацию."
        insight="A ≈ σ₁u₁v₁ᵀ + … + σₖuₖvₖᵀ. Первые сингулярные числа несут 90%+ энергии. Именно так работает сжатие JPEG, рекомендации Netflix и Low-Rank Adaptation (LoRA) в LLM.">
        <RankCompression />
      </LabSection>

      {/* ── 6. Collinearity ── */}
      <LabSection id="collinear" color={T.red} badge="Стенд 6 · ML"
        title="Мультиколлинеарность и регрессия"
        desc="Ползунок ρ задаёт корреляцию признаков x₁ и x₂. При ρ → 1 ранг матрицы данных падает, а регрессия становится неустойчивой."
        insight="Когда признаки коллинеарны, XᵀX почти вырождена (большое число обусловленности κ), коэффициенты β = (XᵀX)⁻¹Xᵀy скачут при малых изменениях данных. Лечение: Ridge regression (добавить λI) или удалить один из коллинеарных признаков.">
        <CollinearityExplorer />
      </LabSection>
    </div>
  );
}
