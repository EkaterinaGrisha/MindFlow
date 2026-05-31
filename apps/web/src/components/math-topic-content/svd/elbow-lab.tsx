import { useMemo, useState } from 'react';
import { Activity, BarChart3, BookOpen, ChevronDown, ChevronUp, HelpCircle, Info, Lightbulb, SlidersHorizontal, Target, TrendingDown, Wand2 } from 'lucide-react';

// ─── Design tokens (from applications-theory-rich.tsx) ───────────────────────
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
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  pink: '#ec4899',
  white: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
};

// ─── Dataset generators ───────────────────────────────────────────────────────
type Dataset = {
  id: string;
  name: string;
  sigmas: number[];
  note: string;
  description: string;
  whatToLook: string;
  expectedElbow: string;
  color: string;
};

const makeFast = () => [100, 30, 5, 1, 0.5, 0.1, ...Array.from({ length: 34 }, (_, i) => 0.08 * Math.exp(-i * 0.25))];
const makeSmooth = () => Array.from({ length: 40 }, (_, i) => 100 - i * 2.1);
const makeDouble = () => [120, 55, 20, 12, 10, 9, 8.5, 8, 7.6, 6.8, 5.2, 3.4, 2.1, 1.2, ...Array.from({ length: 26 }, (_, i) => 0.9 * Math.exp(-i * 0.16))];
const makeStep = () => Array.from({ length: 40 }, (_, i) => (i < 10 ? 50 : 0));
const makeReal = () => [215, 156, 102, 69, 41, 27, 18, 13, 10, 7.8, 6.1, 5.2, 4.6, 4, 3.5, 3.1, 2.8, 2.4, 2.1, 1.9, ...Array.from({ length: 20 }, (_, i) => 1.7 * Math.exp(-i * 0.08))];

const DATASETS: Dataset[] = [
  {
    id: 'fast',
    name: 'Быстрый спад',
    sigmas: makeFast(),
    color: T.primary,
    note: 'Локоть около k≈2–3. Первые компоненты объясняют почти всё.',
    description: 'Типично для изображений с крупными деталями или данных с ярко выраженной структурой. Сингулярные числа σ₁=100, σ₂=30, σ₃=5 — резкий обрыв уже после 2–3 компонент.',
    whatToLook: 'Найди точку, где кривая "переламывается" из резкого падения в почти горизонтальный хвост. Это и есть локоть. Сравни его с отметкой 90% на правом графике.',
    expectedElbow: 'k ≈ 2–3 объясняют ~99% дисперсии. Всё, что правее — шум.',
  },
  {
    id: 'smooth',
    name: 'Плавный спад',
    sigmas: makeSmooth(),
    color: T.amber,
    note: 'Явного локтя нет — нужен порог дисперсии.',
    description: 'Типично для зашумлённых данных или данных без выраженной структуры. Сингулярные числа убывают равномерно: 100, 97.9, 95.8, … — нет резкого перехода.',
    whatToLook: 'Попробуй найти "локоть" визуально — скорее всего, не найдёшь. Тогда ориентируйся на правый график: при каком k кумулятивная доля пересекает жёлтую черту 90%?',
    expectedElbow: 'Локоть визуально отсутствует. По порогу 90% дисперсии: k ≈ 23–24. Это признак высокоразмерности данных.',
  },
  {
    id: 'double',
    name: 'Два локтя',
    sigmas: makeDouble(),
    color: T.green,
    note: 'Два масштаба факторов: грубый (k≈3) и детальный (k≈10).',
    description: 'В данных есть две группы факторов разной важности: крупные (σ₁–σ₃ ≈ 20–120) и средние (σ₄–σ₁₀ ≈ 7–12). После каждой группы — перегиб.',
    whatToLook: 'Найди оба перегиба. Первый даёт грубое описание данных. Второй — более детальное. Какой выбрать? Зависит от задачи: если нужна интерпретируемость — первый, если полнота — второй.',
    expectedElbow: 'Первый локоть k≈3, второй k≈10. При k=3 объясняется ~65% дисперсии, при k=10 — ~90%.',
  },
  {
    id: 'step',
    name: 'Ступенька',
    sigmas: makeStep(),
    color: T.violet,
    note: 'Ровно 10 равноважных факторов — локоть "вертикальный".',
    description: 'Данные имеют ровно 10 независимых равноважных факторов: σ₁=…=σ₁₀=50, затем σ₁₁=…=0. Это идеальный случай с чётким рангом.',
    whatToLook: 'Здесь нет классического "локтя-изгиба" — вместо него вертикальный обрыв. Посмотри на правый график: до k=10 кривая почти горизонтальна, потом мгновенно прыгает к 100%.',
    expectedElbow: 'k=10 очевидно: ровно столько компонент несут информацию. Это исключение — локоть тут вертикальный, не изогнутый.',
  },
  {
    id: 'real',
    name: 'Реальные данные',
    sigmas: makeReal(),
    color: T.pink,
    note: 'Похоже на спектр реального датасета (например, изображения или временной ряд).',
    description: 'Реальные данные (например, MNIST или временные ряды): несколько крупных компонент, затем медленно убывающий хвост. Нет идеального локтя, но структура видна.',
    whatToLook: 'Попробуй угадать локоть визуально, запомни своё k. Затем проверь по таблице — сколько % дисперсии объясняет твой k? Совпадает ли локоть с порогом 90%?',
    expectedElbow: 'Визуальный локоть обычно около k≈5–7. Порог 90% может быть выше — здесь они не всегда совпадают.',
  },
];

const fmt = (x: number) =>
  (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/0+$/, '').replace(/\.$/, '');

// ─── Polyline helper ──────────────────────────────────────────────────────────
function polyline(values: number[], x0: number, y0: number, w: number, h: number, logY = false) {
  const validValues = values.filter((v) => v > 0);
  const max = Math.max(...values, 1e-8);
  const min = Math.max(1e-8, validValues.length ? Math.min(...validValues) : 1e-8);
  return values
    .map((v, i) => {
      const x = x0 + (i / (values.length - 1)) * w;
      const yy = logY
        ? (Math.log10(Math.max(v, min)) - Math.log10(min)) / Math.max(1e-8, Math.log10(max) - Math.log10(min))
        : v / max;
      const y = y0 + h - yy * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function Callout({ color = T.amber, title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 12, padding: '13px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function InfoBox({ icon: Icon, title, children, color = T.primary }: { icon: any; title: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: `${color}0b`, border: `1px solid ${color}30`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <Icon size={16} color={color} />
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Collapsible({ title, children, color = T.primary }: { title: string; children: React.ReactNode; color?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${color}30`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: `${color}0a`, border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{title}</span>
        {open ? <ChevronUp size={15} color={color} /> : <ChevronDown size={15} color={color} />}
      </button>
      {open && <div style={{ padding: '12px 16px', fontSize: 13, color: T.text, lineHeight: 1.75, background: T.white }}>{children}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SVDElbowLab() {
  const [datasetId, setDatasetId] = useState(DATASETS[0].id);
  const ds = DATASETS.find((d) => d.id === datasetId) ?? DATASETS[0];
  const n = ds.sigmas.length;
  const [k, setK] = useState(3);
  const kk = Math.min(Math.max(1, k), n);

  const { explained, cumulative, ninetyK } = useMemo(() => {
    const power = ds.sigmas.map((s) => s * s);
    const total = power.reduce((a, b) => a + b, 0) || 1;
    const explained = power.map((p) => p / total);
    let acc = 0;
    const cumulative = explained.map((e) => (acc += e));
    const ninetyK = cumulative.findIndex((c) => c >= 0.9) + 1;
    return { explained, cumulative, ninetyK: ninetyK || n };
  }, [ds, n]);

  const curRow = { sigma: ds.sigmas[kk - 1], explained: explained[kk - 1], cumulative: cumulative[kk - 1] };

  // SVG chart params
  const svgW = 620, svgH = 280;
  const chartX = 54, chartY = 32, chartW = 546, chartH = 218;

  // Elbow x position
  const elbowX = (idx: number) => chartX + (idx / (n - 1)) * chartW;
  const kLineX = chartX + ((kk - 1) / (n - 1)) * chartW;
  const k90X = chartX + ((ninetyK - 1) / (n - 1)) * chartW;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: '0 0 40px' }}>

      {/* ── Header ── */}
      <div style={{ borderRadius: 20, background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.white} 60%, #f0fdf4 100%)`, border: `1px solid ${T.primaryBorder}`, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <SlidersHorizontal size={18} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: T.primary, textTransform: 'uppercase' as const }}>Лаборатория 2 · SVD</span>
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>
          График сингулярных чисел и метод локтя
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.7 }}>
          <strong>Исследовательский вопрос:</strong> метод локтя — это искусство или наука? Можно ли формализовать выбор k через график сингулярных чисел?
        </p>
      </div>

      {/* ── Theory block ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
        <InfoBox icon={BarChart3} title="Что такое сингулярные числа σᵢ?" color={T.primary}>
          SVD раскладывает матрицу A = UΣVᵀ. Диагональные элементы Σ — это сингулярные числа σ₁ ≥ σ₂ ≥ … ≥ 0. Чем больше σᵢ, тем важнее i-я компонента: она отвечает за бо́льшую долю «энергии» матрицы.
        </InfoBox>
        <InfoBox icon={Activity} title="Что такое объяснённая дисперсия?" color={T.green}>
          Доля дисперсии i-й компоненты = σᵢ² / Σσⱼ². Кумулятивная доля для k компонент = Σᵢ₌₁ᵏ σᵢ² / Σσⱼ². Это процент «информации» из матрицы, сохранённый при усечении до ранга k.
        </InfoBox>
        <InfoBox icon={Target} title="Что такое метод локтя?" color={T.amber}>
          На графике σᵢ по убыванию ищут точку перегиба — «локоть». Левее: резкий спад (важные компоненты). Правее: пологий хвост (шум). Локоть указывает на оптимальное k — компромисс между сжатием и качеством.
        </InfoBox>
      </div>

      {/* ── Dataset picker ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Выбери набор данных</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
          {DATASETS.map((d) => (
            <button
              key={d.id}
              onClick={() => { setDatasetId(d.id); setK(3); }}
              style={{
                padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${d.id === ds.id ? d.color : T.border}`,
                background: d.id === ds.id ? d.color : T.white,
                color: d.id === ds.id ? T.white : T.text,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dataset description ── */}
      <div style={{ background: `${ds.color}0d`, border: `1px solid ${ds.color}35`, borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: ds.color, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>
          {ds.name}
        </div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.7 }}>{ds.description}</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <Info size={14} color={ds.color} style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}><strong style={{ color: T.text }}>На что обратить внимание:</strong> {ds.whatToLook}</p>
        </div>
      </div>

      {/* ── k Slider ── */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Выбранное k = </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: ds.color }}>{kk}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.muted }}>
            <span>σ<sub>k</sub> = <strong style={{ color: T.text }}>{fmt(curRow.sigma)}</strong></span>
            <span>дисперсия = <strong style={{ color: T.green }}>{fmt(curRow.cumulative * 100)}%</strong></span>
            <span>k₉₀ = <strong style={{ color: T.amber }}>{ninetyK}</strong></span>
          </div>
        </div>
        <input
          type="range" min={1} max={n} step={1} value={kk}
          onChange={(e) => setK(Number(e.target.value))}
          style={{ width: '100%', accentColor: ds.color }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.mutedLight, marginTop: 3 }}>
          <span>k = 1</span>
          <span>← Двигай ползунок, следи за графиками и таблицей →</span>
          <span>k = {n}</span>
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16, marginBottom: 8 }}>

        {/* Chart 1: Singular values */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
            График сингулярных чисел σᵢ
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>
            Ось Y — лог-шкала. Чем круче спад, тем яснее структура данных.
          </div>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto' }}>
            {/* Grid */}
            <rect x={chartX} y={chartY} width={chartW} height={chartH} fill={T.surface} rx="4" />
            {[0.25, 0.5, 0.75].map((frac) => (
              <line key={frac} x1={chartX} y1={chartY + chartH * (1 - frac)} x2={chartX + chartW} y2={chartY + chartH * (1 - frac)} stroke={T.border} strokeDasharray="3 3" />
            ))}
            {/* 90% reference line on σ chart (approx) */}
            <line x1={k90X} y1={chartY} x2={k90X} y2={chartY + chartH} stroke={T.amber} strokeDasharray="5 4" strokeWidth="1.5" />
            <text x={k90X + 4} y={chartY + 14} fontSize="10" fill={T.amber} fontWeight="700">k₉₀={ninetyK}</text>
            {/* Main curve */}
            <path d={polyline(ds.sigmas, chartX, chartY, chartW, chartH, true)} fill="none" stroke={ds.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* k line */}
            <line x1={kLineX} y1={chartY} x2={kLineX} y2={chartY + chartH} stroke={T.red} strokeDasharray="6 4" strokeWidth="2" />
            {/* k dot on curve */}
            {(() => {
              const max = Math.max(...ds.sigmas, 1e-8);
              const min = Math.max(1e-8, Math.min(...ds.sigmas.filter((v) => v > 0)));
              const v = ds.sigmas[kk - 1];
              const yy = (Math.log10(Math.max(v, min)) - Math.log10(min)) / Math.max(1e-8, Math.log10(max) - Math.log10(min));
              const cy = chartY + chartH - yy * chartH;
              return <circle cx={kLineX} cy={cy} r="5" fill={T.red} stroke={T.white} strokeWidth="2" />;
            })()}
            {/* Labels */}
            <text x={chartX} y={chartY - 6} fontSize="10" fill={T.mutedLight}>σ_max</text>
            <text x={chartX + chartW - 10} y={chartY + chartH + 14} fontSize="10" fill={T.mutedLight} textAnchor="end">i={n}</text>
            <text x={chartX} y={chartY + chartH + 14} fontSize="10" fill={T.mutedLight}>i=1</text>
          </svg>
        </div>

        {/* Chart 2: Cumulative variance */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
            Кумулятивная доля объяснённой дисперсии
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>
            Жёлтая черта = 90%. Красная вертикаль = текущее k.
          </div>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto' }}>
            <rect x={chartX} y={chartY} width={chartW} height={chartH} fill={T.surface} rx="4" />
            {[0.25, 0.5, 0.75, 1.0].map((frac) => (
              <g key={frac}>
                <line x1={chartX} y1={chartY + chartH * (1 - frac)} x2={chartX + chartW} y2={chartY + chartH * (1 - frac)} stroke={T.border} strokeDasharray="3 3" />
                <text x={chartX - 4} y={chartY + chartH * (1 - frac) + 4} fontSize="9" fill={T.mutedLight} textAnchor="end">{Math.round(frac * 100)}%</text>
              </g>
            ))}
            {/* 90% threshold */}
            <line x1={chartX} y1={chartY + chartH * 0.1} x2={chartX + chartW} y2={chartY + chartH * 0.1} stroke={T.amber} strokeWidth="1.5" strokeDasharray="5 4" />
            <text x={chartX + chartW - 2} y={chartY + chartH * 0.1 - 4} fontSize="10" fill={T.amber} fontWeight="700" textAnchor="end">90%</text>
            {/* Filled area */}
            <path
              d={polyline(cumulative.map((x) => x * 100), chartX, chartY, chartW, chartH, false) + ` L ${chartX + chartW} ${chartY + chartH} L ${chartX} ${chartY + chartH} Z`}
              fill={`${T.green}18`}
            />
            {/* Main curve */}
            <path d={polyline(cumulative.map((x) => x * 100), chartX, chartY, chartW, chartH, false)} fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" />
            {/* k90 marker */}
            <line x1={k90X} y1={chartY} x2={k90X} y2={chartY + chartH} stroke={T.amber} strokeDasharray="5 4" strokeWidth="1.5" />
            <text x={k90X + 4} y={chartY + 14} fontSize="10" fill={T.amber} fontWeight="700">k₉₀={ninetyK}</text>
            {/* k line */}
            <line x1={kLineX} y1={chartY} x2={kLineX} y2={chartY + chartH} stroke={T.red} strokeDasharray="6 4" strokeWidth="2" />
            {/* k dot on curve */}
            {(() => {
              const cy = chartY + chartH - curRow.cumulative * chartH;
              return (
                <g>
                  <circle cx={kLineX} cy={cy} r="5" fill={T.red} stroke={T.white} strokeWidth="2" />
                  <text x={kLineX + 7} y={cy - 6} fontSize="10" fill={T.red} fontWeight="700">{fmt(curRow.cumulative * 100)}%</text>
                </g>
              );
            })()}
            <text x={chartX} y={chartY + chartH + 14} fontSize="10" fill={T.mutedLight}>k=1</text>
            <text x={chartX + chartW - 10} y={chartY + chartH + 14} fontSize="10" fill={T.mutedLight} textAnchor="end">k={n}</text>
          </svg>
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 16, marginBottom: 20, padding: '10px 16px', background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
        {[
          { color: ds.color, label: 'Кривая сингулярных чисел / дисперсии' },
          { color: T.red, label: `Текущее k = ${kk}`, dash: true },
          { color: T.amber, label: `k₉₀ = ${ninetyK} (порог 90% дисперсии)`, dash: true },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="28" height="10">
              <line x1="0" y1="5" x2="28" y2="5" stroke={item.color} strokeWidth="2.5" strokeDasharray={item.dash ? '5 3' : undefined} />
            </svg>
            <span style={{ fontSize: 12, color: T.muted }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={15} color={T.primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Таблица значений (первые 20 компонент)</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: T.muted }}>
            Активная строка: k = {kk} · {fmt(curRow.cumulative * 100)}% дисперсии
          </span>
        </div>
        <div style={{ overflowX: 'auto' as const }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 }}>
            <thead>
              <tr>
                {['k', 'σₖ', 'Доля (%)', 'Кумулятивно (%)', 'Интерпретация'].map((h) => (
                  <th key={h} style={{ textAlign: 'left' as const, color: T.muted, borderBottom: `1.5px solid ${T.border}`, padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ds.sigmas.slice(0, 20).map((s, i) => {
                const idx = i + 1;
                const active = idx === kk;
                const isNinetyK = idx === ninetyK;
                const bg = active ? `${ds.color}15` : isNinetyK ? `${T.amber}10` : 'transparent';
                const borderL = active ? `3px solid ${ds.color}` : isNinetyK ? `3px solid ${T.amber}` : '3px solid transparent';
                const cumPct = cumulative[i] * 100;
                const interp =
                  cumPct < 50 ? 'очень грубое описание'
                  : cumPct < 70 ? 'грубое описание'
                  : cumPct < 90 ? 'приемлемое качество'
                  : cumPct < 99 ? '✓ хорошее качество'
                  : '✓✓ почти идеально';
                return (
                  <tr key={idx} style={{ background: bg, borderLeft: borderL }}>
                    <td style={{ padding: '7px 10px', fontWeight: active ? 800 : 500, color: active ? ds.color : T.text }}>{idx}</td>
                    <td style={{ padding: '7px 10px', color: T.text, fontFamily: 'monospace' }}>{fmt(s)}</td>
                    <td style={{ padding: '7px 10px', color: T.muted }}>{fmt(explained[i] * 100)}%</td>
                    <td style={{ padding: '7px 10px', fontWeight: isNinetyK || active ? 700 : 400, color: isNinetyK ? T.amber : active ? ds.color : T.text }}>
                      {fmt(cumPct)}%
                      {isNinetyK && <span style={{ marginLeft: 6, fontSize: 10, color: T.amber }}>← k₉₀</span>}
                    </td>
                    <td style={{ padding: '7px 10px', color: T.muted, fontSize: 11 }}>{interp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Insight for current dataset ── */}
      <Callout color={ds.color} title={`Ожидаемый результат — «${ds.name}»`}>
        {ds.expectedElbow}
      </Callout>

      {/* ── Exploration questions ── */}
      <div style={{ margin: '20px 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <HelpCircle size={16} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Исследовательские вопросы</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
        <Collapsible title="Для «Быстрого спада»: где локоть и сколько объясняют первые 3 компоненты?" color={T.primary}>
          Подвигай k от 1 до 5. Обрати внимание: при k=1 объясняется около 80% дисперсии, при k=2 уже ~93%, при k=3 — ~99%. Первые σ₁, σ₂ несут почти всю информацию. Локоть — это переход от k=2 к k=3: сигнал сменяется шумом.
        </Collapsible>
        <Collapsible title="Для «Плавного спада»: есть ли локоть? Как тогда выбирать k?" color={T.amber}>
          Посмотри на левый график — кривая спадает равномерно, без изгиба. Классический метод локтя здесь не работает. Решение — перейти к правому графику и найти k, при котором кумулятивная доля пересекает отметку 90% (жёлтую линию). Это формальный критерий, не зависящий от визуального восприятия.
        </Collapsible>
        <Collapsible title="Для «Двух локтей»: какой перегиб взять и что будет при каждом?" color={T.green}>
          Первый локоть (k≈3): грубое, интерпретируемое описание. Меньше компонент — легче понять, что они означают. Второй локоть (k≈10): детальное описание, включает более тонкие факторы. Выбор зависит от задачи: для объяснения — первый; для прогноза — второй.
        </Collapsible>
        <Collapsible title="Для «Ступеньки»: что необычного в графике кумулятивной дисперсии?" color={T.violet}>
          На левом графике кривая не изогнута — она вертикально обрывается на k=10. На правом: до k=10 кумулятивная линия почти горизонтальна (каждая компонента добавляет ровно 1/10 дисперсии), затем мгновенный скачок к 100%. Это исключение: данные имеют ровно 10 равноважных факторов, и формального «локтя-изгиба» нет, но k=10 абсолютно очевиден структурно.
        </Collapsible>
        <Collapsible title="Для «Реальных данных»: совпадает ли твоя визуальная догадка с порогом 90%?" color={T.pink}>
          Сначала посмотри на левый график и мысленно отметь, где, по-твоему, локоть. Запомни своё k. Теперь посмотри на правый график: при каком k достигается 90%? Обычно они близки, но не совпадают точно — и это нормально. Локоть — эвристика, порог 90% — формальный критерий.
        </Collapsible>
      </div>

      {/* ── Riddles ── */}
      <div style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Wand2 size={16} color={T.violet} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
        <Collapsible title="Загадка 1: У «Ступеньки» σ₁=…=σ₁₀=50, остальные нули. Где локоть?" color={T.violet}>
          Формального изогнутого локтя нет — спад вертикальный, а не плавный. Но k=10 выделяется абсолютно: именно здесь кумулятивная дисперсия прыгает с ~91% до 100%. Это учит нас, что метод локтя — не единственный способ: иногда структура данных сама подсказывает ответ.
        </Collapsible>
        <Collapsible title="Загадка 2: Почему для «Плавного спада» даже k=20 объясняет только ~60% дисперсии?" color={T.amber}>
          Потому что все компоненты примерно одинаково важны — нет доминирующих факторов. Это признак высокоразмерных данных без выраженной структуры, возможно, белого шума. В таких данных любое k даёт неполное описание. Вывод: сингулярные числа несут информацию о природе данных, не только о выборе k.
        </Collapsible>
      </div>

      {/* ── Key insight ── */}
      <div style={{ background: `linear-gradient(135deg, ${T.primaryLight}, ${T.greenLight})`, border: `1px solid ${T.primaryBorder}`, borderRadius: 16, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Lightbulb size={18} color={T.primary} />
          <span style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Главный вывод</span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 14, color: T.text, lineHeight: 1.8 }}>
          <strong>Метод локтя — эвристика, а не строгий алгоритм.</strong> Он хорошо работает, когда на графике σᵢ есть чёткий перегиб. Когда перегиба нет — опираются на порог объяснённой дисперсии (обычно 90–95%).
        </p>
        <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.8 }}>
          Выбор k — это компромисс, зависящий от задачи:
          сжатие (больше k = лучше качество) ·
          PCA (меньше k = проще интерпретация) ·
          шумоподавление (k на границе сигнал/шум).
        </p>
      </div>
    </div>
  );
}
