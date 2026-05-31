import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Move,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { LabBody, LabShell, PlainMatrixDisplay, SliderRow } from '../shared/labShell';

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

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function LabHeader({ title, question, badge }: {
  title: string; question: string; badge: string;
}) {
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

function InfoCard({ color = T.primary, title, children }: {
  color?: string; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: `${color}0c`, border: `1px solid ${color}35`, borderRadius: 13, padding: '12px 15px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Callout({ color = T.amber, title, children, style }: {
  color?: string; title: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 11, padding: '11px 15px', ...style }}>
      <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function StatBadge({ label, value, color = T.primary }: {
  label: string; value: string | number; color?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 9, background: `${color}0c`, border: `1px solid ${color}30` }}>
      <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
    </div>
  );
}

function StatRow({ label, value, color = T.primary, sub }: {
  label: string; value: string | number; color?: string; sub?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 9, background: `${color}0c`, border: `1px solid ${color}25` }}>
      <div>
        <div style={{ fontSize: 11, color: T.muted }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: T.mutedLight }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 16, fontWeight: 900, color, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function PresetButton({ active, onClick, label, color = T.primary }: {
  active?: boolean; onClick: () => void; label: string; color?: string;
}) {
  return (
    <button onClick={onClick} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: active ? color : T.white, color: active ? T.white : T.text, border: `1.5px solid ${active ? color : T.border}`, transition: 'all 0.15s' }}>
      {label}
    </button>
  );
}

function SectionLabel({ children, color = T.muted }: {
  children: React.ReactNode; color?: string;
}) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color, textTransform: 'uppercase' as const, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Collapsible({ title, children, color = T.primary }: {
  title: string; children: React.ReactNode; color?: string;
}) {
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

function ArrowHead({ x1, y1, x2, y2, color, width = 2.5 }: {
  x1: number; y1: number; x2: number; y2: number; color: string; width?: number;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 3) return null;
  const nx = dx / len, ny = dy / len;
  const ax = x2 - nx * 10 + ny * 5, ay = y2 - ny * 10 - nx * 5;
  const bx = x2 - nx * 10 - ny * 5, by = y2 - ny * 10 + nx * 5;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${ax},${ay} ${bx},${by}`} fill={color} />
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color, width = 2.5, dashed = false }: {
  x1: number; y1: number; x2: number; y2: number; color: string; width?: number; dashed?: boolean;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 3) return null;
  const nx = dx / len, ny = dy / len;
  const hw = Math.max(4, width * 2.2);
  const ax = x2 - nx * hw * 2 + ny * hw, ay = y2 - ny * hw * 2 - nx * hw;
  const bx = x2 - nx * hw * 2 - ny * hw, by = y2 - ny * hw * 2 + nx * hw;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '5 4' : undefined} />
      <polygon points={`${x2},${y2} ${ax},${ay} ${bx},${by}`} fill={color} />
    </g>
  );
}

function AngleArc({ cx, cy, v1, v2, r = 28, color }: {
  cx: number; cy: number; v1: { x: number; y: number }; v2: { x: number; y: number }; r?: number; color: string;
}) {
  const a1 = Math.atan2(-v1.y, v1.x);
  const a2 = Math.atan2(-v2.y, v2.x);
  const sweep = ((a2 - a1 + 3 * Math.PI) % (2 * Math.PI)) > Math.PI ? 0 : 1;
  const x1s = cx + r * Math.cos(a1), y1s = cy + r * Math.sin(a1);
  const x2s = cx + r * Math.cos(a2), y2s = cy + r * Math.sin(a2);
  return (
    <path d={`M ${x1s} ${y1s} A ${r} ${r} 0 0 ${sweep} ${x2s} ${y2s}`}
      fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
  );
}

// ─── Lab definitions ──────────────────────────────────────────────────────────
const MATRIX_OPS_LABS = [
  {
    id: 'mops-linear-transform',
    title: 'Лаборатория 1: Линейные преобразования плоскости',
    shortTitle: 'Линейные преобразования',
    question: 'Как одна матрица 2×2 искажает всю плоскость и почему столбцы — это образы î и ĵ?',
    mechanics: ['Ползунки a, b, c, d управляют элементами матрицы 2×2.', 'Слева — сетка и единичный квадрат, поверх — деформированная сетка.', 'Пресеты: тождество, поворот 90°, масштаб ×2, сдвиг, отражение, вырожденная (det=0).'],
    explore: ['Сравни поворот 90° и отражение по оси x.', 'Сделай det(A)<0: параллелограмм перекрашивается.', 'Поставь det(A)=0: плоскость схлопывается в прямую.'],
    insight: 'Столбцы матрицы — это «куда переходят» î и ĵ. |det| — коэффициент изменения площади, знак det — ориентация.',
  },
  {
    id: 'mops-add',
    title: 'Лаборатория 2: Сложение матриц — собери пазл',
    shortTitle: 'Сложение — собери пазл',
    question: 'Как «смешиваются» две таблицы, если складывать их поэлементно?',
    mechanics: ['Две матрицы 3×3: A и B. Каждая ячейка — поле ввода от −5 до 5.', 'Под ними в реальном времени строится C = A + B.', 'Пресеты: «Противоположные», «Тёплые и холодные», «Шахматная доска».', 'Тепловая карта: синий = отрицательное, белый = ноль, красный = положительное.'],
    explore: ['Сделай B нулевой — проверь нейтральность нулевой матрицы.', 'Сделай A = B — получи A + B = 2A.', 'Включи heatmap и наблюдай компенсацию знаков в пресете «Тёплые».'],
    riddle: 'Если A + B = O, это не значит, что A = O и B = O: может быть B = −A.',
    insight: 'Сложение полностью локально: cᵢⱼ зависит только от aᵢⱼ и bᵢⱼ.',
  },
  {
    id: 'mops-scalar',
    title: 'Лаборатория 3: Умножение на скаляр — растяни и переверни',
    shortTitle: 'Скаляр — растяни и переверни',
    question: 'Что меняется при масштабировании матрицы коэффициентом λ?',
    mechanics: ['Матрица 3×3 показана как 9 столбиков высоты.', 'Ползунок λ от −3 до 3 масштабирует все элементы одновременно.', 'Особые точки: λ=0, λ=1, λ=−1.'],
    explore: ['Проверь λ=0 (всё схлопывается в нули).', 'Сравни λ=2 и λ=−2: одинаковый масштаб, разный знак.', 'Плавно проведи λ через 0 и наблюдай смену знака.'],
    riddle: 'λ=2 и λ=−2 дают одинаковую длину столбиков, но λ<0 дополнительно отражает значения.',
    insight: 'Скаляр — общий «регулятор громкости» для всей матрицы сразу.',
  },
  {
    id: 'mops-transpose',
    title: 'Лаборатория 4: Транспонирование — зеркало для матрицы',
    shortTitle: 'Транспонирование — зеркало',
    question: 'Как меняется форма данных при отражении относительно главной диагонали?',
    mechanics: ['Матрица 3×4 с цветными ячейками — каждый цвет уникален.', 'Кнопка «Транспонировать» анимирует переход A→Aᵀ (4×3). Цвета отслеживают перемещение элементов.', 'Режимы сравнения: (Aᵀ)ᵀ, (A+B)ᵀ vs Aᵀ+Bᵀ, (cA)ᵀ vs cAᵀ.'],
    explore: ['Отследи: a₁₂ переходит на позицию a₂₁ в Aᵀ.', 'Проверь, что диагональные элементы остаются на месте.', 'Для симметричной матрицы A = Aᵀ транспонирование не изменяет матрицу.'],
    riddle: 'A (3×4) и Aᵀ (4×3) нельзя сложить: размеры не совпадают.',
    insight: 'Транспонирование меняет размер m×n → n×m, но не теряет информацию.',
  },
  {
    id: 'mops-mul',
    title: 'Лаборатория 5: Умножение матриц — конвейер',
    shortTitle: 'Умножение — конвейер',
    question: 'Почему произведение матриц — это «строка × столбец», а не поэлементное умножение?',
    mechanics: ['Матрицы A(m×n), B(n×p), C=AB(m×p).', 'Подсветка i-й строки A и j-го столбца B строит элемент cᵢⱼ.', 'Авто-тур проходит по всем элементам C.'],
    explore: ['Считай n попарных произведений для одного cᵢⱼ.', 'Сравни A×B и B×A.', 'Проверь совместимость размеров по внутренней размерности.'],
    riddle: 'Изменение одного элемента в столбце B влияет на соответствующий столбец C, но не на всю матрицу.',
    insight: 'Каждый элемент результата локален: cᵢⱼ зависит только от строки i матрицы A и столбца j матрицы B.',
  },
  {
    id: 'mops-chain',
    title: 'Лаборатория 6: Цепочка операций — собери выражение',
    shortTitle: 'Цепочка операций',
    question: 'Как не запутаться в порядке действий в матричных выражениях?',
    mechanics: ['Конструктор для A, B, C (2×2) и операций +, −, ×, (·)ᵀ, λ·, скобки.', 'Режим «Пошагово» показывает порядок вычисления.', 'Готовые сценарии: 2A+3B, (AB)ᵀ, A(B+C), (A+B)², AᵀA.'],
    explore: ['Сравни (AB)ᵀ и BᵀAᵀ.', 'Проверь дистрибутивность A(B+C)=AB+AC.', 'Поймай отличие (A+B)² от A²+2AB+B² при AB≠BA.'],
    riddle: '(AB)⁻¹ = B⁻¹A⁻¹: в обратном преобразовании порядок меняется.',
    insight: 'Главная ловушка матричной алгебры — некоммутативность умножения.',
  },
  {
    id: 'mops-inv',
    title: 'Лаборатория 7: Обратная матрица — отмени действие',
    shortTitle: 'Обратная — отмени',
    question: 'Когда преобразование можно «откатить» и почему det(A)=0 делает это невозможным?',
    mechanics: ['Сетка на плоскости деформируется матрицей A(2×2).', 'Кнопка «Применить A⁻¹» возвращает сетку только при det(A)≠0.', 'При det(A)=0 показывается блокировка.'],
    explore: ['Проверь diag(2,2) и обратное сжатие.', 'Сделай поворот на 90° и обратный поворот на −90°.', 'Собери вырожденный случай с одинаковыми строками.'],
    riddle: 'После A, затем B, откат идёт в порядке B⁻¹, потом A⁻¹.',
    insight: 'Обратная матрица — это Ctrl+Z для линейного преобразования, доступный только при полном ранге.',
  },
  {
    id: 'mops-det',
    title: 'Лаборатория 8: Определитель как площадь',
    shortTitle: 'Определитель как площадь',
    question: 'Как det(A) объясняет масштаб площади и ориентацию преобразования?',
    mechanics: ['Два столбца A как векторы на плоскости образуют параллелограмм.', 'В реальном времени считаются det(A)=ad−bc и площадь |det(A)|.', 'Цвет: синий при det>0, красный при det<0.'],
    explore: ['Сделай столбцы коллинеарными и получи det=0.', 'Поменяй столбцы местами и проверь смену знака.', 'Увеличь один столбец вдвое и увидь линейный рост det.'],
    riddle: 'Почти нулевой det означает почти вырожденность и плохую обусловленность Ax=b.',
    insight: 'Определитель — коэффициент изменения площади; знак det отвечает за ориентацию.',
  },
] as const;

// ─── Lab 1: Linear Transform ──────────────────────────────────────────────────
function LinearTransformLab() {
  const [m, setM] = useState({ a: 1, b: 0, c: 0, d: 1 });
  const [activePreset, setActivePreset] = useState('id');
  const det = parseFloat((m.a * m.d - m.b * m.c).toFixed(3));
  const absArea = Math.abs(det).toFixed(3);
  const isDegenerate = Math.abs(det) < 0.01;

  const W = 440, H = 320, ox = W / 2, oy = H / 2, scale = 26, range = 6;

  const gridLines: { p1: { x: number; y: number }; p2: { x: number; y: number }; isAxis: boolean }[] = [];
  for (let i = -range; i <= range; i++) {
    gridLines.push({ p1: { x: i, y: -range }, p2: { x: i, y: range }, isAxis: i === 0 });
    gridLines.push({ p1: { x: -range, y: i }, p2: { x: range, y: i }, isAxis: i === 0 });
  }

  const tx = (p: { x: number; y: number }) => ({ x: m.a * p.x + m.b * p.y, y: m.c * p.x + m.d * p.y });
  const toS = (p: { x: number; y: number }) => ({ x: ox + p.x * scale, y: oy - p.y * scale });
  const unit = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }].map(tx).map(toS);
  const O = toS({ x: 0, y: 0 });
  const iHat = toS(tx({ x: 1, y: 0 }));
  const jHat = toS(tx({ x: 0, y: 1 }));

  const presets = [
    { id: 'id',    label: 'Тождество',        m: { a: 1, b: 0,  c: 0, d: 1  } },
    { id: 'rot90', label: 'Поворот 90°',      m: { a: 0, b: -1, c: 1, d: 0  } },
    { id: 'scale2',label: 'Масштаб ×2',       m: { a: 2, b: 0,  c: 0, d: 2  } },
    { id: 'shear', label: 'Сдвиг',            m: { a: 1, b: 1,  c: 0, d: 1  } },
    { id: 'flip',  label: 'Отражение по x',   m: { a: 1, b: 0,  c: 0, d: -1 } },
    { id: 'sing',  label: 'Вырожд. det=0',    m: { a: 1, b: 2,  c: 1, d: 2  } },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 1 · Матрицы" title="Линейные преобразования плоскости"
        question="Как одна матрица 2×2 искажает всю плоскость и почему столбцы — это образы î и ĵ?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Что такое матрица 2×2?">
          Матрица — это правило: куда отправить вектор (x,y). Первый столбец показывает, куда идёт î=(1,0), второй — куда идёт ĵ=(0,1). Образ любого вектора — линейная комбинация этих двух направлений.
        </InfoCard>
        <InfoCard color={T.green} title="Что такое det(A)?">
          det = ad−bc = коэффициент изменения площади. Единичный квадрат имеет площадь 1. После преобразования — |det|. Знак: det{'>'} 0 — ориентация сохранена, det{'<'} 0 — перевёрнута.
        </InfoCard>
        <InfoCard color={T.amber} title="Когда матрица вырождена?">
          При det=0 два столбца коллинеарны: преобразование «схлопывает» плоскость в прямую. Обратной матрицы не существует.
        </InfoCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, overflow: 'hidden' }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            {gridLines.map((g, k) => {
              const a = toS(g.p1), b = toS(g.p2);
              return <line key={'o'+k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={T.border} strokeWidth="1" />;
            })}
            {gridLines.map((g, k) => {
              const a = toS(tx(g.p1)), b = toS(tx(g.p2));
              return <line key={'t'+k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={g.isAxis ? '#475569' : '#cbd5e1'} strokeWidth={g.isAxis ? 1.5 : 1} style={{ transition: 'all 0.3s ease-out' }} />;
            })}
            <polygon points={unit.map(p => `${p.x},${p.y}`).join(' ')} fill={det >= 0 ? `${T.primary}22` : `${T.red}22`} stroke={det >= 0 ? T.primary : T.red} strokeWidth="2" style={{ transition: 'all 0.3s ease-out' }} />
            <ArrowHead x1={O.x} y1={O.y} x2={iHat.x} y2={iHat.y} color={T.primaryDark} width={3} />
            <ArrowHead x1={O.x} y1={O.y} x2={jHat.x} y2={jHat.y} color={T.pink} width={3} />
            <text x={iHat.x+8} y={iHat.y-6} fontSize="13" fill={T.primaryDark} fontFamily="monospace" fontWeight="bold">î</text>
            <text x={jHat.x+8} y={jHat.y-6} fontSize="13" fill={T.pink} fontFamily="monospace" fontWeight="bold">ĵ</text>
            {isDegenerate && <text x={W/2} y={H-12} textAnchor="middle" fontSize="12" fill={T.red} fontWeight="700">⚠ det = 0 — плоскость схлопнулась в прямую</text>}
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <SectionLabel>Матрица A</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <PlainMatrixDisplay data={[[m.a, m.b], [m.c, m.d]]} />
            </div>
            <SliderRow label="a" value={m.a} setValue={v => { setM(x => ({ ...x, a: v })); setActivePreset(''); }} />
            <SliderRow label="b" value={m.b} setValue={v => { setM(x => ({ ...x, b: v })); setActivePreset(''); }} />
            <SliderRow label="c" value={m.c} setValue={v => { setM(x => ({ ...x, c: v })); setActivePreset(''); }} />
            <SliderRow label="d" value={m.d} setValue={v => { setM(x => ({ ...x, d: v })); setActivePreset(''); }} />
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
              <StatBadge label="det = ad − bc" value={det} color={isDegenerate ? T.red : det > 0 ? T.green : T.amber} />
              <StatBadge label="Площадь образа" value={absArea} color={T.primary} />
              <StatBadge label="Ориентация" value={isDegenerate ? 'коллапс' : det > 0 ? 'сохранена' : 'перевёрнута'} color={isDegenerate ? T.red : det > 0 ? T.green : T.amber} />
            </div>
          </div>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px' }}>
            <SectionLabel>Готовые сценарии</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
              {presets.map(p => (
                <PresetButton key={p.id} active={activePreset === p.id} onClick={() => { setM(p.m); setActivePreset(p.id); }} label={p.label} />
              ))}
            </div>
          </div>
          <Callout color={T.green} title="Ключевое наблюдение">
            <strong>î</strong> (индиго) переходит в первый столбец A. <strong>ĵ</strong> (розовый) — во второй. Столбцы матрицы буквально «показывают», куда уходят оси координат.
          </Callout>
        </div>
      </div>
    </div>
  );
}

// ─── Lab 2: Matrix Addition ───────────────────────────────────────────────────
type Mat3 = number[][];

function MatrixAdditionLab() {
  const [A, setA] = useState<Mat3>([[2, 1, 0], [-1, 3, 2], [0, -2, 1]]);
  const [B, setB] = useState<Mat3>([[1, -1, 3], [2, 0, -2], [-1, 1, 0]]);
  const [heatmap, setHeatmap] = useState(false);
  const [preset, setPreset] = useState('');

  const C: Mat3 = A.map((row, i) => row.map((v, j) => v + B[i][j]));

  const updateCell = (M: Mat3, setter: (m: Mat3) => void, r: number, c: number, val: number) =>
    setter(M.map((row, ri) => row.map((x, ci) => ri === r && ci === c ? val : x)));

  const presets = [
    {
      id: 'opp',  label: '«Противоположные»',
      A: [[2,2,2],[2,2,2],[2,2,2]], B: [[-2,-2,-2],[-2,-2,-2],[-2,-2,-2]],
    },
    {
      id: 'warm', label: '«Тёплые и холодные»',
      A: [[3,2,1],[2,4,1],[1,2,3]], B: [[-1,-2,-3],[-2,-1,-2],[-3,-2,-1]],
    },
    {
      id: 'chess', label: '«Шахматная доска»',
      A: [[1,0,1],[0,1,0],[1,0,1]], B: [[0,1,0],[1,0,1],[0,1,0]],
    },
  ];

  const heatBg = (v: number) => {
    if (!heatmap) return T.white;
    if (Math.abs(v) < 0.01) return '#f1f5f9';
    const t = Math.min(Math.abs(v) / 5, 1);
    return v > 0
      ? `rgba(239,68,68,${(0.1 + t * 0.5).toFixed(2)})`
      : `rgba(59,130,246,${(0.1 + t * 0.5).toFixed(2)})`;
  };
  const heatColor = (v: number) => {
    if (!heatmap) return T.text;
    return v > 0 ? '#b91c1c' : v < 0 ? '#1d4ed8' : T.muted;
  };

  const MatrixInput = ({ data, setter, label, accent }: {
    data: Mat3; setter: (m: Mat3) => void; label: string; accent: string;
  }) => (
    <div>
      <SectionLabel color={accent}>{label}</SectionLabel>
      <div style={{ display: 'inline-flex', flexDirection: 'column' as const, gap: 5, background: T.surface, borderRadius: 13, padding: 10, border: `2px solid ${accent}40` }}>
        {data.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 5 }}>
            {row.map((v, ci) => (
              <input
                key={ci} type="number" min={-5} max={5} step={1} value={v}
                onChange={e => { updateCell(data, setter, ri, ci, Number(e.target.value) || 0); setPreset(''); }}
                style={{ width: 46, height: 42, borderRadius: 9, border: `1.5px solid ${accent}60`, textAlign: 'center' as const, fontSize: 14, fontWeight: 700, color: T.text, background: T.white, padding: 0, outline: 'none' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const MatrixReadonly = ({ data, label, accent }: {
    data: Mat3; label: string; accent: string;
  }) => (
    <div>
      <SectionLabel color={accent}>{label}</SectionLabel>
      <div style={{ display: 'inline-flex', flexDirection: 'column' as const, gap: 5, background: T.surface, borderRadius: 13, padding: 10, border: `2px solid ${accent}60` }}>
        {data.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 5 }}>
            {row.map((v, ci) => (
              <div key={ci} style={{ width: 46, height: 42, borderRadius: 9, border: `1.5px solid ${accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: heatColor(v), background: heatBg(v), transition: 'background 0.25s, color 0.25s' }}>
                {v}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const isZeroC = C.every(row => row.every(v => v === 0));
  const isAllSame = JSON.stringify(A) === JSON.stringify(B);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 2 · Матрицы" title="Сложение матриц — собери пазл"
        question="Как «смешиваются» две таблицы, если складывать их поэлементно?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Поэлементная природа">
          cᵢⱼ = aᵢⱼ + bᵢⱼ. Каждая ячейка живёт самостоятельно: результат в позиции (i,j) зависит только от двух чисел — aᵢⱼ и bᵢⱼ. Никакой «связи» между клетками при сложении нет.
        </InfoCard>
        <InfoCard color={T.green} title="Нулевая матрица O">
          Нулевая матрица — нейтральный элемент: A + O = A. Это «ноль» мира матриц. Обнули B и убедись, что результат равен A.
        </InfoCard>
        <InfoCard color={T.amber} title="Противоположная матрица">
          Если A + B = O, это не означает A = O или B = O. Может быть B = −A. Два ненулевых объекта способны полностью компенсировать друг друга.
        </InfoCard>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center', marginBottom: 18 }}>
        <SectionLabel>Пресеты:</SectionLabel>
        {presets.map(p => (
          <PresetButton key={p.id} active={preset === p.id}
            onClick={() => { setA(p.A as Mat3); setB(p.B as Mat3); setPreset(p.id); }}
            label={p.label} />
        ))}
        <button
          onClick={() => { setHeatmap(h => !h); }}
          style={{ padding: '6px 13px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: heatmap ? T.primary : T.surface, color: heatmap ? T.white : T.muted, border: `1.5px solid ${heatmap ? T.primary : T.border}`, transition: 'all 0.15s' }}>
          🌡 Heatmap {heatmap ? 'вкл.' : 'выкл.'}
        </button>
        <button
          onClick={() => { setB([[0,0,0],[0,0,0],[0,0,0]]); setPreset(''); }}
          style={{ padding: '6px 13px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: T.surface, color: T.muted, border: `1.5px solid ${T.border}` }}>
          B → нулевая
        </button>
        <button
          onClick={() => { setB(A.map(r => [...r])); setPreset(''); }}
          style={{ padding: '6px 13px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: T.surface, color: T.muted, border: `1.5px solid ${T.border}` }}>
          B := A
        </button>
      </div>

      {/* Three matrices */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, alignItems: 'flex-start', marginBottom: 18 }}>
        <MatrixInput data={A} setter={setA} label="Матрица A" accent={T.primaryDark} />
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 32, fontSize: 28, color: T.muted, fontWeight: 300 }}>+</div>
        <MatrixInput data={B} setter={setB} label="Матрица B" accent={T.green} />
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 32, fontSize: 28, color: T.muted, fontWeight: 300 }}>=</div>
        <MatrixReadonly data={C} label="C = A + B" accent={T.amber} />
      </div>

      {/* Dynamic observations */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
        {isZeroC && (
          <Callout color={T.red} title="Наблюдение: сумма равна нулевой матрице">
            A + B = O. Значит B = −A: каждый элемент B является противоположным элементу A. Это не значит, что A или B — нулевые!
          </Callout>
        )}
        {isAllSame && !isZeroC && (
          <Callout color={T.primary} title="Наблюдение: A = B">
            A + B = 2A. Сложение одинаковых матриц равносильно умножению на скаляр λ = 2.
          </Callout>
        )}
        {preset === 'chess' && (
          <Callout color={T.green} title="Наблюдение: шахматная доска">
            A содержит 1 на «чёрных» клетках, B — на «белых». Сумма — матрица из единиц! Два разреженных паттерна дали плотную матрицу.
          </Callout>
        )}
        {preset === 'warm' && heatmap && (
          <Callout color={T.amber} title="Наблюдение: тепловая карта">
            Синие (отрицательные) ячейки B компенсируют красные (положительные) ячейки A. Итоговая «температура» результата — взаимная нейтрализация.
          </Callout>
        )}
      </div>
    </div>
  );
}

// ─── Lab 3: Scalar Multiply ───────────────────────────────────────────────────
function ScalarMultiplyLab() {
  const [lambda, setLambda] = useState(1);
  const [preset, setPreset] = useState<'mixed' | 'pos' | 'neg' | 'chess'>('mixed');

  const presets = {
    mixed: { label: 'Смешанные',    data: [[2,-1,3],[0,-2,1],[-3,2,-1]] as Mat3 },
    pos:   { label: 'Все положит.', data: [[1,2,1],[2,3,2],[1,2,3]] as Mat3 },
    neg:   { label: 'Все отрицат.', data: [[-1,-2,-1],[-2,-3,-2],[-1,-2,-3]] as Mat3 },
    chess: { label: 'Шахматка',     data: [[2,-2,2],[-2,2,-2],[2,-2,2]] as Mat3 },
  };

  const A = presets[preset].data;
  const scaled = A.map(row => row.map(v => Number((v * lambda).toFixed(2))));
  const flatA = A.flat();
  const flatS = scaled.flat();
  const maxAbs = Math.max(1, ...flatA.map(v => Math.abs(v))) * Math.max(1, Math.abs(lambda)) + 0.1;

  const near = (x: number) => Math.abs(lambda - x) < 0.05;
  const regimeLabel = near(0) ? { text: 'λ = 0 → нулевая матрица (вся информация стёрта)', color: T.red }
    : near(1)  ? { text: 'λ = 1 → матрица не изменилась (нейтральный элемент)', color: T.green }
    : near(-1) ? { text: 'λ = −1 → матрица изменила знак (= −A)', color: T.amber }
    : lambda < 0 ? { text: `λ = ${lambda.toFixed(1)} → масштаб ×${Math.abs(lambda).toFixed(1)} + смена знака`, color: T.pink }
    : { text: `λ = ${lambda.toFixed(1)} → масштаб всех элементов в ${lambda.toFixed(1)}×`, color: T.primary };

  const barH = 150;
  const colColors = [T.primary, T.cyan, T.green, T.violet, T.pink, T.amber, T.primaryDark, T.red, T.cyan];
  const lambdaDisplay = near(0) ? '0' : near(1) ? '1' : near(-1) ? '−1' : lambda.toFixed(1);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 3 · Матрицы" title="Умножение на скаляр — растяни и переверни"
        question="Что меняется при масштабировании матрицы коэффициентом λ?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Что значит λA?">
          Каждый элемент матрицы умножается на одно и то же λ. Это «регулятор громкости»: λ=2 удваивает всё, λ=0 обнуляет, λ=−1 меняет знак у каждого элемента.
        </InfoCard>
        <InfoCard color={T.amber} title="Особые точки λ">
          λ=1: нейтральный (A не меняется). λ=0: нулевая матрица (информация стёрта). λ=−1: получаем −A. Знак λ не меняет длину столбиков — только их направление.
        </InfoCard>
        <InfoCard color={T.green} title="Геометрический смысл">
          Если A описывает линейное преобразование, то λA масштабирует его в λ раз. При λ{'<'}0 дополнительно происходит отражение. Det(λA) = λ² · det(A) для 2×2.
        </InfoCard>
      </div>

      <div style={{ padding: '10px 16px', borderRadius: 12, background: `${regimeLabel.color}14`, border: `1px solid ${regimeLabel.color}40`, marginBottom: 18, fontSize: 13, fontWeight: 700, color: regimeLabel.color }}>
        {regimeLabel.text}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 20px' }}>
          <SectionLabel>Матрица A как 9 столбиков (оригинал → после λA)</SectionLabel>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: barH + 70, paddingBottom: 28, paddingTop: 8, overflowX: 'auto' as const }}>
            {flatS.map((v, idx) => {
              const pct = Math.abs(v) / maxAbs;
              const h = Math.max(4, pct * barH);
              const orig = flatA[idx];
              const col = colColors[idx % colColors.length];
              const isPos = v >= 0;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3, flex: 1, minWidth: 32 }}>
                  <div style={{ fontSize: 9, color: T.mutedLight }}>{orig}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'flex-end', height: barH }}>
                    <div style={{ width: '100%', maxWidth: 32, borderRadius: '5px 5px 2px 2px', background: isPos ? col : T.red, opacity: isPos ? 0.85 : 0.75, transition: 'height 0.3s ease-out', height: h }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isPos ? T.primaryDark : T.red }}>{v}</div>
                  <div style={{ fontSize: 9, color: T.mutedLight }}>a{Math.floor(idx/3)+1}{idx%3+1}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>λ =</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: T.primary }}>{lambdaDisplay}</span>
            </div>
            <input type="range" min={-3} max={3} step={0.05} value={lambda}
              onChange={e => setLambda(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.primary }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 10 }}>
              {[-2, -1, 0, 0.5, 1, 2, 3].map(v => (
                <button key={v} onClick={() => setLambda(v)} style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.primaryBorder}`, background: T.primaryLight, color: T.primaryDark, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  λ={v}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px' }}>
            <SectionLabel>Матрица A</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 12 }}>
              {(Object.entries(presets) as [typeof preset, { label: string; data: Mat3 }][]).map(([key, val]) => (
                <PresetButton key={key} active={preset === key} onClick={() => setPreset(key)} label={val.label} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><SectionLabel color={T.mutedLight}>A</SectionLabel><PlainMatrixDisplay data={A} /></div>
              <div><SectionLabel color={T.mutedLight}>λA</SectionLabel><PlainMatrixDisplay data={scaled} /></div>
            </div>
          </div>

          <Callout color={T.primary} title="Исследование">
            Плавно проведи λ от −3 до 3 через 0. Видишь, как все столбики сначала схлопываются в нули, потом «переворачиваются»? Масштаб сохраняется, направление меняется.
          </Callout>
        </div>
      </div>
    </div>
  );
}

// ─── Lab 4: Transpose ─────────────────────────────────────────────────────────
const CELL_PALETTE = [
  '#e11d48','#f97316','#d97706','#16a34a',
  '#0891b2','#4f46e5','#7c3aed','#db2777',
  '#059669','#b45309','#1d4ed8','#9333ea',
];

function TransposeLab() {
  type Mat = number[][];
  const initA: Mat = [[1,2,3,4],[5,6,7,8],[9,10,11,12]];
  const initB: Mat = [[1,0,2,-1],[2,1,0,3],[-1,2,1,0]];

  const [A, setA] = useState<Mat>(initA);
  const [B, setB] = useState<Mat>(initB);
  const [scalar, setScalar] = useState(2);
  const [mode, setMode] = useState<'basic' | 'double' | 'sum' | 'scalar'>('basic');
  const [showTransposed, setShowTransposed] = useState(false);

  // Transposition helper
  const T_fn = (M: Mat): Mat => M[0].map((_, ci) => M.map(row => row[ci]));

  const AT   = T_fn(A);
  const BT   = T_fn(B);
  const ATT  = T_fn(AT);          // = A
  const ApB  = A.map((row, i) => row.map((v, j) => v + B[i][j]));
  const ApBT = T_fn(ApB);         // (A+B)ᵀ
  const ATpBT = AT.map((row, i) => row.map((v, j) => v + BT[i][j])); // Aᵀ+Bᵀ
  const cA   = A.map(row => row.map(v => v * scalar));
  const cAT  = T_fn(cA);          // (cA)ᵀ
  const cAT2 = AT.map(row => row.map(v => v * scalar)); // c·Aᵀ

  // Color for original cell (r, c) in a 3×4 matrix
  const origColor = (r: number, c: number) => CELL_PALETTE[r * 4 + c] ?? T.border;
  // Color for transposed cell (r, c) in 4×3: it came from original (c, r)
  const transpColor = (r: number, c: number) => CELL_PALETTE[c * 4 + r] ?? T.border;

  const ColorCell = ({ v, bg, size = 42 }: { v: number; bg: string; size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size > 36 ? 13 : 11, fontWeight: 800, color: T.white, background: bg, transition: 'all 0.35s ease', flexShrink: 0 }}>
      {v}
    </div>
  );

  const ColorMatrix = ({ data, label, colorFn, size }: {
    data: Mat; label: string; colorFn: (r: number, c: number) => string; size?: number;
  }) => (
    <div>
      <SectionLabel>{label} ({data.length}×{data[0].length})</SectionLabel>
      <div style={{ display: 'inline-flex', flexDirection: 'column' as const, gap: 5, background: T.surface, borderRadius: 13, padding: 8, border: `1px solid ${T.border}` }}>
        {data.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 5 }}>
            {row.map((v, ci) => <ColorCell key={ci} v={v} bg={colorFn(ri, ci)} size={size} />)}
          </div>
        ))}
      </div>
    </div>
  );

  const PlainMatrix = ({ data, label, accent = T.primary }: { data: Mat; label: string; accent?: string }) => (
    <div>
      <SectionLabel color={accent}>{label} ({data.length}×{data[0].length})</SectionLabel>
      <div style={{ display: 'inline-flex', flexDirection: 'column' as const, gap: 4, background: T.surface, borderRadius: 11, padding: 8, border: `1px solid ${accent}40` }}>
        {data.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 4 }}>
            {row.map((v, ci) => (
              <div key={ci} style={{ width: 36, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: T.text, background: T.white, border: `1px solid ${T.border}` }}>
                {v}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const EqLabel = ({ text }: { text: string }) => (
    <div style={{ fontSize: 14, fontWeight: 700, color: T.muted, paddingTop: 28 }}>{text}</div>
  );

  const matricesEqual = (X: Mat, Y: Mat) =>
    X.length === Y.length && X.every((row, i) => row.every((v, j) => v === Y[i][j]));

  const modeLabels: { id: typeof mode; label: string }[] = [
    { id: 'basic',  label: 'A и Aᵀ' },
    { id: 'double', label: '(Aᵀ)ᵀ = A?' },
    { id: 'sum',    label: '(A+B)ᵀ = Aᵀ+Bᵀ?' },
    { id: 'scalar', label: '(cA)ᵀ = cAᵀ?' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 4 · Матрицы" title="Транспонирование — зеркало для матрицы"
        question="Как меняется форма данных при отражении относительно главной диагонали?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Что значит Aᵀ?">
          Транспонирование «отражает» матрицу по главной диагонали: элемент на позиции (i,j) переходит на позицию (j,i). Строки становятся столбцами. Размер m×n превращается в n×m.
        </InfoCard>
        <InfoCard color={T.green} title="Что остаётся на месте?">
          Элементы главной диагонали (aᵢᵢ) не меняются — они лежат на оси отражения. Симметричная матрица (A = Aᵀ) не меняется при транспонировании вовсе.
        </InfoCard>
        <InfoCard color={T.amber} title="Важные свойства">
          (Aᵀ)ᵀ = A — двойное транспонирование возвращает исходное. (A+B)ᵀ = Aᵀ + Bᵀ — линейность. (cA)ᵀ = cAᵀ. Но A (3×4) и Aᵀ (4×3) нельзя сложить!
        </InfoCard>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 18 }}>
        {modeLabels.map(ml => (
          <PresetButton key={ml.id} active={mode === ml.id} onClick={() => setMode(ml.id)} label={ml.label} />
        ))}
      </div>

      {/* Basic mode */}
      {mode === 'basic' && (
        <>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' as const, alignItems: 'flex-start', marginBottom: 20 }}>
            <ColorMatrix data={A} label="A" colorFn={origColor} size={42} />
            <EqLabel text="→" />
            <ColorMatrix data={AT} label="Aᵀ" colorFn={transpColor} size={42} />
          </div>
          <Callout color={T.primary} title="Как читать цвета">
            Каждая ячейка имеет уникальный цвет. Найди элемент a₁₂ (первая строка, второй столбец) в матрице A — он красно-оранжевый. В Aᵀ он переместился на позицию a₂₁ (вторая строка, первый столбец) и сохранил свой цвет. Диагональные элементы остались на месте.
          </Callout>
          <div style={{ marginTop: 14 }}>
            <Collapsible title="Загадка: можно ли сложить A и Aᵀ?" color={T.red}>
              A имеет размер 3×4, Aᵀ — 4×3. Размеры не совпадают: сложить нельзя. Транспонирование <strong>меняет размер</strong> матрицы, что делает прямое сравнение через сложение невозможным.
            </Collapsible>
          </div>
        </>
      )}

      {/* Double transpose */}
      {mode === 'double' && (
        <>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' as const, alignItems: 'flex-start', marginBottom: 16 }}>
            <ColorMatrix data={A} label="A" colorFn={origColor} size={38} />
            <EqLabel text="→ Aᵀ →" />
            <ColorMatrix data={AT} label="Aᵀ" colorFn={transpColor} size={38} />
            <EqLabel text="→ (Aᵀ)ᵀ →" />
            <ColorMatrix data={ATT} label="(Aᵀ)ᵀ" colorFn={origColor} size={38} />
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 12, background: matricesEqual(A, ATT) ? T.greenLight : T.redLight, border: `1px solid ${matricesEqual(A, ATT) ? T.green : T.red}40`, fontSize: 13, fontWeight: 700, color: matricesEqual(A, ATT) ? T.green : T.red }}>
            {matricesEqual(A, ATT) ? '✓ (Aᵀ)ᵀ = A — двойное транспонирование возвращает исходную матрицу!' : '✗ Матрицы не совпадают'}
          </div>
          <Callout color={T.primary} title="Вывод" style={{ marginTop: 12 }}>
            Транспонирование — это обратимая операция: (Aᵀ)ᵀ = A. Информация не теряется — только форма записи меняется.
          </Callout>
        </>
      )}

      {/* Sum property */}
      {mode === 'sum' && (
        <>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' as const, alignItems: 'flex-start', marginBottom: 16 }}>
            <PlainMatrix data={ApBT} label="(A + B)ᵀ" accent={T.primaryDark} />
            <EqLabel text="vs" />
            <PlainMatrix data={ATpBT} label="Aᵀ + Bᵀ" accent={T.green} />
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 12, background: matricesEqual(ApBT, ATpBT) ? T.greenLight : T.redLight, border: `1px solid ${matricesEqual(ApBT, ATpBT) ? T.green : T.red}40`, fontSize: 13, fontWeight: 700, color: matricesEqual(ApBT, ATpBT) ? T.green : T.red }}>
            {matricesEqual(ApBT, ATpBT) ? '✓ (A + B)ᵀ = Aᵀ + Bᵀ — свойство линейности транспонирования!' : '✗ Матрицы не совпадают'}
          </div>
        </>
      )}

      {/* Scalar property */}
      {mode === 'scalar' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Скаляр c =</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: T.primary }}>{scalar}</span>
            <input type="range" min={-3} max={3} step={1} value={scalar} onChange={e => setScalar(Number(e.target.value))} style={{ accentColor: T.primary, width: 120 }} />
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' as const, alignItems: 'flex-start', marginBottom: 16 }}>
            <PlainMatrix data={cAT} label={`(cA)ᵀ при c=${scalar}`} accent={T.primaryDark} />
            <EqLabel text="vs" />
            <PlainMatrix data={cAT2} label={`c · Aᵀ при c=${scalar}`} accent={T.green} />
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 12, background: matricesEqual(cAT, cAT2) ? T.greenLight : T.redLight, border: `1px solid ${matricesEqual(cAT, cAT2) ? T.green : T.red}40`, fontSize: 13, fontWeight: 700, color: matricesEqual(cAT, cAT2) ? T.green : T.red }}>
            {matricesEqual(cAT, cAT2) ? `✓ (cA)ᵀ = c·Aᵀ — скаляр можно выносить за знак транспонирования` : '✗ Матрицы не совпадают'}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Lab 5: Matrix Multiply Conveyor ─────────────────────────────────────────
function MatrixConveyorLab() {
  const [preset, setPreset] = useState<'square' | 'rect' | 'bad'>('square');
  const [rowIdx, setRowIdx] = useState(0);
  const [colIdx, setColIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const presets = {
    square: { name: 'Квадратные 2×2',        A: [[1,2],[3,1]],       B: [[2,0],[1,4]] },
    rect:   { name: 'Прямоуг. 2×3 × 3×2',   A: [[1,-1,2],[0,3,1]],  B: [[2,1],[0,-2],[3,1]] },
    bad:    { name: 'Несовм. 2×3 × 2×2',     A: [[1,2,3],[0,-1,2]],  B: [[1,0],[2,1]] },
  } as const;

  const { A: Aro, B: Bro } = presets[preset];
  const A = Aro as unknown as number[][];
  const B = Bro as unknown as number[][];
  const m = A.length, n = A[0].length, nB = B.length, p = B[0].length;
  const compatible = n === nB;
  const row = Math.min(rowIdx, m - 1);
  const col = Math.min(colIdx, p - 1);

  const C = compatible
    ? Array.from({ length: m }, (_, i) => Array.from({ length: p }, (_, j) => A[i].reduce((s, a, k) => s + a * B[k][j], 0)))
    : [];

  const terms = compatible ? A[row].map((a, k) => ({ a, b: B[k][col], mul: a * B[k][col], k })) : [];
  const current = compatible && C.length ? C[row][col] : null;

  useEffect(() => {
    if (!playing || !compatible) return;
    const t = setTimeout(() => {
      setColIdx(c => {
        if (c + 1 < p) return c + 1;
        setRowIdx(r => (r + 1 < m ? r + 1 : 0));
        return 0;
      });
    }, 900);
    return () => clearTimeout(t);
  }, [playing, compatible, m, p, row, col]);

  const CellGrid = ({ data, highlightRow = -1, highlightCol = -1, highlightCell = false }: {
    data: number[][]; highlightRow?: number; highlightCol?: number; highlightCell?: boolean;
  }) => (
    <div style={{ display: 'inline-block', borderRadius: 12, border: `1px solid ${T.border}`, background: T.white, padding: 6, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data[0].length},minmax(36px,auto))`, gap: 4 }}>
        {data.flatMap((r, ri) => r.map((v, ci) => {
          const active = highlightCell ? (ri === row && ci === col) : (ri === highlightRow || ci === highlightCol);
          return (
            <div key={`${ri}-${ci}`} style={{ height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, transition: 'all 0.2s', background: active ? T.primaryLight : T.surface, color: active ? T.primaryDark : T.text, border: `1.5px solid ${active ? T.primary : T.border}` }}>
              {v}
            </div>
          );
        }))}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 5 · Матрицы" title="Умножение матриц — конвейер"
        question="Почему произведение матриц — это «строка × столбец», а не поэлементное умножение?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Правило умножения">
          cᵢⱼ = скалярное произведение i-й строки A на j-й столбец B: cᵢⱼ = Σₖ aᵢₖ · bₖⱼ. Для m×n · n×p результат — матрица m×p. Внутренние размеры (n) должны совпасть.
        </InfoCard>
        <InfoCard color={T.green} title="Почему не поэлементно?">
          Матрицы кодируют линейные преобразования. AB — это «сначала B, потом A». Это композиция функций, а не умножение таблиц. Поэтому AB ≠ BA в общем случае.
        </InfoCard>
        <InfoCard color={T.amber} title="Про совместимость">
          A(m×n) · B(n×p): число столбцов A = числу строк B. При несовпадении умножение не определено. Результат имеет размер m×p — «внешние» размеры.
        </InfoCard>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {(Object.keys(presets) as Array<keyof typeof presets>).map(k => (
          <PresetButton key={k} active={preset === k} onClick={() => { setPreset(k); setRowIdx(0); setColIdx(0); setPlaying(false); }} label={presets[k].name} />
        ))}
      </div>

      {!compatible && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: T.redLight, border: `1px solid ${T.red}40`, fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 14 }}>
          ⚠ Число столбцов A ({n}) ≠ числу строк B ({nB}) — умножение A×B невозможно!
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const, alignItems: 'flex-start', marginBottom: 18 }}>
        <div><SectionLabel>A ({m}×{n})</SectionLabel><CellGrid data={A.map(r => [...r])} highlightRow={row} /></div>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 28 }}><span style={{ fontSize: 22, color: T.muted, fontWeight: 700 }}>×</span></div>
        <div><SectionLabel>B ({nB}×{p})</SectionLabel><CellGrid data={B.map(r => [...r])} highlightCol={col} /></div>
      </div>

      {compatible && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' as const, marginBottom: 18 }}>
            <div><SectionLabel>C = AB ({m}×{p})</SectionLabel><CellGrid data={C} highlightCell /></div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <SectionLabel>Вычисление c{row+1}{col+1}</SectionLabel>
              <div style={{ background: T.amberLight, border: `1px solid ${T.amber}50`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 10 }}>
                  {terms.map((t, idx) => (
                    <div key={t.k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 8, background: T.white, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.primaryDark }}>{t.a} × {t.b} = {t.mul}</span>
                      {idx < terms.length - 1 && <span style={{ color: T.muted, fontWeight: 700 }}>+</span>}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                  Сумма = <span style={{ color: T.primary, fontSize: 18 }}>{current}</span>
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Строка {row+1} матрицы A · Столбец {col+1} матрицы B</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel>Строка i</SectionLabel>
              <input type="range" min={1} max={m} step={1} value={row+1} onChange={e => setRowIdx(Number(e.target.value)-1)} style={{ width: '100%', accentColor: T.primary }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>i = {row+1}</div>
            </div>
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel>Столбец j</SectionLabel>
              <input type="range" min={1} max={p} step={1} value={col+1} onChange={e => setColIdx(Number(e.target.value)-1)} style={{ width: '100%', accentColor: T.primary }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>j = {col+1}</div>
            </div>
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              <button onClick={() => setPlaying(x => !x)} style={{ padding: '8px 14px', borderRadius: 10, background: playing ? T.red : T.primaryDark, color: T.white, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {playing ? '⏸ Пауза' : '▶ Авто-тур по C'}
              </button>
              <div style={{ fontSize: 11, color: T.muted }}>Авто-тур обходит все cᵢⱼ по очереди</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Lab 6: Chain ─────────────────────────────────────────────────────────────
function MatrixChainLab() {
  type M2 = [[number,number],[number,number]];
  type Step = { title: string; value: M2 | null };

  const randomMatrix = (): M2 => [
    [Math.floor(Math.random()*7)-3, Math.floor(Math.random()*7)-3],
    [Math.floor(Math.random()*7)-3, Math.floor(Math.random()*7)-3],
  ];

  const [A, setA] = useState<M2>([[2,1],[-1,3]]);
  const [B, setB] = useState<M2>([[1,-2],[0,2]]);
  const [C, setC_] = useState<M2>([[3,0],[1,-1]]);
  const [expr, setExpr] = useState('2 * A + 3 * B');
  const [result, setResult] = useState<M2 | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || stepIndex >= steps.length - 1) return;
    const t = setTimeout(() => setStepIndex(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [playing, stepIndex, steps.length]);

  const isM = (x: unknown): x is M2 => Array.isArray(x);
  const addM = (X: M2, Y: M2): M2 => [[X[0][0]+Y[0][0],X[0][1]+Y[0][1]],[X[1][0]+Y[1][0],X[1][1]+Y[1][1]]];
  const subM = (X: M2, Y: M2): M2 => [[X[0][0]-Y[0][0],X[0][1]-Y[0][1]],[X[1][0]-Y[1][0],X[1][1]-Y[1][1]]];
  const mulM = (X: M2, Y: M2): M2 => [[X[0][0]*Y[0][0]+X[0][1]*Y[1][0],X[0][0]*Y[0][1]+X[0][1]*Y[1][1]],[X[1][0]*Y[0][0]+X[1][1]*Y[1][0],X[1][0]*Y[0][1]+X[1][1]*Y[1][1]]];
  const scaleM = (k: number, X: M2): M2 => [[k*X[0][0],k*X[0][1]],[k*X[1][0],k*X[1][1]]];
  const transM = (X: M2): M2 => [[X[0][0],X[1][0]],[X[0][1],X[1][1]]];
  const invM = (X: M2): M2 => {
    const d = X[0][0]*X[1][1]-X[0][1]*X[1][0];
    if (Math.abs(d) < 1e-9) throw new Error('Матрица необратима (det = 0).');
    return [[X[1][1]/d,-X[0][1]/d],[-X[1][0]/d,X[0][0]/d]];
  };

  const tokenize = (source: string) => {
    const re = /\s*([ABC]|\d+(?:\.\d+)?|\+|-|\*|\(|\)|T|inv)\s*/g;
    const tokens: string[] = [];
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) tokens.push(m[1]);
    if (tokens.join('') !== source.replace(/\s+/g,'')) throw new Error('Некорректные токены. Разрешено: A,B,C,+,-,*,(,),T,inv,числа');
    return tokens;
  };

  const run = () => {
    try {
      const tokens = tokenize(expr);
      let pos = 0;
      const localSteps: Step[] = [{ title: 'Исходное выражение', value: null }];
      const peek = () => tokens[pos];
      const read = (expected?: string) => { const t = tokens[pos]; if (expected && t !== expected) throw new Error(`Ожидалось "${expected}", найдено "${t ?? 'конец'}".`); pos++; return t; };
      const push = (title: string, value: M2 | number) => isM(value) && localSteps.push({ title, value });

      const parsePostfix = (x: M2 | number) => {
        let cur = x;
        while (peek() === 'T') { read('T'); if (!isM(cur)) throw new Error('Транспонирование только для матриц.'); cur = transM(cur); push('Транспонирование Xᵀ', cur); }
        return cur;
      };
      const parseFactor = (): M2 | number => {
        const t = peek();
        if (!t) throw new Error('Неожиданный конец.');
        if (t === '(') { read('('); const v = parseExpr(); read(')'); return parsePostfix(v); }
        if (t === 'inv') { read('inv'); read('('); const v = parseExpr(); read(')'); if (!isM(v)) throw new Error('inv(...) требует матрицу.'); const r = invM(v); push('Обратная матрица X⁻¹', r); return parsePostfix(r); }
        if (t === 'A' || t === 'B' || t === 'C') { read(); return parsePostfix(t === 'A' ? A : t === 'B' ? B : C); }
        if (!Number.isNaN(Number(t))) { read(); return Number(t); }
        throw new Error(`Неожиданный токен "${t}".`);
      };
      const parseTerm = (): M2 | number => {
        let left = parseFactor();
        while (peek() === '*') {
          read('*');
          const right = parseFactor();
          const out = isM(left) && isM(right) ? mulM(left, right) : isM(left) ? scaleM(right as number, left) : isM(right) ? scaleM(left as number, right) : (left as number) * (right as number);
          push('Перемножение', out); left = out;
        }
        return left;
      };
      const parseExpr = (): M2 | number => {
        let left = parseTerm();
        while (peek() === '+' || peek() === '-') {
          const op = read();
          const right = parseTerm();
          if (!isM(left) || !isM(right)) throw new Error('Сложение/вычитание только для матриц.');
          left = op === '+' ? addM(left, right) : subM(left, right);
          push(op === '+' ? 'Сложение' : 'Вычитание', left);
        }
        return left;
      };

      const out = parseExpr();
      if (pos < tokens.length) throw new Error(`Лишний токен: ${tokens[pos]}`);
      if (!isM(out)) throw new Error('Финальный результат должен быть матрицей.');
      localSteps.push({ title: '✓ Результат', value: out });
      setResult(out); setSteps(localSteps); setStepIndex(0); setError(''); setPlaying(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка вычисления'); setResult(null); setSteps([]); setPlaying(false); }
  };

  const expressionPresets = ['2 * A + 3 * B','(A * B) T','B T * A T','A * (B + C)','A * B + A * C','(A + B) * (A + B)','A T * A','inv(A * B)','inv(B) * inv(A)'];
  const setCell = (Mx: M2, setter: (m: M2) => void, r: number, c: number, v: string) =>
    setter(Mx.map((row, ri) => row.map((x, ci) => ri === r && ci === c ? Number(v) || 0 : x)) as M2);
  const fmt = (x: number) => Number.isInteger(x) ? String(x) : x.toFixed(2);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 6 · Матрицы" title="Цепочка операций — собери выражение"
        question="Как не запутаться в порядке действий в матричных выражениях?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Порядок имеет значение">
          Матричное умножение некоммутативно: AB ≠ BA. Транспонирование произведения: (AB)ᵀ = BᵀAᵀ — порядок меняется! Это не ошибка, это свойство линейной алгебры.
        </InfoCard>
        <InfoCard color={T.green} title="Дистрибутивность">
          A(B+C) = AB+AC — работает. Но (A+B)² = A²+AB+BA+B² ≠ A²+2AB+B², потому что AB ≠ BA. Алгебра матриц похожа на обычную, но с ловушками.
        </InfoCard>
        <InfoCard color={T.violet} title="Обратная и порядок">
          (AB)⁻¹ = B⁻¹A⁻¹ — порядок меняется на обратный. Попробуй: inv(A * B) и inv(B) * inv(A) — должны совпасть!
        </InfoCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {([['A', A, setA], ['B', B, setB], ['C', C, setC_]] as [string, M2, (m: M2) => void][]).map(([name, Mx, setter]) => (
            <div key={name} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.primary, fontFamily: 'monospace' }}>{name}</span>
                <span style={{ fontSize: 10, color: T.mutedLight }}>2×2</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {[[0,0],[0,1],[1,0],[1,1]].map(([r,c]) => (
                  <input key={`${r}${c}`} type="number" value={Mx[r as 0|1][c as 0|1]} onChange={e => setCell(Mx, setter, r, c, e.target.value)}
                    style={{ padding: '5px 8px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, textAlign: 'center' as const, width: '100%' }} />
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => { setA(randomMatrix()); setB(randomMatrix()); setC_(randomMatrix()); setResult(null); setSteps([]); }}
            style={{ padding: '8px 14px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: T.muted }}>
            🎲 Случайные A, B, C
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <SectionLabel>Выражение</SectionLabel>
            <textarea value={expr} onChange={e => setExpr(e.target.value)} rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${T.border}`, fontFamily: 'monospace', fontSize: 14, resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 8 }}>
              {['A','B','C','+','-','*','(',')',	'T','inv','2','3'].map(tk => (
                <button key={tk} onClick={() => setExpr(s => `${s}${s.endsWith(' ') || s.length === 0 ? '' : ' '}${tk} `)}
                  style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.primaryBorder}`, background: T.primaryLight, color: T.primaryDark, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace' }}>
                  {tk}
                </button>
              ))}
              <button onClick={() => setExpr('')} style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Очистить</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={run} style={{ padding: '8px 18px', borderRadius: 10, background: T.primaryDark, color: T.white, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Вычислить</button>
              <button onClick={() => { setStepIndex(0); setPlaying(true); }} disabled={steps.length < 2}
                style={{ padding: '8px 18px', borderRadius: 10, background: T.green, color: T.white, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: steps.length < 2 ? 0.4 : 1 }}>
                ▶ Пошагово
              </button>
            </div>
            {error && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 9, background: T.redLight, color: T.red, fontSize: 12, fontWeight: 600 }}>{error}</div>}
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }}>
            <SectionLabel>Готовые выражения</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {expressionPresets.map(p => (
                <button key={p} onClick={() => setExpr(p)} style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace' }}>{p}</button>
              ))}
            </div>
          </div>

          {result && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
                <SectionLabel color={T.green}>Результат</SectionLabel>
                <PlainMatrixDisplay data={result} />
              </div>
              <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
                <SectionLabel>Шаг {stepIndex+1} / {steps.length}</SectionLabel>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, marginBottom: 6 }}>{steps[stepIndex]?.title}</div>
                {steps[stepIndex]?.value && <PlainMatrixDisplay data={steps[stepIndex].value!} />}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => setStepIndex(s => Math.max(0, s-1))} disabled={stepIndex === 0}
                    style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, fontSize: 11, cursor: 'pointer', opacity: stepIndex === 0 ? 0.4 : 1 }}>←</button>
                  <button onClick={() => setStepIndex(s => Math.min(steps.length-1, s+1))} disabled={stepIndex >= steps.length-1}
                    style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, fontSize: 11, cursor: 'pointer', opacity: stepIndex >= steps.length-1 ? 0.4 : 1 }}>→</button>
                  <button onClick={() => { setStepIndex(0); setPlaying(p => !p); }}
                    style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: T.green, color: T.white, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {playing ? '⏸' : '▶'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Lab 7: Inverse ───────────────────────────────────────────────────────────
function MatrixInverseUndoLab() {
  const [m, setM] = useState({ a: 2, b: 1, c: 0, d: 2 });
  const [appliedInverse, setAppliedInverse] = useState(false);
  const [activePreset, setActivePreset] = useState('');
  const det = m.a * m.d - m.b * m.c;
  const invertible = Math.abs(det) > 1e-9;
  const inv = invertible ? { a: m.d / det, b: -m.b / det, c: -m.c / det, d: m.a / det } : null;

  const W = 440, H = 320, ox = W/2, oy = H/2, scale = 28, range = 5;
  const toS = (p: { x: number; y: number }) => ({ x: ox + p.x * scale, y: oy - p.y * scale });
  const txA = (p: { x: number; y: number }) => ({ x: m.a * p.x + m.b * p.y, y: m.c * p.x + m.d * p.y });
  const txInv = (p: { x: number; y: number }) => inv ? { x: inv.a * p.x + inv.b * p.y, y: inv.c * p.x + inv.d * p.y } : p;
  const throughPipeline = (p: { x: number; y: number }) => { const afterA = txA(p); return appliedInverse && inv ? txInv(afterA) : afterA; };

  const gridLines: { p1: { x: number; y: number }; p2: { x: number; y: number }; axis: boolean }[] = [];
  for (let i = -range; i <= range; i++) {
    gridLines.push({ p1: { x: i, y: -range }, p2: { x: i, y: range }, axis: i === 0 });
    gridLines.push({ p1: { x: -range, y: i }, p2: { x: range, y: i }, axis: i === 0 });
  }

  const presets = [
    { id: 'stretch', label: 'diag(2, 2)',    m: { a: 2, b: 0, c: 0, d: 2  } },
    { id: 'rot90',   label: 'Поворот 90°',   m: { a: 0, b: -1, c: 1, d: 0 } },
    { id: 'shear',   label: 'Сдвиг (det=1)', m: { a: 1, b: 1, c: 0, d: 1  } },
    { id: 'sing',    label: 'det = 0',        m: { a: 1, b: 2, c: 1, d: 2  } },
  ];

  const fmt = (x: number) => Math.abs(x) < 0.005 ? '0' : x.toFixed(2);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 7 · Матрицы" title="Обратная матрица — отмени действие"
        question="Когда преобразование можно «откатить» и почему det=0 делает это невозможным?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Что такое A⁻¹?">
          A⁻¹ — матрица, которая «отменяет» действие A: A⁻¹ · (Ax) = x. Геометрически — это Ctrl+Z для линейного преобразования.
        </InfoCard>
        <InfoCard color={T.red} title="Когда A⁻¹ не существует?">
          При det(A) = 0 матрица «схлопывает» плоскость в прямую. Информация теряется необратимо: A⁻¹ существует ↔ det(A) ≠ 0.
        </InfoCard>
        <InfoCard color={T.amber} title="Формула для 2×2">
          A⁻¹ = (1/det) · [[d,−b],[−c,a]]. Поменяй диагональ, сменяй знаки у недиагональных, раздели на det.
        </InfoCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 8, textAlign: 'center' as const }}>
            {appliedInverse ? '📐 Применено A · A⁻¹ = I → сетка вернулась к исходной' : '📐 Применено только A → сетка деформирована'}
          </div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            {gridLines.map((g, k) => {
              const a = toS(g.p1), b = toS(g.p2);
              return <line key={'o'+k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={T.border} strokeWidth="1" />;
            })}
            {gridLines.map((g, k) => {
              const a = toS(throughPipeline(g.p1)), b = toS(throughPipeline(g.p2));
              return <line key={'t'+k} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={g.axis ? '#475569' : (appliedInverse ? T.green : T.primary)}
                strokeWidth={g.axis ? 1.5 : 1} opacity={g.axis ? 1 : 0.55}
                style={{ transition: 'all 0.3s' }} />;
            })}
            {!invertible && <text x={W/2} y={H-14} textAnchor="middle" fontSize="12" fill={T.red} fontWeight="700">⚠ Матрица вырождена — обратной не существует</text>}
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <SectionLabel>Матрица A</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <PlainMatrixDisplay data={[[m.a, m.b], [m.c, m.d]]} />
            </div>
            <SliderRow label="a" value={m.a} setValue={v => { setM(x => ({ ...x, a: v })); setAppliedInverse(false); setActivePreset(''); }} />
            <SliderRow label="b" value={m.b} setValue={v => { setM(x => ({ ...x, b: v })); setAppliedInverse(false); setActivePreset(''); }} />
            <SliderRow label="c" value={m.c} setValue={v => { setM(x => ({ ...x, c: v })); setAppliedInverse(false); setActivePreset(''); }} />
            <SliderRow label="d" value={m.d} setValue={v => { setM(x => ({ ...x, d: v })); setAppliedInverse(false); setActivePreset(''); }} />
            <div style={{ marginTop: 12 }}>
              <StatBadge label="det(A) = ad − bc" value={det.toFixed(3)} color={invertible ? T.green : T.red} />
            </div>
          </div>

          {inv && (
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px' }}>
              <SectionLabel color={T.green}>Вычисленная A⁻¹</SectionLabel>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PlainMatrixDisplay data={[[Number(fmt(inv.a)), Number(fmt(inv.b))], [Number(fmt(inv.c)), Number(fmt(inv.d))]]} />
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 8, textAlign: 'center' as const }}>Проверка: A · A⁻¹ = I ✓</div>
            </div>
          )}

          <button onClick={() => setAppliedInverse(s => !s)} disabled={!invertible}
            style={{ padding: '12px 18px', borderRadius: 14, background: !invertible ? T.surface : appliedInverse ? `${T.green}20` : T.primaryDark, color: !invertible ? T.mutedLight : appliedInverse ? T.green : T.white, border: `1.5px solid ${!invertible ? T.border : appliedInverse ? T.green : T.primaryDark}`, fontSize: 13, fontWeight: 700, cursor: invertible ? 'pointer' : 'not-allowed' }}>
            {!invertible ? '⚠ Обратной не существует' : appliedInverse ? '↩ Убрать A⁻¹' : '▶ Применить A⁻¹'}
          </button>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }}>
            <SectionLabel>Сценарии</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
              {presets.map(p => (
                <PresetButton key={p.id} active={activePreset === p.id}
                  onClick={() => { setM(p.m); setAppliedInverse(false); setActivePreset(p.id); }}
                  label={p.label} />
              ))}
            </div>
          </div>

          <Callout color={T.violet} title="Загадка">
            После A, потом B: откат идёт B⁻¹, потом A⁻¹ — порядок обратный. Проверь в Лаборатории 6: сравни inv(A * B) и inv(B) * inv(A).
          </Callout>
        </div>
      </div>
    </div>
  );
}

// ─── Lab 8: Determinant as Area ───────────────────────────────────────────────
function DeterminantAreaLab() {
  const [m, setM] = useState({ a: 2, b: 0.5, c: 0.3, d: 1.8 });
  const [activePreset, setActivePreset] = useState('');
  const [dragging, setDragging] = useState<null | 'v1' | 'v2'>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 500, H = 380, ox = 240, oy = 200, SCALE = 62, range = 3.5;

  const toS = (p: { x: number; y: number }) => ({ x: ox + p.x * SCALE, y: oy - p.y * SCALE });
  const fromS = (sx: number, sy: number) => ({ x: (sx - ox) / SCALE, y: (oy - sy) / SCALE });

  const O = toS({ x: 0, y: 0 });
  const col1 = useMemo(() => ({ x: m.a, y: m.c }), [m.a, m.c]);
  const col2 = useMemo(() => ({ x: m.b, y: m.d }), [m.b, m.d]);
  const V1 = toS(col1);
  const V2 = toS(col2);
  const V12 = toS({ x: col1.x + col2.x, y: col1.y + col2.y });

  const det = m.a * m.d - m.b * m.c;
  const area = Math.abs(det);
  const len1 = Math.hypot(col1.x, col1.y);
  const len2 = Math.hypot(col2.x, col2.y);
  const dotProd = col1.x * col2.x + col1.y * col2.y;
  const cosA = len1 > 1e-9 && len2 > 1e-9 ? Math.max(-1, Math.min(1, dotProd / (len1 * len2))) : 1;
  const angle = Math.acos(cosA) * 180 / Math.PI;
  const isDegenerate = area < 0.04;
  const isNearDegenerate = area > 0.04 && area < 0.35;
  const isNeg = det < -0.04;

  const paraColor = isDegenerate ? T.mutedLight : isNeg ? T.red : T.primary;
  const detLabel = isDegenerate
    ? { text: '⚠ det ≈ 0 — матрица вырождена', color: T.red }
    : isNearDegenerate
      ? { text: '⚠ det мало — плохая обусловленность Ax=b', color: T.amber }
      : isNeg
        ? { text: 'det < 0 — ориентация перевёрнута', color: T.red }
        : { text: 'det > 0 — ориентация сохранена', color: T.green };

  const handleSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    const sy = (e.clientY - rect.top) * (H / rect.height);
    const p = fromS(sx, sy);
    const snap = (v: number) => Math.max(-range, Math.min(range, Math.round(v * 10) / 10));
    if (dragging === 'v1') setM(x => ({ ...x, a: snap(p.x), c: snap(p.y) }));
    else setM(x => ({ ...x, b: snap(p.x), d: snap(p.y) }));
    setActivePreset('');
  }, [dragging]);

  const presets = [
    { id: 'unit',   label: 'Единичная (det=1)',     color: T.green,   m: { a: 1, b: 0, c: 0, d: 1 } },
    { id: 'swap',   label: 'Поменять столбцы',      color: T.amber,   m: { a: 0.5, b: 2, c: 1.8, d: 0.3 } },
    { id: 'collin', label: 'Коллинеарные (det=0)',  color: T.red,     m: { a: 2, b: 1, c: 1, d: 0.5 } },
    { id: 'neg',    label: 'det < 0',               color: T.red,     m: { a: 2, b: 0, c: 0, d: -1.5 } },
    { id: 'ortho',  label: 'Ортогональные',         color: T.primary, m: { a: 2, b: 0, c: 0, d: 2 } },
    { id: 'almost', label: 'Почти вырождена',       color: T.amber,   m: { a: 2, b: 1.98, c: 1, d: 0.99 } },
  ];

  const fmt = (v: number) => Math.abs(v) < 0.005 ? '0' : v.toFixed(2);

  const heightVec = useMemo(() => {
    if (len1 < 1e-9) return null;
    const proj = dotProd / (len1 * len1);
    return { fx: col1.x * proj, fy: col1.y * proj, hx: col2.x - col1.x * proj, hy: col2.y - col1.y * proj };
  }, [col1, col2, len1, dotProd]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", paddingBottom: 40 }}>
      <div style={{ borderRadius: 18, background: `linear-gradient(135deg,${T.primaryLight} 0%,${T.white} 55%,${T.amberLight} 100%)`, border: `1px solid ${T.primaryBorder}`, padding: '22px 26px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: T.primary, textTransform: 'uppercase' as const, background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '3px 10px' }}>Лаборатория 8 · Матрицы</span>
        </div>
        <h3 style={{ margin: '0 0 7px', fontSize: 24, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>Определитель как площадь</h3>
        <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>
          <strong style={{ color: T.text }}>Исследовательский вопрос:</strong> определитель матрицы 2×2 — это площадь параллелограмма на её столбцах. Но что это даёт для понимания матрицы и системы Ax=b?
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Геометрический смысл det">
          Столбцы матрицы A — два вектора v₁ и v₂. Площадь параллелограмма на них = |det(A)|. |det| показывает, во сколько раз изменилась площадь единичного квадрата.
        </InfoCard>
        <InfoCard color={T.green} title="Знак определителя">
          det {'>'} 0: ориентация сохранена (v₂ «слева» от v₁). det {'<'} 0: ориентация перевёрнута. det = 0: векторы коллинеарны, параллелограмм «схлопнулся».
        </InfoCard>
        <InfoCard color={T.amber} title="det и обусловленность">
          Малый |det| → векторы почти коллинеарны → матрица почти вырождена → система Ax=b плохо обусловлена.
        </InfoCard>
      </div>

      <div style={{ padding: '10px 16px', borderRadius: 12, background: `${detLabel.color}12`, border: `1px solid ${detLabel.color}40`, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: detLabel.color, fontFamily: 'monospace' }}>det = {fmt(det)}</span>
        <span style={{ fontSize: 13, color: T.muted }}>|det| = <strong>{fmt(area)}</strong> (площадь)</span>
        <span style={{ fontSize: 13, color: T.muted }}>угол = <strong>{Number.isFinite(angle) ? `${angle.toFixed(1)}°` : '—'}</strong></span>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: detLabel.color }}>{detLabel.text}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 18, alignItems: 'start', marginBottom: 20 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 14px 10px', position: 'relative' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Move size={13} color={T.mutedLight} />
            <span style={{ fontSize: 11, color: T.mutedLight }}>Тяни концы стрелок для перемещения векторов</span>
          </div>
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', cursor: dragging ? 'grabbing' : 'default', touchAction: 'none' }}
            onPointerMove={handleSvgPointerMove} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)}>
            {Array.from({ length: Math.ceil(range) * 2 + 1 }, (_, idx) => idx - Math.ceil(range)).map(i => (
              <g key={i}>
                <line x1={toS({x:i,y:-range}).x} y1={toS({x:i,y:-range}).y} x2={toS({x:i,y:range}).x} y2={toS({x:i,y:range}).y} stroke={i===0 ? '#cbd5e1' : T.border} strokeWidth={i===0 ? 1.5 : 1} />
                <line x1={toS({x:-range,y:i}).x} y1={toS({x:-range,y:i}).y} x2={toS({x:range,y:i}).x} y2={toS({x:range,y:i}).y} stroke={i===0 ? '#cbd5e1' : T.border} strokeWidth={i===0 ? 1.5 : 1} />
              </g>
            ))}
            {[-2,-1,1,2].map(i => {
              const px = toS({x:i,y:0}), py = toS({x:0,y:i});
              return (
                <g key={i}>
                  <text x={px.x} y={oy+14} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{i}</text>
                  <text x={ox-14} y={py.y+3} textAnchor="end" fontSize="9" fill={T.mutedLight}>{i}</text>
                </g>
              );
            })}
            {heightVec && !isDegenerate && (() => {
              const foot = toS({x:heightVec.fx,y:heightVec.fy});
              const tip  = toS({x:col2.x,y:col2.y});
              const base1= toS({x:col1.x+heightVec.fx,y:col1.y+heightVec.fy});
              return (
                <g opacity="0.4">
                  <line x1={tip.x} y1={tip.y} x2={foot.x} y2={foot.y} stroke={T.cyan} strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1={V12.x} y1={V12.y} x2={base1.x} y2={base1.y} stroke={T.cyan} strokeWidth="1.5" strokeDasharray="4 3" />
                </g>
              );
            })()}
            <polygon points={`${O.x},${O.y} ${V1.x},${V1.y} ${V12.x},${V12.y} ${V2.x},${V2.y}`} fill={`${paraColor}1c`} stroke={paraColor} strokeWidth="2" style={{ transition: 'fill 0.3s,stroke 0.3s' }} />
            <line x1={V1.x} y1={V1.y} x2={V12.x} y2={V12.y} stroke={`${T.primaryDark}55`} strokeWidth="1.5" strokeDasharray="5 4" />
            <line x1={V2.x} y1={V2.y} x2={V12.x} y2={V12.y} stroke={`${T.red}55`} strokeWidth="1.5" strokeDasharray="5 4" />
            {!isDegenerate && (() => {
              const cx = (O.x+V1.x+V12.x+V2.x)/4, cy = (O.y+V1.y+V12.y+V2.y)/4;
              return (
                <g>
                  <rect x={cx-24} y={cy-10} width={48} height={18} rx="5" fill={T.white} opacity="0.85" />
                  <text x={cx} y={cy+4} textAnchor="middle" fontSize="12" fill={paraColor} fontWeight="900">{fmt(area)}</text>
                </g>
              );
            })()}
            {!isDegenerate && len1 > 0.1 && len2 > 0.1 && (
              <AngleArc cx={O.x} cy={O.y} v1={{x:col1.x,y:-col1.y}} v2={{x:col2.x,y:-col2.y}} r={30} color={T.violet} />
            )}
            <Arrow x1={O.x} y1={O.y} x2={V1.x} y2={V1.y} color={T.red} width={3} />
            <circle cx={V1.x} cy={V1.y} r={10} fill={T.red} opacity={0.15} style={{cursor:'grab'}} onPointerDown={e => { e.preventDefault(); setDragging('v1'); }} />
            <circle cx={V1.x} cy={V1.y} r={5} fill={T.red} stroke={T.white} strokeWidth="2" style={{cursor:'grab'}} onPointerDown={e => { e.preventDefault(); setDragging('v1'); }} />
            <text x={V1.x+9} y={V1.y-8} fontSize="13" fill={T.red} fontWeight="900">v₁</text>
            <text x={V1.x+9} y={V1.y+6} fontSize="9" fill={`${T.red}99`}>({fmt(col1.x)}, {fmt(col1.y)})</text>
            <Arrow x1={O.x} y1={O.y} x2={V2.x} y2={V2.y} color={T.primaryDark} width={3} />
            <circle cx={V2.x} cy={V2.y} r={10} fill={T.primaryDark} opacity={0.15} style={{cursor:'grab'}} onPointerDown={e => { e.preventDefault(); setDragging('v2'); }} />
            <circle cx={V2.x} cy={V2.y} r={5} fill={T.primaryDark} stroke={T.white} strokeWidth="2" style={{cursor:'grab'}} onPointerDown={e => { e.preventDefault(); setDragging('v2'); }} />
            <text x={V2.x+9} y={V2.y-8} fontSize="13" fill={T.primaryDark} fontWeight="900">v₂</text>
            <text x={V2.x+9} y={V2.y+6} fontSize="9" fill={`${T.primaryDark}99`}>({fmt(col2.x)}, {fmt(col2.y)})</text>
            <circle cx={O.x} cy={O.y} r={4} fill={T.text} />
            <text x={O.x-12} y={O.y+14} fontSize="9" fill={T.mutedLight}>O</text>
            {!isDegenerate && (
              <text x={W-14} y={H-10} textAnchor="end" fontSize="11" fontWeight="700" fill={isNeg ? T.red : T.green}>
                {isNeg ? '↻ перевёрнута' : '↺ сохранена'}
              </text>
            )}
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 13 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '15px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <SectionLabel>Матрица A = [v₁ | v₂]</SectionLabel>
              <button onClick={() => { setM({ a: 2, b: 0.5, c: 0.3, d: 1.8 }); setActivePreset(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, fontSize: 11, cursor: 'pointer', color: T.muted }}>
                <RotateCcw size={11} /> Сброс
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, background: T.surface, borderRadius: 10, padding: '8px 10px', border: `1px solid ${T.border}`, fontFamily: 'monospace', fontSize: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, textAlign: 'center' as const }}>
                  <div style={{ color: `${T.red}cc`, fontWeight: 700 }}>{fmt(m.a)}</div>
                  <div style={{ color: `${T.primaryDark}cc`, fontWeight: 700 }}>{fmt(m.b)}</div>
                  <div style={{ color: `${T.red}cc`, fontWeight: 700 }}>{fmt(m.c)}</div>
                  <div style={{ color: `${T.primaryDark}cc`, fontWeight: 700 }}>{fmt(m.d)}</div>
                </div>
                <div style={{ textAlign: 'center' as const, fontSize: 9, color: T.mutedLight, marginTop: 4 }}>v₁ | v₂</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, justifyContent: 'center' }}>
                <div style={{ fontSize: 10, color: T.muted }}>v₁=(a,c)</div>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: T.red }} />
                <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>v₂=(b,d)</div>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: T.primaryDark }} />
              </div>
            </div>
            {([['a','v₁-x',T.red],['c','v₁-y',T.red],['b','v₂-x',T.primaryDark],['d','v₂-y',T.primaryDark]] as [keyof typeof m, string, string][]).map(([key, hint, color]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color }}>{key}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: T.text, fontWeight: 700 }}>{fmt(m[key])}</span>
                </div>
                <div style={{ fontSize: 9, color: T.mutedLight, marginBottom: 3 }}>{hint}</div>
                <input type="range" min={-3} max={3} step={0.1} value={m[key]}
                  onChange={e => { setM(x => ({ ...x, [key]: Number(e.target.value) })); setActivePreset(''); }}
                  style={{ width: '100%', accentColor: color }} />
              </div>
            ))}
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '13px 15px', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <SectionLabel>Числовые характеристики</SectionLabel>
            <StatRow label="det(A) = ad − bc" value={fmt(det)} sub="формула Лейбница для 2×2" color={isDegenerate ? T.red : isNeg ? T.amber : T.green} />
            <StatRow label="Площадь |det(A)|" value={fmt(area)} sub="размер параллелограмма" color={T.primary} />
            <StatRow label="Угол v₁ ∠ v₂" value={Number.isFinite(angle) ? `${angle.toFixed(1)}°` : '—'} sub="90° → max площадь" color={T.cyan} />
            <StatRow label="|v₁| · |v₂|" value={fmt(len1 * len2)} sub="площадь при угле 90°" color={T.violet} />
            <div style={{ padding: '6px 12px', borderRadius: 9, background: T.surface, border: `1px solid ${T.border}`, fontSize: 11, color: T.muted, textAlign: 'center' as const }}>
              площадь = |v₁|·|v₂|·|sin θ| = <strong style={{ color: T.primary }}>{fmt(area)}</strong>
            </div>
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }}>
            <SectionLabel>Готовые сценарии</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
              {presets.map(p => (
                <PresetButton key={p.id} active={activePreset === p.id}
                  onClick={() => { setM(p.m); setActivePreset(p.id); }}
                  label={p.label} color={p.color} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Исследовательские вопросы</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7, marginBottom: 18 }}>
        <Collapsible title="Сделай столбцы коллинеарными. Что с det и площадью?" color={T.red}>
          Выбери «Коллинеарные» или вручную сделай v₂ = 2·v₁. Площадь стремится к нулю — параллелограмм «схлопывается» в отрезок. Det=0 означает вырожденность: матрица «давит» плоскость в прямую. Системы Ax=b при таком A не имеют единственного решения.
        </Collapsible>
        <Collapsible title="Поменяй столбцы местами: что происходит со знаком det?" color={T.amber}>
          Посмотри на «Поменять столбцы»: если det {'>'} 0, после перестановки det {'<'} 0. Площадь |det| не меняется, но «направление обхода» поменялось. Антисимметрия: det([B,A]) = −det([A,B]).
        </Collapsible>
        <Collapsible title="Удвой вектор v₁ (a и c × 2). Как изменится det?" color={T.primary}>
          Det тоже удвоится. Площадь = |v₁|·|v₂|·|sin θ| линейно зависит от длины каждого вектора. Это свойство линейности определителя по столбцам.
        </Collapsible>
        <Collapsible title="Когда площадь максимальна при фиксированных |v₁| и |v₂|?" color={T.green}>
          При θ = 90°: sin 90° = 1. Выбери «Ортогональные» и сравни с другими при тех же длинах.
        </Collapsible>
        <Collapsible title="Загадка: det ≈ 0. Что это значит для Ax=b?" color={T.violet}>
          Матрица «почти схлопывает» плоскость в прямую. Система формально имеет единственное решение, но оно экстремально чувствительно к ошибкам в b. Это <strong>плохая обусловленность</strong>: κ = σ₁/σ₂ → ∞ при det → 0.
        </Collapsible>
      </div>

      <div style={{ background: `linear-gradient(135deg,${T.primaryLight},${T.amberLight})`, border: `1px solid ${T.primaryBorder}`, borderRadius: 16, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Lightbulb size={17} color={T.primary} />
          <span style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Главный вывод</span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 14, color: T.text, lineHeight: 1.8 }}>
          <strong>Определитель — коэффициент изменения площади под действием матрицы.</strong>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>
          {[
            { val: '|det| > 1', desc: 'площадь растёт',         color: T.green   },
            { val: '|det| = 1', desc: 'площадь сохраняется',    color: T.primary },
            { val: '|det| < 1', desc: 'площадь сжимается',      color: T.amber   },
            { val: 'det = 0',   desc: 'площадь исчезает',       color: T.red     },
            { val: 'det < 0',   desc: 'ориентация перевёрнута', color: T.violet  },
          ].map(({ val, desc, color }) => (
            <div key={val} style={{ padding: '8px 12px', borderRadius: 10, background: `${color}0d`, border: `1px solid ${color}30` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color, fontFamily: 'monospace' }}>{val}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MatrixOperationsLabView() {
  const [activeLab, setActiveLab] = useState<string>(MATRIX_OPS_LABS[0].id);
  const lab = MATRIX_OPS_LABS.find(item => item.id === activeLab) ?? MATRIX_OPS_LABS[0];

  return (
    <LabShell
      title="Лаборатории: Операции с матрицами"
      intro="Восемь стендов для прокачки матричной интуиции: от линейных преобразований и сложения до умножения, обратной и определителя."
      labs={MATRIX_OPS_LABS}
      activeId={activeLab}
      onSelect={setActiveLab}
    >
      {lab.id === 'mops-linear-transform' ? <LinearTransformLab />
        : lab.id === 'mops-add'       ? <MatrixAdditionLab />
        : lab.id === 'mops-scalar'    ? <ScalarMultiplyLab />
        : lab.id === 'mops-transpose' ? <TransposeLab />
        : lab.id === 'mops-mul'       ? <MatrixConveyorLab />
        : lab.id === 'mops-chain'     ? <MatrixChainLab />
        : lab.id === 'mops-inv'       ? <MatrixInverseUndoLab />
        : lab.id === 'mops-det'       ? <DeterminantAreaLab />
        : (() => {
            const l = lab as { title: string; question: string; mechanics: string[]; explore: string[]; insight: string; riddle?: string };
            return <LabBody title={l.title} question={l.question} mechanics={l.mechanics} explore={l.explore} riddle={l.riddle} insight={l.insight} />;
          })()
      }
    </LabShell>
  );
}
