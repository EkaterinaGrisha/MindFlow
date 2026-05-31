// @ts-nocheck
/**
 * Theory-rich body for «Градиентный спуск — Часть 2».
 * Только статичные SVG-иллюстрации — никаких canvas/интерактивов.
 * Паттерн: SectionHeader, Card, FBox, DSNote, Callout, CheckQuestions.
 * Цветовая палитра T (единая со всеми темами раздела).
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity, Brain, Zap, Layers, CheckCircle2,
  Sparkles, ArrowRight, Code2, Target,
  TrendingDown, GitMerge, BarChart2,
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

/** Иллюстрация 1: Три режима спуска — Batch, SGD, Mini-batch */
function IllustrationThreeModes() {
  const W = 600, H = 240;
  const panelW = W / 3;

  // Elongated bowl: L(w1,w2) = w1² + 5*w2²
  // cx, cy = center of each panel
  const panels = [
    { label: 'Batch GD', sub: 'каждый шаг = вся выборка', color: T.primary, cx: panelW * 0.5, note: 'медленно, точно' },
    { label: 'SGD', sub: 'каждый шаг = 1 пример', color: T.amber, cx: panelW * 1.5, note: 'быстро, шумно' },
    { label: 'Mini-batch', sub: 'каждый шаг = 32–128', color: T.green, cx: panelW * 2.5, note: 'баланс ✓' },
  ];

  const cy = H / 2 + 10;
  const scX = 44, scY = 22;
  // Contours of w1² + 5*w2²
  const levels = [0.3, 0.7, 1.4, 2.4, 3.6];

  // Batch trajectory: smooth, slow zigzag
  const batchTraj = [
    [-2, 1.4], [-1.5, 1.0], [-1.1, 0.7], [-0.7, 0.45],
    [-0.38, 0.26], [-0.16, 0.14], [-0.05, 0.06], [0, 0],
  ];

  // SGD trajectory: noisy
  const sgdTraj = [
    [-2, 1.4], [-1.7, 1.15], [-1.2, 0.6], [-1.5, 0.9],
    [-0.8, 0.3], [-1.0, 0.5], [-0.5, 0.15], [-0.7, 0.3],
    [-0.2, 0.05], [-0.35, 0.1], [-0.05, 0.02], [0, 0],
  ];

  // Mini-batch: less noise than SGD
  const miniBatchTraj = [
    [-2, 1.4], [-1.6, 1.05], [-1.15, 0.65], [-1.35, 0.82],
    [-0.75, 0.4], [-0.9, 0.5], [-0.45, 0.18], [-0.55, 0.22],
    [-0.18, 0.06], [-0.25, 0.08], [-0.04, 0.01], [0, 0],
  ];

  const trajs = [batchTraj, sgdTraj, miniBatchTraj];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: три режима градиентного спуска на вытянутой чаше
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 700, display: 'block', margin: '0 auto' }}>
        {panels.map((panel, pi) => {
          const traj = trajs[pi];
          const toSx = (w1: number) => panel.cx + w1 * scX;
          const toSy = (w2: number) => cy - w2 * scY * 3.5;

          return (
            <g key={pi}>
              {/* Dividers */}
              {pi > 0 && (
                <line x1={panelW * pi} y1={10} x2={panelW * pi} y2={H - 30}
                  stroke={T.border} strokeWidth="1" strokeDasharray="4,3" />
              )}

              {/* Contours */}
              {levels.map((level, li) => (
                <ellipse key={li}
                  cx={panel.cx} cy={cy}
                  rx={Math.sqrt(level) * scX}
                  ry={Math.sqrt(level / 5) * scY * 3.5}
                  fill="none"
                  stroke={panel.color}
                  strokeWidth={0.9 + li * 0.1}
                  opacity={0.2 + li * 0.12} />
              ))}

              {/* Trajectory */}
              <polyline
                points={traj.map(([w1, w2]) => `${toSx(w1)},${toSy(w2)}`).join(' ')}
                fill="none" stroke={panel.color} strokeWidth="2" strokeLinejoin="round" />
              {traj.map(([w1, w2], i) => (
                <circle key={i} cx={toSx(w1)} cy={toSy(w2)} r={i === 0 ? 5 : 3}
                  fill={panel.color} opacity={0.2 + i / traj.length * 0.8} />
              ))}

              {/* Minimum */}
              <circle cx={panel.cx} cy={cy} r="7" fill={panel.color} />
              <text x={panel.cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.white}>★</text>

              {/* Labels */}
              <text x={panel.cx} y={H - 18} textAnchor="middle" fontSize="11" fontWeight="800" fill={panel.color}>
                {panel.label}
              </text>
              <text x={panel.cx} y={H - 6} textAnchor="middle" fontSize="9" fill={T.muted}>
                {panel.note}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
        {[
          { label: 'Batch GD', note: 'Гладкая траектория, зигзаги в овраге. 1 шаг = весь датасет.', color: T.primary },
          { label: 'SGD', note: 'Дрожащая траектория — шум от одного примера. Быстро сходится.', color: T.amber },
          { label: 'Mini-batch', note: 'Меньше шума, параллелизм GPU. Стандарт в глубоком обучении.', color: T.green },
        ].map(item => (
          <div key={item.label} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Иллюстрация 2: SGD — дрожание вокруг минимума, Learning Rate Decay */
function IllustrationSGDNoise() {
  const W = 440, H = 240;
  const cx = W / 2, cy = H / 2 + 10;
  const scX = 52, scY = 30;
  const levels = [0.4, 1.0, 1.9, 3.0];

  // SGD with constant lr — circles around minimum
  const sgdConst: Array<[number, number]> = [];
  let x = -2.0, y = 0.8;
  const lr = 0.18;
  for (let i = 0; i < 22; i++) {
    const noise = () => (Math.random() * 2 - 1) * 0.4;
    x = x - lr * (2 * x + noise());
    y = y - lr * (2 * y * 2 + noise() * 0.5);
    sgdConst.push([x, y]);
  }

  // SGD with decay — spirals to minimum
  const sgdDecay: Array<[number, number]> = [];
  let xd = -2.0, yd = 0.8;
  for (let i = 0; i < 22; i++) {
    const lrD = 0.25 / (1 + i * 0.3);
    const noise = () => (Math.random() * 2 - 1) * 0.35;
    xd = xd - lrD * (2 * xd + noise());
    yd = yd - lrD * (2 * yd * 2 + noise() * 0.4);
    sgdDecay.push([xd, yd]);
  }

  const toSx = (w: number) => cx + w * scX;
  const toSy = (w: number) => cy - w * scY * 2.5;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: SGD — постоянный η vs убывающий η (learning rate decay)
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }}>

        {/* Contours */}
        {levels.map((level, i) => (
          <ellipse key={i} cx={cx} cy={cy}
            rx={Math.sqrt(level) * scX} ry={Math.sqrt(level) * scY * 1.2}
            fill="none" stroke={T.border} strokeWidth="1" opacity={0.5 + i * 0.1} />
        ))}

        {/* Constant lr trail */}
        <polyline
          points={sgdConst.map(([x, y]) => `${toSx(x)},${toSy(y)}`).join(' ')}
          fill="none" stroke={T.amber} strokeWidth="1.8" strokeLinejoin="round" />
        {sgdConst.map(([x, y], i) => (
          <circle key={i} cx={toSx(x)} cy={toSy(y)} r="3"
            fill={T.amber} opacity={0.2 + i / sgdConst.length * 0.8} />
        ))}

        {/* Decay lr trail */}
        <polyline
          points={[[-2.0, 0.8], ...sgdDecay].map(([x, y]) => `${toSx(x)},${toSy(y)}`).join(' ')}
          fill="none" stroke={T.primary} strokeWidth="2" strokeLinejoin="round" />
        {sgdDecay.map(([x, y], i) => (
          <circle key={i} cx={toSx(x)} cy={toSy(y)} r="3"
            fill={T.primary} opacity={0.2 + i / sgdDecay.length * 0.8} />
        ))}

        {/* Start */}
        <circle cx={toSx(-2.0)} cy={toSy(0.8)} r="6" fill={T.white} stroke={T.muted} strokeWidth="2" />
        <text x={toSx(-2.0) + 8} y={toSy(0.8)} fontSize="10" fontWeight="700" fill={T.muted}>старт</text>

        {/* Minimum */}
        <circle cx={cx} cy={cy} r="8" fill={T.green} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.white}>★</text>

        {/* Constant lr: dancing circle */}
        <circle cx={cx + 20} cy={cy - 10} r={26}
          fill="none" stroke={T.amber} strokeWidth="1" strokeDasharray="5,3" opacity="0.5" />

        {/* Legend */}
        <rect x={12} y={14} width={200} height={50} rx={8}
          fill={T.white} fillOpacity="0.95" stroke={T.border} strokeWidth="1" />
        <line x1={20} y1={30} x2={42} y2={30} stroke={T.amber} strokeWidth="2" />
        <circle cx={54} cy={30} r="3" fill={T.amber} />
        <text x={62} y={34} fontSize="10" fontWeight="700" fill={T.amber}>η=const: «танец» у минимума</text>
        <line x1={20} y1={52} x2={42} y2={52} stroke={T.primary} strokeWidth="2" />
        <circle cx={54} cy={52} r="3" fill={T.primary} />
        <text x={62} y={56} fontSize="10" fontWeight="700" fill={T.primary}>η decay: сходимость ✓</text>

        {/* Formula */}
        <rect x={W - 160} y={14} width={148} height={36} rx={8}
          fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1" />
        <text x={W - 86} y={30} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.primaryDark}>
          ηₜ = η₀ / (1 + decay·t)
        </text>
        <text x={W - 86} y={44} textAnchor="middle" fontSize="9" fill={T.muted}>
          learning rate schedule
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Оранжевый: постоянный η — траектория «пляшет» вокруг минимума, не сходясь.<br />
        Синий: η убывает со временем — шаги сжимаются, алгоритм «фиксируется» в минимуме.
      </p>
    </div>
  );
}

/** Иллюстрация 3: Momentum — гашение зигзагов в овраге */
function IllustrationMomentum() {
  const W = 500, H = 250;
  const panelW = W / 2;
  const cy = H / 2 + 10;
  const scX = 36, scY = 14;

  // Elongated ravine: L = w1² + 20*w2²
  const levels = [0.4, 1.0, 2.0, 3.5, 5.5];

  // Without momentum: zigzag
  const noMomTraj: Array<[number, number]> = [
    [-2.8, 0.5], [-2.0, -0.38], [-1.5, 0.28], [-1.1, -0.20],
    [-0.75, 0.14], [-0.5, -0.09], [-0.3, 0.06], [-0.15, -0.03],
    [-0.06, 0.01], [0, 0],
  ];

  // With momentum: smooth along ravine floor
  const momTraj: Array<[number, number]> = [
    [-2.8, 0.5], [-2.2, 0.18], [-1.6, 0.06], [-1.1, 0.02],
    [-0.65, 0.01], [-0.3, 0.003], [-0.1, 0.001], [0, 0],
  ];

  const panels = [
    { label: 'Без momentum', traj: noMomTraj, color: T.red, cx: panelW * 0.5, note: 'зигзаги поперёк оврага' },
    { label: 'С momentum (β=0.9)', traj: momTraj, color: T.primary, cx: panelW * 1.5, note: 'плавно вдоль дна' },
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: momentum — гашение зигзагов в вытянутом овраге
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }}>
        {panels.map((panel, pi) => {
          const toSx = (w1: number) => panel.cx + w1 * scX;
          const toSy = (w2: number) => cy - w2 * scY * 20;

          return (
            <g key={pi}>
              {pi > 0 && (
                <line x1={panelW} y1={12} x2={panelW} y2={H - 28}
                  stroke={T.border} strokeWidth="1" strokeDasharray="4,3" />
              )}

              {/* Contours */}
              {levels.map((level, li) => (
                <ellipse key={li}
                  cx={panel.cx} cy={cy}
                  rx={Math.sqrt(level) * scX}
                  ry={Math.sqrt(level / 20) * scY * 20}
                  fill="none" stroke={panel.color}
                  strokeWidth={0.9} opacity={0.18 + li * 0.1} />
              ))}

              {/* Trajectory */}
              <polyline
                points={panel.traj.map(([w1, w2]) => `${toSx(w1)},${toSy(w2)}`).join(' ')}
                fill="none" stroke={panel.color} strokeWidth="2.2" strokeLinejoin="round" />
              {panel.traj.map(([w1, w2], i) => (
                <circle key={i} cx={toSx(w1)} cy={toSy(w2)} r={i === 0 ? 5.5 : 3.5}
                  fill={panel.color} opacity={0.2 + i / panel.traj.length * 0.8} />
              ))}

              {/* Min */}
              <circle cx={panel.cx} cy={cy} r="7" fill={panel.color} />
              <text x={panel.cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.white}>★</text>

              {/* Zigzag annotation for no-momentum */}
              {pi === 0 && (() => {
                const pts = noMomTraj.slice(0, 5);
                return pts.slice(0, -1).map(([x, y], i) => {
                  const [nx, ny] = pts[i + 1];
                  return (
                    <g key={i} opacity="0.4">
                      <line x1={toSx(x)} y1={toSy(y)} x2={toSx(nx)} y2={toSy(ny)}
                        stroke={T.red} strokeWidth="0.8" strokeDasharray="2,2" />
                    </g>
                  );
                });
              })()}

              <text x={panel.cx} y={H - 14} textAnchor="middle" fontSize="11" fontWeight="800" fill={panel.color}>
                {panel.label}
              </text>
              <text x={panel.cx} y={H - 2} textAnchor="middle" fontSize="9" fill={T.muted}>
                {panel.note}
              </text>
            </g>
          );
        })}

        {/* v formula */}
        <rect x={W - 200} y={14} width={190} height={42} rx={8}
          fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1" />
        <text x={W - 105} y={30} textAnchor="middle" fontSize="9" fontWeight="800" fill={T.primaryDark}>
          vₜ₊₁ = β·vₜ + ∇L(wₜ)
        </text>
        <text x={W - 105} y={48} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.primaryDark}>
          wₜ₊₁ = wₜ − η·vₜ₊₁
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Красный: зигзаги поперёк оврага, медленное продвижение вдоль дна.<br />
        Синий: momentum гасит боковые колебания и разгоняет движение вдоль оврага.
      </p>
    </div>
  );
}

/** Иллюстрация 4: Adam — схема двух моментов */
function IllustrationAdam() {
  const W = 540, H = 230;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: Adam — два момента и адаптивный шаг
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto' }}>
        {/* Input: gradient */}
        <rect x={10} y={90} width={80} height={50} rx={10}
          fill={T.surface} stroke={T.border} strokeWidth="1.5" />
        <text x={50} y={113} textAnchor="middle" fontSize="12" fontWeight="800" fill={T.muted}>∇L(wₜ)</text>
        <text x={50} y={128} textAnchor="middle" fontSize="9" fill={T.muted}>градиент</text>

        <defs>
          <marker id="arr-adam" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={T.muted} />
          </marker>
        </defs>

        {/* Fork arrows */}
        <line x1={90} y1={100} x2={130} y2={70} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-adam)" />
        <line x1={90} y1={120} x2={130} y2={150} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-adam)" />

        {/* 1st moment box */}
        <rect x={132} y={44} width={130} height={52} rx={10}
          fill={`${T.primary}14`} stroke={`${T.primary}50`} strokeWidth="1.5" />
        <text x={197} y={64} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.primaryDark}>
          1-й момент mₜ
        </text>
        <text x={197} y={78} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.primary}>
          β₁·mₜ + (1−β₁)·∇L
        </text>
        <text x={197} y={90} textAnchor="middle" fontSize="9" fill={T.muted}>
          β₁ ≈ 0.9 (направление)
        </text>

        {/* 2nd moment box */}
        <rect x={132} y={126} width={130} height={52} rx={10}
          fill={`${T.violet}14`} stroke={`${T.violet}50`} strokeWidth="1.5" />
        <text x={197} y={146} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.violet}>
          2-й момент vₜ
        </text>
        <text x={197} y={160} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.violet}>
          β₂·vₜ + (1−β₂)·(∇L)²
        </text>
        <text x={197} y={172} textAnchor="middle" fontSize="9" fill={T.muted}>
          β₂ ≈ 0.999 (масштаб)
        </text>

        {/* Bias correction arrows */}
        <line x1={262} y1={70} x2={300} y2={70} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-adam)" />
        <line x1={262} y1={152} x2={300} y2={152} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-adam)" />

        {/* Correction boxes */}
        <rect x={302} y={52} width={96} height={38} rx={8}
          fill={`${T.cyan}14`} stroke={`${T.cyan}40`} strokeWidth="1.2" />
        <text x={350} y={69} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.cyan}>m̂ = m / (1−β₁ᵗ)</text>
        <text x={350} y={83} textAnchor="middle" fontSize="8" fill={T.muted}>поправка смещения</text>

        <rect x={302} y={134} width={96} height={38} rx={8}
          fill={`${T.cyan}14`} stroke={`${T.cyan}40`} strokeWidth="1.2" />
        <text x={350} y={151} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.cyan}>v̂ = v / (1−β₂ᵗ)</text>
        <text x={350} y={165} textAnchor="middle" fontSize="8" fill={T.muted}>поправка смещения</text>

        {/* Merge arrows */}
        <line x1={398} y1={71} x2={430} y2={100} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-adam)" />
        <line x1={398} y1={153} x2={430} y2={130} stroke={T.muted} strokeWidth="1.5" markerEnd="url(#arr-adam)" />

        {/* Update box */}
        <rect x={432} y={82} width={100} height={56} rx={10}
          fill={T.amberLight} stroke={T.amber} strokeWidth="1.8" />
        <text x={482} y={104} textAnchor="middle" fontSize="12" fontWeight="800" fill={T.amber}>w обновление</text>
        <text x={482} y={122} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.amber}>
          w − η·m̂ / (√v̂ + ε)
        </text>

        {/* Bottom annotation */}
        <rect x={10} y={H - 32} width={W - 20} height={26} rx={8}
          fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="1" />
        <text x={W / 2} y={H - 16} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.primaryDark}>
          Адаптивный шаг: крутые координаты → маленький шаг · пологие → большой. η=0.001 работает для большинства задач.
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        1-й момент: <b>направление</b> (усреднённый градиент как в momentum).<br />
        2-й момент: <b>масштаб</b> (дисперсия градиента → адаптивный шаг на каждый параметр).
      </p>
    </div>
  );
}

/** Иллюстрация 5: Сравнение оптимизаторов — кривые потерь */
function IllustrationOptimizerComparison() {
  const W = 460, H = 220;
  const padL = 48, padB = 36, padT = 20, padR = 20;
  const iW = W - padL - padR, iH = H - padB - padT;

  const steps = 60;
  // Simulated loss curves
  const curves = [
    {
      label: 'Batch GD', color: T.muted,
      fn: (t: number) => 3.2 * Math.exp(-0.035 * t) + 0.1,
    },
    {
      label: 'SGD', color: T.amber,
      fn: (t: number) => 3.2 * Math.exp(-0.06 * t) + 0.15 + 0.3 * Math.sin(t * 0.8) * Math.exp(-0.04 * t),
    },
    {
      label: 'Momentum', color: T.cyan,
      fn: (t: number) => 3.2 * Math.exp(-0.10 * t) + 0.08 + 0.08 * Math.sin(t * 0.5) * Math.exp(-0.08 * t),
    },
    {
      label: 'Adam', color: T.primary,
      fn: (t: number) => 3.2 * Math.exp(-0.18 * t) + 0.05,
    },
  ];

  const maxLoss = 3.5;
  const toX = (t: number) => padL + (t / steps) * iW;
  const toY = (loss: number) => padT + iH - (loss / maxLoss) * iH;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: кривые обучения — сравнение оптимизаторов
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }}>
        {/* Grid */}
        {[0, 1, 2, 3].map(v => (
          <g key={v}>
            <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)}
              stroke={T.border} strokeWidth="0.7" />
            <text x={padL - 4} y={toY(v) + 4} textAnchor="end" fontSize="9" fill={T.muted}>{v}</text>
          </g>
        ))}
        {[0, 15, 30, 45, 60].map(t => (
          <g key={t}>
            <line x1={toX(t)} y1={padT} x2={toX(t)} y2={padT + iH}
              stroke={T.border} strokeWidth="0.7" />
            <text x={toX(t)} y={H - padB + 14} textAnchor="middle" fontSize="9" fill={T.muted}>{t}</text>
          </g>
        ))}

        {/* Axes */}
        <line x1={padL} y1={padT + iH} x2={W - padR} y2={padT + iH}
          stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + iH}
          stroke={T.mutedLight} strokeWidth="1.5" />
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="10" fill={T.muted}>шаги (эпохи)</text>
        <text x={12} y={padT + iH / 2} textAnchor="middle" fontSize="10" fill={T.muted}
          transform={`rotate(-90, 12, ${padT + iH / 2})`}>Loss</text>

        {/* Loss curves */}
        {curves.map(curve => {
          const pts = Array.from({ length: steps + 1 }, (_, t) =>
            `${toX(t)},${toY(Math.max(0, curve.fn(t)))}`
          ).join(' ');
          return (
            <polyline key={curve.label} points={pts}
              fill="none" stroke={curve.color} strokeWidth="2.2" strokeLinejoin="round" />
          );
        })}

        {/* End labels */}
        {curves.map(curve => {
          const endLoss = Math.max(0, curve.fn(steps));
          return (
            <text key={curve.label}
              x={toX(steps) + 4} y={toY(endLoss) + 4}
              fontSize="9" fontWeight="700" fill={curve.color}>
              {curve.label}
            </text>
          );
        })}

        {/* Adam is best annotation */}
        <circle cx={toX(20)} cy={toY(curves[3].fn(20))} r="5" fill={T.primary} opacity="0.5" />
        <line x1={toX(20)} y1={toY(curves[3].fn(20)) - 6}
          x2={toX(20)} y2={toY(curves[3].fn(20)) - 22}
          stroke={T.primary} strokeWidth="1.2" />
        <text x={toX(20)} y={toY(curves[3].fn(20)) - 26}
          textAnchor="middle" fontSize="9" fontWeight="800" fill={T.primary}>быстрее всех</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Adam сходится быстрее всего и достигает наименьших потерь. SGD шумит, но обгоняет Batch GD.<br />
        Momentum — хороший компромисс. Разница может составлять на порядок в числе итераций.
      </p>
    </div>
  );
}

/** Иллюстрация 6: Линейная регрессия — MSE поверхность */
function IllustrationLinearRegression() {
  const W = 500, H = 240;

  // Left: data points + regression line
  const data: Array<[number, number]> = [
    [0.5, 1.2], [1.1, 2.3], [1.8, 3.5], [2.4, 4.1],
    [3.0, 5.6], [3.5, 6.2], [4.2, 7.8], [4.8, 8.5],
  ];
  const lx = 14, ly = H - 20, lW = 210, lH = 190;
  const toDataX = (x: number) => lx + (x / 5.5) * lW;
  const toDataY = (y: number) => ly - (y / 10) * lH;

  // w* ≈ 1.8, b ≈ 0.3
  const wStar = 1.82, bStar = 0.28;

  // Right: MSE surface as contours in (w, b) space
  const cx = 370, cy = H / 2 + 10, scW = 36, scB = 28;

  const mseContours = [0.3, 0.8, 1.6, 2.8, 4.2];

  // Gradient descent trajectory in (w,b) space
  const gdTraj: Array<[number, number]> = [
    [wStar - 1.5, bStar - 1.2], [wStar - 1.1, bStar - 0.85],
    [wStar - 0.75, bStar - 0.56], [wStar - 0.45, bStar - 0.32],
    [wStar - 0.22, bStar - 0.15], [wStar - 0.08, bStar - 0.05],
    [wStar, bStar],
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: линейная регрессия — данные и MSE как функция параметров
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }}>
        {/* Divider */}
        <line x1={W / 2} y1={10} x2={W / 2} y2={H - 8}
          stroke={T.border} strokeWidth="1" strokeDasharray="4,3" />

        {/* LEFT: Data + regression line */}
        <line x1={lx} y1={ly} x2={lx + lW + 10} y2={ly}
          stroke={T.mutedLight} strokeWidth="1.2" />
        <line x1={lx} y1={toDataY(0)} x2={lx} y2={10}
          stroke={T.mutedLight} strokeWidth="1.2" />
        <text x={lx + lW / 2} y={ly + 14} textAnchor="middle" fontSize="9" fill={T.muted}>x</text>
        <text x={lx - 6} y={10} textAnchor="end" fontSize="9" fill={T.muted}>y</text>

        {/* Regression line */}
        <line x1={toDataX(0)} y1={toDataY(bStar)}
          x2={toDataX(5.2)} y2={toDataY(wStar * 5.2 + bStar)}
          stroke={T.primary} strokeWidth="2" />

        {/* Residuals */}
        {data.map(([x, y], i) => (
          <g key={i}>
            <line x1={toDataX(x)} y1={toDataY(y)}
              x2={toDataX(x)} y2={toDataY(wStar * x + bStar)}
              stroke={T.red} strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
            <circle cx={toDataX(x)} cy={toDataY(y)} r="4" fill={T.amber} />
          </g>
        ))}

        {/* Labels */}
        <rect x={lx + 4} y={20} width={100} height={30} rx={6} fill={T.primaryLight} />
        <text x={lx + 54} y={33} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.primaryDark}>ŷ = w·x + b</text>
        <text x={lx + 54} y={44} textAnchor="middle" fontSize="8" fill={T.muted}>минимизируем MSE</text>

        {/* Residual legend */}
        <line x1={lx + 4} y1={ly - 18} x2={lx + 16} y2={ly - 18}
          stroke={T.red} strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
        <text x={lx + 20} y={ly - 14} fontSize="8" fill={T.muted}>невязка (yᵢ − ŷᵢ)</text>

        {/* RIGHT: MSE contours in (w,b) */}
        {mseContours.map((level, li) => (
          <ellipse key={li} cx={cx} cy={cy}
            rx={Math.sqrt(level) * scW * 0.9}
            ry={Math.sqrt(level) * scB * 0.7}
            fill="none" stroke={T.green}
            strokeWidth={1.0} opacity={0.2 + li * 0.13} />
        ))}

        {/* GD trajectory */}
        <polyline
          points={gdTraj.map(([w, b]) => `${cx + (w - wStar) * scW},${cy - (b - bStar) * scB * 3}`).join(' ')}
          fill="none" stroke={T.primary} strokeWidth="2" strokeLinejoin="round" />
        {gdTraj.map(([w, b], i) => (
          <circle key={i} cx={cx + (w - wStar) * scW} cy={cy - (b - bStar) * scB * 3}
            r={i === 0 ? 5.5 : 3.5}
            fill={T.primary} opacity={0.2 + i / gdTraj.length * 0.8} />
        ))}

        {/* Minimum */}
        <circle cx={cx} cy={cy} r="7.5" fill={T.green} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.white}>★</text>
        <text x={cx + 10} y={cy - 10} fontSize="9" fontWeight="700" fill={T.green}>w*={wStar}, b*={bStar}</text>

        {/* Axis labels */}
        <text x={cx + 80} y={cy + 4} fontSize="9" fill={T.muted}>w→</text>
        <text x={cx} y={cy - 80} textAnchor="middle" fontSize="9" fill={T.muted}>b↑</text>

        {/* Panel title */}
        <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill={T.green}>
          MSE(w,b) — спуск к w*, b*
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Слева: точки данных и регрессионная прямая ŷ=wx+b. Пунктир — невязки.<br />
        Справа: контурная карта MSE(w,b). Градиентный спуск идёт к минимуму ★ — оптимальным w* и b*.
      </p>
    </div>
  );
}

/** Иллюстрация 7: Карта всего раздела */
function IllustrationRoadmap() {
  const W = 580, H = 340;

  const nodes = [
    { id: 'limit', label: 'Предел и\nнепрерывность', x: 290, y: 36, color: T.violet },
    { id: 'deriv', label: 'Производная\n(одна перем.)', x: 290, y: 108, color: T.primary },
    { id: 'partial', label: 'Частные\nпроизводные', x: 290, y: 180, color: T.green },
    { id: 'gd1', label: 'Гр. спуск\nЧасть 1', x: 170, y: 256, color: T.amber },
    { id: 'gd2', label: 'Гр. спуск\nЧасть 2', x: 410, y: 256, color: T.cyan },
    { id: 'apps', label: 'ML:\nлинейная рег.\nnейросети', x: 290, y: 316, color: T.red },
  ];

  const edges = [
    ['limit', 'deriv'],
    ['deriv', 'partial'],
    ['partial', 'gd1'],
    ['partial', 'gd2'],
    ['gd1', 'apps'],
    ['gd2', 'apps'],
  ];

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  const subtexts: Record<string, string> = {
    'limit→deriv': 'предел дроби',
    'deriv→partial': 'одна → n перем.',
    'partial→gd1': 'batch, learning rate',
    'partial→gd2': 'SGD, Adam',
    'gd1→apps': 'оптимизация',
    'gd2→apps': 'нейросети',
  };

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Карта раздела: математический анализ для Data Science
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 660, display: 'block', margin: '0 auto' }}>
        <defs>
          <marker id="arr-map" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={T.mutedLight} />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map(([a, b], i) => {
          const na = nodeMap[a], nb = nodeMap[b];
          const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
          const key = `${a}→${b}`;
          return (
            <g key={i}>
              <line x1={na.x} y1={na.y + 22} x2={nb.x} y2={nb.y - 22}
                stroke={T.mutedLight} strokeWidth="1.5"
                markerEnd="url(#arr-map)" />
              {subtexts[key] && (
                <text x={mx + (na.x !== nb.x ? (na.x < nb.x ? -30 : 30) : 6)}
                  y={my + 4}
                  textAnchor="middle" fontSize="8" fill={T.muted}>
                  {subtexts[key]}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const lines = node.label.split('\n');
          const isActive = node.id === 'gd2';
          return (
            <g key={node.id}>
              <rect x={node.x - 68} y={node.y - 22} width={136} height={44} rx={12}
                fill={isActive ? node.color : `${node.color}14`}
                stroke={node.color}
                strokeWidth={isActive ? 2.5 : 1.5} />
              {lines.map((line, li) => (
                <text key={li}
                  x={node.x}
                  y={node.y - 4 + li * 14}
                  textAnchor="middle" fontSize="11"
                  fontWeight="800"
                  fill={isActive ? T.white : node.color}>
                  {line}
                </text>
              ))}
              {isActive && (
                <text x={node.x} y={node.y + 34} textAnchor="middle" fontSize="8"
                  fontWeight="700" fill={node.color}>
                  ← вы здесь
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Каждая тема опирается на предыдущую. Градиентный спуск — вершина раздела:<br />
        без предела нет производной, без производной — нет градиента, без градиента — нет обучения.
      </p>
    </div>
  );
}

// ─── Self-check ───────────────────────────────────────────────────────────────
function CheckQuestions() {
  const questions = [
    {
      q: 'Чем SGD отличается от Batch GD? Почему SGD работает, несмотря на шум?',
      options: [
        'SGD берёт 1 случайный пример; его градиент — несмещённая оценка истинного, в среднем верная',
        'SGD использует все примеры, но в другом порядке',
        'SGD не работает — только Batch GD корректен',
        'SGD делает тот же шаг, что Batch, но быстрее считает',
      ],
      correct: 0,
      explanation: 'E[∇ℓᵢ(w)] = ∇L(w) — матожидание по случайному примеру равно истинному градиенту. Каждый шаг «шумный», но направление в среднем верное. Один шаг стоит O(1) вместо O(n).',
    },
    {
      q: 'Почему learning rate нужно уменьшать со временем в SGD?',
      options: [
        'Чтобы алгоритм не «взорвался» в начале',
        'С постоянным η шум SGD не даёт сойтись: алгоритм «танцует» около минимума',
        'Большой lr приводит к расходимости гессиана',
        'Это нужно только для Adam, не для SGD',
      ],
      correct: 1,
      explanation: 'С постоянным η дисперсия шага не уменьшается — алгоритм совершает конечные колебания вокруг минимума и никогда не «зафиксируется» в нём. Условия Роббинса–Монро (Σηₜ=∞, Σηₜ²<∞) гарантируют сходимость.',
    },
    {
      q: 'Как momentum помогает в вытянутом овраге?',
      options: [
        'Увеличивает learning rate',
        'Накапливает скорость вдоль оврага, гася поперечные колебания',
        'Выбирает другое направление спуска',
        'Уменьшает число параметров',
      ],
      correct: 1,
      explanation: 'Поперёк оврага градиент колеблется +/−: вклады гасят друг друга в скорости v. Вдоль оврага градиент постоянно указывает к минимуму: вклады накапливаются. В итоге v направлен вдоль дна — алгоритм разгоняется без зигзагов.',
    },
    {
      q: 'Что означают первый и второй моменты в Adam?',
      options: [
        'm — первый, v — второй; оба хранят сумму градиентов',
        'm — среднее градиентов (направление), v — среднее квадратов (дисперсия/масштаб)',
        'm — градиент, v — гессиан',
        'Оба хранят одну и ту же информацию, дублируя друг друга',
      ],
      correct: 1,
      explanation: 'Первый момент mₜ = β₁·mₜ₋₁ + (1−β₁)·∇L — экспоненциальное среднее градиентов, аналог momentum (направление). Второй момент vₜ = β₂·vₜ₋₁ + (1−β₂)·(∇L)² — среднее квадратов градиентов, адаптирует шаг под масштаб каждой координаты.',
    },
    {
      q: 'Почему для линейной регрессии используют градиентный спуск при наличии аналитического решения?',
      options: [
        'Аналитическое решение неверно',
        'Аналитическое решение требует O(d³) для обращения матрицы — дорого при большом числе признаков d',
        'SGD всегда точнее аналитики',
        'Градиентный спуск обязателен для всех задач ML',
      ],
      correct: 1,
      explanation: 'Нормальные уравнения w* = (XᵀX)⁻¹Xᵀy требуют обращения d×d матрицы — O(d³). При d=10⁴ это 10¹² операций. Градиентный спуск стоит O(nd) на эпоху и позволяет работать потоком без загрузки всего датасета в память.',
    },
    {
      q: 'Почему маленький mini-batch размера 32–64 часто лучше большого 1024+?',
      options: [
        'Большой батч занимает больше памяти, поэтому запрещён',
        'Маленький батч вычисляется быстрее',
        'Шум маленького батча помогает находить более «плоские» минимумы с лучшим обобщением',
        'Большой батч не поддерживает GPU',
      ],
      correct: 2,
      explanation: 'Исследования (Keskar et al., 2016) показали: маленькие батчи сходятся к «широким» минимумам с пологими краями — там модель лучше обобщается. Большие батчи находят «острые» минимумы с плохой обобщающей способностью. Кроме того, шум помогает выбираться из сёдел.',
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
export default function GradientDescentPart2TheoryRich() {
  const nav = [
    { id: 'gd2-why', label: 'Зачем это' },
    { id: 'gd2-batch-problem', label: 'Проблема Batch GD' },
    { id: 'gd2-sgd', label: 'SGD' },
    { id: 'gd2-minibatch', label: 'Mini-batch' },
    { id: 'gd2-problems', label: 'Проблемы спуска' },
    { id: 'gd2-momentum', label: 'Momentum' },
    { id: 'gd2-adaptive', label: 'Адаптивный lr' },
    { id: 'gd2-adam', label: 'Adam' },
    { id: 'gd2-compare', label: 'Сравнение' },
    { id: 'gd2-linreg', label: 'Линейная регрессия' },
    { id: 'gd2-roadmap', label: 'Карта раздела' },
    { id: 'gd2-check', label: 'Проверь себя' },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Заголовок ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Activity size={15} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: T.primary, textTransform: 'uppercase' }}>Математический анализ</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.cyan, background: `${T.cyan}14`, padding: '2px 10px', borderRadius: 20 }}>Часть 2</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, color: T.muted }}>около 30 минут</span>
        </div>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>
          Градиентный спуск: продвинутые методы
        </h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16, lineHeight: 1.6 }}>
          Стохастический и mini-batch SGD, momentum, Adam — как преодолеть овраги, сёдла и плато. Завершающая тема раздела математического анализа.
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
      <section id="gd2-why" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sparkles} label="Мотивация" title="От маленьких данных к реальному миру" />

        <div style={{ background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            1.2 миллиона изображений — и нам нужно 100 эпох
          </div>
          <p style={{ margin: '0 0 10px', color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            В первой части мы изучили <strong>Batch Gradient Descent</strong> — на каждом шаге вычисляем градиент по <em>всей</em> выборке.
            Для n=1000 это нормально. Для ImageNet (1.2 млн изображений) один шаг занимает часы, а нужны сотни шагов.
          </p>
          <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Решение: <strong>не использовать все данные сразу</strong>. Брать один случайный пример (SGD) или небольшую
            группу (mini-batch). Градиент становится шумным, зато шаги — быстрыми.
            Шум оказывается не помехой, а помощником — помогает выскакивать из ловушек.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { n: '1', title: 'SGD', d: 'Один пример на шаг. O(1) вместо O(n). Шумно, быстро.', color: T.amber },
            { n: '2', title: 'Mini-batch', d: 'Группа 32–128. Баланс шума и параллелизма GPU.', color: T.green },
            { n: '3', title: 'Momentum', d: 'Инерция против зигзагов. Накапливает скорость вдоль оврага.', color: T.primary },
            { n: '4', title: 'Adam', d: 'Momentum + адаптивный lr. Стандарт в нейросетях.', color: T.cyan },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{item.n}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 1. ПРОБЛЕМА BATCH GD ══ */}
      <section id="gd2-batch-problem" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Проблема" title="Почему Batch GD не масштабируется" color={T.red} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Функция потерь в ML — это среднее по всем примерам:
        </p>

        <FBox
          tex="L(w) = \frac{1}{n}\sum_{i=1}^{n} \ell_i(w), \qquad \nabla L(w) = \frac{1}{n}\sum_{i=1}^{n}\nabla\ell_i(w)"
          hint="Один шаг Batch GD = n вычислений градиента. При n=10⁶ — неприемлемо дорого."
          color={T.red}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { metric: 'n = 1000', batch: '1 шаг', sgd: '1000 шагов', color: T.green },
            { metric: 'n = 10⁶', batch: '≈ час на шаг', sgd: '1 секунда', color: T.red },
            { metric: 'GPU', batch: 'не параллелит всё', sgd: 'батч — идеально', color: T.primary },
          ].map((item, i) => (
            <div key={i} style={{ background: `${item.color}08`, border: `1px solid ${item.color}30`, borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.metric}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: T.muted, marginBottom: 3 }}>
                <span style={{ fontWeight: 700 }}>Batch:</span> {item.batch}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: T.text }}>
                <span style={{ fontWeight: 700 }}>SGD:</span> {item.sgd}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 2. SGD ══ */}
      <section id="gd2-sgd" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Метод 1" title="Стохастический градиентный спуск (SGD)" color={T.amber} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          На каждом шаге выбираем <strong>один случайный пример</strong> и делаем вид, что его градиент — это честный градиент по всей выборке.
        </p>

        <FBox
          tex="w_{t+1} = w_t - \eta\,\nabla\ell_{i_t}(w_t), \qquad i_t \sim \text{Uniform}\{1,\ldots,n\}"
          hint="iₜ — случайный индекс примера на шаге t"
          color={T.amber}
        />

        <Card style={{ borderLeft: `4px solid ${T.green}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Почему это работает: несмещённость</div>
          <FBox
            tex="\mathbb{E}_{i}\bigl[\nabla\ell_i(w)\bigr] = \frac{1}{n}\sum_{i=1}^{n}\nabla\ell_i(w) = \nabla L(w)"
            hint="В среднем по случайному выбору примера градиент SGD равен истинному градиенту"
            color={T.green}
          />
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: 0 }}>
            Каждый отдельный шаг может указывать не совсем туда. Но в среднем, за много шагов,
            направление верное. Алгоритм <strong>дрожит</strong> вокруг истинного пути, но в целом движется к минимуму.
          </p>
        </Card>

        <IllustrationSGDNoise />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card style={{ borderTop: `3px solid ${T.green}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Плюсы SGD</div>
            {[
              'Скорость: O(1) на шаг вместо O(n). Пока Batch делает 1 шаг — SGD делает n.',
              'Выход из ловушек: шум помогает выбраться из локальных минимумов и сёдел.',
              'Не нужно загружать все данные: можно обрабатывать потоком.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ color: T.green, fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </Card>
          <Card style={{ borderTop: `3px solid ${T.red}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 8 }}>Минусы SGD</div>
            {[
              'Шум: траектория дрожит, алгоритм «танцует» вблизи минимума.',
              'Learning rate decay обязателен: с постоянным η точной сходимости нет.',
              'Плохо использует параллелизм GPU: матричные операции над одним примером неэффективны.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ color: T.red, fontWeight: 800, flexShrink: 0 }}>✗</span>
                <span style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* ══ 3. MINI-BATCH ══ */}
      <section id="gd2-minibatch" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Метод 2" title="Mini-batch SGD — золотая середина" color={T.green} />

        <FBox
          tex="w_{t+1} = w_t - \eta\cdot\frac{1}{B}\sum_{i\,\in\,\text{batch}_t}\nabla\ell_i(w_t)"
          hint="B — размер батча (обычно 32, 64, 128, 256). Дисперсия оценки уменьшается в B раз относительно SGD."
          color={T.green}
        />

        <IllustrationThreeModes />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Выбор размера батча</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {['Размер B', 'Шум', 'Скорость шага', 'GPU', 'Обобщение'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, fontSize: 12, border: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { b: 'B=1 (SGD)', noise: 'Макс.', speed: 'O(1)', gpu: '✗ слабо', gen: '✓ хорошо', color: T.amber },
                  { b: 'B=32–128', noise: 'Среднее', speed: 'O(B)', gpu: '✓ хорошо', gen: '✓ хорошо', color: T.green },
                  { b: 'B=1024+', noise: 'Мин.', speed: 'O(B)', gpu: '✓✓ отлично', gen: '✗ острые min', color: T.red },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.white : T.surface }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: row.color, border: `1px solid ${T.border}` }}>{row.b}</td>
                    <td style={{ padding: '8px 12px', border: `1px solid ${T.border}` }}>{row.noise}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', border: `1px solid ${T.border}` }}>{row.speed}</td>
                    <td style={{ padding: '8px 12px', border: `1px solid ${T.border}` }}>{row.gpu}</td>
                    <td style={{ padding: '8px 12px', border: `1px solid ${T.border}` }}>{row.gen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Callout color={T.green} title="Эпоха (epoch)">
          Один полный проход по всем n примерам — независимо от размера батча.
          При n=1000 и B=100 → эпоха = 10 шагов. При B=1 → 1000 шагов.
          Обычно обучают <strong>десятки–сотни эпох</strong>.
        </Callout>

        <DSNote>
          В PyTorch и TensorFlow стандартный DataLoader перемешивает данные в начале каждой эпохи
          и нарезает их на мини-батчи. Размер 32–128 — хорошее начало для большинства задач.
          При ограниченной памяти GPU выбирают наибольший B, умещающийся в VRAM.
        </DSNote>
      </section>

      {/* ══ 4. ПРОБЛЕМЫ ══ */}
      <section id="gd2-problems" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Узкие места" title="Четыре проблемы обычного градиентного спуска" color={T.red} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            {
              n: '1', title: 'Овраги', icon: '↔',
              desc: 'Сильно вытянутые направления (κ≫1). Градиент поперёк оврага «съедает» шаги, почти не двигаясь вдоль дна. Зигзаги.',
              color: T.red,
            },
            {
              n: '2', title: 'Сёдла', icon: '×',
              desc: 'Стационарные точки, не являющиеся экстремумами. ∇L≈0, алгоритм «застревает» или ползёт через плоское плато.',
              color: T.violet,
            },
            {
              n: '3', title: 'Плато', icon: '→',
              desc: 'Области где ‖∇L‖ ≈ 0, но не стационарная точка. Шаги микроскопические, сходимость крайне медленная.',
              color: T.amber,
            },
            {
              n: '4', title: 'Разный масштаб', icon: '≠',
              desc: 'Один параметр требует шага 10⁻², другой — 10⁻⁵. Единый lr — плохой компромисс для всех сразу.',
              color: T.cyan,
            },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{item.icon}</span>
                <div style={{ fontWeight: 700, fontSize: 13, color: item.color }}>{item.title}</div>
              </div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 5. MOMENTUM ══ */}
      <section id="gd2-momentum" style={{ marginBottom: 52 }}>
        <SectionHeader icon={TrendingDown} label="Метод 3" title="Momentum — инерция против зигзагов" color={T.primary} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Идея: если несколько шагов подряд градиент указывает в одном направлении — это перспективное направление, давайте <strong>разгонимся</strong>. Взаимно противоположные компоненты погасятся, согласованные — накопятся.
        </p>

        <Card style={{ borderLeft: `4px solid ${T.primary}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Формулы momentum</div>
          <FBox tex="v_{t+1} = \beta\,v_t + \nabla L(w_t)" hint="vₜ — «скорость» (накопленный градиент), β ∈ [0,1) — коэффициент инерции" color={T.primary} />
          <FBox tex="w_{t+1} = w_t - \eta\,v_{t+1}" hint="β=0.9 — стандартное значение" color={T.primary} />
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: '8px 0 0' }}>
            <M tex="v_{t+1}" /> — взвешенное скользящее среднее градиентов: последний с весом 1,
            предыдущий с <M tex="\beta" />, ещё ранее <M tex="\beta^2" /> и т.д.
            Старые градиенты «забываются», но не сразу — экспоненциально.
          </p>
        </Card>

        <IllustrationMomentum />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Почему momentum работает в овраге</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: `${T.red}0a`, border: `1px solid ${T.red}30`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.red, marginBottom: 6 }}>Поперёк оврага</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                Градиент колеблется: шаг влево, шаг вправо. В <M tex="v_t" /> эти компоненты <strong>гасят</strong> друг друга. Зигзаги уменьшаются.
              </div>
            </div>
            <div style={{ background: `${T.green}0a`, border: `1px solid ${T.green}30`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.green, marginBottom: 6 }}>Вдоль оврага</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                Градиент постоянно указывает к минимуму. В <M tex="v_t" /> эти компоненты <strong>накапливаются</strong>. Скорость растёт.
              </div>
            </div>
          </div>
        </Card>

        <DSNote>
          Momentum β=0.9 означает, что «эффективная длина памяти» ≈ 1/(1−β) = 10 последних шагов.
          При β=0.99 — 100 шагов. Большее β даёт более плавную траекторию, но может перепрыгнуть минимум.
        </DSNote>
      </section>

      {/* ══ 6. АДАПТИВНЫЙ LR ══ */}
      <section id="gd2-adaptive" style={{ marginBottom: 52 }}>
        <SectionHeader icon={GitMerge} label="Идея" title="Адаптивный learning rate на каждую координату" color={T.violet} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Единый <M tex="\eta" /> для всех параметров — компромисс, который никому не подходит идеально. Хочется давать <strong>маленький шаг</strong> там, где градиент большой (крутой склон), и <strong>большой шаг</strong> там, где маленький (пологий).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
          {[
            {
              name: 'AdaGrad', year: '2011', color: T.muted,
              idea: 'Накапливает сумму квадратов градиентов. Делит lr на √(сумма).',
              problem: 'lr монотонно убывает → в конце обучения шаги исчезающе малы.',
            },
            {
              name: 'RMSprop', year: '2012', color: T.amber,
              idea: 'Экспоненциальное скользящее среднее квадратов вместо суммы.',
              problem: 'Нет коррекции начального смещения. Нет momentum.',
            },
            {
              name: 'Adam', year: '2014', color: T.primary,
              idea: 'Momentum + RMSprop + коррекция смещения. Полный пакет.',
              problem: 'Иногда хуже SGD для строгой сходимости. Требует памяти O(2n).',
            },
          ].map(item => (
            <div key={item.name} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: item.color }}>{item.name}</span>
                <span style={{ fontSize: 11, color: T.muted, background: T.surface, padding: '1px 8px', borderRadius: 10 }}>{item.year}</span>
              </div>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, marginBottom: 6 }}>
                <strong>Идея:</strong> {item.idea}
              </div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                <strong>Ограничение:</strong> {item.problem}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 7. ADAM ══ */}
      <section id="gd2-adam" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Brain} label="Метод 4 — стандарт" title="Adam — Adaptive Moment Estimation" color={T.cyan} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Adam объединяет momentum (первый момент — направление) и RMSprop (второй момент — масштаб).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <Card style={{ borderLeft: `4px solid ${T.primary}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, marginBottom: 8 }}>1-й момент — направление (как Momentum)</div>
            <FBox tex="m_{t+1} = \beta_1\,m_t + (1-\beta_1)\,\nabla L(w_t)" hint="β₁ ≈ 0.9 — экспоненциальное среднее градиентов" color={T.primary} />
          </Card>
          <Card style={{ borderLeft: `4px solid ${T.violet}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.violet, marginBottom: 8 }}>2-й момент — масштаб (как RMSprop)</div>
            <FBox tex="v_{t+1} = \beta_2\,v_t + (1-\beta_2)\,(\nabla L(w_t))^2" hint="β₂ ≈ 0.999 — среднее квадратов градиентов. (∇L)² — поэлементно" color={T.violet} />
          </Card>
          <Card style={{ borderLeft: `4px solid ${T.cyan}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.cyan, marginBottom: 8 }}>Коррекция смещения + обновление</div>
            <FBox tex="\hat{m} = \frac{m_{t+1}}{1-\beta_1^{t+1}},\quad \hat{v} = \frac{v_{t+1}}{1-\beta_2^{t+1}}" hint="Поправка: в начале m₀=0 — значения смещены к нулю, деление убирает это смещение" color={T.cyan} />
            <FBox tex="w_{t+1} = w_t - \eta\,\frac{\hat{m}}{\sqrt{\hat{v}} + \varepsilon}" hint="ε ≈ 10⁻⁸ для численной устойчивости. η=0.001 — работает для большинства задач" color={T.primary} />
          </Card>
        </div>

        <IllustrationAdam />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Почему Adam работает</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { title: 'Разгон в оврагах', desc: 'Первый момент m накапливает скорость вдоль оврага, гасит поперечные колебания.', color: T.primary, icon: '↗' },
              { title: 'Адаптивный шаг', desc: '√v показывает масштаб градиента. Крутые координаты → маленький шаг. Пологие → большой.', color: T.violet, icon: '⚖' },
              { title: 'Устойчивость', desc: 'η=0.001 работает в большинстве задач без подбора. Не нужна тонкая настройка.', color: T.green, icon: '✓' },
              { title: 'Слабые параметры', desc: 'Координаты с редкими ненулевыми градиентами получают большой шаг. Важно для NLP (embedding).', color: T.cyan, icon: '🎯' },
            ].map(item => (
              <div key={item.title} style={{ background: T.surface, borderRadius: 12, padding: '12px 14px' }}>
                <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>{item.icon}</span>
                <div style={{ fontWeight: 700, fontSize: 13, color: item.color, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <Callout color={T.cyan} title="Adam — стандарт де-факто">
          Если вы не знаете, какой оптимизатор выбрать — берите Adam с η=0.001, β₁=0.9, β₂=0.999.
          Это работает для большинства архитектур: трансформеры, CNN, MLP.
          Иногда SGD с momentum и lr schedule даёт лучшее качество на CV задачах (ResNet),
          но требует более тщательной настройки.
        </Callout>
      </section>

      {/* ══ 8. СРАВНЕНИЕ ══ */}
      <section id="gd2-compare" style={{ marginBottom: 52 }}>
        <SectionHeader icon={BarChart2} label="Итог" title="Сравнение оптимизаторов" color={T.green} />

        <IllustrationOptimizerComparison />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Таблица сравнения</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {['Метод', 'Скорость', 'Шум', 'Овраги', 'Adaptive lr', 'Сложность'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, fontSize: 11, border: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { m: 'Batch GD', speed: '✗ медленно', noise: '✓ нет', ravine: '✗ зигзаги', ada: '✗', complex: 'O(n)', color: T.muted },
                  { m: 'SGD', speed: '✓✓ быстро', noise: '✗ высокий', ravine: '✗ зигзаги', ada: '✗', complex: 'O(1)', color: T.amber },
                  { m: 'SGD+Momentum', speed: '✓✓ быстро', noise: '✓ сглажен', ravine: '✓ разгон', ada: '✗', complex: 'O(1)', color: T.primary },
                  { m: 'Adam', speed: '✓✓ быстро', noise: '✓✓ сглажен', ravine: '✓✓ отлично', ada: '✓✓', complex: 'O(2n)', color: T.cyan },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.white : T.surface }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: row.color, border: `1px solid ${T.border}` }}>{row.m}</td>
                    <td style={{ padding: '8px 12px', border: `1px solid ${T.border}` }}>{row.speed}</td>
                    <td style={{ padding: '8px 12px', border: `1px solid ${T.border}` }}>{row.noise}</td>
                    <td style={{ padding: '8px 12px', border: `1px solid ${T.border}` }}>{row.ravine}</td>
                    <td style={{ padding: '8px 12px', border: `1px solid ${T.border}` }}>{row.ada}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', border: `1px solid ${T.border}` }}>{row.complex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ══ 9. ЛИНЕЙНАЯ РЕГРЕССИЯ ══ */}
      <section id="gd2-linreg" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Code2} label="Применение" title="Линейная регрессия через градиентный спуск" color={T.violet} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Задача: найти параметры линейной модели <M tex="\hat{y} = w^\top x + b" />, минимизирующие MSE.
        </p>

        <FBox
          tex="L(w) = \frac{1}{n}\sum_{i=1}^{n}(w^\top x_i - y_i)^2"
          hint="Функция потерь — среднеквадратичная ошибка (MSE). Выпуклая чаша в пространстве весов."
        />

        <Card style={{ borderLeft: `4px solid ${T.violet}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Градиент MSE: вывод</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
            Для одного примера <M tex="\ell(w) = (w^\top x - y)^2" />. Применяем цепное правило:
          </p>
          <F tex="\nabla_w\,\ell = 2(w^\top x - y)\cdot x" />
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 8 }}>
            <M tex="(w^\top x - y)" /> — «ошибка» предсказания. <M tex="x" /> — производная <M tex="w^\top x" /> по w.
            Вся выборка:
          </p>
          <FBox
            tex="\nabla L(w) = \frac{2}{n}\sum_{i=1}^{n}(\hat{y}_i - y_i)\,x_i"
            hint="Ошибка на примере × признаки примера → усреднили → это и есть направление спуска"
            color={T.violet}
          />
        </Card>

        <IllustrationLinearRegression />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Алгоритм: SGD для линейной регрессии</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { n: '1', text: 'Инициализировать w = 0 (или случайно)', color: T.muted },
              { n: '2', text: 'Случайно выбрать пример (xᵢ, yᵢ)', color: T.violet },
              { n: '3', text: 'Вычислить ошибку: eᵢ = wᵀxᵢ − yᵢ', color: T.red },
              { n: '4', text: 'Обновить: w ← w − η·2eᵢ·xᵢ', color: T.primary },
              { n: '5', text: 'Повторять до ‖∇L‖ < ε или N эпох', color: T.green },
            ].map(item => (
              <div key={item.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.n}</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Сравнение с аналитическим решением</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, marginBottom: 6 }}>Аналитика: МНК</div>
              <F tex="w^* = (X^\top X)^{-1}X^\top y" />
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginTop: 4 }}>
                Стоимость: O(d³) — обращение матрицы.<br />
                При d=10⁴: 10¹² операций. Неприемлемо.
              </div>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.green, marginBottom: 6 }}>Градиентный спуск</div>
              <F tex="\text{Эпоха: }O(nd)" />
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginTop: 4 }}>
                Можно обрабатывать потоком.<br />
                Работает с огромными данными, не помещающимися в RAM.
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ══ 10. КАРТА РАЗДЕЛА ══ */}
      <section id="gd2-roadmap" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Финал раздела" title="Карта раздела: математический анализ для Data Science" color={T.primary} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 20 }}>
          Эта тема — последняя в разделе. Посмотрим, как всё сложилось в единую цепочку:
        </p>

        <IllustrationRoadmap />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 16 }}>
          {[
            { title: 'Предел', connection: '→ Производная = предел отношения приращений', color: T.violet },
            { title: 'Производная', connection: '→ Частная производная = производная по одной переменной', color: T.primary },
            { title: 'Частные произв.', connection: '→ Градиент = вектор всех частных производных', color: T.green },
            { title: 'Гр. спуск Ч.1', connection: '→ Batch GD, learning rate, кривизна, сёдла', color: T.amber },
            { title: 'Гр. спуск Ч.2', connection: '→ SGD, mini-batch, Adam, линейная регрессия', color: T.cyan },
          ].map((item, i) => (
            <div key={i} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: item.color, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{item.connection}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 11. САМОПРОВЕРКА ══ */}
      <section id="gd2-check" style={{ marginBottom: 52 }}>
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
                'SGD: один пример на шаг. E[∇ℓᵢ]=∇L — несмещённая оценка. Шумно, но работает и в n раз быстрее.',
                'Mini-batch B=32–128: золотая середина шума и параллелизма GPU. Стандарт в глубоком обучении.',
                'Learning rate decay обязателен для SGD: с постоянным η алгоритм «танцует», не сходясь.',
                'Momentum β=0.9: накапливает скорость вдоль оврага, гасит поперечные зигзаги.',
                'Adam = momentum (m̂) + адаптивный lr (1/√v̂) + коррекция смещения. η=0.001 — стандарт.',
                'Для линейной регрессии: ∇L = (2/n)Σ(ŷᵢ−yᵢ)xᵢ. GD вместо аналитики при большом d или n.',
                'Малый батч → «плоские» минимумы → лучшее обобщение. Большой батч → острые минимумы.',
                'Весь раздел: Предел → Производная → Частные → Градиент → Спуск. Одна цепочка идей.',
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
