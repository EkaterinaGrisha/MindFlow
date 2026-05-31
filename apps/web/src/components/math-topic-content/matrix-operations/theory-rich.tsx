// @ts-nocheck
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Grid3X3, Activity, Zap, Layers, Sigma,
  Box, ArrowRight, Brain, Code2, CheckCircle2, Sparkles,
  Play, Pause, RotateCcw,
} from 'lucide-react';
import { MarkdownRenderer } from '../../MarkdownRenderer';

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

// ─── Компоненты ───────────────────────────────────────────────────────────────

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
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, ...style }}>
      {children}
    </div>
  );
}

// Красивый блок формулы через KaTeX
function FormulaBlock({ tex, formula, hint }: { tex?: string; formula?: string; hint?: string }) {
  const expression = tex ?? formula ?? '';
  return (
    <div style={{ background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 14, padding: '18px 24px', margin: '22px 0', textAlign: 'center' }}>
      <MarkdownRenderer content={`$$${expression}$$`} />
      {hint && <div style={{ fontSize: 13, color: T.accent, marginTop: 8, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

function MatrixDisplay({ data, color = T.primary, highlight, cellSize = 48, label }: any) {
  const cols = data[0]?.length || 0;
  return (
    <div style={{ textAlign: 'center' }}>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6, fontFamily: 'monospace' }}>{label}</div>}
      <div style={{ display: 'inline-flex', alignItems: 'stretch' }}>
        <div style={{ width: 8, marginRight: 4, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, borderBottom: `2px solid ${color}`, borderRadius: '4px 0 0 4px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: 4, padding: '6px 0' }}>
          {data.map((row: any[], r: number) =>
            row.map((val: any, c: number) => {
              const hl = highlight?.[`${r},${c}`];
              return (
                <motion.div
                  key={`${r}-${c}`}
                  animate={{
                    background: hl ? hl : 'transparent',
                    color: hl ? T.white : T.text,
                    scale: hl ? 1.08 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: cellSize, height: cellSize,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace', fontSize: 17, fontWeight: 700,
                    borderRadius: 8,
                  }}
                >
                  {val}
                </motion.div>
              );
            })
          )}
        </div>
        <div style={{ width: 8, marginLeft: 4, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, borderBottom: `2px solid ${color}`, borderRadius: '0 4px 4px 0' }} />
      </div>
    </div>
  );
}

// ─── Video Fragment Component ─────────────────────────────────────────────────

function VideoFragment({ title, steps, autoInterval = 1600, accentColor = T.primary, children }: {
  title: string;
  steps: Array<{
    highlights: Record<string, string>;
    caption: string;
    formula?: string;
  }>;
  autoInterval?: number;
  accentColor?: string;
  children: (highlights: Record<string, string>) => React.ReactNode;
}) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setPlaying(false);
    setCurrentStep(-1);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const play = () => {
    setPlaying(true);
    setCurrentStep(0);
  };

  const pause = () => {
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          clearInterval(intervalRef.current!);
          return prev;
        }
        return prev + 1;
      });
    }, autoInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, steps.length, autoInterval]);

  const highlights = currentStep >= 0 ? steps[currentStep].highlights : {};
  const caption = currentStep >= 0 ? steps[currentStep].caption : null;
  const formula = currentStep >= 0 ? steps[currentStep].formula : null;
  const progress = currentStep >= 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', background: T.white }}>
      {/* Header bar */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, background: T.surface }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {[T.red, T.amber, T.green].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
        <span style={{ fontSize: 13, color: T.muted, fontWeight: 600, flex: 1 }}>{title}</span>
        <span style={{ fontSize: 12, color: T.mutedLight, fontFamily: 'monospace' }}>
          {currentStep >= 0 ? `${currentStep + 1} / ${steps.length}` : `0 / ${steps.length}`}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: T.border, position: 'relative' }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%', background: accentColor, borderRadius: 2 }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px' }}>
        {children(highlights)}
      </div>

      {/* Caption */}
      <div style={{ minHeight: 60, padding: '0 20px 6px', display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          {caption ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%' }}
            >
              <div style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30`, borderRadius: 12, padding: '10px 16px' }}>
                {formula && (
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: accentColor, marginBottom: 4 }}>
                    {formula}
                  </div>
                )}
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>{caption}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="idle" style={{ fontSize: 13, color: T.mutedLight }}>
              Нажмите Play, чтобы начать пошаговый разбор
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div style={{ padding: '12px 20px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        {!playing ? (
          <button
            onClick={play}
            disabled={currentStep >= steps.length - 1 && currentStep >= 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
              border: 'none', background: accentColor, color: T.white, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, opacity: currentStep >= steps.length - 1 && currentStep >= 0 ? 0.4 : 1,
            }}
          >
            <Play size={13} fill={T.white} /> Play
          </button>
        ) : (
          <button
            onClick={pause}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: accentColor, color: T.white, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
          >
            <Pause size={13} fill={T.white} /> Пауза
          </button>
        )}
        <button
          onClick={reset}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, color: T.muted, cursor: 'pointer', fontSize: 13 }}
        >
          <RotateCcw size={13} /> Сначала
        </button>
        {/* Step dots */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              onClick={() => { setPlaying(false); setCurrentStep(i); }}
              style={{
                width: 7, height: 7, borderRadius: '50%', cursor: 'pointer',
                background: i <= currentStep ? accentColor : T.border,
                transition: 'background 0.25s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Render-prop version for clean JSX ────────────────────────────────────────

function AnimVideo({ title, steps, accentColor = T.primary, autoInterval = 1700, children }: {
  title: string;
  steps: Array<{ highlights: Record<string, string>; caption: string; formula?: string }>;
  accentColor?: string;
  autoInterval?: number;
  children: (highlights: Record<string, string>) => React.ReactNode;
}) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<any>(null);

  const stop = () => { setPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); };

  const play = () => {
    setPlaying(true);
    if (currentStep >= steps.length - 1) setCurrentStep(0);
  };

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= steps.length) { stop(); return prev; }
        return next;
      });
    }, autoInterval);
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  // on play state start from 0
  useEffect(() => {
    if (playing && currentStep < 0) setCurrentStep(0);
  }, [playing]);

  const hl = currentStep >= 0 ? steps[currentStep].highlights : {};
  const caption = currentStep >= 0 ? steps[currentStep].caption : null;
  const formula = currentStep >= 0 ? steps[currentStep].formula : null;
  const progress = currentStep >= 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', background: T.white }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, background: T.surface }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ef4444','#f59e0b','#10b981'].map((c,i) => <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.65 }} />)}
        </div>
        <span style={{ fontSize: 12, color: T.muted, fontWeight: 600, flex: 1 }}>{title}</span>
        <span style={{ fontSize: 11, color: T.mutedLight, fontFamily: 'monospace' }}>
          {currentStep >= 0 ? `шаг ${currentStep + 1} из ${steps.length}` : `${steps.length} шагов`}
        </span>
      </div>

      <div style={{ height: 3, background: T.border }}>
        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }}
          style={{ height: '100%', background: accentColor }} />
      </div>

      <div style={{ padding: '24px 20px 16px' }}>
        {children(hl)}
      </div>

      <div style={{ minHeight: 68, padding: '0 18px 8px', display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          {caption ? (
            <motion.div key={currentStep}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }} style={{ width: '100%' }}>
              <div style={{ background: `${accentColor}0f`, border: `1px solid ${accentColor}25`, borderRadius: 12, padding: '10px 15px' }}>
                {formula && <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: accentColor, marginBottom: 3 }}>{formula}</div>}
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>{caption}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="idle" style={{ fontSize: 13, color: T.mutedLight }}>
              Нажмите Play для пошагового разбора
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ padding: '10px 18px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        {!playing ? (
          <button onClick={play}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 10, border: 'none', background: accentColor, color: T.white, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            <Play size={12} fill={T.white} /> Play
          </button>
        ) : (
          <button onClick={stop}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 10, border: 'none', background: accentColor, color: T.white, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            <Pause size={12} fill={T.white} /> Пауза
          </button>
        )}
        <button onClick={() => { stop(); setCurrentStep(-1); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, color: T.muted, cursor: 'pointer', fontSize: 13 }}>
          <RotateCcw size={12} /> Сначала
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => { stop(); setCurrentStep(i); }}
              style={{ width: 7, height: 7, borderRadius: '50%', cursor: 'pointer', background: i <= currentStep ? accentColor : T.border, transition: 'background 0.2s' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Матрица в SVG (статичная, для анатомии) ─────────────────────────────────

function MatrixSVG({ data, color = T.primary, highlight, cellW = 52, cellH = 48, label }: any) {
  const rows = data.length, cols = data[0].length;
  const pad = 12;
  const W = cols * cellW + pad * 2;
  const H = rows * cellH + pad * 2;
  return (
    <div style={{ textAlign: 'center' }}>
      {label && <div style={{ fontSize: 13, fontFamily: 'monospace', color: T.muted, marginBottom: 6 }}>{label}</div>}
      <svg width={W + 20} height={H + 8} style={{ overflow: 'visible' }}>
        <g transform="translate(10,4)">
          {/* Left bracket */}
          <path d={`M${pad},${0} L${2},${0} L${2},${H} L${pad},${H}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          {/* Right bracket */}
          <path d={`M${W - pad},${0} L${W - 2},${0} L${W - 2},${H} L${W - pad},${H}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          {/* Cells */}
          {data.map((row: any[], r: number) =>
            row.map((val: any, c: number) => {
              const x = pad + c * cellW + cellW / 2;
              const y = pad + r * cellH + cellH / 2;
              const hl = highlight?.[r]?.[c];
              return (
                <g key={`${r}-${c}`}>
                  {hl && <rect x={pad + c * cellW + 4} y={pad + r * cellH + 4} width={cellW - 8} height={cellH - 8} rx={8} fill={hl} />}
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, fill: hl ? T.white : T.text }}>
                    {val}
                  </text>
                </g>
              );
            })
          )}
        </g>
      </svg>
    </div>
  );
}

function AnatomyAnimation() {
  const matrix = [[1, 2, 3], [4, 5, 6]];
  const [hovered, setHovered] = useState<string | null>(null);

  const annotations = [
    { key: 'rows', label: 'Строки (m = 2)', desc: 'Горизонтальные срезы. В задачах машинного обучения — наблюдения или объекты.' },
    { key: 'cols', label: 'Столбцы (n = 3)', desc: 'Вертикальные срезы. В задачах машинного обучения — признаки или атрибуты.' },
    { key: 'elem', label: 'Элемент a₁₂ = 2', desc: 'Элемент на пересечении строки 1 и столбца 2. Нумерация начинается с 1.' },
    { key: 'size', label: 'Размер 2×3', desc: 'Читается «m на n». Здесь: 2 строки и 3 столбца.' },
  ];

  const hl: Record<string,string> = {};
  if (hovered === 'elem') { hl['0,1'] = T.primary; }
  else if (hovered === 'rows') { hl['0,0'] = T.primary; hl['0,1'] = T.primary; hl['0,2'] = T.primary; }
  else if (hovered === 'cols') { hl['0,0'] = T.accent; hl['1,0'] = T.accent; }

  return (
    <Card>
      <div style={{ fontWeight: 700, color: T.text, marginBottom: 16, fontSize: 14 }}>Структура матрицы</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
        <div>
          <MatrixDisplay data={matrix} color={T.primary} highlight={hl} cellSize={52} />
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: T.muted, fontFamily: 'monospace' }}>A ∈ ℝ²ˣ³</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {annotations.map(a => (
            <div key={a.key}
              onMouseEnter={() => setHovered(a.key)} onMouseLeave={() => setHovered(null)}
              style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 8, cursor: 'default', background: hovered === a.key ? T.primaryLight : T.surface, border: `1px solid ${hovered === a.key ? T.primaryBorder : T.border}`, transition: 'all 0.2s' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.primary, marginBottom: 2 }}>{a.label}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Addition Video ────────────────────────────────────────────────────────────

function AdditionVideo() {
  const A = [[5, -1], [0, 4]];
  const B = [[2, 3], [-2, 1]];
  const C = [[7, 2], [-2, 5]];

  const steps = [
    { highlights: { 'a:0,0': T.primary, 'b:0,0': T.accent, 'c:0,0': T.green }, formula: 'c₁₁ = a₁₁ + b₁₁', caption: '5 + 2 = 7 — суммируем элементы на позиции (1,1).' },
    { highlights: { 'a:0,1': T.primary, 'b:0,1': T.accent, 'c:0,1': T.green }, formula: 'c₁₂ = a₁₂ + b₁₂', caption: '−1 + 3 = 2 — позиция (1,2).' },
    { highlights: { 'a:1,0': T.primary, 'b:1,0': T.accent, 'c:1,0': T.green }, formula: 'c₂₁ = a₂₁ + b₂₁', caption: '0 + (−2) = −2 — позиция (2,1).' },
    { highlights: { 'a:1,1': T.primary, 'b:1,1': T.accent, 'c:1,1': T.green }, formula: 'c₂₂ = a₂₂ + b₂₂', caption: '4 + 1 = 5 — позиция (2,2). Матрица C вычислена полностью.' },
  ];

  return (
    <AnimVideo title="Сложение матриц — пошаговый разбор" steps={steps} accentColor={T.primary} autoInterval={1800}>
      {(hl) => {
        const aHl: Record<string,string> = {};
        const bHl: Record<string,string> = {};
        const cHl: Record<string,string> = {};
        Object.entries(hl).forEach(([k,v]) => {
          const [prefix, pos] = k.split(':');
          if (prefix === 'a') aHl[pos] = v;
          if (prefix === 'b') bHl[pos] = v;
          if (prefix === 'c') cHl[pos] = v;
        });
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <MatrixDisplay data={A} color={T.primary} highlight={aHl} cellSize={52} label="A" />
            <div style={{ fontSize: 28, color: T.muted, fontWeight: 300, lineHeight: 1 }}>+</div>
            <MatrixDisplay data={B} color={T.accent} highlight={bHl} cellSize={52} label="B" />
            <div style={{ fontSize: 28, color: T.muted, fontWeight: 300, lineHeight: 1 }}>=</div>
            <MatrixDisplay data={C} color={T.green} highlight={cHl} cellSize={52} label="A + B" />
          </div>
        );
      }}
    </AnimVideo>
  );
}

// ─── Scalar Video ─────────────────────────────────────────────────────────────

function ScalarVideo() {
  const A = [[2, -3], [0, 5]];
  const R = [[8, -12], [0, 20]];
  const lambda = 4;

  const steps = [
    { highlights: { 'a:0,0': T.accent, 'r:0,0': T.green }, formula: 'b₁₁ = λ · a₁₁', caption: `4 · 2 = 8` },
    { highlights: { 'a:0,1': T.accent, 'r:0,1': T.green }, formula: 'b₁₂ = λ · a₁₂', caption: `4 · (−3) = −12` },
    { highlights: { 'a:1,0': T.accent, 'r:1,0': T.green }, formula: 'b₂₁ = λ · a₂₁', caption: `4 · 0 = 0` },
    { highlights: { 'a:1,1': T.accent, 'r:1,1': T.green }, formula: 'b₂₂ = λ · a₂₂', caption: `4 · 5 = 20 — каждый элемент матрицы умножен на скаляр λ = 4.` },
  ];

  return (
    <AnimVideo title="Умножение на скаляр — пошаговый разбор" steps={steps} accentColor={T.accent} autoInterval={1700}>
      {(hl) => {
        const aHl: Record<string,string> = {};
        const rHl: Record<string,string> = {};
        Object.entries(hl).forEach(([k,v]) => {
          const [p, pos] = k.split(':');
          if (p === 'a') aHl[pos] = v;
          if (p === 'r') rHl[pos] = v;
        });
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: `${T.accent}14`, borderRadius: 12, fontFamily: 'monospace', fontSize: 24, fontWeight: 800, color: T.accent }}>{lambda}</div>
            <div style={{ fontSize: 26, color: T.muted }}>×</div>
            <MatrixDisplay data={A} color={T.accent} highlight={aHl} cellSize={52} label="A" />
            <div style={{ fontSize: 26, color: T.muted }}>=</div>
            <MatrixDisplay data={R} color={T.green} highlight={rHl} cellSize={52} label="λA" />
          </div>
        );
      }}
    </AnimVideo>
  );
}

// ─── Transpose Video ──────────────────────────────────────────────────────────

function TransposeVideo() {
  const A = [[1, 2, 3], [4, 5, 6]];
  const AT = [[1, 4], [2, 5], [3, 6]];

  const steps = [
    { highlights: { 'a:0,0': T.primary, 't:0,0': T.green }, formula: '(Aᵀ)₁₁ = a₁₁', caption: 'Элемент a₁₁ = 1 остаётся на главной диагонали.' },
    { highlights: { 'a:0,1': T.primary, 't:1,0': T.green }, formula: '(Aᵀ)₂₁ = a₁₂', caption: 'a₁₂ = 2 перемещается на позицию (2,1) — строка и столбец меняются местами.' },
    { highlights: { 'a:0,2': T.primary, 't:2,0': T.green }, formula: '(Aᵀ)₃₁ = a₁₃', caption: 'a₁₃ = 3 → позиция (3,1).' },
    { highlights: { 'a:1,0': T.primary, 't:0,1': T.green }, formula: '(Aᵀ)₁₂ = a₂₁', caption: 'a₂₁ = 4 → позиция (1,2).' },
    { highlights: { 'a:1,1': T.primary, 't:1,1': T.green }, formula: '(Aᵀ)₂₂ = a₂₂', caption: 'a₂₂ = 5 остаётся на диагонали.' },
    { highlights: { 'a:1,2': T.primary, 't:2,1': T.green }, formula: '(Aᵀ)₃₂ = a₂₃', caption: 'a₂₃ = 6 → позиция (3,2). Матрица 2×3 транспонирована в матрицу 3×2.' },
  ];

  return (
    <AnimVideo title="Транспонирование — пошаговый разбор" steps={steps} accentColor={'#0ea5e9'} autoInterval={1900}>
      {(hl) => {
        const aHl: Record<string,string> = {};
        const tHl: Record<string,string> = {};
        Object.entries(hl).forEach(([k,v]) => {
          const [p, pos] = k.split(':');
          if (p === 'a') aHl[pos] = v;
          if (p === 't') tHl[pos] = v;
        });
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
            <div>
              <MatrixDisplay data={A} color={T.primary} highlight={aHl} cellSize={48} label="A  (2×3)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 16, color: '#0ea5e9', fontWeight: 700 }}>→ᵀ</div>
              <div style={{ fontSize: 11, color: T.muted }}>строки → столбцы</div>
            </div>
            <div>
              <MatrixDisplay data={AT} color={'#0ea5e9'} highlight={tHl} cellSize={48} label="Aᵀ  (3×2)" />
            </div>
          </div>
        );
      }}
    </AnimVideo>
  );
}

// ─── Multiply Video ───────────────────────────────────────────────────────────

function MultiplyVideo() {
  const A = [[1, 2, 3], [4, 5, 6]];
  const B = [[7, 8], [9, 10], [11, 12]];
  const C = [[58, 64], [139, 154]];

  const computeExpl = (r: number, c: number) =>
    A[r].map((v, k) => `${v}·${B[k][c]}`).join(' + ') + ` = ${C[r][c]}`;

  const steps = [
    {
      highlights: { 'ar:0': T.primary, 'bc:0': T.accent, 'c:0,0': T.green },
      formula: 'c₁₁ = Σ a₁ₖ · bₖ₁',
      caption: `Строка 1 из A × столбец 1 из B: ${computeExpl(0, 0)}`,
    },
    {
      highlights: { 'ar:0': T.primary, 'bc:1': T.accent, 'c:0,1': T.green },
      formula: 'c₁₂ = Σ a₁ₖ · bₖ₂',
      caption: `Строка 1 из A × столбец 2 из B: ${computeExpl(0, 1)}`,
    },
    {
      highlights: { 'ar:1': T.primary, 'bc:0': T.accent, 'c:1,0': T.green },
      formula: 'c₂₁ = Σ a₂ₖ · bₖ₁',
      caption: `Строка 2 из A × столбец 1 из B: ${computeExpl(1, 0)}`,
    },
    {
      highlights: { 'ar:1': T.primary, 'bc:1': T.accent, 'c:1,1': T.green },
      formula: 'c₂₂ = Σ a₂ₖ · bₖ₂',
      caption: `Строка 2 из A × столбец 2 из B: ${computeExpl(1, 1)}`,
    },
  ];

  return (
    <AnimVideo title="Матричное умножение — пошаговый разбор" steps={steps} accentColor={T.amber} autoInterval={2200}>
      {(hl) => {
        const aRowHL: Record<string, Record<string,string>> = {};
        const bColHL: Record<string, Record<string,string>> = {};
        const cHl: Record<string,string> = {};

        Object.entries(hl).forEach(([k, v]) => {
          if (k.startsWith('ar:')) {
            const r = parseInt(k.split(':')[1]);
            aRowHL[r] = {};
            [0,1,2].forEach(c => { aRowHL[r][`${r},${c}`] = v; });
          }
          if (k.startsWith('bc:')) {
            const col = parseInt(k.split(':')[1]);
            bColHL[col] = {};
            [0,1,2].forEach(r => { bColHL[col][`${r},${col}`] = v; });
          }
          if (k.startsWith('c:')) cHl[k.slice(2)] = v;
        });

        const aFinal: Record<string,string> = {};
        Object.values(aRowHL).forEach(obj => Object.assign(aFinal, obj));
        const bFinal: Record<string,string> = {};
        Object.values(bColHL).forEach(obj => Object.assign(bFinal, obj));

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <MatrixDisplay data={A} color={T.primary} highlight={aFinal} cellSize={44} label="A  (2×3)" />
            <div style={{ fontSize: 24, color: T.muted }}>×</div>
            <MatrixDisplay data={B} color={T.accent} highlight={bFinal} cellSize={44} label="B  (3×2)" />
            <div style={{ fontSize: 24, color: T.muted }}>=</div>
            <MatrixDisplay data={C} color={T.green} highlight={cHl} cellSize={48} label="C  (2×2)" />
          </div>
        );
      }}
    </AnimVideo>
  );
}

// ─── Trace Video ──────────────────────────────────────────────────────────────

function TraceVideo() {
  const A = [[3, -1, 4], [0, 2, 7], [1, 5, -2]];

  const steps = [
    { highlights: { '0,0': '#8b5cf6' }, formula: 'tr(A) начинается с a₁₁', caption: 'Элемент a₁₁ = 3 — первый диагональный элемент.' },
    { highlights: { '0,0': '#8b5cf640', '1,1': '#8b5cf6' }, formula: '+ a₂₂', caption: 'a₂₂ = 2 — следующий элемент главной диагонали.' },
    { highlights: { '0,0': '#8b5cf640', '1,1': '#8b5cf640', '2,2': '#8b5cf6' }, formula: '+ a₃₃', caption: 'a₃₃ = −2 — последний диагональный элемент. tr(A) = 3 + 2 + (−2) = 3.' },
  ];

  return (
    <AnimVideo title="След матрицы — пошаговый разбор" steps={steps} accentColor={'#8b5cf6'} autoInterval={2000}>
      {(hl) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
          <MatrixDisplay data={A} color={'#8b5cf6'} highlight={hl} cellSize={52} label="A (3×3)" />
          <div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>Главная диагональ:</div>
            {[['a₁₁ = 3', '#8b5cf6'], ['a₂₂ = 2', '#8b5cf6'], ['a₃₃ = −2', '#8b5cf6']].map(([txt, col], i) => (
              <motion.div key={i}
                animate={{ opacity: i < (Object.keys(hl).length || 0) + 1 ? 1 : 0.2 }}
                style={{ fontFamily: 'monospace', fontSize: 15, color: col as string, fontWeight: 700, lineHeight: 2 }}>
                {txt}
              </motion.div>
            ))}
            <motion.div
              animate={{ opacity: Object.keys(hl).length >= 3 ? 1 : 0 }}
              style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 17, fontWeight: 800, color: '#8b5cf6', borderTop: `2px solid #8b5cf630`, paddingTop: 6 }}>
              tr(A) = 3
            </motion.div>
          </div>
        </div>
      )}
    </AnimVideo>
  );
}

// ─── Norm Video ───────────────────────────────────────────────────────────────

function NormVideo() {
  const A = [[1, 2], [3, 4]];
  const squares = [[1, 4], [9, 16]];

  const steps = [
    { highlights: { 'a:0,0': '#06b6d4', 's:0,0': T.green }, formula: '|a₁₁|² = 1² = 1', caption: 'Берём элемент a₁₁ = 1 и возводим в квадрат.' },
    { highlights: { 'a:0,1': '#06b6d4', 's:0,1': T.green }, formula: '|a₁₂|² = 2² = 4', caption: 'Элемент a₁₂ = 2: квадрат равен 4.' },
    { highlights: { 'a:1,0': '#06b6d4', 's:1,0': T.green }, formula: '|a₂₁|² = 3² = 9', caption: 'Элемент a₂₁ = 3: квадрат равен 9.' },
    { highlights: { 'a:1,1': '#06b6d4', 's:1,1': T.green }, formula: '|a₂₂|² = 4² = 16', caption: 'Элемент a₂₂ = 4: квадрат равен 16. Сумма всех квадратов: 1 + 4 + 9 + 16 = 30. ‖A‖_F = √30 ≈ 5.48.' },
  ];

  return (
    <AnimVideo title="Норма Фробениуса — пошаговый разбор" steps={steps} accentColor={'#06b6d4'} autoInterval={1900}>
      {(hl) => {
        const aHl: Record<string,string> = {};
        const sHl: Record<string,string> = {};
        Object.entries(hl).forEach(([k,v]) => {
          const [p, pos] = k.split(':');
          if (p === 'a') aHl[pos] = v;
          if (p === 's') sHl[pos] = v;
        });
        const total = Object.keys(sHl).length;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
            <MatrixDisplay data={A} color={'#06b6d4'} highlight={aHl} cellSize={52} label="A" />
            <div style={{ fontSize: 20, color: T.muted }}>→</div>
            <MatrixDisplay data={squares} color={T.green} highlight={sHl} cellSize={52} label="aᵢⱼ²" />
            <div style={{ minWidth: 120 }}>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Сумма квадратов:</div>
              <motion.div animate={{ opacity: total > 0 ? 1 : 0.2 }}
                style={{ fontFamily: 'monospace', fontSize: 15, color: '#06b6d4', fontWeight: 700, lineHeight: 2.2 }}>
                {total >= 1 && '1'}{total >= 2 && ' + 4'}{total >= 3 && ' + 9'}{total >= 4 && ' + 16'}
              </motion.div>
              <motion.div animate={{ opacity: total >= 4 ? 1 : 0 }}
                style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 800, color: '#06b6d4' }}>
                √30 ≈ 5.48
              </motion.div>
            </div>
          </div>
        );
      }}
    </AnimVideo>
  );
}

// ─── Inverse Video ────────────────────────────────────────────────────────────

function InverseVideo() {
  const A = [[2, 1], [5, 3]];
  const Ainv = [[3, -1], [-5, 2]];
  const I = [[1, 0], [0, 1]];

  const steps = [
    { highlights: { 'step': '1' }, formula: 'det(A) = ad − bc', caption: 'Вычисляем определитель: 2·3 − 1·5 = 6 − 5 = 1 ≠ 0. Обратная матрица существует.' },
    { highlights: { 'step': '2' }, formula: 'A⁻¹ = (1/det) · [[d,−b],[−c,a]]', caption: 'Применяем формулу для матрицы 2×2: меняем местами a₁₁ и a₂₂, меняем знаки a₁₂ и a₂₁, делим на определитель.' },
    { highlights: { 'step': '3', 'r:0,0': T.green, 'r:0,1': T.green, 'r:1,0': T.green, 'r:1,1': T.green }, formula: 'A · A⁻¹ = I', caption: 'Проверка: произведение A · A⁻¹ равно единичной матрице I.' },
  ];

  const [curStep, setCurStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<any>(null);

  const stop = () => { setPlaying(false); clearInterval(ref.current); };
  const play = () => { setPlaying(true); };

  useEffect(() => {
    if (!playing) return;
    if (curStep < 0) setCurStep(0);
    ref.current = setInterval(() => {
      setCurStep(prev => {
        if (prev >= 2) { stop(); return prev; }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(ref.current);
  }, [playing]);

  const showInv = curStep >= 1;
  const showI = curStep >= 2;
  const caption = curStep >= 0 ? steps[curStep].caption : null;
  const formula = curStep >= 0 ? steps[curStep].formula : null;

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', background: T.white }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, background: T.surface }}>
        <div style={{ display: 'flex', gap: 5 }}>{['#ef4444','#f59e0b','#10b981'].map((c,i) => <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.65 }} />)}</div>
        <span style={{ fontSize: 12, color: T.muted, fontWeight: 600, flex: 1 }}>Обратная матрица — пошаговый разбор</span>
        <span style={{ fontSize: 11, color: T.mutedLight, fontFamily: 'monospace' }}>{curStep >= 0 ? `шаг ${curStep + 1} из 3` : '3 шага'}</span>
      </div>
      <div style={{ height: 3, background: T.border }}>
        <motion.div animate={{ width: curStep >= 0 ? `${((curStep + 1) / 3) * 100}%` : '0%' }} transition={{ duration: 0.35 }}
          style={{ height: '100%', background: '#ec4899' }} />
      </div>
      <div style={{ padding: '24px 20px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
        <MatrixDisplay data={A} color={'#ec4899'} cellSize={52} label="A" />
        <div style={{ fontSize: 22, color: T.muted }}>×</div>
        <motion.div animate={{ opacity: showInv ? 1 : 0.2 }} transition={{ duration: 0.4 }}>
          <MatrixDisplay data={Ainv} color={T.accent} cellSize={52} label="A⁻¹" />
        </motion.div>
        <div style={{ fontSize: 22, color: T.muted }}>=</div>
        <motion.div animate={{ opacity: showI ? 1 : 0.15 }} transition={{ duration: 0.4 }}>
          <MatrixDisplay data={I} color={T.green} highlight={showI ? {'0,0':T.green,'1,1':T.green} : {}} cellSize={52} label="I" />
        </motion.div>
      </div>
      <div style={{ minHeight: 68, padding: '0 18px 8px' }}>
        <AnimatePresence mode="wait">
          {caption ? (
            <motion.div key={curStep} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              <div style={{ background: '#ec489910', border: '1px solid #ec489930', borderRadius: 12, padding: '10px 15px' }}>
                {formula && <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#ec4899', marginBottom: 3 }}>{formula}</div>}
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>{caption}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="idle" style={{ fontSize: 13, color: T.mutedLight, padding: '10px 0' }}>Нажмите Play для пошагового разбора</motion.div>
          )}
        </AnimatePresence>
      </div>
      <div style={{ padding: '10px 18px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        {!playing ? (
          <button onClick={play} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 10, border: 'none', background: '#ec4899', color: T.white, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            <Play size={12} fill={T.white} /> Play
          </button>
        ) : (
          <button onClick={stop} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 10, border: 'none', background: '#ec4899', color: T.white, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            <Pause size={12} fill={T.white} /> Пауза
          </button>
        )}
        <button onClick={() => { stop(); setCurStep(-1); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, color: T.muted, cursor: 'pointer', fontSize: 13 }}>
          <RotateCcw size={12} /> Сначала
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          {[0,1,2].map(i => <div key={i} onClick={() => { stop(); setCurStep(i); }} style={{ width: 7, height: 7, borderRadius: '50%', cursor: 'pointer', background: i <= curStep ? '#ec4899' : T.border, transition: 'background 0.2s' }} />)}
        </div>
      </div>
    </div>
  );
}

function M({ tex }: { tex?: string }) {
  if (!tex) return null;
  return <span style={{ display: 'inline' }}><MarkdownRenderer content={`$${tex}$`} /></span>;
}

function DSNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: `${T.cyan}0f`, border: `1px solid ${T.cyan}33`, borderRadius: 12, padding: '12px 16px', margin: '16px 0', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
      <span style={{ fontWeight: 700, color: T.cyan }}>В Data Science: </span>{children}
    </div>
  );
}

// ─── Check Questions ──────────────────────────────────────────────────────────

function CheckQuestions() {
  const questions = [
    {
      q: 'Можно ли сложить матрицу 3×4 и матрицу 4×3?',
      options: ['Да, получится матрица 3×3', 'Да, получится матрица 3×4', 'Нет — у них разные размеры', 'Да, если транспонировать одну из них'],
      correct: 2,
      explanation: 'Сложение определено только для матриц одинакового размера. 3×4 ≠ 4×3.',
    },
    {
      q: 'Матрица A имеет размер 2×3, матрица B — 3×5. Чему равен размер произведения AB?',
      options: ['3×3', '2×5', '5×2', 'Умножение невозможно'],
      correct: 1,
      explanation: 'A(2×3) × B(3×5) = C(2×5). Внутренние размеры совпадают (3 = 3), результат определяется внешними: 2×5.',
    },
    {
      q: 'Верно ли, что tr(AB) = tr(BA) для квадратных матриц?',
      options: ['Нет, поскольку AB ≠ BA', 'Да, след инвариантен к циклической перестановке', 'Только если A = B', 'Зависит от размера матриц'],
      correct: 1,
      explanation: 'tr(AB) = tr(BA) — фундаментальное свойство следа. Несмотря на то что AB ≠ BA, их следы всегда равны.',
    },
  ];

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {questions.map((q, qi) => {
        const answered = answers[qi] !== undefined;
        const correct = answers[qi] === q.correct;
        const isRevealed = revealed[qi];
        const isDone = answered || isRevealed;
        return (
          <Card key={qi}>
            <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.amber, fontFamily: 'monospace', marginRight: 8 }}>Q{qi + 1}</span>{q.q}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
              {q.options.map((opt, oi) => {
                let bg = T.surface, border = T.border, color = T.text;
                if (isDone) {
                  if (oi === q.correct) { bg = T.greenLight; border = T.green; color = '#065f46'; }
                  else if (oi === answers[qi] && !correct) { bg = T.redLight; border = T.red; color = '#7f1d1d'; }
                }
                return (
                  <button key={oi} onClick={() => !answered && !isRevealed && setAnswers(prev => ({ ...prev, [qi]: oi }))}
                    style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${border}`, background: bg, color, textAlign: 'left', cursor: answered || isRevealed ? 'default' : 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}>
                    {String.fromCharCode(65 + oi)}) {opt}
                  </button>
                );
              })}
            </div>
            {isDone && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: (correct || isRevealed) ? T.greenLight : T.redLight, border: `1px solid ${(correct || isRevealed) ? T.green : T.red}44`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: (correct || isRevealed) ? '#065f46' : '#7f1d1d' }}>
                {!isRevealed && (correct ? '✓ Верно! ' : '✗ Неверно. ')}{q.explanation}
              </motion.div>
            )}
            {!answered && !isRevealed && (
              <button onClick={() => setRevealed(p => ({ ...p, [qi]: true }))}
                style={{ marginTop: 4, padding: '5px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, color: T.muted, cursor: 'pointer', fontSize: 12 }}>
                Показать ответ
              </button>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MatrixOperationsTheoryRich() {
  const navSections = [
    { id: 'basics', label: 'Что такое матрица' },
    { id: 'add', label: 'Сложение' },
    { id: 'scalar', label: 'Скаляр' },
    { id: 'transpose', label: 'Транспонирование' },
    { id: 'multiply', label: 'Умножение' },
    { id: 'trace', label: 'След' },
    { id: 'norm', label: 'Норма' },
    { id: 'inverse', label: 'Обратная' },
    { id: 'ds', label: 'В Data Science' },
    { id: 'check', label: 'Проверь себя' },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>

      {/* Заголовок */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Grid3X3 size={15} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: T.primary, textTransform: 'uppercase' }}>Линейная алгебра</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, color: T.muted }}>около 20 минут</span>
        </div>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>Операции с матрицами</h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16 }}>Определения, свойства и пошаговые разборы от сложения до обратной матрицы.</p>
      </div>

      {/* Навигация */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 48 }}>
        {navSections.map(s => (
          <a key={s.id} href={`#${s.id}`} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${T.primary}0f`, color: T.primary, border: `1px solid ${T.primaryBorder}`, textDecoration: 'none' }}>
            {s.label}
          </a>
        ))}
      </div>

      {/* ── 1. Основные понятия ── */}
      <section id="basics" style={{ marginBottom: 52 }}>
        <SectionHeader icon={BookOpen} label="С нуля" title="Определение и структура матрицы" />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          <strong>Матрица</strong> — прямоугольная таблица чисел, организованная в строки и столбцы. Строки нумеруются сверху вниз, столбцы — слева направо. Элемент a<sub>ij</sub> стоит на пересечении строки <em>i</em> и столбца <em>j</em>.
        </p>

        <FormulaBlock formula="A = [aᵢⱼ],   i = 1..m (строки),   j = 1..n (столбцы)" hint="aᵢⱼ — элемент в i-й строке и j-м столбце." />

        <AnatomyAnimation />

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 10 }}>
          {[
            { name: 'Квадратная', desc: 'm = n', note: 'Число строк равно числу столбцов' },
            { name: 'Вектор-столбец', desc: 'm×1', note: 'Матрица с одним столбцом' },
            { name: 'Вектор-строка', desc: '1×n', note: 'Матрица с одной строкой' },
            { name: 'Единичная E', desc: 'Eₙ', note: 'Диагональ из единиц, остальные элементы — нули' },
          ].map(t => (
            <div key={t.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{t.name}</div>
              <code style={{ fontSize: 12, color: T.primary, display: 'block', marginBottom: 4 }}>{t.desc}</code>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{t.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Сложение ── */}
      <section id="add" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Операция 1" title="Сложение и вычитание" color={T.green} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
          Сложение и вычитание матриц выполняются <strong>поэлементно</strong>: берётся элемент на позиции (i, j) первой матрицы и складывается (вычитается) с элементом на той же позиции второй. Единственное условие — обе матрицы должны быть одного размера m×n.
        </p>

        <FormulaBlock
          formula="(A + B)ᵢⱼ = aᵢⱼ + bᵢⱼ"
          hint="Операция определена только для матриц одинаковой размерности."
        />

        <AdditionVideo />

        <div style={{ marginTop: 14, background: `${T.amber}14`, border: `1px solid ${T.amber}44`, borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 14, color: T.text }}>
            <strong>Ограничение:</strong> матрицы различного размера складывать или вычитать нельзя — для части элементов не существует пары на соответствующей позиции.
          </div>
        </div>

        <Card style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Основные свойства</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
            {[
              { f: 'A + B = B + A', n: 'Коммутативность', d: 'Порядок слагаемых не влияет на результат' },
              { f: '(A+B)+C = A+(B+C)', n: 'Ассоциативность', d: 'Расстановка скобок произвольна' },
              { f: 'A + O = A', n: 'Нулевая матрица', d: 'O — матрица из нулей того же размера' },
              { f: 'A − B = A + (−B)', n: 'Вычитание', d: '−B: все элементы взяты с обратным знаком' },
            ].map(item => (
              <div key={item.n} style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ marginBottom: 6 }}><M tex={item.f} /></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>{item.n}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── 3. Скаляр ── */}
      <section id="scalar" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Операция 2" title="Умножение на скаляр" color={T.accent} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
          Скаляр — это число. При умножении матрицы на скаляр λ каждый элемент матрицы умножается на λ. Никаких ограничений на размер матрицы нет.
        </p>

        <FormulaBlock
          formula="(λA)ᵢⱼ = λ · aᵢⱼ"
          hint="λ — скаляр. Порядок умножения не важен: λA = Aλ."
        />

        <ScalarVideo />

        <Card style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Свойства линейности</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
            {[
              { f: 'λ(A + B) = λA + λB', d: 'Дистрибутивность по матрицам' },
              { f: '(λ + μ)A = λA + μA', d: 'Дистрибутивность по скалярам' },
              { f: '(λμ)A = λ(μA)', d: 'Ассоциативность' },
              { f: '(−1)A = −A', d: 'Умножение на −1 даёт противоположную матрицу' },
            ].map(item => (
              <div key={item.f} style={{ background: T.surface, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: 4 }}>{item.f}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>

        <DSNote>
          В методе градиентного спуска обновление весов нейросети выглядит как: <M tex="W \leftarrow W - \alpha \cdot \nabla W" />.
          Здесь <M tex="\alpha" /> (learning rate, скорость обучения) — это скаляр, а <M tex="\nabla W" /> — матрица градиентов.
          Умножение матрицы градиентов на скаляр масштабирует шаг оптимизации.
        </DSNote>
      </section>

      {/* ── 4. Транспонирование ── */}
      <section id="transpose" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Операция 3" title="Транспонирование" color="#0ea5e9" />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
          Транспонирование — структурное преобразование матрицы: каждая строка исходной матрицы становится столбцом с тем же номером. Элемент a<sub>ij</sub> переходит на позицию (j, i). Матрица m×n превращается в матрицу n×m. Главная диагональ при этом остаётся на месте.
        </p>

        <FormulaBlock
          formula="(Aᵀ)ᵢⱼ = aⱼᵢ"
          hint="Транспонированная матрица обозначается Aᵀ или A′."
        />

        <TransposeVideo />

        <Card style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Свойства транспонирования</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
            {[
              { f: '(Aᵀ)ᵀ = A', d: 'Инволютивность: двукратное транспонирование восстанавливает исходную матрицу.' },
              { f: '(A+B)ᵀ = Aᵀ + Bᵀ', d: 'Линейность: транспонирование дистрибутивно по сложению.' },
              { f: '(AB)ᵀ = BᵀAᵀ', d: 'При транспонировании произведения порядок сомножителей меняется на обратный.' },
              { f: '(λA)ᵀ = λAᵀ', d: 'Скаляр выносится без изменений.' },
            ].map(item => (
              <div key={item.f} style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ marginBottom: 8 }}><M tex={item.f} /></div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{item.d}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, background: T.surface, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: T.muted }}>
            <strong style={{ color: T.text }}>Симметричная матрица:</strong> Aᵀ = A, то есть a<sub>ij</sub> = a<sub>ji</sub> для всех i, j. <br />
            <strong style={{ color: T.text }}>Кососимметричная матрица:</strong> Aᵀ = −A. Из этого следует, что все диагональные элементы равны нулю.
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, margin: '16px 0' }}>
          <Card>
            <div style={{ fontWeight: 700, color: T.cyan, marginBottom: 8, fontSize: 14 }}>Симметричная матрица</div>
            <p style={{ color: T.text, fontSize: 14, lineHeight: 1.75, marginBottom: 10 }}>
              Матрица называется симметричной, если <M tex="A^\top = A" />, то есть элемент в строке <M tex="i" />, столбце <M tex="j" /> равен элементу в строке <M tex="j" />, столбце <M tex="i" />.
              Симметричная матрица всегда квадратная.
            </p>
            <FormulaBlock
              tex="\begin{pmatrix} 1 & 2 \\ 2 & 3 \end{pmatrix}^\top = \begin{pmatrix} 1 & 2 \\ 2 & 3 \end{pmatrix}"
              hint="a₁₂ = a₂₁ = 2. Матрица совпадает с транспонированной."
            />
            <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.65, margin: 0 }}>
              В DS: ковариационная матрица <M tex="C = X^\top X" /> всегда симметрична. Матрица попарных расстояний — тоже.
            </p>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, color: T.accent, marginBottom: 8, fontSize: 14 }}>Кососимметричная матрица</div>
            <p style={{ color: T.text, fontSize: 14, lineHeight: 1.75, marginBottom: 10 }}>
              Матрица называется кососимметричной (антисимметричной), если <M tex="A^\top = -A" />.
              Это означает, что <M tex="a_{ji} = -a_{ij}" /> — элементы, симметричные относительно диагонали, противоположны по знаку.
              Диагональные элементы обязательно равны нулю: если <M tex="a_{ii} = -a_{ii}" />, то <M tex="a_{ii} = 0" />.
            </p>
            <FormulaBlock
              tex="\begin{pmatrix} 0 & 5 \\ -5 & 0 \end{pmatrix}^\top = \begin{pmatrix} 0 & -5 \\ 5 & 0 \end{pmatrix} = -A"
              hint="a₁₂=5, a₂₁=−5. Диагональ нулевая."
            />
          </Card>
        </div>

        <DSNote>
          Формула нормального уравнения линейной регрессии: <M tex="\beta = (X^\top X)^{-1} X^\top y" />.
          Транспонирование используется дважды — вы уже видите, почему это важно понимать.
        </DSNote>
      </section>

      {/* ── 5. Матричное умножение ── */}
      <section id="multiply" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Операция 4" title="Матричное умножение" color={T.amber} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
          Матричное умножение принципиально отличается от поэлементных операций. Элемент c<sub>ij</sub> результирующей матрицы — это сумма попарных произведений элементов <em>i</em>-й строки матрицы A и <em>j</em>-го столбца матрицы B.
        </p>
        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
          <strong>Условие выполнимости:</strong> произведение A×B определено тогда и только тогда, когда число столбцов A равно числу строк B. Если A имеет размер m×k, а B — размер k×n, результат C имеет размер m×n.
        </p>

        <FormulaBlock
          formula="cᵢⱼ = Σₖ aᵢₖ · bₖⱼ"
          hint="Суммирование по всем k = 1..n, где n — число столбцов A = число строк B."
        />

        <MultiplyVideo />

        <div style={{ marginTop: 14, background: `${T.red}0e`, border: `1px solid ${T.red}30`, borderRadius: 12, padding: '12px 16px' }}>
          <div>
            <strong style={{ fontSize: 14, color: T.text }}>Матричное умножение некоммутативно: AB ≠ BA</strong>
            <p style={{ margin: '4px 0 0', color: T.muted, fontSize: 13 }}>Произведение в обратном порядке может быть не определено (если размеры не согласованы) или давать иной результат. Порядок сомножителей всегда существенен.</p>
          </div>
        </div>

        <Card style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Свойства матричного умножения</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {[
              { f: '(AB)C = A(BC)', d: 'Ассоциативность: порядок перемножения групп не важен.' },
              { f: 'A(B+C) = AB + AC', d: 'Дистрибутивность слева.' },
              { f: '(A+B)C = AC + BC', d: 'Дистрибутивность справа.' },
              { f: 'AE = EA = A', d: 'Единичная матрица E — нейтральный элемент для квадратных матриц.' },
            ].map(item => (
              <div key={item.f} style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ marginBottom: 6 }}><M tex={item.f} /></div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── 6. След ── */}
      <section id="trace" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sigma} label="Операция 5" title="След матрицы" color="#8b5cf6" />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
          Следом квадратной матрицы A порядка n называется сумма всех элементов, расположенных на главной диагонали. Главная диагональ содержит элементы a<sub>ii</sub>, у которых номер строки совпадает с номером столбца. Понятие определено исключительно для квадратных матриц.
        </p>

        <FormulaBlock
          formula="tr(A) = Σᵢ aᵢᵢ = a₁₁ + a₂₂ + ... + aₙₙ"
          hint="Обозначается tr(A) (от английского trace) или Sp(A) (от немецкого Spur)."
        />

        <TraceVideo />

        <Card style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Свойства следа</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { f: 'tr(A + B) = tr(A) + tr(B)', d: 'Линейность по сложению.' },
              { f: 'tr(λA) = λ · tr(A)', d: 'Линейность по умножению на скаляр.' },
              { f: 'tr(Aᵀ) = tr(A)', d: 'Транспонирование не меняет след: главная диагональ остаётся на месте.' },
              { f: 'tr(AB) = tr(BA)', d: 'Циклическая перестановка: следы AB и BA равны, хотя сами матрицы, как правило, различны.' },
              { f: 'tr(ABC) = tr(BCA) = tr(CAB)', d: 'Обобщение: допускается циклическая, но не произвольная перестановка.' },
            ].map(item => (
              <div key={item.f} style={{ background: T.surface, borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <code style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 700, whiteSpace: 'nowrap', minWidth: 200 }}>{item.f}</code>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, background: '#8b5cf614', border: '1px solid #8b5cf630', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#4c1d95' }}>
            След матрицы инвариантен относительно выбора базиса и равен сумме всех собственных значений матрицы с учётом их кратности.
          </div>
        </Card>

        <p style={{ color: T.text, lineHeight: 1.8, fontSize: 15, marginTop: 14 }}>
          Важна одна тонкость: циклическая перестановка сохраняет след, но перестановка не-циклическая — нет.
          Например, <M tex="\text{tr}(ABC) = \text{tr}(BCA)" />, но <M tex="\text{tr}(ABC) \neq \text{tr}(ACB)" /> в общем случае.
          Ещё одно важное свойство — инвариантность относительно замены базиса: след матрицы не меняется при переходе в другую систему координат, что делает его фундаментальной характеристикой линейного оператора.
        </p>

        <DSNote>
          В Ridge Regression (L2-регуляризация) к функции потерь добавляют <M tex="\lambda \cdot \text{tr}(W^\top W)" /> —
          штраф за слишком большие веса модели. Это предотвращает переобучение.
        </DSNote>
      </section>

      {/* ── 7. Норма ── */}
      <section id="norm" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Box} label="Операция 6" title="Норма матрицы" color="#06b6d4" />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
          Нормой матрицы называется функция ‖A‖, обобщающая понятие длины вектора. Она неотрицательна (‖A‖ = 0 только для нулевой матрицы), однородна (‖λA‖ = |λ|·‖A‖) и удовлетворяет неравенству треугольника. Для матричных норм дополнительно требуют субмультипликативности: ‖AB‖ ≤ ‖A‖·‖B‖.
        </p>

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
          Наиболее употребительная в вычислениях — <strong>норма Фробениуса</strong>: квадратный корень из суммы квадратов всех элементов. Она не является операторной, но порождается скалярным произведением ⟨A, B⟩ = tr(AᵀB).
        </p>

        <FormulaBlock
          formula="‖A‖_F = √(Σᵢⱼ |aᵢⱼ|²) = √(tr(AᵀA))"
          hint="Аналог евклидовой длины вектора, вытянутого из всех элементов матрицы."
        />

        <NormVideo />

        <Card style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Операторные нормы</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {[
              { f: '‖A‖₁ = max_j Σᵢ |aᵢⱼ|', n: 'Норма-1 (столбцовая)', d: 'Максимум по столбцам из сумм модулей.' },
              { f: '‖A‖∞ = max_i Σⱼ |aᵢⱼ|', n: 'Норма-∞ (строчная)', d: 'Максимум по строкам из сумм модулей.' },
              { f: '‖A‖₂ = √(λ_max(AᵀA))', n: 'Спектральная норма', d: 'Максимальное сингулярное число. Порождена евклидовой нормой вектора.' },
              { f: '‖A‖_F = √(Σσᵢ²)', n: 'Фробениуса', d: 'Квадратный корень из суммы квадратов сингулярных чисел.' },
            ].map(item => (
              <div key={item.f} style={{ background: T.surface, borderRadius: 10, padding: '10px 12px' }}>
                <code style={{ fontSize: 11, color: '#06b6d4', fontWeight: 700, display: 'block', marginBottom: 4 }}>{item.f}</code>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>{item.n}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{item.d}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: T.muted }}>
            Все нормы в конечномерном пространстве матриц фиксированного размера эквивалентны: для любых двух норм существуют константы c₁, c₂ &gt; 0 такие, что c₁‖A‖_α ≤ ‖A‖_β ≤ c₂‖A‖_α.
          </div>
        </Card>

        <DSNote>
          Метод наименьших квадратов в линейной регрессии: <M tex="\hat{\beta} = (X^\top X)^{-1} X^\top y" />.
          Если признаки коллинеарны (<M tex="\det(X^\top X) = 0" />), матрица вырождена. Тогда применяют Ridge Regression:
          прибавляют <M tex="\lambda I" /> к <M tex="X^\top X" />, что гарантирует обратимость.
        </DSNote>
      </section>

      {/* ── 8. Обратная ── */}
      <section id="inverse" style={{ marginBottom: 52 }}>
        <SectionHeader icon={ArrowRight} label="Операция 7" title="Обратная матрица" color="#ec4899" />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 8 }}>
          Квадратная матрица A порядка n называется обратимой (невырожденной), если существует матрица A⁻¹ того же порядка такая, что AA⁻¹ = A⁻¹A = E. Обратимость эквивалентна условию det(A) ≠ 0. Обратная матрица, если существует, единственна.
        </p>

        <FormulaBlock
          formula="A · A⁻¹ = A⁻¹ · A = E"
          hint="E — единичная матрица порядка n."
        />

        <InverseVideo />

        <Card style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Основные свойства</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 12 }}>
            {[
              { f: '(AB)⁻¹ = B⁻¹A⁻¹', d: 'Антимультипликативность: порядок сомножителей меняется.' },
              { f: '(A⁻¹)ᵀ = (Aᵀ)⁻¹', d: 'Обращение и транспонирование коммутируют; объект обозначается A⁻ᵀ.' },
              { f: '(A⁻¹)⁻¹ = A', d: 'Обратная к обратной есть исходная матрица.' },
              { f: '(λA)⁻¹ = (1/λ)A⁻¹', d: 'При λ ≠ 0.' },
            ].map(item => (
              <div key={item.f} style={{ background: T.surface, borderRadius: 10, padding: '10px 12px' }}>
                <code style={{ fontSize: 12, color: '#ec4899', fontWeight: 700, display: 'block', marginBottom: 4 }}>{item.f}</code>
                <div style={{ fontSize: 12, color: T.muted }}>{item.d}</div>
              </div>
            ))}
          </div>

          <div style={{ fontWeight: 700, color: T.text, marginBottom: 8, fontSize: 14 }}>Способы вычисления</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Формула через adj(A)</div>
              <code style={{ fontSize: 12, color: '#ec4899', display: 'block', marginBottom: 6 }}>A⁻¹ = (1/det A) · adj(A)</code>
              <div style={{ fontSize: 12, color: T.muted }}>adj(A) — присоединённая матрица из алгебраических дополнений, транспонированных. Для матрицы 2×2 имеет явный вид: меняются местами a₁₁ и a₂₂, меняются знаки a₁₂ и a₂₁.</div>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Метод Гаусса–Жордана</div>
              <code style={{ fontSize: 12, color: '#ec4899', display: 'block', marginBottom: 6 }}>(A | E) → (E | A⁻¹)</code>
              <div style={{ fontSize: 12, color: T.muted }}>Расширенная матрица (A|E) приводится элементарными преобразованиями строк к виду (E|A⁻¹). Если привести левую часть к E невозможно — матрица вырождена.</div>
            </div>
          </div>

          <div style={{ marginTop: 10, background: '#ec489914', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#831843' }}>
            Система линейных уравнений Ax = b имеет единственное решение x = A⁻¹b при det(A) ≠ 0. На практике для решения систем предпочтительнее метод Гаусса: он вычислительно эффективнее прямого нахождения A⁻¹.
          </div>
        </Card>
      </section>

      {/* ── 9. DS ── */}
      <section id="ds" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Code2} label="Применение" title="Матрицы в Data Science" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { title: 'Линейная регрессия', formula: 'β = (XᵀX)⁻¹Xᵀy', desc: 'X — матрица признаков. Нормальное уравнение использует транспонирование и обратную матрицу.', ops: ['умножение', 'транспонирование', 'обратная'], color: T.primary },
            { title: 'Нейронная сеть', formula: 'y = σ(Wx + b)', desc: 'W — матрица весов. Прямой проход — матричное умножение. Обратное распространение ошибки использует Wᵀ.', ops: ['умножение', 'транспонирование', '× скаляр'], color: T.accent },
            { title: 'PCA', formula: 'C = (1/n)XᵀX', desc: 'Ковариационная матрица строится через транспонирование. Главные компоненты — собственные векторы C.', ops: ['умножение', 'транспонирование', 'след'], color: '#06b6d4' },
            { title: 'Матричные разложения', formula: 'R ≈ U · Vᵀ', desc: 'Матрица рейтингов R аппроксимируется произведением матриц меньшего ранга. Используется норма Фробениуса в качестве функции потерь.', ops: ['умножение', 'транспонирование', 'норма'], color: T.green },
          ].map(item => (
            <Card key={item.title} style={{ borderTop: `3px solid ${item.color}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 8 }}>{item.title}</div>
              <div style={{ marginBottom: 12 }}><M tex={item.formula} /></div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 12 }}>{item.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {item.ops.map(op => (
                  <span key={op} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: `${item.color}14`, color: item.color, fontWeight: 600 }}>{op}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 10. Проверь себя ── */}
      <section id="check" style={{ marginBottom: 52 }}>
        <SectionHeader icon={CheckCircle2} label="Самопроверка" title="Проверь себя" color={T.amber} />
        <CheckQuestions />
      </section>

      {/* Footer */}
      <div style={{ background: T.primaryLight, borderRadius: 20, padding: '22px 28px', border: `1px solid ${T.primaryBorder}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <Sparkles size={18} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, color: T.primaryDark, marginBottom: 4 }}>Следующие шаги</div>
          <div style={{ fontSize: 13, color: T.muted }}>
            Переходите к <strong>Практике</strong> — там разборы задач с пошаговым объяснением. После — самостоятельные задания с эталонными ответами.
          </div>
        </div>
      </div>
    </div>
  );
}
