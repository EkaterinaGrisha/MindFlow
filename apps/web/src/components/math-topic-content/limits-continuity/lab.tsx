// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { LabBody, LabShell } from '../shared/labShell';

// ─── Design tokens (идентично matrix-operations) ──────────────────────────────
const T = {
  text:          '#1e293b',
  muted:         '#64748b',
  mutedLight:    '#94a3b8',
  primary:       '#6366f1',
  primaryLight:  '#eef2ff',
  primaryBorder: '#c7d2fe',
  primaryDark:   '#4f46e5',
  accent:        '#7c3aed',
  green:         '#10b981',
  greenLight:    '#d1fae5',
  amber:         '#f59e0b',
  amberLight:    '#fef3c7',
  red:           '#ef4444',
  redLight:      '#fee2e2',
  white:         '#ffffff',
  surface:       '#f8fafc',
  border:        '#e2e8f0',
  cyan:          '#06b6d4',
  violet:        '#8b5cf6',
  pink:          '#ec4899',
};

// ─── Shared UI primitives (идентично matrix-operations) ───────────────────────
function LabHeader({ title, question, badge }: { title: string; question: string; badge: string }) {
  return (
    <div style={{ borderRadius: 18, background: `linear-gradient(135deg,${T.primaryLight} 0%,${T.white} 60%,#f0fdf4 100%)`, border: `1px solid ${T.primaryBorder}`, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: T.primary, textTransform: 'uppercase' as const, background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '3px 10px' }}>{badge}</span>
      </div>
      <h3 style={{ margin: '0 0 7px', fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1.25 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>
        <strong style={{ color: T.text }}>Исследовательский вопрос:</strong> {question}
      </p>
    </div>
  );
}

function InfoCard({ color = T.primary, title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}0c`, border: `1px solid ${color}35`, borderRadius: 13, padding: '12px 15px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Callout({ color = T.amber, title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 11, padding: '11px 15px', marginTop: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function StatBadge({ label, value, color = T.primary }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 9, background: `${color}0c`, border: `1px solid ${color}30` }}>
      <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
    </div>
  );
}

function PresetButton({ active, onClick, label, color = T.primary }: { active?: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: active ? color : T.white, color: active ? T.white : T.text, border: `1.5px solid ${active ? color : T.border}`, transition: 'all 0.15s' }}>
      {label}
    </button>
  );
}

function SectionLabel({ children, color = T.muted }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color, textTransform: 'uppercase' as const, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Collapsible({ title, children, color = T.primary }: { title: string; children: React.ReactNode; color?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${color}30`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: `${color}08`, border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{title}</span>
        {open ? <ChevronUp size={14} color={color} /> : <ChevronDown size={14} color={color} />}
      </button>
      {open && <div style={{ padding: '11px 14px', fontSize: 12, color: T.text, lineHeight: 1.75, background: T.white }}>{children}</div>}
    </div>
  );
}

// ─── Описания лабораторий ─────────────────────────────────────────────────────
const LIMITS_LABS = [
  {
    id: 'lc-epsilon-delta',
    title: 'Лаборатория 1: Эпсилон-дельта — игра в приближение',
    shortTitle: 'ε-δ: игра в приближение',
    question: 'Что на самом деле означает «сколь угодно близко»? Можно ли победить в игре, где противник требует всё меньшую ошибку?',
    mechanics: ['Ползунок ε сужает полосу на оси Y.', 'Студент подбирает δ — полосу на оси X.', 'Три уровня сложности: линейная, квадратичная, sin(1/x).'],
    explore: ['Для f(x)=2x+1: во сколько раз δ меньше ε?', 'Для x²: почему δ зависит от √ε?', 'Для sin(1/x): найди ε, для которого δ не существует.'],
    insight: 'Определение предела — это игра. Если я всегда могу найти δ для любого ε — предел существует.',
  },
  {
    id: 'lc-discontinuity-classifier',
    title: 'Лаборатория 2: Классификатор разрывов',
    shortTitle: 'Классификатор разрывов',
    question: 'Скачок, дырка, бесконечность, осцилляция — как их отличить по графику и односторонним пределам?',
    mechanics: ['Галерея графиков — нужно разложить по типам разрывов.', 'Четыре корзины: скачок, устранимый, бесконечный, осциллирующий.'],
    explore: ['sin(x)/x и (x²-1)/(x-1): оба дырки. Чем отличаются?', '1/x и 1/x²: оба бесконечны. Что разное?'],
    insight: 'Тип разрыва определяется не видом графика, а строгим анализом односторонних пределов.',
  },
  {
    id: 'lc-one-sided',
    title: 'Лаборатория 3: Односторонние пределы — приближение слева и справа',
    shortTitle: 'Односторонние пределы',
    question: 'Как функция может вести себя по-разному с разных сторон точки? Когда двусторонний предел существует?',
    mechanics: ['Два ползунка: x→a⁻ (слева) и x→a⁺ (справа).', 'Пять предустановленных функций с разным поведением.', 'Автоматическое приближение с анимацией.'],
    explore: ['Для ступеньки: что слева и справа?', 'Для 1/x: куда уходит каждая сторона?', 'Для устранимого разрыва: оба предела = 2, но функция не определена.'],
    insight: 'Если разведка с обеих сторон докладывает об одном числе — двусторонний предел существует.',
  },
  {
    id: 'lc-draw-continuity',
    title: 'Лаборатория 4: Нарисуй непрерывную функцию',
    shortTitle: 'Нарисуй функцию',
    question: 'Правда ли, что «нарисовать не отрывая карандаша» = непрерывность? Какие разрывы невидимы?',
    mechanics: ['Рисование на координатной плоскости мышью.', 'Автодетектор разрывов: скачок, дырка, бесконечный.', 'Задания: нарисовать функцию с заданным типом разрыва.'],
    explore: ['Нарисуй гладкую кривую. Непрерывна? Всегда ли гладкая = непрерывная?', 'Нарисуй кривую с петлёй. Это функция?', 'Нарисуй 1/x. В нуле вынужден оторваться.'],
    insight: '«Не отрывая руки» — правильная метафора. Но устранимые разрывы — дырка размером в точку — на рисунке невидимы.',
  },
  {
    id: 'lc-asymptotes',
    title: 'Лаборатория 5: Угадай асимптоту',
    shortTitle: 'Угадай асимптоту',
    question: 'Когда x уходит на бесконечность, функция «успокаивается» и приближается к прямой. К какой именно?',
    mechanics: ['График рациональной функции в области больших x.', 'Поле ввода: «горизонтальная асимптота y = ...».', 'Кнопка «Показать вычисление» — деление на старшую степень.'],
    explore: ['Для (3x+2)/x: как изменяется f(x) от x=10 до x=1000?', 'Для x/(x²+1): будет ли f(x) когда-нибудь равна 0?', 'Для (x²+1)/x: есть ли горизонтальная асимптота?'],
    insight: 'Горизонтальная асимптота — «поведение на бесконечности». Функция может осциллировать вокруг неё и всё равно иметь предел.',
  },
  {
    id: 'lc-piecewise-constructor',
    title: 'Лаборатория 6: Конструктор кусочных функций',
    shortTitle: 'Конструктор кусочных',
    question: 'Как склеить функцию из кусков, чтобы она была непрерывной? Что нужно подогнать в точке стыка?',
    mechanics: ['Левая и правая ветви — ползунки для параметров.', 'Ползунок точки стыка a.', 'Три индикатора: левый предел, правый предел, значение f(a).'],
    explore: ['Состыкуй x² слева и 2x-1 справа в x=1. Непрерывна?', 'Измени f(1) на 3. Что случилось?', 'Задание «идеальная стыковка»: совпадение производных.'],
    insight: 'Непрерывность в точке стыка — ровно одно условие: левый предел = правый предел = значение в точке.',
  },
] as const;

// ─── Lab 1: ε-δ ───────────────────────────────────────────────────────────────
function EpsilonDeltaLab() {
  type FnLevel = 'linear' | 'quadratic' | 'oscillating';
  const [level, setLevel] = useState<FnLevel>('linear');
  const [epsilon, setEpsilon] = useState(0.5);
  const [delta, setDelta] = useState(0.25);
  const [autoMode, setAutoMode] = useState(false);

  const configs = {
    linear:     { label: 'f(x) = 2x + 1, a = 0, L = 1', a: 0, L: 1, fn: (x: number) => 2 * x + 1,     autoDelta: (e: number) => e / 2,   color: T.primary, hint: 'Линейная функция: δ = ε/2 (slope=2 → нужно в два раза меньше)' },
    quadratic:  { label: 'f(x) = x², a = 2, L = 4',      a: 2, L: 4, fn: (x: number) => x * x,          autoDelta: (e: number) => Math.min(1, Math.sqrt(e) * 0.5), color: T.green, hint: 'Квадратичная: δ зависит от √ε — нелинейная зависимость' },
    oscillating:{ label: 'f(x) = sin(1/x), a = 0, L = ?', a: 0, L: 0, fn: (x: number) => x === 0 ? 0 : Math.sin(1 / x), autoDelta: () => 0, color: T.red,  hint: 'sin(1/x) бешено колеблется у нуля — подходящего δ не существует ни для какого ε < 1' },
  };

  const cfg = configs[level];
  const W = 500, H = 320, OX = 250, OY = 160, SCALE = 80;

  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number) => OY - y * SCALE;
  const fromSx = (sx: number) => (sx - OX) / SCALE;

  // Build graph path
  const graphPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 800;
    const xMin = (0 - OX) / SCALE, xMax = (W - OX) / SCALE;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (xMax - xMin) * i / steps;
      if (level === 'oscillating' && Math.abs(x) < 0.001) continue;
      try {
        const y = cfg.fn(x);
        if (!isFinite(y) || Math.abs(y) > 10) continue;
        pts.push(`${i === 0 ? 'M' : 'L'}${toSx(x).toFixed(1)},${toSy(y).toFixed(1)}`);
      } catch { /* skip */ }
    }
    return pts.join(' ');
  }, [level, cfg]);

  // Check if current delta works for current epsilon
  const checkDelta = useMemo(() => {
    if (level === 'oscillating') return false;
    const testPts = 200;
    const xMin = cfg.a - delta, xMax = cfg.a + delta;
    for (let i = 0; i <= testPts; i++) {
      const x = xMin + (xMax - xMin) * i / testPts;
      if (Math.abs(x - cfg.a) < 1e-9) continue;
      const y = cfg.fn(x);
      if (Math.abs(y - cfg.L) > epsilon) return false;
    }
    return true;
  }, [level, cfg, delta, epsilon]);

  const isWorking = checkDelta;
  const statusColor = level === 'oscillating' ? T.red : isWorking ? T.green : T.red;
  const statusText = level === 'oscillating' ? 'Предела не существует — δ не найти!' : isWorking ? 'δ работает! ∀x: |x − a| < δ ⇒ |f(x) − L| < ε' : 'δ слишком велика — часть графика выходит из ε-полосы';

  const effectiveDelta = autoMode && level !== 'oscillating' ? cfg.autoDelta(epsilon) : delta;

  // Axes ticks
  const ticks = [-2, -1, 0, 1, 2, 3, 4];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 1 · Пределы" title="Эпсилон-дельта: игра в приближение"
        question="Что на самом деле означает «сколь угодно близко»? Можно ли победить в игре, где противник требует всё меньшую ошибку?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Правила игры">
          Противник даёт вам ε — допустимую ошибку по Y. Ваша задача — найти δ — радиус по X, при котором весь
          график внутри δ-полосы вокруг a лежит внутри ε-полосы вокруг L. Если можете — для любого ε, предел существует.
        </InfoCard>
        <InfoCard color={T.green} title="Непрерывная функция">
          Для линейной f(x)=2x+1 всегда побеждаете: берите δ = ε/2. Наклон 2 означает, что при сдвиге по X на δ, по Y сдвинемся на 2δ — так чтобы уложиться в ε, берём δ вдвое меньше.
        </InfoCard>
        <InfoCard color={T.red} title="sin(1/x) у нуля">
          Как бы мало δ ни было, в промежутке (−δ, δ) функция успеет пробежать от −1 до +1 бесконечное число раз.
          Никакое δ не сработает для ε = 0.5. Предела нет.
        </InfoCard>
      </div>

      {/* Level selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 }}>
        <SectionLabel>Уровень сложности:</SectionLabel>
        {([['linear', 'Лёгкий: f(x)=2x+1'], ['quadratic', 'Средний: f(x)=x²'], ['oscillating', 'Сложный: sin(1/x)']] as [FnLevel, string][]).map(([k, lbl]) => (
          <PresetButton key={k} active={level === k} onClick={() => { setLevel(k); setEpsilon(0.5); setDelta(0.25); setAutoMode(false); }}
            label={lbl} color={k === 'oscillating' ? T.red : k === 'quadratic' ? T.green : T.primary} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        {/* SVG graph */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 8, textAlign: 'center' as const }}>{cfg.label}</div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            {/* ε strip (Y) */}
            <rect x={0} y={toSy(cfg.L + epsilon)} width={W} height={Math.abs(toSy(cfg.L - epsilon) - toSy(cfg.L + epsilon))}
              fill={`${T.amber}22`} stroke={T.amber} strokeWidth="0.5" />
            {/* δ strip (X) */}
            <rect x={toSx(cfg.a - effectiveDelta)} y={0} width={Math.abs(toSx(cfg.a + effectiveDelta) - toSx(cfg.a - effectiveDelta))} height={H}
              fill={`${isWorking && level !== 'oscillating' ? T.green : T.red}18`} stroke={isWorking && level !== 'oscillating' ? T.green : T.red} strokeWidth="0.5" />

            {/* Grid */}
            {ticks.map(t => (
              <g key={t}>
                <line x1={toSx(t)} y1={0} x2={toSx(t)} y2={H} stroke={T.border} strokeWidth={t === 0 ? 1.5 : 0.5} />
                <line x1={0} y1={toSy(t)} x2={W} y2={toSy(t)} stroke={T.border} strokeWidth={t === 0 ? 1.5 : 0.5} />
                <text x={toSx(t)} y={OY + 16} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{t}</text>
                <text x={OX - 12} y={toSy(t) + 3} textAnchor="end" fontSize="9" fill={T.mutedLight}>{t}</text>
              </g>
            ))}

            {/* Graph */}
            <path d={graphPath} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />

            {/* a and L markers */}
            <line x1={toSx(cfg.a)} y1={0} x2={toSx(cfg.a)} y2={H} stroke={T.primary} strokeWidth="1.5" strokeDasharray="5 4" />
            <line x1={0} y1={toSy(cfg.L)} x2={W} y2={toSy(cfg.L)} stroke={T.amber} strokeWidth="1.5" strokeDasharray="5 4" />

            {/* Labels */}
            <text x={toSx(cfg.a) + 5} y={18} fontSize="12" fill={T.primaryDark} fontWeight="800">a</text>
            <text x={W - 12} y={toSy(cfg.L) - 5} fontSize="12" fill={T.amber} fontWeight="800">L</text>

            {/* ε arrows */}
            <text x={4} y={toSy(cfg.L + epsilon) + 14} fontSize="10" fill={T.amber} fontWeight="700">+ε</text>
            <text x={4} y={toSy(cfg.L - epsilon) - 4} fontSize="10" fill={T.amber} fontWeight="700">−ε</text>
            {/* δ arrows */}
            <text x={toSx(cfg.a - effectiveDelta) + 2} y={H - 4} fontSize="10" fill={isWorking && level !== 'oscillating' ? T.green : T.red} fontWeight="700">−δ</text>
            <text x={toSx(cfg.a + effectiveDelta) - 16} y={H - 4} fontSize="10" fill={isWorking && level !== 'oscillating' ? T.green : T.red} fontWeight="700">+δ</text>
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <SectionLabel>Ползунок ε (противник)</SectionLabel>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.amber, textAlign: 'center' as const, marginBottom: 8 }}>ε = {epsilon.toFixed(3)}</div>
            <input type="range" min={0.02} max={1.2} step={0.01} value={epsilon}
              onChange={e => setEpsilon(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.amber }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
              {[0.5, 0.2, 0.05, 0.01].map(v => (
                <button key={v} onClick={() => setEpsilon(v)}
                  style={{ padding: '3px 9px', borderRadius: 8, border: `1px solid ${T.amberLight}`, background: T.amberLight, color: '#92400e', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  ε={v}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px', opacity: autoMode ? 0.6 : 1 }}>
            <SectionLabel>Ползунок δ (вы)</SectionLabel>
            <div style={{ fontSize: 20, fontWeight: 900, color: isWorking && level !== 'oscillating' ? T.green : T.red, textAlign: 'center' as const, marginBottom: 8 }}>
              δ = {autoMode ? (effectiveDelta).toFixed(4) : delta.toFixed(3)}
            </div>
            <input type="range" min={0.001} max={1.5} step={0.001} value={delta}
              disabled={autoMode}
              onChange={e => setDelta(Number(e.target.value))}
              style={{ width: '100%', accentColor: isWorking ? T.green : T.red }} />
          </div>

          <button onClick={() => setAutoMode(a => !a)}
            style={{ padding: '9px 14px', borderRadius: 12, background: autoMode ? T.violet : T.surface, color: autoMode ? T.white : T.muted, border: `1.5px solid ${autoMode ? T.violet : T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {autoMode ? '🤖 Авто δ вкл.' : '🤖 Авто δ (компьютер)'}
          </button>

          <div style={{ padding: '10px 14px', borderRadius: 12, background: `${statusColor}12`, border: `1px solid ${statusColor}40`, fontSize: 12, fontWeight: 700, color: statusColor, lineHeight: 1.55 }}>
            {statusText}
          </div>

          <div style={{ background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, borderRadius: 12, padding: '10px 14px', fontSize: 12, color: T.muted, lineHeight: 1.65 }}>
            {cfg.hint}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="Загадка 1: для f(x)=x² и ε=0.01 я подобрал δ=0.002. Подойдёт ли это δ для ε=0.1?" color={T.primary}>
          Да — если полоса на Y шире, условие выполняется с запасом. <strong>Меньшее δ всегда работает для большего ε.</strong> Это важно: определение требует лишь существования хоть какого-то δ, не обязательно максимального.
        </Collapsible>
        <Collapsible title="Загадка 2: для f(x)=1/x в точке a=0 можно ли найти δ для ε=0.5?" color={T.amber}>
          Нет — функция уходит на бесконечность. Для любого δ найдётся x ∈ (−δ, δ) такой, что |f(x)| {'>'} 1/2. Предела нет.
        </Collapsible>
        <Collapsible title="Загадка 3: во сколько раз δ меньше ε у линейной функции с наклоном k?" color={T.green}>
          δ = ε/k. Чем круче наклон, тем «аккуратнее» нужно брать δ. Для f(x)=10x нужно δ = ε/10 — в десять раз меньше ε.
        </Collapsible>
      </div>

      <Callout color={T.green} title="Главный вывод">
        Определение предела — это игра. Вы даёте мне ε, я даю вам δ. Если я могу выиграть для любого ε — предел существует. Для непрерывных функций я выигрываю всегда. Для разрывных — проигрываю при малом ε.
      </Callout>
    </div>
  );
}

// ─── Lab 2: Discontinuity Classifier ─────────────────────────────────────────
function DiscontinuityClassifierLab() {
  type DiscType = 'removable' | 'jump' | 'infinite' | 'oscillating' | 'continuous';

  const functions = [
    { id: 'f1', label: 'sin(x)/x',        type: 'removable'    as DiscType, desc: 'Дырка в x=0',                  leftL: '1', rightL: '1',  fval: 'не опр.', note: 'lim=1, значение не определено' },
    { id: 'f2', label: '(x²−1)/(x−1)',    type: 'removable'    as DiscType, desc: 'Дырка в x=1',                  leftL: '2', rightL: '2',  fval: 'не опр.', note: 'Сокращается до x+1' },
    { id: 'f3', label: 'sgn(x)',           type: 'jump'         as DiscType, desc: 'Скачок в x=0',                 leftL: '−1', rightL: '+1', fval: '0',       note: 'Разрыв первого рода, неустранимый' },
    { id: 'f4', label: 'θ(x) — Хевисайд', type: 'jump'         as DiscType, desc: 'Скачок в x=0',                 leftL: '0', rightL: '1',  fval: '1',       note: 'Скачок величиной 1' },
    { id: 'f5', label: '1/x',              type: 'infinite'     as DiscType, desc: 'Бесконечный в x=0',            leftL: '−∞', rightL: '+∞', fval: 'не опр.', note: 'Слева −∞, справа +∞' },
    { id: 'f6', label: '1/x²',             type: 'infinite'     as DiscType, desc: 'Бесконечный в x=0',            leftL: '+∞', rightL: '+∞', fval: 'не опр.', note: 'С обеих сторон +∞' },
    { id: 'f7', label: 'sin(1/x)',          type: 'oscillating'  as DiscType, desc: 'Осциллирующий в x=0',          leftL: '∄', rightL: '∄',  fval: 'не опр.', note: 'Значения мечутся от −1 до +1' },
    { id: 'f8', label: 'cos(1/x)',          type: 'oscillating'  as DiscType, desc: 'Осциллирующий в x=0',          leftL: '∄', rightL: '∄',  fval: 'не опр.', note: 'Аналогично sin(1/x)' },
    { id: 'f9', label: 'x²',               type: 'continuous'   as DiscType, desc: 'Непрерывна всюду',             leftL: '4', rightL: '4',  fval: '4',       note: 'Везде непрерывна: предел = значение' },
    { id: 'f10',label: 'sin(x)',            type: 'continuous'   as DiscType, desc: 'Непрерывна всюду',             leftL: '0', rightL: '0',  fval: '0',       note: 'Типичный пример непрерывной функции' },
  ];

  const baskets: { id: DiscType; label: string; color: string; desc: string }[] = [
    { id: 'removable',   label: 'Устранимый',       color: T.primary, desc: 'lim↑ = lim↓ ≠ f(a) или f(a) не опр.' },
    { id: 'jump',        label: 'Скачок',           color: T.amber,   desc: 'lim↑ ≠ lim↓, оба конечны' },
    { id: 'infinite',    label: 'Бесконечный',      color: T.red,     desc: 'Хотя бы один предел = ±∞' },
    { id: 'oscillating', label: 'Осциллирующий',    color: T.violet,  desc: 'Хотя бы один предел не существует из-за колебаний' },
    { id: 'continuous',  label: 'Непрерывна',       color: T.green,   desc: 'lim↑ = lim↓ = f(a)' },
  ];

  const [classified, setClassified] = useState<Record<string, DiscType>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const classify = (fnId: string, type: DiscType) => {
    setClassified(c => ({ ...c, [fnId]: type }));
    setSelected(null);
  };

  const fn = functions.find(f => f.id === selected);
  const total = functions.length;
  const done = Object.keys(classified).length;
  const correct = showAnswers ? functions.filter(f => classified[f.id] === f.type).length : null;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 2 · Пределы" title="Классификатор разрывов"
        question="Скачок, дырка, бесконечность, осцилляция — как их отличить по графику и односторонним пределам?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Устранимый разрыв">
          Оба односторонних предела существуют и равны друг другу, но значение функции в точке либо не определено, либо не совпадает с пределом. «Дырка» — точка над или под графиком.
        </InfoCard>
        <InfoCard color={T.amber} title="Разрыв первого рода (скачок)">
          Оба односторонних предела существуют и конечны, но не равны. Величина скачка = |lim↑ − lim↓|. Можно «доопределить», но не «склеить».
        </InfoCard>
        <InfoCard color={T.red} title="Разрыв второго рода">
          Хотя бы один односторонний предел равен ±∞ (бесконечный) или вовсе не существует из-за бешеных колебаний (осциллирующий).
        </InfoCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Left: function cards */}
        <div>
          <SectionLabel>Функции — выбери и классифицируй</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {functions.map(f => {
              const cls = classified[f.id];
              const isCorrect = showAnswers && cls === f.type;
              const isWrong   = showAnswers && cls && cls !== f.type;
              const bg = isCorrect ? T.greenLight : isWrong ? T.redLight : selected === f.id ? T.primaryLight : T.white;
              const border = isCorrect ? T.green : isWrong ? T.red : selected === f.id ? T.primary : T.border;
              return (
                <button key={f.id} onClick={() => setSelected(f.id === selected ? null : f.id)}
                  style={{ textAlign: 'left' as const, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${border}`, background: bg, cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: 'monospace' }}>{f.label}</span>
                    {cls && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${baskets.find(b => b.id === cls)!.color}15`, color: baskets.find(b => b.id === cls)!.color, fontWeight: 700 }}>
                        {baskets.find(b => b.id === cls)!.label}
                      </span>
                    )}
                  </div>
                  {showAnswers && isWrong && (
                    <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>✗ Нет. Правильно: {baskets.find(b => b.id === f.type)!.label}</div>
                  )}
                  {showAnswers && isCorrect && (
                    <div style={{ fontSize: 11, color: T.green, marginTop: 4 }}>✓ {f.note}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: baskets + detail */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {fn && (
            <div style={{ background: T.amberLight, border: `1px solid ${T.amber}40`, borderRadius: 14, padding: '14px 16px', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 8, fontFamily: 'monospace' }}>{fn.label} — в точке разрыва</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                <StatBadge label="lim слева" value={fn.leftL} color={T.primary} />
                <StatBadge label="lim справа" value={fn.rightL} color={T.primary} />
                <StatBadge label="f(a)" value={fn.fval} color={T.amber} />
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>{fn.desc}</div>
              <SectionLabel color={T.primaryDark}>Положи в корзину:</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                {baskets.map(b => (
                  <button key={b.id} onClick={() => classify(fn.id, b.id)}
                    style={{ padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: classified[fn.id] === b.id ? b.color : T.white, color: classified[fn.id] === b.id ? T.white : T.text, border: `1.5px solid ${b.color}` }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <SectionLabel>Корзины</SectionLabel>
          {baskets.map(b => {
            const items = functions.filter(f => classified[f.id] === b.id);
            return (
              <div key={b.id} style={{ background: `${b.color}08`, border: `1.5px solid ${b.color}30`, borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: b.color, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>{b.label}</div>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>{b.desc}</div>
                {items.length === 0
                  ? <div style={{ fontSize: 11, color: T.mutedLight, fontStyle: 'italic' }}>пусто</div>
                  : <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                      {items.map(f => (
                        <span key={f.id} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: T.white, border: `1px solid ${b.color}40`, color: T.text, fontFamily: 'monospace', fontWeight: 600 }}>{f.label}</span>
                      ))}
                    </div>
                }
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: 12, color: T.muted, alignSelf: 'center' }}>{done}/{total} разложено</div>
            <button onClick={() => setShowAnswers(a => !a)}
              style={{ marginLeft: 'auto' as const, padding: '8px 16px', borderRadius: 12, background: showAnswers ? T.green : T.primaryDark, color: T.white, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {showAnswers ? `✓ ${correct}/${total} верно` : 'Показать ответы'}
            </button>
            <button onClick={() => { setClassified({}); setShowAnswers(false); setSelected(null); }}
              style={{ padding: '8px 12px', borderRadius: 12, background: T.surface, color: T.muted, border: `1px solid ${T.border}`, fontSize: 12, cursor: 'pointer' }}>
              <RotateCcw size={13} style={{ display: 'inline' }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Исследовательские вопросы</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="sin(x)/x и (x²−1)/(x−1): оба — дырки. Чем отличаются?" color={T.primary}>
          Ничем по типу разрыва — оба устранимые. Это проверка: не думайте, что sin даёт осциллирующий разрыв. lim sin(x)/x = 1 при x→0 — классический замечательный предел. Оба можно «залатать» одной точкой.
        </Collapsible>
        <Collapsible title="1/x и 1/x²: оба бесконечны. В чём разница?" color={T.red}>
          У 1/x слева −∞, справа +∞ — знаки разные. У 1/x² с обеих сторон +∞ — всегда положительный. Это влияет на поведение: у 1/x «нет» даже предела в смысле ±∞, у 1/x² есть «предел» +∞.
        </Collapsible>
        <Collapsible title="Загадка: lim слева = 3, lim справа = 3, f(0) не определено. Тип?" color={T.amber}>
          Устранимый разрыв — «дырка». Чтобы стал непрерывной, нужно доопределить f(0) = 3. Если бы f(0)=5 — тоже устранимый (значение есть, но не совпадает с пределом).
        </Collapsible>
      </div>

      <Callout color={T.amber} title="Главный вывод">
        Тип разрыва определяется не внешним видом, а строгим анализом: два конечных равных предела → устранимый; два конечных разных → скачок; хотя бы один бесконечный → бесконечный; хотя бы один не существует из-за колебаний → осциллирующий.
      </Callout>
    </div>
  );
}

// ─── Lab 3: One-sided limits ──────────────────────────────────────────────────
function OneSidedLimitsLab() {
  type FnPreset = 'step' | 'hyperbola' | 'removable' | 'continuous' | 'oscillating';
  const [preset, setPreset] = useState<FnPreset>('step');
  const [leftX, setLeftX] = useState(0.5);  // distance from a, positive
  const [rightX, setRightX] = useState(0.5);
  const [autoPlay, setAutoPlay] = useState(false);
  const rafRef = useRef<number | null>(null);
  const speedRef = useRef(0.003);

  const configs: Record<FnPreset, {
    label: string; a: number; fn: (x: number) => number;
    leftLimit: string; rightLimit: string; twoSided: string; color: string; note: string;
  }> = {
    step:         { label: 'Ступенька f(x)={0,x<0; 1,x≥0}', a: 0, fn: x => x < 0 ? 0 : 1,         leftLimit: '0',  rightLimit: '1', twoSided: 'не существует',  color: T.amber,  note: '0 ≠ 1 → двустороннего предела нет' },
    hyperbola:    { label: 'Гипербола f(x) = 1/x',            a: 0, fn: x => x === 0 ? 0 : 1/x,     leftLimit: '−∞', rightLimit: '+∞',twoSided: 'не существует',  color: T.red,    note: 'Уходит в разные бесконечности' },
    removable:    { label: 'Устранимый f(x)=(x²−1)/(x−1)',    a: 1, fn: x => x === 1 ? 5 : (x*x-1)/(x-1), leftLimit: '2', rightLimit: '2', twoSided: '2',       color: T.primary,note: 'lim = 2, f(1) = 5 (устранимый разрыв)' },
    continuous:   { label: 'Непрерывная f(x) = x²',           a: 2, fn: x => x * x,                  leftLimit: '4',  rightLimit: '4', twoSided: '4 = f(2)',       color: T.green,  note: 'Оба предела = 4 = f(2): полная непрерывность' },
    oscillating:  { label: 'Осцилляция f(x) = sin(1/x)',      a: 0, fn: x => x === 0 ? 0 : Math.sin(1/x), leftLimit: '∄', rightLimit: '∄', twoSided: 'не существует', color: T.violet, note: 'Значения хаотично мечутся между −1 и +1' },
  };

  const cfg = configs[preset];
  const W = 480, H = 280, OX = 240, OY = 140, SCALE = 60;
  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number) => OY - y * SCALE;

  const leftXval  = cfg.a - leftX;
  const rightXval = cfg.a + rightX;
  const safeY = (x: number) => { try { const y = cfg.fn(x); return isFinite(y) ? y : null; } catch { return null; } };
  const leftY  = safeY(leftXval);
  const rightY = safeY(rightXval);

  const graphPath = useMemo(() => {
    const pts: string[] = [];
    const xMin = (0 - OX) / SCALE, xMax = (W - OX) / SCALE;
    const steps = 600;
    let lastOk = false;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (xMax - xMin) * i / steps;
      if (preset === 'removable' && Math.abs(x - 1) < 0.003) { lastOk = false; continue; }
      if ((preset === 'hyperbola' || preset === 'oscillating') && Math.abs(x) < 0.005) { lastOk = false; continue; }
      const y = safeY(x);
      if (y === null || Math.abs(y) > 6) { lastOk = false; continue; }
      pts.push(`${!lastOk ? 'M' : 'L'}${toSx(x).toFixed(1)},${toSy(y).toFixed(1)}`);
      lastOk = true;
    }
    return pts.join(' ');
  }, [preset]);

  // Auto approach animation
  useEffect(() => {
    if (!autoPlay) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    const tick = () => {
      setLeftX(v => { const n = v - speedRef.current; return n < 0.005 ? 0.5 : n; });
      setRightX(v => { const n = v - speedRef.current; return n < 0.005 ? 0.5 : n; });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [autoPlay]);

  const twoSidedOk = cfg.twoSided !== 'не существует';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 3 · Пределы" title="Односторонние пределы: слева и справа"
        question="Как функция может вести себя по-разному с разных сторон точки? Когда двусторонний предел существует?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Левый предел lim⁻">
          x приближается к a снизу (x {'<'} a). Красная точка ползёт слева по кривой. Если значения стабилизируются — предел существует.
        </InfoCard>
        <InfoCard color={T.cyan} title="Правый предел lim⁺">
          x приближается к a сверху (x {'>'} a). Синяя точка ползёт справа. Сравните с левым пределом.
        </InfoCard>
        <InfoCard color={T.green} title="Двусторонний предел">
          Существует тогда и только тогда, когда lim⁻ = lim⁺ и оба конечны. Если хоть одно не выполнено — двустороннего предела нет.
        </InfoCard>
      </div>

      {/* Preset selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 }}>
        {(Object.keys(configs) as FnPreset[]).map(k => (
          <PresetButton key={k} active={preset === k}
            onClick={() => { setPreset(k); setLeftX(0.5); setRightX(0.5); setAutoPlay(false); }}
            label={configs[k].label.split(' ')[0] + ' ' + configs[k].label.split(' ')[1]}
            color={configs[k].color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        {/* Graph */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textAlign: 'center' as const }}>{cfg.label}</div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            {[-3,-2,-1,0,1,2,3].map(t => (
              <g key={t}>
                <line x1={toSx(t)} y1={0} x2={toSx(t)} y2={H} stroke={T.border} strokeWidth={t===0?1.5:0.5} />
                <line x1={0} y1={toSy(t)} x2={W} y2={toSy(t)} stroke={T.border} strokeWidth={t===0?1.5:0.5} />
                <text x={toSx(t)} y={OY+14} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{t}</text>
                <text x={OX-10} y={toSy(t)+3} textAnchor="end" fontSize="9" fill={T.mutedLight}>{t}</text>
              </g>
            ))}

            {/* Graph */}
            <path d={graphPath} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />

            {/* Hole for removable */}
            {preset === 'removable' && (
              <circle cx={toSx(1)} cy={toSy(5)} r={5} fill={T.white} stroke={cfg.color} strokeWidth="2" />
            )}

            {/* a line */}
            <line x1={toSx(cfg.a)} y1={0} x2={toSx(cfg.a)} y2={H} stroke={T.mutedLight} strokeWidth="1" strokeDasharray="4 3" />

            {/* Left point (red) */}
            {leftY !== null && (
              <g>
                <line x1={toSx(leftXval)} y1={toSy(leftY)} x2={toSx(leftXval)} y2={OY} stroke={T.red} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
                <line x1={toSx(leftXval)} y1={toSy(leftY)} x2={OX} y2={toSy(leftY)} stroke={T.red} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
                <circle cx={toSx(leftXval)} cy={toSy(leftY)} r={7} fill={T.red} />
                <text x={toSx(leftXval) - 12} y={toSy(leftY) - 10} fontSize="9" fill={T.red} fontWeight="700">
                  ({leftXval.toFixed(3)}, {leftY.toFixed(3)})
                </text>
              </g>
            )}

            {/* Right point (blue) */}
            {rightY !== null && (
              <g>
                <line x1={toSx(rightXval)} y1={toSy(rightY)} x2={toSx(rightXval)} y2={OY} stroke={T.cyan} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
                <line x1={toSx(rightXval)} y1={toSy(rightY)} x2={OX} y2={toSy(rightY)} stroke={T.cyan} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
                <circle cx={toSx(rightXval)} cy={toSy(rightY)} r={7} fill={T.cyan} />
                <text x={toSx(rightXval) + 10} y={toSy(rightY) - 10} fontSize="9" fill={T.cyan} fontWeight="700">
                  ({rightXval.toFixed(3)}, {rightY.toFixed(3)})
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Controls + results */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel color={T.red}>x → a⁻ (слева)</SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.red, textAlign: 'center' as const, marginBottom: 6 }}>x = {leftXval.toFixed(4)}</div>
            <input type="range" min={0.001} max={1.5} step={0.001} value={leftX} onChange={e => { setLeftX(Number(e.target.value)); setAutoPlay(false); }}
              style={{ width: '100%', accentColor: T.red }} />
            {leftY !== null && <div style={{ fontSize: 12, textAlign: 'center' as const, color: T.red, marginTop: 4 }}>f(x) = {leftY.toFixed(4)}</div>}
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel color={T.cyan}>x → a⁺ (справа)</SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.cyan, textAlign: 'center' as const, marginBottom: 6 }}>x = {rightXval.toFixed(4)}</div>
            <input type="range" min={0.001} max={1.5} step={0.001} value={rightX} onChange={e => { setRightX(Number(e.target.value)); setAutoPlay(false); }}
              style={{ width: '100%', accentColor: T.cyan }} />
            {rightY !== null && <div style={{ fontSize: 12, textAlign: 'center' as const, color: T.cyan, marginTop: 4 }}>f(x) = {rightY.toFixed(4)}</div>}
          </div>

          <button onClick={() => { setLeftX(0.5); setRightX(0.5); setAutoPlay(a => !a); }}
            style={{ padding: '9px 14px', borderRadius: 12, background: autoPlay ? T.red : T.green, color: T.white, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {autoPlay ? '⏸ Стоп' : '▶ Автоприближение'}
          </button>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <StatBadge label="lim слева (lim⁻)" value={cfg.leftLimit} color={T.red} />
            <StatBadge label="lim справа (lim⁺)" value={cfg.rightLimit} color={T.cyan} />
            <div style={{ padding: '10px 12px', borderRadius: 9, background: `${twoSidedOk ? T.green : T.red}12`, border: `1px solid ${twoSidedOk ? T.green : T.red}40`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: T.muted }}>Двусторонний предел</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: twoSidedOk ? T.green : T.red }}>{cfg.twoSided}</span>
            </div>
          </div>

          <div style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}30`, borderRadius: 12, padding: '10px 14px', fontSize: 12, color: T.muted, lineHeight: 1.65 }}>
            {cfg.note}
          </div>
        </div>
      </div>

      <Callout color={T.primary} title="Главный вывод">
        Односторонние пределы — «разведка с двух сторон». Если оба доклада одинаковы — двусторонний предел существует. Если разные, бесконечные или «не могу определить» — предела нет.
      </Callout>
    </div>
  );
}

// ─── Lab 4: Draw Continuity ───────────────────────────────────────────────────
function DrawContinuityLab() {
  type DrawMode = 'free' | 'make-jump' | 'make-hole' | 'make-continuous';
  const [mode, setMode] = useState<DrawMode>('free');
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<null | { continuous: boolean; issues: string[] }>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 520, H = 320, OX = 260, OY = 160, SCALE = 55;
  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number) => OY - y * SCALE;
  const fromSvg = (sx: number, sy: number) => ({ x: (sx - OX) / SCALE, y: (OY - sy) / SCALE });

  const getSvgCoords = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    const sy = (e.clientY - rect.top) * (H / rect.height);
    return fromSvg(sx, sy);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setDrawing(true);
    setResult(null);
    const p = getSvgCoords(e);
    setPoints([p]);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    const p = getSvgCoords(e);
    setPoints(pts => {
      if (pts.length === 0) return [p];
      const last = pts[pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 0.05) return pts;
      return [...pts, p];
    });
  };
  const onPointerUp = () => setDrawing(false);

  const analyze = () => {
    if (points.length < 5) { setResult({ continuous: false, issues: ['Нарисуй побольше — слишком короткая кривая.'] }); return; }
    const issues: string[] = [];

    // Check for jumps (large vertical gaps)
    for (let i = 1; i < points.length; i++) {
      const dx = Math.abs(points[i].x - points[i-1].x);
      const dy = Math.abs(points[i].y - points[i-1].y);
      if (dx > 0.8 && dy > 0.3) {
        issues.push(`Разрыв (скачок) около x ≈ ${((points[i].x + points[i-1].x)/2).toFixed(1)}`);
        break;
      }
    }

    // Check if it's a function (monotone in x overall)
    let nonMonotone = 0;
    for (let i = 2; i < points.length; i++) {
      if (points[i].x < points[i-2].x) nonMonotone++;
    }
    if (nonMonotone > points.length * 0.15) {
      issues.push('Это не функция: одному x соответствует несколько y (петля).');
    }

    // Check for extremely steep vertical (possible infinite discontinuity)
    for (let i = 1; i < points.length; i++) {
      const dx = Math.abs(points[i].x - points[i-1].x);
      const dy = Math.abs(points[i].y - points[i-1].y);
      if (dx < 0.02 && dy > 1.0) {
        issues.push(`Возможный бесконечный разрыв около x ≈ ${points[i].x.toFixed(1)}`);
        break;
      }
    }

    setResult({ continuous: issues.length === 0, issues });
  };

  const pathD = points.length > 1
    ? points.map((p, i) => `${i===0?'M':'L'}${toSx(p.x).toFixed(1)},${toSy(p.y).toFixed(1)}`).join(' ')
    : '';

  const modeConfigs: { id: DrawMode; label: string; task: string; color: string }[] = [
    { id: 'free',             label: 'Свободное',       task: 'Рисуй что хочешь — система проанализирует.',                                     color: T.primary },
    { id: 'make-jump',        label: 'Задание: скачок',  task: 'Нарисуй функцию ровно с одним скачком (оторви и продолжи на другом уровне).',     color: T.amber },
    { id: 'make-hole',        label: 'Задание: дырка',   task: 'Нарисуй непрерывную функцию, оставив «разрыв» — обведи точку кружком и продолжи.',color: T.violet },
    { id: 'make-continuous',  label: 'Задание: непрерывная', task: 'Нарисуй везде непрерывную функцию — не отрывай руки!',                         color: T.green },
  ];

  const activeCfg = modeConfigs.find(m => m.id === mode)!;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 4 · Пределы" title="Нарисуй непрерывную функцию"
        question='Правда ли, что "нарисовать не отрывая карандаша" = непрерывность? Какие разрывы невидимы?' />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Непрерывность = не отрывая?">
          Да, для «нормальных» функций. Но есть устранимые разрывы — дырка размером в точку. На рисунке невидимы, но формально функция разрывна, если в одной точке значение «не то».
        </InfoCard>
        <InfoCard color={T.amber} title="Функция = однозначность">
          Кривая является графиком функции только если каждому x соответствует не более одного y. Петля нарушает это правило. Система предупредит.
        </InfoCard>
        <InfoCard color={T.green} title="Тест Вейерштрасса">
          Существует непрерывная функция, которую невозможно нарисовать — она «колючая» в каждой точке (нигде не дифференцируема). Непрерывность не = гладкость.
        </InfoCard>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {modeConfigs.map(m => (
          <PresetButton key={m.id} active={mode === m.id} onClick={() => { setMode(m.id); setPoints([]); setResult(null); }} label={m.label} color={m.color} />
        ))}
      </div>

      <div style={{ padding: '10px 16px', borderRadius: 12, background: `${activeCfg.color}10`, border: `1px solid ${activeCfg.color}30`, marginBottom: 14, fontSize: 13, color: T.text, lineHeight: 1.55 }}>
        <strong style={{ color: activeCfg.color }}>Задание:</strong> {activeCfg.task}
      </div>

      {/* Drawing area */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, marginBottom: 14, userSelect: 'none' }}>
        <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}
          style={{ display: 'block', cursor: drawing ? 'crosshair' : 'crosshair', touchAction: 'none', width: '100%', height: 'auto' }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          {/* Grid */}
          {[-4,-3,-2,-1,0,1,2,3,4].map(t => (
            <g key={t}>
              <line x1={toSx(t)} y1={0} x2={toSx(t)} y2={H} stroke={T.border} strokeWidth={t===0?1.5:0.5} />
              <line x1={0} y1={toSy(t)} x2={W} y2={toSy(t)} stroke={T.border} strokeWidth={t===0?1.5:0.5} />
              {t !== 0 && <text x={toSx(t)} y={OY+14} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{t}</text>}
              {t !== 0 && <text x={OX-10} y={toSy(t)+3} textAnchor="end" fontSize="9" fill={T.mutedLight}>{t}</text>}
            </g>
          ))}
          {/* User drawing */}
          {pathD && <path d={pathD} fill="none" stroke={activeCfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {points.length === 0 && (
            <text x={W/2} y={H/2 - 10} textAnchor="middle" fontSize="15" fill={T.mutedLight} fontWeight="600">← Рисуй здесь →</text>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' as const }}>
        <button onClick={analyze} disabled={points.length < 5}
          style={{ padding: '10px 20px', borderRadius: 12, background: points.length < 5 ? T.surface : T.primaryDark, color: points.length < 5 ? T.muted : T.white, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: points.length < 5 ? 0.6 : 1 }}>
          🔍 Анализировать
        </button>
        <button onClick={() => { setPoints([]); setResult(null); }}
          style={{ padding: '10px 14px', borderRadius: 12, background: T.surface, color: T.muted, border: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} />Очистить
        </button>
        <span style={{ alignSelf: 'center', fontSize: 12, color: T.muted }}>{points.length} точек нарисовано</span>
      </div>

      {result && (
        <div style={{ padding: '14px 18px', borderRadius: 14, background: result.continuous ? T.greenLight : T.redLight, border: `1px solid ${result.continuous ? T.green : T.red}40`, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: result.continuous ? T.green : T.red, marginBottom: result.issues.length ? 8 : 0 }}>
            {result.continuous ? '✓ Функция непрерывна на всём нарисованном участке!' : '✗ Обнаружены проблемы:'}
          </div>
          {result.issues.map((issue, i) => (
            <div key={i} style={{ fontSize: 13, color: T.red, lineHeight: 1.6 }}>• {issue}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Что исследовать</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="Нарисуй гладкую кривую. Непрерывна? Гладкая = непрерывная?" color={T.primary}>
          Да, непрерывна. И всегда: гладкая (с непрерывной производной) ⟹ непрерывная. Но не наоборот: |x| непрерывна всюду, но не гладка в 0.
        </Collapsible>
        <Collapsible title="Нарисуй кривую с петлёй. Это функция?" color={T.amber}>
          Нет — одному x соответствует два y. Система предупредит: «Это не функция». Вертикальная прямая пересечёт такой граф дважды — тест вертикальной прямой.
        </Collapsible>
        <Collapsible title="Попробуй нарисовать 1/x (гиперболу). Что в нуле?" color={T.red}>
          Вынужден оторваться — слева уходишь вниз, справа начинаешь сверху. Система зафиксирует бесконечный разрыв. Никаким доопределением не исправить.
        </Collapsible>
      </div>

      <Callout color={T.primary} title="Главный вывод">
        «Не отрывая руки» — мощная и правильная метафора непрерывности. Но устранимые разрывы — дырка размером в точку — на рисунке невидимы. Математическая непрерывность строже: нужно проверить предел в каждой точке.
      </Callout>
    </div>
  );
}

// ─── Lab 5: Asymptotes ────────────────────────────────────────────────────────
function AsymptotesLab() {
  type FnKey = 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6';
  const [fn, setFn] = useState<FnKey>('f1');
  const [xSlider, setXSlider] = useState(10);
  const [guess, setGuess] = useState('');
  const [checked, setChecked] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  const configs: Record<FnKey, {
    label: string; f: (x: number) => number;
    asymptote: number | null; asymptoteStr: string;
    calc: string; color: string; noAsymptote?: boolean;
  }> = {
    f1: { label: '(3x + 2) / x',        f: x => (3*x+2)/x,               asymptote: 3,    asymptoteStr: 'y = 3',   color: T.primary, calc: 'Делим на x: (3 + 2/x) → 3 + 0 = 3 при x→∞' },
    f2: { label: '(5x² − x) / (2x² + 3)',f: x => (5*x*x-x)/(2*x*x+3),    asymptote: 2.5,  asymptoteStr: 'y = 5/2', color: T.green,  calc: 'Делим на x²: (5 − 1/x) / (2 + 3/x²) → 5/2 = 2.5' },
    f3: { label: '(2x³ + 1) / (x³ − x²)',f: x => (2*x*x*x+1)/(x*x*x-x*x),asymptote: 2,    asymptoteStr: 'y = 2',   color: T.violet, calc: 'Делим на x³: (2 + 1/x³) / (1 − 1/x) → 2/1 = 2' },
    f4: { label: 'x / (x² + 1)',         f: x => x/(x*x+1),               asymptote: 0,    asymptoteStr: 'y = 0',   color: T.amber,  calc: 'Степень числителя (1) < знаменателя (2) → предел 0' },
    f5: { label: '(x² + 1) / x',         f: x => (x*x+1)/x,               asymptote: null, asymptoteStr: 'нет',     color: T.red,    noAsymptote: true, calc: 'Степень числителя (2) > знаменателя (1) → ∞. Есть наклонная асимптота y=x, но не горизонтальная.' },
    f6: { label: 'sin(x) / x',           f: x => Math.sin(x)/x,           asymptote: 0,    asymptoteStr: 'y = 0',   color: T.cyan,   calc: '|sin(x)| ≤ 1, поэтому |sin(x)/x| ≤ 1/x → 0. Осциллирует, но затухает.' },
  };

  const cfg = configs[fn];
  const xVal = xSlider;
  const fxVal = cfg.f(xVal);
  const fxVal2 = cfg.f(xVal * 10);

  const isCorrect = () => {
    if (cfg.noAsymptote) return guess.trim().toLowerCase().includes('нет') || guess.trim() === '∞';
    if (cfg.asymptote === null) return false;
    const num = parseFloat(guess.replace(',', '.'));
    return Math.abs(num - cfg.asymptote) < 0.05;
  };

  const W = 480, H = 280, SCALE_X = 40, SCALE_Y = 50, OX = 50, OY = 140;
  const toSx = (x: number) => OX + (x / xSlider) * (W - OX - 20);
  const toSy = (y: number) => OY - y * SCALE_Y;

  const graphPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const x = 1 + (i / steps) * (xSlider * 1.2 - 1);
      const y = cfg.f(x);
      if (!isFinite(y) || Math.abs(y) > 6) { pts.push(''); continue; }
      pts.push(`${pts.filter(Boolean).length === 0 ? 'M' : 'L'}${toSx(x).toFixed(1)},${toSy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fn, xSlider, cfg]);

  const asymY = cfg.asymptote !== null ? toSy(cfg.asymptote) : null;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 5 · Пределы" title="Угадай асимптоту"
        question='Когда x уходит на бесконечность, функция "успокаивается" — к какой горизонтальной прямой?' />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Одинаковые степени">
          Если степени числителя и знаменателя одинаковы — асимптота y = (старший коэф. числителя) / (старший коэф. знаменателя).
        </InfoCard>
        <InfoCard color={T.amber} title="Степень числителя меньше">
          Если степень числителя строго меньше степени знаменателя — асимптота y = 0. Знаменатель «побеждает».
        </InfoCard>
        <InfoCard color={T.red} title="Степень числителя больше">
          Горизонтальной асимптоты нет — функция уходит на ±∞. Но может быть наклонная асимптота y = kx + b.
        </InfoCard>
      </div>

      {/* Function selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 }}>
        {(Object.keys(configs) as FnKey[]).map(k => (
          <PresetButton key={k} active={fn === k} onClick={() => { setFn(k); setGuess(''); setChecked(false); setShowCalc(false); }}
            label={configs[k].label} color={configs[k].color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        {/* Graph */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textAlign: 'center' as const }}>f(x) = {cfg.label} · x от 1 до {xSlider.toFixed(0)}</div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            {/* Axes */}
            <line x1={OX} y1={0} x2={OX} y2={H} stroke={T.mutedLight} strokeWidth={1} />
            <line x1={0} y1={OY} x2={W} y2={OY} stroke={T.mutedLight} strokeWidth={1} />

            {/* Asymptote line */}
            {asymY !== null && (
              <line x1={0} y1={asymY} x2={W} y2={asymY} stroke={checked && isCorrect() ? T.green : T.amber} strokeWidth="1.5" strokeDasharray="8 5" />
            )}
            {asymY !== null && (
              <text x={W - 10} y={asymY - 5} textAnchor="end" fontSize="11" fill={checked && isCorrect() ? T.green : T.amber} fontWeight="800">{cfg.asymptoteStr}</text>
            )}

            {/* Graph */}
            <path d={graphPath} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />

            {/* Current point */}
            {isFinite(fxVal) && Math.abs(fxVal) < 6 && (
              <circle cx={toSx(xVal)} cy={toSy(fxVal)} r={6} fill={cfg.color} stroke={T.white} strokeWidth="2" />
            )}

            {/* X axis labels */}
            {[1, Math.round(xSlider/3), Math.round(2*xSlider/3), xSlider].map(v => (
              <text key={v} x={toSx(v)} y={OY + 14} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{v}</text>
            ))}
            {[-2, -1, 0, 1, 2].map(v => (
              <text key={v} x={OX - 8} y={toSy(v) + 3} textAnchor="end" fontSize="9" fill={T.mutedLight}>{v}</text>
            ))}
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Ползунок x → ∞</SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color, textAlign: 'center' as const, marginBottom: 6 }}>x = {xSlider}</div>
            <input type="range" min={10} max={1000} step={10} value={xSlider}
              onChange={e => setXSlider(Number(e.target.value))}
              style={{ width: '100%', accentColor: cfg.color }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
              {[10, 50, 100, 500, 1000].map(v => (
                <button key={v} onClick={() => setXSlider(v)} style={{ padding: '3px 9px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{v}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <StatBadge label={`f(${xSlider})`} value={isFinite(fxVal) ? fxVal.toFixed(5) : '∞'} color={cfg.color} />
            <StatBadge label={`f(${xSlider * 10})`} value={isFinite(fxVal2) ? fxVal2.toFixed(5) : '∞'} color={cfg.color} />
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Твой ответ</SectionLabel>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.muted, alignSelf: 'center' }}>y =</span>
              <input value={guess} onChange={e => { setGuess(e.target.value); setChecked(false); }}
                placeholder={cfg.noAsymptote ? '"нет"' : 'число'}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 700 }} />
            </div>
            <button onClick={() => setChecked(true)} disabled={!guess.trim()}
              style={{ width: '100%', padding: '9px', borderRadius: 10, background: !guess.trim() ? T.surface : T.primaryDark, color: !guess.trim() ? T.muted : T.white, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !guess.trim() ? 0.6 : 1 }}>
              Проверить
            </button>
            {checked && (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, background: isCorrect() ? T.greenLight : T.redLight, fontSize: 12, fontWeight: 700, color: isCorrect() ? T.green : T.red }}>
                {isCorrect() ? `✓ Верно! Асимптота: ${cfg.asymptoteStr}` : `✗ Нет. Правильный ответ: ${cfg.asymptoteStr}`}
              </div>
            )}
          </div>

          <button onClick={() => setShowCalc(a => !a)}
            style={{ padding: '9px 14px', borderRadius: 12, background: showCalc ? T.primary : T.surface, color: showCalc ? T.white : T.muted, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {showCalc ? 'Скрыть вычисление' : '📐 Показать вычисление'}
          </button>

          {showCalc && (
            <div style={{ background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 12, padding: '12px 14px', fontSize: 12, color: T.text, lineHeight: 1.75 }}>
              {cfg.calc}
            </div>
          )}
        </div>
      </div>

      <Callout color={T.green} title="Главный вывод">
        Горизонтальная асимптота — «поведение на бесконечности». Функция может осциллировать вокруг неё (как sin(x)/x) или монотонно приближаться — главное, что разница с асимптотой стремится к нулю.
      </Callout>
    </div>
  );
}

// ─── Lab 6: Piecewise Constructor ────────────────────────────────────────────
function PiecewiseConstructorLab() {
  type TaskMode = 'free' | 'fix-jump' | 'create-jump' | 'make-hole' | 'smooth';
  const [mode, setMode] = useState<TaskMode>('free');
  const [m1, setM1] = useState(1);   // left slope
  const [b1, setB1] = useState(0);   // left intercept
  const [m2, setM2] = useState(1);   // right slope
  const [b2, setB2] = useState(0);   // right intercept
  const [a, setA] = useState(1);     // junction point
  const [fa, setFa] = useState<number | null>(1); // value at a (null = not defined)
  const [noValue, setNoValue] = useState(false);

  const leftLimit  = m1 * a + b1;
  const rightLimit = m2 * a + b2;
  const fVal = noValue ? null : fa;

  const limitsEqual = Math.abs(leftLimit - rightLimit) < 0.001;
  const valueMatchesLimits = fVal !== null && limitsEqual && Math.abs(fVal - leftLimit) < 0.001;

  const status: { text: string; color: string } = !limitsEqual
    ? { text: `Скачок: lim⁻ = ${leftLimit.toFixed(2)} ≠ lim⁺ = ${rightLimit.toFixed(2)}, скачок = ${Math.abs(leftLimit - rightLimit).toFixed(2)}`, color: T.amber }
    : fVal === null
      ? { text: `Устранимый разрыв (дырка): lim = ${leftLimit.toFixed(2)}, f(a) не определено`, color: T.violet }
      : valueMatchesLimits
        ? { text: `Непрерывна в x = ${a}: lim⁻ = lim⁺ = f(a) = ${leftLimit.toFixed(2)}`, color: T.green }
        : { text: `Устранимый разрыв: lim = ${leftLimit.toFixed(2)}, f(a) = ${fVal?.toFixed(2)}`, color: T.violet };

  // Smoothness check (derivatives must match)
  const derivsMatch = Math.abs(m1 - m2) < 0.001;
  const isSmooth = valueMatchesLimits && derivsMatch;

  const W = 500, H = 300, OX = 250, OY = 150, SCALE = 55;
  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number) => OY - y * SCALE;

  const range = 4;
  const leftPath = (() => {
    const x0 = -range, x1 = a;
    const y0 = m1 * x0 + b1, y1 = m1 * x1 + b1;
    return `M${toSx(x0)},${toSy(y0)} L${toSx(x1)},${toSy(y1)}`;
  })();
  const rightPath = (() => {
    const x0 = a, x1 = range;
    const y0 = m2 * x0 + b2, y1 = m2 * x1 + b2;
    return `M${toSx(x0)},${toSy(y0)} L${toSx(x1)},${toSy(y1)}`;
  })();

  const taskConfigs: { id: TaskMode; label: string; task: string; color: string }[] = [
    { id: 'free',       label: 'Свободное',           task: 'Меняй параметры и наблюдай статус непрерывности.',                             color: T.primary },
    { id: 'fix-jump',   label: 'Задание: починить',   task: 'Параметры дают скачок. Исправь b₂ так, чтобы функция стала непрерывной.',      color: T.amber },
    { id: 'create-jump',label: 'Задание: создать скачок', task: 'Создай скачок ровно величиной 2 между ветвями в точке стыка.',              color: T.red },
    { id: 'make-hole',  label: 'Задание: дырка',      task: 'Сделай пределы слева и справа равными, но f(a) не определено.',                color: T.violet },
    { id: 'smooth',     label: 'Задание: гладкость',  task: 'Добейся непрерывности И гладкости: f непрерывна И производные с обеих сторон совпадают.', color: T.green },
  ];

  const activeTask = taskConfigs.find(t => t.id === mode)!;

  // Apply task presets
  const applyPreset = (m: TaskMode) => {
    setMode(m);
    setNoValue(false);
    if (m === 'fix-jump')    { setM1(1); setB1(0); setM2(1); setB2(2); setA(1); setFa(1); }
    if (m === 'create-jump') { setM1(1); setB1(0); setM2(1); setB2(0); setA(1); setFa(1); }
    if (m === 'make-hole')   { setM1(1); setB1(0); setM2(1); setB2(0); setA(1); setNoValue(true); setFa(null); }
    if (m === 'smooth')      { setM1(2); setB1(-1); setM2(1); setB2(0); setA(1); setFa(1); }
    if (m === 'free')        { setM1(1); setB1(0); setM2(1); setB2(0); setA(1); setFa(1); }
  };

  const fmt = (v: number) => Math.round(v * 100) / 100;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 6 · Пределы" title="Конструктор кусочных функций"
        question="Как склеить функцию из кусков, чтобы она была непрерывной? Что нужно подогнать в точке стыка?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Условие непрерывности">
          В точке стыка a нужно выполнить три условия: f(a) определено, lim⁻ = lim⁺, и они оба равны f(a). Одного «равенства ветвей» недостаточно!
        </InfoCard>
        <InfoCard color={T.violet} title="Устранимый разрыв">
          Если lim⁻ = lim⁺, но f(a) ≠ пределу или не определено — устранимый разрыв. Достаточно «подправить» одну точку.
        </InfoCard>
        <InfoCard color={T.green} title="Гладкость = непрерывность производной">
          Непрерывность не требует одинаковых наклонов. Гладкость (C¹) — требует. Это второе условие: m₁ = m₂ в точке стыка. Мостик к теме «Производная».
        </InfoCard>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {taskConfigs.map(tc => (
          <PresetButton key={tc.id} active={mode === tc.id} onClick={() => applyPreset(tc.id)} label={tc.label} color={tc.color} />
        ))}
      </div>

      <div style={{ padding: '10px 16px', borderRadius: 12, background: `${activeTask.color}10`, border: `1px solid ${activeTask.color}30`, marginBottom: 14, fontSize: 13, color: T.text, lineHeight: 1.55 }}>
        <strong style={{ color: activeTask.color }}>Задание:</strong> {activeTask.task}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
        {/* Graph */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12 }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
            {[-4,-3,-2,-1,0,1,2,3,4].map(t => (
              <g key={t}>
                <line x1={toSx(t)} y1={0} x2={toSx(t)} y2={H} stroke={T.border} strokeWidth={t===0?1.5:0.5} />
                <line x1={0} y1={toSy(t)} x2={W} y2={toSy(t)} stroke={T.border} strokeWidth={t===0?1.5:0.5} />
                {t!==0 && <text x={toSx(t)} y={OY+14} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{t}</text>}
                {t!==0 && <text x={OX-10} y={toSy(t)+3} textAnchor="end" fontSize="9" fill={T.mutedLight}>{t}</text>}
              </g>
            ))}

            {/* Junction line */}
            <line x1={toSx(a)} y1={0} x2={toSx(a)} y2={H} stroke={T.mutedLight} strokeWidth="1" strokeDasharray="5 4" />

            {/* Left branch */}
            <path d={leftPath} fill="none" stroke={T.red} strokeWidth="3" strokeLinecap="round" />
            {/* Right branch */}
            <path d={rightPath} fill="none" stroke={T.cyan} strokeWidth="3" strokeLinecap="round" />

            {/* Left limit point */}
            <circle cx={toSx(a)} cy={toSy(leftLimit)} r={6} fill={T.white} stroke={T.red} strokeWidth="2.5" />
            {/* Right limit point */}
            <circle cx={toSx(a)} cy={toSy(rightLimit)} r={6} fill={T.white} stroke={T.cyan} strokeWidth="2.5" />

            {/* f(a) */}
            {fVal !== null && (
              <circle cx={toSx(a)} cy={toSy(fVal)} r={7} fill={valueMatchesLimits ? T.green : T.violet} stroke={T.white} strokeWidth="2" />
            )}
            {fVal === null && (
              <circle cx={toSx(a)} cy={toSy(leftLimit)} r={7} fill={T.white} stroke={T.violet} strokeWidth="2.5" />
            )}

            {/* Labels */}
            <text x={toSx(a) + 8} y={toSy(leftLimit) - 8} fontSize="10" fill={T.red} fontWeight="700">lim⁻={fmt(leftLimit)}</text>
            <text x={toSx(a) + 8} y={toSy(rightLimit) + 14} fontSize="10" fill={T.cyan} fontWeight="700">lim⁺={fmt(rightLimit)}</text>
            {fVal !== null && <text x={toSx(a) - 10} y={toSy(fVal) - 10} textAnchor="end" fontSize="10" fill={T.green} fontWeight="700">f(a)={fmt(fVal)}</text>}
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          {/* Status */}
          <div style={{ padding: '10px 14px', borderRadius: 12, background: `${status.color}12`, border: `1px solid ${status.color}40`, fontSize: 12, fontWeight: 700, color: status.color, lineHeight: 1.55 }}>
            {status.text}
          </div>

          {/* Sliders */}
          <div style={{ background: T.white, border: `1px solid ${T.red}30`, borderRadius: 14, padding: '12px 14px' }}>
            <SectionLabel color={T.red}>Левая ветвь: f(x) = m₁x + b₁</SectionLabel>
            {[['m₁ (наклон)', m1, setM1], ['b₁ (сдвиг)', b1, setB1]].map(([lbl, val, setter]: any) => (
              <div key={lbl as string} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}><span>{lbl as string}</span><strong style={{ color: T.text }}>{fmt(val as number)}</strong></div>
                <input type="range" min={-3} max={3} step={0.1} value={val as number} onChange={e => (setter as any)(Number(e.target.value))} style={{ width: '100%', accentColor: T.red }} />
              </div>
            ))}
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.cyan}30`, borderRadius: 14, padding: '12px 14px' }}>
            <SectionLabel color={T.cyan}>Правая ветвь: f(x) = m₂x + b₂</SectionLabel>
            {[['m₂ (наклон)', m2, setM2], ['b₂ (сдвиг)', b2, setB2]].map(([lbl, val, setter]: any) => (
              <div key={lbl as string} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}><span>{lbl as string}</span><strong style={{ color: T.text }}>{fmt(val as number)}</strong></div>
                <input type="range" min={-3} max={3} step={0.1} value={val as number} onChange={e => (setter as any)(Number(e.target.value))} style={{ width: '100%', accentColor: T.cyan }} />
              </div>
            ))}
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }}>
            <SectionLabel>Точка стыка a и f(a)</SectionLabel>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}><span>a</span><strong style={{ color: T.text }}>{fmt(a)}</strong></div>
              <input type="range" min={-2} max={2} step={0.1} value={a} onChange={e => setA(Number(e.target.value))} style={{ width: '100%', accentColor: T.primary }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}><span>f(a)</span><strong style={{ color: T.text }}>{noValue ? 'не опр.' : fmt(fa ?? 0)}</strong></div>
              <input type="range" min={-3} max={3} step={0.1} value={fa ?? 0} disabled={noValue} onChange={e => setFa(Number(e.target.value))} style={{ width: '100%', accentColor: T.violet, opacity: noValue ? 0.4 : 1 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.muted, cursor: 'pointer' }}>
              <input type="checkbox" checked={noValue} onChange={e => { setNoValue(e.target.checked); if (e.target.checked) setFa(null); else setFa(leftLimit); }} />
              f(a) не определено (дырка)
            </label>
          </div>

          {/* Smoothness badge */}
          <div style={{ padding: '8px 12px', borderRadius: 10, background: isSmooth ? T.greenLight : `${T.amber}12`, border: `1px solid ${isSmooth ? T.green : T.amber}40`, fontSize: 12, fontWeight: 700, color: isSmooth ? T.green : T.amber }}>
            {isSmooth ? '✓ Гладкая (C¹): непрерывна и m₁ = m₂' : derivsMatch ? '— Наклоны совпадают, но функция не непрерывна' : `Наклоны: m₁=${fmt(m1)} ≠ m₂=${fmt(m2)} → излом`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Исследуй сам</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="f(x)=x² слева и f(x)=2x−1 справа в x=1. Непрерывна?" color={T.primary}>
          Левый предел: 1² = 1. Правый: 2·1−1 = 1. Если f(1)=1 — непрерывна! Хотя функции разные — они «сходятся» в точке стыка. Но гладкости нет: наклон слева (2x'|₁=2) = наклону справа (m₂=2). Фактически — гладкая тоже!
        </Collapsible>
        <Collapsible title="Поменяй f(1) на 3. Что случилось?" color={T.violet}>
          Устранимый разрыв: оба предела = 1, но f(1) = 3. Функция «почти непрерывна» — нужно лишь переопределить одну точку.
        </Collapsible>
        <Collapsible title="Каково условие на m₁, b₁, m₂, b₂ для непрерывности в точке a?" color={T.green}>
          Нужно m₁·a + b₁ = m₂·a + b₂, то есть b₂ = b₁ + (m₁ − m₂)·a. Это одно уравнение с четырьмя параметрами — есть много способов «склеить». Гладкость добавляет второе условие: m₁ = m₂.
        </Collapsible>
      </div>

      <Callout color={T.green} title="Главный вывод">
        Непрерывность в точке стыка — ровно одно условие: левый предел = правый предел = значение в точке. Гладкость требует дополнительно равенства производных (наклонов). Это прямой мостик к теме «Производная».
      </Callout>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LimitsContinuityLabView() {
  const [activeLab, setActiveLab] = useState<string>(LIMITS_LABS[0].id);
  const lab = LIMITS_LABS.find(item => item.id === activeLab) ?? LIMITS_LABS[0];

  return (
    <LabShell
      title="Лаборатории: Предел и непрерывность"
      intro="Шесть интерактивных стендов для понимания пределов, непрерывности и разрывов — от ε-δ-игры до конструктора кусочных функций."
      labs={LIMITS_LABS}
      activeId={activeLab}
      onSelect={setActiveLab}
    >
      {lab.id === 'lc-epsilon-delta'            ? <EpsilonDeltaLab />
        : lab.id === 'lc-discontinuity-classifier' ? <DiscontinuityClassifierLab />
        : lab.id === 'lc-one-sided'                ? <OneSidedLimitsLab />
        : lab.id === 'lc-draw-continuity'          ? <DrawContinuityLab />
        : lab.id === 'lc-asymptotes'               ? <AsymptotesLab />
        : lab.id === 'lc-piecewise-constructor'    ? <PiecewiseConstructorLab />
        : <LabBody title={lab.title} question={lab.question} mechanics={lab.mechanics} explore={lab.explore} insight={lab.insight} />
      }
    </LabShell>
  );
}
