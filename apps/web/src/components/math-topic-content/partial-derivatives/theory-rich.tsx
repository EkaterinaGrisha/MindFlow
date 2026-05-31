// @ts-nocheck
/**
 * Theory-rich body for «Частные производные».
 * Только статичные SVG-иллюстрации — никаких canvas/интерактивов.
 * Паттерн: SectionHeader, Card, FBox, DSNote, Callout, CheckQuestions.
 * Цветовая палитра T (единая с остальными темами).
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, Brain, Zap, Layers, CheckCircle2,
  Sparkles, ArrowRight, Code2, Target, Activity,
  TrendingDown, GitMerge, Grid3X3,
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

/** Иллюстрация 1: Сечение параболоида — геометрия частной производной */
function IllustrationCrossSection() {
  // Isometric-style 3D sketch of paraboloid z=x²+y²
  // We draw two cross-section curves and their tangents
  const W = 500, H = 280;

  // Iso projection helpers
  const iso = (x: number, y: number, z: number): [number, number] => {
    const px = W / 2 + (x - y) * 38;
    const py = 200 - z * 26 + (x + y) * 18;
    return [px, py];
  };

  // Paraboloid z = x²+y², x,y in [-2,2]
  // Draw wireframe lines
  const wireY: string[][] = [];
  for (let yi = -2; yi <= 2; yi += 1) {
    const pts: string[] = [];
    for (let xi = -2; xi <= 2; xi += 0.15) {
      const z = xi * xi + yi * yi;
      if (z > 8) continue;
      const [px, py] = iso(xi, yi, z);
      pts.push(`${px},${py}`);
    }
    wireY.push(pts);
  }
  const wireX: string[][] = [];
  for (let xi = -2; xi <= 2; xi += 1) {
    const pts: string[] = [];
    for (let yi = -2; yi <= 2; yi += 0.15) {
      const z = xi * xi + yi * yi;
      if (z > 8) continue;
      const [px, py] = iso(xi, yi, z);
      pts.push(`${px},${py}`);
    }
    wireX.push(pts);
  }

  // Cross-section at y=1: z = x²+1, tangent at x=1 (slope=2x=2)
  const csY1: string[] = [];
  for (let xi = -2; xi <= 2; xi += 0.1) {
    const z = xi * xi + 1;
    if (z > 8) continue;
    const [px, py] = iso(xi, 1, z);
    csY1.push(`${px},${py}`);
  }
  // Tangent at (1,1,2): z = 2 + 2*(x-1) = 2x, slope=2
  const tanY1: string[] = [];
  for (let xi = 0.1; xi <= 1.9; xi += 0.2) {
    const z = 2 + 2 * (xi - 1);
    if (z < 0 || z > 8) continue;
    const [px, py] = iso(xi, 1, z);
    tanY1.push(`${px},${py}`);
  }

  // Cross-section at x=1: z = 1+y², tangent at y=1 (slope=2y=2)
  const csX1: string[] = [];
  for (let yi = -2; yi <= 2; yi += 0.1) {
    const z = 1 + yi * yi;
    if (z > 8) continue;
    const [px, py] = iso(1, yi, z);
    csX1.push(`${px},${py}`);
  }

  const [pA, pAy] = iso(1, 1, 2); // focal point

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: сечение поверхности и геометрия частной производной
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }}>

        {/* Wireframe — faint */}
        {wireY.map((pts, i) => (
          <polyline key={`wy${i}`} points={pts.join(' ')} fill="none"
            stroke={`${T.border}`} strokeWidth="0.8" />
        ))}
        {wireX.map((pts, i) => (
          <polyline key={`wx${i}`} points={pts.join(' ')} fill="none"
            stroke={`${T.border}`} strokeWidth="0.8" />
        ))}

        {/* Cross-section at y=1 — green */}
        <polyline points={csY1.join(' ')} fill="none"
          stroke={T.green} strokeWidth="2.5" strokeLinecap="round" />

        {/* Cross-section at x=1 — violet */}
        <polyline points={csX1.join(' ')} fill="none"
          stroke={T.violet} strokeWidth="2.5" strokeLinecap="round" />

        {/* Tangent to y=1 section at x=1 — red dashed */}
        <polyline points={tanY1.join(' ')} fill="none"
          stroke={T.primary} strokeWidth="2" strokeDasharray="6,3" />

        {/* Focal point */}
        <circle cx={pA} cy={pAy} r="6" fill={T.primary} />
        <text x={pA + 8} y={pAy - 8} fontSize="11" fontWeight="800" fill={T.primary}>(1,1,2)</text>

        {/* Annotation: ∂f/∂x */}
        <rect x={W - 200} y={14} width={190} height={58} rx={10}
          fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1" />
        <text x={W - 105} y={32} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.green}>
          зел.: y=1 зафикс. → ∂f/∂x
        </text>
        <text x={W - 105} y={46} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.violet}>
          фиол.: x=1 зафикс. → ∂f/∂y
        </text>
        <text x={W - 105} y={60} textAnchor="middle" fontSize="10" fill={T.primary}>
          касательная (пунктир) = наклон
        </text>

        {/* Plane labels */}
        {(() => {
          const [px, py] = iso(-2.2, 1, 0.5);
          return <text x={px} y={py} fontSize="10" fontWeight="700" fill={T.green}>y=1</text>;
        })()}
        {(() => {
          const [px, py] = iso(1, -2.2, 0.5);
          return <text x={px} y={py} fontSize="10" fontWeight="700" fill={T.violet}>x=1</text>;
        })()}

        {/* Slope annotation */}
        {(() => {
          const [px, py] = iso(1.6, 1, 2 + 2 * 0.6);
          return (
            <text x={px + 5} y={py} fontSize="10" fontWeight="800" fill={T.primary}>
              наклон = ∂f/∂x = 2x = 2
            </text>
          );
        })()}
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Зелёная кривая — сечение плоскостью y=1. Её наклон в точке (1,1) — это <b>∂f/∂x</b>.<br />
        Фиолетовая — сечение плоскостью x=1. Её наклон — <b>∂f/∂y</b>.
      </p>
    </div>
  );
}

/** Иллюстрация 2: Линии уровня и градиент */
function IllustrationGradientField() {
  const W = 400, H = 320;
  const cx = W / 2, cy = H / 2 + 10;
  const sc = 55; // scale

  // f = x²+y², level curves are circles: r=sqrt(c)
  // Draw 5 circles
  const levels = [0.5, 1, 1.8, 2.8, 4];

  // Sample gradient arrows at a few points
  const arrows = [
    [1, 0.6], [-0.8, 1], [0.5, -1.2], [-1, -0.7],
    [1.3, 1.1], [-1.2, 0.3],
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: линии уровня и градиент — f(x,y) = x² + y²
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto' }}>
        {/* Axes */}
        <line x1={30} y1={cy} x2={W - 20} y2={cy} stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={cx} y1={20} x2={cx} y2={H - 20} stroke={T.mutedLight} strokeWidth="1.5" />
        <text x={W - 16} y={cy + 4} fontSize="11" fill={T.muted}>x</text>
        <text x={cx + 4} y={18} fontSize="11" fill={T.muted}>y</text>

        {/* Grid ticks */}
        {[-2, -1, 1, 2].map(i => (
          <g key={i}>
            <text x={cx + i * sc - 4} y={cy + 14} fontSize="9" fill={T.mutedLight}>{i}</text>
            <text x={cx - 14} y={cy - i * sc + 4} fontSize="9" fill={T.mutedLight}>{i}</text>
          </g>
        ))}

        {/* Level curves */}
        {levels.map((level, i) => {
          const r = Math.sqrt(level) * sc;
          const alpha = 0.35 + i * 0.13;
          return (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none"
              stroke={T.primary}
              strokeWidth={1.2 + i * 0.15}
              opacity={alpha} />
          );
        })}

        {/* Level labels */}
        {levels.map((level, i) => {
          const r = Math.sqrt(level) * sc;
          return (
            <text key={i} x={cx + r * 0.707 + 3} y={cy - r * 0.707 - 3}
              fontSize="9" fill={T.primary} opacity={0.6 + i * 0.08}>
              c={level}
            </text>
          );
        })}

        {/* Gradient arrows */}
        <defs>
          <marker id="arr-grad" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={T.red} />
          </marker>
        </defs>
        {arrows.map(([x, y], i) => {
          // gradient of x²+y² = (2x, 2y), normalized
          const gx = 2 * x, gy = 2 * y;
          const norm = Math.sqrt(gx * gx + gy * gy);
          const len = 22;
          const sx = cx + x * sc, sy = cy - y * sc;
          const ex = sx + (gx / norm) * len;
          const ey = sy - (gy / norm) * len;
          return (
            <g key={i}>
              <circle cx={sx} cy={sy} r="3" fill={T.amber} />
              <line x1={sx} y1={sy} x2={ex} y2={ey}
                stroke={T.red} strokeWidth="2" markerEnd="url(#arr-grad)" />
            </g>
          );
        })}

        {/* Perpendicularity annotation */}
        {(() => {
          // At (1,0): level curve is circle r=sc, tangent vertical
          // gradient (2,0) is horizontal — perpendicular
          const sx = cx + 1 * sc, sy = cy;
          return (
            <g>
              {/* right angle symbol */}
              <rect x={sx + 4} y={sy - 12} width={10} height={10}
                fill="none" stroke={T.green} strokeWidth="1.5" />
              <text x={sx + 18} y={sy - 2} fontSize="9" fontWeight="700" fill={T.green}>
                ∇f ⊥ уровню
              </text>
            </g>
          );
        })()}

        {/* Minimum star */}
        <circle cx={cx} cy={cy} r="8" fill={T.green} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.white}>★</text>
        <text x={cx + 10} y={cy - 10} fontSize="10" fontWeight="700" fill={T.green}>мин</text>

        {/* Legend */}
        <rect x={12} y={H - 64} width={164} height={56} rx={8} fill={T.white} fillOpacity="0.95" stroke={T.border} strokeWidth="1" />
        <circle cx={24} cy={H - 48} r="5" fill="none" stroke={T.primary} strokeWidth="1.5" />
        <text x={34} y={H - 44} fontSize="10" fontWeight="600" fill={T.primary}>линии уровня f=const</text>
        <line x1={16} y1={H - 28} x2={34} y2={H - 28} stroke={T.red} strokeWidth="2" markerEnd="url(#arr-grad)" />
        <text x={38} y={H - 24} fontSize="10" fontWeight="600" fill={T.red}>∇f — направление роста</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Стрелки показывают градиент ∇f=(2x, 2y). Они всегда <b>перпендикулярны</b> линиям уровня<br />
        и направлены в сторону <b>наискорейшего роста</b>. Там, где контуры гуще — крутизна выше.
      </p>
    </div>
  );
}

/** Иллюстрация 3: Три типа поверхностей — чаша, горб, седло */
function IllustrationSurfaceTypes() {
  const W = 600, H = 220;

  // Isometric helper for each panel
  const makeIso = (ox: number, oy: number, sc: number) =>
    (x: number, y: number, z: number): [number, number] => [
      ox + (x - y) * sc,
      oy - z * sc * 0.8 + (x + y) * sc * 0.4,
    ];

  const panels = [
    {
      label: 'Чаша (min)', fn: (x: number, y: number) => x * x + y * y,
      color: T.green, sub: 'f=x²+y²', type: '∇f=0 → минимум',
      ox: 100, oy: 160,
    },
    {
      label: 'Горб (max)', fn: (x: number, y: number) => -(x * x + y * y),
      color: T.red, sub: 'f=−x²−y²', type: '∇f=0 → максимум',
      ox: 300, oy: 100,
    },
    {
      label: 'Седло', fn: (x: number, y: number) => x * x - y * y,
      color: T.amber, sub: 'f=x²−y²', type: '∇f=0 → не экстремум',
      ox: 500, oy: 130,
    },
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: три типа стационарных точек — чаша, горб, седло
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 700, display: 'block', margin: '0 auto' }}>
        {panels.map((panel, pi) => {
          const iso = makeIso(panel.ox, panel.oy, 18);
          const sc = 18;
          // Wire grid
          const lines: JSX.Element[] = [];
          const steps = [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8];
          steps.forEach((yv, i) => {
            const pts: string[] = [];
            for (let xi = -1.8; xi <= 1.8; xi += 0.12) {
              const z = panel.fn(xi, yv);
              if (Math.abs(z) > 4) continue;
              const [px, py] = iso(xi, yv, z);
              pts.push(`${px},${py}`);
            }
            lines.push(<polyline key={`wy${i}`} points={pts.join(' ')} fill="none"
              stroke={`${panel.color}50`} strokeWidth="0.8" />);
          });
          steps.forEach((xv, i) => {
            const pts: string[] = [];
            for (let yi = -1.8; yi <= 1.8; yi += 0.12) {
              const z = panel.fn(xv, yi);
              if (Math.abs(z) > 4) continue;
              const [px, py] = iso(xv, yi, z);
              pts.push(`${px},${py}`);
            }
            lines.push(<polyline key={`wx${i}`} points={pts.join(' ')} fill="none"
              stroke={`${panel.color}40`} strokeWidth="0.8" />);
          });

          // Highlight x-axis section
          const sectionPts: string[] = [];
          for (let xi = -1.8; xi <= 1.8; xi += 0.08) {
            const z = panel.fn(xi, 0);
            if (Math.abs(z) > 4) continue;
            const [px, py] = iso(xi, 0, z);
            sectionPts.push(`${px},${py}`);
          }

          // Critical point
          const [cpx, cpy] = iso(0, 0, panel.fn(0, 0));

          return (
            <g key={pi}>
              {lines}
              <polyline points={sectionPts.join(' ')} fill="none"
                stroke={panel.color} strokeWidth="2.2" strokeLinecap="round" />
              <circle cx={cpx} cy={cpy} r="6" fill={panel.color} />
              <text x={cpx + 8} y={cpy - 4} fontSize="9" fontWeight="800" fill={panel.color}>
                ∇f=0
              </text>

              {/* Label */}
              <text x={panel.ox} y={H - 30} textAnchor="middle" fontSize="12" fontWeight="800" fill={panel.color}>
                {panel.label}
              </text>
              <text x={panel.ox} y={H - 17} textAnchor="middle" fontSize="9" fill={T.muted}>
                {panel.sub}
              </text>
              <text x={panel.ox} y={H - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={panel.color}>
                {panel.type}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Все три поверхности имеют ∇f=0 в начале координат.<br />
        Гессиан отличает их: λ&gt;0 → чаша, λ&lt;0 → горб, разные знаки → седло.
      </p>
    </div>
  );
}

/** Иллюстрация 4: Седловая точка — сечения по осям */
function IllustrationSaddle() {
  const W = 440, H = 230;
  const cxL = 110, cxR = 330, cy = 130, sc = 40;

  // Left: f(x,0)=x² — parabola up
  const parUp: string[] = [];
  for (let xi = -2.2; xi <= 2.2; xi += 0.1) {
    parUp.push(`${cxL + xi * sc},${cy - xi * xi * sc * 0.6}`);
  }

  // Right: f(0,y)=-y² — parabola down
  const parDown: string[] = [];
  for (let yi = -2.2; yi <= 2.2; yi += 0.1) {
    parDown.push(`${cxR + yi * sc},${cy + yi * yi * sc * 0.6}`);
  }

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: седловая точка — вдоль X минимум, вдоль Y максимум
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 540, display: 'block', margin: '0 auto' }}>
        {/* Divider */}
        <line x1={W / 2} y1={20} x2={W / 2} y2={H - 10} stroke={T.border} strokeWidth="1" strokeDasharray="5,3" />

        {/* Left panel: y=0 section */}
        <text x={cxL} y={20} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.green}>
          Сечение y=0
        </text>
        <text x={cxL} y={33} textAnchor="middle" fontSize="9" fill={T.muted}>
          f(x,0) = x² → парабола ↑
        </text>
        {/* Axes */}
        <line x1={cxL - 90} y1={cy} x2={cxL + 92} y2={cy} stroke={T.mutedLight} strokeWidth="1.2" />
        <line x1={cxL} y1={50} x2={cxL} y2={H - 14} stroke={T.mutedLight} strokeWidth="1.2" />
        <text x={cxL + 94} y={cy + 4} fontSize="9" fill={T.muted}>x</text>
        <text x={cxL + 4} y={48} fontSize="9" fill={T.muted}>z</text>
        {/* Curve */}
        <polyline points={parUp.join(' ')} fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" />
        {/* Min point */}
        <circle cx={cxL} cy={cy} r="6" fill={T.green} />
        <text x={cxL + 8} y={cy - 8} fontSize="10" fontWeight="800" fill={T.green}>min ↑</text>
        {/* Tangent horizontal */}
        <line x1={cxL - 30} y1={cy} x2={cxL + 30} y2={cy}
          stroke={T.primary} strokeWidth="2" strokeDasharray="5,3" />
        <text x={cxL + 32} y={cy + 4} fontSize="9" fill={T.primary}>f′=0</text>

        {/* Right panel: x=0 section */}
        <text x={cxR} y={20} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.red}>
          Сечение x=0
        </text>
        <text x={cxR} y={33} textAnchor="middle" fontSize="9" fill={T.muted}>
          f(0,y) = −y² → парабола ↓
        </text>
        {/* Axes */}
        <line x1={cxR - 90} y1={cy} x2={cxR + 92} y2={cy} stroke={T.mutedLight} strokeWidth="1.2" />
        <line x1={cxR} y1={50} x2={cxR} y2={H - 14} stroke={T.mutedLight} strokeWidth="1.2" />
        <text x={cxR + 94} y={cy + 4} fontSize="9" fill={T.muted}>y</text>
        <text x={cxR + 4} y={48} fontSize="9" fill={T.muted}>z</text>
        {/* Curve */}
        <polyline points={parDown.join(' ')} fill="none" stroke={T.red} strokeWidth="2.5" strokeLinecap="round" />
        {/* Max point */}
        <circle cx={cxR} cy={cy} r="6" fill={T.red} />
        <text x={cxR + 8} y={cy - 8} fontSize="10" fontWeight="800" fill={T.red}>max ↓</text>
        {/* Tangent horizontal */}
        <line x1={cxR - 30} y1={cy} x2={cxR + 30} y2={cy}
          stroke={T.primary} strokeWidth="2" strokeDasharray="5,3" />
        <text x={cxR + 32} y={cy + 4} fontSize="9" fill={T.primary}>f′=0</text>

        {/* Bottom label */}
        <rect x={W / 4 - 80} y={H - 24} width={160} height={20} rx={6} fill={`${T.amber}18`} />
        <text x={W / 4} y={H - 10} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.amber}>
          ∇f=0, но это не экстремум → СЕДЛО
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        f(x,y)=x²−y²: в начале координат ∇f=0. Но по оси X — минимум, по Y — максимум.<br />
        Функция «уходит вверх» в одних направлениях и «вниз» в других. Это седловая точка.
      </p>
    </div>
  );
}

/** Иллюстрация 5: Гессиан — матрица и классификация */
function IllustrationHessian() {
  const W = 540, H = 240;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: гессиан — матрица вторых производных и классификация
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto' }}>

        {/* Matrix visual — left side */}
        <rect x={20} y={30} width={180} height={160} rx={12}
          fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1.5" />
        <text x={110} y={54} textAnchor="middle" fontSize="12" fontWeight="800" fill={T.primaryDark}>Гессиан H</text>

        {/* 2x2 matrix cells */}
        {[
          { label: '∂²f/∂x²', x: 52, y: 90, color: T.primary },
          { label: '∂²f/∂x∂y', x: 148, y: 90, color: T.violet },
          { label: '∂²f/∂y∂x', x: 52, y: 150, color: T.violet },
          { label: '∂²f/∂y²', x: 148, y: 150, color: T.primary },
        ].map((cell, i) => (
          <g key={i}>
            <rect x={cell.x - 38} y={cell.y - 22} width={76} height={36} rx={7}
              fill={T.white} stroke={`${cell.color}40`} strokeWidth="1.2" />
            <text x={cell.x} y={cell.y - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill={cell.color}>
              {cell.label.split('/')[1]}
            </text>
            <text x={cell.x} y={cell.y + 5} textAnchor="middle" fontSize="9" fill={T.muted}>
              {cell.label.split('/')[0] + '/'}
            </text>
          </g>
        ))}

        {/* Symmetry annotation */}
        <path d="M 148,128 C 130,135 70,135 52,128"
          fill="none" stroke={T.violet} strokeWidth="1.5" strokeDasharray="4,2" />
        <text x={100} y={144} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.violet}>
          = (теорема Шварца)
        </text>

        {/* Arrow */}
        <line x1={210} y1={110} x2={240} y2={110} stroke={T.muted} strokeWidth="1.5"
          markerEnd="none" />
        <polygon points="240,106 240,114 250,110" fill={T.muted} />

        {/* Eigenvalue panel */}
        <text x={270} y={26} fontSize="11" fontWeight="800" fill={T.text} textAnchor="middle">
          Собственные значения λ₁, λ₂
        </text>

        {/* Three cases */}
        {[
          {
            label: 'λ₁>0, λ₂>0', type: 'Минимум', icon: '∪', color: T.green,
            x: 270, y: 55, det: 'det H > 0, fₓₓ > 0',
          },
          {
            label: 'λ₁<0, λ₂<0', type: 'Максимум', icon: '∩', color: T.red,
            x: 270, y: 120, det: 'det H > 0, fₓₓ < 0',
          },
          {
            label: 'разные знаки', type: 'Седло', icon: '×', color: T.amber,
            x: 270, y: 185, det: 'det H < 0',
          },
        ].map((item, i) => (
          <g key={i}>
            <rect x={item.x - 130} y={item.y} width={260} height={52} rx={10}
              fill={`${item.color}10`} stroke={`${item.color}40`} strokeWidth="1.2" />
            <text x={item.x - 112} y={item.y + 22} fontSize="20" fill={item.color}>{item.icon}</text>
            <text x={item.x - 80} y={item.y + 18} fontSize="11" fontWeight="800" fill={item.color}>
              {item.label}
            </text>
            <text x={item.x - 80} y={item.y + 33} fontSize="11" fontWeight="700" fill={T.text}>
              → {item.type}
            </text>
            <text x={item.x + 60} y={item.y + 28} fontSize="9" fontWeight="700" fill={T.muted}
              textAnchor="middle">
              {item.det}
            </text>
          </g>
        ))}
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Гессиан — симметричная матрица (∂²f/∂x∂y = ∂²f/∂y∂x по теореме Шварца).<br />
        Знаки собственных значений λ определяют тип стационарной точки.
      </p>
    </div>
  );
}

/** Иллюстрация 6: Многомерное цепное правило — граф зависимостей */
function IllustrationChainMultivar() {
  const W = 500, H = 210;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: многомерное цепное правило — граф зависимостей
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }}>
        <defs>
          <marker id="arr-chain" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={T.muted} />
          </marker>
          <marker id="arr-back" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
            <path d="M7,0 L0,3.5 L7,7 Z" fill={T.amber} />
          </marker>
        </defs>

        {/* Nodes */}
        {/* t — root */}
        <rect x={20} y={85} width={60} height={40} rx={10}
          fill={T.surface} stroke={T.border} strokeWidth="1.5" />
        <text x={50} y={110} textAnchor="middle" fontSize="14" fontWeight="800" fill={T.muted}>t</text>

        {/* x(t) */}
        <rect x={150} y={44} width={70} height={40} rx={10}
          fill={`${T.green}14`} stroke={`${T.green}50`} strokeWidth="1.5" />
        <text x={185} y={69} textAnchor="middle" fontSize="13" fontWeight="800" fill={T.green}>x(t)</text>

        {/* y(t) */}
        <rect x={150} y={126} width={70} height={40} rx={10}
          fill={`${T.violet}14`} stroke={`${T.violet}50`} strokeWidth="1.5" />
        <text x={185} y={151} textAnchor="middle" fontSize="13" fontWeight="800" fill={T.violet}>y(t)</text>

        {/* f(x,y) */}
        <rect x={320} y={85} width={90} height={40} rx={10}
          fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1.5" />
        <text x={365} y={110} textAnchor="middle" fontSize="13" fontWeight="800" fill={T.primaryDark}>f(x,y)</text>

        {/* Arrows t→x, t→y */}
        <line x1={80} y1={99} x2={148} y2={72} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-chain)" />
        <line x1={80} y1={111} x2={148} y2={138} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-chain)" />

        {/* Arrow labels: dx/dt, dy/dt */}
        <text x={105} y={80} fontSize="9" fontWeight="700" fill={T.green}>dx/dt</text>
        <text x={100} y={132} fontSize="9" fontWeight="700" fill={T.violet}>dy/dt</text>

        {/* Arrows x→f, y→f */}
        <line x1={220} y1={64} x2={318} y2={95} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-chain)" />
        <line x1={220} y1={146} x2={318} y2={115} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-chain)" />

        <text x={258} y={70} fontSize="9" fontWeight="700" fill={T.green}>∂f/∂x</text>
        <text x={258} y={142} fontSize="9" fontWeight="700" fill={T.violet}>∂f/∂y</text>

        {/* df/dt result box */}
        <rect x={430} y={80} width={62} height={50} rx={10}
          fill={T.amberLight} stroke={T.amber} strokeWidth="1.5" />
        <text x={461} y={102} textAnchor="middle" fontSize="9" fontWeight="800" fill={T.amber}>df/dt</text>
        <line x1={410} y1={105} x2={428} y2={105} stroke={T.amber} strokeWidth="2" markerEnd="none" />
        <polygon points="428,101 428,109 436,105" fill={T.amber} />

        {/* Formula below */}
        <rect x={60} y={H - 40} width={W - 80} height={28} rx={8}
          fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1" />
        <text x={W / 2} y={H - 22} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.primaryDark}>
          df/dt = (∂f/∂x)·(dx/dt) + (∂f/∂y)·(dy/dt)
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Изменение f через t складывается из двух путей: t→x→f и t→y→f.<br />
        Каждый путь — произведение локальных производных по рёбрам графа.
      </p>
    </div>
  );
}

/** Иллюстрация 7: Ландшафт потерь — кривизна и условное число */
function IllustrationLossLandscape() {
  const W = 500, H = 270;
  const cx1 = 120, cx2 = 360, cy = 175, scW = 44, scH = 34;

  // Panel 1: well-conditioned (κ ≈ 1) — round bowl
  const contoursRound = [0.4, 0.9, 1.6, 2.5];
  // Panel 2: ill-conditioned (κ >> 1) — elongated ellipses
  const contoursElong = [0.4, 0.9, 1.6, 2.5];

  // Trajectory: round — direct, elongated — zigzag
  const trajRound = [[-1.8, 1.6], [-1.1, 1.0], [-0.5, 0.5], [-0.1, 0.1], [0, 0]];
  const trajElong = [
    [-1.8, 0.5], [0.6, 0.48], [-0.55, 0.46], [0.44, 0.44],
    [-0.35, 0.42], [0.28, 0.40], [-0.2, 0.38], [0.1, 0.35],
    [-0.05, 0.3], [0, 0],
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: ландшафт потерь — хорошо vs плохо обусловленный
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }}>
        {/* Divider */}
        <line x1={W / 2} y1={20} x2={W / 2} y2={H - 30} stroke={T.border} strokeWidth="1" strokeDasharray="5,3" />

        {/* Panel labels */}
        <text x={cx1} y={22} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.green}>
          κ ≈ 1 (хорошо обусловлен)
        </text>
        <text x={cx2} y={22} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.red}>
          κ ≫ 1 (плохо: «овраг»)
        </text>

        {/* Round contours */}
        {contoursRound.map((level, i) => (
          <ellipse key={i} cx={cx1} cy={cy} rx={Math.sqrt(level) * scW} ry={Math.sqrt(level) * scH}
            fill="none" stroke={T.primary} strokeWidth={1 + i * 0.1} opacity={0.35 + i * 0.15} />
        ))}

        {/* Elongated contours */}
        {contoursElong.map((level, i) => (
          <ellipse key={i} cx={cx2} cy={cy} rx={Math.sqrt(level) * scW * 2.4} ry={Math.sqrt(level) * scH * 0.3}
            fill="none" stroke={T.red} strokeWidth={1 + i * 0.1} opacity={0.35 + i * 0.15} />
        ))}

        {/* Trajectories */}
        <polyline
          points={trajRound.map(([x, y]) => `${cx1 + x * scW},${cy - y * scH}`).join(' ')}
          fill="none" stroke={T.green} strokeWidth="2.2" strokeLinejoin="round" />
        {trajRound.map(([x, y], i) => (
          <circle key={i} cx={cx1 + x * scW} cy={cy - y * scH} r="3"
            fill={T.green} opacity={0.3 + i / trajRound.length * 0.7} />
        ))}

        <polyline
          points={trajElong.map(([x, y]) => `${cx2 + x * scW * 0.9},${cy - y * scH * 3.5}`).join(' ')}
          fill="none" stroke={T.amber} strokeWidth="2.2" strokeLinejoin="round" />
        {trajElong.map(([x, y], i) => (
          <circle key={i} cx={cx2 + x * scW * 0.9} cy={cy - y * scH * 3.5} r="3"
            fill={T.amber} opacity={0.25 + i / trajElong.length * 0.75} />
        ))}

        {/* Minimum stars */}
        <circle cx={cx1} cy={cy} r="8" fill={T.green} />
        <text x={cx1} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.white}>★</text>
        <circle cx={cx2} cy={cy} r="8" fill={T.red} />
        <text x={cx2} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.white}>★</text>

        {/* Annotations */}
        <text x={cx1} y={cy + 50} textAnchor="middle" fontSize="10" fontWeight="700" fill={T.green}>
          быстрая сходимость
        </text>
        <text x={cx2} y={cy + 50} textAnchor="middle" fontSize="10" fontWeight="700" fill={T.amber}>
          зигзаги вдоль оврага
        </text>

        {/* κ formula */}
        <rect x={W / 4 - 70} y={H - 26} width={140} height={20} rx={6} fill={T.greenLight} />
        <text x={W / 4} y={H - 12} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.green}>
          κ = λ_max / λ_min ≈ 1
        </text>
        <rect x={3 * W / 4 - 70} y={H - 26} width={140} height={20} rx={6} fill={T.redLight} />
        <text x={3 * W / 4} y={H - 12} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.red}>
          κ = λ_max / λ_min ≫ 1
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Слева — круглые контуры, градиент направлен прямо к минимуму. Справа — вытянутый «овраг»:<br />
        градиент перпендикулярен контурам, но не к минимуму → зигзаг-траектория, медленная сходимость.
      </p>
    </div>
  );
}

// ─── Self-check ───────────────────────────────────────────────────────────────
function CheckQuestions() {
  const questions = [
    {
      q: 'Найдите ∂f/∂x для f(x,y) = x³y + eˣʸ',
      options: [
        '3x²y + y·eˣʸ',
        '3x²y + x·eˣʸ',
        'x³ + eˣʸ',
        '3x²y + eˣʸ',
      ],
      correct: 0,
      explanation: 'При дифференцировании по x переменная y — константа. (x³y)ₓ = 3x²y. (eˣʸ)ₓ = eˣʸ · (xy)ₓ = eˣʸ · y. Итого: 3x²y + y·eˣʸ.',
    },
    {
      q: 'Что означает: все частные производные равны нулю в точке (a,b)?',
      options: [
        'В точке обязательно минимум',
        'В точке обязательно максимум',
        'Точка стационарная — кандидат на экстремум или седло',
        'Функция не определена в точке',
      ],
      correct: 2,
      explanation: '∇f=0 означает лишь, что точка стационарная. Нужен анализ Гессиана, чтобы понять: минимум (λ>0), максимум (λ<0) или седло (разные знаки λ).',
    },
    {
      q: 'f(x,y) = x²−y². Каков тип точки (0,0)?',
      options: [
        'Минимум',
        'Максимум',
        'Седловая точка',
        'Точка перегиба',
      ],
      correct: 2,
      explanation: 'fₓₓ=2, fᵧᵧ=−2, fₓᵧ=0. det H = 2·(−2) − 0 = −4 < 0 → седло. Вдоль x — минимум (f=x²), вдоль y — максимум (f=−y²).',
    },
    {
      q: 'Чему равен градиент f(x,y)=ln(x²+y²) в точке (1,1)?',
      options: [
        '(1, 1)',
        '(2, 2)',
        '(1/2, 1/2)',
        '(0, 0)',
      ],
      correct: 0,
      explanation: '∂f/∂x = 2x/(x²+y²), ∂f/∂y = 2y/(x²+y²). В (1,1): ∂f/∂x = 2/(1+1) = 1, ∂f/∂y = 1. Градиент = (1,1).',
    },
    {
      q: 'Как многомерное цепное правило связано с backpropagation?',
      options: [
        'Никак не связано',
        'Позволяет вычислить ∂L/∂w для каждого веса, применяя df/dt = Σ (∂f/∂xᵢ)(dxᵢ/dt) послойно',
        'Используется только для функций двух переменных',
        'Заменяет градиентный спуск',
      ],
      correct: 1,
      explanation: 'Backpropagation — это применение многомерного цепного правила к сети, где f — это L (функция потерь), а xᵢ — активации предыдущего слоя. Правило разворачивается от выхода к входу, шаг за шагом вычисляя ∂L/∂w для каждого веса.',
    },
    {
      q: 'f(x,y)=x³+y³−3xy, стационарная точка (1,1). det H = 27 > 0, fₓₓ = 6 > 0. Что это?',
      options: [
        'Максимум',
        'Минимум',
        'Седло',
        'Точка перегиба',
      ],
      correct: 1,
      explanation: 'det H > 0 и fₓₓ > 0 → минимум по критерию второго порядка. f(1,1) = 1+1−3 = −1 — локальный минимум функции.',
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
export default function PartialDerivativesTheoryRich() {
  const nav = [
    { id: 'pd-why', label: 'Зачем это' },
    { id: 'pd-multivars', label: 'Функции n переменных' },
    { id: 'pd-definition', label: 'Определение' },
    { id: 'pd-geometry', label: 'Геометрия' },
    { id: 'pd-technique', label: 'Техника вычисления' },
    { id: 'pd-gradient', label: 'Градиент' },
    { id: 'pd-stationary', label: 'Стационарные точки' },
    { id: 'pd-saddle', label: 'Седловые точки' },
    { id: 'pd-hessian', label: 'Гессиан' },
    { id: 'pd-classify', label: 'Классификация' },
    { id: 'pd-chain', label: 'Цепное правило' },
    { id: 'pd-ds', label: 'Data Science' },
    { id: 'pd-check', label: 'Проверь себя' },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Заголовок ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Activity size={15} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: T.primary, textTransform: 'uppercase' }}>Математический анализ</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, color: T.muted }}>около 28 минут</span>
        </div>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>
          Частные производные
        </h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16, lineHeight: 1.6 }}>
          Функции многих переменных, частные производные, градиент, гессиан, стационарные точки и сёдла — и как всё это вместе даёт алгоритм обучения нейросетей.
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
      <section id="pd-why" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sparkles} label="Мотивация" title="Зачем это вообще нужно" />

        <div style={{ background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            10 000 параметров — и ни одного лишнего
          </div>
          <p style={{ margin: '0 0 10px', color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Вы обучаете нейросеть. У неё 10 000 параметров. Функция потерь зависит от каждого. Вопрос:
            как понять, в какую сторону изменить <em>каждый конкретный</em> параметр, чтобы ошибка уменьшилась?
          </p>
          <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Нужно вычислить <strong>частную производную</strong> потерь по каждому параметру —
            насколько изменится ошибка, если чуть-чуть шевельнуть именно этот вес, зафиксировав все остальные.
            10 000 таких производных, собранных в вектор — это <strong>градиент</strong>.
            Он указывает направление наискорейшего роста ошибки. Шаг в противоположную сторону — и ошибка падает.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { n: '1', title: 'Частная производная', d: '«Насколько меняется f, если сдвинуть только xᵢ»', color: T.primary },
            { n: '2', title: 'Градиент ∇f', d: 'Вектор всех частных производных. Наискорейший рост', color: T.green },
            { n: '3', title: 'Стационарная точка', d: '∇f=0 — кандидат на min, max или седло', color: T.violet },
            { n: '4', title: 'Гессиан H', d: 'Матрица вторых производных. Различает типы точек', color: T.amber },
            { n: '5', title: 'Цепное правило', d: 'Основа backpropagation в нейросетях', color: T.cyan },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{item.n}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>

        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.amber, textTransform: 'uppercase', marginBottom: 8 }}>Метафора: холмистая местность</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.8 }}>
            Вы стоите на склоне. Ваша высота <M tex="h(x,y)" /> зависит от двух координат.
            Хотите узнать наклон строго на север? Смотрите только в направлении «север–юг»,
            игнорируя «восток–запад» — это <M tex="\partial h / \partial y" />.
          </p>
          <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.8 }}>
            Хотите найти направление самого крутого подъёма? Это не строго на север и не строго на восток,
            а некоторое комбинированное направление. Именно его указывает <strong>градиент</strong> —
            вектор из обоих наклонов.
          </p>
        </Card>
      </section>

      {/* ══ 1. ФУНКЦИИ НЕСКОЛЬКИХ ПЕРЕМЕННЫХ ══ */}
      <section id="pd-multivars" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Grid3X3} label="Понятие 1" title="Функции нескольких переменных" color={T.green} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          До сих пор: <M tex="y = f(x)" /> — один вход, один выход, кривая на плоскости.
          Теперь входов несколько. График стал <strong>поверхностью</strong> в пространстве.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { fn: 'z = x² + y²', type: 'Параболоид', desc: 'Форма чаши. Минимум в (0,0).', color: T.green, tag: 'min в нуле' },
            { fn: 'z = x² − y²', type: 'Седло', desc: 'Вдоль X — подъём, вдоль Y — спуск.', color: T.amber, tag: 'седло в нуле' },
            { fn: 'z = xy', type: 'Гиперболич. параболоид', desc: 'Тоже седло, повёрнутое на 45°.', color: T.violet, tag: 'седло' },
            { fn: 'L(w₁,...,wₙ)', desc: 'n входов (весов), 1 выход (ошибка). Нарисовать нельзя, но математика та же.', color: T.cyan, type: 'Функция потерь нейросети', tag: 'n→∞' },
          ].map(item => (
            <div key={item.fn || item.type} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <code style={{ fontSize: 13, fontWeight: 800, color: item.color, display: 'block', marginBottom: 6 }}>{item.fn}</code>
              <div style={{ fontWeight: 700, fontSize: 12, color: T.text, marginBottom: 4 }}>{item.type}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, marginBottom: 6 }}>{item.desc}</div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${item.color}12`, color: item.color, fontWeight: 600 }}>{item.tag}</span>
            </div>
          ))}
        </div>

        <Callout color={T.primary} title="Связь с прошлой темой">
          Для функции одной переменной была одна производная f′(x). Для функций n переменных
          производных n штук — по одной на каждое направление. Принцип тот же:
          смотрим, как быстро меняется f при сдвиге по одной оси.
        </Callout>
      </section>

      {/* ══ 2. ОПРЕДЕЛЕНИЕ ══ */}
      <section id="pd-definition" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Определение" title="Частная производная: формальное определение" color={T.primary} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Ключевая идея: <strong>фиксируем всё, кроме одной переменной</strong>, и считаем обычную производную по этой одной.
        </p>

        <FBox
          tex="\frac{\partial f}{\partial x_i} = \lim_{h \to 0} \frac{f(\ldots,\, x_i + h,\, \ldots) - f(\ldots,\, x_i,\, \ldots)}{h}"
          hint="Меняется только xᵢ. Все остальные переменные — константы."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { sym: '∂f/∂x', color: T.primary, title: 'Основное обозначение', body: 'Круглая «д» (partial) напоминает: переменных несколько, это не обычная d/dx.' },
            { sym: 'fₓ', color: T.green, title: 'Краткое обозначение', body: 'Удобно при вычислениях. fₓ = ∂f/∂x, fᵧ = ∂f/∂y.' },
            { sym: '∂ₓf', color: T.violet, title: 'Операторное', body: 'Применяется в дифференциальных уравнениях и операторной теории.' },
          ].map(item => (
            <div key={item.sym} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <code style={{ fontSize: 20, fontWeight: 800, color: item.color, display: 'block', marginBottom: 6 }}>{item.sym}</code>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>

        <Card style={{ borderLeft: `4px solid ${T.green}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Пример: f(x,y) = x² + y²</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.green, marginBottom: 6 }}>По x (y — константа)</div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>
                (x²)′ = 2x, &ensp; (y²)′ = 0
              </div>
              <code style={{ fontSize: 16, fontWeight: 800, color: T.green }}>∂f/∂x = 2x</code>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.violet, marginBottom: 6 }}>По y (x — константа)</div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>
                (x²)′ = 0, &ensp; (y²)′ = 2y
              </div>
              <code style={{ fontSize: 16, fontWeight: 800, color: T.violet }}>∂f/∂y = 2y</code>
            </div>
          </div>
          <div style={{ marginTop: 12, background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: T.primaryDark, textAlign: 'center' }}>
            В точке (3, 4): ∂f/∂x = 6, &ensp; ∂f/∂y = 8
          </div>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: '8px 0 0' }}>
            Интерпретация: при движении из (3,4) строго вдоль оси X функция растёт со скоростью 6,
            вдоль оси Y — со скоростью 8.
          </p>
        </Card>
      </section>

      {/* ══ 3. ГЕОМЕТРИЯ ══ */}
      <section id="pd-geometry" style={{ marginBottom: 52 }}>
        <SectionHeader icon={BookOpen} label="Геометрия" title="Сечение поверхности — наклон вдоль оси" color={T.violet} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Частная производная имеет ясный геометрический смысл для поверхности <M tex="z = f(x,y)" />.
          Зафиксируем <M tex="y = y_0" /> — вертикальная плоскость рассекает поверхность, и в сечении
          получается кривая. Наклон касательной к этой кривой — это <M tex="\partial f / \partial x" />.
        </p>

        <IllustrationCrossSection />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Касательная плоскость</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
            Две частные производные задают два наклона в двух перпендикулярных направлениях.
            Вместе они определяют <strong>касательную плоскость</strong> к поверхности в точке <M tex="(x_0, y_0)" />:
          </p>
          <FBox
            tex="z = f(x_0, y_0) + f_x(x_0,y_0)\cdot(x-x_0) + f_y(x_0,y_0)\cdot(y-y_0)"
            hint="Обобщение уравнения касательной на двумерный случай"
            color={T.violet}
          />
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: 0 }}>
            Это <strong>лучшее линейное приближение</strong> поверхности в данной точке — аналог касательной для кривой.
            При «зуме» вблизи точки поверхность и плоскость становятся неразличимы.
          </p>
        </Card>
      </section>

      {/* ══ 4. ТЕХНИКА ВЫЧИСЛЕНИЯ ══ */}
      <section id="pd-technique" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Техника" title="Вычисление частных производных" color={T.amber} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Алгоритм прост: мысленно объявляем все переменные, кроме одной, числами — и дифференцируем обычными правилами.
        </p>

        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Алгоритм</div>
          {[
            { n: '1', text: 'Выбираем переменную дифференцирования, например xᵢ.', color: T.primary },
            { n: '2', text: 'Мысленно говорим: «все остальные переменные — константы».', color: T.violet },
            { n: '3', text: 'Применяем обычные правила: степень, цепное, произведение, частное.', color: T.amber },
            { n: '4', text: 'Если нужно значение в точке — подставляем координаты после дифференцирования.', color: T.green },
          ].map(item => (
            <div key={item.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.n}</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{item.text}</div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>
            Пример: f(x,y,z) = x³y² + sin(xz) + eʸ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                var: 'x', fix: 'y, z', color: T.primary,
                steps: [
                  { term: '(x³y²)', deriv: '3x²·y²', note: 'y² — постоянный множитель' },
                  { term: '(sin(xz))', deriv: 'cos(xz)·z', note: 'цепное правило, внутр. (xz) → z' },
                  { term: '(eʸ)', deriv: '0', note: 'нет x' },
                ],
                result: '∂f/∂x = 3x²y² + z·cos(xz)',
              },
              {
                var: 'y', fix: 'x, z', color: T.green,
                steps: [
                  { term: '(x³y²)', deriv: 'x³·2y', note: 'x³ — постоянный множитель' },
                  { term: '(sin(xz))', deriv: '0', note: 'нет y' },
                  { term: '(eʸ)', deriv: 'eʸ', note: 'стандарт' },
                ],
                result: '∂f/∂y = 2x³y + eʸ',
              },
              {
                var: 'z', fix: 'x, y', color: T.violet,
                steps: [
                  { term: '(x³y²)', deriv: '0', note: 'нет z' },
                  { term: '(sin(xz))', deriv: 'cos(xz)·x', note: 'внутр. (xz) → x' },
                  { term: '(eʸ)', deriv: '0', note: 'нет z' },
                ],
                result: '∂f/∂z = x·cos(xz)',
              },
            ].map(item => (
              <div key={item.var} style={{ background: `${item.color}08`, border: `1px solid ${item.color}30`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: item.color, textTransform: 'uppercase', marginBottom: 8 }}>
                  По {item.var} (фиксируем {item.fix})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: '4px 12px', fontFamily: 'monospace', fontSize: 12, marginBottom: 10 }}>
                  {item.steps.map((s, i) => (
                    <>
                      <span key={`t${i}`} style={{ color: T.text, fontWeight: 600 }}>{s.term}</span>
                      <span key={`d${i}`} style={{ color: item.color, fontWeight: 700 }}>→ {s.deriv}</span>
                      <span key={`n${i}`} style={{ color: T.muted }}>{s.note}</span>
                    </>
                  ))}
                </div>
                <code style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.result}</code>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>
            Разбор «маленького» примера: f(x,y) = x²y + 3xy², точка (1,2)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, marginBottom: 6 }}>∂f/∂x (y — константа)</div>
              <F tex="\partial f/\partial x = 2xy + 3y^2" />
              <div style={{ background: T.primaryLight, borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, color: T.primaryDark, textAlign: 'center' }}>
                В (1,2): 2·1·2 + 3·4 = 4 + 12 = <b>16</b>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 6 }}>∂f/∂y (x — константа)</div>
              <F tex="\partial f/\partial y = x^2 + 6xy" />
              <div style={{ background: T.greenLight, borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, color: '#065f46', textAlign: 'center' }}>
                В (1,2): 1 + 6·1·2 = 1 + 12 = <b>13</b>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: '10px 0 0' }}>
            В точке (1,2): вдоль оси X функция растёт со скоростью 16, вдоль оси Y — со скоростью 13.
          </p>
        </Card>
      </section>

      {/* ══ 5. ГРАДИЕНТ ══ */}
      <section id="pd-gradient" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Главный объект" title="Градиент — вектор всех частных производных" color={T.green} />

        <FBox
          tex="\nabla f = \left(\frac{\partial f}{\partial x_1},\; \frac{\partial f}{\partial x_2},\; \ldots,\; \frac{\partial f}{\partial x_n}\right)"
          hint="Символ ∇ — «набла». Читается «градиент f». Для f(x,y): ∇f = (fₓ, fᵧ)."
          color={T.green}
        />

        <IllustrationGradientField />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            {
              icon: '→', color: T.red,
              title: 'Направление роста',
              body: 'Градиент указывает направление наискорейшего роста f. В каждой точке — самый крутой подъём.',
            },
            {
              icon: '|∇f|', color: T.primary,
              title: 'Крутизна подъёма',
              body: 'Длина градиента ‖∇f‖ = √(fₓ²+fᵧ²) — максимальная скорость роста. Большой градиент → крутой склон.',
            },
            {
              icon: '⊥', color: T.violet,
              title: 'Перпендикуляр к уровню',
              body: 'Градиент всегда перпендикулярен линии уровня f=const. Это универсальное геометрическое свойство.',
            },
            {
              icon: '−∇', color: T.green,
              title: 'Антиградиент',
              body: '−∇f — направление наискорейшего убывания. Именно в эту сторону движется градиентный спуск.',
            },
          ].map(item => (
            <div key={item.icon} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Пример вычисления градиента</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
            <M tex="f(x,y) = x^2 + y^2" />. В точке <M tex="(3,4)" />:
          </p>
          <F tex="\nabla f = (2x,\; 2y)\big|_{(3,4)} = (6,\; 8)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
              <b style={{ color: T.green }}>Длина:</b> ‖∇f‖ = √(36+64) = <b style={{ color: T.green }}>10</b><br />
              <span style={{ color: T.muted }}>Функция растёт со скоростью 10 ед./ед. пути</span>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
              <b style={{ color: T.violet }}>Направление:</b> (6,8)/10 = (0.6, 0.8)<br />
              <span style={{ color: T.muted }}>Единичный вектор наискорейшего роста</span>
            </div>
          </div>
        </Card>
      </section>

      {/* ══ 6. СТАЦИОНАРНЫЕ ТОЧКИ ══ */}
      <section id="pd-stationary" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Экстремумы" title="Стационарные точки: ∇f = 0" color={T.violet} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          В стационарной точке все частные производные равны нулю — касательная плоскость горизонтальна. Это кандидат на экстремум или седло.
        </p>

        <FBox
          tex="\nabla f = \mathbf{0} \quad \Longleftrightarrow \quad \frac{\partial f}{\partial x_1} = 0,\; \ldots,\; \frac{\partial f}{\partial x_n} = 0"
          hint="Необходимое условие экстремума. Не достаточное: ∇f=0 не гарантирует экстремум!"
          color={T.violet}
        />

        <IllustrationSurfaceTypes />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { title: 'f = x²+y²', type: 'Чаша → минимум', note: 'Вдоль любого направления из (0,0) функция растёт.', color: T.green },
            { title: 'f = −x²−y²', type: 'Горб → максимум', note: 'Вдоль любого направления функция падает.', color: T.red },
            { title: 'f = x²−y²', type: 'Седло → не экстремум', note: 'По X растёт, по Y падает. Нет ни min, ни max.', color: T.amber },
          ].map(item => (
            <Card key={item.title} style={{ borderTop: `3px solid ${item.color}` }}>
              <code style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.title}</code>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, margin: '6px 0 4px' }}>{item.type}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{item.note}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ══ 7. СЕДЛОВЫЕ ТОЧКИ ══ */}
      <section id="pd-saddle" style={{ marginBottom: 52 }}>
        <SectionHeader icon={GitMerge} label="Особый случай" title="Седловые точки — ловушка для оптимизации" color={T.amber} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Функция <M tex="f(x,y) = x^2 - y^2" /> в точке (0,0): градиент равен нулю, но это не экстремум.
          По одному направлению — минимум, по другому — максимум.
        </p>

        <IllustrationSaddle />

        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Почему седло — это проблема в ML</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { text: 'В пространстве 10 000 параметров сёдел несравнимо больше, чем минимумов. Чем больше размерность — тем чаще встречаются точки, где одни λ положительны, а другие отрицательны.', color: T.amber },
              { text: 'В седловой точке ∇f=0, поэтому градиентный спуск «останавливается» или замедляется до минимума. Алгоритм не знает, что находится на перевале, а не в долине.', color: T.red },
              { text: 'Методы борьбы: momentum (импульс), Adam, RMSProp — они «разгоняют» оптимизатор в нужном направлении, не давая зависнуть в седле.', color: T.green },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: `${item.color}08`, border: `1px solid ${item.color}25`, borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{i === 0 ? '⚠️' : i === 1 ? '🔴' : '✅'}</span>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ══ 8. ГЕССИАН ══ */}
      <section id="pd-hessian" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Вторые производные" title="Гессиан — матрица кривизны" color={T.primary} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Для функции одной переменной вторая производная показывала кривизну (чаша или горб).
          Для функции n переменных вторых производных <M tex="n^2" /> — они собираются в <strong>матрицу Гессе</strong>.
        </p>

        <FBox
          tex="H_f = \begin{pmatrix} \partial^2 f/\partial x_1^2 & \partial^2 f/\partial x_1\partial x_2 & \cdots \\ \partial^2 f/\partial x_2\partial x_1 & \partial^2 f/\partial x_2^2 & \cdots \\ \vdots & \vdots & \ddots \end{pmatrix}"
          hint="Квадратная матрица n×n. По теореме Шварца: ∂²f/∂xᵢ∂xⱼ = ∂²f/∂xⱼ∂xᵢ — гессиан симметричен."
        />

        <IllustrationHessian />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>
            Пример: f(x,y) = x³ + 3xy²
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'Первые производные', items: ['fₓ = 3x² + 3y²', 'fᵧ = 6xy'], color: T.green },
              { label: 'Вторые производные', items: ['fₓₓ = 6x', 'fₓᵧ = 6y', 'fᵧₓ = 6y ✓', 'fᵧᵧ = 6x'], color: T.violet },
              {
                label: 'Гессиан', items: ['H = ⎡6x  6y⎤', '    ⎣6y  6x⎦'],
                color: T.primary,
              },
            ].map(item => (
              <div key={item.label} style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.label}</div>
                {item.items.map((s, i) => (
                  <code key={i} style={{ fontSize: 12, color: T.text, display: 'block', lineHeight: 1.7 }}>{s}</code>
                ))}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: '10px 0 0' }}>
            Теорема Шварца подтверждена: fₓᵧ = fᵧₓ = 6y. Гессиан симметричен.
          </p>
        </Card>
      </section>

      {/* ══ 9. КЛАССИФИКАЦИЯ ══ */}
      <section id="pd-classify" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Brain} label="Критерий" title="Классификация стационарных точек через гессиан" color={T.green} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { lambda: 'Все λᵢ > 0', type: 'Минимум', icon: '∪', note: 'Гессиан положительно определён. Чаша по всем направлениям.', color: T.green },
            { lambda: 'Все λᵢ < 0', type: 'Максимум', icon: '∩', note: 'Гессиан отрицательно определён. Горб по всем направлениям.', color: T.red },
            { lambda: 'Разные знаки λᵢ', type: 'Седло', icon: '×', note: 'Одни направления — чаша, другие — горб.', color: T.amber },
            { lambda: 'Есть нулевые λᵢ', type: 'Неопределённо', icon: '?', note: 'Тест не даёт ответа. Нужен дополнительный анализ.', color: T.muted },
          ].map(item => (
            <div key={item.lambda} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
              <code style={{ fontSize: 12, color: item.color, fontWeight: 700, display: 'block', marginBottom: 4 }}>{item.lambda}</code>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.type}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.note}</div>
            </div>
          ))}
        </div>

        <Card style={{ borderLeft: `4px solid ${T.cyan}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Быстрый критерий для f(x,y)</div>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>
            Не вычисляя собственных значений — через определитель гессиана:
          </p>
          <FBox tex="\det H = f_{xx} f_{yy} - f_{xy}^2" hint="Вычислить в стационарной точке" color={T.cyan} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { cond: 'det H > 0 и fₓₓ > 0', result: 'Минимум ∪', color: T.green },
              { cond: 'det H > 0 и fₓₓ < 0', result: 'Максимум ∩', color: T.red },
              { cond: 'det H < 0', result: 'Седло', color: T.amber },
              { cond: 'det H = 0', result: 'Тест не работает — нужен доп. анализ', color: T.muted },
            ].map(item => (
              <div key={item.cond} style={{ display: 'flex', gap: 12, alignItems: 'center', background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '8px 14px' }}>
                <code style={{ fontSize: 12, fontWeight: 700, color: item.color, minWidth: 160 }}>{item.cond}</code>
                <ArrowRight size={14} color={T.mutedLight} />
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.result}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>
            Полный разбор: f(x,y) = x³ + y³ − 3xy
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                step: 'Шаг 1. Частные производные первого порядка',
                content: 'fₓ = 3x² − 3y = 0 → y = x²\nfᵧ = 3y² − 3x = 0 → y² = x',
                color: T.primary,
              },
              {
                step: 'Шаг 2. Система уравнений → стационарные точки',
                content: 'Подставляем y=x²: (x²)² = x → x⁴−x=0 → x(x³−1)=0\nx=0 → (0,0)\nx=1 → (1,1)',
                color: T.violet,
              },
              {
                step: 'Шаг 3. Гессиан: fₓₓ=6x, fₓᵧ=−3, fᵧᵧ=6y',
                content: 'H = ⎡6x  −3⎤\n    ⎣−3  6y⎦',
                color: T.amber,
              },
              {
                step: 'Шаг 4. Классификация',
                content: '(0,0): det H = 0·0 − (−3)² = −9 < 0 → СЕДЛО\n(1,1): det H = 36 − 9 = 27 > 0, fₓₓ=6>0 → МИНИМУМ\nf(1,1) = 1+1−3 = −1',
                color: T.green,
              },
            ].map((item, i) => (
              <div key={i} style={{ background: `${item.color}08`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.step}</div>
                <pre style={{ margin: 0, fontSize: 13, fontFamily: 'monospace', color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.content}</pre>
              </div>
            ))}
          </div>
        </Card>

        <DSNote>
          В нейросетях матрица Гессиана имеет размер n×n, где n — число параметров (миллионы).
          Хранить её целиком невозможно — поэтому методы второго порядка (L-BFGS)
          используют <strong>приближённый</strong> гессиан. Число обусловленности
          <M tex="\kappa = \lambda_{\max}/\lambda_{\min}" /> определяет скорость сходимости:
          большое κ — «овраг», медленный спуск.
        </DSNote>
      </section>

      {/* ══ 10. ЦЕПНОЕ ПРАВИЛО ══ */}
      <section id="pd-chain" style={{ marginBottom: 52 }}>
        <SectionHeader icon={GitMerge} label="Связи в сети" title="Многомерное цепное правило" color={T.cyan} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Если <M tex="f(x,y)" />, а <M tex="x = x(t)" /> и <M tex="y = y(t)" /> — полная производная f по t
          складывается из двух «путей» изменения:
        </p>

        <FBox
          tex="\frac{df}{dt} = \frac{\partial f}{\partial x}\cdot\frac{dx}{dt} + \frac{\partial f}{\partial y}\cdot\frac{dy}{dt}"
          hint="Изменение f через x + изменение f через y. Для n переменных: сумма n слагаемых."
          color={T.cyan}
        />

        <IllustrationChainMultivar />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Проверочный пример</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
            <M tex="f(x,y)=x^2+y^2" />, <M tex="x=\cos t" />, <M tex="y=\sin t" />.
          </p>
          <F tex="\frac{df}{dt} = 2x \cdot(-\sin t) + 2y \cdot \cos t = -2\cos t\sin t + 2\sin t\cos t = 0" />
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: '4px 0 0' }}>
            И правда: f = cos²t + sin²t = 1 — константа, производная ноль. ✓
          </p>
        </Card>

        <Card style={{ borderLeft: `4px solid ${T.primary}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Общая форма</div>
          <FBox
            tex="\frac{df}{dt} = \sum_{i=1}^{n} \frac{\partial f}{\partial x_i} \cdot \frac{dx_i}{dt} = \nabla f \cdot \frac{d\mathbf{x}}{dt}"
            hint="Скалярное произведение градиента и вектора скоростей изменения переменных"
            color={T.primary}
          />
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: 0 }}>
            Когда переменных n и каждая зависит от m параметров — правило обобщается на
            матрицу якобиана. Именно это используется в backpropagation.
          </p>
        </Card>

        <DSNote>
          <strong>Backpropagation — это многомерное цепное правило.</strong>
          Функция потерь L зависит от выходов последнего слоя, те от предыдущего, те от весов.
          Цепное правило «разворачивает» эту зависимость от конца к началу:
          <M tex="\partial L/\partial w_1 = (\partial L/\partial a_k) \cdot (\partial a_k/\partial a_{k-1}) \cdots (\partial a_2/\partial w_1)" />.
          Каждое звено — умножение на локальную производную слоя.
        </DSNote>
      </section>

      {/* ══ 11. DATA SCIENCE ══ */}
      <section id="pd-ds" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Code2} label="Применение" title="Частные производные в Data Science" />

        <IllustrationLossLandscape />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 20 }}>
          {[
            {
              title: 'Градиентный спуск',
              formula: 'w_{t+1} = w_t - \\eta \\cdot \\nabla L(w_t)',
              desc: '∇L — вектор всех ∂L/∂wᵢ. Каждая компонента говорит: «на сколько увеличится ошибка, если увеличить этот вес». Идём в противоположном направлении.',
              tags: ['∇L', 'антиградиент', 'learning rate'],
              color: T.primary,
            },
            {
              title: 'Линейная регрессия (МНК)',
              formula: '\\nabla L = -\\tfrac{2}{n}\\sum_{i}(y_i - w^\\top x_i)\\,x_i',
              desc: 'Приравнивая ∇L=0, получаем нормальные уравнения с аналитическим решением. Или итеративно шагаем по антиградиенту — это и есть градиентный спуск для MSE.',
              tags: ['МНК', '∇L=0', 'нормальные уравнения'],
              color: T.green,
            },
            {
              title: 'Backpropagation',
              formula: '\\frac{\\partial L}{\\partial w^{(l)}} = \\delta^{(l+1)} \\cdot a^{(l)\\top}',
              desc: 'Применение многомерного цепного правила к нейросети. Градиент последнего слоя умножается на производные активаций, слой за слоем от выхода к входу.',
              tags: ['цепное правило', 'δ-ошибки', 'послойно'],
              color: T.violet,
            },
            {
              title: 'Методы второго порядка',
              formula: 'w \\leftarrow w - H^{-1}\\nabla L',
              desc: 'Метод Ньютона использует гессиан для коррекции направления. Сходится быстрее, но хранить H⁻¹ дорого при n≫1. L-BFGS аппроксимирует обратный гессиан.',
              tags: ['H⁻¹', 'Ньютон', 'L-BFGS'],
              color: T.amber,
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

      {/* ══ 12. САМОПРОВЕРКА ══ */}
      <section id="pd-check" style={{ marginBottom: 52 }}>
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
                '∂f/∂xᵢ: дифференцируем по xᵢ, все остальные считаем константами. Те же правила, что для одной переменной.',
                'Градиент ∇f — вектор всех ∂f/∂xᵢ. Направление наискорейшего роста. Перпендикулярен линиям уровня.',
                'Стационарная точка: ∇f=0. Кандидат на min, max или седло — тип определяет гессиан.',
                'Гессиан H — матрица вторых производных. Симметричен (теорема Шварца). Собственные значения λᵢ отвечают за кривизну по каждому направлению.',
                'λᵢ>0 → минимум (чаша), λᵢ<0 → максимум (горб), разные знаки → седло.',
                'Для f(x,y): det H = fₓₓ·fᵧᵧ − fₓᵧ². det>0,fₓₓ>0 → min; det>0,fₓₓ<0 → max; det<0 → седло.',
                'Цепное правило: df/dt = Σ (∂f/∂xᵢ)(dxᵢ/dt). Основа backpropagation — применяется послойно от выхода к входу.',
                'В ML: сёдел несравнимо больше, чем минимумов. Условное число κ = λmax/λmin определяет скорость сходимости.',
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
