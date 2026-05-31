import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  HelpCircle,
  Info,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  Users,
  Wand2,
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

// ─── Matrix math ──────────────────────────────────────────────────────────────
type M = number[][];
const N = 10;

function mulMatVec(A: M, v: number[]) { return A.map((r) => r.reduce((s, x, i) => s + x * v[i], 0)); }
function dot(a: number[], b: number[]) { return a.reduce((s, x, i) => s + x * b[i], 0); }
function normVec(v: number[]) { return Math.hypot(...v); }
function transpose(A: M): M { return A[0].map((_, j) => A.map((r) => r[j])); }
function mul(A: M, B: M): M { return A.map((r) => B[0].map((_, j) => r.reduce((s, x, i) => s + x * B[i][j], 0))); }
function clamp(x: number, lo = 1, hi = 5) { return Math.max(lo, Math.min(hi, x)); }

function topEigenSym(A: M, iters = 120): { val: number; vec: number[] } {
  let v = Array.from({ length: A.length }, (_, i) => (i === 0 ? 1 : 0.3 + i * 0.01));
  for (let t = 0; t < iters; t++) {
    const Av = mulMatVec(A, v);
    const n = normVec(Av) || 1;
    v = Av.map((x) => x / n);
  }
  const Av = mulMatVec(A, v);
  return { val: dot(v, Av), vec: v };
}

function truncatedSVDReconstruct(X: M, k: number): M {
  const Xt = transpose(X);
  let C = mul(X, Xt);
  const U: number[][] = [];
  const S: number[] = [];
  for (let i = 0; i < Math.min(k, N); i++) {
    const { val, vec } = topEigenSym(C);
    if (val < 1e-8) break;
    U.push(vec);
    S.push(Math.sqrt(Math.max(0, val)));
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) C[r][c] -= val * vec[r] * vec[c];
  }
  const recon: M = Array.from({ length: N }, () => Array(N).fill(0));
  for (let t = 0; t < U.length; t++) {
    const u = U[t]; const sigma = S[t];
    const v = mulMatVec(Xt, u).map((x) => x / (sigma || 1));
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) recon[i][j] += sigma * u[i] * v[j];
  }
  return recon;
}

function rmse(A: M, B: M, mask: boolean[][]) {
  let s = 0, c = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (mask[i][j]) { s += (A[i][j] - B[i][j]) ** 2; c++; }
  return Math.sqrt(s / Math.max(1, c));
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const trueRatings: M = [
  [5,4,2,5,1,4,2,5,1,3],[4,5,2,5,1,5,2,4,1,2],[1,2,5,2,5,1,5,1,4,5],[2,1,5,1,4,2,5,1,5,4],[5,4,1,5,2,4,1,5,1,2],
  [1,2,4,2,5,1,4,2,5,5],[4,5,1,4,2,5,1,4,2,1],[2,1,5,1,4,2,5,1,4,5],[5,4,2,4,1,5,2,5,1,1],[1,2,5,2,4,1,5,2,5,4],
];

const FILM_NAMES = ['Дюна', 'Матрица', 'Тихоня', 'Интер.', 'Шрек', 'Аватар', 'Побег', 'Начало', 'Тор', 'Чудо'];
const USER_NAMES = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U8', 'U9', 'U10'];

const hiddenMask: boolean[][] = Array.from({ length: N }, (_, i) =>
  Array.from({ length: N }, (_, j) => ((i * 7 + j * 3 + 2) % 10) < 4)
);
const knownMask: boolean[][] = hiddenMask.map((r) => r.map((x) => !x));

// ─── Color helpers ────────────────────────────────────────────────────────────
function ratingBg(v: number): string {
  const t = (clamp(v) - 1) / 4;
  const r = Math.round(238 - t * 120);
  const g = Math.round(242 - t * 80);
  const b = Math.round(255 - t * 20);
  return `rgb(${r},${g},${b})`;
}
function ratingText(v: number): string {
  return (clamp(v) - 1) / 4 > 0.55 ? '#1e1b4b' : '#3730a3';
}

// ─── UI primitives ────────────────────────────────────────────────────────────
function Callout({ color = T.amber, title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 12, padding: '13px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

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

// ─── RMSE chart ───────────────────────────────────────────────────────────────
function RmseChart({ knownValues, hiddenValues }: { knownValues: number[]; hiddenValues: number[] }) {
  const maxVal = Math.max(...knownValues, ...hiddenValues, 0.01);
  const W = 500, H = 140, padL = 36, padR = 16, padT = 16, padB = 28;
  const cw = W - padL - padR;
  const ch = H - padT - padB;
  const xs = (i: number) => padL + (i / (N - 1)) * cw;
  const ys = (v: number) => padT + ch - (v / maxVal) * ch;

  const knownPath = knownValues.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ');
  const hiddenPath = hiddenValues.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ');

  const minHiddenIdx = hiddenValues.indexOf(Math.min(...hiddenValues));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={padL} y1={padT + ch * (1 - f)} x2={W - padR} y2={padT + ch * (1 - f)} stroke={T.border} strokeDasharray="3 3" />
          <text x={padL - 3} y={padT + ch * (1 - f) + 4} fontSize="9" fill={T.mutedLight} textAnchor="end">{(maxVal * f).toFixed(2)}</text>
        </g>
      ))}
      {/* X axis */}
      {Array.from({ length: N }, (_, i) => (
        <text key={i} x={xs(i)} y={H - 4} fontSize="9" fill={T.mutedLight} textAnchor="middle">{i + 1}</text>
      ))}
      {/* Optimal k line */}
      <line x1={xs(minHiddenIdx)} y1={padT} x2={xs(minHiddenIdx)} y2={padT + ch} stroke={T.green} strokeDasharray="5 3" strokeWidth="1.5" />
      <text x={xs(minHiddenIdx) + 4} y={padT + 10} fontSize="9" fill={T.green} fontWeight="700">k*={minHiddenIdx + 1}</text>
      {/* Known line */}
      <path d={knownPath} fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Hidden line */}
      <path d={hiddenPath} fill="none" stroke={T.amber} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {knownValues.map((v, i) => <circle key={i} cx={xs(i)} cy={ys(v)} r="3.5" fill={T.primary} />)}
      {hiddenValues.map((v, i) => <circle key={i} cx={xs(i)} cy={ys(v)} r="3.5" fill={T.amber} />)}
      {/* X label */}
      <text x={W / 2} y={H - 1} fontSize="9" fill={T.muted} textAnchor="middle">ранг k</text>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SVDMissingRatingsLab() {
  const [k, setK] = useState(3);
  const [reveal, setReveal] = useState(false);

  // Pre-fill missing entries with row mean
  const filled = useMemo<M>(() => {
    return trueRatings.map((row, i) => {
      const known = row.filter((_, j) => knownMask[i][j]);
      const mean = known.reduce((a, b) => a + b, 0) / Math.max(1, known.length);
      return row.map((v, j) => (knownMask[i][j] ? v : mean));
    });
  }, []);

  const pred = useMemo(() => truncatedSVDReconstruct(filled, k).map((r) => r.map((x) => clamp(x))), [filled, k]);

  const knownErr = useMemo(() => rmse(pred, trueRatings, knownMask), [pred]);
  const hiddenErr = useMemo(() => rmse(pred, trueRatings, hiddenMask), [pred]);

  // Precompute all k values for the chart
  const allKValues = useMemo(() => {
    return Array.from({ length: N }, (_, ki) => {
      const p = truncatedSVDReconstruct(filled, ki + 1).map((r) => r.map((x) => clamp(x)));
      return { known: rmse(p, trueRatings, knownMask), hidden: rmse(p, trueRatings, hiddenMask) };
    });
  }, [filled]);

  const bestK = allKValues.indexOf(allKValues.reduce((best, v) => (v.hidden < best.hidden ? v : best), allKValues[0])) + 1;

  // Find worst prediction cell
  let worstCell = { i: 0, j: 0, err: 0 };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (hiddenMask[i][j]) {
      const e = Math.abs(pred[i][j] - trueRatings[i][j]);
      if (e > worstCell.err) worstCell = { i, j, err: e };
    }
  }

  const overfitting = knownErr < 0.3 && hiddenErr > 1.0;
  const underfitting = knownErr > 1.0;
  const goodFit = !overfitting && !underfitting;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: '0 0 40px' }}>

      {/* ── Header ── */}
      <div style={{ borderRadius: 20, background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.white} 60%, ${T.amberLight} 100%)`, border: `1px solid ${T.primaryBorder}`, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Wand2 size={18} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: T.primary, textTransform: 'uppercase' as const }}>Лаборатория 4 · SVD</span>
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>
          Восстановление пропусков — SVD как детектив
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.7 }}>
          <strong>Исследовательский вопрос:</strong> у нас матрица рейтингов с дырками. Как SVD угадывает недостающие оценки — и насколько точно? Где граница между недообучением и переобучением?
        </p>
      </div>

      {/* ── Theory ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <InfoBox icon={Users} title="Идея: скрытые факторы вкусов" color={T.primary}>
          SVD предполагает, что оценки определяются несколькими скрытыми факторами: «любит боевики», «ценит сюжет», «смотрит sci-fi». При малом k мы описываем пользователей и фильмы парой главных факторов.
        </InfoBox>
        <InfoBox icon={TrendingDown} title="RMSE на известных" color={T.green}>
          Насколько точно модель воспроизводит оценки, которые она видела. При большом k → стремится к 0. Но это не всегда хорошо!
        </InfoBox>
        <InfoBox icon={TrendingUp} title="RMSE на скрытых" color={T.amber}>
          Насколько точно модель предсказывает оценки, которые от неё скрыты. Это реальное качество рекомендаций — именно эту метрику надо минимизировать.
        </InfoBox>
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 20, marginBottom: 20 }}>

        {/* Matrix */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BookOpen size={15} color={T.primary} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Матрица рейтингов 10×10</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: T.muted }}>строки = пользователи, столбцы = фильмы</span>
          </div>

          {/* Film headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(10, minmax(0,1fr))', gap: 3, marginBottom: 4 }}>
            <div />
            {FILM_NAMES.map((f) => (
              <div key={f} style={{ fontSize: 9, color: T.mutedLight, textAlign: 'center' as const, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f}</div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: N }, (_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px repeat(10, minmax(0,1fr))', gap: 3, marginBottom: 3 }}>
              <div style={{ fontSize: 10, color: T.mutedLight, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>{USER_NAMES[i]}</div>
              {Array.from({ length: N }, (_, j) => {
                const hidden = hiddenMask[i][j];
                const trueV = trueRatings[i][j];
                const pVal = pred[i][j];
                const err = Math.abs(pVal - trueV);
                const isBad = err > 1;
                const isWorst = hidden && worstCell.i === i && worstCell.j === j && reveal;

                let bg: string, textColor: string, content: React.ReactNode, border: string;

                if (!hidden) {
                  // Known cell
                  bg = ratingBg(trueV);
                  textColor = ratingText(trueV);
                  content = trueV;
                  border = `1px solid ${T.border}`;
                } else if (!reveal) {
                  // Hidden, not revealed
                  bg = '#e2e8f0';
                  textColor = T.muted;
                  content = '?';
                  border = '1px dashed #94a3b8';
                } else {
                  // Revealed
                  bg = isBad ? T.redLight : T.greenLight;
                  textColor = isBad ? T.red : T.green;
                  content = isBad ? '✕' : '★';
                  border = `1.5px solid ${isBad ? T.red : T.green}`;
                }

                return (
                  <div
                    key={j}
                    title={hidden ? `Предсказано: ${pVal.toFixed(1)}, Истина: ${trueV}` : `Известно: ${trueV}`}
                    style={{
                      aspectRatio: '1', borderRadius: 7, border,
                      background: hidden && !reveal ? bg : hidden && reveal ? bg : bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: textColor,
                      boxShadow: isWorst ? `0 0 0 2px ${T.red}` : undefined,
                      position: 'relative' as const,
                      cursor: 'default',
                    }}
                  >
                    {content}
                    {isWorst && <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: T.red }} />}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap' as const, gap: 10, fontSize: 11, color: T.muted }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: ratingBg(1), border: `1px solid ${T.border}` }} />
              <span>оценка 1 (антипатия)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: ratingBg(5), border: `1px solid ${T.border}` }} />
              <span>оценка 5 (восторг)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: '#e2e8f0', border: '1px dashed #94a3b8' }} />
              <span>скрытая ячейка (40%)</span>
            </div>
            {reveal && <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: T.greenLight, border: `1px solid ${T.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: T.green }}>★</div>
                <span>угадано (ошибка ≤ 1)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: T.redLight, border: `1px solid ${T.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: T.red }}>✕</div>
                <span>промах (ошибка {'>'} 1)</span>
              </div>
            </>}
          </div>
        </div>

        {/* Controls sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>

          {/* k slider */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Ранг k =</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: T.primary }}>{k}</span>
            </div>
            <input
              type="range" min={1} max={10} step={1} value={k}
              onChange={(e) => setK(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.primary }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.mutedLight, marginTop: 2 }}>
              <span>k=1 (грубо)</span>
              <span>k=10 (полный ранг)</span>
            </div>

            {/* Regime badge */}
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 10, background: overfitting ? T.redLight : underfitting ? T.amberLight : T.greenLight, border: `1px solid ${overfitting ? T.red : underfitting ? T.amber : T.green}40` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: overfitting ? T.red : underfitting ? T.amber : T.green, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                {overfitting ? '⚠ Переобучение' : underfitting ? '⚠ Недообучение' : '✓ Хороший баланс'}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>
                {overfitting
                  ? 'Модель выучила шум, плохо обобщает'
                  : underfitting
                  ? 'Слишком мало факторов, вкусы не различаются'
                  : 'Модель уловила структуру, не запомнила шум'}
              </div>
            </div>
          </div>

          {/* RMSE cards */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Метрики качества</div>

            <div style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 12, background: `${T.primary}0d`, border: `1px solid ${T.primaryBorder}` }}>
              <div style={{ fontSize: 11, color: T.primary, fontWeight: 700, marginBottom: 3 }}>RMSE на известных ячейках</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: T.primary }}>{knownErr.toFixed(3)}</div>
              <div style={{ fontSize: 11, color: T.muted }}>насколько хорошо «помним» обучающее</div>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: 12, background: reveal ? `${T.amber}0d` : T.surface, border: `1px solid ${reveal ? T.amber + '50' : T.border}` }}>
              <div style={{ fontSize: 11, color: T.amber, fontWeight: 700, marginBottom: 3 }}>RMSE на скрытых ячейках</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: reveal ? T.amber : T.mutedLight }}>
                {reveal ? hiddenErr.toFixed(3) : '???'}
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>{reveal ? 'реальное качество рекомендаций' : 'раскрой карты, чтобы увидеть'}</div>
            </div>

            {reveal && (
              <div style={{ marginTop: 8, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                Оптимальное k по скрытым: <strong style={{ color: T.green }}>k = {bestK}</strong>
                {k === bestK && <span style={{ color: T.green }}> ← ты попал!</span>}
              </div>
            )}
          </div>

          {/* Reveal button */}
          <button
            onClick={() => setReveal((v) => !v)}
            style={{
              padding: '12px 18px', borderRadius: 14,
              background: reveal ? T.surface : T.primaryDark,
              color: reveal ? T.text : T.white,
              border: `1.5px solid ${reveal ? T.border : T.primaryDark}`,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {reveal ? <><EyeOff size={16} /> Скрыть карты</> : <><Eye size={16} /> Раскрыть карты</>}
          </button>

          {reveal && (
            <div style={{ background: `${T.amber}10`, border: `1px solid ${T.amber}35`, borderRadius: 14, padding: '12px 16px', fontSize: 12, color: T.text, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 800, color: T.amber, marginBottom: 5 }}>Худшее предсказание</div>
              Пользователь <strong>{USER_NAMES[worstCell.i]}</strong>, фильм <strong>{FILM_NAMES[worstCell.j]}</strong>:<br />
              предсказано {pred[worstCell.i][worstCell.j].toFixed(1)}, истина {trueRatings[worstCell.i][worstCell.j]}, ошибка {worstCell.err.toFixed(2)}.
              <div style={{ marginTop: 6, color: T.muted }}>Обычно это пользователь с нетипичным вкусом — SVD улавливает общие паттерны, но не индивидуальные исключения.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── RMSE chart ── */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <TrendingDown size={15} color={T.primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Кривые ошибок по всем k</span>
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
          Наблюдай, как синяя кривая (известные) падает, а жёлтая (скрытые) — сначала падает, потом растёт. Минимум жёлтой — оптимальное k.
        </div>
        <RmseChart
          knownValues={allKValues.map((v) => v.known)}
          hiddenValues={allKValues.map((v) => v.hidden)}
        />
        <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke={T.primary} strokeWidth="2.5" /></svg>
            <span style={{ color: T.muted }}>RMSE на известных</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke={T.amber} strokeWidth="2.5" /></svg>
            <span style={{ color: T.muted }}>RMSE на скрытых</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke={T.green} strokeDasharray="4 3" strokeWidth="1.5" /></svg>
            <span style={{ color: T.muted }}>Оптимальное k* = {bestK}</span>
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          <div style={{ padding: '8px 14px', borderRadius: 10, background: T.redLight, border: `1px solid ${T.red}30`, fontSize: 12 }}>
            <strong style={{ color: T.red }}>k → 10:</strong> <span style={{ color: T.muted }}>переобучение — синяя → 0, жёлтая ↑</span>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 10, background: T.amberLight, border: `1px solid ${T.amber}30`, fontSize: 12 }}>
            <strong style={{ color: T.amber }}>k = 1–2:</strong> <span style={{ color: T.muted }}>недообучение — обе кривые высоко</span>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 10, background: T.greenLight, border: `1px solid ${T.green}30`, fontSize: 12 }}>
            <strong style={{ color: T.green }}>k = {bestK}:</strong> <span style={{ color: T.muted }}>минимум жёлтой кривой</span>
          </div>
        </div>
      </div>

      {/* ── Exploration questions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
        <HelpCircle size={16} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Исследовательские вопросы</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
        <Collapsible title="k=1: На что похожи предсказания? Почему они такие?" color={T.primary}>
          При k=1 модель описывает каждого пользователя и каждый фильм одним числом. Предсказания становятся почти одинаковыми: все пользователи получают «среднюю» оценку. Это потому, что один скрытый фактор не может передать разнообразие вкусов. Это классическое недообучение.
        </Collapsible>
        <Collapsible title="k=3 vs k=1: стали ли предсказания разнообразнее?" color={T.green}>
          При k=3 появляются три независимых «оси вкусов». Пользователи начинают различаться: один любит экшн, другой — драмы. Посмотри на матрицу: при k=3 предсказанные оценки уже не одинаковые серые пятна, а разноцветные.
        </Collapsible>
        <Collapsible title="При каком k ошибка на скрытых минимальна? (раскрой карты)" color={T.amber}>
          Раскрой карты и посмотри на график — минимум жёлтой кривой. Обычно для матрицы 10×10 это k=3–5. Именно столько «скрытых факторов вкусов» нужно для описания данных. Двигай ползунок вокруг этого значения.
        </Collapsible>
        <Collapsible title="k=10: что происходит с ошибкой на известных и скрытых?" color={T.red}>
          При k=10 (полный ранг) ошибка на известных стремится к нулю — модель точно воспроизводит всё, что видела. Но ошибка на скрытых растёт! Почему? Модель «выучила» не только структуру, но и случайные колебания оценок (шум). Это переобучение — главная проблема ML.
        </Collapsible>
        <Collapsible title="Для какого пользователя и фильма ошибка наибольшая?" color={T.violet}>
          Раскрой карты. Найди красный крестик. Скорее всего, это пользователь с нетипичным вкусом: его предпочтения не вписываются в общие паттерны, которые уловил SVD. SVD предсказывает «среднего» такого пользователя — а реальный человек оказался непохожим на типаж.
        </Collapsible>
      </div>

      {/* ── Riddles ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
        <Wand2 size={16} color={T.violet} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
        <Collapsible title="Загадка 1: Модель предсказывает оценку 4.2, а истинная — 2. Как так?" color={T.violet}>
          При k=2 пользователь похож на других по двум главным факторам. SVD «думает»: «похожие пользователи любят этот фильм» — и предсказывает 4.2. Но у человека есть индивидуальное отклонение именно по этому фильму, которое k=2 не может уловить. SVD моделирует типажи, а не личности.
        </Collapsible>
        <Collapsible title="Загадка 2: При k=10 ошибка на известных = 0. Значит k=10 — лучший?" color={T.red}>
          Нет! Нулевая ошибка на известных означает идеальное запоминание — но не понимание. Посмотри на ошибку на скрытых при k=10: она высокая. Модель «зазубрила» учебник, но не справилась с контрольной. Это переобучение (overfitting) — фундаментальная проблема машинного обучения.
        </Collapsible>
      </div>

      {/* ── Key insight ── */}
      <div style={{ background: `linear-gradient(135deg, ${T.primaryLight}, ${T.amberLight})`, border: `1px solid ${T.primaryBorder}`, borderRadius: 16, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Lightbulb size={18} color={T.primary} />
          <span style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Главный вывод</span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 14, color: T.text, lineHeight: 1.8 }}>
          <strong>SVD для рекомендаций — это балансирование:</strong> малое k (недообучение) — все рекомендации одинаковы; большое k (переобучение) — модель запоминает шум вместо структуры.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.8 }}>
          Оптимальное k — это «истинный ранг» матрицы вкусов: число скрытых факторов, реально определяющих предпочтения. Его находят по минимуму ошибки на отложенной выборке — это и есть кросс-валидация.
        </p>
      </div>
    </div>
  );
}
