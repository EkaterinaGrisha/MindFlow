// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { LabBody, LabShell } from '../shared/labShell';

// ─── Design tokens ────────────────────────────────────────────────────────────
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

// ─── Shared UI ────────────────────────────────────────────────────────────────
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

// ─── Математические функции ───────────────────────────────────────────────────
type FnKey = 'x2' | 'sinx' | 'ex' | 'x3' | 'absx';

const FN_CONFIGS: Record<FnKey, {
  label: string; latex: string;
  f: (x: number) => number;
  df: (x: number) => number;
  color: string;
}> = {
  x2:   { label: 'x²',       latex: 'f(x) = x²',       f: x => x * x,             df: x => 2 * x,              color: T.primary },
  sinx: { label: 'sin x',    latex: 'f(x) = sin x',     f: x => Math.sin(x),       df: x => Math.cos(x),        color: T.green   },
  ex:   { label: 'eˣ',       latex: 'f(x) = eˣ',        f: x => Math.exp(x),       df: x => Math.exp(x),        color: T.violet  },
  x3:   { label: 'x³ − 3x',  latex: 'f(x) = x³ − 3x',  f: x => x*x*x - 3*x,      df: x => 3*x*x - 3,          color: T.amber   },
  absx: { label: '|x|',      latex: 'f(x) = |x|',       f: x => Math.abs(x),       df: x => x > 0 ? 1 : x < 0 ? -1 : NaN, color: T.red },
};

// ─── Shared SVG grid helper ───────────────────────────────────────────────────
function GridLines({ W, H, OX, OY, SCALE, xRange = 4, yRange = 4 }: {
  W: number; H: number; OX: number; OY: number; SCALE: number; xRange?: number; yRange?: number;
}) {
  const ticks = [];
  for (let i = -xRange; i <= xRange; i++) ticks.push(i);
  return (
    <g>
      {ticks.map(t => (
        <g key={`x${t}`}>
          <line x1={OX + t * SCALE} y1={0} x2={OX + t * SCALE} y2={H} stroke={T.border} strokeWidth={t === 0 ? 1.5 : 0.5} />
          {t !== 0 && <text x={OX + t * SCALE} y={OY + 16} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{t}</text>}
        </g>
      ))}
      {ticks.map(t => (
        <g key={`y${t}`}>
          <line x1={0} y1={OY - t * SCALE} x2={W} y2={OY - t * SCALE} stroke={T.border} strokeWidth={t === 0 ? 1.5 : 0.5} />
          {t !== 0 && <text x={OX - 10} y={OY - t * SCALE + 3} textAnchor="end" fontSize="9" fill={T.mutedLight}>{t}</text>}
        </g>
      ))}
    </g>
  );
}

function buildPath(
  fn: (x: number) => number,
  W: number, OX: number, OY: number, SCALE: number,
  skipNear?: number
): string {
  const pts: string[] = [];
  const steps = 600;
  const xMin = (0 - OX) / SCALE, xMax = (W - OX) / SCALE;
  let lastOk = false;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (xMax - xMin) * i / steps;
    if (skipNear !== undefined && Math.abs(x - skipNear) < 0.015) { lastOk = false; continue; }
    try {
      const y = fn(x);
      if (!isFinite(y) || Math.abs(y) > 12) { lastOk = false; continue; }
      const sx = OX + x * SCALE, sy = OY - y * SCALE;
      pts.push(`${!lastOk ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`);
      lastOk = true;
    } catch { lastOk = false; }
  }
  return pts.join(' ');
}

// ─── Lab definitions ──────────────────────────────────────────────────────────
const DERIVATIVE_LABS = [
  {
    id: 'dg-secant-tangent',
    title: 'Лаборатория 1: От секущей к касательной',
    shortTitle: 'Секущая → касательная',
    question: 'Что происходит с секущей, когда вторая точка бесконечно приближается к первой? Как рождается касательная?',
    mechanics: ['Фиксированная точка A, подвижная точка B.', 'Ползунок h: расстояние от A до B по оси X.', 'Разностное отношение стремится к производной.'],
    explore: ['Для x² в x=1: при каком h ошибка < 0.01?', 'Для sin(x): к чему стремится наклон в x=π/4?', 'Для |x| в x=0: наклоны слева и справа — разные!'],
    insight: 'Производная — это предел разностного отношения. Не магия, а геометрия: секущая сходится к касательной.',
  },
  {
    id: 'dg-function-derivative',
    title: 'Лаборатория 2: Производная как функция: два графика',
    shortTitle: 'Два графика: f и f′',
    question: 'Как связаны форма графика функции и значения её производной? Можно ли «увидеть» производную по графику?',
    mechanics: ['Верхний график: f(x) с касательной.', 'Нижний: f′(x) — синхронизирован по оси X.', 'Красный курсор движется по обоим графикам одновременно.'],
    explore: ['Где f′=0? Что с f в этой точке?', 'Где f растёт, а f′ падает — как это возможно?', 'Для eˣ: почему оба графика совпадают?'],
    insight: 'Производная — «тень» функции. Где f растёт — f′>0, где убывает — f′<0, где экстремум — f′=0.',
  },
  {
    id: 'dg-extrema',
    title: 'Лаборатория 3: Охота на экстремумы',
    shortTitle: 'Охота на экстремумы',
    question: 'Как отличить максимум от минимума по производной? И всегда ли f′=0 означает экстремум?',
    mechanics: ['График многочлена с ползунками коэффициентов.', 'Критические точки подсвечены.', 'Знаки f′ слева и справа, значение f″.'],
    explore: ['x³−3x: проверь x=−1 и x=1.', 'x³: f′(0)=0, но это экстремум?', 'x⁴: f′(0)=0, f″(0)=0 — а это что?'],
    insight: 'f′(x)=0 — необходимое, но не достаточное условие экстремума. Нужна смена знака f′ или ненулевое f″.',
  },
  {
    id: 'dg-differentiability',
    title: 'Лаборатория 4: Гладкость vs излом',
    shortTitle: 'Гладкость vs излом',
    question: 'Все ли непрерывные функции дифференцируемы? Что значит «излом» и чем он отличается от «гладкого изгиба»?',
    mechanics: ['Галерея функций с заданной точкой a.', 'Два вопроса: непрерывна? дифференцируема?', 'Показ разностного отношения слева и справа.'],
    explore: ['Найди функцию: непрерывна, но не дифф-ма.', 'Сравни |x| и x^(1/3) в нуле — оба не дифф-мы, но в чём разница?', 'Кусочная: когда стыковка гладкая?'],
    insight: 'Дифференцируемость сильнее непрерывности. Излом — конечные разные пределы. Вертикальная касательная — бесконечный предел.',
  },
  {
    id: 'dg-tangent-builder',
    title: 'Лаборатория 5: Конструктор касательной',
    shortTitle: 'Конструктор касательной',
    question: 'Как касательная «катится» по графику? Где она горизонтальна? Как точно она приближает функцию?',
    mechanics: ['Ползунок a — точка касания.', 'Уравнение касательной в реальном времени.', 'Режим задания: запиши уравнение, система проверит.'],
    explore: ['x²: где наклон касательной максимален по модулю?', 'eˣ в x=0: насколько y=1+x точна при x=0.5?', 'Перегиб x³: касательная пересекает график — почему?'],
    insight: 'Касательная — лучшее линейное приближение функции. В экстремумах — горизонтальна. В перегибах — пересекает график.',
  },
  {
    id: 'dg-rules',
    title: 'Лаборатория 6: Правила дифференцирования',
    shortTitle: 'Правила дифф-ния',
    question: 'Можно ли находить производные механически, применяя правила? Как компьютер считает производную?',
    mechanics: ['Конструктор функций из блоков.', 'Пошаговое применение правил: сумма, произведение, цепное.', 'Режим тренажёра: угадай производную.'],
    explore: ['x·sin(x): правило произведения.', 'sin(x²): цепное правило.', 'eˢⁱⁿ⁽ˣ⁾: сколько шагов цепного правила?'],
    insight: 'Любая элементарная функция дифференцируется механически. Именно это делает backprop в нейросетях — цепное правило на миллионы переменных.',
  },
] as const;

// ─── Lab 1: Secant → Tangent ──────────────────────────────────────────────────
function SecantTangentLab() {
  const [fnKey, setFnKey] = useState<FnKey>('x2');
  const [a, setA] = useState(1);
  const [h, setH] = useState(1.0);
  const [showTangent, setShowTangent] = useState(false);
  const [hNeg, setHNeg] = useState(false);

  const cfg = FN_CONFIGS[fnKey];
  const fa = cfg.f(a);
  const dfA = cfg.df(a);
  const bX = a + (hNeg ? -h : h);
  const fb = cfg.f(bX);
  const secantSlope = h < 0.0001 ? NaN : (fb - fa) / (bX - a);
  const error = isFinite(secantSlope) && isFinite(dfA) ? Math.abs(secantSlope - dfA) : NaN;

  const W = 500, H = 300, OX = 250, OY = 150, SCALE = 55;
  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number) => OY - y * SCALE;

  const graphPath = useMemo(() => buildPath(cfg.f, W, OX, OY, SCALE), [fnKey]);

  // Secant line endpoints
  const secantLine = useMemo(() => {
    if (!isFinite(secantSlope)) return null;
    const x0 = -4, x1 = 6;
    const y0 = fa + secantSlope * (x0 - a);
    const y1 = fa + secantSlope * (x1 - a);
    return { x0, y0, x1, y1 };
  }, [secantSlope, fa, a]);

  // Tangent line
  const tangentLine = useMemo(() => {
    if (!isFinite(dfA)) return null;
    const x0 = -4, x1 = 6;
    return { x0, y0: fa + dfA * (x0 - a), x1, y1: fa + dfA * (x1 - a) };
  }, [dfA, fa, a]);

  const fmt = (v: number, d = 4) => isFinite(v) ? v.toFixed(d) : '∄';

  const fnOptions: { key: FnKey; label: string }[] = [
    { key: 'x2', label: 'x²' }, { key: 'sinx', label: 'sin x' },
    { key: 'ex', label: 'eˣ' }, { key: 'x3', label: 'x³−3x' }, { key: 'absx', label: '|x|' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 1 · Производная" title="От секущей к касательной"
        question="Что происходит с секущей, когда вторая точка бесконечно приближается к первой? Как рождается касательная?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Разностное отношение">
          Наклон секущей через A и B — это [f(a+h)−f(a)] / h. При h→0 секущая поворачивается и стремится к касательной. Производная — предел этого отношения.
        </InfoCard>
        <InfoCard color={T.green} title="Неопределённость 0/0">
          При h=0 формула даёт 0/0. Производная — это именно предел, не значение при h=0. Поэтому ползунок нельзя поставить в ноль.
        </InfoCard>
        <InfoCard color={T.red} title="Когда предела нет">
          Для |x| в нуле: слева h{'<'}0 даёт наклон −1, справа h{'>'}0 даёт +1. Пределы разные → производной нет → излом.
        </InfoCard>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {fnOptions.map(o => (
          <PresetButton key={o.key} active={fnKey === o.key}
            onClick={() => { setFnKey(o.key); setH(1.0); }}
            label={o.label} color={FN_CONFIGS[o.key].color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        {/* Graph */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textAlign: 'center' as const }}>{cfg.latex}</div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
            <GridLines W={W} H={H} OX={OX} OY={OY} SCALE={SCALE} />

            {/* Tangent (if shown) */}
            {showTangent && tangentLine && (
              <line x1={toSx(tangentLine.x0)} y1={toSy(tangentLine.y0)} x2={toSx(tangentLine.x1)} y2={toSy(tangentLine.y1)}
                stroke={T.green} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8" />
            )}

            {/* Secant */}
            {secantLine && (
              <line x1={toSx(secantLine.x0)} y1={toSy(secantLine.y0)} x2={toSx(secantLine.x1)} y2={toSy(secantLine.y1)}
                stroke={T.amber} strokeWidth="2.5" strokeLinecap="round" />
            )}

            {/* Graph */}
            <path d={graphPath} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />

            {/* Point A */}
            {isFinite(fa) && Math.abs(fa) < 10 && (
              <g>
                <circle cx={toSx(a)} cy={toSy(fa)} r={7} fill={T.primary} stroke={T.white} strokeWidth="2" />
                <text x={toSx(a) + 10} y={toSy(fa) - 8} fontSize="11" fill={T.primaryDark} fontWeight="800">A</text>
              </g>
            )}

            {/* Point B */}
            {isFinite(fb) && Math.abs(fb) < 10 && (
              <g>
                <circle cx={toSx(bX)} cy={toSy(fb)} r={7} fill={T.amber} stroke={T.white} strokeWidth="2" />
                <text x={toSx(bX) + 10} y={toSy(fb) - 8} fontSize="11" fill={T.amber} fontWeight="800">B</text>
                {/* h arrow */}
                <line x1={toSx(a)} y1={toSy(fa) + 18} x2={toSx(bX)} y2={toSy(fa) + 18} stroke={T.amber} strokeWidth="1.5" />
                <text x={(toSx(a) + toSx(bX)) / 2} y={toSy(fa) + 32} textAnchor="middle" fontSize="10" fill={T.amber} fontWeight="700">h</text>
              </g>
            )}

            {/* Tangent label */}
            {showTangent && tangentLine && (
              <text x={toSx(3.5)} y={toSy(cfg.f(3.5) + 0.5) - 6} fontSize="10" fill={T.green} fontWeight="700">касательная</text>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Точка A: x = a</SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.primary, textAlign: 'center' as const, marginBottom: 6 }}>a = {a.toFixed(2)}</div>
            <input type="range" min={-2.5} max={2.5} step={0.1} value={a} onChange={e => setA(Number(e.target.value))} style={{ width: '100%', accentColor: T.primary }} />
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Шаг h (расстояние до B)</SectionLabel>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.amber, textAlign: 'center' as const, marginBottom: 6 }}>h = {h.toFixed(4)}</div>
            <input type="range" min={0.001} max={2.5} step={0.001} value={h} onChange={e => setH(Number(e.target.value))} style={{ width: '100%', accentColor: T.amber }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
              {[2, 1, 0.5, 0.1, 0.01, 0.001].map(v => (
                <button key={v} onClick={() => setH(v)} style={{ padding: '3px 9px', borderRadius: 8, border: `1px solid ${T.amberLight}`, background: T.amberLight, color: '#92400e', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                  {v}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12, color: T.muted, cursor: 'pointer' }}>
              <input type="checkbox" checked={hNeg} onChange={e => setHNeg(e.target.checked)} />
              h отрицательный (B слева от A)
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <StatBadge label="Наклон секущей" value={fmt(secantSlope)} color={T.amber} />
            <StatBadge label="f′(a) = истинная" value={isFinite(dfA) ? fmt(dfA) : '∄'} color={T.green} />
            <StatBadge label="Ошибка |secant − f′|" value={isFinite(error) ? fmt(error) : '∄'} color={error < 0.01 ? T.green : error < 0.1 ? T.amber : T.red} />
          </div>

          <button onClick={() => setShowTangent(s => !s)}
            style={{ padding: '9px 14px', borderRadius: 12, background: showTangent ? T.green : T.surface, color: showTangent ? T.white : T.muted, border: `1px solid ${showTangent ? T.green : T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {showTangent ? '✓ Касательная видна' : 'Показать касательную'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="Почему ползунок нельзя поставить в h=0?" color={T.primary}>
          При h=0 формула [f(a+h)−f(a)]/h даёт 0/0 — неопределённость. Производная — это предел при h→0, а не значение при h=0. Деление на ноль не определено даже для калькулятора.
        </Collapsible>
        <Collapsible title="Для |x| в a=0: поставь h положительным, потом отрицательным. Что видишь?" color={T.red}>
          При h{'>'}0 наклон секущей = +1. При h{'<'}0 наклон = −1. Два разных числа. Предела нет → производной в нуле нет → излом.
        </Collapsible>
        <Collapsible title="Для eˣ в a=0: чему равна производная? Проверь при разных h." color={T.violet}>
          f′(0) = e⁰ = 1. При h=0.001 наклон секущей ≈ 1.0005 — очень близко. Это свойство eˣ: единственная функция, у которой производная равна самой функции.
        </Collapsible>
      </div>

      <Callout color={T.primary} title="Главный вывод">
        Производная — это не магия. Это наклон секущей, когда h→0. Для «хороших» функций пределы слева и справа сходятся к одному числу. Для |x| в нуле — нет. Визуально это видно: секущая не стремится к одной прямой.
      </Callout>
    </div>
  );
}

// ─── Lab 2: Function and its Derivative ───────────────────────────────────────
function FunctionDerivativeLab() {
  const [fnKey, setFnKey] = useState<FnKey>('x3');
  const [cursor, setCursor] = useState(0.5);
  const svgRef = useRef<SVGSVGElement>(null);

  const cfg = FN_CONFIGS[fnKey];
  const W = 500, H = 200, OX = 250, OY = 100, SCALE = 50;
  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number, oy: number) => oy - y * SCALE;

  const fPath  = useMemo(() => buildPath(cfg.f,  W, OX, OY, SCALE), [fnKey]);
  const dfPath = useMemo(() => buildPath(cfg.df, W, OX, OY, SCALE), [fnKey]);

  const fa  = cfg.f(cursor);
  const dfa = cfg.df(cursor);
  const isFiniteFA  = isFinite(fa)  && Math.abs(fa)  < 10;
  const isFiniteDFA = isFinite(dfa) && Math.abs(dfa) < 10;

  // Tangent
  const tLen = 3;
  const angle = isFiniteDFA ? Math.atan(dfa) : 0;
  const tx1 = cursor - tLen * Math.cos(angle), ty1 = fa - tLen * Math.sin(angle);
  const tx2 = cursor + tLen * Math.cos(angle), ty2 = fa + tLen * Math.sin(angle);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>, oy: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    setCursor((sx - OX) / SCALE);
  };

  const signColor = (v: number) => !isFinite(v) ? T.muted : v > 0.01 ? T.green : v < -0.01 ? T.red : T.amber;
  const signText  = (v: number) => !isFinite(v) ? '∄' : v > 0.01 ? `+${v.toFixed(3)}` : v.toFixed(3);

  const fnOptions: { key: FnKey; label: string }[] = [
    { key: 'x2', label: 'x²' }, { key: 'sinx', label: 'sin x' },
    { key: 'ex', label: 'eˣ' }, { key: 'x3', label: 'x³−3x' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 2 · Производная" title="Производная как функция: два графика"
        question="Как связаны форма графика функции и значения её производной? Можно ли «увидеть» производную по графику?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Когда f′{'>'} 0">
          Функция возрастает (наклон вверх) → производная положительна → точка на нижнем графике выше нуля. Чем круче рост — тем выше точка.
        </InfoCard>
        <InfoCard color={T.red} title="Когда f′{'<'} 0">
          Функция убывает → производная отрицательна → точка ниже нуля. На экстремумах функция «разворачивается» — производная меняет знак.
        </InfoCard>
        <InfoCard color={T.amber} title="Когда f′ = 0">
          Касательная горизонтальна. Это экстремум (или перегиб). Нижний график пересекает ось X. Двигай курсор к вершинам и впадинам функции.
        </InfoCard>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {fnOptions.map(o => (
          <PresetButton key={o.key} active={fnKey === o.key} onClick={() => { setFnKey(o.key); setCursor(0.5); }} label={o.label} color={FN_CONFIGS[o.key].color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 18, alignItems: 'start' }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 4, textAlign: 'center' as const }}>↑ кликни по графику для перемещения курсора</div>

          {/* Top: f(x) */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: cfg.color, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 2, paddingLeft: 6 }}>f(x) = {cfg.label}</div>
            <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}
              style={{ display: 'block', width: '100%', height: 'auto', cursor: 'crosshair' }}
              onClick={e => handleSvgClick(e, OY)}>
              <GridLines W={W} H={H} OX={OX} OY={OY} SCALE={SCALE} />

              {/* Tangent */}
              {isFiniteFA && isFiniteDFA && (
                <line x1={toSx(tx1)} y1={toSy(ty1, OY)} x2={toSx(tx2)} y2={toSy(ty2, OY)}
                  stroke={T.amber} strokeWidth="1.5" strokeDasharray="5 3" />
              )}

              <path d={fPath} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />

              {/* Cursor on top */}
              <line x1={toSx(cursor)} y1={0} x2={toSx(cursor)} y2={H} stroke={T.red} strokeWidth="1.5" strokeDasharray="4 3" />
              {isFiniteFA && (
                <circle cx={toSx(cursor)} cy={toSy(fa, OY)} r={6} fill={T.red} stroke={T.white} strokeWidth="2" />
              )}
            </svg>
          </div>

          {/* Bottom: f′(x) */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.primary, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 2, paddingLeft: 6 }}>f′(x)</div>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
              style={{ display: 'block', width: '100%', height: 'auto', cursor: 'crosshair' }}
              onClick={e => {
                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                const sx = (e.clientX - rect.left) * (W / rect.width);
                setCursor((sx - OX) / SCALE);
              }}>
              <GridLines W={W} H={H} OX={OX} OY={OY} SCALE={SCALE} />
              <path d={dfPath} fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" />
              <line x1={toSx(cursor)} y1={0} x2={toSx(cursor)} y2={H} stroke={T.red} strokeWidth="1.5" strokeDasharray="4 3" />
              {isFiniteDFA && (
                <circle cx={toSx(cursor)} cy={toSy(dfa, OY)} r={6} fill={T.primary} stroke={T.white} strokeWidth="2" />
              )}
            </svg>
          </div>
        </div>

        {/* Stats panel */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Курсор</SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.red, textAlign: 'center' as const, marginBottom: 6 }}>x = {cursor.toFixed(3)}</div>
            <input type="range" min={-4} max={4} step={0.01} value={cursor} onChange={e => setCursor(Number(e.target.value))} style={{ width: '100%', accentColor: T.red }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <StatBadge label="f(x)" value={isFiniteFA ? fa.toFixed(4) : '∞'} color={cfg.color} />
            <StatBadge label="f′(x)" value={isFiniteDFA ? signText(dfa) : '∄'} color={signColor(dfa)} />
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 12, background: `${signColor(dfa)}10`, border: `1px solid ${signColor(dfa)}30`, fontSize: 13, fontWeight: 700, color: signColor(dfa), lineHeight: 1.55 }}>
            {!isFiniteDFA ? 'Производная не существует'
              : Math.abs(dfa) < 0.02 ? '⎯ Касательная горизонтальна — экстремум или перегиб'
              : dfa > 0 ? '↗ Функция возрастает'
              : '↘ Функция убывает'}
          </div>

          <Collapsible title="Для eˣ: почему оба графика совпадают?" color={T.violet}>
            eˣ — единственная функция, у которой (eˣ)′ = eˣ. Производная равна самой функции. Это определяющее свойство экспоненты: скорость роста в каждой точке равна текущему значению.
          </Collapsible>

          <Collapsible title="Функция растёт, а f′ падает — как?" color={T.amber}>
            f{'>'}0 означает, что функция движется вверх. f′ падает — значит скорость роста уменьшается. Как автомобиль, который едет вперёд, но жмёт на тормоз: движется вперёд, но всё медленнее.
          </Collapsible>
        </div>
      </div>

      <Callout color={T.green} title="Главный вывод">
        Производная — «тень» функции. Где f растёт — f′{'>'} 0. Где убывает — f′{'<'} 0. Где экстремум — f′ = 0. Смотреть на оба графика вместе — читать книгу и её конспект одновременно.
      </Callout>
    </div>
  );
}

// ─── Lab 3: Extrema ───────────────────────────────────────────────────────────
function ExtremaLab() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(-3);
  const [c, setC] = useState(0);
  const [d, setD] = useState(0);
  const [guessMode, setGuessMode] = useState(false);
  const [guesses, setGuesses] = useState<Record<string, 'max' | 'min' | 'inflection' | null>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  // f(x) = x³ + a*x² + b*x + c  (d is vertical shift)
  // For simplicity: f(x) = x³ + (a/2)*x² + b*x + d
  const f  = (x: number) => x*x*x + (a/2)*x*x + b*x + d;
  const df = (x: number) => 3*x*x + a*x + b;
  const d2f= (x: number) => 6*x + a;

  // Find critical points: df(x) = 0 → 3x² + a*x + b = 0
  const disc = a*a - 12*b;
  const critPoints = disc < 0 ? [] : disc === 0
    ? [-a / 6]
    : [(-a - Math.sqrt(disc)) / 6, (-a + Math.sqrt(disc)) / 6];

  const W = 500, H = 300, OX = 250, OY = 150, SCALE = 45;
  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number) => OY - y * SCALE;

  const fPath = useMemo(() => buildPath(f, W, OX, OY, SCALE), [a, b, c, d]);

  const getType = (x: number): 'max' | 'min' | 'inflection' => {
    const d2 = d2f(x);
    const leftSign  = df(x - 0.01);
    const rightSign = df(x + 0.01);
    if (leftSign > 0 && rightSign < 0) return 'max';
    if (leftSign < 0 && rightSign > 0) return 'min';
    return 'inflection';
  };

  const typeColor = { max: T.primary, min: T.green, inflection: T.amber };
  const typeLabel = { max: 'Максимум', min: 'Минимум', inflection: 'Перегиб (не экстремум)' };
  const typeIcon  = { max: '▼', min: '▲', inflection: '∼' };

  const fmt = (v: number) => v.toFixed(3);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 3 · Производная" title="Охота на экстремумы"
        question="Как отличить максимум от минимума по производной? И всегда ли f′=0 означает экстремум?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Первый признак">
          Смена знака f′: «+» → «−» = максимум; «−» → «+» = минимум; знак не меняется = перегиб. Проверка всегда работает.
        </InfoCard>
        <InfoCard color={T.green} title="Второй признак (f″)">
          f″(x₀) {'<'} 0 → максимум (вогнуто вниз). f″(x₀) {'>'} 0 → минимум (вогнуто вверх). f″(x₀) = 0 → нужен первый признак.
        </InfoCard>
        <InfoCard color={T.amber} title="Перегиб: ловушка">
          f′(x₀)=0 и f″(x₀)=0 — не говорит о типе. Пример: x³ в нуле — перегиб, но не экстремум. Пример: x⁴ в нуле — минимум! Нужен первый признак.
        </InfoCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
        {/* Graph */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textAlign: 'center' as const }}>
            f(x) = x³ + {(a/2).toFixed(1)}x² + {b.toFixed(1)}x + {d.toFixed(1)}
          </div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
            <GridLines W={W} H={H} OX={OX} OY={OY} SCALE={SCALE} />
            <path d={fPath} fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" />

            {/* Critical points */}
            {critPoints.map((x, i) => {
              const y = f(x);
              if (!isFinite(y) || Math.abs(y) > 8) return null;
              const type = getType(x);
              const color = typeColor[type];
              return (
                <g key={i}>
                  {/* Horizontal tangent line */}
                  <line x1={toSx(x - 1)} y1={toSy(y)} x2={toSx(x + 1)} y2={toSy(y)} stroke={color} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
                  <circle cx={toSx(x)} cy={toSy(y)} r={8} fill={color} stroke={T.white} strokeWidth="2" />
                  <text x={toSx(x)} y={toSy(y) - 12} textAnchor="middle" fontSize="11" fill={color} fontWeight="800">{typeIcon[type]}</text>
                  <text x={toSx(x)} y={toSy(y) + 22} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">x={fmt(x)}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {/* Sliders */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Коэффициенты f(x) = x³ + (a/2)x² + bx + d</SectionLabel>
            {[['a/2', a, setA, -6, 6], ['b', b, setB, -6, 2], ['d', d, setD, -3, 3]].map(([lbl, val, setter, mn, mx]: any) => (
              <div key={lbl as string} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{lbl as string}</span>
                  <strong style={{ color: T.text }}>{(lbl === 'a/2' ? val/2 : val).toFixed(1)}</strong>
                </div>
                <input type="range" min={mn} max={mx} step={0.1} value={val as number} onChange={e => (setter as any)(Number(e.target.value))} style={{ width: '100%', accentColor: T.primary }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <button onClick={() => { setA(0); setB(-3); setC(0); setD(0); }} style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, fontSize: 10, fontWeight: 700, cursor: 'pointer', color: T.muted }}>x³−3x</button>
              <button onClick={() => { setA(0); setB(0); setC(0); setD(0); }} style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, fontSize: 10, fontWeight: 700, cursor: 'pointer', color: T.muted }}>x³</button>
              <button onClick={() => { setA(-4); setB(0); setC(0); setD(0); }} style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, fontSize: 10, fontWeight: 700, cursor: 'pointer', color: T.muted }}>x³−2x²</button>
            </div>
          </div>

          {/* Critical points analysis */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Критические точки (f′=0)</SectionLabel>
            {critPoints.length === 0
              ? <div style={{ fontSize: 12, color: T.muted, fontStyle: 'italic' }}>Критических точек нет</div>
              : critPoints.map((x, i) => {
                  const y = f(x), d2 = d2f(x);
                  const type = getType(x);
                  const color = typeColor[type];
                  const leftSign = df(x - 0.05) > 0 ? '+' : '−';
                  const rightSign = df(x + 0.05) > 0 ? '+' : '−';
                  const key = `cp${i}`;
                  const guess = guesses[key];
                  const rev = revealed[key];

                  return (
                    <div key={i} style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: `${color}08`, border: `1px solid ${color}25` }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 6 }}>x₀ = {fmt(x)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, fontSize: 12, color: T.muted }}>
                        <span>f(x₀) = {isFinite(y) ? fmt(y) : '∞'}</span>
                        <span>f″(x₀) = {fmt(d2)} {d2 > 0 ? '→ вогнуто вверх' : d2 < 0 ? '→ вогнуто вниз' : '→ неоднозначно'}</span>
                        <span>f′ слева: <strong style={{ color: leftSign === '+' ? T.green : T.red }}>{leftSign}</strong> → справа: <strong style={{ color: rightSign === '+' ? T.green : T.red }}>{rightSign}</strong></span>
                      </div>

                      {guessMode && !rev ? (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>Твой ответ:</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                            {(['max', 'min', 'inflection'] as const).map(t => (
                              <button key={t} onClick={() => setGuesses(g => ({ ...g, [key]: t }))}
                                style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: guess === t ? typeColor[t] : T.surface, color: guess === t ? T.white : T.text, border: `1px solid ${typeColor[t]}` }}>
                                {typeLabel[t]}
                              </button>
                            ))}
                          </div>
                          {guess && (
                            <button onClick={() => setRevealed(r => ({ ...r, [key]: true }))}
                              style={{ marginTop: 8, padding: '5px 12px', borderRadius: 8, background: T.primaryDark, color: T.white, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              Проверить
                            </button>
                          )}
                          {rev && (
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: guess === type ? T.green : T.red }}>
                              {guess === type ? `✓ Верно — ${typeLabel[type]}!` : `✗ Нет. Правильно: ${typeLabel[type]}`}
                            </div>
                          )}
                        </div>
                      ) : (
                        !guessMode && (
                          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color }}>
                            {typeIcon[type]} {typeLabel[type]}
                          </div>
                        )
                      )}
                    </div>
                  );
                })
            }
          </div>

          <button onClick={() => { setGuessMode(m => !m); setGuesses({}); setRevealed({}); }}
            style={{ padding: '9px 14px', borderRadius: 12, background: guessMode ? T.primary : T.surface, color: guessMode ? T.white : T.muted, border: `1px solid ${guessMode ? T.primary : T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {guessMode ? '🎮 Режим угадайки вкл.' : '🎮 Включить режим угадайки'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="x³ в x=0: f′(0)=0, f″(0)=0 — что это?" color={T.amber}>
          Это перегиб — не экстремум. f′ меняет знак с «+» на «+» (не меняет!). Функция проходит «насквозь» свою горизонтальную касательную. f″=0 не даёт ответа — нужен первый признак.
        </Collapsible>
        <Collapsible title="Загадка: f′(x₀)=0 и f″(x₀)=0. Это точно не экстремум?" color={T.primary}>
          Нет! x⁴ в нуле: f′(0)=0, f″(0)=0, но это минимум — f′ меняет знак с «−» на «+». f=0 — не «неопределённость», это просто значит, что второй признак не работает. Используем первый.
        </Collapsible>
      </div>

      <Callout color={T.primary} title="Главный вывод">
        f′(x₀)=0 — необходимое, но не достаточное условие экстремума. Нужна проверка смены знака f′ (первый признак) или ненулевое f″ (второй признак). Критически важно для градиентного спуска: точка с нулевым градиентом может быть не только минимумом, но и седлом или перегибом.
      </Callout>
    </div>
  );
}

// ─── Lab 4: Differentiability ─────────────────────────────────────────────────
function DifferentiabilityLab() {
  const functions = [
    {
      id: 'x2',     label: 'f(x) = x², a = 0',
      f: (x: number) => x*x,
      df: (x: number) => 2*x,
      a: 0, continuous: true, differentiable: true,
      leftSlope: '0', rightSlope: '0',
      note: 'Обе стороны дают 0. Гладкий параболический минимум.',
      insight: 'Стандартный пример дифференцируемой функции. Нет излома, нет вертикальной касательной.',
    },
    {
      id: 'absx',   label: 'f(x) = |x|, a = 0',
      f: (x: number) => Math.abs(x),
      df: (x: number) => x === 0 ? NaN : x > 0 ? 1 : -1,
      a: 0, continuous: true, differentiable: false,
      leftSlope: '−1', rightSlope: '+1',
      note: 'Конечные разные односторонние пределы → излом.',
      insight: 'Непрерывна (нет разрыва), но не дифф-ма: наклон справа +1, слева −1. Классический излом.',
    },
    {
      id: 'cbrt',   label: 'f(x) = x^(1/3), a = 0',
      f: (x: number) => x >= 0 ? Math.pow(x, 1/3) : -Math.pow(-x, 1/3),
      df: (x: number) => x === 0 ? Infinity : (1/3) * Math.pow(Math.abs(x), -2/3),
      a: 0, continuous: true, differentiable: false,
      leftSlope: '+∞', rightSlope: '+∞',
      note: 'Оба предела = +∞ → вертикальная касательная.',
      insight: 'Непрерывна и симметрична, но не дифф-ма: касательная вертикальна. Предел бесконечен — это другой тип недифференцируемости.',
    },
    {
      id: 'smooth',  label: 'f(x) = {x², x<1; 2x−1, x≥1}, a = 1',
      f: (x: number) => x < 1 ? x*x : 2*x - 1,
      df: (x: number) => x < 1 ? 2*x : 2,
      a: 1, continuous: true, differentiable: true,
      leftSlope: '2', rightSlope: '2',
      note: 'Оба предела = 2. Гладкая стыковка — дифференцируема.',
      insight: 'Кусочная функция: f(1⁻)=1, f(1⁺)=1 — непрерывна. f′(1⁻)=2, f′(1⁺)=2 — дифференцируема. Нет излома.',
    },
    {
      id: 'kink',    label: 'f(x) = {x², x<1; 3x−2, x≥1}, a = 1',
      f: (x: number) => x < 1 ? x*x : 3*x - 2,
      df: (x: number) => x < 1 ? 2*x : 3,
      a: 1, continuous: true, differentiable: false,
      leftSlope: '2', rightSlope: '3',
      note: 'Пределы разные: 2 ≠ 3 → излом.',
      insight: 'Непрерывна (значения совпадают в x=1), но не дифф-ма: производная слева 2, справа 3. Видимый излом.',
    },
    {
      id: 'disc',    label: 'f(x) = 1/x, a = 0',
      f: (x: number) => x === 0 ? NaN : 1/x,
      df: (x: number) => x === 0 ? NaN : -1/(x*x),
      a: 0, continuous: false, differentiable: false,
      leftSlope: '−∞', rightSlope: '+∞',
      note: 'Не непрерывна (разрыв) → не дифференцируема.',
      insight: 'Разрывная функция не может быть дифф-мой в точке разрыва. Дифф-мость влечёт непрерывность (обратное неверно).',
    },
  ];

  const [selected, setSelected] = useState(0);
  const [answerC, setAnswerC] = useState<boolean | null>(null);
  const [answerD, setAnswerD] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  const fn = functions[selected];
  const W = 380, H = 200, OX = 190, OY = 100, SCALE = 48;
  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number) => OY - y * SCALE;

  const fPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 400;
    const xMin = (0 - OX) / SCALE, xMax = (W - OX) / SCALE;
    let lastOk = false;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (xMax - xMin) * i / steps;
      if (Math.abs(x - fn.a) < 0.01 && !fn.continuous) { lastOk = false; continue; }
      try {
        const y = fn.f(x);
        if (!isFinite(y) || Math.abs(y) > 6) { lastOk = false; continue; }
        pts.push(`${!lastOk ? 'M' : 'L'}${toSx(x).toFixed(1)},${toSy(y).toFixed(1)}`);
        lastOk = true;
      } catch { lastOk = false; }
    }
    return pts.join(' ');
  }, [selected]);

  // Difference quotient animation
  const [h, setH] = useState(0.5);
  const fa = fn.f(fn.a);
  const leftQ  = (fn.f(fn.a - h) - fa) / (-h);
  const rightQ = (fn.f(fn.a + h) - fa) / h;

  const reset = () => { setAnswerC(null); setAnswerD(null); setRevealed(false); };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 4 · Производная" title="Гладкость vs излом: дифференцируемость"
        question="Все ли непрерывные функции дифференцируемы? Что значит «излом» и чем он отличается от «гладкого изгиба»?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Дифференцируемость">
          Производная в точке a существует, если пределы разностного отношения слева и справа существуют, конечны и равны. Если хоть одно нарушено — производной нет.
        </InfoCard>
        <InfoCard color={T.amber} title="Излом vs вертикальная касательная">
          Излом: левый и правый пределы конечны, но разные. Вертикальная касательная: оба предела = ±∞. Оба случая — не дифференцируема, но геометрически разные.
        </InfoCard>
        <InfoCard color={T.green} title="Иерархия гладкости">
          Дифф-ма ⇒ непрерывна (но не наоборот!). |x| — непрерывна, не дифф-ма. Любой разрыв → не дифф-ма. Гладкость = непрерывность + дифф-ть + непрерывность производной.
        </InfoCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
        {/* Gallery */}
        <div>
          <SectionLabel>Выбери функцию</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
            {functions.map((fn2, i) => (
              <button key={fn2.id} onClick={() => { setSelected(i); reset(); }}
                style={{ textAlign: 'left' as const, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${selected === i ? T.primary : T.border}`, background: selected === i ? T.primaryLight : T.white, cursor: 'pointer' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: 'monospace' }}>{fn2.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {/* Graph */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 10, overflow: 'hidden' }}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
              <GridLines W={W} H={H} OX={OX} OY={OY} SCALE={SCALE} xRange={3} yRange={3} />
              <path d={fPath} fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" />
              {/* Point a */}
              {isFinite(fa) && Math.abs(fa) < 5 && (
                <circle cx={toSx(fn.a)} cy={toSy(fa)} r={6} fill={fn.differentiable ? T.green : T.red} stroke={T.white} strokeWidth="2" />
              )}
            </svg>
          </div>

          {/* Questions */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Ответь на вопросы</SectionLabel>

            {/* Continuity */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>Непрерывна ли в a?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setAnswerC(v)}
                    style={{ flex: 1, padding: '7px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: answerC === v ? (revealed ? (v === fn.continuous ? T.green : T.red) : T.primary) : T.surface,
                      color: answerC === v ? T.white : T.text, border: `1.5px solid ${answerC === v ? T.primary : T.border}` }}>
                    {v ? 'Да' : 'Нет'}
                  </button>
                ))}
              </div>
            </div>

            {/* Differentiability */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>Дифференцируема ли в a?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setAnswerD(v)}
                    style={{ flex: 1, padding: '7px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: answerD === v ? (revealed ? (v === fn.differentiable ? T.green : T.red) : T.primary) : T.surface,
                      color: answerD === v ? T.white : T.text, border: `1.5px solid ${answerD === v ? T.primary : T.border}` }}>
                    {v ? 'Да' : 'Нет'}
                  </button>
                ))}
              </div>
            </div>

            {answerC !== null && answerD !== null && !revealed && (
              <button onClick={() => setRevealed(true)}
                style={{ width: '100%', padding: '8px', borderRadius: 10, background: T.primaryDark, color: T.white, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Проверить
              </button>
            )}

            {revealed && (
              <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{fn.note}</div>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.65 }}>{fn.insight}</div>
              </div>
            )}
          </div>

          {/* Difference quotient */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Разностное отношение при h = {h.toFixed(3)}</SectionLabel>
            <input type="range" min={0.005} max={1} step={0.005} value={h} onChange={e => setH(Number(e.target.value))} style={{ width: '100%', accentColor: T.primary, marginBottom: 8 }} />
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
              <StatBadge label="Слева [f(a−h)−f(a)]/(−h)" value={isFinite(leftQ) ? leftQ.toFixed(4) : fn.leftSlope} color={T.red} />
              <StatBadge label="Справа [f(a+h)−f(a)]/h" value={isFinite(rightQ) ? rightQ.toFixed(4) : fn.rightSlope} color={T.cyan} />
            </div>
          </div>
        </div>
      </div>

      <Callout color={T.primary} title="Главный вывод">
        Дифференцируемость ⇒ непрерывность (но не наоборот!). Непрерывная функция может иметь излом (|x|) или вертикальную касательную (x^(1/3)). Гладкая стыковка кусочных функций требует двух условий: равенства значений И равенства производных.
      </Callout>
    </div>
  );
}

// ─── Lab 5: Tangent Builder ───────────────────────────────────────────────────
function TangentBuilderLab() {
  const [fnKey, setFnKey] = useState<FnKey>('x2');
  const [a, setA] = useState(1.0);
  const [taskMode, setTaskMode] = useState(false);
  const [taskA, setTaskA] = useState(1.5);
  const [userSlope, setUserSlope] = useState('');
  const [userB, setUserB] = useState('');
  const [checked, setChecked] = useState(false);

  const cfg = FN_CONFIGS[fnKey];
  const fa  = cfg.f(a);
  const dfa = cfg.df(a);

  // Tangent: y = fa + dfa*(x - a) = dfa*x + (fa - dfa*a)
  const tB = fa - dfa * a;

  const W = 500, H = 300, OX = 250, OY = 150, SCALE = 55;
  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number) => OY - y * SCALE;

  const fPath = useMemo(() => buildPath(cfg.f, W, OX, OY, SCALE), [fnKey]);

  // Tangent path
  const tPath = useMemo(() => {
    if (!isFinite(dfa)) return '';
    const x0 = (0 - OX) / SCALE, x1 = (W - OX) / SCALE;
    const y0 = fa + dfa * (x0 - a), y1 = fa + dfa * (x1 - a);
    if (!isFinite(y0) || !isFinite(y1)) return '';
    return `M${toSx(x0)},${toSy(y0)} L${toSx(x1)},${toSy(y1)}`;
  }, [fnKey, a, fa, dfa]);

  // Error at x = a + 0.5
  const xTest = a + 0.5;
  const fTest = cfg.f(xTest);
  const tTest = fa + dfa * (xTest - a);
  const approxErr = isFinite(fTest) && isFinite(tTest) ? Math.abs(fTest - tTest) : NaN;

  // Task check
  const taskFa = cfg.f(taskA), taskDfa = cfg.df(taskA);
  const taskTb = taskFa - taskDfa * taskA;
  const isCorrect = () => {
    const s = parseFloat(userSlope.replace(',', '.')), bv = parseFloat(userB.replace(',', '.'));
    return Math.abs(s - taskDfa) < 0.05 && Math.abs(bv - taskTb) < 0.05;
  };

  const fmt = (v: number) => isFinite(v) ? v.toFixed(3) : '∄';
  const fnOptions: { key: FnKey; label: string }[] = [
    { key: 'x2', label: 'x²' }, { key: 'sinx', label: 'sin x' },
    { key: 'ex', label: 'eˣ' }, { key: 'x3', label: 'x³−3x' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 5 · Производная" title="Конструктор касательной"
        question="Как касательная «катится» по графику? Где она горизонтальна? Как точно она приближает функцию?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Уравнение касательной">
          y = f(a) + f′(a)·(x − a). Две составляющих: f(a) — «поднять на нужную высоту», f′(a) — «задать наклон». Это лучшее линейное приближение f в точке a.
        </InfoCard>
        <InfoCard color={T.amber} title="Экстремум vs перегиб">
          В экстремуме f′(a)=0 → касательная горизонтальна → функция с одной стороны от касательной. В перегибе f′(a)=0 → горизонтальна, но функция пересекает касательную.
        </InfoCard>
        <InfoCard color={T.green} title="Точность приближения">
          Вблизи точки a касательная приближает функцию с ошибкой O(h²). При x=a+0.1 ошибка мала; при x=a+1 — значительна. Чем дальше — тем хуже.
        </InfoCard>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {fnOptions.map(o => (
          <PresetButton key={o.key} active={fnKey === o.key} onClick={() => { setFnKey(o.key); setA(1); setChecked(false); }} label={o.label} color={FN_CONFIGS[o.key].color} />
        ))}
        <button onClick={() => { setTaskMode(m => !m); setChecked(false); setUserSlope(''); setUserB(''); setTaskA(Math.round((Math.random() * 3 - 1.5) * 4) / 4); }}
          style={{ padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: taskMode ? T.amber : T.surface, color: taskMode ? T.white : T.text, border: `1.5px solid ${taskMode ? T.amber : T.border}` }}>
          {taskMode ? '📝 Задание вкл.' : '📝 Режим задания'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        {/* Graph */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textAlign: 'center' as const }}>{cfg.latex}</div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
            <GridLines W={W} H={H} OX={OX} OY={OY} SCALE={SCALE} />

            {/* Tangent */}
            {tPath && <path d={tPath} fill="none" stroke={T.amber} strokeWidth="2" strokeLinecap="round" />}

            {/* Graph */}
            <path d={fPath} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />

            {/* Contact point */}
            {isFinite(fa) && Math.abs(fa) < 10 && (
              <g>
                <circle cx={toSx(a)} cy={toSy(fa)} r={7} fill={T.amber} stroke={T.white} strokeWidth="2" />
                <text x={toSx(a) + 10} y={toSy(fa) - 8} fontSize="10" fill={T.amber} fontWeight="800">({a.toFixed(2)}, {fa.toFixed(2)})</text>
              </g>
            )}

            {/* Task point */}
            {taskMode && isFinite(cfg.f(taskA)) && Math.abs(cfg.f(taskA)) < 10 && (
              <circle cx={toSx(taskA)} cy={toSy(cfg.f(taskA))} r={6} fill={T.red} stroke={T.white} strokeWidth="2" />
            )}

            {/* Slope indicator */}
            {isFinite(dfa) && (
              <text x={10} y={18} fontSize="11" fill={T.amber} fontWeight="800">
                наклон = {fmt(dfa)}
              </text>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {!taskMode ? (
            <>
              <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
                <SectionLabel>Точка касания a</SectionLabel>
                <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color, textAlign: 'center' as const, marginBottom: 6 }}>a = {a.toFixed(3)}</div>
                <input type="range" min={-3.5} max={3.5} step={0.05} value={a} onChange={e => setA(Number(e.target.value))} style={{ width: '100%', accentColor: cfg.color }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                <StatBadge label="f(a)" value={fmt(fa)} color={cfg.color} />
                <StatBadge label="f′(a) — наклон" value={fmt(dfa)} color={T.amber} />
                <StatBadge label="Сдвиг b = f(a)−f′(a)·a" value={isFinite(tB) ? fmt(tB) : '∄'} color={T.primary} />
              </div>

              <div style={{ background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 12, padding: '10px 14px', fontSize: 12, color: T.primaryDark, fontFamily: 'monospace', fontWeight: 700 }}>
                y = {isFinite(dfa) ? `${fmt(dfa)}·(x − ${a.toFixed(2)}) + ${fmt(fa)}` : '∄'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                <StatBadge label={`Ошибка при x = a+0.5`} value={isFinite(approxErr) ? approxErr.toFixed(5) : '∄'} color={approxErr < 0.05 ? T.green : T.amber} />
              </div>

              <Collapsible title="Для eˣ в a=0: y=1+x. Ошибка при x=0.5?" color={T.violet}>
                f(0.5) = e^0.5 ≈ 1.6487. Касательная: y = 1 + 0.5 = 1.5. Ошибка ≈ 0.149. При x=0.1: f=1.105, касат=1.1, ошибка ≈ 0.005. Видно: чем ближе — тем точнее.
              </Collapsible>
            </>
          ) : (
            <div style={{ background: T.white, border: `1px solid ${T.amber}40`, borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel color={T.amber}>Задание</SectionLabel>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.65, marginBottom: 10 }}>
                Найди уравнение касательной к <strong>{cfg.label}</strong> в точке <strong>a = {taskA.toFixed(2)}</strong>.<br />
                <span style={{ fontSize: 11, color: T.muted }}>Запиши в виде y = k·x + b</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>k =</span>
                <input value={userSlope} onChange={e => { setUserSlope(e.target.value); setChecked(false); }}
                  placeholder="наклон" style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>b =</span>
                <input value={userB} onChange={e => { setUserB(e.target.value); setChecked(false); }}
                  placeholder="сдвиг" style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700 }} />
              </div>
              <button onClick={() => { setChecked(true); setA(taskA); }}
                style={{ width: '100%', padding: '9px', borderRadius: 10, background: T.amber, color: T.white, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Проверить
              </button>
              {checked && (
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: isCorrect() ? T.greenLight : T.redLight, fontSize: 12, fontWeight: 700, color: isCorrect() ? T.green : T.red }}>
                  {isCorrect()
                    ? `✓ Верно! k = ${fmt(taskDfa)}, b = ${fmt(taskTb)}`
                    : `✗ Нет. f′(${taskA.toFixed(2)}) = ${fmt(taskDfa)}, b = ${fmt(taskTb)}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Callout color={T.amber} title="Главный вывод">
        Касательная — «мгновенный снимок» функции. В экстремумах горизонтальна. В перегибах пересекает график. Уравнение y = f(a) + f′(a)·(x−a) даёт лучшее линейное приближение: ошибка растёт как квадрат расстояния от точки касания.
      </Callout>
    </div>
  );
}

// ─── Lab 6: Differentiation Rules ────────────────────────────────────────────
function DiffRulesLab() {
  type BlockType = 'xn' | 'sinx' | 'cosx' | 'ex' | 'lnx' | 'const';
  type OpType = 'sum' | 'product' | 'compose' | 'quotient';

  const [left, setLeft]   = useState<BlockType>('xn');
  const [right, setRight] = useState<BlockType>('sinx');
  const [op, setOp]       = useState<OpType>('sum');
  const [n, setN]         = useState(2);
  const [k, setK]         = useState(3);
  const [trainMode, setTrainMode] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [checked, setChecked] = useState(false);

  // Block definitions
  const blocks: Record<BlockType, { label: string; f: (x:number)=>number; df: (x:number)=>number; dexpr: (n:number)=>string }> = {
    xn:    { label: `x^${n}`,   f: x => Math.pow(x, n),     df: x => n * Math.pow(x, n-1),      dexpr: (n) => `${n}·x^${n-1}` },
    sinx:  { label: 'sin x',   f: x => Math.sin(x),         df: x => Math.cos(x),                dexpr: () => 'cos x' },
    cosx:  { label: 'cos x',   f: x => Math.cos(x),         df: x => -Math.sin(x),               dexpr: () => '−sin x' },
    ex:    { label: 'eˣ',      f: x => Math.exp(x),         df: x => Math.exp(x),                dexpr: () => 'eˣ' },
    lnx:   { label: 'ln|x|',   f: x => Math.log(Math.abs(x)), df: x => 1/x,                     dexpr: () => '1/x' },
    const: { label: `${k}`,    f: _ => k,                   df: _ => 0,                          dexpr: () => '0' },
  };

  const ops: { key: OpType; label: string; rule: string; color: string }[] = [
    { key: 'sum',      label: 'f + g',  rule: '(f + g)′ = f′ + g′',           color: T.primary },
    { key: 'product',  label: 'f · g',  rule: '(f·g)′ = f′·g + f·g′',        color: T.green   },
    { key: 'compose',  label: 'f(g(x))',rule: '(f∘g)′ = f′(g)·g′',            color: T.violet  },
    { key: 'quotient', label: 'f / g',  rule: '(f/g)′ = (f′g − fg′) / g²',   color: T.amber   },
  ];

  const L = blocks[left], R = blocks[right];

  const getDerivExpr = (): { steps: string[]; result: string } => {
    const ld = L.dexpr(n), rd = R.dexpr(n);
    const ll = L.label, rl = R.label;
    switch (op) {
      case 'sum':     return { steps: ['Правило суммы: дифференцируем каждое слагаемое отдельно', `(${ll})′ = ${ld}`, `(${rl})′ = ${rd}`], result: `${ld} + ${rd}` };
      case 'product': return { steps: ['Правило произведения: (f·g)′ = f′·g + f·g′', `f′ = ${ld}, g = ${rl}`, `f = ${ll}, g′ = ${rd}`], result: `(${ld})·(${rl}) + (${ll})·(${rd})` };
      case 'compose': return { steps: ['Цепное правило: (f∘g)′ = f′(g(x))·g′(x)', `Внешняя f = ${ll} → f′ = ${ld}`, `Внутренняя g = ${rl} → g′ = ${rd}`, 'Подставляем g внутрь f′ и умножаем на g′'], result: `[${ld.replace('x', `(${rl})`)}]·(${rd})` };
      case 'quotient': return { steps: ['Правило частного: (f/g)′ = (f′·g − f·g′) / g²', `f′ = ${ld}, g = ${rl}`, `f = ${ll}, g′ = ${rd}`], result: `[(${ld})·(${rl}) − (${ll})·(${rd})] / (${rl})²` };
    }
  };

  const { steps, result } = getDerivExpr();

  const W = 400, H = 220, OX = 200, OY = 110, SCALE = 45;

  const combinedF = (x: number): number => {
    try {
      const lv = L.f(x), rv = R.f(x);
      switch (op) {
        case 'sum':      return lv + rv;
        case 'product':  return lv * rv;
        case 'compose':  return L.f(R.f(x));
        case 'quotient': return rv === 0 ? NaN : lv / rv;
      }
    } catch { return NaN; }
  };

  const combinedDF = (x: number): number => {
    try {
      const lv = L.f(x), rv = R.f(x), ld = L.df(x), rd = R.df(x);
      switch (op) {
        case 'sum':      return ld + rd;
        case 'product':  return ld * rv + lv * rd;
        case 'compose':  return L.df(R.f(x)) * R.df(x);
        case 'quotient': return rv === 0 ? NaN : (ld * rv - lv * rd) / (rv * rv);
      }
    } catch { return NaN; }
  };

  const fPath  = useMemo(() => buildPath(combinedF,  W, OX, OY, SCALE), [left, right, op, n, k]);
  const dfPath = useMemo(() => buildPath(combinedDF, W, OX, OY, SCALE), [left, right, op, n, k]);

  // Train mode
  const trainFunctions = [
    { expr: 'x² + sin x', answer: '2x + cos x' },
    { expr: 'x³ · eˣ',   answer: '3x² · eˣ + x³ · eˣ' },
    { expr: 'sin(x²)',    answer: 'cos(x²) · 2x' },
    { expr: 'eˣ / x',    answer: '(eˣ · x − eˣ) / x²' },
    { expr: 'ln(cos x)', answer: '−sin x / cos x' },
  ];
  const [trainIdx, setTrainIdx] = useState(0);
  const trainQ = trainFunctions[trainIdx];

  const blockOptions: BlockType[] = ['xn', 'sinx', 'cosx', 'ex', 'lnx', 'const'];
  const blockLabel = (b: BlockType) => b === 'xn' ? `x^${n}` : b === 'const' ? `${k}` : blocks[b].label;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 6 · Производная" title="Правила дифференцирования"
        question="Можно ли находить производные механически, применяя правила? Как компьютер считает производную?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Правило суммы">
          (f+g)′ = f′+g′. Каждое слагаемое дифференцируется отдельно. Это линейность дифференцирования.
        </InfoCard>
        <InfoCard color={T.green} title="Правило произведения">
          (f·g)′ = f′g + fg′. «Первое на производную второго плюс производная первого на второе». Нельзя просто перемножить производные!
        </InfoCard>
        <InfoCard color={T.violet} title="Цепное правило">
          (f∘g)′ = f′(g(x))·g′(x). Производная внешней функции (от внутренней) умножить на производную внутренней. Это основа backprop.
        </InfoCard>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 14 }}>
        <button onClick={() => setTrainMode(m => !m)}
          style={{ padding: '7px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: trainMode ? T.amber : T.surface, color: trainMode ? T.white : T.text, border: `1.5px solid ${trainMode ? T.amber : T.border}` }}>
          {trainMode ? '📝 Тренажёр вкл.' : '📝 Режим тренажёра'}
        </button>
      </div>

      {trainMode ? (
        <div>
          <div style={{ background: T.amberLight, border: `1px solid ${T.amber}40`, borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.amber, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>
              Задание {trainIdx + 1} / {trainFunctions.length}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: 'monospace', marginBottom: 4 }}>
              d/dx [ {trainQ.expr} ] = ?
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <input value={userAnswer} onChange={e => { setUserAnswer(e.target.value); setChecked(false); }}
              placeholder="Введи производную…"
              style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 600 }} />
            <button onClick={() => setChecked(true)}
              style={{ padding: '10px 18px', borderRadius: 12, background: T.primaryDark, color: T.white, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Проверить
            </button>
          </div>
          {checked && (
            <div style={{ padding: '14px 18px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 4 }}>Правильный ответ:</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.primaryDark, fontFamily: 'monospace' }}>{trainQ.answer}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setTrainIdx(i => (i + 1) % trainFunctions.length); setUserAnswer(''); setChecked(false); }}
              style={{ padding: '9px 18px', borderRadius: 12, background: T.primary, color: T.white, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              → Следующее
            </button>
            <button onClick={() => { setTrainIdx(Math.floor(Math.random() * trainFunctions.length)); setUserAnswer(''); setChecked(false); }}
              style={{ padding: '9px 14px', borderRadius: 12, background: T.surface, color: T.muted, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              🎲 Случайное
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>
          {/* Graphs */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.primary, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 3, paddingLeft: 4 }}>
              Функция: {L.label} {op === 'sum' ? '+' : op === 'product' ? '·' : op === 'compose' ? '∘' : '/'} {R.label}
            </div>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
              <GridLines W={W} H={H} OX={OX} OY={OY} SCALE={SCALE} xRange={3} yRange={3} />
              <path d={fPath} fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.amber, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 3, paddingLeft: 4, marginTop: 8 }}>
              Производная
            </div>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
              <GridLines W={W} H={H} OX={OX} OY={OY} SCALE={SCALE} xRange={3} yRange={3} />
              <path d={dfPath} fill="none" stroke={T.amber} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Builder */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {/* Operation */}
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel>Операция</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                {ops.map(o => (
                  <button key={o.key} onClick={() => setOp(o.key)}
                    style={{ textAlign: 'left' as const, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: op === o.key ? `${o.color}15` : T.surface, color: op === o.key ? o.color : T.muted, border: `1.5px solid ${op === o.key ? o.color : T.border}` }}>
                    <span style={{ fontFamily: 'monospace' }}>{o.label}</span>
                    <span style={{ fontSize: 10, marginLeft: 8, fontWeight: 400, color: T.mutedLight }}>{o.rule}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Block selectors */}
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <SectionLabel color={T.primaryDark}>f (левый блок)</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                    {blockOptions.map(b => (
                      <button key={b} onClick={() => setLeft(b)}
                        style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: left === b ? T.primaryDark : T.surface, color: left === b ? T.white : T.text, border: `1px solid ${left === b ? T.primaryDark : T.border}`, textAlign: 'left' as const }}>
                        {blockLabel(b)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel color={T.green}>g (правый блок)</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                    {blockOptions.map(b => (
                      <button key={b} onClick={() => setRight(b)}
                        style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: right === b ? T.green : T.surface, color: right === b ? T.white : T.text, border: `1px solid ${right === b ? T.green : T.border}`, textAlign: 'left' as const }}>
                        {blockLabel(b)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Params */}
              {(left === 'xn' || right === 'xn') && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}><span>n (степень)</span><strong>{n}</strong></div>
                  <input type="range" min={1} max={5} step={1} value={n} onChange={e => setN(Number(e.target.value))} style={{ width: '100%', accentColor: T.primary }} />
                </div>
              )}
              {(left === 'const' || right === 'const') && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}><span>k (константа)</span><strong>{k}</strong></div>
                  <input type="range" min={-5} max={5} step={0.5} value={k} onChange={e => setK(Number(e.target.value))} style={{ width: '100%', accentColor: T.primary }} />
                </div>
              )}
            </div>

            {/* Steps */}
            <div style={{ background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel color={T.primaryDark}>Пошаговое применение правила</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.primaryBorder, color: T.primaryDark, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div style={{ fontSize: 11, color: T.text, lineHeight: 1.65, fontFamily: 'monospace' }}>{s}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 9, background: T.white, border: `1px solid ${T.primaryBorder}`, fontSize: 12, fontWeight: 800, color: T.primaryDark, fontFamily: 'monospace' }}>
                Ответ: {result}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="Как найти производную xˣ? Это не степенная и не показательная функция." color={T.amber}>
          Логарифмическое дифференцирование: возьмём логарифм обеих частей. ln f = x·ln x. Дифференцируем: f′/f = ln x + 1. Значит f′ = xˣ·(ln x + 1). Этот приём работает для любой функции вида g(x)^h(x).
        </Collapsible>
        <Collapsible title="Backprop в нейросетях — это то же самое что цепное правило?" color={T.violet}>
          Именно. Нейросеть — это сложная вложенная функция миллионов переменных. Backpropagation применяет цепное правило в обратном порядке от выхода к входу: δL/δw = δL/δy · δy/δx · δx/δw. Автодифференцирование (PyTorch, JAX) делает это автоматически.
        </Collapsible>
      </div>

      <Callout color={T.violet} title="Главный вывод">
        Любая элементарная функция дифференцируется механически — достаточно таблицы производных и 4 правил. Именно это делает компьютер в backpropagation: цепное правило, применённое много раз подряд в обратном порядке.
      </Callout>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function DerivativeGradientLabView() {
  const [activeLab, setActiveLab] = useState<string>(DERIVATIVE_LABS[0].id);
  const lab = DERIVATIVE_LABS.find(item => item.id === activeLab) ?? DERIVATIVE_LABS[0];

  return (
    <LabShell
      title="Лаборатории: Производная и градиент"
      intro="Шесть интерактивных стендов: от рождения касательной через секущую до правил дифференцирования и backprop."
      labs={DERIVATIVE_LABS}
      activeId={activeLab}
      onSelect={setActiveLab}
    >
      {lab.id === 'dg-secant-tangent'   ? <SecantTangentLab />
        : lab.id === 'dg-function-derivative' ? <FunctionDerivativeLab />
        : lab.id === 'dg-extrema'            ? <ExtremaLab />
        : lab.id === 'dg-differentiability'  ? <DifferentiabilityLab />
        : lab.id === 'dg-tangent-builder'    ? <TangentBuilderLab />
        : lab.id === 'dg-rules'              ? <DiffRulesLab />
        : <LabBody title={lab.title} question={lab.question} mechanics={lab.mechanics} explore={lab.explore} insight={lab.insight} />
      }
    </LabShell>
  );
}
