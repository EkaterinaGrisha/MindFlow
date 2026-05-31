// @ts-nocheck
/**
 * Theory-rich body for «Производная и градиент».
 * Только статичные SVG-иллюстрации — никаких canvas/интерактивов.
 * Паттерн: SectionHeader, Card, FBox, DSNote, Callout, CheckQuestions.
 * Цветовая палитра T (единая с остальными темами).
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, Brain, Zap, Layers, CheckCircle2,
  Sparkles, ArrowRight, Code2, Target, Activity,
  TrendingDown, GitMerge,
} from 'lucide-react';
import { MarkdownRenderer } from '../../MarkdownRenderer';

// ─── Palette ──────────────────────────────────────────────────────────────────
const T = {
  text: '#1e293b', muted: '#64748b', mutedLight: '#94a3b8',
  primary: '#6366f1', primaryLight: '#eef2ff', primaryBorder: '#c7d2fe', primaryDark: '#4f46e5',
  accent: '#7c3aed', green: '#10b981', greenLight: '#d1fae5',
  amber: '#f59e0b', amberLight: '#fef3c7', red: '#ef4444', redLight: '#fee2e2',
  white: '#ffffff', surface: '#f8fafc', border: '#e2e8f0',
  cyan: '#06b6d4', violet: '#8b5cf6', pink: '#ec4899',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function F({ tex }: { tex: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 4px' }}>
      <MarkdownRenderer content={`$$${tex}$$`} />
    </div>
  );
}
function M({ tex }: { tex: string }) {
  return (
    <span style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: 1 }}>
      <MarkdownRenderer content={`$${tex}$`} />
    </span>
  );
}
function FBox({ tex, hint, color = T.primary }: { tex: string; hint?: string; color?: string }) {
  const bg = color === T.primary ? T.primaryLight : `${color}12`;
  const border = color === T.primary ? T.primaryBorder : `${color}40`;
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: '16px 22px', margin: '14px 0', textAlign: 'center' }}>
      <MarkdownRenderer content={`$$${tex}$$`} />
      {hint && <div style={{ fontSize: 12, color: T.accent, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}
function SectionHeader({ icon: Icon, label, title, color = T.primary }: any) {
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
function Card({ children, style }: any) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 22px', marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}
function DSNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: `${T.cyan}0f`, border: `1px solid ${T.cyan}33`, borderRadius: 12, padding: '13px 18px', margin: '18px 0', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
      <span style={{ fontWeight: 700, color: T.cyan }}>В Data Science: </span>{children}
    </div>
  );
}
function Callout({ color = T.amber, title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 12, padding: '13px 18px', margin: '14px 0' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG ILLUSTRATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Иллюстрация 1: Секущая → касательная */
function IllustrationSecantTangent() {
  // f(x) = x², parabola in [0, 2.6], point a=1
  const W = 360, H = 260;
  const xMin = -0.2, xMax = 2.8, yMin = -0.2, yMax = 5.5;
  const tx = (x: number) => ((x - xMin) / (xMax - xMin)) * (W - 50) + 30;
  const ty = (y: number) => H - 18 - ((y - yMin) / (yMax - yMin)) * (H - 36);

  const f = (x: number) => x * x;
  const a = 1.0, fa = f(a); // fixed point A
  const h = 1.0; // secant: B at a+h
  const b = a + h, fb = f(b);
  const secSlope = (fb - fa) / h;
  const tanSlope = 2 * a; // f'(a) = 2a

  // Curve points
  const curve: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = xMin + (i / 100) * (xMax - xMin);
    curve.push(`${tx(x)},${ty(f(x))}`);
  }

  // Secant line y = fa + secSlope*(x-a)
  const sec = (x: number) => fa + secSlope * (x - a);
  // Tangent line y = fa + tanSlope*(x-a)
  const tan = (x: number) => fa + tanSlope * (x - a);

  const sx1 = tx(-0.1), sy1 = ty(sec(-0.1)), sx2 = tx(2.5), sy2 = ty(sec(2.5));
  const tanx1 = tx(-0.1), tany1 = ty(tan(-0.1)), tanx2 = tx(2.7), tany2 = ty(tan(2.7));

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: секущая стремится к касательной
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto' }}>
        {/* Grid */}
        {[0, 1, 2].map(i => (
          <g key={i}>
            <line x1={tx(i)} y1={18} x2={tx(i)} y2={H - 16} stroke={T.border} strokeWidth="0.7" />
            <text x={tx(i)} y={H - 4} textAnchor="middle" fontSize="10" fill={T.muted}>{i}</text>
          </g>
        ))}
        {[1, 2, 3, 4].map(i => (
          <g key={i}>
            <line x1={28} y1={ty(i)} x2={W - 18} y2={ty(i)} stroke={T.border} strokeWidth="0.7" />
            <text x={24} y={ty(i) + 4} textAnchor="end" fontSize="10" fill={T.muted}>{i}</text>
          </g>
        ))}
        {/* Axes */}
        <line x1={28} y1={H - 16} x2={W - 12} y2={H - 16} stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={tx(0)} y1={14} x2={tx(0)} y2={H - 14} stroke={T.mutedLight} strokeWidth="1.5" />
        <text x={W - 10} y={H - 12} fontSize="11" fill={T.muted}>x</text>
        <text x={tx(0) + 4} y={14} fontSize="11" fill={T.muted}>y</text>

        {/* Secant */}
        <line x1={sx1} y1={sy1} x2={sx2} y2={sy2}
          stroke={T.amber} strokeWidth="2" strokeDasharray="7,4" strokeLinecap="round" />

        {/* Tangent */}
        <line x1={tanx1} y1={tany1} x2={tanx2} y2={tany2}
          stroke={T.green} strokeWidth="2.5" strokeLinecap="round" />

        {/* Curve */}
        <polyline points={curve.join(' ')} fill="none" stroke={T.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Point A (fixed) */}
        <circle cx={tx(a)} cy={ty(fa)} r="6" fill={T.primary} />
        <text x={tx(a) - 14} y={ty(fa) - 9} fontSize="10" fontWeight="800" fill={T.primary}>A=(1,1)</text>

        {/* Point B (on secant) */}
        <circle cx={tx(b)} cy={ty(fb)} r="5" fill={T.amber} />
        <text x={tx(b) + 6} y={ty(fb) - 6} fontSize="10" fontWeight="700" fill={T.amber}>B=(2,4)</text>

        {/* h annotation */}
        <line x1={tx(a)} y1={ty(fa) + 22} x2={tx(b)} y2={ty(fa) + 22}
          stroke={T.red} strokeWidth="1.5" />
        <line x1={tx(a)} y1={ty(fa) + 18} x2={tx(a)} y2={ty(fa) + 26} stroke={T.red} strokeWidth="1.5" />
        <line x1={tx(b)} y1={ty(fa) + 18} x2={tx(b)} y2={ty(fa) + 26} stroke={T.red} strokeWidth="1.5" />
        <text x={(tx(a) + tx(b)) / 2} y={ty(fa) + 36} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.red}>h</text>

        {/* Slope labels */}
        <rect x={W - 152} y={20} width={142} height={52} rx={8} fill={T.white} fillOpacity="0.95" stroke={T.border} strokeWidth="1" />
        <line x1={W - 144} y1={36} x2={W - 118} y2={36} stroke={T.amber} strokeWidth="2" strokeDasharray="5,3" />
        <text x={W - 114} y={40} fontSize="10" fontWeight="700" fill={T.amber}>секущая: наклон = (fb−fa)/h</text>
        <line x1={W - 144} y1={58} x2={W - 118} y2={58} stroke={T.green} strokeWidth="2.5" />
        <text x={W - 114} y={62} fontSize="10" fontWeight="700" fill={T.green}>касательная: f′(a) = 2</text>

        {/* Arrow: B → A meaning h→0 */}
        <text x={tx(1.55)} y={ty(3) - 12} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.amber}>B → A (h → 0)</text>
        <polygon points={`${tx(a) + 14},${ty(fa) - 4} ${tx(a) + 22},${ty(fa) + 2} ${tx(a) + 6},${ty(fa) + 2}`} fill={T.amber} opacity="0.6" />
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        При h→0 точка B скользит к A, оранжевая секущая поворачивается<br />
        и в пределе становится зелёной касательной. Её наклон = <b>f′(a)</b>.
      </p>
    </div>
  );
}

/** Иллюстрация 2: знак f′ — монотонность */
function IllustrationMonotonicity() {
  // f(x) = x³ - 3x on [-2.4, 2.4]
  const W = 420, H = 240;
  const xMin = -2.6, xMax = 2.6, yMin = -3.5, yMax = 3.5;
  const tx = (x: number) => ((x - xMin) / (xMax - xMin)) * (W - 44) + 26;
  const ty = (y: number) => H - 14 - ((y - yMin) / (yMax - yMin)) * (H - 28);
  const f = (x: number) => x ** 3 - 3 * x;

  // Curve
  const curve: string[] = [];
  for (let i = 0; i <= 150; i++) {
    const x = xMin + (i / 150) * (xMax - xMin);
    curve.push(`${tx(x)},${ty(f(x))}`);
  }

  // Regions
  const regions = [
    { x1: -2.6, x2: -1, color: T.green, label: 'f′>0 ↑', yLabel: 2.5 },
    { x1: -1, x2: 1, color: T.red, label: 'f′<0 ↓', yLabel: -0.5 },
    { x1: 1, x2: 2.6, color: T.green, label: 'f′>0 ↑', yLabel: 2.5 },
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: знак f′ и монотонность — f(x) = x³ − 3x
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }}>
        {/* Region fills */}
        {regions.map((r, i) => (
          <rect key={i}
            x={tx(r.x1)} y={14}
            width={tx(r.x2) - tx(r.x1)} height={H - 28}
            fill={`${r.color}10`} />
        ))}

        {/* Grid */}
        {[-2, -1, 0, 1, 2].map(i => (
          <g key={i}>
            <line x1={tx(i)} y1={14} x2={tx(i)} y2={H - 12} stroke={i === 0 ? T.mutedLight : T.border} strokeWidth={i === 0 ? 1.5 : 0.7} />
            {i !== 0 && <text x={tx(i)} y={H - 2} textAnchor="middle" fontSize="9" fill={T.muted}>{i}</text>}
          </g>
        ))}
        <line x1={20} y1={ty(0)} x2={W - 8} y2={ty(0)} stroke={T.mutedLight} strokeWidth="1.5" />
        {[-2, -1, 1, 2].map(i => (
          <text key={i} x={18} y={ty(i) + 4} textAnchor="end" fontSize="9" fill={T.muted}>{i}</text>
        ))}

        {/* Curve */}
        <polyline points={curve.join(' ')} fill="none" stroke={T.primary} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Critical points */}
        {/* Max at (-1, 2) */}
        <circle cx={tx(-1)} cy={ty(2)} r="6" fill={T.red} />
        <line x1={tx(-1)} y1={ty(2)} x2={tx(-1)} y2={ty(0)} stroke={T.red} strokeWidth="1.2" strokeDasharray="4,3" />
        <rect x={tx(-1) - 48} y={ty(2) - 26} width={48} height={18} rx={5} fill={T.redLight} />
        <text x={tx(-1) - 24} y={ty(2) - 13} textAnchor="middle" fontSize="9" fontWeight="800" fill={T.red}>макс (−1, 2)</text>

        {/* Min at (1, -2) */}
        <circle cx={tx(1)} cy={ty(-2)} r="6" fill={T.green} />
        <line x1={tx(1)} y1={ty(-2)} x2={tx(1)} y2={ty(0)} stroke={T.green} strokeWidth="1.2" strokeDasharray="4,3" />
        <rect x={tx(1) + 4} y={ty(-2) + 6} width={48} height={18} rx={5} fill={T.greenLight} />
        <text x={tx(1) + 28} y={ty(-2) + 19} textAnchor="middle" fontSize="9" fontWeight="800" fill={T.green}>мин (1, −2)</text>

        {/* f′=0 markers */}
        <text x={tx(-1)} y={ty(0) + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.red}>f′=0</text>
        <text x={tx(1)} y={ty(0) + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.green}>f′=0</text>

        {/* Region labels */}
        <text x={(tx(-2.6) + tx(-1)) / 2} y={ty(3.0)} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.green}>f′&gt;0</text>
        <text x={(tx(-2.6) + tx(-1)) / 2} y={ty(2.65)} textAnchor="middle" fontSize="9" fill={T.green}>↑ растёт</text>
        <text x={(tx(-1) + tx(1)) / 2} y={ty(3.0)} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.red}>f′&lt;0</text>
        <text x={(tx(-1) + tx(1)) / 2} y={ty(2.65)} textAnchor="middle" fontSize="9" fill={T.red}>↓ убывает</text>
        <text x={(tx(1) + tx(2.6)) / 2} y={ty(3.0)} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.green}>f′&gt;0</text>
        <text x={(tx(1) + tx(2.6)) / 2} y={ty(2.65)} textAnchor="middle" fontSize="9" fill={T.green}>↑ растёт</text>

        {/* Sign change arrows */}
        <text x={tx(-1) - 28} y={ty(0) - 6} fontSize="18" fill={T.green} fontWeight="800">+</text>
        <text x={tx(-1) + 4} y={ty(0) - 6} fontSize="18" fill={T.red} fontWeight="800">−</text>
        <text x={tx(1) - 8} y={ty(0) - 6} fontSize="18" fill={T.red} fontWeight="800">−</text>
        <text x={tx(1) + 10} y={ty(0) - 6} fontSize="18" fill={T.green} fontWeight="800">+</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Зелёные зоны: f′&gt;0, функция растёт. Красная: f′&lt;0, убывает.<br />
        Смена знака f′ с + на − → максимум. С − на + → минимум.
      </p>
    </div>
  );
}

/** Иллюстрация 3: f′′ и выпуклость */
function IllustrationConvexity() {
  const W = 420, H = 220;
  const xMin = -2.4, xMax = 2.4, yMin = -3.5, yMax = 3.5;
  const tx = (x: number) => ((x - xMin) / (xMax - xMin)) * (W - 44) + 26;
  const ty = (y: number) => H - 14 - ((y - yMin) / (yMax - yMin)) * (H - 28);
  const f = (x: number) => x ** 3 - 3 * x;

  const curve: string[] = [];
  for (let i = 0; i <= 150; i++) {
    const x = xMin + (i / 150) * (xMax - xMin);
    curve.push(`${tx(x)},${ty(f(x))}`);
  }

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: вторая производная и выпуклость — f(x) = x³ − 3x
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }}>
        {/* Convexity fills */}
        <rect x={tx(-2.4)} y={14} width={tx(0) - tx(-2.4)} height={H - 28} fill={`${T.violet}10`} />
        <rect x={tx(0)} y={14} width={tx(2.4) - tx(0)} height={H - 28} fill={`${T.cyan}10`} />

        {/* Axes */}
        {[-2, -1, 0, 1, 2].map(i => (
          <g key={i}>
            <line x1={tx(i)} y1={14} x2={tx(i)} y2={H - 12}
              stroke={i === 0 ? T.mutedLight : T.border} strokeWidth={i === 0 ? 1.5 : 0.7} />
            {i !== 0 && <text x={tx(i)} y={H - 2} textAnchor="middle" fontSize="9" fill={T.muted}>{i}</text>}
          </g>
        ))}
        <line x1={20} y1={ty(0)} x2={W - 8} y2={ty(0)} stroke={T.mutedLight} strokeWidth="1.5" />

        {/* Curve */}
        <polyline points={curve.join(' ')} fill="none" stroke={T.primary} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Inflection point at x=0 */}
        <circle cx={tx(0)} cy={ty(0)} r="7" fill={T.white} stroke={T.amber} strokeWidth="2.5" />
        <text x={tx(0) + 10} y={ty(0) + 16} fontSize="9" fontWeight="800" fill={T.amber}>перегиб</text>
        <text x={tx(0) + 10} y={ty(0) + 26} fontSize="9" fill={T.amber}>f′′(0) = 0</text>

        {/* Cup/Cap icons as paths */}
        {/* Left: concave down ∩ (f''<0) */}
        <path d={`M ${tx(-2)},${ty(-1)} Q ${tx(-1.5)},${ty(0.5)} ${tx(-1)},${ty(-1)}`}
          fill="none" stroke={T.violet} strokeWidth="2.5" strokeLinecap="round" />
        <text x={(tx(-2.4) + tx(0)) / 2} y={ty(3.0)} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.violet}>f′′ &lt; 0</text>
        <text x={(tx(-2.4) + tx(0)) / 2} y={ty(2.6)} textAnchor="middle" fontSize="9" fill={T.violet}>выпукла вверх ∩</text>

        {/* Right: concave up ∪ (f''>0) */}
        <path d={`M ${tx(1)},${ty(1)} Q ${tx(1.5)},${ty(-0.5)} ${tx(2)},${ty(1)}`}
          fill="none" stroke={T.cyan} strokeWidth="2.5" strokeLinecap="round" />
        <text x={(tx(0) + tx(2.4)) / 2} y={ty(3.0)} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.cyan}>f′′ &gt; 0</text>
        <text x={(tx(0) + tx(2.4)) / 2} y={ty(2.6)} textAnchor="middle" fontSize="9" fill={T.cyan}>выпукла вниз ∪</text>

        {/* Critical points with f'' test */}
        <circle cx={tx(-1)} cy={ty(2)} r="5" fill={T.red} />
        <text x={tx(-1) - 6} y={ty(2) - 10} fontSize="9" fontWeight="800" fill={T.red} textAnchor="middle">f′′(−1)=−6&lt;0 → макс</text>
        <circle cx={tx(1)} cy={ty(-2)} r="5" fill={T.green} />
        <text x={tx(1) + 2} y={ty(-2) + 18} fontSize="9" fontWeight="800" fill={T.green}>f′′(1)=6&gt;0 → мин</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Фиолетовая зона: f′′&lt;0 — «горб» ∩, функция выпукла вверх.<br />
        Голубая зона: f′′&gt;0 — «чаша» ∪. В точке x=0 — перегиб, f′′=0.
      </p>
    </div>
  );
}

/** Иллюстрация 4: |x| — непрерывна, но не дифференцируема */
function IllustrationAbsValue() {
  const W = 340, H = 220;
  const xMin = -2.5, xMax = 2.5, yMin = -0.3, yMax = 2.8;
  const tx = (x: number) => ((x - xMin) / (xMax - xMin)) * (W - 44) + 26;
  const ty = (y: number) => H - 14 - ((y - yMin) / (yMax - yMin)) * (H - 28);

  const curveL: string[] = [], curveR: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = xMin + (i / 60) * (0 - xMin);
    curveL.push(`${tx(x)},${ty(Math.abs(x))}`);
  }
  for (let i = 0; i <= 60; i++) {
    const x = i / 60 * (xMax - 0);
    curveR.push(`${tx(x)},${ty(Math.abs(x))}`);
  }

  // Derivative function: -1 for x<0, +1 for x>0
  const dL: string[] = [], dR: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = xMin + (i / 60) * (-0.05 - xMin);
    dL.push(`${tx(x)},${ty(-1 + 1.3)}`); // shift up for display
  }
  for (let i = 0; i <= 60; i++) {
    const x = 0.05 + i / 60 * (xMax - 0.05);
    dR.push(`${tx(x)},${ty(1 + 1.3)}`);
  }

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: |x| — непрерывна, но не дифференцируема в нуле
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
        {/* Axes */}
        {[-2, -1, 1, 2].map(i => (
          <g key={i}>
            <line x1={tx(i)} y1={14} x2={tx(i)} y2={H - 12} stroke={T.border} strokeWidth="0.7" />
            <text x={tx(i)} y={H - 2} textAnchor="middle" fontSize="9" fill={T.muted}>{i}</text>
          </g>
        ))}
        <line x1={20} y1={H - 14} x2={W - 10} y2={H - 14} stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={tx(0)} y1={14} x2={tx(0)} y2={H - 12} stroke={T.mutedLight} strokeWidth="1.5" />
        {[1, 2].map(i => (
          <text key={i} x={20} y={ty(i) + 4} textAnchor="end" fontSize="9" fill={T.muted}>{i}</text>
        ))}

        {/* |x| curve */}
        <polyline points={curveL.join(' ')} fill="none" stroke={T.primary} strokeWidth="2.8" strokeLinecap="round" />
        <polyline points={curveR.join(' ')} fill="none" stroke={T.primary} strokeWidth="2.8" strokeLinecap="round" />

        {/* Kink point */}
        <circle cx={tx(0)} cy={ty(0)} r="6" fill={T.white} stroke={T.red} strokeWidth="2.5" />
        <text x={tx(0) + 8} y={ty(0) + 4} fontSize="10" fontWeight="800" fill={T.red}>излом</text>

        {/* Left tangent slope=-1 */}
        <line x1={tx(-2)} y1={ty(2 + 0.3)} x2={tx(-0.05)} y2={ty(0.05 + 0.3)}
          stroke={T.red} strokeWidth="1.8" strokeDasharray="5,3" />
        <text x={tx(-1.8)} y={ty(2.1)} fontSize="10" fontWeight="700" fill={T.red}>наклон = −1</text>

        {/* Right tangent slope=+1 */}
        <line x1={tx(0.05)} y1={ty(0.05 + 0.3)} x2={tx(2)} y2={ty(2 + 0.3)}
          stroke={T.green} strokeWidth="1.8" strokeDasharray="5,3" />
        <text x={tx(1.6)} y={ty(2.4)} fontSize="10" fontWeight="700" fill={T.green}>наклон = +1</text>

        {/* Badge */}
        <rect x={70} y={18} width={220} height={34} rx={8} fill={T.redLight} />
        <text x={180} y={32} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.red}>
          lim⁻ = −1 ≠ lim⁺ = +1
        </text>
        <text x={180} y={46} textAnchor="middle" fontSize="10" fill={T.red}>
          → производной в x=0 нет
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        В нуле функция |x| непрерывна — графика не рвётся. Но есть «излом»:<br />
        наклон слева −1, справа +1. Предел разностного отношения не существует.
      </p>
    </div>
  );
}

/** Иллюстрация 5: Цепное правило — схема слоёв */
function IllustrationChainRule() {
  const W = 460, H = 160;
  const boxes = [
    { label: 'x', sub: 'вход', x: 30, color: T.muted },
    { label: 'g(x)', sub: 'внутренняя', x: 140, color: T.violet },
    { label: 'f(g(x))', sub: 'выход', x: 290, color: T.primary },
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: цепное правило — прямой проход и backprop
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }}>
        {/* Forward pass boxes */}
        {boxes.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={40} width={90} height={50} rx={12}
              fill={`${b.color}14`} stroke={`${b.color}50`} strokeWidth="1.8" />
            <text x={b.x + 45} y={63} textAnchor="middle" fontSize="13" fontWeight="800" fill={b.color}>{b.label}</text>
            <text x={b.x + 45} y={78} textAnchor="middle" fontSize="9" fill={T.muted}>{b.sub}</text>
          </g>
        ))}

        {/* Forward arrows */}
        <defs>
          <marker id="arr-fwd" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={T.green} />
          </marker>
          <marker id="arr-bwd" markerWidth="7" markerHeight="7" refX="2" refY="3.5" orient="auto">
            <path d="M7,0 L0,3.5 L7,7 Z" fill={T.amber} />
          </marker>
        </defs>
        <line x1={122} y1={65} x2={138} y2={65} stroke={T.green} strokeWidth="2" markerEnd="url(#arr-fwd)" />
        <line x1={232} y1={65} x2={288} y2={65} stroke={T.green} strokeWidth="2" markerEnd="url(#arr-fwd)" />
        <text x={130} y={58} fontSize="9" fontWeight="700" fill={T.green} textAnchor="middle">g(x)</text>
        <text x={260} y={58} fontSize="9" fontWeight="700" fill={T.green} textAnchor="middle">f</text>

        {/* Backward pass */}
        <line x1={288} y1={108} x2={232} y2={108} stroke={T.amber} strokeWidth="2" markerEnd="url(#arr-bwd)" />
        <line x1={138} y1={108} x2={122} y2={108} stroke={T.amber} strokeWidth="2" markerEnd="url(#arr-bwd)" />
        <text x={260} y={122} fontSize="9" fontWeight="700" fill={T.amber} textAnchor="middle">× f′(g)</text>
        <text x={130} y={122} fontSize="9" fontWeight="700" fill={T.amber} textAnchor="middle">× g′(x)</text>

        {/* Labels */}
        <text x={230} y={18} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.green}>→ прямой проход</text>
        <text x={230} y={140} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.amber}>← обратный (backprop)</text>

        {/* Chain rule formula */}
        <rect x={370} y={36} width={82} height={58} rx={10} fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1.5" />
        <text x={411} y={56} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.primaryDark}>(f∘g)′ =</text>
        <text x={411} y={70} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.primaryDark}>f′(g(x)) ·</text>
        <text x={411} y={84} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.primaryDark}>g′(x)</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Зелёные стрелки — прямой проход: вычисление f(g(x)).<br />
        Оранжевые — обратный: каждый градиент умножается на производную своего слоя. Это и есть backpropagation.
      </p>
    </div>
  );
}

/** Иллюстрация 6: Градиентный спуск на контурной карте */
function IllustrationGradientDescent() {
  const W = 380, H = 260;
  // Loss surface: L(w1,w2) = (w1-2)^2 + 0.6*(w2-1.5)^2
  // Draw contours as ellipses, then a trajectory
  const cx = 200, cy = 155; // canvas min position
  const scaleW1 = 50, scaleW2 = 38;

  const contours = [0.3, 0.7, 1.3, 2.2, 3.4];

  // SGD trajectory from (0.2, 3.5) toward (2, 1.5)
  const traj = [
    [0.2, 3.5], [0.65, 3.1], [1.05, 2.75], [1.38, 2.45],
    [1.63, 2.18], [1.80, 1.95], [1.90, 1.78], [1.96, 1.65],
    [1.99, 1.56], [2.00, 1.51],
  ];

  const toSX = (w1: number) => cx + (w1 - 2) * scaleW1;
  const toSY = (w2: number) => cy - (w2 - 1.5) * scaleW2;
  const colorsContour = [`${T.primary}40`, `${T.primary}60`, `${T.primary}80`, `${T.primaryDark}99`, T.primaryDark];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: градиентный спуск на контурной карте функции потерь
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto' }}>
        {/* Background */}
        <rect x={0} y={0} width={W} height={H} rx={16} fill={T.surface} />

        {/* Contour ellipses */}
        {contours.map((level, i) => {
          const rx = Math.sqrt(level) * scaleW1;
          const ry = Math.sqrt(level / 0.6) * scaleW2;
          return (
            <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
              fill="none" stroke={colorsContour[i]} strokeWidth={1.4 - i * 0.1} />
          );
        })}

        {/* Gradient vectors (a few sample arrows) */}
        {[[0.5, 3.2], [1.0, 2.6], [0.2, 1.5], [1.5, 3.0]].map(([w1, w2], i) => {
          const gw1 = 2 * (w1 - 2); // ∂L/∂w1
          const gw2 = 1.2 * (w2 - 1.5); // ∂L/∂w2
          const norm = Math.sqrt(gw1 ** 2 + gw2 ** 2) + 0.001;
          const len = 22;
          const ex = toSX(w1) - (gw1 / norm) * len;
          const ey = toSY(w2) + (gw2 / norm) * len;
          return (
            <g key={i} opacity="0.55">
              <line x1={toSX(w1)} y1={toSY(w2)} x2={ex} y2={ey}
                stroke={T.amber} strokeWidth="1.5" markerEnd="none" />
              <circle cx={ex} cy={ey} r="2.5" fill={T.amber} />
            </g>
          );
        })}

        {/* Trajectory */}
        <polyline
          points={traj.map(([w1, w2]) => `${toSX(w1)},${toSY(w2)}`).join(' ')}
          fill="none" stroke={T.red} strokeWidth="2.2" strokeLinejoin="round" />
        {traj.map(([w1, w2], i) => (
          <circle key={i} cx={toSX(w1)} cy={toSY(w2)} r="3.5"
            fill={T.red} opacity={0.25 + i / traj.length * 0.75} />
        ))}

        {/* Start point */}
        <circle cx={toSX(traj[0][0])} cy={toSY(traj[0][1])} r="6" fill={T.white} stroke={T.red} strokeWidth="2" />
        <text x={toSX(traj[0][0]) + 8} y={toSY(traj[0][1]) - 5} fontSize="10" fontWeight="700" fill={T.red}>старт</text>

        {/* Minimum (star) */}
        <circle cx={cx} cy={cy} r="8" fill={T.green} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.white}>★</text>
        <text x={cx + 12} y={cy - 10} fontSize="10" fontWeight="700" fill={T.green}>минимум</text>
        <text x={cx + 12} y={cy + 2} fontSize="9" fill={T.green}>∇L = 0</text>

        {/* Axis labels */}
        <text x={W - 18} y={cy + 4} fontSize="11" fontWeight="700" fill={T.muted}>w₁</text>
        <text x={cx + 4} y={18} fontSize="11" fontWeight="700" fill={T.muted}>w₂</text>
        <line x1={26} y1={cy} x2={W - 14} y2={cy} stroke={T.border} strokeWidth="1" />
        <line x1={cx} y1={14} x2={cx} y2={H - 12} stroke={T.border} strokeWidth="1" />

        {/* Legend */}
        <rect x={10} y={H - 54} width={160} height={46} rx={8} fill={T.white} fillOpacity="0.95" stroke={T.border} strokeWidth="1" />
        <line x1={18} y1={H - 40} x2={36} y2={H - 40} stroke={T.red} strokeWidth="2.2" />
        <text x={40} y={H - 36} fontSize="10" fontWeight="600" fill={T.red}>траектория спуска</text>
        <line x1={18} y1={H - 22} x2={36} y2={H - 22} stroke={T.amber} strokeWidth="1.5" />
        <circle cx={37} cy={H - 22} r="2.5" fill={T.amber} />
        <text x={40} y={H - 18} fontSize="10" fontWeight="600" fill={T.amber}>−∇L (антиградиент)</text>

        {/* Update rule */}
        <rect x={W - 156} y={H - 54} width={148} height={46} rx={8} fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1" />
        <text x={W - 82} y={H - 39} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.primaryDark}>w ← w − η · ∇L(w)</text>
        <text x={W - 82} y={H - 24} textAnchor="middle" fontSize="9" fill={T.muted}>η — learning rate</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Красная линия — траектория весов при обучении. Оранжевые стрелки — направление антиградиента.<br />
        На каждом шаге: <b>w ← w − η · ∇L(w)</b>. Итог — минимум функции потерь ★.
      </p>
    </div>
  );
}

/** Иллюстрация 7: Производные функций активации */
function IllustrationActivations() {
  const W = 420, H = 200;
  const xMin = -4, xMax = 4, yMin = -0.2, yMax = 1.2;
  const tx = (x: number) => ((x - xMin) / (xMax - xMin)) * (W - 44) + 26;
  const ty = (y: number) => H - 14 - ((y - yMin) / (yMax - yMin)) * (H - 28);

  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  const sigmoidDeriv = (x: number) => { const s = sigmoid(x); return s * (1 - s); };
  const relu = (x: number) => Math.max(0, x);
  const reluDeriv = (x: number) => x > 0 ? 1 : 0;

  const buildCurve = (fn: (x: number) => number, steps = 120): string => {
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = fn(x);
      if (y < yMin - 0.5 || y > yMax + 0.5) continue;
      pts.push(`${tx(x)},${ty(y)}`);
    }
    return pts.join(' ');
  };

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: производные функций активации — sigmoid и ReLU
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }}>
        {/* Grid */}
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(i => (
          <g key={i}>
            <line x1={tx(i)} y1={14} x2={tx(i)} y2={H - 12}
              stroke={i === 0 ? T.mutedLight : T.border} strokeWidth={i === 0 ? 1.5 : 0.6} />
            {i % 2 === 0 && <text x={tx(i)} y={H - 2} textAnchor="middle" fontSize="8" fill={T.muted}>{i}</text>}
          </g>
        ))}
        {[0, 0.5, 1].map(v => (
          <g key={v}>
            <line x1={22} y1={ty(v)} x2={W - 8} y2={ty(v)}
              stroke={v === 0 ? T.mutedLight : T.border} strokeWidth={v === 0 ? 1.5 : 0.6} />
            <text x={18} y={ty(v) + 4} textAnchor="end" fontSize="8" fill={T.muted}>{v}</text>
          </g>
        ))}

        {/* Sigmoid */}
        <polyline points={buildCurve(sigmoid)} fill="none" stroke={T.primary} strokeWidth="2.5" />
        {/* Sigmoid derivative */}
        <polyline points={buildCurve(sigmoidDeriv)} fill="none" stroke={T.primary} strokeWidth="1.8" strokeDasharray="5,3" />

        {/* ReLU */}
        <polyline points={buildCurve(relu)} fill="none" stroke={T.amber} strokeWidth="2.5" />
        {/* ReLU derivative */}
        <polyline points={buildCurve(reluDeriv)} fill="none" stroke={T.amber} strokeWidth="1.8" strokeDasharray="5,3" />

        {/* Max sigmoid deriv at x=0 */}
        <circle cx={tx(0)} cy={ty(0.25)} r="4.5" fill={T.primary} />
        <text x={tx(0) + 7} y={ty(0.25)} fontSize="9" fill={T.primaryDark} fontWeight="700">σ′(0)=0.25</text>

        {/* ReLU kink */}
        <circle cx={tx(0)} cy={ty(0)} r="5" fill={T.white} stroke={T.amber} strokeWidth="2" />
        <text x={tx(0.1)} y={ty(0) - 8} fontSize="9" fill={T.amber} fontWeight="700">излом!</text>

        {/* Saturation zones */}
        <rect x={tx(-4)} y={ty(0.1)} width={tx(-2.5) - tx(-4)} height={H - 14 - ty(0.1)} fill={`${T.red}08`} />
        <text x={(tx(-4) + tx(-2.5)) / 2} y={ty(0.05)} textAnchor="middle" fontSize="8" fontWeight="700" fill={T.red}>насыщение</text>
        <text x={(tx(-4) + tx(-2.5)) / 2} y={ty(0.03) + 10} textAnchor="middle" fontSize="8" fill={T.red}>σ′≈0</text>

        {/* Legend */}
        <rect x={W - 172} y={18} width={162} height={68} rx={8} fill={T.white} fillOpacity="0.95" stroke={T.border} strokeWidth="1" />
        <line x1={W - 164} y1={34} x2={W - 144} y2={34} stroke={T.primary} strokeWidth="2.5" />
        <text x={W - 140} y={38} fontSize="9" fontWeight="700" fill={T.primary}>σ(x) — сигмоида</text>
        <line x1={W - 164} y1={50} x2={W - 144} y2={50} stroke={T.primary} strokeWidth="1.8" strokeDasharray="4,2" />
        <text x={W - 140} y={54} fontSize="9" fill={T.primary}>σ′(x) = σ(1−σ)</text>
        <line x1={W - 164} y1={66} x2={W - 144} y2={66} stroke={T.amber} strokeWidth="2.5" />
        <text x={W - 140} y={70} fontSize="9" fontWeight="700" fill={T.amber}>ReLU(x) = max(0,x)</text>
        <line x1={W - 164} y1={78} x2={W - 144} y2={78} stroke={T.amber} strokeWidth="1.8" strokeDasharray="4,2" />
        <text x={W - 140} y={82} fontSize="9" fill={T.amber}>ReLU′ = 0 или 1</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Пунктир — производная. Sigmoid: производная ≤ 0.25, при больших |x| стремится к 0 (затухание градиента).<br />
        ReLU: производная либо 0, либо 1 — нет затухания, но есть «мёртвые нейроны» при x &lt; 0.
      </p>
    </div>
  );
}

// ─── Self-check ───────────────────────────────────────────────────────────────
function CheckQuestions() {
  const questions = [
    {
      q: 'Чему равна производная f(x) = 5x⁴ − 3x² + 2x − 7?',
      options: [
        '20x³ − 6x + 2',
        '20x³ − 6x − 7',
        '5x³ − 3x + 2',
        '20x⁴ − 6x² + 2',
      ],
      correct: 0,
      explanation: 'По правилам: (5x⁴)′=20x³, (−3x²)′=−6x, (2x)′=2, (−7)′=0. Итого: 20x³ − 6x + 2.',
    },
    {
      q: 'Что геометрически означает f′(a)?',
      options: [
        'Площадь под графиком до точки a',
        'Угловой коэффициент касательной к графику в точке a',
        'Расстояние от графика до оси X',
        'Значение функции в точке a',
      ],
      correct: 1,
      explanation: 'Производная f′(a) — это предел наклона секущей при h→0. В пределе секущая превращается в касательную, и её угловой коэффициент равен f′(a).',
    },
    {
      q: 'f(x) = x³ − 3x, f′(x) = 3x²−3. При x=2: f′(2) = 9 > 0. Что это значит?',
      options: [
        'В x=2 находится максимум',
        'Функция убывает при x=2',
        'Функция возрастает при x=2',
        'В x=2 производная не существует',
      ],
      correct: 2,
      explanation: 'f′(x)>0 означает, что функция возрастает. При x=2: f′(2) = 12−3 = 9 > 0 → функция растёт.',
    },
    {
      q: 'Правило произведения: производная f(x) = x · sin(x)?',
      options: [
        'sin(x) + x·cos(x)',
        'cos(x)',
        'x·cos(x)',
        'sin(x) − x·cos(x)',
      ],
      correct: 0,
      explanation: '(u·v)′ = u′v + uv′. u=x, u′=1; v=sin(x), v′=cos(x). Итого: 1·sin(x) + x·cos(x) = sin(x) + x·cos(x).',
    },
    {
      q: 'Почему |x| непрерывна, но не дифференцируема в нуле?',
      options: [
        'Функция не определена в нуле',
        'Левый и правый пределы разностного отношения не равны (−1 и +1)',
        'Производная отрицательная при x<0',
        'Функция не ограничена',
      ],
      correct: 1,
      explanation: 'При h<0: (|h|−0)/h = −1. При h>0: h/h = 1. Два односторонних предела разные → двусторонний предел не существует → производной нет. Сама функция непрерывна: lim|x|=0=f(0).',
    },
    {
      q: 'Что делает цепное правило в нейросетях (backpropagation)?',
      options: [
        'Вычисляет функцию потерь по обучающей выборке',
        'Находит обратную матрицу весов',
        'Применяет (f∘g)′=f′(g)·g′ послойно, распространяя градиент от выхода к входу',
        'Нормализует входные данные',
      ],
      correct: 2,
      explanation: 'Backpropagation — это цепное правило для вычисления ∂L/∂w по каждому весу. Градиент ошибки передаётся слой за слоем от выхода к входу, умножаясь на локальную производную каждого слоя.',
    },
  ];

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

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
                const isChosen = chosen === oi;
                const isCorrect = oi === q.correct;
                let bg = T.surface, border = T.border, color = T.text;
                if (show) {
                  if (isCorrect) { bg = T.greenLight; border = T.green; color = '#065f46'; }
                  else if (isChosen && !isCorrect) { bg = T.redLight; border = T.red; color = '#991b1b'; }
                }
                return (
                  <button key={oi} onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
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

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DerivativeGradientTheoryRich() {
  const nav = [
    { id: 'dg-why', label: 'Зачем это' },
    { id: 'dg-avgspeed', label: 'Средняя → мгновенная' },
    { id: 'dg-definition', label: 'Определение' },
    { id: 'dg-geometry', label: 'Геометрия' },
    { id: 'dg-rules', label: 'Правила' },
    { id: 'dg-table', label: 'Таблица' },
    { id: 'dg-monotone', label: 'Монотонность' },
    { id: 'dg-second', label: 'Вторая производная' },
    { id: 'dg-diffcont', label: 'Дифф. vs непрерывность' },
    { id: 'dg-gradient', label: 'Градиент' },
    { id: 'dg-ds', label: 'Data Science' },
    { id: 'dg-check', label: 'Проверь себя' },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Заголовок ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Activity size={15} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: T.primary, textTransform: 'uppercase' }}>Математический анализ</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, color: T.muted }}>около 25 минут</span>
        </div>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>
          Производная и градиент
        </h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16, lineHeight: 1.6 }}>
          Мгновенная скорость изменения, касательная, правила дифференцирования, экстремумы — и как всё это превращается в градиентный спуск, который обучает нейросети.
        </p>
      </div>

      {/* ── Навигация ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 48 }}>
        {nav.map(s => (
          <a key={s.id} href={`#${s.id}`}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${T.primary}0f`, color: T.primary, border: `1px solid ${T.primaryBorder}`, textDecoration: 'none' }}>
            {s.label}
          </a>
        ))}
      </div>

      {/* ══ 0. ЗАЧЕМ ══ */}
      <section id="dg-why" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sparkles} label="Мотивация" title="Зачем это вообще нужно" />

        <div style={{ background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Туман на склоне
          </div>
          <p style={{ margin: '0 0 10px', color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Вы разрабатываете рекомендательную систему. У вас есть <strong>функция ошибки</strong> — насколько предсказания расходятся с реальными оценками пользователей. Задача: найти её минимум.
          </p>
          <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Представьте, что вы стоите на склоне горы в тумане и хотите спуститься в долину. Вы не видите всю гору, но можете <strong>посмотреть под ноги</strong> и определить, куда земля уходит вниз. Шаг в эту сторону — чуть ниже. Ещё шаг — ещё ниже.
            Производная — это «взгляд под ноги». Она показывает наклон функции <em>в данной точке</em>.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { n: '1', title: 'Касательная', d: 'Лучшее линейное приближение функции в точке', color: T.primary },
            { n: '2', title: 'Мгновенная скорость', d: 'Предел средней скорости при стягивании интервала в точку', color: T.green },
            { n: '3', title: 'Правила', d: '7 правил дифференцирования без предела каждый раз', color: T.violet },
            { n: '4', title: 'Экстремумы', d: 'f′=0 — кандидаты на min/max. f′′ уточняет', color: T.amber },
            { n: '5', title: 'Градиент и спуск', d: 'Вектор производных → направление обучения', color: T.cyan },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{item.n}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>

        <Callout color={T.primary} title="Связь с прошлой темой">
          В теме «Предел и непрерывность» мы видели, как сокращать 0/0 в дроби. Производная —
          это именно такая дробь: <M tex="\tfrac{f(a+h)-f(a)}{h}" /> при h=0 даёт 0/0.
          Те же приёмы — сокращение и предел — вскроют ответ.
        </Callout>
      </section>

      {/* ══ 1. СРЕДНЯЯ → МГНОВЕННАЯ ══ */}
      <section id="dg-avgspeed" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Понятие 1" title="От средней скорости к мгновенной" color={T.green} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Начнём с физики — так нагляднее. Автомобиль едет по прямой, его положение: <M tex="s(t) = t^2" /> (метры, секунды). Какова скорость в момент t=3?
        </p>

        <Card style={{ borderLeft: `4px solid ${T.green}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Средняя скорость на интервале [3, 3+h]</div>
          <F tex="v_{\text{средн}} = \frac{s(3+h) - s(3)}{h} = \frac{(3+h)^2 - 9}{h}" />
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {['h', '(3+h)² − 9', 'Средняя скорость'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'center', color: T.muted, fontWeight: 700, border: `1px solid ${T.border}`, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['1', '16 − 9 = 7', '7 м/с'],
                  ['0.1', '9.61 − 9 = 0.61', '6.1 м/с'],
                  ['0.01', '9.0601 − 9 = 0.0601', '6.01 м/с'],
                  ['0.001', '9.006001 − 9 = 0.006', '6.001 м/с'],
                ].map(([h, num, v]) => (
                  <tr key={h} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: '7px 14px', textAlign: 'center', color: T.text }}>{h}</td>
                    <td style={{ padding: '7px 14px', textAlign: 'center', color: T.muted }}>{num}</td>
                    <td style={{ padding: '7px 14px', textAlign: 'center', color: T.green, fontWeight: 600 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Аналитическое решение — 0/0, которое «лечится»</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
            Раскроем числитель и сократим:
          </p>
          <F tex="\frac{(3+h)^2 - 9}{h} = \frac{9 + 6h + h^2 - 9}{h} = \frac{6h + h^2}{h} = \frac{h(6+h)}{h} = 6 + h" />
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, margin: '8px 0 0' }}>
            Сокращение «вылечило» дробь: при h≠0 она равна <M tex="6 + h" />.
            При <M tex="h \to 0" />:
          </p>
          <FBox tex="v_{\text{мгнов}} = \lim_{h \to 0}(6 + h) = 6 \text{ м/с}" hint="Мгновенная скорость в момент t=3" color={T.green} />
        </Card>

        <DSNote>
          Спидометр показывает <strong>мгновенную</strong> скорость. Не среднее по поездке, а «сейчас».
          Для нейросети «скорость изменения ошибки» по весу — это производная функции потерь.
          Именно она говорит, насколько и в какую сторону изменился бы loss при небольшом сдвиге данного веса.
        </DSNote>
      </section>

      {/* ══ 2. ОПРЕДЕЛЕНИЕ ══ */}
      <section id="dg-definition" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Определение" title="Производная: формальное определение" color={T.primary} />

        <FBox
          tex="f'(a) = \lim_{h \to 0} \frac{f(a+h) - f(a)}{h}"
          hint="Если этот предел существует и конечен — функция дифференцируема в точке a"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { sym: 'f(a+h)−f(a)', color: T.green, title: 'Приращение функции', body: 'Насколько изменился y при сдвиге x на h. Числитель дроби.' },
            { sym: 'h', color: T.red, title: 'Приращение аргумента', body: 'Насколько изменился x. Знаменатель. При h=0 дробь не определена.' },
            { sym: 'lim h→0', color: T.violet, title: 'Предел', body: 'Не подставляем 0, а стремимся к нему. Именно так «лечится» 0/0.' },
            { sym: "f′(a)", color: T.primary, title: 'Мгновенная скорость', body: 'Скорость изменения f в точке a. Наклон касательной.' },
          ].map(item => (
            <div key={item.sym} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <code style={{ fontSize: 15, fontWeight: 800, color: item.color, display: 'block', marginBottom: 6 }}>{item.sym}</code>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Обозначения производной</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {[
              { sym: "f′(x)", name: 'Лагранж', note: 'Самое распространённое', color: T.primary },
              { sym: 'df/dx', name: 'Лейбниц', note: '«Отношение бесконечно малых»', color: T.green },
              { sym: 'Df', name: 'Операторная', note: 'Используется в дифф. уравнениях', color: T.muted },
            ].map(item => (
              <div key={item.sym} style={{ background: T.surface, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <code style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.sym}</code>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginTop: 4 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{item.note}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Пример: f(x) = x², производная в любой точке</div>
          <F tex="\frac{(x+h)^2 - x^2}{h} = \frac{x^2 + 2xh + h^2 - x^2}{h} = \frac{2xh + h^2}{h} = 2x + h \;\xrightarrow{h \to 0}\; 2x" />
          <div style={{ background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: T.primaryDark, textAlign: 'center', marginTop: 8 }}>
            f′(x) = 2x &ensp;→&ensp; f′(1) = 2,&ensp; f′(3) = 6,&ensp; f′(−2) = −4
          </div>
        </Card>
      </section>

      {/* ══ 3. ГЕОМЕТРИЯ ══ */}
      <section id="dg-geometry" style={{ marginBottom: 52 }}>
        <SectionHeader icon={BookOpen} label="Геометрия" title="Касательная — лучшее линейное приближение" color={T.violet} />

        <IllustrationSecantTangent />

        <Card style={{ borderLeft: `4px solid ${T.violet}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Уравнение касательной</div>
          <FBox
            tex="y = f(a) + f'(a)\cdot(x - a)"
            hint="Прямая с наклоном f′(a), проходящая через точку (a, f(a))"
            color={T.violet}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.violet, marginBottom: 6 }}>Пример: f(x)=x², a=1</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                f(1)=1, f′(1)=2<br />
                y = 1 + 2(x − 1) = 2x − 1
              </div>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, marginBottom: 6 }}>Линеаризация функции</div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
                При «зуме» около точки a парабола и касательная становятся неразличимы. Это основа линейного приближения в численных методах.
              </div>
            </div>
          </div>
        </Card>

        <Callout color={T.green} title="Физический смысл">
          Если <M tex="s(t)" /> — путь, то <M tex="s'(t)" /> — мгновенная скорость, <M tex="s''(t)" /> — ускорение.
          Вторая производная от скорости — это то, как быстро изменяется скорость, то есть ускорение.
          Спидометр показывает <M tex="s'(t)" />.
        </Callout>
      </section>

      {/* ══ 4. ПРАВИЛА ══ */}
      <section id="dg-rules" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Инструмент" title="Семь правил дифференцирования" color={T.amber} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Вычислять производную через предел каждый раз — утомительно. Математики вывели правила, которые позволяют дифференцировать <strong>механически</strong>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              n: '1', name: 'Константа', rule: "(c)' = 0",
              tex: "(c)' = 0",
              note: 'Константа не меняется — скорость изменения нулевая. График y=5 — горизонтальная прямая.',
              example: "(7)' = 0", color: T.muted,
            },
            {
              n: '2', name: 'Степень', rule: "(xⁿ)' = n·xⁿ⁻¹",
              tex: "(x^n)' = n \\cdot x^{n-1}",
              note: 'Показатель «падает» вниз как множитель, степень уменьшается на 1.',
              example: "(x³)' = 3x²,\\quad (\\sqrt{x})' = \\tfrac{1}{2\\sqrt{x}},\\quad (x^{-1})' = -x^{-2}", color: T.primary,
            },
            {
              n: '3', name: 'Константа × функция', rule: "(c·f)' = c·f′",
              tex: "(c \\cdot f(x))' = c \\cdot f'(x)",
              note: 'Константа «проходит сквозь» производную.',
              example: "(5x^3)' = 5 \\cdot 3x^2 = 15x^2", color: T.green,
            },
            {
              n: '4', name: 'Сумма/разность', rule: "(f±g)' = f′±g′",
              tex: "(f(x) \\pm g(x))' = f'(x) \\pm g'(x)",
              note: 'Дифференцирование «растаскивает» сумму по частям.',
              example: "(x^2 + \\sin x)' = 2x + \\cos x", color: T.cyan,
            },
            {
              n: '5', name: 'Произведение', rule: "(f·g)' = f′g + fg′",
              tex: "(f \\cdot g)' = f' \\cdot g + f \\cdot g'",
              note: 'Не произведение производных! Производная первой на вторую плюс первая на производную второй.',
              example: "(x \\cdot \\sin x)' = \\sin x + x\\cos x", color: T.violet,
            },
            {
              n: '6', name: 'Частное', rule: "(f/g)' = (f′g − fg′)/g²",
              tex: "\\left(\\frac{f}{g}\\right)' = \\frac{f' g - f g'}{g^2}",
              note: '«Производная верха на низ минус верх на производную низа, делить на низ в квадрате».',
              example: "\\left(\\frac{x}{x+1}\\right)' = \\frac{(x+1) - x}{(x+1)^2} = \\frac{1}{(x+1)^2}", color: T.amber,
            },
            {
              n: '7', name: 'Цепное правило', rule: "(f(g(x)))′ = f′(g(x))·g′(x)",
              tex: "(f(g(x)))' = f'(g(x)) \\cdot g'(x)",
              note: '«Производная внешней (применённой к внутренней) умножить на производную внутренней». На этом держится backpropagation.',
              example: "(\\sin(x^2))' = \\cos(x^2) \\cdot 2x", color: T.red,
            },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.n}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{item.name}</span>
                    <code style={{ fontSize: 12, background: `${item.color}12`, color: item.color, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>{item.rule}</code>
                  </div>
                  <div style={{ marginBottom: 6 }}><F tex={item.tex} /></div>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{item.note}</p>
                  <div style={{ background: T.surface, borderRadius: 8, padding: '6px 12px' }}><F tex={item.example} /></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <IllustrationChainRule />
      </section>

      {/* ══ 5. ТАБЛИЦА ══ */}
      <section id="dg-table" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Шпаргалка" title="Таблица производных элементарных функций" color={T.green} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Эти формулы нужно знать наизусть — они встречаются постоянно в правилах дифференцирования и формулах активации.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {[
            { fn: 'c', deriv: '0', note: 'Константа', color: T.muted },
            { fn: 'xⁿ', deriv: 'n·xⁿ⁻¹', note: 'Степенная', color: T.primary },
            { fn: 'eˣ', deriv: 'eˣ', note: 'Сама себе производная!', color: T.green },
            { fn: 'ln x', deriv: '1/x', note: 'При x > 0', color: T.green },
            { fn: 'sin x', deriv: 'cos x', note: 'Синус → косинус', color: T.violet },
            { fn: 'cos x', deriv: '−sin x', note: 'Косинус → минус синус', color: T.violet },
            { fn: 'tan x', deriv: '1/cos²x', note: 'Кроме π/2 + πk', color: T.amber },
            { fn: 'aˣ', deriv: 'aˣ·ln a', note: 'Произвольное основание', color: T.cyan },
          ].map(item => (
            <div key={item.fn} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <code style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.fn}</code>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{item.note}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowRight size={14} color={T.mutedLight} />
                <code style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{item.deriv}</code>
              </div>
            </div>
          ))}
        </div>

        <Card style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Пример: сложный многочлен</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 6 }}>
            Найти производную <M tex="f(x) = 3x^4 - 2x^3 + 5x - 7" />:
          </p>
          <F tex="f'(x) = 3\cdot4x^3 - 2\cdot3x^2 + 5\cdot1 - 0 = 12x^3 - 6x^2 + 5" />
          <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0' }}>
            Каждый член — по таблице и правилу суммы. Константа −7 исчезает.
          </p>
        </Card>
      </section>

      {/* ══ 6. МОНОТОННОСТЬ ══ */}
      <section id="dg-monotone" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Применение" title="Знак f′: монотонность и экстремумы" color={T.red} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Производная — не просто число. Она рассказывает о <strong>поведении</strong> функции.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { sign: 'f′(x) > 0', icon: '↑', label: 'Возрастание', note: 'Функция растёт на этом интервале', color: T.green, bg: T.greenLight },
            { sign: 'f′(x) < 0', icon: '↓', label: 'Убывание', note: 'Функция падает', color: T.red, bg: T.redLight },
            { sign: 'f′(x) = 0', icon: '⏸', label: 'Критическая точка', note: 'Возможны max, min или перегиб', color: T.amber, bg: T.amberLight },
          ].map(item => (
            <div key={item.sign} style={{ background: item.bg, border: `1px solid ${item.color}40`, borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
              <code style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.sign}</code>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginTop: 4, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.note}</div>
            </div>
          ))}
        </div>

        <IllustrationMonotonicity />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Алгоритм поиска экстремумов</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { n: '1', text: 'Найти f′(x)', color: T.primary },
              { n: '2', text: 'Решить f′(x) = 0 — получим критические точки (кандидаты на экстремум)', color: T.violet },
              { n: '3', text: 'Проверить знак f′ на интервалах между критическими точками', color: T.amber },
              { n: '4', text: '+→− при переходе через a: максимум. −→+ : минимум. Без смены знака — перегиб', color: T.green },
            ].map(item => (
              <div key={item.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{item.n}</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ══ 7. ВТОРАЯ ПРОИЗВОДНАЯ ══ */}
      <section id="dg-second" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Brain} label="Понятие 2" title="Вторая производная и выпуклость" color={T.violet} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          <M tex="f''" /> — это производная от производной. Первая производная — скорость изменения f.
          Вторая производная — <strong>ускорение</strong>: как быстро меняется сама скорость.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <Card style={{ borderTop: `3px solid ${T.cyan}` }}>
            <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 8 }}>∪</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.cyan, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>f′′ &gt; 0 — чаша</div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
              График «загибается вверх». Производная растёт. Функция «ускоряется» — каждый следующий шаг больше предыдущего.
            </div>
          </Card>
          <Card style={{ borderTop: `3px solid ${T.violet}` }}>
            <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 8 }}>∩</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.violet, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>f′′ &lt; 0 — горб</div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
              График «загибается вниз». Производная убывает. Функция «замедляется» — рост замедляется при подходе к максимуму.
            </div>
          </Card>
        </div>

        <IllustrationConvexity />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Второй достаточный признак экстремума</div>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>Быстрый способ определить тип критической точки — не анализировать смену знака f′, а подставить в f′′:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { cond: "f′(a) = 0 и f′′(a) > 0", result: 'a — точка минимума', icon: '∪', color: T.green },
              { cond: "f′(a) = 0 и f′′(a) < 0", result: 'a — точка максимума', icon: '∩', color: T.red },
              { cond: "f′(a) = 0 и f′′(a) = 0", result: 'нужен дополнительный анализ', icon: '?', color: T.amber },
            ].map(item => (
              <div key={item.cond} style={{ display: 'flex', gap: 12, alignItems: 'center', background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <code style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.cond}</code>
                  <div style={{ fontSize: 13, color: T.text, marginTop: 2 }}>{item.result}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.violet, marginBottom: 6 }}>Продолжение примера f(x) = x³ − 3x</div>
            <F tex="f''(x) = 6x \;\Rightarrow\; f''(-1) = -6 < 0 \text{ (макс)},\quad f''(1) = 6 > 0 \text{ (мин)},\quad f''(0) = 0 \text{ (перегиб)}" />
          </div>
        </Card>

        <DSNote>
          В оптимизации нейросетей вторая производная входит в матрицу <strong>Гессиана</strong> H = ∂²L/∂w².
          Если Гессиан положительно определён в критической точке — это минимум. Методы второго порядка (Newton, L-BFGS) используют Гессиан для более точного шага, чем простой градиентный спуск.
        </DSNote>
      </section>

      {/* ══ 8. ДИФФ. vs НЕПРЕРЫВНОСТЬ ══ */}
      <section id="dg-diffcont" style={{ marginBottom: 52 }}>
        <SectionHeader icon={GitMerge} label="Важное различие" title="Дифференцируемость и непрерывность" color={T.amber} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Из прошлой темы: функция непрерывна, если график можно нарисовать не отрывая руки. Как соотносятся непрерывность и дифференцируемость?
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <Card style={{ borderLeft: `4px solid ${T.green}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Факт 1</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>
              Дифференцируемость ⟹ непрерывность
            </p>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
              Если производная существует — функция обязательно непрерывна. Дифференцируемость — более сильное свойство: график не только без разрывов, но и без изломов.
            </div>
          </Card>
          <Card style={{ borderLeft: `4px solid ${T.red}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 8 }}>Факт 2</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>
              Непрерывность ⟹̸ дифференцируемость
            </p>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
              Функция может быть непрерывной, но не дифференцируемой. Примеры: |x| в нуле, x^(1/3) в нуле, функция Вейерштрасса.
            </div>
          </Card>
        </div>

        <IllustrationAbsValue />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Три контрпримера</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { fn: '|x|', point: 'x=0', issue: 'Излом. Левый наклон −1, правый +1. Производной нет, но функция непрерывна.', color: T.amber },
              { fn: 'x^(1/3)', point: 'x=0', issue: 'Вертикальная касательная. Предел разностного отношения → ∞. Производной нет.', color: T.violet },
              { fn: 'Вейерштрасс', point: 'везде', issue: 'Непрерывна в каждой точке, но не дифференцируема нигде. «Бесконечно изломанная» кривая.', color: T.red },
            ].map(item => (
              <div key={item.fn} style={{ display: 'flex', gap: 12, background: `${item.color}08`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '10px 14px' }}>
                <code style={{ fontSize: 14, fontWeight: 800, color: item.color, flexShrink: 0, width: 80 }}>{item.fn}</code>
                <div>
                  <span style={{ fontSize: 11, color: T.muted }}>в точке {item.point}</span>
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.65, marginTop: 2 }}>{item.issue}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <DSNote>
          <strong>ReLU(x) = max(0, x)</strong> непрерывна всюду, но не дифференцируема в нуле (излом).
          В backpropagation условно считают ReLU′(0) = 0. Это работает на практике, хотя формально производной нет.
          Функция GELU — дифференцируема всюду и лишена этой проблемы.
        </DSNote>
      </section>

      {/* ══ 9. ГРАДИЕНТ ══ */}
      <section id="dg-gradient" style={{ marginBottom: 52 }}>
        <SectionHeader icon={TrendingDown} label="Переход к многомерному" title="Частные производные и градиент" color={T.cyan} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Всё изученное относилось к функциям <strong>одной</strong> переменной. В Data Science функции зависят от тысяч переменных. Как измерить скорость изменения по каждой?
        </p>

        <Card style={{ borderLeft: `4px solid ${T.cyan}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Частная производная</div>
          <FBox
            tex="\frac{\partial f}{\partial x_i} = \lim_{h \to 0} \frac{f(\ldots, x_i+h, \ldots) - f(\ldots, x_i, \ldots)}{h}"
            hint="Производная по xᵢ при фиксированных остальных переменных (они считаются константами)"
            color={T.cyan}
          />
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.8 }}>
            Пример: <M tex="f(x, y) = x^2 + xy + y^3" />
          </div>
          <F tex="\frac{\partial f}{\partial x} = 2x + y \quad(\text{y — константа}),\qquad \frac{\partial f}{\partial y} = x + 3y^2 \quad(\text{x — константа})" />
        </Card>

        <Card style={{ borderLeft: `4px solid ${T.primary}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Градиент — вектор всех частных производных</div>
          <FBox
            tex="\nabla f = \left(\frac{\partial f}{\partial x_1},\; \frac{\partial f}{\partial x_2},\; \ldots,\; \frac{\partial f}{\partial x_n}\right)"
            hint="Читается «набла эф». Указывает направление наискорейшего роста функции."
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, marginBottom: 4 }}>Куда показывает ∇f?</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                В сторону наискорейшего <strong>роста</strong> f. Модуль |∇f| — скорость роста в этом направлении.
              </div>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 4 }}>Антиградиент −∇f</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                Направление наискорейшего <strong>убывания</strong> f. Именно в эту сторону движется градиентный спуск.
              </div>
            </div>
          </div>
        </Card>

        <IllustrationGradientDescent />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Алгоритм градиентного спуска</div>
          <FBox
            tex="w_{t+1} = w_t - \eta \cdot \nabla L(w_t)"
            hint="η — learning rate (скорость обучения). w — веса нейросети. L — функция потерь."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 8 }}>
            {[
              { type: 'Batch GD', note: 'Градиент по всему датасету. Точно, но медленно.', color: T.primary },
              { type: 'SGD', note: 'Градиент по одному примеру. Быстро, но шумно.', color: T.amber },
              { type: 'Mini-batch', note: 'По группе 32–512 примеров. Компромисс. Стандарт.', color: T.green },
            ].map(item => (
              <div key={item.type} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: item.color, marginBottom: 4 }}>{item.type}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.note}</div>
              </div>
            ))}
          </div>
        </Card>

        <Callout color={T.amber} title="Learning rate: слишком большой или маленький">
          <strong>η слишком большой</strong> → перепрыгиваем минимум, алгоритм расходится.
          <strong> η слишком маленький</strong> → сходимость за миллионы шагов.
          Оптимальный learning rate — один из ключевых гиперпараметров. Планировщики (schedulers)
          уменьшают η по мере обучения — большой шаг вначале, маленький при приближении к минимуму.
        </Callout>
      </section>

      {/* ══ 10. DATA SCIENCE ══ */}
      <section id="dg-ds" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Code2} label="Применение" title="Производная в Data Science" />

        <IllustrationActivations />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 20 }}>
          {[
            {
              title: 'Backpropagation',
              formula: '\\frac{\\partial L}{\\partial w_i} = \\frac{\\partial L}{\\partial a} \\cdot \\frac{\\partial a}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w_i}',
              desc: 'Цепное правило послойно. Градиент ошибки передаётся от последнего слоя к первому, умножаясь на производную активации на каждом шаге.',
              tags: ['цепное правило', 'backprop', '∂L/∂w'],
              color: T.primary,
            },
            {
              title: 'Производная сигмоиды',
              formula: "\\sigma'(x) = \\sigma(x)(1 - \\sigma(x))",
              desc: 'Производная сигмоиды выражается через саму сигмоиду — красивое свойство. Максимум производной = 0.25 при x=0. При больших |x| → 0, затухание градиента.',
              tags: ['sigmoid', 'saturation', 'vanishing gradient'],
              color: T.violet,
            },
            {
              title: 'Критические точки и сёдла',
              formula: '\\nabla L(w^*) = 0',
              desc: 'В точках где градиент ноль — кандидаты на min, max или седло. В многомерном пространстве сёдла (минимум по одним направлениям, максимум по другим) встречаются чаще, чем локальные минимумы.',
              tags: ['∇L=0', 'седловая точка', 'Гессиан'],
              color: T.amber,
            },
            {
              title: 'Learning rate scheduling',
              formula: '\\eta_t = \\eta_0 \\cdot \\gamma^t',
              desc: 'Уменьшение шага по мере обучения. Cos annealing, step decay, warmup. Производная подсказывает когда нужен малый шаг — при крутом рельефе.',
              tags: ['η', 'cosine annealing', 'warmup'],
              color: T.green,
            },
          ].map(item => (
            <Card key={item.title} style={{ borderTop: `3px solid ${item.color}` }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 8 }}>{item.title}</div>
              <div style={{ marginBottom: 10 }}><F tex={item.formula} /></div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 10 }}>{item.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {item.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: `${item.color}12`, color: item.color, fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ══ 11. САМОПРОВЕРКА ══ */}
      <section id="dg-check" style={{ marginBottom: 52 }}>
        <SectionHeader icon={CheckCircle2} label="Самопроверка" title="Проверь себя" color={T.amber} />
        <CheckQuestions />
      </section>

      {/* ══ FOOTER ══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ background: T.primaryLight, borderRadius: 20, padding: '22px 28px', border: `1px solid ${T.primaryBorder}` }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Sparkles size={18} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: T.primaryDark, marginBottom: 6 }}>Что запомнить из этой темы</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                "f′(a) = lim[h→0] (f(a+h)−f(a))/h. При h=0 дробь 0/0 — предел «лечит» её.",
                "Геометрически: f′(a) — наклон касательной. Уравнение касательной: y = f(a) + f′(a)(x−a).",
                "7 правил: константа, степень, вынос c, сумма, произведение, частное, цепное. Последнее — основа backprop.",
                "f′>0 → возрастание, f′<0 → убывание, f′=0 → критическая точка. Смена +→− : max; −→+ : min.",
                "f′′>0 → «чаша» ∪, f′′<0 → «горб» ∩. f′′=0 при смене знака → перегиб.",
                "Дифференцируемость ⟹ непрерывность. Обратное неверно: |x| непрерывна, но не дифф. в нуле.",
                "Градиент ∇f — вектор частных производных. Указывает на наискорейший рост. w ← w − η·∇L — градиентный спуск.",
                "Backpropagation = цепное правило, применённое послойно от выхода к входу.",
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <CheckCircle2 size={14} color={T.primary} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
