// @ts-nocheck
/**
 * Theory-rich для темы «Градиентный спуск — часть 1 (основы)».
 * Только статичные SVG-иллюстрации — никаких canvas/интерактивов.
 * Паттерн: SectionHeader, Card, FBox, M, F, DSNote, Callout, CheckQuestions.
 * Палитра T — единая с остальными темами.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, Brain, Zap, Layers, CheckCircle2,
  Sparkles, ArrowRight, Code2, Target, Activity,
  TrendingDown, GitMerge, Mountain, Gauge,
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

/** Иллюстрация 1: спуск по параболе — шаги к минимуму */
function IllustrationParabolaDescent() {
  const W = 520, H = 280;
  const ox = 60, oy = H - 40;                  // origin (in SVG coords)
  const sx = 60;                                // px per unit on w-axis
  const sy = 22;                                // px per unit on f-axis
  // Parabola f(w) = (w-3)^2, w ∈ [-0.5, 6.5]
  const parabola: string[] = [];
  for (let w = -0.5; w <= 6.5; w += 0.05) {
    const f = (w - 3) * (w - 3);
    parabola.push(`${ox + w * sx},${oy - f * sy}`);
  }
  // GD trajectory: w_{t+1} = w_t - 0.1 * 2 (w_t - 3) = 0.8 w_t + 0.6
  // w0 = 0
  const ws: number[] = [0];
  for (let i = 0; i < 8; i++) ws.push(0.8 * ws[i] + 0.6);

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: одномерный спуск по параболе f(w) = (w − 3)²
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 620, display: 'block', margin: '0 auto' }}>
        <defs>
          <marker id="gd1-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={T.primary} />
          </marker>
        </defs>

        {/* Axes */}
        <line x1={ox - 12} y1={oy} x2={W - 14} y2={oy} stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={ox} y1={20} x2={ox} y2={oy + 12} stroke={T.mutedLight} strokeWidth="1.5" />
        <text x={W - 14} y={oy + 14} fontSize="11" fill={T.muted}>w</text>
        <text x={ox - 24} y={28} fontSize="11" fill={T.muted}>f(w)</text>

        {/* Ticks on w-axis */}
        {[0, 1, 2, 3, 4, 5, 6].map(w => (
          <g key={w}>
            <line x1={ox + w * sx} y1={oy} x2={ox + w * sx} y2={oy + 4} stroke={T.mutedLight} strokeWidth="1" />
            <text x={ox + w * sx} y={oy + 16} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{w}</text>
          </g>
        ))}

        {/* Parabola */}
        <polyline points={parabola.join(' ')} fill="none" stroke={T.green} strokeWidth="2.2" />

        {/* Minimum point */}
        <circle cx={ox + 3 * sx} cy={oy} r="5" fill={T.green} />
        <text x={ox + 3 * sx} y={oy - 8} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.green}>min</text>

        {/* GD steps */}
        {ws.slice(0, ws.length - 1).map((w, i) => {
          const wNext = ws[i + 1];
          const f = (w - 3) * (w - 3);
          const fNext = (wNext - 3) * (wNext - 3);
          return (
            <g key={i}>
              <circle cx={ox + w * sx} cy={oy - f * sy} r="4" fill={T.primary} opacity={0.45 + i * 0.07} />
              {/* arrow along curve to next step */}
              <line
                x1={ox + w * sx}
                y1={oy - f * sy}
                x2={ox + wNext * sx}
                y2={oy - fNext * sy}
                stroke={T.primary}
                strokeWidth="2"
                markerEnd="url(#gd1-arr)"
                opacity={0.6 + i * 0.05}
              />
            </g>
          );
        })}

        {/* Annotation: step formula */}
        <rect x={W - 220} y={28} width={210} height={56} rx={10}
          fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1" />
        <text x={W - 115} y={48} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.primaryDark}>
          w_{`{t+1}`} = w_t − η · f′(w_t)
        </text>
        <text x={W - 115} y={64} textAnchor="middle" fontSize="10" fill={T.muted}>
          η = 0.1, &nbsp; w₀ = 0
        </text>
        <text x={W - 115} y={78} textAnchor="middle" fontSize="10" fill={T.muted}>
          шаг сокращается у минимума
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Точки — последовательные значения <b>w_t</b>. Стрелки — шаги, направленные против знака производной.<br />
        У минимума градиент → 0, поэтому шаги становятся всё короче.
      </p>
    </div>
  );
}

/** Иллюстрация 2: три learning rate — малый, оптимальный, расходящийся */
function IllustrationThreeLR() {
  const W = 660, H = 240;
  const panels = [
    { x0: 30,  title: 'η слишком малый',  sub: 'η = 0.01',  color: T.amber, alpha: 0.99, kind: 'slow' },
    { x0: 250, title: 'η оптимальный',     sub: 'η = 0.5',   color: T.green, alpha: 0.5,  kind: 'opt' },
    { x0: 470, title: 'η слишком большой', sub: 'η = 1.1',   color: T.red,   alpha: -0.1, kind: 'diverge' },
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: три learning rate на f(w) = (w − 3)²
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 720, display: 'block', margin: '0 auto' }}>
        {panels.map((panel, pi) => {
          const px = panel.x0;
          const py = H - 50;
          const sx = 22;   // px per unit on w
          const syPar = 1.4;
          // Parabola
          const points: string[] = [];
          for (let w = -1; w <= 7; w += 0.07) {
            const f = (w - 3) * (w - 3);
            if (f > 100) continue;
            points.push(`${px + w * sx},${py - f * syPar}`);
          }
          // Trajectory
          const traj: number[] = [0];
          if (panel.kind === 'slow') {
            for (let i = 0; i < 8; i++) traj.push(0.98 * traj[i] + 0.06);
          } else if (panel.kind === 'opt') {
            traj.push(3);  // one shot
          } else {
            for (let i = 0; i < 5; i++) traj.push(-1.2 * traj[i] + 3 * 2.2);
            // for divergence: w_{t+1} = w_t - 1.1*2*(w_t-3) = -1.2 w_t + 6.6
            traj.length = 0;
            traj.push(0);
            for (let i = 0; i < 4; i++) traj.push(-1.2 * traj[i] + 6.6);
          }

          // Axes
          return (
            <g key={pi}>
              <line x1={px - 8} y1={py} x2={px + 8 * sx} y2={py} stroke={T.mutedLight} strokeWidth="1.2" />
              <line x1={px} y1={20} x2={px} y2={py + 6} stroke={T.mutedLight} strokeWidth="1.2" />
              {/* w=3 marker */}
              <line x1={px + 3 * sx} y1={py - 4} x2={px + 3 * sx} y2={py + 4} stroke={T.muted} strokeWidth="1.5" />
              <text x={px + 3 * sx} y={py + 16} textAnchor="middle" fontSize="9" fill={T.muted}>3</text>

              {/* Parabola */}
              <polyline points={points.join(' ')} fill="none" stroke={panel.color} strokeOpacity="0.5" strokeWidth="2" />

              {/* Min star */}
              <circle cx={px + 3 * sx} cy={py} r="4" fill={panel.color} />

              {/* Trajectory steps */}
              {traj.map((w, i) => {
                const wClamped = Math.max(-1.5, Math.min(7.5, w));
                const f = (w - 3) * (w - 3);
                const fClamped = Math.min(100, f);
                return (
                  <circle
                    key={i}
                    cx={px + wClamped * sx}
                    cy={py - fClamped * syPar}
                    r="3.5"
                    fill={panel.color}
                    opacity={0.4 + (i / traj.length) * 0.6}
                  />
                );
              })}
              {/* Connect steps for slow/diverge */}
              {panel.kind !== 'opt' && traj.slice(0, traj.length - 1).map((w, i) => {
                const w2 = traj[i + 1];
                const f1 = Math.min(100, (w - 3) * (w - 3));
                const f2 = Math.min(100, (w2 - 3) * (w2 - 3));
                const wc1 = Math.max(-1.5, Math.min(7.5, w));
                const wc2 = Math.max(-1.5, Math.min(7.5, w2));
                return (
                  <line
                    key={`l${i}`}
                    x1={px + wc1 * sx} y1={py - f1 * syPar}
                    x2={px + wc2 * sx} y2={py - f2 * syPar}
                    stroke={panel.color} strokeWidth="1.2" strokeDasharray="3,2" opacity="0.65"
                  />
                );
              })}

              {/* Title */}
              <text x={px + 4 * sx} y={20} textAnchor="middle" fontSize="11" fontWeight="800" fill={panel.color}>
                {panel.title}
              </text>
              <text x={px + 4 * sx} y={34} textAnchor="middle" fontSize="10" fill={T.muted}>
                {panel.sub}
              </text>
              {/* Outcome */}
              <text x={px + 4 * sx} y={H - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill={panel.color}>
                {panel.kind === 'slow' ? 'медленно' : panel.kind === 'opt' ? 'за 1 шаг' : 'расходится'}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Для f(w) = a·(w − w*)² условие сходимости: 0 &lt; η &lt; 2/a. Оптимальный η = 1/a даёт мгновенную сходимость.<br />
        Здесь a = 2, поэтому η = 0.5 — идеально, η = 1.1 — выше границы 2/a = 1 → расходимость.
      </p>
    </div>
  );
}

/** Иллюстрация 3: двумерный спуск в круглой чаше — прямая траектория */
function IllustrationBowlDescent() {
  const W = 400, H = 320;
  const cx = W / 2, cy = H / 2 + 5;
  const sc = 55;
  const levels = [0.5, 1.2, 2.2, 3.5, 5];
  // GD trajectory for f = w1^2 + w2^2, η = 0.1, w_{t+1} = 0.8 w_t
  const traj: Array<[number, number]> = [[2, 2]];
  for (let i = 0; i < 10; i++) traj.push([traj[i][0] * 0.8, traj[i][1] * 0.8]);

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: двумерный спуск в круглой чаше — f = w₁² + w₂²
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto' }}>
        {/* Axes */}
        <line x1={20} y1={cy} x2={W - 20} y2={cy} stroke={T.mutedLight} strokeWidth="1.2" />
        <line x1={cx} y1={20} x2={cx} y2={H - 20} stroke={T.mutedLight} strokeWidth="1.2" />
        <text x={W - 16} y={cy - 4} fontSize="10" fill={T.muted}>w₁</text>
        <text x={cx + 6} y={20} fontSize="10" fill={T.muted}>w₂</text>

        {/* Contours */}
        {levels.map((lv, i) => (
          <circle key={i} cx={cx} cy={cy} r={Math.sqrt(lv) * sc}
            fill="none" stroke={T.primary} strokeWidth={1 + i * 0.1} opacity={0.35 + i * 0.12} />
        ))}

        {/* Trajectory */}
        <polyline
          points={traj.map(([w1, w2]) => `${cx + w1 * sc / 2},${cy - w2 * sc / 2}`).join(' ')}
          fill="none" stroke={T.green} strokeWidth="2.2" strokeLinejoin="round"
        />
        {traj.map(([w1, w2], i) => (
          <circle key={i} cx={cx + w1 * sc / 2} cy={cy - w2 * sc / 2} r="4"
            fill={T.green} opacity={0.4 + (i / traj.length) * 0.6} />
        ))}

        {/* Start label */}
        <text x={cx + 2 * sc / 2 + 8} y={cy - 2 * sc / 2 - 6} fontSize="10" fontWeight="800" fill={T.green}>start (2, 2)</text>

        {/* Min */}
        <circle cx={cx} cy={cy} r="6" fill={T.green} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.white}>★</text>
        <text x={cx + 9} y={cy - 9} fontSize="10" fontWeight="700" fill={T.green}>min</text>

        {/* Gradient = direction of step (illustrative arrow at first step) */}
        <defs>
          <marker id="bowl-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={T.red} />
          </marker>
        </defs>
        <line
          x1={cx + 2 * sc / 2} y1={cy - 2 * sc / 2}
          x2={cx + 2 * sc / 2 + 22} y2={cy - 2 * sc / 2 - 22}
          stroke={T.red} strokeWidth="1.8" strokeDasharray="4,2"
        />
        <text x={cx + 2 * sc / 2 + 26} y={cy - 2 * sc / 2 - 26} fontSize="9" fontWeight="700" fill={T.red}>∇f</text>
        <line
          x1={cx + 2 * sc / 2} y1={cy - 2 * sc / 2}
          x2={cx + 1.6 * sc / 2} y2={cy - 1.6 * sc / 2}
          stroke={T.green} strokeWidth="2" markerEnd="url(#bowl-arr)"
        />
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Круги — линии уровня <b>f = const</b>. Зелёная траектория идёт прямо к (0, 0):<br />
        кривизна одинакова по w₁ и w₂, поэтому −∇f всегда смотрит ровно в центр.
      </p>
    </div>
  );
}

/** Иллюстрация 4: овраг — вытянутые контуры и зигзаг */
function IllustrationRavine() {
  const W = 480, H = 280;
  const cx = W / 2, cy = H / 2;
  const rxBase = 170, ryBase = 28;
  const levels = [0.4, 0.8, 1.4, 2.2];

  // Quadratic f = 0.5(w1² + 100 w2²)
  // Gradient = (w1, 100 w2). With η small, w1 decays slowly, w2 oscillates.
  // η = 0.018 → w2 factor (1 - 0.018·100) = -0.8, w1 factor (1 - 0.018) ≈ 0.98
  const eta = 0.018;
  const ax = 1 - eta;
  const ay = 1 - eta * 100;
  const traj: Array<[number, number]> = [[2, 0.18]];
  for (let i = 0; i < 14; i++) traj.push([traj[i][0] * ax, traj[i][1] * ay]);

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: «овраг» — f = ½(w₁² + 100·w₂²), число обусловленности κ = 100
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }}>
        {/* Axes */}
        <line x1={20} y1={cy} x2={W - 20} y2={cy} stroke={T.mutedLight} strokeWidth="1.2" />
        <line x1={cx} y1={20} x2={cx} y2={H - 30} stroke={T.mutedLight} strokeWidth="1.2" />
        <text x={W - 14} y={cy - 4} fontSize="10" fill={T.muted}>w₁</text>
        <text x={cx + 6} y={20} fontSize="10" fill={T.muted}>w₂</text>

        {/* Contours (elongated ellipses) */}
        {levels.map((lv, i) => (
          <ellipse key={i} cx={cx} cy={cy}
            rx={Math.sqrt(lv) * rxBase} ry={Math.sqrt(lv) * ryBase}
            fill="none" stroke={T.red} strokeWidth={1 + i * 0.1} opacity={0.35 + i * 0.13} />
        ))}

        {/* Trajectory: scale (w1, w2) → screen */}
        {(() => {
          const scX = 50, scY = 380;
          const pts = traj.map(([w1, w2]) => {
            const x = cx + w1 * scX;
            const y = cy - w2 * scY;
            return [x, y] as [number, number];
          });
          return (
            <g>
              <polyline
                points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none" stroke={T.amber} strokeWidth="2" strokeLinejoin="round"
              />
              {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3.5"
                  fill={T.amber} opacity={0.4 + (i / pts.length) * 0.6} />
              ))}
              {/* Start label */}
              <text x={pts[0][0] + 4} y={pts[0][1] - 6} fontSize="10" fontWeight="800" fill={T.amber}>start</text>
            </g>
          );
        })()}

        {/* Min star */}
        <circle cx={cx} cy={cy} r="6" fill={T.green} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.white}>★</text>

        {/* Annotation */}
        <rect x={W - 230} y={H - 56} width={220} height={46} rx={10}
          fill={T.amberLight} stroke={T.amber} strokeWidth="1" />
        <text x={W - 120} y={H - 38} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.amber}>
          λ₁ = 1, &nbsp; λ₂ = 100, &nbsp; κ = 100
        </text>
        <text x={W - 120} y={H - 22} textAnchor="middle" fontSize="10" fill={T.muted}>
          поперёк — резкие колебания, вдоль — почти стоим
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Кривизна по w₂ в 100 раз больше, чем по w₁. Градиент почти весь смотрит «поперёк» оврага →<br />
        траектория зигзагом скачет от стенки к стенке, к минимуму идёт медленно.
      </p>
    </div>
  );
}

/** Иллюстрация 5: блок-схема алгоритма Batch GD */
function IllustrationAlgorithm() {
  const W = 540, H = 250;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: блок-схема Batch Gradient Descent
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto' }}>
        <defs>
          <marker id="alg-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={T.muted} />
          </marker>
        </defs>

        {/* Step 1: Init */}
        <rect x={30} y={30} width={130} height={50} rx={10}
          fill={`${T.primary}14`} stroke={T.primary} strokeWidth="1.5" />
        <text x={95} y={50} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.primary}>1. Инициализация</text>
        <text x={95} y={66} textAnchor="middle" fontSize="9" fill={T.muted}>w₀, η, max_iter, ε</text>

        {/* Step 2: Gradient */}
        <rect x={205} y={30} width={130} height={50} rx={10}
          fill={`${T.green}14`} stroke={T.green} strokeWidth="1.5" />
        <text x={270} y={50} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.green}>2. Градиент</text>
        <text x={270} y={66} textAnchor="middle" fontSize="9" fill={T.muted}>∇L(w_t)</text>

        {/* Step 3: Update */}
        <rect x={380} y={30} width={130} height={50} rx={10}
          fill={`${T.violet}14`} stroke={T.violet} strokeWidth="1.5" />
        <text x={445} y={50} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.violet}>3. Обновление</text>
        <text x={445} y={66} textAnchor="middle" fontSize="9" fill={T.muted}>w_t − η · ∇L(w_t)</text>

        {/* Step 4: Stop check */}
        <rect x={205} y={140} width={130} height={50} rx={10}
          fill={`${T.amber}14`} stroke={T.amber} strokeWidth="1.5" />
        <text x={270} y={160} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.amber}>4. Проверка</text>
        <text x={270} y={176} textAnchor="middle" fontSize="9" fill={T.muted}>‖∇L‖ &lt; ε  или  t = T?</text>

        {/* Step 5: Return */}
        <rect x={380} y={140} width={130} height={50} rx={10}
          fill={`${T.red}14`} stroke={T.red} strokeWidth="1.5" />
        <text x={445} y={163} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.red}>5. Вернуть w_t</text>
        <text x={445} y={178} textAnchor="middle" fontSize="9" fill={T.muted}>найденный минимум</text>

        {/* Arrows: 1 → 2 → 3 → 4 */}
        <line x1={160} y1={55} x2={203} y2={55} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#alg-arr)" />
        <line x1={335} y1={55} x2={378} y2={55} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#alg-arr)" />
        <line x1={445} y1={80} x2={445} y2={108} stroke={T.muted} strokeWidth="1.5" />
        <line x1={445} y1={108} x2={335} y2={108} stroke={T.muted} strokeWidth="1.5" />
        <line x1={335} y1={108} x2={270} y2={108} stroke={T.muted} strokeWidth="1.5" />
        <line x1={270} y1={108} x2={270} y2={138} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#alg-arr)" />

        {/* Loop back: 4 → 2 (No) */}
        <path d="M 270 190 Q 270 220 60 220 Q 30 220 30 90" fill="none"
          stroke={T.amber} strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#alg-arr)" />
        <text x={160} y={234} fontSize="10" fontWeight="700" fill={T.amber}>нет → следующая итерация</text>

        {/* 4 → 5 (Yes) */}
        <line x1={335} y1={165} x2={378} y2={165} stroke={T.green} strokeWidth="1.5" markerEnd="url(#alg-arr)" />
        <text x={355} y={158} textAnchor="middle" fontSize="10" fontWeight="700" fill={T.green}>да</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        На каждой итерации берём градиент по <b>всем</b> данным («batch»), обновляем параметры,<br />
        проверяем условие остановки. Цикл — пока градиент достаточно велик.
      </p>
    </div>
  );
}

// ─── Self-check ───────────────────────────────────────────────────────────────
function CheckQuestions() {
  const questions = [
    {
      q: 'Почему в правиле w_{t+1} = w_t − η·f′(w_t) стоит знак «минус»?',
      options: [
        'Так удобнее писать формулу',
        'Производная указывает направление роста — чтобы идти к минимуму, надо в противоположное',
        'Минус компенсирует знак learning rate',
        'Без минуса алгоритм не сходится при f′ < 0',
      ],
      correct: 1,
      explanation: 'Градиент = направление наискорейшего роста f. Чтобы уменьшать ошибку (искать минимум), идём в обратном направлении: −∇f. Знак «минус» в формуле — это и есть антиградиент.',
    },
    {
      q: 'Что произойдёт со спуском по параболе, если взять слишком большой learning rate?',
      options: [
        'Алгоритм всегда сходится, просто медленно',
        'Шаги станут идеально точными',
        'Алгоритм перепрыгивает минимум, амплитуда колебаний растёт — расходимость',
        'Производная станет равна нулю, и спуск остановится',
      ],
      correct: 2,
      explanation: 'При η > 2/a (где a — кривизна) каждый шаг «перелетает» минимум и оказывается дальше предыдущего. Для f = (w−3)² имеем a = 2, граница расходимости η = 1, и η = 1.1 уже расходится.',
    },
    {
      q: 'Почему градиентный спуск медленно работает в «овраге» (большое число обусловленности κ)?',
      options: [
        'Алгоритм перестаёт видеть минимум',
        'Градиент намного больше поперёк оврага, чем вдоль — траектория зигзагом',
        'В овраге производная равна нулю',
        'Овраг — это седловая точка, спуск там запрещён',
      ],
      correct: 1,
      explanation: 'В овраге кривизна сильно отличается по разным осям. Градиент почти весь смотрит «поперёк», поэтому шаг прыгает от стенки к стенке. Вдоль оврага продвижение крошечное → медленная сходимость.',
    },
    {
      q: 'Зачем проверять условие остановки по норме градиента ‖∇L‖ < ε?',
      options: [
        'Чтобы экономить память',
        'В минимуме ∇L = 0; малая норма означает, что мы близко к минимуму',
        'Чтобы избежать переполнения чисел',
        'Это нужно для нейросетей с softmax',
      ],
      correct: 1,
      explanation: 'В стационарной точке градиент равен нулю. Когда ‖∇L‖ становится очень малым, дальнейшие обновления почти ничего не меняют — мы у минимума, можно останавливаться.',
    },
    {
      q: 'Для f(w) = ½ a w² оптимальный learning rate равен:',
      options: [
        'η = a',
        'η = 1/a',
        'η = 2/a',
        'η = √a',
      ],
      correct: 1,
      explanation: 'Один шаг с η = 1/a даёт w_{t+1} = w_t − (1/a)·(a·w_t) = 0 — мгновенный приход в минимум. Это идеальный шаг для постоянной кривизны. При η > 2/a — расходимость.',
    },
    {
      q: 'Почему алгоритм называется «Batch» Gradient Descent?',
      options: [
        'Параметры обновляются пачками по 32 штуки',
        'На каждом шаге градиент считается по всей обучающей выборке сразу',
        'Используется batch-нормализация',
        'Алгоритм запускается «партиями» в кластере',
      ],
      correct: 1,
      explanation: '«Batch» = «вся обучающая выборка целиком» при вычислении градиента. Это честный, но дорогой расчёт — на миллионах примеров он медленный. Стохастический и mini-batch варианты решают эту проблему (см. часть 2).',
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
export default function GradientDescentPart1TheoryRich() {
  const nav = [
    { id: 'gd1-why',       label: 'Зачем это' },
    { id: 'gd1-metaphor',  label: 'Слепой альпинист' },
    { id: 'gd1-1d',        label: 'Одномерный спуск' },
    { id: 'gd1-lr',        label: 'Learning rate' },
    { id: 'gd1-2d',        label: 'Двумерный случай' },
    { id: 'gd1-ravine',    label: 'Овраги и κ' },
    { id: 'gd1-algorithm', label: 'Алгоритм Batch GD' },
    { id: 'gd1-example',   label: 'Маленький пример' },
    { id: 'gd1-links',     label: 'Связь с темами' },
    { id: 'gd1-check',     label: 'Проверь себя' },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Заголовок ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <TrendingDown size={15} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: T.primary, textTransform: 'uppercase' }}>Математический анализ</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, color: T.muted }}>около 25 минут</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.violet }}>Часть 1 / 2</span>
        </div>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>
          Градиентный спуск — часть 1 (основы)
        </h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16, lineHeight: 1.6 }}>
          Главный алгоритм современного машинного обучения: идти против градиента ошибки.
          Разберём идею, одномерный и двумерный случаи, learning rate, овраги и полный алгоритм Batch GD.
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
      <section id="gd1-why" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sparkles} label="Мотивация" title="Зачем это вообще нужно" />

        <div style={{ background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Главный инструмент всего ML
          </div>
          <p style={{ margin: '0 0 10px', color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Вы обучили нейросеть. Точнее, вы запустили алгоритм, который сам «обучился». Внутри —
            миллионы параметров, функция потерь и алгоритм, который шаг за шагом меняет параметры так,
            чтобы ошибка уменьшалась.
          </p>
          <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Этот алгоритм — <strong>градиентный спуск</strong>. Линейная и логистическая регрессии,
            нейросети любой архитектуры, рекомендательные системы — всё обучается им или его вариациями.
            Идея простая: чтобы найти минимум, нужно идти в сторону, противоположную наклону функции.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
          {[
            { n: '1', title: 'Градиент', d: '∇L — направление наискорейшего роста ошибки', color: T.primary },
            { n: '2', title: 'Антиградиент', d: '−∇L — направление спуска', color: T.green },
            { n: '3', title: 'Learning rate η', d: 'Размер шага. Главный гиперпараметр', color: T.amber },
            { n: '4', title: 'Итерация', d: 'w_{t+1} = w_t − η·∇L(w_t)', color: T.violet },
            { n: '5', title: 'Сходимость', d: '‖∇L‖ → 0: мы у минимума', color: T.cyan },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{item.n}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 1. МЕТАФОРА ══ */}
      <section id="gd1-metaphor" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Mountain} label="Метафора" title="Слепой альпинист в тумане" color={T.amber} />

        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <p style={{ margin: '0 0 10px', fontSize: 14, color: T.text, lineHeight: 1.8 }}>
            Слепой альпинист стоит на склоне горы в густом тумане. Он хочет спуститься в долину,
            но не видит всю гору. Зато может ощупать землю под ногами и понять, в какую сторону уходит склон.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, margin: '10px 0' }}>
            {[
              { step: '1', text: 'Ощупать землю → определить направление самого крутого спуска (антиградиент).', color: T.primary },
              { step: '2', text: 'Сделать шаг в этом направлении. Размер шага — learning rate.', color: T.violet },
              { step: '3', text: 'Снова ощупать и шагнуть. Повторять, пока склон не станет плоским — мы на дне.', color: T.green },
            ].map(item => (
              <div key={item.step} style={{ background: T.surface, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: item.color, marginBottom: 4 }}>Шаг {item.step}</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.65 }}>{item.text}</div>
              </div>
            ))}
          </div>
          <Callout color={T.red} title="Опасности">
            <strong>Слишком большой шаг</strong> — перепрыгнем долину и упадём в пропасть с другой стороны.<br />
            <strong>Слишком маленький</strong> — будем спускаться вечность.
          </Callout>
        </Card>

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8 }}>
          Градиентный спуск делает ровно это. <strong>Функция потерь</strong> — гора.
          <strong> Параметры модели</strong> — координаты альпиниста. <strong>Градиент</strong> — направление склона.
          <strong> Learning rate</strong> — длина шага.
        </p>
      </section>

      {/* ══ 2. ОДНОМЕРНЫЙ СЛУЧАЙ ══ */}
      <section id="gd1-1d" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Одномерный случай" title="Спуск по параболе" color={T.green} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Простейшая ситуация — функция одной переменной:
        </p>

        <FBox tex="f(w) = (w - 3)^2" hint="Парабола с минимумом в w = 3, f(3) = 0" color={T.green} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8 }}>
          Производная (градиент в одномерном случае) показывает наклон:
        </p>

        <FBox tex="f'(w) = 2(w - 3)" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { cond: 'w > 3 → f′ > 0', meaning: 'функция растёт, идём влево', color: T.violet },
            { cond: 'w < 3 → f′ < 0', meaning: 'функция убывает, идём вправо', color: T.green },
            { cond: 'w = 3 → f′ = 0', meaning: 'мы у минимума, остаёмся на месте', color: T.amber },
          ].map(item => (
            <div key={item.cond} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <code style={{ fontSize: 13, fontWeight: 800, color: item.color, display: 'block', marginBottom: 6 }}>{item.cond}</code>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{item.meaning}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 4 }}>
          В обоих случаях мы движемся <strong>против знака производной</strong>. Отсюда правило обновления:
        </p>

        <FBox
          tex="w_{t+1} = w_t - \eta \cdot f'(w_t)"
          hint="η (эта) — learning rate, скорость обучения, размер шага"
        />

        <IllustrationParabolaDescent />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>
            Численный пример: w₀ = 0, η = 0.1
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {['t', 'w_t', "f'(w_t) = 2(w_t − 3)", 'η · f′(w_t)', 'w_{t+1}'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 800, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ fontFamily: 'monospace' }}>
                {[
                  ['0', '0',     '−6',    '−0.6',    '0.6'],
                  ['1', '0.6',   '−4.8',  '−0.48',   '1.08'],
                  ['2', '1.08',  '−3.84', '−0.384',  '1.464'],
                  ['3', '1.464', '−3.072','−0.307',  '1.771'],
                  ['4', '1.771', '−2.458','−0.246',  '2.017'],
                  ['5', '2.017', '−1.966','−0.197',  '2.214'],
                  ['10', '2.82', '−0.36', '−0.036',  '2.856'],
                  ['20', '2.996','−0.008','−0.0008', '2.997'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '6px 10px', color: j === row.length - 1 ? T.green : T.text }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: '10px 0 0' }}>
            w_t приближается к 3. Шаги становятся всё меньше — потому что градиент уменьшается у минимума.
            В пределе w_t → 3, f(w_t) → 0.
          </p>
        </Card>
      </section>

      {/* ══ 3. LEARNING RATE ══ */}
      <section id="gd1-lr" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Gauge} label="Гиперпараметр №1" title="Learning rate — размер шага" color={T.amber} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Learning rate <M tex="\eta" /> — самый важный гиперпараметр градиентного спуска.
          От него зависит, <strong>сойдётся ли</strong> алгоритм и <strong>как быстро</strong>.
        </p>

        <IllustrationThreeLR />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            {
              title: 'Слишком малый',
              eta: 'η = 0.01',
              desc: 'Шаги крошечные. Через 20 итераций мы только на w ≈ 1.5 — далеко от цели. Сходится, но мучительно медленно.',
              color: T.amber,
            },
            {
              title: 'Оптимальный',
              eta: 'η = 0.5',
              desc: 'Для f = (w−3)²: w_{t+1} = w_t − 0.5·2(w_t − 3) = 3. За один шаг приходим в минимум! Идеал: η = 1/f″(w).',
              color: T.green,
            },
            {
              title: 'Слишком большой',
              eta: 'η = 1.1',
              desc: 'w₁ = 0 − 1.1·(−6) = 6.6 — перепрыгнули минимум 3. w₂ = −1.32. Колебания нарастают → расходимость.',
              color: T.red,
            },
          ].map(item => (
            <Card key={item.title} style={{ borderTop: `3px solid ${item.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: item.color, textTransform: 'uppercase', marginBottom: 4 }}>{item.title}</div>
              <code style={{ fontSize: 14, fontWeight: 800, color: item.color, display: 'block', marginBottom: 6 }}>{item.eta}</code>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{item.desc}</div>
            </Card>
          ))}
        </div>

        <Card style={{ borderLeft: `4px solid ${T.cyan}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>
            Правило для квадратичной функции f(w) = ½ a w²
          </div>
          <FBox tex="0 < \eta < \frac{2}{a}" hint="Гарантированная сходимость" color={T.cyan} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 6 }}>
            {[
              { c: 'η = 1/a', r: 'мгновенная сходимость (1 шаг)', col: T.green },
              { c: 'η < 1/a', r: 'медленная сходимость', col: T.amber },
              { c: 'η > 2/a', r: 'расходимость', col: T.red },
            ].map(item => (
              <div key={item.c} style={{ background: `${item.col}0a`, border: `1px solid ${item.col}30`, borderRadius: 10, padding: '8px 12px' }}>
                <code style={{ fontSize: 12, fontWeight: 700, color: item.col }}>{item.c}</code>
                <div style={{ fontSize: 12, color: T.text, marginTop: 2 }}>{item.r}</div>
              </div>
            ))}
          </div>
        </Card>

        <DSNote>
          В реальных моделях оптимальный η <em>никто заранее не знает</em>: функция потерь неквадратичная и
          меняет кривизну от точки к точке. Поэтому η подбирают эмпирически. Типичные стартовые значения
          в нейросетях: <strong>0.1, 0.01, 0.001, 0.0001</strong>. Часто начинают с 0.001 и уменьшают
          по расписанию (learning rate scheduling — в части 2).
        </DSNote>
      </section>

      {/* ══ 4. ДВУМЕРНЫЙ ══ */}
      <section id="gd1-2d" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Многомерное обобщение" title="Двумерный случай — спуск в чаше" color={T.violet} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 14 }}>
          Теперь функция двух переменных:
        </p>

        <FBox tex="f(w_1, w_2) = w_1^2 + w_2^2" hint="Параболоид с минимумом в (0, 0)" color={T.violet} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8 }}>
          Градиент — вектор частных производных:
        </p>

        <FBox tex="\nabla f = \bigl(\tfrac{\partial f}{\partial w_1},\; \tfrac{\partial f}{\partial w_2}\bigr) = (2 w_1,\; 2 w_2)" />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8 }}>
          Правило обновления — то же самое, но в векторной форме:
        </p>

        <FBox
          tex="\mathbf{w}_{t+1} = \mathbf{w}_t - \eta \, \nabla f(\mathbf{w}_t)"
          hint="Или покомпонентно: w_i ← w_i − η · ∂f/∂w_i для каждого i"
        />

        <IllustrationBowlDescent />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>
            Численный пример: старт (2, 2), η = 0.1
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {['t', 'w₁', 'w₂', '∇f', 'η·∇f', 'новые (w₁, w₂)'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 800, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['0',  '2',     '2',     '(4, 4)',     '(0.4, 0.4)',     '(1.6, 1.6)'],
                  ['1',  '1.6',   '1.6',   '(3.2, 3.2)', '(0.32, 0.32)',   '(1.28, 1.28)'],
                  ['2',  '1.28',  '1.28',  '(2.56, 2.56)', '(0.256, 0.256)', '(1.024, 1.024)'],
                  ['10', '0.21',  '0.21',  '—', '—', '—'],
                  ['20', '0.023', '0.023', '—', '—', '—'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '6px 10px', color: j === row.length - 1 ? T.green : T.text }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: '10px 0 0' }}>
            Траектория — <strong>прямая линия</strong> из (2, 2) в (0, 0). Это идеальный случай:
            функция изотропна, гессиан пропорционален единичной матрице — кривизна одинакова во всех направлениях.
          </p>
        </Card>
      </section>

      {/* ══ 5. ОВРАГИ ══ */}
      <section id="gd1-ravine" style={{ marginBottom: 52 }}>
        <SectionHeader icon={TrendingDown} label="Когда GD ломается" title="Овраги и число обусловленности" color={T.red} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 14 }}>
          Не все функции — идеальные чаши. Рассмотрим вытянутую:
        </p>

        <FBox tex="f(w_1, w_2) = \tfrac{1}{2}\bigl(w_1^2 + 100\, w_2^2\bigr)" hint="Овраг — сильно вытянутая чаша" color={T.red} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8 }}>
          Гессиан и его собственные значения:
        </p>

        <FBox
          tex="H = \begin{pmatrix} 1 & 0 \\ 0 & 100 \end{pmatrix},\quad \lambda_1 = 1,\; \lambda_2 = 100,\quad \kappa = \dfrac{\lambda_{\max}}{\lambda_{\min}} = 100"
          hint="Число обусловленности κ показывает, насколько вытянута чаша"
        />

        <IllustrationRavine />

        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 8 }}>Что происходит</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.75, margin: '0 0 8px' }}>
            Градиент в стартовой точке (2, 2): <M tex="\nabla f = (2,\; 200)" />. По <M tex="w_2" /> компонента
            в 100 раз больше — первый же шаг сильно меняет <M tex="w_2" />, но почти не двигает <M tex="w_1" />.
            Следующий шаг разворачивает <M tex="w_2" /> в обратную сторону.
          </p>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.75, margin: 0 }}>
            Траектория идёт <strong>зигзагом поперёк оврага</strong>, почти не продвигаясь вдоль него к минимуму.
            Чем больше <M tex="\kappa" />, тем хуже работает простой GD с постоянным шагом.
          </p>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>
            Условие сходимости для квадратичной формы f(w) = ½ wᵀ H w
          </div>
          <FBox tex="0 < \eta < \dfrac{2}{\lambda_{\max}(H)}" hint="η ограничено крупнейшим собственным значением гессиана" color={T.amber} />
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: '0 0 6px' }}>
            Оптимальный шаг (по худшему направлению):
          </p>
          <FBox tex="\eta_{\text{opt}} = \dfrac{2}{\lambda_{\max} + \lambda_{\min}}" color={T.green} />
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7, margin: 0 }}>
            Скорость сходимости определяется <M tex="\kappa = \lambda_{\max}/\lambda_{\min}" />.
            При <M tex="\kappa \gg 1" /> функция имеет «овраги», и GD с постоянным η работает плохо.
            Отсюда потребность в методах с адаптивным шагом — <strong>momentum, Adam</strong> (часть 2).
          </p>
        </Card>
      </section>

      {/* ══ 6. АЛГОРИТМ ══ */}
      <section id="gd1-algorithm" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Code2} label="Полный алгоритм" title="Batch Gradient Descent" color={T.primary} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 14 }}>
          Соберём всё вместе. Пусть есть функция потерь <M tex="L(\mathbf{w})" />, зависящая от вектора
          параметров <M tex="\mathbf{w} = (w_1, \ldots, w_n)" />. Ищем <M tex="\mathbf{w}^*" />,
          минимизирующее <M tex="L" />.
        </p>

        <IllustrationAlgorithm />

        <Card style={{ borderLeft: `4px solid ${T.primary}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Шаги алгоритма</div>
          {[
            { n: '1', title: 'Инициализация', text: 'Выбрать начальную точку w₀ (случайно или нули). Выбрать learning rate η > 0. Задать max_iter T или порог ε.', color: T.primary },
            { n: '2', title: 'Градиент', text: 'Вычислить ∇L(w_t) — вектор всех частных производных в текущей точке.', color: T.green },
            { n: '3', title: 'Обновление', text: 'w_{t+1} = w_t − η · ∇L(w_t). Шаг против градиента.', color: T.violet },
            { n: '4', title: 'Проверка остановки', text: 'Если ‖∇L(w_t)‖ < ε (градиент почти ноль — мы у минимума) или t ≥ T — остановиться.', color: T.amber },
            { n: '5', title: 'Возврат', text: 'Вернуть w_t как найденный минимум.', color: T.red },
          ].map(item => (
            <div key={item.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.n}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: item.color }}>{item.title}</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{item.text}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 8 }}>Псевдокод</div>
          <pre style={{
            margin: 0, padding: '14px 18px', background: '#0f172a', color: '#e2e8f0',
            borderRadius: 12, fontSize: 12.5, lineHeight: 1.7, fontFamily: 'monospace', overflowX: 'auto',
          }}>{`w = начальное_приближение
for t in range(max_iter):
    grad = вычислить_градиент(L, w, все_данные)
    if norm(grad) < eps:
        break
    w = w - eta * grad
return w`}</pre>
        </Card>

        <Callout color={T.cyan} title="Почему «Batch»">
          На каждом шаге используется <strong>вся обучающая выборка</strong> для вычисления градиента.
          Это честный градиент без приближений, но при миллионах примеров — слишком дорого.
          Решение — стохастический GD (часть 2).
        </Callout>
      </section>

      {/* ══ 7. МАЛЕНЬКИЙ ПРИМЕР ══ */}
      <section id="gd1-example" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Маленький пример" title="Ручной расчёт двух итераций" color={T.green} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 14 }}>
          <strong>Задача.</strong> Функция <M tex="f(w_1, w_2) = w_1^2 + 2 w_2^2" />.
          Старт <M tex="(2, 2)" />. Learning rate <M tex="\eta = 0.1" />. Сделать две итерации GD.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            {
              step: 'Шаг 1. Градиент в общем виде и в стартовой точке',
              content: 'f_{w₁} = 2 w₁, f_{w₂} = 4 w₂\n∇f(2, 2) = (4, 8)',
              color: T.primary,
            },
            {
              step: 'Шаг 2. Первая итерация',
              content: 'w^(1) = (2, 2) − 0.1·(4, 8) = (2 − 0.4, 2 − 0.8) = (1.6, 1.2)',
              color: T.violet,
            },
            {
              step: 'Шаг 3. Градиент в новой точке',
              content: '∇f(1.6, 1.2) = (2·1.6, 4·1.2) = (3.2, 4.8)',
              color: T.amber,
            },
            {
              step: 'Шаг 4. Вторая итерация',
              content: 'w^(2) = (1.6, 1.2) − 0.1·(3.2, 4.8) = (1.6 − 0.32, 1.2 − 0.48) = (1.28, 0.72)',
              color: T.green,
            },
          ].map((item, i) => (
            <div key={i} style={{ background: `${item.color}08`, border: `1px solid ${item.color}30`, borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.step}</div>
              <pre style={{ margin: 0, fontSize: 13, fontFamily: 'monospace', color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.content}</pre>
            </div>
          ))}
        </div>

        <Card style={{ marginTop: 14, borderLeft: `4px solid ${T.green}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.75 }}>
            <strong>Ответ:</strong> после двух итераций <M tex="\mathbf{w} \approx (1.28,\; 0.72)" />.
            Движемся к (0, 0). Заметьте: <M tex="w_2" /> убывает быстрее <M tex="w_1" />, потому что
            кривизна по <M tex="w_2" /> вдвое больше (коэффициент 2 против 1).
          </div>
        </Card>
      </section>

      {/* ══ 8. СВЯЗИ С ТЕМАМИ ══ */}
      <section id="gd1-links" style={{ marginBottom: 52 }}>
        <SectionHeader icon={GitMerge} label="Объединение знаний" title="Связь с предыдущими темами" color={T.cyan} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 14 }}>
          Градиентный спуск собирает воедино всё, что мы изучали:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[
            {
              title: 'Производная одной переменной',
              body: "Основа. Без понимания f'(w) — что такое наклон и куда он указывает — невозможно понять одномерный случай GD.",
              color: T.green,
              icon: BookOpen,
            },
            {
              title: 'Частные производные и градиент',
              body: 'Обобщение на много переменных. ∇L(w) — вектор, указывающий направление наискорейшего роста ошибки. GD идёт против него.',
              color: T.primary,
              icon: Layers,
            },
            {
              title: 'Гессиан и число обусловленности',
              body: 'Объясняют, почему на одних функциях спуск быстрый, а на других — зигзаги. κ = λ_max / λ_min — мера «вытянутости» чаши.',
              color: T.violet,
              icon: Brain,
            },
            {
              title: 'Что дальше — часть 2',
              body: 'Стохастический GD, momentum, Adam, расписания η, конкретный пример — линейная регрессия и backpropagation.',
              color: T.amber,
              icon: ArrowRight,
            },
          ].map(item => (
            <div key={item.title} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${item.color}18`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={14} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{item.title}</div>
              </div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65 }}>{item.body}</div>
            </div>
          ))}
        </div>

        <DSNote>
          В реальном обучении нейросети функция потерь — это сумма по миллионам примеров,
          а градиент считается через backpropagation (многомерное цепное правило послойно).
          Но <strong>идея остаётся той же</strong>: на каждой итерации идём против градиента ошибки.
          Это и есть суть всего современного машинного обучения.
        </DSNote>
      </section>

      {/* ══ 9. ПРОВЕРЬ СЕБЯ ══ */}
      <section id="gd1-check" style={{ marginBottom: 52 }}>
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
            <div style={{ fontWeight: 700, color: T.primaryDark, marginBottom: 6 }}>Что запомнить из первой части</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'Градиентный спуск: w_{t+1} = w_t − η · ∇L(w_t). Идём против градиента, потому что он указывает направление роста, а мы ищем минимум.',
                'Learning rate η — главный гиперпараметр. Слишком мал → медленно, слишком велик → расходимость.',
                'Для квадратичной f = ½ a w²: сходимость при 0 < η < 2/a, оптимум η = 1/a.',
                'В многомерном случае правило то же, но ∇ — вектор. Покомпонентно: w_i ← w_i − η · ∂L/∂w_i.',
                'В круглой чаше (κ ≈ 1) траектория — прямая к минимуму. В «овраге» (κ ≫ 1) — зигзаги, медленная сходимость.',
                'Условие сходимости для квадратичной формы: 0 < η < 2/λ_max(H). Скорость определяется κ = λ_max/λ_min.',
                'Batch GD = градиент по всей выборке на каждой итерации. Честно, но дорого при больших данных → переход к SGD во второй части.',
                'Условие остановки: ‖∇L‖ < ε. В минимуме градиент равен нулю.',
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
