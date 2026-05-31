// @ts-nocheck
/**
 * Theory-rich body for «Предел и непрерывность».
 * Только статичные SVG-иллюстрации — никаких canvas/интерактивов.
 * Паттерн: SectionHeader, Card, FBox, DSNote, Callout, CheckQuestions.
 * Цветовая палитра T из rank-basis/theory-rich.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, Brain, Zap, Layers, CheckCircle2,
  Sparkles, ArrowRight, Code2, Target, Activity,
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
// SVG ILLUSTRATIONS (static)
// ─────────────────────────────────────────────────────────────────────────────

/** Иллюстрация 1: Предел с «дыркой» — f(x)=(x²-1)/(x-1) */
function IllustrationHole() {
  // Points for y=x+1, x in [0,2], hole at x=1
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = i / 80 * 2.2;
    if (Math.abs(x - 1) < 0.04) continue;
    const y = x + 1;
    const sx = 40 + x * 100;
    const sy = 280 - y * 80;
    pts.push(`${sx},${sy}`);
  }
  // Split at hole
  const left = pts.filter(p => parseFloat(p) < 140);
  const right = pts.filter(p => parseFloat(p) > 140);
  const holeX = 40 + 1 * 100; // x=1 → sx=140
  const holeY = 280 - 2 * 80; // y=2 → sy=120
  const arrowX = 40 + 1.7 * 100;
  const arrowY = 280 - 2.7 * 80;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: предел в точке разрыва
      </div>
      <svg viewBox="0 0 340 300" style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' }}>
        {/* Grid */}
        {[0, 1, 2].map(i => (
          <g key={i}>
            <line x1={40 + i * 100} y1={20} x2={40 + i * 100} y2={280} stroke={T.border} strokeWidth="0.7" />
            <line x1={20} y1={280 - i * 80} x2={320} y2={280 - i * 80} stroke={T.border} strokeWidth="0.7" />
            {i > 0 && <text x={40 + i * 100 - 4} y={292} fontSize="10" fill={T.muted} textAnchor="middle">{i}</text>}
            {i > 0 && <text x={24} y={284 - i * 80} fontSize="10" fill={T.muted} textAnchor="end">{i}</text>}
          </g>
        ))}
        {/* Axes */}
        <line x1={20} y1={280} x2={325} y2={280} stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={40} y1={10} x2={40} y2={290} stroke={T.mutedLight} strokeWidth="1.5" />
        <text x={328} y={283} fontSize="11" fill={T.muted}>x</text>
        <text x={38} y={8} fontSize="11" fill={T.muted}>y</text>

        {/* Curve left of hole */}
        <polyline points={left.join(' ')} fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" />
        {/* Curve right of hole */}
        <polyline points={right.join(' ')} fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" />

        {/* Hole — open circle */}
        <circle cx={holeX} cy={holeY} r="6" fill={T.white} stroke={T.primary} strokeWidth="2.5" />

        {/* Approaching arrows from left */}
        {[0.6, 0.78, 0.91].map((xv, i) => {
          const ax = 40 + xv * 100;
          const ay = 280 - (xv + 1) * 80;
          const dx = 40 + (xv + 0.06) * 100 - ax;
          const dy = -(0.06 * 80);
          return (
            <g key={`l${i}`} opacity={0.35 + i * 0.2}>
              <circle cx={ax} cy={ay} r="3.5" fill={T.red} />
              <line x1={ax} y1={ay} x2={ax + dx * 0.8} y2={ay + dy * 0.8}
                stroke={T.red} strokeWidth="1.2" markerEnd="none" />
            </g>
          );
        })}
        {/* Approaching arrows from right */}
        {[1.4, 1.22, 1.1].map((xv, i) => {
          const ax = 40 + xv * 100;
          const ay = 280 - (xv + 1) * 80;
          return (
            <g key={`r${i}`} opacity={0.35 + i * 0.2}>
              <circle cx={ax} cy={ay} r="3.5" fill={T.cyan} />
            </g>
          );
        })}

        {/* Labels */}
        <rect x={145} y={106} width={100} height={22} rx={6} fill={T.redLight} />
        <text x={195} y={121} textAnchor="middle" fontSize="11" fontWeight="700" fill={T.red}>f(1) не определена</text>

        <rect x={148} y={132} width={96} height={22} rx={6} fill={T.primaryLight} />
        <text x={196} y={147} textAnchor="middle" fontSize="11" fontWeight="700" fill={T.primaryDark}>lim = 2 ✓</text>

        {/* Dashed line to hole */}
        <line x1={40} y1={holeY} x2={holeX} y2={holeY} stroke={T.mutedLight} strokeDasharray="4,3" strokeWidth="1" />
        <line x1={holeX} y1={280} x2={holeX} y2={holeY} stroke={T.mutedLight} strokeDasharray="4,3" strokeWidth="1" />
        <text x={24} y={holeY + 4} fontSize="10" fill={T.muted} textAnchor="end">2</text>
        <text x={holeX} y={294} fontSize="10" fill={T.muted} textAnchor="middle">1</text>

        {/* Title */}
        <text x={80} y={38} fontSize="12" fontWeight="700" fill={T.primary}>f(x) = (x²−1)/(x−1)</text>
        <text x={80} y={54} fontSize="10" fill={T.muted}>прямая y = x+1 с «дыркой» при x = 1</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Красные точки стремятся слева, синие справа — обе приближаются к <b>y = 2</b>.<br />
        Предел существует, хотя значение в точке не определено.
      </p>
    </div>
  );
}

/** Иллюстрация 2: ε-δ геометрия */
function IllustrationEpsilonDelta() {
  const a = 160, L = 140; // canvas coords of point (a, L)
  const eps = 45, delta = 38;
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: ε-δ определение предела
      </div>
      <svg viewBox="0 0 340 300" style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' }}>
        {/* ε-strip horizontal (purple) */}
        <rect x={30} y={L - eps} width={280} height={eps * 2}
          fill={`${T.primary}18`} stroke={T.primary} strokeWidth="0" />
        <line x1={30} y1={L - eps} x2={310} y2={L - eps}
          stroke={T.primary} strokeWidth="1.5" strokeDasharray="6,3" />
        <line x1={30} y1={L + eps} x2={310} y2={L + eps}
          stroke={T.primary} strokeWidth="1.5" strokeDasharray="6,3" />

        {/* δ-strip vertical (green) */}
        <rect x={a - delta} y={20} width={delta * 2} height={270}
          fill={`${T.green}18`} />
        <line x1={a - delta} y1={20} x2={a - delta} y2={290}
          stroke={T.green} strokeWidth="1.5" strokeDasharray="6,3" />
        <line x1={a + delta} y1={20} x2={a + delta} y2={290}
          stroke={T.green} strokeWidth="1.5" strokeDasharray="6,3" />

        {/* Curve */}
        {(() => {
          const pts: string[] = [];
          for (let px = 30; px <= 310; px++) {
            const xv = (px - 30) / 280 * 4 - 0.5;
            const yv = 0.6 * xv * xv + 0.3;
            const py = 290 - (yv / 3.5) * 260;
            pts.push(`${px},${py}`);
          }
          return <polyline points={pts.join(' ')} fill="none" stroke={T.primary} strokeWidth="2.5" />;
        })()}

        {/* Central point (a, L) */}
        <circle cx={a} cy={L} r="6" fill={T.primary} />

        {/* ε labels */}
        <text x={16} y={L - eps + 4} fontSize="11" fontWeight="800" fill={T.primaryDark} textAnchor="end">L+ε</text>
        <text x={16} y={L + eps + 4} fontSize="11" fontWeight="800" fill={T.primaryDark} textAnchor="end">L−ε</text>
        <text x={16} y={L + 4} fontSize="11" fontWeight="700" fill={T.primary} textAnchor="end">L</text>

        {/* δ labels */}
        <text x={a - delta} y={298} fontSize="10" fontWeight="800" fill={T.green} textAnchor="middle">a−δ</text>
        <text x={a + delta} y={298} fontSize="10" fontWeight="800" fill={T.green} textAnchor="middle">a+δ</text>
        <text x={a} y={298} fontSize="10" fontWeight="700" fill={T.green} textAnchor="middle">a</text>

        {/* Brace annotations */}
        <line x1={316} y1={L - eps} x2={316} y2={L} stroke={T.primary} strokeWidth="1.5" />
        <line x1={312} y1={L - eps} x2={316} y2={L - eps} stroke={T.primary} strokeWidth="1.5" />
        <line x1={312} y1={L} x2={316} y2={L} stroke={T.primary} strokeWidth="1.5" />
        <text x={320} y={L - eps / 2 + 4} fontSize="10" fontWeight="800" fill={T.primary}>ε</text>

        <line x1={a} y1={10} x2={a + delta} y2={10} stroke={T.green} strokeWidth="1.5" />
        <line x1={a} y1={7} x2={a} y2={13} stroke={T.green} strokeWidth="1.5" />
        <line x1={a + delta} y1={7} x2={a + delta} y2={13} stroke={T.green} strokeWidth="1.5" />
        <text x={a + delta / 2} y={8} fontSize="10" fontWeight="800" fill={T.green} textAnchor="middle">δ</text>

        {/* Verdict */}
        <rect x={174} y={50} width={128} height={38} rx={8} fill={T.greenLight} />
        <text x={238} y={67} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.green}>Всё в δ-полосе (зел.)</text>
        <text x={238} y={81} textAnchor="middle" fontSize="10" fill={T.green}>попадает в ε-полосу (фиол.)</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Для любой заданной точности <b>ε</b> по оси Y можно найти радиус <b>δ</b> по оси X,<br />
        в пределах которого график гарантированно остаётся в ε-полосе.
      </p>
    </div>
  );
}

/** Иллюстрация 3: Односторонние пределы — ступенька */
function IllustrationOneSided() {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: односторонние пределы — функция Хевисайда
      </div>
      <svg viewBox="0 0 340 220" style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' }}>
        {/* Axes */}
        <line x1={30} y1={180} x2={310} y2={180} stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={170} y1={20} x2={170} y2={200} stroke={T.mutedLight} strokeWidth="1.5" />
        <text x={314} y={183} fontSize="11" fill={T.muted}>x</text>
        <text x={172} y={16} fontSize="11" fill={T.muted}>y</text>

        {/* Labels on axes */}
        <text x={170} y={196} textAnchor="middle" fontSize="10" fill={T.muted}>0</text>
        <text x={228} y={193} textAnchor="middle" fontSize="10" fill={T.muted}>1</text>

        {/* H(x)=0 for x<0 — left segment */}
        <line x1={30} y1={180} x2={168} y2={180} stroke={T.red} strokeWidth="3" strokeLinecap="round" />
        {/* Open circle at (0, 0) */}
        <circle cx={170} cy={180} r="5.5" fill={T.white} stroke={T.red} strokeWidth="2.5" />

        {/* H(x)=1 for x≥0 — right segment */}
        <line x1={172} y1={110} x2={310} y2={110} stroke={T.cyan} strokeWidth="3" strokeLinecap="round" />
        {/* Filled circle at (0, 1) */}
        <circle cx={170} cy={110} r="5.5" fill={T.cyan} stroke={T.cyan} strokeWidth="2" />

        {/* Approaching arrows left */}
        {[100, 130, 153].map((x, i) => (
          <g key={i} opacity={0.4 + i * 0.25}>
            <polygon points={`${x + 10},177 ${x + 10},183 ${x + 18},180`} fill={T.red} />
          </g>
        ))}
        {/* Approaching arrows right */}
        {[240, 210, 188].map((x, i) => (
          <g key={i} opacity={0.4 + i * 0.25}>
            <polygon points={`${x - 10},107 ${x - 10},113 ${x - 18},110`} fill={T.cyan} />
          </g>
        ))}

        {/* Labels */}
        <rect x={38} y={155} width={90} height={20} rx={5} fill={T.redLight} />
        <text x={83} y={169} textAnchor="middle" fontSize="10" fontWeight="700" fill={T.red}>lim⁻ = 0</text>

        <rect x={212} y={88} width={90} height={20} rx={5} fill={`${T.cyan}20`} />
        <text x={257} y={102} textAnchor="middle" fontSize="10" fontWeight="700" fill={T.cyan}>lim⁺ = 1</text>

        {/* Jump label */}
        <line x1={165} y1={112} x2={165} y2={178} stroke={T.amber} strokeWidth="1.5" strokeDasharray="4,2" />
        <text x={152} y={148} fontSize="10" fontWeight="800" fill={T.amber} textAnchor="end">скачок</text>
        <text x={152} y={160} fontSize="10" fontWeight="800" fill={T.amber} textAnchor="end">= 1</text>

        <rect x={90} y={28} width={160} height={28} rx={8} fill={T.amberLight} />
        <text x={170} y={43} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.amber}>lim⁻ ≠ lim⁺ → нет предела!</text>
        <text x={170} y={53} textAnchor="middle" fontSize="9" fill={T.muted}>разрыв 1-го рода (скачок)</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Красные стрелки слева стремятся к 0, синие справа — к 1. Пределы разные,<br />
        значит двусторонний предел не существует.
      </p>
    </div>
  );
}

/** Иллюстрация 4: Четыре типа разрывов */
function IllustrationDiscontinuities() {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: четыре типа разрывов
      </div>
      <svg viewBox="0 0 680 290" style={{ width: '100%', maxWidth: 700, display: 'block', margin: '0 auto' }}>
        {[0, 1, 2, 3].map(col => {
          const ox = col * 170 + 20;
          const oy = 30;
          const W = 140, H = 200;
          const mx = ox + W / 2, my = oy + H / 2;
          const colors = [T.amber, T.red, T.violet, T.pink];
          const color = colors[col];
          const titles = ['Устранимый', 'Скачок', 'Бесконечный', 'Осциллирующий'];
          const subtitles = ['(дырка)', '(1-й род)', '(2-й род)', '(2-й род)'];

          return (
            <g key={col}>
              {/* Frame */}
              <rect x={ox} y={oy} width={W} height={H} rx={12}
                fill={`${color}08`} stroke={`${color}30`} strokeWidth="1.5" />

              {/* Mini axes */}
              <line x1={ox + 12} y1={my} x2={ox + W - 8} y2={my} stroke={T.border} strokeWidth="1" />
              <line x1={mx} y1={oy + 10} x2={mx} y2={oy + H - 10} stroke={T.border} strokeWidth="1" />

              {/* Curves */}
              {col === 0 && (
                // Removable: y=x+0.5, hole at center
                <>
                  {/* left part */}
                  <polyline
                    points={Array.from({ length: 20 }, (_, i) => {
                      const xv = -2.2 + i * 0.1;
                      if (Math.abs(xv) < 0.15) return '';
                      const yv = xv + 0.5;
                      return `${mx + xv * 25},${my - yv * 25}`;
                    }).filter(Boolean).join(' ')}
                    fill="none" stroke={color} strokeWidth="2.2" />
                  <polyline
                    points={Array.from({ length: 20 }, (_, i) => {
                      const xv = 0.2 + i * 0.1;
                      const yv = xv + 0.5;
                      return `${mx + xv * 25},${my - yv * 25}`;
                    }).join(' ')}
                    fill="none" stroke={color} strokeWidth="2.2" />
                  {/* Hole */}
                  <circle cx={mx} cy={my - 0.5 * 25} r="4.5" fill={T.white} stroke={color} strokeWidth="2" />
                  {/* Dot at wrong value */}
                  <circle cx={mx} cy={my + 0.5 * 25} r="4" fill={color} />
                </>
              )}
              {col === 1 && (
                // Jump
                <>
                  <line x1={ox + 14} y1={my + 20} x2={mx - 1} y2={my + 20} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx={mx} cy={my + 20} r="4.5" fill={T.white} stroke={color} strokeWidth="2" />
                  <line x1={mx + 1} y1={my - 28} x2={ox + W - 14} y2={my - 28} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx={mx} cy={my - 28} r="4" fill={color} />
                  {/* jump arrow */}
                  <line x1={mx + 18} y1={my - 26} x2={mx + 18} y2={my + 18}
                    stroke={T.amber} strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x={mx + 22} y={my - 2} fontSize="8" fontWeight="800" fill={T.amber}>Δ</text>
                </>
              )}
              {col === 2 && (
                // Infinite: 1/(x)
                <>
                  <polyline
                    points={Array.from({ length: 30 }, (_, i) => {
                      const xv = -2 + i * 0.07;
                      if (Math.abs(xv) < 0.12) return '';
                      const yv = Math.max(-3, Math.min(3, 1 / xv));
                      return `${mx + xv * 26},${my - yv * 22}`;
                    }).filter(Boolean).join(' ')}
                    fill="none" stroke={color} strokeWidth="2" />
                  <polyline
                    points={Array.from({ length: 30 }, (_, i) => {
                      const xv = 0.12 + i * 0.07;
                      const yv = Math.max(-3, Math.min(3, 1 / xv));
                      return `${mx + xv * 26},${my - yv * 22}`;
                    }).join(' ')}
                    fill="none" stroke={color} strokeWidth="2" />
                  {/* asymptote */}
                  <line x1={mx} y1={oy + 10} x2={mx} y2={oy + H - 10}
                    stroke={color} strokeWidth="1.5" strokeDasharray="4,3" />
                  <text x={mx + 4} y={oy + 22} fontSize="8" fontWeight="700" fill={color}>x=a</text>
                </>
              )}
              {col === 3 && (
                // Oscillating: sin(1/x)
                <>
                  <polyline
                    points={Array.from({ length: 200 }, (_, i) => {
                      const xv = 0.04 + i * 0.012;
                      const yv = Math.sin(1 / xv) * (0.6 + xv * 0.4);
                      return `${mx + xv * 55},${my - yv * 38}`;
                    }).join(' ')}
                    fill="none" stroke={color} strokeWidth="1.6" />
                  {/* Arrow pointing to x=0 */}
                  <polygon points={`${mx + 3},${my - 4} ${mx + 3},${my + 4} ${mx - 6},${my}`} fill={color} />
                  <text x={mx - 20} y={my + 15} fontSize="7.5" fontWeight="700" fill={color}>x→0</text>
                </>
              )}

              {/* Title */}
              <text x={mx} y={oy + H + 16} textAnchor="middle" fontSize="11" fontWeight="800" fill={color}>{titles[col]}</text>
              <text x={mx} y={oy + H + 28} textAnchor="middle" fontSize="9" fill={T.muted}>{subtitles[col]}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
        {[
          { label: 'Устранимый', note: 'Пределы равны, но f(a) ≠ L. Можно «залатать»', color: T.amber },
          { label: 'Скачок', note: 'lim⁻ ≠ lim⁺. Величина скачка = |lim⁺ − lim⁻|', color: T.red },
          { label: 'Бесконечный', note: 'Хотя бы один предел = ±∞. Вертикальная асимптота', color: T.violet },
          { label: 'Осциллирующий', note: 'Предела нет из-за бесконечных колебаний', color: T.pink },
        ].map(item => (
          <div key={item.label} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Иллюстрация 5: Теорема Больцано-Коши */
function IllustrationBolzano() {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: теорема о промежуточном значении (Больцано–Коши)
      </div>
      <svg viewBox="0 0 500 260" style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }}>
        {/* Coordinate system */}
        <line x1={50} y1={220} x2={450} y2={220} stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={50} y1={20} x2={50} y2={230} stroke={T.mutedLight} strokeWidth="1.5" />
        <text x={454} y={223} fontSize="11" fill={T.muted}>x</text>
        <text x={48} y={16} fontSize="11" fill={T.muted}>y</text>

        {/* a and b markers */}
        <line x1={100} y1={218} x2={100} y2={224} stroke={T.muted} strokeWidth="1.5" />
        <text x={100} y={234} textAnchor="middle" fontSize="11" fill={T.muted}>a</text>
        <line x1={400} y1={218} x2={400} y2={224} stroke={T.muted} strokeWidth="1.5" />
        <text x={400} y={234} textAnchor="middle" fontSize="11" fill={T.muted}>b</text>

        {/* x axis zero */}
        <text x={46} y={224} textAnchor="end" fontSize="10" fill={T.mutedLight}>0</text>

        {/* Zero line */}
        <line x1={50} y1={130} x2={450} y2={130} stroke={T.border} strokeWidth="1" strokeDasharray="4,3" />
        <text x={42} y={134} textAnchor="end" fontSize="10" fill={T.muted}>0</text>

        {/* f(a) < 0 marker */}
        <line x1={46} y1={195} x2={50} y2={195} stroke={T.red} strokeWidth="1.5" />
        <text x={42} y={199} textAnchor="end" fontSize="10" fontWeight="700" fill={T.red}>f(a)</text>

        {/* f(b) > 0 marker */}
        <line x1={46} y1={65} x2={50} y2={65} stroke={T.green} strokeWidth="1.5" />
        <text x={42} y={69} textAnchor="end" fontSize="10" fontWeight="700" fill={T.green}>f(b)</text>

        {/* Curve: smooth S going from below zero to above */}
        <path d="M 100,195 C 160,190 200,170 240,130 C 280,90 330,70 400,65"
          fill="none" stroke={T.primary} strokeWidth="3" strokeLinecap="round" />

        {/* f(a) dot */}
        <circle cx={100} cy={195} r="5.5" fill={T.red} />
        {/* f(b) dot */}
        <circle cx={400} cy={65} r="5.5" fill={T.green} />

        {/* Root c — intersection with x axis */}
        <circle cx={240} cy={130} r="6.5" fill={T.white} stroke={T.amber} strokeWidth="2.5" />
        <line x1={240} y1={130} x2={240} y2={222} stroke={T.amber} strokeWidth="1.5" strokeDasharray="5,3" />
        <text x={240} y={234} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.amber}>c</text>
        <text x={240} y={124} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.amber}>f(c) = 0</text>

        {/* Shaded regions */}
        <rect x={50} y={130} width={400} height={92} fill={`${T.red}08`} />
        <rect x={50} y={20} width={400} height={110} fill={`${T.green}08`} />

        {/* Labels */}
        <text x={370} y={175} fontSize="10" fontWeight="700" fill={T.red}>f(x) &lt; 0</text>
        <text x={370} y={90} fontSize="10" fontWeight="700" fill={T.green}>f(x) &gt; 0</text>

        {/* Arrow connecting a to b */}
        <text x={250} y={250} textAnchor="middle" fontSize="10" fill={T.muted}>
          f непрерывна на [a,b], f(a)·f(b) &lt; 0 ⟹ ∃ c : f(c) = 0
        </text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Непрерывный график не может перейти из отрицательных значений в положительные,<br />
        не пересекая ноль. Это основа численного метода <b>бисекции</b>.
      </p>
    </div>
  );
}

/** Иллюстрация 6: Первый замечательный предел sin(x)/x */
function IllustrationSinX() {
  const pts: string[] = [];
  for (let i = -160; i <= 160; i++) {
    const xv = i / 160 * 5;
    const yv = Math.abs(xv) < 0.001 ? 1 : Math.sin(xv) / xv;
    const px = 170 + xv * 28;
    const py = 175 - yv * 80;
    pts.push(`${px},${py}`);
  }
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: первый замечательный предел — sin(x)/x
      </div>
      <svg viewBox="0 0 340 220" style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' }}>
        {/* Grid */}
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(i => (
          <g key={i}>
            <line x1={170 + i * 28} y1={20} x2={170 + i * 28} y2={205}
              stroke={i === 0 ? T.mutedLight : T.border} strokeWidth={i === 0 ? 1.5 : 0.7} />
            {i !== 0 && <text x={170 + i * 28} y={215} textAnchor="middle" fontSize="9" fill={T.muted}>{i}</text>}
          </g>
        ))}
        {[0, 0.5, 1].map((v, i) => (
          <g key={i}>
            <line x1={30} y1={175 - v * 80} x2={310} y2={175 - v * 80}
              stroke={v === 0 ? T.mutedLight : T.border} strokeWidth={v === 0 ? 1.5 : 0.7} />
            {v > 0 && <text x={24} y={179 - v * 80} textAnchor="end" fontSize="9" fill={T.muted}>{v}</text>}
          </g>
        ))}

        {/* Curve */}
        <polyline points={pts.join(' ')} fill="none" stroke={T.primary} strokeWidth="2.5" />

        {/* y=1 line */}
        <line x1={30} y1={175 - 80} x2={310} y2={175 - 80}
          stroke={T.green} strokeWidth="1.5" strokeDasharray="5,3" />
        <text x={312} y={99} fontSize="10" fontWeight="700" fill={T.green}>y=1</text>

        {/* Limit point */}
        <circle cx={170} cy={175 - 80} r="6" fill={T.white} stroke={T.primary} strokeWidth="2.5" />
        <circle cx={170} cy={175 - 80} r="3" fill={T.primary} />

        {/* Label */}
        <rect x={182} y={86} width={120} height={22} rx={6} fill={T.primaryLight} />
        <text x={242} y={101} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.primaryDark}>lim sin(x)/x = 1</text>
        <text x={170} y={50} textAnchor="middle" fontSize="10" fill={T.muted}>x → 0</text>

        {/* Approximation note */}
        <rect x={30} y={28} width={118} height={22} rx={6} fill={T.greenLight} />
        <text x={89} y={43} textAnchor="middle" fontSize="10" fontWeight="700" fill={T.green}>sin x ≈ x при x ≈ 0</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        Функция sin(x)/x не определена в нуле, но имеет предел 1.<br />
        График приближается к точке (0, 1) — именно туда «смотрит» кривая.
      </p>
    </div>
  );
}

/** Иллюстрация 7: Второй замечательный предел (1+1/n)^n → e */
function IllustrationSecondLimit() {
  const data = [1, 2, 3, 5, 10, 20, 50, 100, 500].map(n => ({
    n,
    val: Math.pow(1 + 1 / n, n),
  }));
  const maxVal = 3;
  const eVal = Math.E;
  const W = 320, H = 160, padL = 50, padB = 30, padT = 20, padR = 20;
  const iW = W - padL - padR, iH = H - padB - padT;
  const xScale = iW / (data.length - 1);
  const yScale = iH / maxVal;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: второй замечательный предел (1 + 1/n)ⁿ → e
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' }}>
        {/* e asymptote */}
        <line x1={padL} y1={padT + iH - eVal * yScale}
          x2={W - padR} y2={padT + iH - eVal * yScale}
          stroke={T.green} strokeWidth="1.5" strokeDasharray="6,3" />
        <text x={W - padR + 2} y={padT + iH - eVal * yScale + 4} fontSize="10" fontWeight="800" fill={T.green}>e</text>

        {/* Axes */}
        <line x1={padL} y1={padT + iH} x2={W - padR} y2={padT + iH} stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + iH} stroke={T.mutedLight} strokeWidth="1.5" />

        {/* Y labels */}
        {[1, 2, Math.E].map((v, i) => (
          <g key={i}>
            <line x1={padL - 3} y1={padT + iH - v * yScale} x2={padL} y2={padT + iH - v * yScale} stroke={T.muted} strokeWidth="1" />
            <text x={padL - 5} y={padT + iH - v * yScale + 4} textAnchor="end" fontSize="9" fill={T.muted}>
              {v === Math.E ? 'e≈2.72' : v}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const bx = padL + i * xScale;
          const bh = d.val * yScale;
          const by = padT + iH - bh;
          return (
            <g key={i}>
              <rect x={bx - 8} y={by} width={16} height={bh} rx={3}
                fill={`${T.primary}88`} stroke={T.primary} strokeWidth="1" />
              <text x={bx} y={padT + iH + 14} textAnchor="middle" fontSize="8" fill={T.muted}>{d.n}</text>
              <text x={bx} y={by - 3} textAnchor="middle" fontSize="7.5" fill={T.primaryDark}>
                {d.val.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X label */}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="10" fill={T.muted}>n</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        С ростом n значение (1 + 1/n)ⁿ стремится к <b>e ≈ 2.718</b>.<br />
        Это максимальный рост при 100% годовых с непрерывной капитализацией.
      </p>
    </div>
  );
}

/** Иллюстрация 8: Производная как предел — секущая → касательная */
function IllustrationDerivative() {
  // f(x) = x²/2 + 0.5
  const f = (x: number) => x * x / 2 + 0.5;
  const a = 1.5; // point of tangency
  const La = f(a);
  const fprime = a; // f'(x)=x at x=a

  // Canvas mapping
  const xMin = -0.5, xMax = 3.5;
  const yMin = 0, yMax = 5;
  const W = 320, H = 240;
  const toX = (x: number) => ((x - xMin) / (xMax - xMin)) * (W - 60) + 40;
  const toY = (y: number) => H - 20 - ((y - yMin) / (yMax - yMin)) * (H - 40);

  // Curve points
  const curvePts: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = xMin + (i / 100) * (xMax - xMin);
    curvePts.push(`${toX(x)},${toY(f(x))}`);
  }

  // Secant h = 1.2
  const h = 1.2;
  const x2 = a + h;
  const secSlope = (f(x2) - La) / h;
  const secLine = (x: number) => La + secSlope * (x - a);

  // Tangent
  const tanLine = (x: number) => La + fprime * (x - a);

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 16px', margin: '20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Иллюстрация: производная как предел — секущая стремится к касательной
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 400, display: 'block', margin: '0 auto' }}>
        {/* Grid */}
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <line x1={toX(i)} y1={20} x2={toX(i)} y2={H - 18} stroke={T.border} strokeWidth="0.7" />
            <text x={toX(i)} y={H - 6} textAnchor="middle" fontSize="9" fill={T.muted}>{i}</text>
          </g>
        ))}
        {[1, 2, 3, 4].map(i => (
          <g key={i}>
            <line x1={36} y1={toY(i)} x2={W - 8} y2={toY(i)} stroke={T.border} strokeWidth="0.7" />
            <text x={32} y={toY(i) + 4} textAnchor="end" fontSize="9" fill={T.muted}>{i}</text>
          </g>
        ))}
        {/* Axes */}
        <line x1={36} y1={H - 18} x2={W - 8} y2={H - 18} stroke={T.mutedLight} strokeWidth="1.5" />
        <line x1={40} y1={16} x2={40} y2={H - 16} stroke={T.mutedLight} strokeWidth="1.5" />

        {/* Secant */}
        <line x1={toX(-0.2)} y1={toY(secLine(-0.2))}
          x2={toX(3.2)} y2={toY(secLine(3.2))}
          stroke={T.amber} strokeWidth="2" strokeDasharray="7,4" />
        <text x={toX(2.8)} y={toY(secLine(2.8)) - 7} fontSize="10" fontWeight="700" fill={T.amber}>секущая</text>

        {/* Tangent */}
        <line x1={toX(-0.2)} y1={toY(tanLine(-0.2))}
          x2={toX(3.4)} y2={toY(tanLine(3.4))}
          stroke={T.green} strokeWidth="2.5" />
        <text x={toX(3.2)} y={toY(tanLine(3.2)) - 7} fontSize="10" fontWeight="700" fill={T.green}>касательная</text>

        {/* Curve */}
        <polyline points={curvePts.join(' ')} fill="none" stroke={T.primary} strokeWidth="2.5" />

        {/* Point a */}
        <circle cx={toX(a)} cy={toY(La)} r="5.5" fill={T.primary} />
        <text x={toX(a) + 7} y={toY(La) - 7} fontSize="10" fontWeight="700" fill={T.primary}>(a, f(a))</text>

        {/* Point a+h */}
        <circle cx={toX(x2)} cy={toY(f(x2))} r="4.5" fill={T.amber} />
        <text x={toX(x2) + 5} y={toY(f(x2)) - 6} fontSize="9" fill={T.amber}>(a+h)</text>

        {/* h annotation */}
        <line x1={toX(a)} y1={toY(La) + 18} x2={toX(x2)} y2={toY(La) + 18}
          stroke={T.red} strokeWidth="1.5" />
        <line x1={toX(a)} y1={toY(La) + 14} x2={toX(a)} y2={toY(La) + 22} stroke={T.red} strokeWidth="1.5" />
        <line x1={toX(x2)} y1={toY(La) + 14} x2={toX(x2)} y2={toY(La) + 22} stroke={T.red} strokeWidth="1.5" />
        <text x={(toX(a) + toX(x2)) / 2} y={toY(La) + 30} textAnchor="middle" fontSize="9" fontWeight="800" fill={T.red}>h</text>

        {/* Formula badge */}
        <rect x={42} y={22} width={154} height={30} rx={7} fill={T.primaryLight} />
        <text x={119} y={35} textAnchor="middle" fontSize="9.5" fontWeight="800" fill={T.primaryDark}>f ′(a) = lim  [f(a+h)−f(a)] / h</text>
        <text x={119} y={48} textAnchor="middle" fontSize="9" fill={T.muted}>h → 0</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
        При h→0 секущая (оранжевая) поворачивается к касательной (зелёной).<br />
        Наклон касательной — это производная, определённая через предел.
      </p>
    </div>
  );
}

// ─── Self-check ───────────────────────────────────────────────────────────────
function CheckQuestions() {
  const questions = [
    {
      q: 'Функция f(x) = (x²−4)/(x−2) при x=2. Что можно сказать о пределе при x→2?',
      options: ['Не существует, т.к. нет значения', 'Равен 4 — это устранимый разрыв', 'Равен 2', 'Равен 0/0, то есть бесконечности'],
      correct: 1,
      explanation: 'x²−4 = (x−2)(x+2), сокращаем (x−2) ≠ 0 → предел = x+2 при x→2 = 4. Классический устранимый разрыв.',
    },
    {
      q: 'Левый предел = 3, правый предел = 3, f(2) = 7. Непрерывна ли функция в x=2?',
      options: ['Да, предел есть', 'Нет — предел ≠ f(a)', 'Нет — значение не определено', 'Да, значение существует'],
      correct: 1,
      explanation: 'Три условия непрерывности: 1) f(a) есть ✓ 2) lim существует ✓ 3) lim = f(a) ✗ (3 ≠ 7). Разрыв устранимый — достаточно переопределить f(2) = 3.',
    },
    {
      q: 'Чему равен lim(x→0) sin(5x)/x?',
      options: ['1', '5', '1/5', '0'],
      correct: 1,
      explanation: 'sin(5x)/x = 5·sin(5x)/(5x). При x→0 имеем 5x→0, sin(5x)/(5x)→1. Итого 5·1 = 5.',
    },
    {
      q: 'f(x) = 1/x при x=0 — разрыв какого рода?',
      options: ['Устранимый', '1-го рода (скачок)', '2-го рода (бесконечный)', 'Осциллирующий'],
      correct: 2,
      explanation: 'Слева: −∞, справа: +∞. Хотя бы один предел бесконечен → разрыв 2-го рода. Вертикальная асимптота x=0.',
    },
    {
      q: 'Что нужно проверить, чтобы убедиться в непрерывности f в точке a?',
      options: [
        'Только что f(a) существует',
        'Только что предел при x→a существует',
        'f(a) существует, lim существует и равен f(a)',
        'f(a) = 0',
      ],
      correct: 2,
      explanation: 'Три равнозначных условия: f(a) определена, lim(x→a) f(x) конечен, и эти два числа равны. Нарушение любого — разрыв.',
    },
    {
      q: 'Теорема Больцано-Коши: f непрерывна на [1, 4], f(1)=−3, f(4)=5. Что гарантировано?',
      options: [
        'f принимает все целые значения',
        'Существует c∈(1,4) такое что f(c)=0',
        'f имеет максимум в c=2.5',
        'f монотонна на [1,4]',
      ],
      correct: 1,
      explanation: 'f(1)<0 и f(4)>0, f непрерывна → по теореме о промежуточном значении ∃c∈(1,4): f(c)=0. Это основа метода бисекции.',
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
export default function LimitsContinuityTheoryRich() {
  const navSections = [
    { id: 'lc-why', label: 'Зачем это' },
    { id: 'lc-intuition', label: 'Интуиция' },
    { id: 'lc-epsdelta', label: 'ε-δ' },
    { id: 'lc-onesided', label: 'Одностор. пределы' },
    { id: 'lc-infinite', label: 'Бесконечные пределы' },
    { id: 'lc-continuity', label: 'Непрерывность' },
    { id: 'lc-bolzano', label: 'Больцано–Коши' },
    { id: 'lc-breaks', label: 'Точки разрыва' },
    { id: 'lc-remarkable', label: 'Замеч. пределы' },
    { id: 'lc-derivative', label: 'Мостик: производная' },
    { id: 'lc-ds', label: 'Data Science' },
    { id: 'lc-check', label: 'Проверь себя' },
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
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>Предел и непрерывность</h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16, lineHeight: 1.6 }}>
          С чего начинается весь математический анализ: понятие предела, ε-δ определение, типы разрывов, замечательные пределы — и как это связано с градиентным спуском.
        </p>
      </div>

      {/* ── Навигация ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 48 }}>
        {navSections.map(s => (
          <a key={s.id} href={`#${s.id}`}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${T.primary}0f`, color: T.primary, border: `1px solid ${T.primaryBorder}`, textDecoration: 'none' }}>
            {s.label}
          </a>
        ))}
      </div>

      {/* ══ 0. ЗАЧЕМ ══ */}
      <section id="lc-why" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sparkles} label="Мотивация" title="Зачем это вообще нужно" />

        <div style={{ background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Спидометр и предел
          </div>
          <p style={{ margin: '0 0 10px', color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Вы едете на автомобиле и смотрите на спидометр. Стрелка плавно ползёт от 0 до 100 км/ч.
            В какую именно микросекунду скорость стала ровно 50?
            Вы не можете сказать — момент неуловим. Но вы знаете, что скорость <strong>стремится</strong> к 50,
            приближается к этому числу сколь угодно близко. Это и есть предел.
          </p>
          <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Теперь представьте сломанный спидометр: на 60 стрелка <strong>мгновенно перепрыгивает</strong> на 80.
            Это разрыв. С этих двух понятий — «к чему стремится?» и «где ломается?» — начинается весь матанализ.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { n: '→', title: 'Производная', d: 'Определяется как предел разностного отношения', color: T.primary },
            { n: '∫', title: 'Интеграл', d: 'Предел суммы бесконечно малых прямоугольников', color: T.green },
            { n: '∇', title: 'Градиентный спуск', d: 'Движение в сторону предела приращений функции ошибки', color: T.violet },
            { n: '∞', title: 'Сходимость', d: 'Последовательность ошибок имеет предел → 0', color: T.cyan },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontFamily: 'monospace' }}>{item.n}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>

        <Callout color={T.primary} title="Главная мысль">
          Если вы понимаете предел и непрерывность, весь остальной матанализ встаёт на свои места.
          Если нет — дальше будет стена. Эта тема — не просто раздел учебника. Это язык, на котором говорит весь современный ML.
        </Callout>
      </section>

      {/* ══ 1. ИНТУИЦИЯ ══ */}
      <section id="lc-intuition" style={{ marginBottom: 52 }}>
        <SectionHeader icon={BookOpen} label="Понятие 1" title="Интуитивное понятие предела" color={T.primary} />

        <Card style={{ borderLeft: `4px solid ${T.primary}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Метафора: пограничный переход</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.8 }}>
            Вы пересекаете границу между двумя странами. На карте граница — тонкая линия.
            В реальности есть нейтральная полоса: вы вышли из страны A, но ещё не вошли в B.
            Вы «стремитесь» к границе, но в саму линию никогда не упираетесь носом.
          </p>
          <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.8 }}>
            <strong>Предел функции</strong> — это то, что «ждёт вас на границе». Вы можете никогда не достичь
            точки <M tex="x = a" />, но можете подойти сколь угодно близко — и посмотреть,
            к какому значению <M tex="y" /> приближается функция. Если она приближается к числу <M tex="L" />, предел равен <M tex="L" />.
          </p>
        </Card>

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
          Пусть <M tex="f(x) = 2x" />. Что происходит при <M tex="x \to 3" />? Возьмём числа, приближающиеся к 3 с двух сторон:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <Card style={{ borderTop: `3px solid ${T.red}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.red, marginBottom: 10, textTransform: 'uppercase' }}>Слева (x &lt; 3)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  <th style={{ padding: '6px 10px', textAlign: 'center', color: T.muted, fontWeight: 700 }}>x</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center', color: T.muted, fontWeight: 700 }}>f(x) = 2x</th>
                </tr>
              </thead>
              <tbody>
                {[['2.9', '5.8'], ['2.99', '5.98'], ['2.999', '5.998'], ['2.9999', '5.9999']].map(([x, fx]) => (
                  <tr key={x} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 10px', textAlign: 'center', color: T.text }}>{x}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'center', color: T.red, fontWeight: 600 }}>{fx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card style={{ borderTop: `3px solid ${T.cyan}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.cyan, marginBottom: 10, textTransform: 'uppercase' }}>Справа (x &gt; 3)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  <th style={{ padding: '6px 10px', textAlign: 'center', color: T.muted, fontWeight: 700 }}>x</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center', color: T.muted, fontWeight: 700 }}>f(x) = 2x</th>
                </tr>
              </thead>
              <tbody>
                {[['3.1', '6.2'], ['3.01', '6.02'], ['3.001', '6.002'], ['3.0001', '6.0001']].map(([x, fx]) => (
                  <tr key={x} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 10px', textAlign: 'center', color: T.text }}>{x}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'center', color: T.cyan, fontWeight: 600 }}>{fx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <FBox
          tex="\lim_{x \to 3} 2x = 6"
          hint="Слева и справа f(x) стремится к 6 — предел существует и равен 6"
        />

        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 8 }}>Предел ≠ значение функции: пример с «дыркой»</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.8 }}>
            Рассмотрим <M tex="f(x) = \dfrac{x^2 - 1}{x - 1}" />.
            При <M tex="x = 1" /> знаменатель равен нулю — функция не определена.
            Но при <M tex="x \neq 1" />:
          </p>
          <F tex="\frac{x^2-1}{x-1} = \frac{(x-1)(x+1)}{x-1} = x+1" />
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.text, lineHeight: 1.8 }}>
            Упрощённая функция — прямая <M tex="y = x + 1" /> с «дыркой» в точке <M tex="x = 1" />.
            Предел при <M tex="x \to 1" /> равен 2, хотя <M tex="f(1)" /> не существует.
          </p>
        </Card>

        <IllustrationHole />

        <Callout color={T.green} title="Ключевое наблюдение">
          Предел описывает поведение функции <strong>рядом</strong> с точкой, а не в самой точке.
          Предел может существовать, даже если функция в точке не определена или определена «не там».
        </Callout>
      </section>

      {/* ══ 2. ε-δ ══ */}
      <section id="lc-epsdelta" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Определение" title="Формальное определение: ε-δ по Коши" color={T.violet} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Интуитивное «приближается сколь угодно близко» нужно сделать строгим. Коши и Вейерштрасс в XIX веке дали определение, которое стало фундаментом всего анализа.
        </p>

        <FBox
          tex="\lim_{x \to a} f(x) = L \quad \Longleftrightarrow \quad \forall\, \varepsilon > 0\;\; \exists\, \delta > 0\;\; \text{т.ч.}\;\; 0 < |x - a| < \delta \implies |f(x) - L| < \varepsilon"
          hint="«Для любой заданной точности ε найдётся радиус δ, внутри которого гарантировано попадание в ε-окрестность предела»"
          color={T.violet}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { sym: 'ε', color: T.primary, title: 'Допустимая ошибка по Y', body: 'Вы требуете: «хочу, чтобы f(x) отличалось от L не больше чем на ε». Это полоса шириной 2ε вокруг L на оси Y.' },
            { sym: 'δ', color: T.green, title: 'Радиус безопасности по X', body: 'Я отвечаю: «возьми x не дальше δ от a — и я гарантирую, что f(x) окажется в ε-полосе». Это интервал шириной 2δ вокруг a.' },
            { sym: '0<|x−a|', color: T.amber, title: 'Проколотая окрестность', body: 'x находится бесконечно близко к a, но не совпадает с ним. Именно поэтому не важно, что происходит в самой точке a.' },
            { sym: '∀ε∃δ', color: T.violet, title: 'Сколь угодно малое', body: 'Что бы вы ни потребовали — ε = 0.001 или ε = 10⁻¹⁰⁰ — всегда найдётся δ. Это и есть «сколь угодно близко».' },
          ].map(item => (
            <div key={item.sym} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.sym}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>

        <IllustrationEpsilonDelta />

        <Callout color={T.green} title="Почему это важно">
          Определение не требует «бесконечно малых величин» (которые философски спорны).
          Оно говорит на языке <strong>конечных чисел</strong>: «дайте мне любое положительное число, я найду другое».
          Это строго, проверяемо и кладёт конец спорам о природе бесконечности.
        </Callout>
      </section>

      {/* ══ 3. ОДНОСТОРОННИЕ ПРЕДЕЛЫ ══ */}
      <section id="lc-onesided" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Понятие 2" title="Односторонние пределы" color={T.red} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          До сих пор мы подходили к точке с двух сторон одновременно. Но функция может вести себя по-разному слева и справа.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <Card style={{ borderLeft: `4px solid ${T.red}` }}>
            <code style={{ fontSize: 18, fontWeight: 800, color: T.red, display: 'block', marginBottom: 8 }}>lim⁻</code>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Предел слева</div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
              <M tex="\lim_{x \to a^-} f(x)" /> — приближаемся к <M tex="a" /> со стороны меньших значений (<M tex="x < a" />).
              Знак «минус» сверху — напоминание, что мы левее.
            </div>
          </Card>
          <Card style={{ borderLeft: `4px solid ${T.cyan}` }}>
            <code style={{ fontSize: 18, fontWeight: 800, color: T.cyan, display: 'block', marginBottom: 8 }}>lim⁺</code>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Предел справа</div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
              <M tex="\lim_{x \to a^+} f(x)" /> — приближаемся со стороны больших значений (<M tex="x > a" />).
              Знак «плюс» — мы правее.
            </div>
          </Card>
        </div>

        <Card style={{ borderTop: `3px solid ${T.amber}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Главный факт</div>
          <FBox
            tex="\lim_{x \to a} f(x) \text{ существует} \iff \lim_{x \to a^-} f(x) = \lim_{x \to a^+} f(x)"
            hint="Двусторонний предел существует тогда и только тогда, когда оба односторонних конечны и равны между собой"
            color={T.amber}
          />
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: 0 }}>
            Если они разные — двустороннего предела нет. Именно это происходит в точках скачка.
          </p>
        </Card>

        <IllustrationOneSided />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 8 }}>Пример: сигнум (знак числа)</div>
          <F tex="\text{sgn}(x) = \frac{|x|}{x} \quad (x \neq 0)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: `${T.red}0a`, border: `1px solid ${T.red}30`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>При x &lt; 0: |x| = −x</div>
              <code style={{ fontSize: 14, fontWeight: 800, color: T.red }}>lim⁻ = −1</code>
            </div>
            <div style={{ background: `${T.cyan}0a`, border: `1px solid ${T.cyan}30`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>При x &gt; 0: |x| = x</div>
              <code style={{ fontSize: 14, fontWeight: 800, color: T.cyan }}>lim⁺ = +1</code>
            </div>
          </div>
          <div style={{ marginTop: 10, background: T.redLight, border: `1px solid ${T.red}40`, borderRadius: 10, padding: '8px 14px', fontSize: 13, color: T.red, fontWeight: 600, textAlign: 'center' }}>
            −1 ≠ +1 → двусторонний предел при x→0 не существует
          </div>
        </Card>
      </section>

      {/* ══ 4. БЕСКОНЕЧНЫЕ ПРЕДЕЛЫ ══ */}
      <section id="lc-infinite" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Понятие 3" title="Бесконечные пределы и пределы на бесконечности" color={T.violet} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Предел не всегда конечное число. Иногда функция уходит в бесконечность — или аргумент уходит в бесконечность.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <Card style={{ borderTop: `3px solid ${T.violet}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.violet, textTransform: 'uppercase', marginBottom: 8 }}>Бесконечный предел в точке</div>
            <F tex="\lim_{x \to 0} \frac{1}{x^2} = +\infty" />
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7, margin: '6px 0 0' }}>
              Значения становятся сколь угодно большими. Это не число — это описание поведения: функция неограниченно растёт. График имеет <strong>вертикальную асимптоту</strong> <M tex="x = 0" />.
            </p>
          </Card>
          <Card style={{ borderTop: `3px solid ${T.green}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Предел на бесконечности</div>
            <F tex="\lim_{x \to \infty} \frac{1}{x} = 0" />
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7, margin: '6px 0 0' }}>
              Чем больше x, тем ближе 1/x к нулю. График приближается к горизонтальной прямой y = 0 —
              это <strong>горизонтальная асимптота</strong>.
            </p>
          </Card>
        </div>

        <Card style={{ marginTop: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Как вычислять пределы рациональных функций при x → ∞</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 10 }}>
            Делим числитель и знаменатель на <strong>старшую степень x в знаменателе</strong>:
          </p>
          <F tex="\lim_{x \to \infty} \frac{3x^2 + 2x}{x^2 - 5} = \lim_{x \to \infty} \frac{3 + \tfrac{2}{x}}{1 - \tfrac{5}{x^2}} = \frac{3 + 0}{1 - 0} = 3" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 12 }}>
            {[
              { cond: 'deg(числ.) < deg(знам.)', result: 'предел = 0', color: T.green },
              { cond: 'deg(числ.) = deg(знам.)', result: 'предел = отношение старших коэфф.', color: T.primary },
              { cond: 'deg(числ.) > deg(знам.)', result: 'предел = ±∞', color: T.red },
            ].map(item => (
              <div key={item.cond} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.cond}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.result}</div>
              </div>
            ))}
          </div>
        </Card>

        <Callout color={T.amber} title="Важный нюанс: 1/x при x→0">
          Слева (x &lt; 0): 1/x → −∞. Справа (x &gt; 0): 1/x → +∞. Односторонние пределы разные по знаку
          → двусторонний предел <M tex="\lim_{x \to 0} 1/x" /> <strong>не существует</strong> даже в смысле бесконечности.
        </Callout>
      </section>

      {/* ══ 5. НЕПРЕРЫВНОСТЬ ══ */}
      <section id="lc-continuity" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Понятие 4" title="Непрерывность" color={T.green} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Непрерывность связывает предел и значение функции воедино.
          Интуитивно: функция непрерывна в точке a, если её график можно нарисовать в окрестности этой точки,
          <strong> не отрывая карандаша от бумаги</strong>.
        </p>

        <Card style={{ borderLeft: `4px solid ${T.green}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Три условия непрерывности в точке a</div>
          {[
            { n: '1', text: 'f(a) существует — функция определена в точке', color: T.primary },
            { n: '2', text: 'lim(x→a) f(x) существует — предел конечен', color: T.violet },
            { n: '3', text: 'lim(x→a) f(x) = f(a) — предел совпадает со значением', color: T.green },
          ].map(item => (
            <div key={item.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.n}</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{item.text}</div>
            </div>
          ))}
          <FBox
            tex="f \text{ непрерывна в } a \iff \lim_{x \to a} f(x) = f(a)"
            hint="Нарушение любого из трёх условий — точка разрыва"
            color={T.green}
          />
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Свойства непрерывных функций</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { icon: '+', title: 'Сумма и произведение', d: 'Непрерывны везде, где определены обе функции' },
              { icon: '/', title: 'Частное', d: 'Непрерывно везде, кроме точек где знаменатель = 0' },
              { icon: '∘', title: 'Композиция', d: 'f(g(x)) непрерывна, если g непрерывна в a, f — в g(a)' },
            ].map(item => (
              <div key={item.icon} style={{ background: T.surface, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: T.green, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Какие функции непрерывны?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
            {[
              { fn: 'Многочлены', where: 'Всюду', color: T.primary },
              { fn: 'sin x, cos x', where: 'Всюду', color: T.primary },
              { fn: 'eˣ', where: 'Всюду', color: T.primary },
              { fn: 'ln x', where: 'При x > 0', color: T.green },
              { fn: '√x', where: 'При x ≥ 0', color: T.green },
              { fn: 'tan x', where: 'Всюду, кроме π/2 + πk', color: T.amber },
            ].map(item => (
              <div key={item.fn} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.fn}</code>
                <span style={{ fontSize: 11, color: T.muted }}>{item.where}</span>
              </div>
            ))}
          </div>
        </Card>

        <DSNote>
          <strong>Непрерывность = дифференцируемость под условием.</strong> Если функция не непрерывна — она не дифференцируема. Но не наоборот: ReLU непрерывна, но не дифференцируема в нуле. Это важнейшее различие в ML.
        </DSNote>
      </section>

      {/* ══ 6. БОЛЬЦАНО-КОШИ ══ */}
      <section id="lc-bolzano" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Теорема" title="Теорема о промежуточном значении (Больцано–Коши)" color={T.green} />

        <Card style={{ borderLeft: `4px solid ${T.green}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Теорема</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.8 }}>
            Если <M tex="f" /> непрерывна на отрезке <M tex="[a, b]" />, то она принимает <strong>все значения</strong> между <M tex="f(a)" /> и <M tex="f(b)" />.
          </p>
          <FBox
            tex="f(a) \cdot f(b) < 0 \implies \exists\, c \in (a,b) : f(c) = 0"
            hint="Если f(a) и f(b) разных знаков — на отрезке гарантированно есть корень"
            color={T.green}
          />
        </Card>

        <IllustrationBolzano />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Следствие: метод бисекции</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
            Алгоритм нахождения корня на основе теоремы:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { n: '1', text: 'Берём отрезок [a, b] с f(a)·f(b) < 0', color: T.primary },
              { n: '2', text: 'Вычисляем середину c = (a+b)/2', color: T.violet },
              { n: '3', text: 'Выбираем половину, где f(a)·f(c) < 0 (или f(c)·f(b) < 0)', color: T.green },
              { n: '4', text: 'Повторяем — отрезок вдвое сужается каждый раз', color: T.cyan },
            ].map(item => (
              <div key={item.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.n}</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </Card>

        <DSNote>
          Метод бисекции — основа численного решения уравнений в ML-пайплайнах. Поиск оптимального threshold в бинарной классификации, нахождение корней функции ошибки — везде там работает именно эта идея.
        </DSNote>
      </section>

      {/* ══ 7. ТИПЫ РАЗРЫВОВ ══ */}
      <section id="lc-breaks" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Понятие 5" title="Точки разрыва и их классификация" color={T.red} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Если хотя бы одно из трёх условий непрерывности нарушено — в точке разрыв.
          Тип разрыва определяет, можно ли его «починить» и пригодна ли функция для оптимизации.
        </p>

        <IllustrationDiscontinuities />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <Card style={{ borderTop: `3px solid ${T.amber}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.amber, textTransform: 'uppercase', marginBottom: 8 }}>Разрыв первого рода</div>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
              Оба односторонних предела существуют и конечны. Два подтипа:
            </p>
            <div style={{ background: T.amberLight, borderRadius: 10, padding: '10px 14px', marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: T.amber }}>Скачок (неустранимый):</strong>{' '}
              lim⁻ ≠ lim⁺. Величина скачка = |lim⁺ − lim⁻|. Пример: ступенька Хевисайда.
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
              <strong style={{ color: T.primary }}>Устранимый:</strong>{' '}
              lim⁻ = lim⁺ = L, но f(a) ≠ L или не определена. Можно «залатать», доопределив f(a) = L.
            </div>
          </Card>

          <Card style={{ borderTop: `3px solid ${T.violet}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.violet, textTransform: 'uppercase', marginBottom: 8 }}>Разрыв второго рода</div>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
              Хотя бы один из односторонних пределов бесконечен или не существует.
            </p>
            <div style={{ background: `${T.violet}0f`, borderRadius: 10, padding: '10px 14px', marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: T.violet }}>Бесконечный:</strong>{' '}
              f(x) → ±∞. Пример: 1/x при x=0, tan x при x=π/2. Вертикальная асимптота.
            </div>
            <div style={{ background: `${T.pink}0f`, borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
              <strong style={{ color: T.pink }}>Осциллирующий:</strong>{' '}
              предела нет из-за бесконечных колебаний. Пример: sin(1/x) при x→0.
            </div>
          </Card>
        </div>

        <Card style={{ marginTop: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Детальные примеры</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 4 }}>Устранимый разрыв:</div>
              <F tex="f(x) = \frac{x^2-1}{x-1},\quad x = 1 \quad\Rightarrow\quad \lim = 2,\; f(1) \text{ не определена}" />
              <p style={{ fontSize: 13, color: T.muted, margin: '0 0 0 4px' }}>Доопределяем f(1) = 2 — разрыв исчезает. Функция sin(x)/x: f(0) = 1 → непрерывна.</p>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 4 }}>Скачок (пошаговая функция Хевисайда):</div>
              <F tex="H(x) = \begin{cases}0, & x < 0 \\ 1, & x \geq 0\end{cases} \quad\Rightarrow\quad \lim^- = 0,\; \lim^+ = 1" />
              <p style={{ fontSize: 13, color: T.muted, margin: '0 0 0 4px' }}>Производная = 0 везде → градиентный спуск не работает. Именно поэтому в нейросетях не используют Heaviside.</p>
            </div>
          </div>
        </Card>
      </section>

      {/* ══ 8. ЗАМЕЧАТЕЛЬНЫЕ ПРЕДЕЛЫ ══ */}
      <section id="lc-remarkable" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Brain} label="Два замечательных предела" title="Важнейшие пределы: знать наизусть" color={T.primary} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 20 }}>
          Два предела лежат в основе всего анализа. Они встречаются постоянно — в производных тригонометрических функций, в теории роста, в функциях активации.
        </p>

        {/* Первый */}
        <Card style={{ borderLeft: `4px solid ${T.primary}`, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Первый замечательный предел
          </div>
          <FBox tex="\lim_{x \to 0} \frac{\sin x}{x} = 1" hint="Синус ведёт себя как аргумент при малых значениях" />
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
            <strong>Геометрический смысл:</strong> при малых <M tex="x" /> синус почти равен своему аргументу: <M tex="\sin x \approx x" />.
            Это приближение используется в физике маятника, технике (малые колебания), численных методах (линеаризация).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { f: '\\lim_{x→0}\\,\\dfrac{\\sin kx}{x} = k', d: 'Масштабирование аргумента' },
              { f: '\\lim_{x→0}\\,\\dfrac{1-\\cos x}{x^2} = \\tfrac{1}{2}', d: 'Следствие через разложение' },
              { f: '\\lim_{x→0}\\,\\dfrac{\\tan x}{x} = 1', d: 'Аналогичное для тангенса' },
            ].map(item => (
              <div key={item.f} style={{ background: T.surface, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ marginBottom: 4 }}><F tex={item.f} /></div>
                <div style={{ fontSize: 11, color: T.muted, textAlign: 'center' }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>

        <IllustrationSinX />

        {/* Второй */}
        <Card style={{ borderLeft: `4px solid ${T.green}`, marginTop: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Второй замечательный предел
          </div>
          <FBox
            tex="\lim_{x \to \infty} \!\!\left(1 + \frac{1}{x}\right)^x = e \approx 2.71828"
            hint="Определение числа e — основания натурального логарифма"
            color={T.green}
          />
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
            <strong>Финансовая интерпретация:</strong> 100% годовых с капитализацией n раз в год дают <M tex="(1 + 1/n)^n" /> рублей на рубль.
            При <M tex="n = 1" />: 2 рубля. При <M tex="n = 12" />: ≈2.613. При непрерывной капитализации <M tex="n \to \infty" />: e рублей.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { f: '\\lim_{x→\\infty}\\left(1+\\dfrac{k}{x}\\right)^x = e^k', d: 'Общий случай' },
              { f: '\\lim_{x→0}\\,\\dfrac{\\ln(1+x)}{x} = 1', d: 'Логарифм ≈ аргумент при малых x' },
              { f: '\\lim_{x→0}\\,\\dfrac{e^x - 1}{x} = 1', d: 'Экспонента ≈ 1+x при малых x' },
            ].map(item => (
              <div key={item.f} style={{ background: T.surface, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ marginBottom: 4 }}><F tex={item.f} /></div>
                <div style={{ fontSize: 11, color: T.muted, textAlign: 'center' }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>

        <IllustrationSecondLimit />

        {/* Properties */}
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Алгебра пределов: шпаргалка</div>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>
            Если <M tex="\lim_{x→a} f(x) = L" /> и <M tex="\lim_{x→a} g(x) = M" /> (оба конечны):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {[
              { rule: 'Сумма/разность', f: '\\lim(f \\pm g) = L \\pm M' },
              { rule: 'Произведение', f: '\\lim(f \\cdot g) = L \\cdot M' },
              { rule: 'Частное', f: '\\lim\\tfrac{f}{g} = \\tfrac{L}{M},\\; M \\neq 0' },
              { rule: 'Степень', f: '\\lim(f^n) = L^n' },
            ].map(item => (
              <div key={item.rule} style={{ background: T.surface, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4 }}>{item.rule}</div>
                <div><F tex={item.f} /></div>
              </div>
            ))}
          </div>
          <Callout color={T.cyan} title="Теорема о двух милиционерах">
            Если <M tex="g(x) \leq f(x) \leq h(x)" /> и <M tex="\lim g = \lim h = L" />, то <M tex="\lim f = L" />.
            Два «милиционера» зажимают f и вынуждают её идти к L. Именно это используется при доказательстве первого замечательного предела.
          </Callout>
        </Card>
      </section>

      {/* ══ 9. МОСТИК: ПРОИЗВОДНАЯ ══ */}
      <section id="lc-derivative" style={{ marginBottom: 52 }}>
        <SectionHeader icon={ArrowRight} label="Мостик к производной" title="Предел → производная: как всё связано" color={T.amber} />

        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Предел — это не самоцель. Главное применение в анализе — определение производной.
        </p>

        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Определение производной</div>
          <FBox
            tex="f'(a) = \lim_{h \to 0} \frac{f(a+h) - f(a)}{h}"
            hint="Предел отношения приращений — мгновенная скорость изменения"
            color={T.amber}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: T.amber, marginBottom: 4 }}>Числитель: Δf</div>
              <div style={{ color: T.text, lineHeight: 1.7 }}>f(a+h) − f(a) — насколько изменилась функция за шаг h</div>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: T.amber, marginBottom: 4 }}>Знаменатель: Δx</div>
              <div style={{ color: T.text, lineHeight: 1.7 }}>h → 0, шаг стремится к нулю — мгновенная, а не средняя скорость</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 8 }}>Почему нужен предел</div>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8 }}>
            Подставить h = 0 нельзя — получится 0/0. Но можно устремить h → 0 и посмотреть, к чему стремится дробь.
            Именно это мы делали с сокращением (x−2) в примере с устранимым разрывом.
          </p>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, marginTop: 8 }}>
            Пример: <M tex="f(x) = x^2" />, <M tex="a = 1" />:
          </p>
          <F tex="\frac{(1+h)^2 - 1^2}{h} = \frac{2h + h^2}{h} = 2 + h \xrightarrow{h \to 0} 2 = f'(1)" />
        </Card>

        <IllustrationDerivative />

        <DSNote>
          В градиентном спуске веса нейросети обновляются на <M tex="-\eta \cdot \nabla L(W)" />.
          Градиент <M tex="\nabla L" /> — это вектор производных функции потерь. Производная — это предел.
          <strong> Без предела нет градиента, без градиента нет обучения нейросетей.</strong>
        </DSNote>
      </section>

      {/* ══ 10. DATA SCIENCE ══ */}
      <section id="lc-ds" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Code2} label="Применение" title="Пределы и непрерывность в Data Science" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            {
              title: 'Градиентный спуск',
              formula: 'W_{t+1} = W_t - \\eta\\,\\nabla L(W_t)',
              desc: 'Производная — это предел. Градиент = вектор производных функции потерь. Без непрерывности потерь градиент не определён и спуск невозможен.',
              tags: ['производная', 'предел', 'непрерывность'],
              color: T.primary,
            },
            {
              title: 'Сходимость алгоритмов',
              formula: '\\lim_{t\\to\\infty} \\varepsilon_t = 0',
              desc: 'Когда говорят «алгоритм сходится» — имеют в виду: последовательность ошибок ε₁, ε₂, … имеет предел 0. Везде итерации — везде пределы.',
              tags: ['предел', 'последовательность', 'ε → 0'],
              color: T.green,
            },
            {
              title: 'Функции активации',
              formula: '\\text{ReLU непрерывна} \\Rightarrow \\nabla \\text{ определён}',
              desc: 'ReLU непрерывна, но не дифференцируема в нуле (разрыв производной). Heaviside — разрыв первого рода, производная 0 → градиентный спуск невозможен.',
              tags: ['непрерывность', 'дифференцируемость', 'backprop'],
              color: T.amber,
            },
            {
              title: 'Big O: асимптотика',
              formula: 'f = O(g) \\iff \\limsup_{n\\to\\infty}\\frac{|f(n)|}{g(n)} < \\infty',
              desc: 'Нотация O(n²), O(n log n) описывает поведение алгоритма в пределе при n → ∞. Это буквально предел отношения времени работы к эталонной функции.',
              tags: ['предел', 'n → ∞', 'сложность'],
              color: T.violet,
            },
            {
              title: 'Теорема Цыбенко',
              formula: '\\forall f \\in C[a,b],\\; \\forall\\varepsilon > 0\\; \\exists N',
              desc: 'Нейросеть с одним скрытым слоем и непрерывной нелинейной активацией аппроксимирует любую непрерывную функцию на компакте. Ключевое условие — непрерывность.',
              tags: ['непрерывность', 'аппроксимация', 'нейросеть'],
              color: T.cyan,
            },
            {
              title: 'Нормализация данных',
              formula: '\\frac{1}{x + \\varepsilon} \\text{ вместо } \\frac{1}{x}',
              desc: 'Деление на 0 — устранимый или бесконечный разрыв. Добавление ε в знаменатель «залатывает» его. Batch Norm, Layer Norm — все делают именно это.',
              tags: ['устранимый разрыв', 'стабилизация', 'ε'],
              color: T.pink,
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
      <section id="lc-check" style={{ marginBottom: 52 }}>
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
                'Предел описывает поведение рядом с точкой, а не в ней. Значение функции и предел — разные вещи.',
                'ε-δ определение: ∀ε>0 ∃δ>0 : |x−a|<δ ⟹ |f(x)−L|<ε. Нет бесконечно малых — только конечные числа.',
                'Двусторонний предел = оба односторонних существуют и равны.',
                'Непрерывность: f(a) определена, lim существует, lim = f(a). Нарушение любого — разрыв.',
                'Устранимый разрыв → добавить/переопределить точку. Скачок → нельзя починить без изменения формулы.',
                'sin(x)/x → 1 и (1+1/n)ⁿ → e — два предела, из которых вырастает весь анализ.',
                'Производная = предел отношения приращений. Нет предела → нет производной → нет градиента.',
                'Heaviside: разрыв 1-го рода → производная 0 → градиентный спуск невозможен. Вот почему ReLU, не Heaviside.',
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
