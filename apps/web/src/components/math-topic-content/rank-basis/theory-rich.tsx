// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Grid3X3, Activity, Zap, Layers, Sigma,
  Brain, Code2, CheckCircle2, Sparkles, ArrowRight,
  Play, Pause, RotateCcw, Box, Target,
} from 'lucide-react';
import { MarkdownRenderer } from '../../MarkdownRenderer';

// ─── Цвета ────────────────────────────────────────────────────────────────────
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

// ─── Формульные хелперы ───────────────────────────────────────────────────────

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

// ─── UI-компоненты ────────────────────────────────────────────────────────────

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

function PropGrid({ items }: { items: { f: string; label: string; d: string; color?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 12 }}>
      {items.map((item) => (
        <div key={item.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '13px 16px' }}>
          <div style={{ marginBottom: 6 }}><F tex={item.f} /></div>
          <div style={{ fontWeight: 700, fontSize: 13, color: item.color ?? T.primary, marginBottom: 3 }}>{item.label}</div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{item.d}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Видео-плейсхолдеры ───────────────────────────────────────────────────────

function VideoPlaceholder({ title, desc, duration, badge }: { title: string; desc: string; duration: string; badge?: string }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div style={{ borderRadius: 20, background: '#0f172a', color: T.white, padding: '22px 28px', margin: '18px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#818cf8', textTransform: 'uppercase', marginBottom: 6 }}>
              {badge ?? 'Видео-плейсхолдер'}
            </div>
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
    <div
      onClick={() => setOpen(true)}
      style={{ borderRadius: 20, border: `2px dashed ${T.border}`, background: `${T.primary}04`, padding: '18px 24px', margin: '18px 0', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
    >
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

// ─── Статичная SVG-диаграмма «4 подпространства» ─────────────────────────────

function FourSubspacesDiagram() {
  const boxes = [
    { x: 30, y: 60, w: 200, h: 110, fill: `${T.primary}10`, stroke: T.primaryBorder, title: 'Пространство строк', sub: 'Row(A)', dim: 'dim = r', arrow: true },
    { x: 30, y: 200, w: 200, h: 110, fill: `${T.violet}10`, stroke: `${T.violet}40`, title: 'Ядро', sub: 'ker(A)', dim: 'dim = n − r', arrow: false },
    { x: 370, y: 60, w: 200, h: 110, fill: `${T.green}10`, stroke: `${T.green}40`, title: 'Пространство столбцов', sub: 'Col(A) = Im(A)', dim: 'dim = r', arrow: false },
    { x: 370, y: 200, w: 200, h: 110, fill: `${T.amber}10`, stroke: `${T.amber}40`, title: 'Левое ядро', sub: 'ker(Aᵀ)', dim: 'dim = m − r', arrow: false },
  ];
  const colors = [T.primary, T.violet, T.green, T.amber];
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '24px 16px', margin: '20px 0', overflowX: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
        Четыре фундаментальных подпространства
      </div>
      <svg viewBox="0 0 600 340" style={{ width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }}>
        {/* Заголовки миров */}
        <text x="130" y="44" textAnchor="middle" fontSize="13" fontWeight="800" fill={T.text}>ℝⁿ</text>
        <text x="114" y="58" textAnchor="middle" fontSize="10" fill={T.muted}>(n столбцов)</text>
        <text x="470" y="44" textAnchor="middle" fontSize="13" fontWeight="800" fill={T.text}>ℝᵐ</text>
        <text x="454" y="58" textAnchor="middle" fontSize="10" fill={T.muted}>(m строк)</text>

        {/* Боксы */}
        {boxes.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} fill={b.fill} stroke={b.stroke} strokeWidth={1.5} />
            <text x={b.x + b.w / 2} y={b.y + 32} textAnchor="middle" fontSize="12" fontWeight="700" fill={colors[i]}>{b.title}</text>
            <text x={b.x + b.w / 2} y={b.y + 50} textAnchor="middle" fontSize="11" fontFamily="monospace" fill={T.muted}>{b.sub}</text>
            <rect x={b.x + b.w / 2 - 38} y={b.y + 62} width={76} height={22} rx={11} fill={`${colors[i]}18`} />
            <text x={b.x + b.w / 2} y={b.y + 78} textAnchor="middle" fontSize="11" fontWeight="700" fill={colors[i]}>{b.dim}</text>
          </g>
        ))}

        {/* Стрелка A: строки → столбцы */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={T.primary} />
          </marker>
        </defs>
        <line x1="232" y1="115" x2="368" y2="115" stroke={T.primary} strokeWidth="2" markerEnd="url(#arrowhead)" />
        <text x="300" y="109" textAnchor="middle" fontSize="11" fontWeight="700" fill={T.primary}>A</text>

        {/* Стрелка ядро → 0 */}
        <line x1="232" y1="255" x2="368" y2="255" stroke={T.violet} strokeWidth="2" strokeDasharray="5,3" />
        <text x="300" y="249" textAnchor="middle" fontSize="11" fontWeight="700" fill={T.violet}>→ 0</text>

        {/* Ортогональность строки/ядро */}
        <text x="130" y="176" textAnchor="middle" fontSize="10" fill={T.muted}>⊥</text>

        {/* Ортогональность столбцы/лев. ядро */}
        <text x="470" y="176" textAnchor="middle" fontSize="10" fill={T.muted}>⊥</text>

        {/* Формулы снизу */}
        <text x="130" y="325" textAnchor="middle" fontSize="11" fill={T.muted}>r + (n−r) = n</text>
        <text x="470" y="325" textAnchor="middle" fontSize="11" fill={T.muted}>r + (m−r) = m</text>
      </svg>
    </div>
  );
}

// ─── Анимация: линейная оболочка (простая CSS) ────────────────────────────────

function SpanAnimation() {
  const frames = [
    { label: '1 вектор → размерность 1', desc: 'Один вектор натягивает прямую', color: T.red },
    { label: '2 независимых → размерность 2', desc: 'Два вектора под углом натягивают плоскость', color: T.primary },
    { label: '3-й зависимый → всё ещё размерность 2', desc: 'Третий вектор лежит в той же плоскости — ничего нового', color: T.muted },
    { label: '2 коллинеарных → размерность 1', desc: 'Параллельные векторы — только прямая', color: T.amber },
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
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>Линейная оболочка</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted }}>кадр {active + 1} / {frames.length}</span>
      </div>
      <div style={{ padding: '18px 22px', minHeight: 110, display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width="80" height="80" viewBox="-1 -1 102 102">
          <rect x="0" y="0" width="100" height="100" rx="12" fill={`${f.color}08`} stroke={`${f.color}20`} strokeWidth="1" />
          {active === 0 && <line x1="10" y1="90" x2="90" y2="10" stroke={T.red} strokeWidth="2.5" strokeLinecap="round" />}
          {active === 1 && <>
            <line x1="50" y1="50" x2="85" y2="20" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" markerEnd="none" />
            <line x1="50" y1="50" x2="20" y2="20" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" />
            <rect x="5" y="5" width="90" height="90" rx="8" fill={`${T.primary}10`} />
          </>}
          {active === 2 && <>
            <line x1="50" y1="50" x2="85" y2="20" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="50" y1="50" x2="20" y2="20" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="50" y1="50" x2="70" y2="35" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeDasharray="4,3" />
            <rect x="5" y="5" width="90" height="90" rx="8" fill={`${T.primary}10`} />
          </>}
          {active === 3 && <>
            <line x1="20" y1="70" x2="80" y2="30" stroke={T.red} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="25" y1="75" x2="75" y2="35" stroke={T.amber} strokeWidth="2.5" strokeLinecap="round" />
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

// ─── Анимация метода Гаусса ───────────────────────────────────────────────────

function GaussAnimation() {
  const steps = [
    {
      label: 'Исходная матрица',
      rows: [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
      ],
      highlight: [],
      op: '',
    },
    {
      label: 'R₂ ← R₂ − 4R₁',
      rows: [
        ['1', '2', '3'],
        ['0', '−3', '−6'],
        ['7', '8', '9'],
      ],
      highlight: [1],
      op: 'R₂ ← R₂ − 4·R₁',
    },
    {
      label: 'R₃ ← R₃ − 7R₁',
      rows: [
        ['1', '2', '3'],
        ['0', '−3', '−6'],
        ['0', '−6', '−12'],
      ],
      highlight: [2],
      op: 'R₃ ← R₃ − 7·R₁',
    },
    {
      label: 'R₃ ← R₃ − 2R₂',
      rows: [
        ['1', '2', '3'],
        ['0', '−3', '−6'],
        ['0', '0', '0'],
      ],
      highlight: [2],
      op: 'R₃ ← R₃ − 2·R₂',
    },
  ];
  const [step, setStep] = useState(0);
  const s = steps[step];
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', margin: '18px 0' }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>Метод Гаусса — шаг за шагом</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted }}>{step + 1} / {steps.length}</span>
      </div>
      <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <div>
          <table style={{ borderCollapse: 'separate', borderSpacing: '6px 4px', fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}>
            <tbody>
              {s.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      width: 44, height: 36, textAlign: 'center', borderRadius: 8,
                      background: s.highlight.includes(ri) ? `${T.primary}12` : T.surface,
                      color: cell === '0' ? T.muted : (s.highlight.includes(ri) ? T.primary : T.text),
                      border: `1px solid ${s.highlight.includes(ri) ? T.primaryBorder : T.border}`,
                      transition: 'all 0.3s',
                    }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          {s.op && <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace', marginBottom: 6 }}>{s.op}</div>}
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.label}</div>
          {step === 3 && (
            <div style={{ marginTop: 8, background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: T.primaryDark }}>
              ✓ rank = 2
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '10px 18px 14px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, fontWeight: 700, color: step === 0 ? T.mutedLight : T.text, cursor: step === 0 ? 'default' : 'pointer' }}
        >← Назад</button>
        <button
          onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
          disabled={step === steps.length - 1}
          style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.primary, fontSize: 12, fontWeight: 700, color: T.white, cursor: step === steps.length - 1 ? 'default' : 'pointer', opacity: step === steps.length - 1 ? 0.5 : 1 }}
        >Вперёд →</button>
        <button
          onClick={() => setStep(0)}
          style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, fontWeight: 600, color: T.muted, cursor: 'pointer' }}
        ><RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />Сначала</button>
      </div>
    </div>
  );
}

// ─── Секция самопроверки ──────────────────────────────────────────────────────

function CheckQuestions() {
  const questions = [
    {
      q: 'Матрица имеет 5 строк и 3 столбца. Какой максимальный ранг?',
      options: ['5', '3', '8', '15'],
      correct: 1,
      explanation: 'rank(A) ≤ min(m, n) = min(5, 3) = 3.',
    },
    {
      q: 'В матрице 4×4 первые две строки одинаковы. Что можно сказать о ранге?',
      options: ['rank = 4', 'rank ≤ 3', 'rank = 2', 'rank = 0'],
      correct: 1,
      explanation: 'Две одинаковые строки — линейно зависимы. Значит, максимум 3 независимые строки, rank ≤ 3.',
    },
    {
      q: 'У матрицы 3×5 ранг равен 2. Какова dim(ker)?',
      options: ['2', '3', '5', '1'],
      correct: 1,
      explanation: 'По фундаментальной теореме: dim(ker) = n − rank = 5 − 2 = 3.',
    },
    {
      q: 'Базис пространства столбцов — это столбцы ступенчатого вида?',
      options: ['Да', 'Нет — столбцы исходной матрицы', 'Зависит от матрицы', 'Да, если матрица квадратная'],
      correct: 1,
      explanation: 'Элементарные преобразования строк меняют сами столбцы. Базис столбцов берём из исходной матрицы — те столбцы, где в ступенчатом виде стоят ведущие элементы.',
    },
    {
      q: 'Сколько векторов в базисе пространства строк матрицы 10×100 с рангом 4?',
      options: ['10', '100', '4', '96'],
      correct: 2,
      explanation: 'dim(пространства строк) = rank = 4. Базис содержит ровно 4 вектора.',
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
                  <button
                    key={oi}
                    onClick={() => { setAnswers(a => ({ ...a, [qi]: oi })); }}
                    style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 10, border: `1px solid ${isChosen && !show ? T.primary : border}`, background: isChosen && !show ? T.primaryLight : bg, color, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontWeight: isChosen ? 600 : 400 }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {chosen !== undefined && !show && (
              <button
                onClick={() => setRevealed(r => ({ ...r, [qi]: true }))}
                style={{ marginTop: 10, padding: '6px 14px', borderRadius: 10, background: T.primary, color: T.white, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >Проверить</button>
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

export default function RankBasisTheoryRich() {
  const navSections = [
    { id: 'why',       label: 'Зачем это' },
    { id: 'lincom',    label: 'Лин. комбинация' },
    { id: 'lindep',    label: 'Зависимость' },
    { id: 'gauss',     label: 'Метод Гаусса' },
    { id: 'rank',      label: 'Ранг' },
    { id: 'basis',     label: 'Базис' },
    { id: 'example',   label: 'Пример 3×4' },
    { id: 'four',      label: '4 подпространства' },
    { id: 'props',     label: 'Свойства' },
    { id: 'ds',        label: 'Data Science' },
    { id: 'check',     label: 'Проверь себя' },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Заголовок ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Grid3X3 size={15} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: T.primary, textTransform: 'uppercase' }}>Линейная алгебра</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, color: T.muted }}>около 25 минут</span>
        </div>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>Ранг и базис</h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16 }}>Как найти истинную размерность данных — через линейную независимость, метод Гаусса и фундаментальные подпространства.</p>
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
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Netflix-задача</div>
          <p style={{ margin: '0 0 10px', color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Матрица <strong>500 000 пользователей × 1000 фильмов</strong> — полмиллиарда чисел. Каждый столбец — вектор длины 500 000.
          </p>
          <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Вопрос: действительно ли здесь 1000 разных «осей вкусов»? Или настоящих независимых факторов — жанр, возраст, культура — всего <strong>20–30</strong>?
          </p>
        </div>

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Почти всегда второе. Настоящая размерность данных гораздо меньше, чем кажется. Эта размерность называется <strong>рангом</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { n: '1', title: 'Линейная зависимость', d: 'Когда одни данные повторяют другие', color: T.primary },
            { n: '2', title: 'Метод Гаусса', d: 'Вскрывает истинную структуру матрицы', color: T.violet },
            { n: '3', title: 'Ранг', d: 'Число независимых измерений', color: T.green },
            { n: '4', title: 'Базис', d: 'Минимальный набор «осей»', color: T.amber },
            { n: '5', title: 'Образ и ядро', d: 'Две стороны одного преобразования', color: T.cyan },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{item.n}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>

        {/* Метафора художника */}
        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Метафора: палитра художника</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            У художника 10 тюбиков краски. Но после анализа: <em>красный</em> + <em>белый</em> = розовый, <em>синий</em> + <em>жёлтый</em> = зелёный... Все оттенки выводятся всего из <strong>трёх базовых</strong>.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.amber, background: T.amberLight, borderRadius: 20, padding: '3px 12px' }}>3 = ранг палитры</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.primary, background: T.primaryLight, borderRadius: 20, padding: '3px 12px' }}>Красный, Синий, Жёлтый = базис</span>
          </div>
        </Card>
      </section>

      {/* ── 1. Линейная комбинация ── */}
      <section id="lincom" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Понятие 1" title="Линейная комбинация и оболочка" color={T.green} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
          <strong>Линейная комбинация</strong> — это «смешивание» векторов с коэффициентами. Каждый вектор тянем с разной силой и складываем.
        </p>

        <FBox
          tex="c_1\,\vec{v}_1 + c_2\,\vec{v}_2 + \cdots + c_k\,\vec{v}_k"
          hint="c₁, c₂, …, cₖ — произвольные числа (коэффициенты)"
          color={T.green}
        />

        <Card>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Пример на плоскости</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            Шаг вправо <M tex="\vec{v}_1 = (1,0)^\top" /> и шаг вверх <M tex="\vec{v}_2 = (0,1)^\top" />. Тогда <M tex="3\vec{v}_1 + 2\vec{v}_2" /> — это «3 шага вправо и 2 вверх»:
          </p>
          <F tex="3\begin{pmatrix}1\\0\end{pmatrix} + 2\begin{pmatrix}0\\1\end{pmatrix} = \begin{pmatrix}3\\2\end{pmatrix}" />
          <p style={{ margin: '8px 0 0', fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
            Любую точку плоскости <M tex="(x, y)" /> можно получить как <M tex="x\vec{v}_1 + y\vec{v}_2" />. Эти два вектора «натягивают» всю плоскость.
          </p>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 10, fontSize: 14 }}>Линейная оболочка (span)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
            {[
              { label: '1 вектор', d: 'Оболочка — прямая', dim: 'dim = 1', color: T.red },
              { label: '2 независимых', d: 'Оболочка — плоскость', dim: 'dim = 2', color: T.primary },
              { label: '3 независимых', d: 'Оболочка — трёхмерное пространство', dim: 'dim = 3', color: T.green },
              { label: '3-й зависим', d: 'Оболочка не выросла', dim: 'всё ещё dim = 2', color: T.muted },
            ].map(item => (
              <div key={item.label} style={{ background: T.surface, borderRadius: 10, padding: '11px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>{item.d}</div>
                <code style={{ fontSize: 11, color: item.color }}>{item.dim}</code>
              </div>
            ))}
          </div>
        </Card>

        {/* Анимация оболочки */}
        <SpanAnimation />

        <VideoPlaceholder
          title="Линейная зависимость в 3D"
          desc="Два вектора натягивают плоскость; третий в неё ложится — зависим. Потом торчит в третье измерение — независим"
          duration="18 сек"
          badge="Визуализация 1"
        />
      </section>

      {/* ── 2. Линейная зависимость ── */}
      <section id="lindep" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Понятие 2" title="Линейная зависимость и независимость" color={T.violet} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
          Главный вопрос: <strong>все ли векторы в наборе нужны?</strong> Или какой-то из них уже выражается как комбинация остальных?
        </p>

        <Card style={{ borderLeft: `4px solid ${T.violet}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Формальное определение</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            Векторы <M tex="\vec{v}_1, \dots, \vec{v}_k" /> <strong>линейно зависимы</strong>, если существуют коэффициенты, <em>не все равные нулю</em>, такие что:
          </p>
          <FBox tex="c_1\vec{v}_1 + c_2\vec{v}_2 + \cdots + c_k\vec{v}_k = \vec{0}" color={T.violet} />
          <p style={{ margin: '8px 0 0', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            <strong>Линейно независимы</strong> — если такое равенство возможно только при всех <M tex="c_i = 0" />.
          </p>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 14 }}>
          <Card style={{ borderTop: `3px solid ${T.red}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 8 }}>Пример: зависимы</div>
            <F tex="\vec{v}_1=\begin{pmatrix}1\\0\end{pmatrix},\;\vec{v}_2=\begin{pmatrix}0\\1\end{pmatrix},\;\vec{v}_3=\begin{pmatrix}2\\3\end{pmatrix}" />
            <p style={{ margin: '6px 0 0', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
              Так как <M tex="\vec{v}_3 = 2\vec{v}_1 + 3\vec{v}_2" />, то <M tex="2\vec{v}_1 + 3\vec{v}_2 - \vec{v}_3 = \vec{0}" />. Коэффициенты (2, 3, −1) — не все нули. Зависимы, размерность оболочки = 2, не 3.
            </p>
          </Card>
          <Card style={{ borderTop: `3px solid ${T.green}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Пример: независимы</div>
            <F tex="\vec{v}_1=\begin{pmatrix}1\\0\end{pmatrix},\quad\vec{v}_2=\begin{pmatrix}0\\1\end{pmatrix}" />
            <p style={{ margin: '6px 0 0', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
              <M tex="c_1\vec{v}_1 + c_2\vec{v}_2 = \vec{0}" /> возможно только при <M tex="c_1 = c_2 = 0" />. Оболочка — вся плоскость <M tex="\mathbb{R}^2" />.
            </p>
          </Card>
        </div>

        <Callout color={T.primary} title="Ключевой геометрический факт">
          В <M tex="n" />-мерном пространстве <strong>не может быть более <M tex="n" /> линейно независимых векторов</strong>. Три вектора на плоскости <M tex="(n=2)" /> — всегда зависимы. Это потолок для независимости.
        </Callout>
      </section>

      {/* ── 3. Метод Гаусса ── */}
      <section id="gauss" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Инструмент" title="Метод Гаусса — как навести порядок" color={T.amber} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Как узнать, сколько строк матрицы независимы? Привести к <strong>ступенчатому виду</strong>. Как в уборке: после расчистки видно, что главное, а что — лишнее.
        </p>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Разрешённые преобразования строк</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {[
              { n: '1', title: 'Перестановка строк', ex: 'R_i \\leftrightarrow R_j', d: 'Поменять строки местами' },
              { n: '2', title: 'Умножение на число', ex: 'R_i \\leftarrow \\lambda R_i,\\; \\lambda \\neq 0', d: 'Умножить строку на ненулевую константу' },
              { n: '3', title: 'Прибавление кратной', ex: 'R_i \\leftarrow R_i + c\\,R_j', d: 'Прибавить к строке другую с множителем' },
            ].map(op => (
              <div key={op.n} style={{ background: T.surface, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5 }}>{op.n}. {op.title}</div>
                <div style={{ marginBottom: 6 }}><F tex={op.ex} /></div>
                <div style={{ fontSize: 12, color: T.muted }}>{op.d}</div>
              </div>
            ))}
          </div>
          <Callout color={T.green} title="Почему это безопасно">
            Эти операции — то же, что при решении систем уравнений. Они меняют форму, но не ранг, не ядро, не пространство строк.
          </Callout>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Ступенчатый вид — что это такое</div>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
            Матрица в <strong>ступенчатом виде</strong>: нулевые строки внизу, в каждой ненулевой строке ведущий элемент стоит правее, чем в предыдущей.
          </p>
          <F tex="\begin{pmatrix} \boxed{2} & 3 & 1 & 0 \\ 0 & \boxed{1} & 2 & 5 \\ 0 & 0 & 0 & \boxed{4} \\ 0 & 0 & 0 & 0 \end{pmatrix}" />
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.muted, textAlign: 'center' }}>
            3 ведущих элемента (в рамках) → <strong>rank = 3</strong>
          </p>
        </Card>

        {/* Интерактивная анимация Гаусса */}
        <GaussAnimation />

        <VideoPlaceholder
          title="Метод Гаусса — рождение нулей"
          desc="Каждый шаг: одна операция — один ноль. Видно, как строки обнуляются, ведущие элементы фиксируются, формируется ступенчатый вид"
          duration="25 сек"
          badge="Визуализация 2"
        />
      </section>

      {/* ── 4. Ранг ── */}
      <section id="rank" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sigma} label="Определение" title="Ранг — число настоящих измерений" />

        <FBox
          tex="\operatorname{rank}(A) = \text{число ненулевых строк в ступенчатом виде}"
          hint="= число ведущих элементов = max. число линейно независимых строк = max. число независимых столбцов"
        />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Границы ранга</div>
          <FBox tex="0 \;\leq\; \operatorname{rank}(A) \;\leq\; \min(m,\,n)" hint="для матрицы размера m × n" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 10 }}>
            {[
              { cond: 'rank = 0', d: 'Только у нулевой матрицы', color: T.muted },
              { cond: 'rank = min(m, n)', d: 'Полный ранг — максимально возможный', color: T.green },
              { cond: 'rank < n (квадратная)', d: 'Матрица вырождена: det = 0, необратима', color: T.red },
              { cond: 'rank = n (квадратная)', d: 'Обратима: det ≠ 0', color: T.primary },
            ].map(item => (
              <div key={item.cond} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '10px 14px' }}>
                <code style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.cond}</code>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Примеры</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Единичная матрица — rank = 2:</div>
              <F tex="E = \begin{pmatrix}1&0\\0&1\end{pmatrix} \Rightarrow \operatorname{rank} = 2" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Зависимые строки — rank = 1:</div>
              <F tex="\begin{pmatrix}1&2\\2&4\end{pmatrix} \xrightarrow{R_2 - 2R_1} \begin{pmatrix}1&2\\0&0\end{pmatrix} \Rightarrow \operatorname{rank} = 1" />
            </div>
          </div>
        </Card>

        <DSNote>
          Матрица данных с рангом 5 — значит, все строки и столбцы живут в 5-мерном подпространстве. В данных всего 5 независимых факторов. Основа PCA и снижения размерности.
        </DSNote>
      </section>

      {/* ── 5. Полная прогонка ── */}
      <section id="rank" style={{ marginBottom: 52 }}>
        <SectionHeader icon={BookOpen} label="Пример 1" title="Ранг матрицы 3×3 — полная прогонка" color={T.green} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 10 }}>
          Найдём ранг матрицы:
        </p>
        <FBox tex="A = \begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{pmatrix}" />

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 1 — обнуляем под a₁₁ = 1</div>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                <M tex="R_2 \leftarrow R_2 - 4R_1" />: &ensp;<M tex="(4,5,6) - 4\cdot(1,2,3) = (0,-3,-6)" />
              </p>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                <M tex="R_3 \leftarrow R_3 - 7R_1" />: &ensp;<M tex="(7,8,9) - 7\cdot(1,2,3) = (0,-6,-12)" />
              </p>
              <F tex="\begin{pmatrix} 1 & 2 & 3 \\ 0 & -3 & -6 \\ 0 & -6 & -12 \end{pmatrix}" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 2 — обнуляем под a₂₂ = −3</div>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                Множитель: <M tex="\frac{-6}{-3} = 2" />. &ensp;<M tex="R_3 \leftarrow R_3 - 2R_2" />:
              </p>
              <F tex="(0,-6,-12) - 2\cdot(0,-3,-6) = (0,0,0)" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Итог — ступенчатый вид</div>
              <F tex="\begin{pmatrix} \mathbf{1} & 2 & 3 \\ 0 & \mathbf{-3} & -6 \\ 0 & 0 & 0 \end{pmatrix}" />
              <FBox tex="\operatorname{rank}(A) = 2" hint="Две ненулевые строки" color={T.green} />
            </div>
          </div>
        </Card>

        <Callout color={T.muted} title="Что произошло">
          Третья строка оказалась комбинацией первых двух: <M tex="(7,8,9) = (-1)\cdot(1,2,3) + 2\cdot(4,5,6)" />. Она не дала нового измерения — ранг остался 2.
        </Callout>
      </section>

      {/* ── 6. Базис ── */}
      <section id="basis" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Понятие 3" title="Базис — минимальный набор осей" color={T.accent} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
          Ранг — это число. <strong>Базис</strong> — конкретный набор векторов, который реализует это число.
        </p>

        <Card style={{ borderLeft: `4px solid ${T.accent}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Определение</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            Набор <M tex="\{\vec{b}_1, \dots, \vec{b}_r\}" /> — <strong>базис</strong> пространства <M tex="V" />, если:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: T.greenLight, borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: T.green, marginBottom: 4 }}>1. Линейно независимы</div>
              <div style={{ fontSize: 12, color: T.text }}>Ни один вектор не выражается через остальные</div>
            </div>
            <div style={{ background: T.primaryLight, borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: T.primary, marginBottom: 4 }}>2. Порождают V</div>
              <div style={{ fontSize: 12, color: T.text }}>Любой вектор из V — их линейная комбинация</div>
            </div>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
            Число векторов <M tex="r" /> — <strong>размерность</strong> пространства <M tex="\dim V = r" />. Все базисы одного пространства содержат одинаковое число векторов.
          </p>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Базис не единственен</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, marginBottom: 6 }}>Стандартный базис ℝ²</div>
              <F tex="e_1 = \begin{pmatrix}1\\0\end{pmatrix},\quad e_2 = \begin{pmatrix}0\\1\end{pmatrix}" />
            </div>
            <div style={{ background: T.surface, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 6 }}>Другой базис того же ℝ²</div>
              <F tex="\begin{pmatrix}1\\1\end{pmatrix},\quad \begin{pmatrix}1\\-1\end{pmatrix}" />
            </div>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
            Как RGB и CMYK — два разных базиса одного и того же цветового пространства. Оба правильные.
          </p>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Как найти базис строк и базис столбцов</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: `${T.green}0a`, border: `1px solid ${T.green}30`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: T.green, marginBottom: 6, textTransform: 'uppercase' }}>Базис строк</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.65 }}>Ненулевые строки <strong>ступенчатого вида</strong> — это базис пространства строк.</div>
            </div>
            <div style={{ background: `${T.primary}0a`, border: `1px solid ${T.primaryBorder}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: T.primary, marginBottom: 6, textTransform: 'uppercase' }}>Базис столбцов</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.65 }}>Столбцы <strong>исходной матрицы</strong> с номерами ведущих позиций в ступенчатом виде.</div>
            </div>
          </div>
          <Callout color={T.amber} title="Важно">
            Для базиса столбцов нужна <strong>исходная</strong> матрица. Элементарные преобразования строк меняют столбцы — берите из оригинала.
          </Callout>
        </Card>

        <VideoPlaceholder
          title="Базис или не базис?"
          desc="Три вектора на плоскости — зависимы, не базис. Убираем один — базис ℝ². Два коллинеарных — только прямая"
          duration="20 сек"
          badge="Визуализация 3"
        />
      </section>

      {/* ── 7. Пример: матрица 3×4 ── */}
      <section id="example" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Grid3X3} label="Пример 2" title="Матрица 3×4: ранг, базисы и ядро" color={T.cyan} />

        <FBox tex="A = \begin{pmatrix} 1 & 2 & 1 & 3 \\ 2 & 4 & 1 & 5 \\ 1 & 2 & 0 & 2 \end{pmatrix}" />

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 1 — обнуляем первый столбец</div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: T.text }}>
                <M tex="R_2 \leftarrow R_2 - 2R_1" />, &ensp;<M tex="R_3 \leftarrow R_3 - R_1" />:
              </p>
              <F tex="\begin{pmatrix} 1&2&1&3 \\ 0&0&-1&-1 \\ 0&0&-1&-1 \end{pmatrix}" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 2 — обнуляем под ведущим строки 2</div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: T.text }}>
                Ведущий стоит в столбце 3: <M tex="R_3 \leftarrow R_3 - R_2" />:
              </p>
              <F tex="\begin{pmatrix} 1&2&1&3 \\ 0&0&-1&-1 \\ 0&0&0&0 \end{pmatrix}" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 3 — нормируем (приведённый ступенчатый вид)</div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: T.text }}>
                <M tex="R_2 \leftarrow -R_2" />, затем <M tex="R_1 \leftarrow R_1 - R_2" />:
              </p>
              <F tex="\begin{pmatrix} \mathbf{1}&2&0&2 \\ 0&0&\mathbf{1}&1 \\ 0&0&0&0 \end{pmatrix}" />
              <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted, textAlign: 'center' }}>Ведущие позиции: столбцы 1 и 3. <strong>rank = 2.</strong></p>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <Card style={{ borderTop: `3px solid ${T.primary}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Базис строк</div>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: T.text }}>Ненулевые строки ступенчатого вида:</p>
            <FBox tex="\{(1,2,0,2),\;(0,0,1,1)\}" color={T.primary} />
          </Card>
          <Card style={{ borderTop: `3px solid ${T.green}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Базис столбцов</div>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: T.text }}>Столбцы 1 и 3 <strong>исходной</strong> матрицы:</p>
            <F tex="c_1=\begin{pmatrix}1\\2\\1\end{pmatrix},\quad c_3=\begin{pmatrix}1\\1\\0\end{pmatrix}" />
          </Card>
        </div>

        {/* Ядро */}
        <Card style={{ marginTop: 14, borderLeft: `4px solid ${T.violet}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Новое понятие: ядро (нуль-пространство)</div>
          <FBox
            tex="\ker(A) = \{ x \in \mathbb{R}^n \mid Ax = \mathbf{0} \}"
            hint="«Убитые» вектора — те, что преобразование A отправляет в ноль"
            color={T.violet}
          />
          <div style={{ fontSize: 12, fontWeight: 800, color: T.violet, textTransform: 'uppercase', marginBottom: 8 }}>Нахождение ядра</div>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
            Из ступенчатого вида записываем систему <M tex="Ax = 0" />. Ведущие переменные: <M tex="x_1, x_3" />. Свободные: <M tex="x_2, x_4" />.
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: T.text }}>
            Выражаем: <M tex="x_3 = -x_4" />, &ensp;<M tex="x_1 = -2x_2 - 2x_4" />. Вводим параметры <M tex="x_2 = s,\; x_4 = t" />:
          </p>
          <F tex="x = s\begin{pmatrix}-2\\1\\0\\0\end{pmatrix} + t\begin{pmatrix}-2\\0\\-1\\1\end{pmatrix}" />
          <FBox
            tex="\operatorname{rank}(A) + \dim\ker(A) = n \quad\Rightarrow\quad 2 + 2 = 4 \;\checkmark"
            hint="Фундаментальная теорема (теорема о рангах)"
            color={T.violet}
          />
        </Card>

        <VideoPlaceholder
          title="Ранг и ядро — фундаментальная теорема"
          desc="Матрица ℝ³→ℝ² схлопывает куб в плоскость. Красная прямая уходит в ноль — это ядро. dim ker + rank = n"
          duration="22 сек"
          badge="Визуализация 4"
        />
      </section>

      {/* ── 8. Четыре подпространства ── */}
      <section id="four" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Обобщение" title="Четыре фундаментальных подпространства" color={T.green} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          Каждая матрица <M tex="A" /> размера <M tex="m \times n" /> разбивает миры <M tex="\mathbb{R}^n" /> и <M tex="\mathbb{R}^m" /> на четыре «комнаты»:
        </p>

        <FourSubspacesDiagram />

        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {['Подпространство', 'Обозначение', 'Где живёт', 'dim'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Пространство строк', sig: 'Row(A)', where: 'ℝⁿ', dim: 'r', color: T.primary },
                { name: 'Ядро', sig: 'ker(A)', where: 'ℝⁿ', dim: 'n − r', color: T.violet },
                { name: 'Пространство столбцов (образ)', sig: 'Col(A) = Im(A)', where: 'ℝᵐ', dim: 'r', color: T.green },
                { name: 'Левое ядро', sig: 'ker(Aᵀ)', where: 'ℝᵐ', dim: 'm − r', color: T.amber },
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.white : T.surface }}>
                  <td style={{ padding: '10px 14px', color: T.text, fontWeight: 600, border: `1px solid ${T.border}` }}>{row.name}</td>
                  <td style={{ padding: '10px 14px', border: `1px solid ${T.border}` }}><code style={{ fontSize: 12, color: row.color, fontWeight: 700 }}>{row.sig}</code></td>
                  <td style={{ padding: '10px 14px', color: T.muted, border: `1px solid ${T.border}` }}>{row.where}</td>
                  <td style={{ padding: '10px 14px', border: `1px solid ${T.border}` }}><code style={{ fontSize: 13, color: row.color, fontWeight: 800 }}>{row.dim}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DSNote>
          В Data Science: <strong>пространство строк</strong> — факторы вариации данных. <strong>Ядро</strong> — информация, теряемая при преобразовании. <strong>Пространство столбцов</strong> — достижимые результаты. <strong>Левое ядро</strong> — несовместные ограничения.
        </DSNote>
      </section>

      {/* ── 9. Свойства ── */}
      <section id="props" style={{ marginBottom: 52 }}>
        <SectionHeader icon={CheckCircle2} label="Шпаргалка" title="Ключевые свойства ранга" color={T.amber} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: '1', label: 'Границы', tex: '0 \\leq \\operatorname{rank}(A) \\leq \\min(m,n)', color: T.primary },
            { n: '2', label: 'Транспонирование', tex: '\\operatorname{rank}(A) = \\operatorname{rank}(A^\\top)', color: T.green },
            { n: '3', label: 'Произведение (ранг не растёт)', tex: '\\operatorname{rank}(AB) \\leq \\min(\\operatorname{rank}(A),\\,\\operatorname{rank}(B))', color: T.violet },
            { n: '4', label: 'Фундаментальная теорема', tex: '\\operatorname{rank}(A) + \\dim\\ker(A) = n', color: T.amber },
            { n: '5', label: 'Обратимость (квадратная)', tex: '\\operatorname{rank}(A) = n \\iff \\det A \\neq 0 \\iff A \\text{ обратима}', color: T.red },
            { n: '6', label: 'Умножение на обратимую', tex: '\\operatorname{rank}(PAQ) = \\operatorname{rank}(A), \\text{ если } P,Q \\text{ обратимы}', color: T.cyan },
          ].map(item => (
            <div key={item.n} style={{ display: 'flex', gap: 12, background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 18px', alignItems: 'flex-start' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{item.n}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                <F tex={item.tex} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 10. Data Science ── */}
      <section id="ds" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Code2} label="Применение" title="Ранг и базис в Data Science" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            {
              title: 'PCA',
              formula: '\\operatorname{rank}(X) \\text{ компонент}',
              desc: 'Ранг матрицы данных X — число настоящих независимых факторов вариации. PCA оставляет ровно rank(X) компонент для сохранения 100% информации.',
              ops: ['ранг', 'базис собств. векторов'],
              color: T.primary,
            },
            {
              title: 'Линейная регрессия',
              formula: '\\beta = (X^\\top X)^{-1} X^\\top y',
              desc: 'Если матрица признаков X имеет неполный ранг (мультиколлинеарность) — XᵀX вырождена, обратной нет. Нужно удалять зависимые признаки или регуляризовать (Ridge).',
              ops: ['полный ранг', 'ker = {0}'],
              color: T.green,
            },
            {
              title: 'SVD и сжатие',
              formula: 'A \\approx U_k \\Sigma_k V_k^\\top',
              desc: 'SVD раскладывает матрицу в сумму r матриц ранга 1. Усечённое SVD оставляет k < r компонент — основа сжатия изображений и рекомендательных систем.',
              ops: ['ранг 1', 'малоранговое приближение'],
              color: T.violet,
            },
            {
              title: 'Рекомендательные системы',
              formula: 'R \\approx U \\cdot V^\\top',
              desc: 'Ранг матрицы рейтингов (пользователи × фильмы) — число скрытых факторов вкусов. Низкоранговое приближение предсказывает пропущенные оценки.',
              ops: ['ранг', 'латентные факторы'],
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

      {/* ── 11. Самопроверка ── */}
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
            Переходите к вкладке <strong>Разбор</strong> — там 5 задач с пошаговым решением: от простого ранга до двухпараметрической матрицы. После — самостоятельные задания.
          </div>
        </div>
      </div>
    </div>
  );
}
