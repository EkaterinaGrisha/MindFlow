// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Target, Zap, BookOpen, Layers, Brain,
  Code2, CheckCircle2, ArrowRight, Play, RotateCcw,
  Activity, Grid3X3, Sigma,
} from 'lucide-react';
import { MarkdownRenderer } from '../../MarkdownRenderer';

// ─── Цвета (идентично rank-basis) ────────────────────────────────────────────
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

// ─── Формульные хелперы (идентично rank-basis) ────────────────────────────────

function F({ tex }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 4px' }}>
      <MarkdownRenderer content={`$$${tex}$$`} />
    </div>
  );
}

function M({ tex }) {
  return (
    <span style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: 1 }}>
      <MarkdownRenderer content={`$${tex}$`} />
    </span>
  );
}

function FBox({ tex, hint, color = T.primary }) {
  const bg = color === T.primary ? T.primaryLight : `${color}12`;
  const border = color === T.primary ? T.primaryBorder : `${color}40`;
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: '16px 22px', margin: '14px 0', textAlign: 'center' }}>
      <MarkdownRenderer content={`$$${tex}$$`} />
      {hint && <div style={{ fontSize: 12, color: T.accent, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

// ─── UI-компоненты (идентично rank-basis) ─────────────────────────────────────

function SectionHeader({ icon: Icon, label, title, color = T.primary }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <h2 style={{ margin: 0, color: T.text, fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>{title}</h2>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 22px', marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

function DSNote({ children }) {
  return (
    <div style={{ background: `${T.cyan}0f`, border: `1px solid ${T.cyan}33`, borderRadius: 12, padding: '13px 18px', margin: '18px 0', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
      <span style={{ fontWeight: 700, color: T.cyan }}>В Data Science: </span>{children}
    </div>
  );
}

function Callout({ color = T.amber, title, children }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 12, padding: '13px 18px', margin: '14px 0' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function VideoPlaceholder({ title, desc, duration, badge }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div style={{ borderRadius: 20, background: '#0f172a', color: T.white, padding: '22px 28px', margin: '18px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#818cf8', textTransform: 'uppercase', marginBottom: 6 }}>{badge ?? 'Видео-плейсхолдер'}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>Длительность: {duration} · loop</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>Закрыть</button>
        </div>
      </div>
    );
  }
  return (
    <div onClick={() => setOpen(true)} style={{ borderRadius: 20, border: `2px dashed ${T.border}`, background: `${T.primary}04`, padding: '18px 24px', margin: '18px 0', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
      <span style={{ width: 48, height: 48, borderRadius: '50%', background: T.white, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Play size={18} color={T.primary} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: T.muted }}>{desc} · {duration}</div>
      </div>
      {badge && <span style={{ fontSize: 10, fontWeight: 800, color: T.primary, background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '3px 10px' }}>{badge}</span>}
      <ArrowRight size={14} color={T.mutedLight} />
    </div>
  );
}

// ─── Анимация: ёж из векторов ─────────────────────────────────────────────────

function HedgehogAnim() {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timers = useRef([]);

  const W = 260, H = 260, CX = 130, CY = 130, SC = 48;
  const A = [[2, 1], [1, 2]];
  const applyA = ([x, y]) => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
  const N = 12;
  const angles = Array.from({ length: N }, (_, i) => (i * Math.PI * 2) / N);
  const eigIdx = [3, 9];
  const toSVG = ([x, y]) => [CX + x * SC, CY - y * SC];

  const play = () => {
    timers.current.forEach(clearTimeout);
    setPhase(0); setPlaying(true);
    [0, 1000, 2000, 3200].forEach((t, i) => {
      timers.current.push(setTimeout(() => setPhase(i), t));
    });
    timers.current.push(setTimeout(() => { setPhase(0); setPlaying(false); }, 4600));
  };

  const labels = [
    '12 единичных векторов во всех направлениях',
    'Применяем матрицу A ко всем…',
    'Большинство изменили и длину, и направление',
    'Красные остались на своих прямых — это собственные векторы',
  ];

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', margin: '18px 0' }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>Собственный вектор не поворачивается</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted }}>A = [[2,1],[1,2]]</span>
      </div>
      <div style={{ padding: '18px 22px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <svg width={W} height={H} style={{ flexShrink: 0 }}>
          {[-2, -1, 0, 1, 2].map(g => (
            <g key={g}>
              <line x1={toSVG([g, -2.5])[0]} y1={toSVG([g, -2.5])[1]} x2={toSVG([g, 2.5])[0]} y2={toSVG([g, 2.5])[1]} stroke={g === 0 ? T.mutedLight : T.border} strokeWidth={g === 0 ? 1 : 0.5} />
              <line x1={toSVG([-2.5, g])[0]} y1={toSVG([-2.5, g])[1]} x2={toSVG([2.5, g])[0]} y2={toSVG([2.5, g])[1]} stroke={g === 0 ? T.mutedLight : T.border} strokeWidth={g === 0 ? 1 : 0.5} />
            </g>
          ))}
          {angles.map((a, i) => {
            const unit = [Math.cos(a), Math.sin(a)];
            const isEig = eigIdx.includes(i);
            const vec = phase === 0 ? unit : applyA(unit).map(v => v / 3.5);
            const [x2, y2] = toSVG(vec);
            const dimmed = phase >= 2 && !isEig;
            return (
              <g key={i} style={{ opacity: dimmed ? 0.12 : 1, transition: 'opacity 0.5s' }}>
                <line x1={CX} y1={CY} x2={x2} y2={y2} stroke={isEig ? T.red : T.primary} strokeWidth={isEig ? 2.5 : 1.5} />
                <circle cx={x2} cy={y2} r={isEig ? 5 : 3} fill={isEig ? T.red : T.primary} />
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={3} fill={T.text} />
        </svg>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 13, color: T.text, lineHeight: 1.65, marginBottom: 12, minHeight: 64 }}>
            {labels[phase]}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${T.red}12`, color: T.red, fontWeight: 700, border: `1px solid ${T.red}30` }}><M tex="\lambda_1=1" />: остаётся</span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${T.red}12`, color: T.red, fontWeight: 700, border: `1px solid ${T.red}30` }}><M tex="\lambda_2=3" />: × 3</span>
          </div>
          <button
            onClick={play} disabled={playing}
            style={{ padding: '7px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: playing ? T.surface : T.primary, color: playing ? T.muted : T.white, fontSize: 12, fontWeight: 700, cursor: playing ? 'default' : 'pointer' }}
          >
            {playing ? '…' : '▶ Запустить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Анимация: окружность → эллипс ───────────────────────────────────────────

function EllipseAnim() {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const DURATION = 2000;
  const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  const play = () => {
    setProgress(0); setPlaying(true);
    startRef.current = performance.now();
    const tick = now => {
      const p = Math.min((now - startRef.current) / DURATION, 1);
      setProgress(ease(p));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    rafRef.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const W = 240, H = 240, CX = 120, CY = 120, R = 65;
  const t = progress;
  const pts = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2;
    const x0 = Math.cos(a), y0 = Math.sin(a);
    const x1 = 2 * x0 + y0, y1 = x0 + 2 * y0;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    return [CX + x * R / 3, CY - y * R / 3];
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
  const s2 = Math.SQRT2;
  const toE = ([ex, ey], s) => [CX + ex * R * s / s2, CY - ey * R * s / s2];
  const [e1x, e1y] = toE([1 / s2, -1 / s2], 1);
  const [e2x, e2y] = toE([1 / s2, 1 / s2], 1 + 2 * t);

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', margin: '18px 0' }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>Единичная окружность → эллипс</span>
      </div>
      <div style={{ padding: '18px 22px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={W} height={H} style={{ flexShrink: 0 }}>
          <line x1={0} y1={CY} x2={W} y2={CY} stroke={T.border} strokeWidth={1} />
          <line x1={CX} y1={0} x2={CX} y2={H} stroke={T.border} strokeWidth={1} />
          <path d={d} fill={`${T.primary}15`} stroke={T.primary} strokeWidth={2} />
          <line x1={CX} y1={CY} x2={e1x} y2={e1y} stroke={T.amber} strokeWidth={2.5} />
          <circle cx={e1x} cy={e1y} r={5} fill={T.amber} />
          <text x={e1x + 7} y={e1y + 4} fill={T.amber} fontSize={11} fontWeight={700}>λ=1</text>
          <line x1={CX} y1={CY} x2={e2x} y2={e2y} stroke={T.red} strokeWidth={2.5} />
          <circle cx={e2x} cy={e2y} r={5} fill={T.red} />
          <text x={e2x + 7} y={e2y - 3} fill={T.red} fontSize={11} fontWeight={700}>λ=3</text>
          <circle cx={CX} cy={CY} r={3} fill={T.text} />
        </svg>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 12 }}>
            Оси эллипса — собственные векторы.<br />Длины полуосей — <M tex="\lambda_1 = 1" /> и <M tex="\lambda_2 = 3" />.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: T.amberLight, color: T.amber, fontWeight: 700 }}>v₁ · λ=1</span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: T.redLight, color: T.red, fontWeight: 700 }}>v₂ · λ=3</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={play} disabled={playing} style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: playing ? T.surface : T.primary, color: playing ? T.muted : T.white, fontSize: 12, fontWeight: 700, cursor: playing ? 'default' : 'pointer' }}>
              {playing ? '…' : '▶ Показать'}
            </button>
            <button onClick={() => { cancelAnimationFrame(rafRef.current); setProgress(0); setPlaying(false); }} style={{ padding: '6px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, color: T.muted, cursor: 'pointer' }}>
              <RotateCcw size={12} style={{ display: 'inline' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Анимация: поворот — нет вещественных векторов ───────────────────────────

function RotationAnim() {
  const [angle, setAngle] = useState(0);
  const [running, setRunning] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setAngle(a => {
        if (a >= Math.PI * 2) { setRunning(false); return 0; }
        return a + 0.045;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const W = 180, H = 180, CX = 90, CY = 90, R = 58;
  const x = CX + Math.cos(angle) * R, y = CY - Math.sin(angle) * R;

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', margin: '18px 0' }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 18px' }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>Поворот 90° — нет вещественных собственных векторов</span>
      </div>
      <div style={{ padding: '18px 22px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={W} height={H} style={{ flexShrink: 0 }}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={T.border} strokeWidth={1} strokeDasharray="4,3" />
          <line x1={0} y1={CY} x2={W} y2={CY} stroke={T.border} strokeWidth={1} />
          <line x1={CX} y1={0} x2={CX} y2={H} stroke={T.border} strokeWidth={1} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = angle - i * 0.15;
            return <circle key={i} cx={CX + Math.cos(a) * R} cy={CY - Math.sin(a) * R} r={Math.max(0, 3 - i * 0.25)} fill={T.primary} opacity={(10 - i) / 10 * 0.4} />;
          })}
          <line x1={CX} y1={CY} x2={x} y2={y} stroke={T.red} strokeWidth={2.5} />
          <circle cx={x} cy={y} r={6} fill={T.red} />
          <circle cx={CX} cy={CY} r={3} fill={T.text} />
        </svg>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 10 }}>
            Любой вектор поворачивается на 90°. Ни один не остаётся на своей прямой.
          </div>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.red, background: T.redLight, borderRadius: 20, padding: '3px 12px' }}>λ = ±i — чисто мнимые</span>
          </div>
          <button onClick={() => { setAngle(0); setRunning(true); }} disabled={running} style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: running ? T.surface : T.primary, color: running ? T.muted : T.white, fontSize: 12, fontWeight: 700, cursor: running ? 'default' : 'pointer' }}>
            {running ? 'Вращается…' : '▶ Запустить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Интерактив: спектр матрицы 2×2 ──────────────────────────────────────────

function SpectrumSlider() {
  const [a, setA] = useState(2), [b, setB] = useState(1);
  const [c, setC] = useState(1), [d, setD] = useState(2);
  const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
  const fmt = n => Math.round(n * 100) / 100;

  let lA, lB, type;
  if (disc >= 0) {
    lA = fmt((tr + Math.sqrt(disc)) / 2);
    lB = fmt((tr - Math.sqrt(disc)) / 2);
    type = 'real';
  } else {
    lA = fmt(tr / 2);
    lB = fmt(Math.sqrt(-disc) / 2);
    type = 'complex';
  }

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', margin: '18px 0' }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>Интерактив — спектр матрицы 2×2</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 10, background: type === 'real' ? T.greenLight : T.redLight, color: type === 'real' ? T.green : T.red, fontWeight: 700 }}>
          {type === 'real' ? 'λ вещественные' : 'λ комплексные'}
        </span>
      </div>
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div style={{ background: T.surface, borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <F tex={`\\begin{pmatrix}${fmt(a)} & ${fmt(b)} \\\\ ${fmt(c)} & ${fmt(d)}\\end{pmatrix}`} />
          </div>
          <div style={{ background: type === 'real' ? T.greenLight : T.redLight, border: `1px solid ${type === 'real' ? T.green : T.red}30`, borderRadius: 12, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            {type === 'real' ? (
              <>
                <div style={{ fontSize: 13, color: T.green, fontWeight: 700, textAlign: 'center' }}><M tex={`\\lambda_1 = ${lA}`} /></div>
                <div style={{ fontSize: 13, color: T.green, fontWeight: 700, textAlign: 'center' }}><M tex={`\\lambda_2 = ${lB}`} /></div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: T.red, fontWeight: 700, textAlign: 'center' }}><M tex={`\\text{Re} = ${lA}`} /></div>
                <div style={{ fontSize: 13, color: T.red, fontWeight: 700, textAlign: 'center' }}><M tex={`\\text{Im} = \\pm ${lB}`} /></div>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 18px' }}>
          {[{ label: 'a', val: a, set: setA }, { label: 'b', val: b, set: setB }, { label: 'c', val: c, set: setC }, { label: 'd', val: d, set: setD }].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: T.muted, width: 14, flexShrink: 0 }}>{item.label}</span>
              <input type="range" min="-3" max="5" step="0.5" value={item.val} onChange={e => item.set(+e.target.value)} style={{ flex: 1, accentColor: T.primary }} />
              <span style={{ fontSize: 12, color: T.text, width: 28, textAlign: 'right', fontWeight: 700 }}>{fmt(item.val)}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 16, fontSize: 12, color: T.muted }}>
          <span>tr = <strong style={{ color: T.text }}>{fmt(tr)}</strong> = <M tex="\lambda_1+\lambda_2" /></span>
          <span>det = <strong style={{ color: T.text }}>{fmt(det)}</strong> = <M tex="\lambda_1\lambda_2" /></span>
          <span>disc = <strong style={{ color: disc < 0 ? T.red : T.green }}>{fmt(disc)}</strong></span>
        </div>
      </div>
    </div>
  );
}

// ─── Пошаговый метод Гаусса для 2×2 ──────────────────────────────────────────

function EigenStepsAnim() {
  const steps = [
    {
      label: 'Составляем A − λI',
      content: <F tex="A - \\lambda I = \\begin{pmatrix}2-\\lambda & 1 \\\\ 1 & 2-\\lambda\\end{pmatrix}" />,
      note: 'Вычитаем λ из каждого диагонального элемента',
    },
    {
      label: 'Характеристическое уравнение',
      content: <F tex="\\det(A-\\lambda I) = (2-\\lambda)^2 - 1 = 0" />,
      note: 'Приравниваем определитель к нулю',
    },
    {
      label: 'Раскрываем и решаем',
      content: <F tex="\\lambda^2 - 4\\lambda + 3 = (\\lambda-1)(\\lambda-3) = 0" />,
      note: 'Факторизуем характеристический многочлен',
    },
    {
      label: 'Собственные значения',
      content: (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '10px 0' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.green, background: T.greenLight, borderRadius: 20, padding: '6px 18px' }}>λ₁ = 1</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.primary, background: T.primaryLight, borderRadius: 20, padding: '6px 18px' }}>λ₂ = 3</span>
        </div>
      ),
      note: 'σ(A) = {1, 3} — спектр матрицы',
    },
  ];
  const [step, setStep] = useState(0);
  const s = steps[step];

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', margin: '18px 0' }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>Характеристическое уравнение — шаг за шагом</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted }}>{step + 1} / {steps.length}</span>
      </div>
      <div style={{ padding: '18px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{s.label}</div>
        <div style={{ background: T.surface, borderRadius: 12, padding: '4px 12px', marginBottom: 8 }}>{s.content}</div>
        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{s.note}</div>
      </div>
      <div style={{ padding: '10px 18px 14px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, fontWeight: 700, color: step === 0 ? T.mutedLight : T.text, cursor: step === 0 ? 'default' : 'pointer' }}>← Назад</button>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1} style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.primary, fontSize: 12, fontWeight: 700, color: T.white, cursor: step === steps.length - 1 ? 'default' : 'pointer', opacity: step === steps.length - 1 ? 0.5 : 1 }}>Вперёд →</button>
        <button onClick={() => setStep(0)} style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, fontWeight: 600, color: T.muted, cursor: 'pointer' }}>
          <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />Сначала
        </button>
      </div>
    </div>
  );
}

// ─── Анимация: линейная оболочка (span) ──────────────────────────────────────

function SpanAnimation() {
  const frames = [
    { label: '1 вектор → прямая', desc: 'Один собственный вектор натягивает прямую из начала координат', color: T.red },
    { label: '2 независимых → плоскость', desc: 'Два собственных вектора под углом — своя система координат', color: T.primary },
    { label: 'Зависимый вектор — лишний', desc: 'Третий вектор в той же плоскости ничего нового не даёт', color: T.muted },
    { label: 'Коллинеарные = кратность', desc: 'Два параллельных вектора — только прямая, кратное собственное значение', color: T.amber },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % frames.length), 2400);
    return () => clearInterval(t);
  }, []);

  const f = frames[active];
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', margin: '18px 0' }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>Геометрия собственных подпространств</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted }}>кадр {active + 1} / {frames.length}</span>
      </div>
      <div style={{ padding: '18px 22px', minHeight: 110, display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width={80} height={80} viewBox="-1 -1 102 102">
          <rect x={0} y={0} width={100} height={100} rx={12} fill={`${f.color}08`} stroke={`${f.color}20`} strokeWidth={1} />
          {active === 0 && <line x1={10} y1={90} x2={90} y2={10} stroke={T.red} strokeWidth={2.5} strokeLinecap="round" />}
          {active === 1 && <>
            <rect x={5} y={5} width={90} height={90} rx={8} fill={`${T.primary}10`} />
            <line x1={50} y1={50} x2={85} y2={20} stroke={T.primary} strokeWidth={2.5} strokeLinecap="round" />
            <line x1={50} y1={50} x2={20} y2={20} stroke={T.green} strokeWidth={2.5} strokeLinecap="round" />
          </>}
          {active === 2 && <>
            <rect x={5} y={5} width={90} height={90} rx={8} fill={`${T.primary}10`} />
            <line x1={50} y1={50} x2={85} y2={20} stroke={T.primary} strokeWidth={2.5} strokeLinecap="round" />
            <line x1={50} y1={50} x2={20} y2={20} stroke={T.green} strokeWidth={2.5} strokeLinecap="round" />
            <line x1={50} y1={50} x2={70} y2={35} stroke={T.muted} strokeWidth={2} strokeLinecap="round" strokeDasharray="4,3" />
          </>}
          {active === 3 && <>
            <line x1={20} y1={70} x2={80} y2={30} stroke={T.red} strokeWidth={2.5} strokeLinecap="round" />
            <line x1={25} y1={75} x2={75} y2={35} stroke={T.amber} strokeWidth={2.5} strokeLinecap="round" />
          </>}
        </svg>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: f.color, marginBottom: 4 }}>{f.label}</div>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{f.desc}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '10px 18px 14px', justifyContent: 'center' }}>
        {frames.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: 8, height: 8, borderRadius: '50%', background: i === active ? T.primary : T.border, border: 'none', cursor: 'pointer', padding: 0, transition: 'background 0.2s' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Самопроверка ─────────────────────────────────────────────────────────────

function CheckQuestions() {
  const questions = [
    {
      q: 'Каковы собственные значения диагональной матрицы diag(5, 0, −2)?',
      options: ['5, 0, −2', '0, 5, −2', '5, −2 (ноль не собственное значение)', 'Нельзя определить без вычислений'],
      correct: 0,
      explanation: 'Для диагональной матрицы собственные значения — элементы на диагонали: 5, 0 и −2. λ = 0 тоже является собственным значением и означает вырожденность матрицы.',
    },
    {
      q: 'Может ли вещественная матрица 2×2 не иметь вещественных собственных значений?',
      options: ['Нет — вещественная матрица всегда даёт вещественные λ', 'Да, если матрица несимметрична', 'Да — матрица поворота пример', 'Только если det(A) < 0'],
      correct: 2,
      explanation: 'Матрица поворота [[0,−1],[1,0]] — классический пример. λ² + 1 = 0, корни ±i. Вещественные λ гарантированы только у симметричных матриц.',
    },
    {
      q: 'Сумма собственных значений матрицы A = [[3,1],[0,5]] равна:',
      options: ['8', '15', '2', '−2'],
      correct: 0,
      explanation: 'tr(A) = 3 + 5 = 8 = λ₁ + λ₂. Для треугольной матрицы собственные значения — элементы диагонали (3 и 5), их сумма равна следу.',
    },
    {
      q: 'У матрицы 3×3 ранг равен 2. Сколько нулевых собственных значений?',
      options: ['0', '1', '2', 'Нельзя определить'],
      correct: 1,
      explanation: 'dim ker = n − rank = 3 − 2 = 1. Ядро одномерно, λ = 0 входит в спектр с алгебраической кратностью ≥ 1. Если матрица диагонализуема — ровно одно.',
    },
    {
      q: 'Что означает комплексное собственное значение λ = a + bi для вещественной матрицы?',
      options: ['Матрица вырождена', 'Преобразование содержит поворот (b ≠ 0) и, возможно, масштаб (a ≠ 0)', 'У матрицы нет собственных векторов вообще', 'Матрица не диагонализуема'],
      correct: 1,
      explanation: 'a + bi кодирует: a — масштабирование (рост/затухание), b — вращение. Вещественных собственных векторов нет, но комплексные существуют. Для вещественных матриц такие λ всегда идут парами a ± bi.',
    },
  ];

  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {questions.map((q, qi) => {
        const chosen = answers[qi];
        const show = revealed[qi];
        return (
          <div key={qi} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 22px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12, lineHeight: 1.5 }}>
              <span style={{ color: T.primary, fontWeight: 800 }}>{qi + 1}. </span>{q.q}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi, isCorrect = oi === q.correct;
                let bg = T.surface, border = T.border, color = T.text;
                if (show) {
                  if (isCorrect) { bg = T.greenLight; border = T.green; color = '#065f46'; }
                  else if (isChosen && !isCorrect) { bg = T.redLight; border = T.red; color = '#991b1b'; }
                }
                return (
                  <button key={oi} onClick={() => { setAnswers(a => ({ ...a, [qi]: oi })); }}
                    style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 10, border: `1px solid ${isChosen && !show ? T.primary : border}`, background: isChosen && !show ? T.primaryLight : bg, color, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontWeight: isChosen ? 600 : 400 }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {chosen !== undefined && !show && (
              <button onClick={() => setRevealed(r => ({ ...r, [qi]: true }))}
                style={{ marginTop: 10, padding: '6px 14px', borderRadius: 10, background: T.primary, color: T.white, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Проверить
              </button>
            )}
            {show && (
              <div style={{ marginTop: 10, background: `${T.green}0f`, border: `1px solid ${T.green}30`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: T.text, lineHeight: 1.65 }}>
                <CheckCircle2 size={13} color={T.green} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function EigenvaluesTheoryRich() {
  const navSections = [
    { id: 'why',        label: 'Зачем это' },
    { id: 'geometry',   label: 'Геометрия' },
    { id: 'det',        label: 'Определитель' },
    { id: 'chareq',     label: 'Хар. уравнение' },
    { id: 'example2x2', label: 'Пример 2×2' },
    { id: 'properties', label: 'Свойства' },
    { id: 'complex',    label: 'Комплексные λ' },
    { id: 'example3x3', label: 'Пример 3×3' },
    { id: 'diag',       label: 'Диагонализация' },
    { id: 'nodiag',     label: 'Когда нельзя' },
    { id: 'interactive',label: 'Интерактив' },
    { id: 'ds',         label: 'Data Science' },
    { id: 'check',      label: 'Проверь себя' },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Заголовок ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Sigma size={15} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: T.primary, textTransform: 'uppercase' }}>Линейная алгебра</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, color: T.muted }}>около 25 минут</span>
        </div>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>Собственные значения и векторы</h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16 }}>«Любимые направления» матрицы — основа PCA, PageRank и устойчивости динамических систем.</p>
      </div>

      {/* ── Навигация ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 48 }}>
        {navSections.map(s => (
          <a key={s.id} href={`#${s.id}`} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${T.primary}0f`, color: T.primary, border: `1px solid ${T.primaryBorder}`, textDecoration: 'none' }}>
            {s.label}
          </a>
        ))}
      </div>

      {/* ── 0. Зачем это нужно ── */}
      <section id="why" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sparkles} label="Мотивация" title="Зачем это вообще нужно" />

        <div style={{ background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Кейс 1 — Google PageRank (1998)</div>
          <p style={{ margin: '0 0 10px', color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Брин и Пейдж представили интернет как матрицу переходов <M tex="500\,000\,000 \times 500\,000\,000" />. Нужно было найти особый вектор, который <strong>не меняет направления</strong> при умножении на матрицу. Этот вектор и стал показателем важности страниц.
          </p>
          <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Это был <strong>самый дорогой собственный вектор в истории</strong>.
          </p>
        </div>

        <div style={{ background: `${T.violet}08`, border: `1px solid ${T.violet}30`, borderRadius: 20, padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.violet, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Кейс 2 — PCA в биоинформатике</div>
          <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            10 000 генов, 500 пациентов — матрица <M tex="500 \times 10\,000" />, чудовищная размерность. Оказывается, вся вариация объясняется 5–10 скрытыми факторами. Найти их — значит найти <strong>собственные векторы ковариационной матрицы</strong>. Это PCA — основа анализа данных во всех науках.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { n: '1', title: 'Уравнение Ax = λx', d: 'Вектор только растягивается, не поворачивается', color: T.primary },
            { n: '2', title: 'Определитель', d: 'Инструмент нахождения λ', color: T.violet },
            { n: '3', title: 'Спектр σ(A)', d: 'Множество всех собственных значений', color: T.green },
            { n: '4', title: 'Диагонализация', d: 'A = VΛV⁻¹ — сердце метода', color: T.amber },
            { n: '5', title: 'Кратность', d: 'Алгебраическая vs геометрическая', color: T.cyan },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{item.n}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>

        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Метафора: линза и особые лучи</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            Большинство лучей через линзу преломляются — меняют направление. Но есть особые лучи через оптический центр: они не преломляются. Линза делает их <strong>ярче</strong> (<M tex="\lambda > 1" />) или <strong>тусклее</strong> (<M tex="0 < \lambda < 1" />), но направление остаётся.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.amber, background: T.amberLight, borderRadius: 20, padding: '3px 12px' }}>Такой луч = собственный вектор</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.primary, background: T.primaryLight, borderRadius: 20, padding: '3px 12px' }}>Коэффициент усиления = λ</span>
          </div>
        </Card>
      </section>

      {/* ── 1. Геометрия ── */}
      <section id="geometry" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Понятие 1" title="Что мы ищем — геометрически" color={T.green} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
          Матрица <M tex="A" /> размера <M tex="n \times n" /> — линейное преобразование. В общем случае <M tex="Ax" /> отличается от <M tex="x" /> и по длине, и по направлению. Нас интересуют ненулевые векторы, для которых <M tex="Ax" /> <strong>коллинеарен</strong> <M tex="x" />.
        </p>

        <FBox
          tex="Ax = \lambda x, \quad x \neq 0"
          hint="x — собственный вектор, λ — собственное значение"
        />

        <Card>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Геометрический смысл λ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            {[
              { cond: 'λ > 1', desc: 'Растяжение вдоль вектора', color: T.green },
              { cond: '0 < λ < 1', desc: 'Сжатие', color: T.primary },
              { cond: 'λ = 1', desc: 'Вектор не изменился', color: T.cyan },
              { cond: 'λ = 0', desc: 'Схлопывается в 0 (ядро)', color: T.muted },
              { cond: 'λ < 0', desc: 'Переворот + масштаб |λ|', color: T.red },
            ].map(item => (
              <div key={item.cond} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                <code style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.cond}</code>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <EllipseAnim />
        <HedgehogAnim />
        <SpanAnimation />

        <VideoPlaceholder
          title="Собственный вектор не поворачивается"
          desc="Множество векторов под действием A — большинство меняют направление. Два красных (собственных) остаются на своих прямых, лишь масштабируясь"
          duration="20 сек"
          badge="Визуализация 1"
        />
      </section>

      {/* ── 2. Определитель ── */}
      <section id="det" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Grid3X3} label="Инструмент" title="Определитель — необходимый инструмент" color={T.amber} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
          Чтобы находить собственные значения, нам понадобится определитель. Введём его в объёме, достаточном для нашей цели.
        </p>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Определитель 2×2</div>
          <FBox tex="\det\begin{pmatrix}a&b\\c&d\end{pmatrix} = ad - bc" color={T.amber} hint="«Главная диагональ минус побочная»" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Пример:</div>
              <F tex="\det\begin{pmatrix}1&2\\3&4\end{pmatrix} = 4 - 6 = -2" />
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Диагональная:</div>
              <F tex="\det\begin{pmatrix}2&0\\0&3\end{pmatrix} = 6" />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Геометрический смысл</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            <M tex="|\det A|" /> — площадь параллелограмма на столбцах матрицы. Если <M tex="\det A = 0" /> — столбцы коллинеарны, матрица вырождена.
          </p>
          <Callout color={T.amber} title="Ключевой факт — нужен прямо сейчас">
            <M tex="\det A = 0 \iff A \text{ вырождена} \iff \text{столбцы зависимы} \iff \operatorname{rank}(A) < n" />
          </Callout>
        </Card>
      </section>

      {/* ── 3. Характеристическое уравнение ── */}
      <section id="chareq" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Метод" title="Характеристическое уравнение" />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Перепишем <M tex="Ax = \lambda x" /> шаг за шагом, чтобы свести задачу к нахождению корней полинома.
        </p>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Вывод уравнения</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { step: '1', tex: 'Ax - \\lambda x = 0', note: 'Переносим всё в одну сторону' },
              { step: '2', tex: '(A - \\lambda I)x = 0', note: 'Выносим x, помня что x = Ix' },
              { step: '3', tex: '\\det(A - \\lambda I) = 0', note: 'Ненулевое решение ⟺ матрица вырождена' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: T.primaryLight, color: T.primary, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 8 }}>{item.step}</div>
                <div style={{ flex: 1 }}>
                  <F tex={item.tex} />
                  <div style={{ fontSize: 12, color: T.muted, marginTop: -4 }}>{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <FBox tex="\det(A - \lambda I) = 0" hint="Характеристическое уравнение матрицы A" />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 14 }}>
          Левая часть — <strong>характеристический многочлен</strong> степени <M tex="n" /> от <M tex="\lambda" />. Его корни <M tex="\lambda_1, \ldots, \lambda_n" /> — собственные значения. Множество всех собственных значений называется <strong>спектром</strong>: <M tex="\sigma(A)" />.
        </p>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Алгоритм</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Составить A − λI (вычесть λ из каждого диагонального элемента)',
              'Приравнять определитель к нулю → характеристическое уравнение',
              'Найти корни λ₁, …, λₙ — это собственные значения (спектр)',
              'Для каждого λᵢ решить систему (A − λᵢI)x = 0 → собственные векторы',
              'Проверить: Avᵢ = λᵢvᵢ',
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `${T.primary}15`, color: T.primary, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, paddingTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>
        </Card>

        <EigenStepsAnim />
      </section>

      {/* ── 4. Полная прогонка 2×2 ── */}
      <section id="example2x2" style={{ marginBottom: 52 }}>
        <SectionHeader icon={BookOpen} label="Пример 1" title="Полная прогонка: матрица 2×2" color={T.green} />

        <FBox tex="A = \begin{pmatrix}2 & 1 \\ 1 & 2\end{pmatrix}" color={T.green} />

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 1 — составляем A − λI</div>
              <F tex="A - \lambda I = \begin{pmatrix}2-\lambda & 1 \\ 1 & 2-\lambda\end{pmatrix}" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 2–3 — характеристическое уравнение</div>
              <F tex="\det(A-\lambda I) = (2-\lambda)^2 - 1 = \lambda^2 - 4\lambda + 3 = (\lambda-1)(\lambda-3) = 0" />
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.green, background: T.greenLight, borderRadius: 20, padding: '4px 14px' }}>λ₁ = 1</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.primary, background: T.primaryLight, borderRadius: 20, padding: '4px 14px' }}>λ₂ = 3</span>
                <span style={{ fontSize: 12, color: T.muted, alignSelf: 'center' }}>σ(A) = {'{'}1, 3{'}'}</span>
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <Card style={{ borderTop: `3px solid ${T.green}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>λ₁ = 1 → собственный вектор</div>
            <F tex="(A-I)x=0 \Rightarrow \begin{pmatrix}1&1\\1&1\end{pmatrix}x=0" />
            <p style={{ margin: '4px 0 6px', fontSize: 13, color: T.text }}>
              <M tex="x_1 + x_2 = 0" /> → <M tex="x_2 = -x_1" />
            </p>
            <F tex="v_1 = \begin{pmatrix}1\\-1\end{pmatrix}" />
          </Card>
          <Card style={{ borderTop: `3px solid ${T.primary}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>λ₂ = 3 → собственный вектор</div>
            <F tex="(A-3I)x=0 \Rightarrow \begin{pmatrix}-1&1\\1&-1\end{pmatrix}x=0" />
            <p style={{ margin: '4px 0 6px', fontSize: 13, color: T.text }}>
              <M tex="-x_1 + x_2 = 0" /> → <M tex="x_1 = x_2" />
            </p>
            <F tex="v_2 = \begin{pmatrix}1\\1\end{pmatrix}" />
          </Card>
        </div>

        <Card style={{ borderLeft: `4px solid ${T.green}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Проверка (обязательно!)</div>
          <F tex="Av_1 = \begin{pmatrix}2&1\\1&2\end{pmatrix}\begin{pmatrix}1\\-1\end{pmatrix} = \begin{pmatrix}1\\-1\end{pmatrix} = 1\cdot v_1\;\checkmark" />
          <F tex="Av_2 = \begin{pmatrix}2&1\\1&2\end{pmatrix}\begin{pmatrix}1\\1\end{pmatrix} = \begin{pmatrix}3\\3\end{pmatrix} = 3\cdot v_2\;\checkmark" />
        </Card>

        <Callout color={T.primary} title="Что мы узнали">
          Матрица A имеет два собственных направления: вдоль <M tex="(1,-1)" /> — без растяжения (<M tex="\lambda=1" />), вдоль <M tex="(1,1)" /> — растяжение в 3 раза (<M tex="\lambda=3" />). Так как <M tex="A = A^\top" />, эти направления ортогональны: <M tex="v_1 \cdot v_2 = 0" />.
        </Callout>
      </section>

      {/* ── 5. Свойства ── */}
      <section id="properties" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Шпаргалка" title="Ключевые свойства" color={T.violet} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: '1', label: 'След и определитель', tex: '\\operatorname{tr}(A) = \\lambda_1 + \\cdots + \\lambda_n,\\quad \\det A = \\lambda_1 \\cdot \\lambda_2 \\cdots \\lambda_n', color: T.violet, note: 'Для примера выше: след = 4 = 1+3 ✓, det = 3 = 1·3 ✓' },
            { n: '2', label: 'Векторы для разных λ линейно независимы', tex: '\\lambda_i \\neq \\lambda_j \\Rightarrow v_i \\text{ и } v_j \\text{ не коллинеарны}', color: T.cyan, note: 'Матрица не может растягивать один вектор в разное число раз одновременно' },
            { n: '3', label: 'Симметричная матрица A = Aᵀ', tex: 'A = A^\\top \\Rightarrow \\text{все } \\lambda \\in \\mathbb{R},\\; v_i \\perp v_j \\text{ при } \\lambda_i \\neq \\lambda_j', color: T.green, note: 'PCA основан именно на симметричных матрицах (ковариационных)' },
            { n: '4', label: 'Нулевое собственное значение', tex: '\\lambda = 0 \\iff \\det A = 0 \\iff A \\text{ вырождена}', color: T.amber, note: 'Собственное подпространство для λ = 0 — это ядро ker(A)' },
            { n: '5', label: 'Степень матрицы', tex: 'A^k v = \\lambda^k v', color: T.pink, note: 'Если v — собственный вектор с λ, то он же — собственный вектор Aᵏ с λᵏ' },
          ].map(item => (
            <div key={item.n} style={{ display: 'flex', gap: 12, background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 18px', alignItems: 'flex-start' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{item.n}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                <F tex={item.tex} />
                {item.note && <div style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{item.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Комплексные λ ── */}
      <section id="complex" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Расширение" title="Комплексные собственные значения" color={T.red} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
          Уравнение <M tex="\lambda^2 + 1 = 0" /> не имеет вещественных корней. А именно такое получается из матрицы поворота на 90°.
        </p>

        <Card style={{ borderTop: `3px solid ${T.red}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 8 }}>Матрица поворота на 90°</div>
          <F tex="A = \begin{pmatrix}0 & -1 \\ 1 & 0\end{pmatrix} \Rightarrow \det(A-\lambda I) = \lambda^2 + 1 = 0 \Rightarrow \lambda_{1,2} = \pm i" />
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
            Любой вектор поворачивается на 90° — ни один не остаётся на прямой. Вещественных собственных векторов нет.
          </p>
        </Card>

        <RotationAnim />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Пример: растяжение + поворот</div>
          <F tex="A = \begin{pmatrix}1 & -1 \\ 1 & 1\end{pmatrix} \Rightarrow (1-\lambda)^2+1=0 \Rightarrow \lambda = 1 \pm i" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>Вещественная часть a = 1</div>
              <div style={{ fontSize: 13, color: T.text, marginTop: 4 }}>Масштабирование (растяжение/сжатие)</div>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>Мнимая часть b = ±1</div>
              <div style={{ fontSize: 13, color: T.text, marginTop: 4 }}>Вращение (угол поворота)</div>
            </div>
          </div>
        </Card>

        <Callout color={T.primary} title="Важный факт">
          Если матрица вещественная, комплексные λ идут <strong>парами</strong>: <M tex="a + bi" /> и <M tex="a - bi" />. У симметричных матриц все λ гарантированно вещественны.
        </Callout>

        <VideoPlaceholder
          title="Комплексные λ = спираль"
          desc="Вектор под действием матрицы с λ = a ± bi описывает логарифмическую спираль: a — рост/затухание, b — угол поворота за шаг"
          duration="18 сек"
          badge="Визуализация 2"
        />
      </section>

      {/* ── 7. Пример 3×3 ── */}
      <section id="example3x3" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Grid3X3} label="Пример 2" title="Матрица 3×3 с кратным λ" color={T.cyan} />

        <FBox tex="A = \begin{pmatrix}1&0&0\\0&2&1\\0&1&2\end{pmatrix}" color={T.cyan} />

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Характеристическое уравнение</div>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: T.muted }}>Раскладываем по первой строке (много нулей):</p>
              <F tex="\det(A-\lambda I) = (1-\lambda)\cdot\bigl[(2-\lambda)^2-1\bigr] = -({\lambda-1})^2(\lambda-3) = 0" />
              <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.amber, background: T.amberLight, borderRadius: 20, padding: '4px 14px' }}>λ₁ = 1 (кратность 2)</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.primary, background: T.primaryLight, borderRadius: 20, padding: '4px 14px' }}>λ₂ = 3 (кратность 1)</span>
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <Card style={{ borderTop: `3px solid ${T.amber}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.amber, textTransform: 'uppercase', marginBottom: 8 }}>λ₁ = 1 — два вектора</div>
            <F tex="A-I = \begin{pmatrix}0&0&0\\0&1&1\\0&1&1\end{pmatrix}" />
            <p style={{ margin: '4px 0 6px', fontSize: 13, color: T.muted }}><M tex="x_1" /> свободна, <M tex="x_2 + x_3 = 0" /></p>
            <F tex="v_1=\begin{pmatrix}1\\0\\0\end{pmatrix},\quad v_2=\begin{pmatrix}0\\1\\-1\end{pmatrix}" />
          </Card>
          <Card style={{ borderTop: `3px solid ${T.primary}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>λ₂ = 3 — один вектор</div>
            <F tex="A-3I = \begin{pmatrix}-2&0&0\\0&-1&1\\0&1&-1\end{pmatrix}" />
            <p style={{ margin: '4px 0 6px', fontSize: 13, color: T.muted }}><M tex="x_1=0,\; x_2=x_3" /></p>
            <F tex="v_3 = \begin{pmatrix}0\\1\\1\end{pmatrix}" />
          </Card>
        </div>

        <Callout color={T.green} title="Итог">
          Три линейно независимых собственных вектора — матрица <strong>диагонализуема</strong>. Для <M tex="\lambda = 1" />: геометрическая кратность (2) = алгебраической (2). Проверяем: <M tex="2 + 1 = 3 = n\;\checkmark" />
        </Callout>
      </section>

      {/* ── 8. Диагонализация ── */}
      <section id="diag" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Brain} label="Главная идея" title="Диагонализация: A = VΛV⁻¹" />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 14 }}>
          Если у матрицы <M tex="A" /> порядка <M tex="n" /> нашлось <M tex="n" /> линейно независимых собственных векторов — собираем их в матрицу <M tex="V" /> (столбцами), а значения — в диагональную <M tex="\Lambda" />:
        </p>

        <FBox tex="A = V\Lambda V^{-1}, \quad V = [v_1 \mid \cdots \mid v_n], \quad \Lambda = \operatorname{diag}(\lambda_1, \ldots, \lambda_n)" />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Геометрический смысл: три шага</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { op: 'V⁻¹', desc: 'Переход в базис из собственных векторов (поворот)', color: T.violet },
              { op: 'Λ', desc: 'Растяжение/сжатие вдоль каждого собственного направления', color: T.green },
              { op: 'V', desc: 'Возврат в исходный базис (обратный поворот)', color: T.primary },
            ].map(item => (
              <div key={item.op} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 40, height: 32, borderRadius: 8, background: `${item.color}18`, color: item.color, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', flexShrink: 0 }}>{item.op}</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Польза диагонализации</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
            {[
              { label: 'Степень матрицы', tex: 'A^k = V\\Lambda^k V^{-1}', note: 'λᵢᵏ на диагонали — мгновенно', color: T.primary },
              { label: 'Экспонента', tex: 'e^A = V\\,e^\\Lambda V^{-1}', note: 'Нужна в диффурах и нейросетях', color: T.violet },
              { label: 'Системы уравнений', tex: 'Ax=b \\Rightarrow \\Lambda y = c', note: 'В новом базисе — независимые уравнения', color: T.green },
            ].map(item => (
              <div key={item.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.label}</div>
                <F tex={item.tex} />
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{item.note}</div>
              </div>
            ))}
          </div>
        </Card>

        <VideoPlaceholder
          title="Диагонализация: три шага"
          desc="Окружность → V⁻¹ (поворот в собственный базис) → Λ (растяжение в эллипс) → V (обратный поворот). Итог совпадает с прямым применением A"
          duration="25 сек"
          badge="Визуализация 3"
        />
      </section>

      {/* ── 9. Когда нельзя ── */}
      <section id="nodiag" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Ограничения" title="Когда диагонализовать нельзя" color={T.amber} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
          <Card style={{ borderLeft: `4px solid ${T.primary}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>Алгебраическая кратность</div>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>Сколько раз <M tex="\lambda_i" /> встречается как корень характеристического многочлена.</p>
          </Card>
          <Card style={{ borderLeft: `4px solid ${T.violet}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>Геометрическая кратность</div>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>Число линейно независимых собственных векторов для <M tex="\lambda_i" /> — размерность собственного подпространства.</p>
          </Card>
        </div>

        <Callout color={T.amber} title="Критерий диагонализуемости">
          Матрица диагонализуема <strong>тогда и только тогда</strong>, когда для каждого <M tex="\lambda" /> геометрическая кратность = алгебраической. Всегда: геометрическая ≤ алгебраической.
        </Callout>

        <Card style={{ borderTop: `3px solid ${T.red}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 8 }}>«Дефектный» пример — жорданова клетка</div>
          <F tex="A = \begin{pmatrix}1 & 1 \\ 0 & 1\end{pmatrix} \Rightarrow (1-\lambda)^2 = 0 \Rightarrow \lambda=1 \text{ (алг. кратность 2)}" />
          <F tex="(A-I)x=0 \Rightarrow \begin{pmatrix}0&1\\0&0\end{pmatrix}x=0 \Rightarrow x_2=0" />
          <p style={{ margin: '8px 0 0', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
            Только один вектор <M tex="(1,0)^\top" />. Геометрическая кратность = 1 &lt; 2. Матрица не просто растягивает, но и «сдвигает» — это нельзя представить как чистые растяжения вдоль осей. <strong>Диагонализовать нельзя.</strong>
          </p>
        </Card>
      </section>

      {/* ── 10. Интерактив ── */}
      <section id="interactive" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Интерактив" title="Изучи спектр матрицы сам" color={T.green} />
        <SpectrumSlider />
        <Callout color={T.primary} title="Попробуй">
          Получи комплексные собственные значения: уменьши <M tex="a = d" /> и увеличь <M tex="|b|, |c|" />. Когда дискриминант <M tex="\operatorname{tr}^2 - 4\det < 0" /> — λ становятся комплексными.
        </Callout>
      </section>

      {/* ── 11. Data Science ── */}
      <section id="ds" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Code2} label="Применение" title="Собственные значения в Data Science" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            {
              title: 'PCA — снижение размерности',
              formula: 'C = \\tfrac{1}{n-1}X^\\top X,\\quad C v_i = \\lambda_i v_i',
              desc: 'Собственные векторы ковариационной матрицы — главные компоненты. Собственные значения — дисперсия вдоль этих осей. k наибольших λ → снижение размерности с максимальным сохранением информации.',
              ops: ['симм. матрица', 'вещественные λ', 'ортогональный базис'],
              color: T.primary,
            },
            {
              title: 'Спектральная кластеризация',
              formula: 'L = D - W,\\quad Lv = \\lambda v',
              desc: 'k-means пасует на запутанных кластерах. Матрица Лапласа графа + её собственные векторы для наименьших λ → кластеры разделяются в пространстве этих векторов.',
              ops: ['наименьшие λ', 'граф-Лапласиан'],
              color: T.violet,
            },
            {
              title: 'PageRank',
              formula: 'Mx^* = x^*,\\quad x_{k+1} = Mx_k',
              desc: 'Матрица переходов M. Собственный вектор для λ = 1 — стационарное распределение вероятностей = важность страниц. Итерация сходится к нему — метод степеней.',
              ops: ['λ = 1', 'метод степеней', 'стационарное'],
              color: T.green,
            },
            {
              title: 'Устойчивость систем',
              formula: 'x_{t+1} = Ax_t \\Rightarrow x_t = A^t x_0',
              desc: 'Все |λᵢ| < 1 → система затухает (устойчива). Есть |λᵢ| > 1 → взрывной рост. Комплексные λ → колебания. Работает в моделях экономики, экологии, управления.',
              ops: ['|λ| < 1: устойчиво', '|λ| > 1: взрыв', 'комплексные: колеб.'],
              color: T.amber,
            },
          ].map(item => (
            <Card key={item.title} style={{ borderTop: `3px solid ${item.color}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 8 }}>{item.title}</div>
              <div style={{ marginBottom: 10 }}><F tex={item.formula} /></div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 10 }}>{item.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {item.ops.map(op => (
                  <span key={op} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: `${item.color}12`, color: item.color, fontWeight: 600 }}>{op}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 12. Самопроверка ── */}
      <section id="check" style={{ marginBottom: 52 }}>
        <SectionHeader icon={CheckCircle2} label="Самопроверка" title="Проверь себя" color={T.amber} />
        <CheckQuestions />
      </section>

      {/* Footer */}
      <div style={{ background: T.primaryLight, borderRadius: 20, padding: '22px 28px', border: `1px solid ${T.primaryBorder}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <Sparkles size={18} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, color: T.primaryDark, marginBottom: 4 }}>Следующие шаги</div>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
            Переходи к <strong>Разборам</strong> — там пошаговые задачи на поиск λ и v. После — Лаборатория: стенд «Матрица-трансформер» покажет собственные векторы в интерактивном режиме в реальном времени.
          </div>
        </div>
      </div>
    </div>
  );
}
