// @ts-nocheck
import { useState, useEffect } from 'react';
import {
  BookOpen, Grid3X3, Activity, Zap, Layers, Sigma,
  Brain, Code2, CheckCircle2, Sparkles, ArrowRight,
  Play, Pause, RotateCcw, Box, Target, ScanLine, Cpu,
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

// ─── SVD «Три шага» анимация ──────────────────────────────────────────────────

function ThreeStepsAnimation() {
  const steps = [
    {
      id: 'vt',
      label: 'Шаг 1: Vᵀ — поворот входа',
      desc: 'Окружность поворачивается как твёрдое тело. Мы выбираем «правильную» систему координат на входе: направления v₁ и v₂.',
      color: T.primary,
      shape: 'circle-rotated',
    },
    {
      id: 'sigma',
      label: 'Шаг 2: Σ — растяжение',
      desc: 'Повёрнутая окружность растягивается в эллипс строго вдоль осей. Горизонтальная ось × σ₁, вертикальная × σ₂.',
      color: T.green,
      shape: 'ellipse',
    },
    {
      id: 'u',
      label: 'Шаг 3: U — поворот выхода',
      desc: 'Эллипс поворачивается в финальное положение. Его оси смотрят вдоль u₁ и u₂ — левых сингулярных векторов.',
      color: T.amber,
      shape: 'ellipse-rotated',
    },
  ];

  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % steps.length), 2800);
    return () => clearInterval(t);
  }, []);

  const s = steps[active];

  const renderShape = (shape: string, color: string) => {
    const cx = 50, cy = 50;
    if (shape === 'circle-rotated') {
      return (
        <>
          <circle cx={cx} cy={cy} r={32} fill={`${color}18`} stroke={color} strokeWidth={2.5} />
          <line x1={cx - 22} y1={cy - 22} x2={cx + 22} y2={cy + 22} stroke={color} strokeWidth={2} strokeDasharray="4,2" />
          <line x1={cx + 22} y1={cy - 22} x2={cx - 22} y2={cy + 22} stroke={`${color}80`} strokeWidth={2} strokeDasharray="4,2" />
        </>
      );
    }
    if (shape === 'ellipse') {
      return (
        <>
          <circle cx={cx} cy={cy} r={28} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3,4" />
          <ellipse cx={cx} cy={cy} rx={42} ry={22} fill={`${color}18`} stroke={color} strokeWidth={2.5} />
          <line x1={cx - 42} y1={cy} x2={cx + 42} y2={cy} stroke={color} strokeWidth={2} />
          <line x1={cx} y1={cy - 22} x2={cx} y2={cy + 22} stroke={`${color}80`} strokeWidth={2} />
        </>
      );
    }
    if (shape === 'ellipse-rotated') {
      return (
        <>
          <circle cx={cx} cy={cy} r={28} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3,4" />
          <g transform={`rotate(-35 ${cx} ${cy})`}>
            <ellipse cx={cx} cy={cy} rx={42} ry={22} fill={`${color}18`} stroke={color} strokeWidth={2.5} />
            <line x1={cx - 42} y1={cy} x2={cx + 42} y2={cy} stroke={color} strokeWidth={2} />
            <line x1={cx} y1={cy - 22} x2={cx} y2={cy + 22} stroke={`${color}80`} strokeWidth={2} />
          </g>
        </>
      );
    }
    return null;
  };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', margin: '18px 0' }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>SVD: три шага</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted }}>шаг {active + 1} / {steps.length}</span>
      </div>
      <div style={{ padding: '18px 22px', minHeight: 120, display: 'flex', alignItems: 'center', gap: 22 }}>
        <svg width={100} height={100} viewBox="0 0 100 100">
          <rect x={0} y={0} width={100} height={100} rx={12} fill={`${s.color}08`} stroke={`${s.color}20`} strokeWidth={1} />
          {renderShape(s.shape, s.color)}
        </svg>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginBottom: 5 }}>{s.label}</div>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{s.desc}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '10px 18px 14px', justifyContent: 'center' }}>
        {steps.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: 8, height: 8, borderRadius: '50%', background: i === active ? T.primary : T.border, border: 'none', cursor: 'pointer', padding: 0, transition: 'background 0.2s' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Пошаговое вычисление SVD ─────────────────────────────────────────────────

function SVDStepsAnimation() {
  const steps = [
    {
      label: 'Составляем AᵀA',
      formula: 'A^T A = \\begin{pmatrix}25&20\\\\20&25\\end{pmatrix}',
      desc: 'Симметричная матрица. Её собственные значения дадут σ².',
      highlight: 'ata',
    },
    {
      label: 'λ₁ = 45, λ₂ = 5',
      formula: '(25-\\lambda)^2 = 400 \\Rightarrow \\lambda_1 = 45,\\; \\lambda_2 = 5',
      desc: 'Характеристическое уравнение. Оба λ > 0 — матрица полного ранга.',
      highlight: 'eigenvalues',
    },
    {
      label: 'σ₁ = √45 ≈ 6.71, σ₂ = √5 ≈ 2.24',
      formula: '\\sigma_i = \\sqrt{\\lambda_i}',
      desc: 'Сингулярные числа — корни из собственных значений. Всегда ≥ 0.',
      highlight: 'sigma',
    },
    {
      label: 'Правые векторы V',
      formula: 'v_1 = \\tfrac{1}{\\sqrt{2}}\\begin{pmatrix}1\\\\1\\end{pmatrix},\\; v_2 = \\tfrac{1}{\\sqrt{2}}\\begin{pmatrix}1\\\\-1\\end{pmatrix}',
      desc: 'Собственные векторы AᵀA. Ортогональны — так и должно быть.',
      highlight: 'v',
    },
    {
      label: 'Левые векторы U',
      formula: 'u_i = \\frac{1}{\\sigma_i} A v_i',
      desc: 'Применяем A к v_i и нормируем. Получаем направления осей эллипса.',
      highlight: 'u',
    },
    {
      label: 'Результат: A = UΣVᵀ',
      formula: 'A = U \\Sigma V^T = \\begin{pmatrix}3&0\\\\4&5\\end{pmatrix} \\checkmark',
      desc: 'Проверка: перемножение трёх матриц даёт исходную A.',
      highlight: 'result',
    },
  ];

  const [step, setStep] = useState(0);
  const s = steps[step];

  const hlColor: Record<string, string> = {
    ata: T.violet,
    eigenvalues: T.primary,
    sigma: T.green,
    v: T.cyan,
    u: T.amber,
    result: T.green,
  };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', margin: '18px 0' }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>Вычисление SVD — шаг за шагом</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted }}>{step + 1} / {steps.length}</span>
      </div>
      <div style={{ padding: '18px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: hlColor[s.highlight], marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
        <div style={{ background: `${hlColor[s.highlight]}10`, border: `1px solid ${hlColor[s.highlight]}30`, borderRadius: 12, padding: '10px 16px', marginBottom: 10 }}>
          <F tex={s.formula} />
        </div>
        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{s.desc}</div>
      </div>
      <div style={{ padding: '10px 18px 14px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, fontWeight: 700, color: step === 0 ? T.mutedLight : T.text, cursor: step === 0 ? 'default' : 'pointer' }}>← Назад</button>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}
          style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.primary, fontSize: 12, fontWeight: 700, color: T.white, cursor: step === steps.length - 1 ? 'default' : 'pointer', opacity: step === steps.length - 1 ? 0.5 : 1 }}>Вперёд →</button>
        <button onClick={() => setStep(0)}
          style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, fontWeight: 600, color: T.muted, cursor: 'pointer' }}>
          <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />Сначала</button>
      </div>
    </div>
  );
}

// ─── Диаграмма: SVD и 4 подпространства ──────────────────────────────────────

function SVDSubspacesDiagram() {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '24px 16px', margin: '20px 0', overflowX: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
        SVD и четыре фундаментальных подпространства
      </div>
      <svg viewBox="0 0 640 320" style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto' }}>
        {/* Rn */}
        <text x="150" y="28" textAnchor="middle" fontSize="13" fontWeight="800" fill={T.text}>ℝⁿ</text>
        <text x="150" y="44" textAnchor="middle" fontSize="10" fill={T.muted}>(n столбцов)</text>

        {/* Rm */}
        <text x="490" y="28" textAnchor="middle" fontSize="13" fontWeight="800" fill={T.text}>ℝᵐ</text>
        <text x="490" y="44" textAnchor="middle" fontSize="10" fill={T.muted}>(m строк)</text>

        {/* Box: V_r (строки) */}
        <rect x="20" y="56" width="200" height="100" rx="12" fill={`${T.primary}10`} stroke={T.primaryBorder} strokeWidth="1.5" />
        <text x="120" y="88" textAnchor="middle" fontSize="12" fontWeight="700" fill={T.primary}>Пространство строк</text>
        <text x="120" y="106" textAnchor="middle" fontSize="11" fontFamily="monospace" fill={T.muted}>v₁, …, vᵣ</text>
        <rect x="62" y="116" width="116" height="22" rx="11" fill={`${T.primary}18`} />
        <text x="120" y="132" textAnchor="middle" fontSize="11" fontWeight="700" fill={T.primary}>dim = r</text>

        {/* Box: V_{n-r} (ядро) */}
        <rect x="20" y="178" width="200" height="100" rx="12" fill={`${T.violet}10`} stroke={`${T.violet}40`} strokeWidth="1.5" />
        <text x="120" y="210" textAnchor="middle" fontSize="12" fontWeight="700" fill={T.violet}>Ядро</text>
        <text x="120" y="228" textAnchor="middle" fontSize="11" fontFamily="monospace" fill={T.muted}>vᵣ₊₁, …, vₙ</text>
        <rect x="56" y="238" width="128" height="22" rx="11" fill={`${T.violet}18`} />
        <text x="120" y="254" textAnchor="middle" fontSize="11" fontWeight="700" fill={T.violet}>dim = n − r</text>

        {/* Box: U_r (столбцы) */}
        <rect x="420" y="56" width="200" height="100" rx="12" fill={`${T.green}10`} stroke={`${T.green}40`} strokeWidth="1.5" />
        <text x="520" y="88" textAnchor="middle" fontSize="12" fontWeight="700" fill={T.green}>Пространство столбцов</text>
        <text x="520" y="106" textAnchor="middle" fontSize="11" fontFamily="monospace" fill={T.muted}>u₁, …, uᵣ</text>
        <rect x="462" y="116" width="116" height="22" rx="11" fill={`${T.green}18`} />
        <text x="520" y="132" textAnchor="middle" fontSize="11" fontWeight="700" fill={T.green}>dim = r</text>

        {/* Box: U_{m-r} (лев ядро) */}
        <rect x="420" y="178" width="200" height="100" rx="12" fill={`${T.amber}10`} stroke={`${T.amber}40`} strokeWidth="1.5" />
        <text x="520" y="210" textAnchor="middle" fontSize="12" fontWeight="700" fill={T.amber}>Левое ядро</text>
        <text x="520" y="228" textAnchor="middle" fontSize="11" fontFamily="monospace" fill={T.muted}>uᵣ₊₁, …, uₘ</text>
        <rect x="455" y="238" width="130" height="22" rx="11" fill={`${T.amber}18`} />
        <text x="520" y="254" textAnchor="middle" fontSize="11" fontWeight="700" fill={T.amber}>dim = m − r</text>

        {/* Sigma arrow */}
        <defs>
          <marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={T.green} />
          </marker>
          <marker id="arr3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
          </marker>
        </defs>
        <line x1="222" y1="106" x2="418" y2="106" stroke={T.green} strokeWidth="2" markerEnd="url(#arr2)" />
        <rect x="283" y="88" width="74" height="28" rx="8" fill={T.white} stroke={`${T.green}40`} strokeWidth="1" />
        <text x="320" y="104" textAnchor="middle" fontSize="12" fontWeight="800" fill={T.green}>Σ (σ₁…σᵣ)</text>

        <line x1="222" y1="228" x2="418" y2="228" stroke={T.violet} strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arr3)" />
        <text x="320" y="222" textAnchor="middle" fontSize="11" fontWeight="700" fill={T.violet}>→ 0</text>

        {/* ⊥ */}
        <text x="120" y="168" textAnchor="middle" fontSize="14" fill={T.muted}>⊥</text>
        <text x="520" y="168" textAnchor="middle" fontSize="14" fill={T.muted}>⊥</text>

        {/* Labels */}
        <text x="120" y="292" textAnchor="middle" fontSize="11" fill={T.muted}>r + (n−r) = n</text>
        <text x="520" y="292" textAnchor="middle" fontSize="11" fill={T.muted}>r + (m−r) = m</text>
      </svg>
    </div>
  );
}

// ─── Секция самопроверки ──────────────────────────────────────────────────────

function CheckQuestions() {
  const questions = [
    {
      q: 'У матрицы A размера 5×3 ранг равен 3. Сколько ненулевых сингулярных чисел?',
      options: ['5', '3', '8', '2'],
      correct: 1,
      explanation: 'Ранг = число ненулевых σᵢ = 3. Максимальный ранг матрицы 5×3 равен min(5,3) = 3.',
    },
    {
      q: 'Чему равна спектральная норма ‖A‖₂ через сингулярные числа?',
      options: ['σ₁ + σ₂ + …', 'σ₁ (максимальное)', '√(σ₁² + σ₂² + …)', 'σ₁ / σₙ'],
      correct: 1,
      explanation: '‖A‖₂ = σ₁. Максимальное растяжение матрицей A достигается вдоль первого сингулярного вектора.',
    },
    {
      q: 'Как связаны сингулярные числа A и собственные значения AᵀA?',
      options: ['σᵢ = λᵢ(AᵀA)', 'σᵢ = √λᵢ(AᵀA)', 'σᵢ = λᵢ(AᵀA)²', 'никак не связаны'],
      correct: 1,
      explanation: 'σᵢ = √λᵢ(AᵀA). Собственные значения AᵀA всегда ≥ 0 (матрица полуопределена), поэтому корень берётся корректно.',
    },
    {
      q: 'Если A — ортогональная матрица (AᵀA = I), чему равны все σᵢ?',
      options: ['0', '1', 'det(A)', 'произвольны'],
      correct: 1,
      explanation: 'Все σᵢ = 1. AᵀA = I означает λᵢ = 1 для всех i → σᵢ = √1 = 1. Ортогональная матрица — поворот без растяжения.',
    },
    {
      q: 'В SVD матрицы 4×4 третье сингулярное число равно нулю. Каков ранг?',
      options: ['4', '3', '2', '1'],
      correct: 2,
      explanation: 'σ₃ = 0 и σ₄ = 0, ненулевых — два: σ₁ и σ₂. Ранг = число ненулевых σᵢ = 2.',
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
                style={{ marginTop: 10, padding: '6px 14px', borderRadius: 10, background: T.primary, color: T.white, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Проверить</button>
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

export default function SVDTheoryRich() {
  const navSections = [
    { id: 'why',       label: 'Зачем это' },
    { id: 'geo',       label: 'Геометрия' },
    { id: 'algebra',   label: 'Алгебра' },
    { id: 'definition','label': 'Определение' },
    { id: 'example',   label: 'Пример 2×2' },
    { id: 'props',     label: 'Свойства' },
    { id: 'four',      label: '4 подпространства' },
    { id: 'links',     label: 'Связи' },
    { id: 'ds',        label: 'Data Science' },
    { id: 'check',     label: 'Проверь себя' },
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
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>Сингулярное разложение (SVD)</h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16 }}>Как разложить любую матрицу в три простых действия — и почему это «швейцарский нож» вычислительной математики.</p>
      </div>

      {/* ── Навигация ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 48 }}>
        {navSections.map(s => (
          <a key={s.id} href={`#${s.id}`} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${T.primary}0f`, color: T.primary, border: `1px solid ${T.primaryBorder}`, textDecoration: 'none' }}>
            {s.label}
          </a>
        ))}
      </div>

      {/* ── 0. Зачем ── */}
      <section id="why" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sparkles} label="Мотивация" title="Зачем это вообще нужно" />

        <div style={{ background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Задача сжатия изображений</div>
          <p style={{ margin: '0 0 10px', color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Фотография <strong>1000×1000 пикселей</strong> — это 1 000 000 чисел. Канал связи медленный. Вы хотите передать 50 000 чисел, а друг восстановит картинку почти без потерь.
          </p>
          <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.8 }}>
            Это возможно — потому что матрица изображения имеет низкий <strong>эффективный ранг</strong>. Большинство информации содержится в первых нескольких сингулярных компонентах.
          </p>
        </div>

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          SVD (Singular Value Decomposition) разлагает <strong>любую</strong> матрицу на три части и ранжирует их по важности. Первая часть — самая «весомая», последняя — наименее. Отбрасывая хвост, получаем оптимальное сжатие.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { n: '1', title: 'Геометрия', d: 'Любое преобразование = поворот + растяжение + поворот', color: T.primary },
            { n: '2', title: 'Алгебра AᵀA', d: 'Связь с собственными значениями', color: T.violet },
            { n: '3', title: 'Матрицы U, Σ, V', d: 'Формальное определение и размеры', color: T.green },
            { n: '4', title: 'Вычисление', d: 'Полный разбор SVD для 2×2 вручную', color: T.amber },
            { n: '5', title: 'Применения', d: 'PCA, сжатие, псевдообращение', color: T.cyan },
          ].map(item => (
            <div key={item.n} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{item.n}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>

        {/* Метафора рентгена */}
        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Метафора: томография матрицы</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            Матрица — это человек. SVD — томограф. Три слоя снимка: <em>скелет</em> (<M tex="V^T" />), <em>размеры органов</em> (<M tex="\Sigma" />), <em>внешняя форма</em> (<M tex="U" />).
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.primary, background: T.primaryLight, borderRadius: 20, padding: '3px 12px' }}>Vᵀ = поворот входа</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.green, background: T.greenLight, borderRadius: 20, padding: '3px 12px' }}>Σ = масштаб</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.amber, background: T.amberLight, borderRadius: 20, padding: '3px 12px' }}>U = поворот выхода</span>
          </div>
        </Card>
      </section>

      {/* ── 1. Геометрический вход ── */}
      <section id="geo" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Activity} label="Понятие 1" title="Геометрический вход: окружность → эллипс" color={T.green} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
          Умножим матрицу <M tex="A" /> на все единичные векторы. Что получится?
        </p>

        <Card style={{ borderLeft: `4px solid ${T.green}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Образ единичной окружности — эллипс</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            Для любой матрицы <M tex="A" /> образ единичной окружности — эллипс (или отрезок при вырождении). У эллипса есть:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 8 }}>
            {[
              { label: 'Правые сингулярные векторы v₁, v₂', d: 'Направления на входе, которые становятся осями эллипса', color: T.primary },
              { label: 'Сингулярные числа σ₁, σ₂', d: 'Длины полуосей эллипса — насколько растянулось каждое направление', color: T.green },
              { label: 'Левые сингулярные векторы u₁, u₂', d: 'Направления осей эллипса на выходе', color: T.amber },
            ].map(item => (
              <div key={item.label} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>

        <FBox
          tex="A v_i = \sigma_i u_i"
          hint="Главная формула SVD: вектор vᵢ на входе → σᵢ раз растягивается → в направление uᵢ на выходе"
        />

        <Callout color={T.violet} title="SVD vs собственные векторы">
          Для собственных векторов: <M tex="Av = \lambda v" /> — вход и выход одно направление. В SVD: <M tex="Av_i = \sigma_i u_i" /> — вход <M tex="v_i" /> и выход <M tex="u_i" /> разные. В этом принципиальная разница.
        </Callout>

        {/* Анимация трёх шагов */}
        <ThreeStepsAnimation />

        <VideoPlaceholder
          title="SVD за 25 секунд: три шага"
          desc="Единичная окружность проходит три стадии: Vᵀ (поворот), Σ (растяжение в эллипс), U (финальный поворот). Итог = действие A напрямую"
          duration="25 сек"
          badge="Видео 1"
        />

        <VideoPlaceholder
          title="Сингулярные векторы: от входа к выходу"
          desc="v₁ и v₂ на окружности → оси эллипса σ₁u₁ и σ₂u₂. Оба набора ортогональны. Формула A vᵢ = σᵢ uᵢ"
          duration="20 сек"
          badge="Видео 2"
        />
      </section>

      {/* ── 2. Алгебраический вход ── */}
      <section id="algebra" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Инструмент" title="Алгебраический вход: матрица AᵀA" color={T.amber} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 12 }}>
          Как найти <M tex="v_i" />, <M tex="u_i" />, <M tex="\sigma_i" />? Берём формулу <M tex="Av = \sigma u" /> и умножаем слева на <M tex="A^T" />:
        </p>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Вывод: vᵢ — собственные векторы AᵀA</div>
          <F tex="A^T A\, v = \sigma^2 v" />
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            Это уравнение на собственные значения! <M tex="v" /> — собственный вектор <M tex="A^T A" />, а <M tex="\sigma^2" /> — его собственное значение.
          </p>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Алгоритм нахождения SVD</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { n: '1', s: 'Составляем AᵀA (размер n×n)', color: T.violet },
              { n: '2', s: 'Находим собственные значения: λ₁ ≥ λ₂ ≥ … ≥ λᵣ > 0', color: T.primary },
              { n: '3', s: 'σᵢ = √λᵢ — сингулярные числа', color: T.green },
              { n: '4', s: 'vᵢ — собственные векторы AᵀA (ортонормируем)', color: T.cyan },
              { n: '5', s: 'uᵢ = (1/σᵢ) A vᵢ — левые сингулярные векторы', color: T.amber },
              { n: '6', s: 'Если m > r — дополняем U ортонормированными векторами из ker(AᵀA)', color: T.muted },
            ].map(item => (
              <div key={item.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${item.color}18`, color: item.color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{item.n}</span>
                <span style={{ fontSize: 13, color: T.text, lineHeight: 1.65 }}>{item.s}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Свойства AᵀA и AAᵀ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {[
              { t: 'Обе симметричны', d: '(AᵀA)ᵀ = AᵀA', color: T.primary },
              { t: 'Полуопределены', d: 'Все собственные значения ≥ 0', color: T.green },
              { t: 'Одинаковые λ ≠ 0', d: 'Ненулевые собственные значения совпадают', color: T.amber },
              { t: 'Общий ранг', d: 'rank(AᵀA) = rank(AAᵀ) = rank(A)', color: T.violet },
            ].map(item => (
              <div key={item.t} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.t}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── 3. Формальное определение ── */}
      <section id="definition" style={{ marginBottom: 52 }}>
        <SectionHeader icon={BookOpen} label="Определение" title="Формальное определение SVD" color={T.violet} />

        <Card style={{ borderLeft: `4px solid ${T.violet}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Теорема (SVD)</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.75 }}>
            Для любой вещественной матрицы <M tex="A" /> размера <M tex="m \times n" /> ранга <M tex="r" /> существуют:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 10 }}>
            {[
              { l: 'U (m×m)', d: 'Ортогональная: Uᵀ U = Iₘ. Столбцы — левые сингулярные векторы.', color: T.amber },
              { l: 'Σ (m×n)', d: 'Псевдодиагональная: σ₁ ≥ … ≥ σᵣ > 0 на диагонали, остальное — нули.', color: T.green },
              { l: 'V (n×n)', d: 'Ортогональная: Vᵀ V = Iₙ. Столбцы — правые сингулярные векторы.', color: T.primary },
            ].map(item => (
              <div key={item.l} style={{ background: `${item.color}0a`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.l}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </Card>

        <FBox
          tex="A = U \Sigma V^T"
          hint="SVD существует для ЛЮБОЙ матрицы: прямоугольной, вырожденной, любого размера"
          color={T.violet}
        />

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>Размеры матриц для A размера 3×2</div>
          <F tex="A_{3 \times 2} = U_{3 \times 3}\;\Sigma_{3 \times 2}\;V^T_{2 \times 2}" />
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.muted, lineHeight: 1.7, textAlign: 'center' }}>
            <M tex="\Sigma" /> имеет тот же формат, что и <M tex="A" />. Не квадратная! Ненулевая часть — квадрат <M tex="r \times r" /> в левом верхнем углу.
          </p>
        </Card>

        <Callout color={T.green} title="SVD vs спектральное разложение">
          Спектральное разложение требует диагонализуемости (и часто симметричности). SVD — <strong>без условий</strong>, для любой матрицы. Плюс оба набора векторов U и V всегда ортогональны.
        </Callout>

        <VideoPlaceholder
          title="SVD vs собственные векторы"
          desc="Симметричная матрица: SVD совпадает с собственным разложением. Несимметричная: собственные векторы не ортогональны, а сингулярные — всегда"
          duration="22 сек"
          badge="Видео 5"
        />
      </section>

      {/* ── 4. Пример 2×2 ── */}
      <section id="example" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Grid3X3} label="Пример" title="Полное вычисление SVD 2×2 вручную" color={T.green} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 10 }}>
          Разберём пошагово. Пусть:
        </p>
        <FBox tex="A = \begin{pmatrix}3&0\\4&5\end{pmatrix}" />

        {/* Интерактивные шаги */}
        <SVDStepsAnimation />

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 1 — составляем AᵀA</div>
              <F tex="A^T A = \begin{pmatrix}3&4\\0&5\end{pmatrix}\begin{pmatrix}3&0\\4&5\end{pmatrix} = \begin{pmatrix}25&20\\20&25\end{pmatrix}" />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 2 — собственные значения</div>
              <F tex="\det(A^T A - \lambda I) = (25-\lambda)^2 - 400 = 0 \implies \lambda_1 = 45,\;\lambda_2 = 5" />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 3 — сингулярные числа</div>
              <F tex="\sigma_1 = \sqrt{45} = 3\sqrt{5} \approx 6.71, \quad \sigma_2 = \sqrt{5} \approx 2.24" />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.cyan, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 4 — правые сингулярные векторы V</div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: T.text }}>Для <M tex="\lambda_1 = 45" />: <M tex="-20x_1 + 20x_2 = 0 \Rightarrow x_1 = x_2" /></p>
              <F tex="v_1 = \frac{1}{\sqrt{2}}\begin{pmatrix}1\\1\end{pmatrix}, \quad v_2 = \frac{1}{\sqrt{2}}\begin{pmatrix}1\\-1\end{pmatrix}" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Проверка: <M tex="v_1^T v_2 = 0" /> — ортогональны ✓</p>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.amber, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 5 — левые сингулярные векторы U</div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: T.text }}>По формуле <M tex="u_i = \frac{1}{\sigma_i} A v_i" />:</p>
              <F tex="u_1 = \frac{1}{\sqrt{90}}\begin{pmatrix}3\\9\end{pmatrix} \approx \begin{pmatrix}0.316\\0.949\end{pmatrix}, \quad u_2 = \frac{1}{\sqrt{10}}\begin{pmatrix}3\\-1\end{pmatrix} \approx \begin{pmatrix}0.949\\-0.316\end{pmatrix}" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Проверка: <M tex="u_1^T u_2 = 0" /> — ортогональны ✓</p>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 6 — результат: A = UΣVᵀ ✓</div>
              <F tex="A = \begin{pmatrix}0.316&0.949\\0.949&-0.316\end{pmatrix} \begin{pmatrix}6.71&0\\0&2.24\end{pmatrix} \frac{1}{\sqrt{2}}\begin{pmatrix}1&1\\1&-1\end{pmatrix} = \begin{pmatrix}3&0\\4&5\end{pmatrix}\;\checkmark" />
            </div>
          </div>
        </Card>

        <VideoPlaceholder
          title="Падение ранга: σ₂ → 0"
          desc="Ползунок меняет матрицу. Эллипс схлопывается в отрезок когда σ₂ = 0. Ядро вырастает, ранг падает"
          duration="18 сек"
          badge="Видео 3"
        />
      </section>

      {/* ── 5. Ключевые свойства ── */}
      <section id="props" style={{ marginBottom: 52 }}>
        <SectionHeader icon={CheckCircle2} label="Шпаргалка" title="Ключевые свойства SVD" color={T.amber} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            {
              n: '1', label: 'Ранг через σ',
              tex: '\\operatorname{rank}(A) = r = \\text{число ненулевых }\\sigma_i',
              color: T.primary,
            },
            {
              n: '2', label: 'Спектральная норма',
              tex: '\\|A\\|_2 = \\sigma_1',
              color: T.green,
            },
            {
              n: '3', label: 'Норма Фробениуса',
              tex: '\\|A\\|_F = \\sqrt{\\sigma_1^2 + \\sigma_2^2 + \\cdots + \\sigma_r^2}',
              color: T.violet,
            },
            {
              n: '4', label: 'Число обусловленности',
              tex: '\\kappa(A) = \\frac{\\sigma_{\\max}}{\\sigma_{\\min}} = \\frac{\\sigma_1}{\\sigma_n}',
              color: T.amber,
            },
            {
              n: '5', label: 'Связь с собственными значениями',
              tex: '\\sigma_i = \\sqrt{\\lambda_i(A^T A)}',
              color: T.cyan,
            },
            {
              n: '6', label: 'SVD существует всегда',
              tex: '\\forall A \\in \\mathbb{R}^{m \\times n} \\;\\exists\\; A = U\\Sigma V^T',
              color: T.red,
            },
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

        <Callout color={T.primary} title="Разложение в сумму матриц ранга 1">
          SVD раскладывает матрицу в взвешенную сумму:
          <F tex="A = \sigma_1 u_1 v_1^T + \sigma_2 u_2 v_2^T + \cdots + \sigma_r u_r v_r^T" />
          Каждое слагаемое — матрица ранга 1. Первое — самое «весомое». Это ключевая идея сжатия и PCA.
        </Callout>

        <VideoPlaceholder
          title="Матрица как сумма слоёв ранга 1"
          desc="Пустой кадр → σ₁u₁v₁ᵀ (отрезок) → добавляем σ₂u₂v₂ᵀ → полноценный эллипс. Слои ранжированы по важности"
          duration="22 сек"
          badge="Видео 4"
        />
      </section>

      {/* ── 6. SVD и 4 подпространства ── */}
      <section id="four" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Обобщение" title="SVD и четыре подпространства" color={T.green} />

        <p style={{ color: T.text, lineHeight: 1.8, marginBottom: 16 }}>
          SVD даёт ортонормированные базисы для всех четырёх фундаментальных подпространств — лучшие из возможных.
        </p>

        <SVDSubspacesDiagram />

        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {['Подпространство', 'Базис из SVD', 'Где живёт', 'dim'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Пространство столбцов', basis: 'u₁, …, uᵣ — первые r столбцов U', where: 'ℝᵐ', dim: 'r', color: T.primary },
                { name: 'Левое ядро', basis: 'uᵣ₊₁, …, uₘ — последние m−r столбцов U', where: 'ℝᵐ', dim: 'm − r', color: T.violet },
                { name: 'Пространство строк', basis: 'v₁, …, vᵣ — первые r столбцов V', where: 'ℝⁿ', dim: 'r', color: T.green },
                { name: 'Ядро', basis: 'vᵣ₊₁, …, vₙ — последние n−r столбцов V', where: 'ℝⁿ', dim: 'n − r', color: T.amber },
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.white : T.surface }}>
                  <td style={{ padding: '10px 14px', color: T.text, fontWeight: 600, border: `1px solid ${T.border}` }}>{row.name}</td>
                  <td style={{ padding: '10px 14px', color: T.muted, fontSize: 12, border: `1px solid ${T.border}` }}>{row.basis}</td>
                  <td style={{ padding: '10px 14px', color: T.muted, border: `1px solid ${T.border}` }}>{row.where}</td>
                  <td style={{ padding: '10px 14px', border: `1px solid ${T.border}` }}><code style={{ fontSize: 13, color: row.color, fontWeight: 800 }}>{row.dim}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout color={T.cyan} title="Почему ортонормированные базисы лучше">
          В теме «Ранг и базис» базисы находились методом Гаусса — они не ортогональны. SVD-базисы ортогональны и нормированы. Это делает вычисления проекций, наименьших квадратов и псевдообращений значительно проще.
        </Callout>
      </section>

      {/* ── 7. Связи с другими темами ── */}
      <section id="links" style={{ marginBottom: 52 }}>
        <SectionHeader icon={ArrowRight} label="Связи" title="Связь с другими темами" color={T.cyan} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            {
              dir: '←', topic: 'Ранг и базис',
              desc: 'SVD даёт ортонормированные базисы всех четырёх подпространств. Ранг = число ненулевых σᵢ.',
              color: T.primary,
            },
            {
              dir: '←', topic: 'Собственные значения',
              desc: 'σᵢ² = λᵢ(AᵀA). Сингулярные векторы — собственные векторы AᵀA и AAᵀ.',
              color: T.violet,
            },
            {
              dir: '→', topic: 'PCA (Часть 2)',
              desc: 'SVD на центрированной матрице данных = PCA. Правые сингулярные векторы = главные компоненты.',
              color: T.green,
            },
            {
              dir: '→', topic: 'Псевдообращение (Часть 2)',
              desc: 'A⁺ = V Σ⁺ Uᵀ решает задачу наименьших квадратов даже для несквадратных матриц.',
              color: T.amber,
            },
          ].map(item => (
            <Card key={item.topic} style={{ borderTop: `3px solid ${item.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: item.color, background: `${item.color}18`, borderRadius: 20, padding: '2px 8px' }}>{item.dir}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{item.topic}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 8. Data Science ── */}
      <section id="ds" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Code2} label="Применение" title="SVD в Data Science" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            {
              title: 'Сжатие изображений',
              formula: 'A_k = \\sum_{i=1}^k \\sigma_i u_i v_i^T',
              desc: 'Оставляем k главных компонент. Чем меньше k — тем сильнее сжатие. Теорема Эккарта–Янга: это оптимальное приближение ранга k.',
              ops: ['низкоранговая аппроксимация', 'оптимальность'],
              color: T.primary,
            },
            {
              title: 'PCA',
              formula: 'X = U\\Sigma V^T',
              desc: 'SVD центрированной матрицы данных — это PCA. Правые сингулярные векторы = главные компоненты. Сингулярные числа ↔ объясненная дисперсия.',
              ops: ['главные компоненты', 'снижение размерности'],
              color: T.green,
            },
            {
              title: 'Рекомендательные системы',
              formula: 'R \\approx U_k\\Sigma_k V_k^T',
              desc: 'Матрица рейтингов (пользователи × фильмы) имеет низкий эффективный ранг — «скрытые жанры». SVD предсказывает пропущенные оценки (Netflix Prize).',
              ops: ['латентные факторы', 'матричная факторизация'],
              color: T.violet,
            },
            {
              title: 'Псевдообращение',
              formula: 'A^+ = V\\Sigma^+ U^T',
              desc: 'Обобщение обратной матрицы на прямоугольные и вырожденные матрицы. Даёт наилучшее решение системы Ax = b по методу наименьших квадратов.',
              ops: ['наименьшие квадраты', 'вырожденные системы'],
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

        <DSNote>
          Практически каждый алгоритм снижения размерности, рекомендательные системы и методы решения переопределённых систем уравнений используют SVD под капотом — напрямую или через близкие разложения.
        </DSNote>
      </section>

      {/* ── 9. Самопроверка ── */}
      <section id="check" style={{ marginBottom: 52 }}>
        <SectionHeader icon={CheckCircle2} label="Самопроверка" title="Проверь себя" color={T.amber} />
        <CheckQuestions />
      </section>

      {/* Footer */}
      <div style={{ background: T.primaryLight, borderRadius: 20, padding: '22px 28px', border: `1px solid ${T.primaryBorder}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <Sparkles size={18} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, color: T.primaryDark, marginBottom: 4 }}>Что дальше — Часть 2</div>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
            В Части 2: как сжимать изображения через низкоранговую аппроксимацию, почему PCA — это SVD, рекомендательные системы (Netflix-подход) и псевдообращение для нерешаемых систем. Переходите к вкладке <strong>Лаборатории</strong> — там интерактивный стенд SVD.
          </div>
        </div>
      </div>
    </div>
  );
}
