// @ts-nocheck
import { useState } from 'react';
import {
  ChevronDown, ChevronUp, ChevronsDown, ChevronsUp,
  Eye, EyeOff, Lightbulb, ArrowRight, PenTool,
  BarChart3, Clock, Play, Link2,
} from 'lucide-react';
import { MarkdownRenderer } from '../../MarkdownRenderer';

// ─── Цвета ────────────────────────────────────────────────────────────────────
const T = {
  text: '#1e293b', muted: '#64748b', mutedLight: '#94a3b8',
  primary: '#6366f1', primaryLight: '#eef2ff', primaryBorder: '#c7d2fe', primaryDark: '#4f46e5',
  accent: '#7c3aed',
  green: '#10b981', greenLight: '#d1fae5',
  amber: '#f59e0b', amberLight: '#fef3c7',
  red: '#ef4444', redLight: '#fee2e2',
  white: '#ffffff', surface: '#f8fafc', border: '#e2e8f0',
  cyan: '#06b6d4',
};

const LEVEL_STYLE = {
  'базовый':     { bg: '#ecfdf5', color: '#065f46', label: 'Базовый' },
  'стандартный': { bg: '#eef2ff', color: '#4338ca', label: 'Средний' },
  'продвинутый': { bg: '#f5f3ff', color: '#5b21b6', label: 'Сложный' },
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

function FBox({ tex, hint }: { tex: string; hint?: string }) {
  return (
    <div style={{ background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 12, padding: '14px 18px', margin: '8px 0', textAlign: 'center' }}>
      <MarkdownRenderer content={`$$${tex}$$`} />
      {hint && <div style={{ fontSize: 12, color: T.accent, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

// ─── Шаг разбора ─────────────────────────────────────────────────────────────

function StepCard({ step, idx, total, expanded, onToggle, expandedAll }: any) {
  const open = expandedAll || expanded;
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${T.border}`, background: T.white, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: T.primary, color: T.white, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
          {idx < total - 1 && <div style={{ width: 1, flexGrow: 1, minHeight: 8, background: T.border, marginTop: 4 }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.mutedLight, textTransform: 'uppercase', marginBottom: 3 }}>Шаг {idx + 1} из {total}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.5 }}>{step.what}</div>
        </div>
        {open
          ? <ChevronUp size={16} color={T.mutedLight} style={{ marginTop: 6, flexShrink: 0 }} />
          : <ChevronDown size={16} color={T.mutedLight} style={{ marginTop: 6, flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${T.border}` }}>
          {/* Левая колонка: объяснение */}
          <div style={{ padding: '16px 20px', background: T.surface, borderRight: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Почему так</div>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.75, margin: 0 }}>{step.why}</p>
          </div>
          {/* Правая колонка: формула */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Запись</div>
            <div style={{ fontSize: 13 }}>{step.formula}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Блок "Дано / Найти / Ответ" ─────────────────────────────────────────────

function GivenFind({ given, find, answer, hidden }: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, margin: '0 0 18px' }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Дано</div>
        <div style={{ fontSize: 14, color: T.text, lineHeight: 1.7 }}>{given}</div>
      </div>
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Найти</div>
        <div style={{ fontSize: 14, color: T.text, lineHeight: 1.7 }}>{find}</div>
        {!hidden && answer && (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.green, textTransform: 'uppercase', marginTop: 12, marginBottom: 8 }}>Ответ</div>
            <div style={{ fontSize: 14, color: T.text }}>{answer}</div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Видео-плейсхолдер ────────────────────────────────────────────────────────

function VideoPlaceholder({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div style={{ borderRadius: 16, background: '#0f172a', color: T.white, padding: '20px 24px', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#818cf8', textTransform: 'uppercase', marginBottom: 4 }}>Видео-плейсхолдер</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>«{title}»</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Здесь будет встроено видео из CMS курса.</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>Закрыть</button>
        </div>
      </div>
    );
  }
  return (
    <div
      onClick={() => setOpen(true)}
      style={{ borderRadius: 16, border: `2px dashed ${T.border}`, background: `${T.primary}04`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', marginBottom: 20 }}
    >
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: T.white, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Play size={16} color={T.primary} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Видео-разбор</div>
        <div style={{ fontSize: 12, color: T.muted }}>Анимация решения · ~2 мин</div>
      </div>
      <ArrowRight size={14} color={T.mutedLight} />
    </div>
  );
}

// ─── Карточка одного разбора ──────────────────────────────────────────────────

function WorkedCard({ ex, index, onGoTheory }: any) {
  const [hidden, setHidden] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });

  function toggle(i: number) { setExpanded(s => ({ ...s, [i]: !s[i] })); }

  const lvl = LEVEL_STYLE[ex.level] ?? LEVEL_STYLE['стандартный'];

  return (
    <article style={{ background: T.white, borderRadius: 24, border: `1px solid ${T.border}`, padding: '28px 32px' }}>
      {/* Шапка */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.mutedLight, textTransform: 'uppercase' }}>Разбор {index + 1}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: lvl.color, background: lvl.bg, padding: '2px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <BarChart3 size={9} /> {lvl.label}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, background: T.surface, padding: '2px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={9} /> ≈{ex.timeMin} мин
            </span>
            <button
              onClick={onGoTheory}
              style={{ fontSize: 11, fontWeight: 700, color: T.primary, background: T.primaryLight, border: 'none', padding: '2px 10px', borderRadius: 20, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Link2 size={9} /> К теории
            </button>
          </div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: T.text, lineHeight: 1.3 }}>{ex.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => { setHidden(h => !h); setAllOpen(false); }}
            style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 12, border: `1px solid ${hidden ? '#fde68a' : T.border}`, background: hidden ? T.amberLight : T.white, color: hidden ? '#92400e' : T.muted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
            {hidden ? 'Решаю сам' : 'Скрыть'}
          </button>
          {!hidden && (
            <button
              onClick={() => setAllOpen(v => !v)}
              style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.white, color: T.muted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {allOpen ? <ChevronsUp size={12} /> : <ChevronsDown size={12} />}
              {allOpen ? 'Свернуть' : 'Все шаги'}
            </button>
          )}
        </div>
      </div>

      {/* Дано / Найти / Ответ */}
      <GivenFind given={ex.given} find={ex.find} answer={ex.answer} hidden={hidden} />

      {/* Видео */}
      <VideoPlaceholder title={ex.title} />

      {/* Шаги */}
      {!hidden ? (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Решение пошагово</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ex.steps.map((s: any, i: number) => (
              <StepCard
                key={i}
                step={s}
                idx={i}
                total={ex.steps.length}
                expanded={!!expanded[i]}
                onToggle={() => toggle(i)}
                expandedAll={allOpen}
              />
            ))}
          </div>
          {ex.checkpoint && (
            <div style={{ marginTop: 14, borderRadius: 14, background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, padding: '14px 18px', display: 'flex', gap: 10 }}>
              <Lightbulb size={15} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.primaryDark, textTransform: 'uppercase', marginBottom: 4 }}>Чек-поинт</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{ex.checkpoint}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ borderRadius: 14, background: T.amberLight, border: `1px solid #fde68a`, padding: '14px 18px', fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>
          Попробуй решить самостоятельно. Когда будешь готов — выключи «Скрыть», чтобы сверить решение.
        </div>
      )}
    </article>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function LimitsContinuityWorkedRich({ onGoTheory, onGoPractice }: { onGoTheory?: () => void; onGoPractice?: () => void }) {

  const examples = [

    // ── Пример 1: предел многочлена — прямая подстановка ─────────────────────
    {
      id: 'lc-w1',
      title: 'Предел многочлена — прямая подстановка',
      level: 'базовый',
      timeMin: 3,
      given: (
        <div>
          <F tex="f(x) = x^3 - 4x^2 + 3x - 1" />
        </div>
      ),
      find: (
        <span>
          <M tex="\lim_{x \to 2}(x^3 - 4x^2 + 3x - 1)" />
        </span>
      ),
      answer: <span><M tex="-3" /></span>,
      checkpoint: 'Многочлены непрерывны всюду. Если функция непрерывна в точке, предел равен значению функции в этой точке. Вся «драма» с пределами начинается только когда прямая подстановка даёт неопределённость вида 0/0, ∞/∞ и т.п.',
      steps: [
        {
          what: 'Проверяем тип функции',
          why: 'Многочлены (полиномы) определены при всех x и непрерывны на всей числовой прямой. Никаких делений на ноль, корней из отрицательных — ничего опасного. Прямая подстановка законна.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>Степень 3, непрерывна на <M tex="\mathbb{R}" /></p>
              <FBox tex="f \text{ — многочлен} \Rightarrow \lim_{x \to a} f(x) = f(a)" />
            </div>
          ),
        },
        {
          what: 'Подставляем x = 2 напрямую',
          why: 'Для непрерывной функции предел в точке равен её значению в этой точке. Разбиваем на простые арифметические действия, следя за знаками.',
          formula: (
            <div>
              <F tex="2^3 - 4 \cdot 2^2 + 3 \cdot 2 - 1" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                <M tex="= 8 - 16 + 6 - 1" />
              </p>
            </div>
          ),
        },
        {
          what: 'Вычисляем последовательно слева направо',
          why: 'Сложение и вычитание равноправны и выполняются слева направо. Частая ошибка — расставить лишние скобки и изменить знак.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: T.text }}>
                <M tex="8 - 16 = -8" />, затем <M tex="-8 + 6 = -2" />, затем <M tex="-2 - 1 = -3" />
              </p>
              <FBox tex="\lim_{x \to 2}(x^3 - 4x^2 + 3x - 1) = -3" />
            </div>
          ),
        },
      ],
    },

    // ── Пример 2: предел дроби с неопределённостью 0/0 ───────────────────────
    {
      id: 'lc-w2',
      title: 'Предел дроби с неопределённостью 0/0',
      level: 'базовый',
      timeMin: 5,
      given: (
        <div>
          <F tex="\frac{x^2 - 9}{x^2 - 3x}" />
        </div>
      ),
      find: (
        <span>
          <M tex="\lim_{x \to 3} \dfrac{x^2 - 9}{x^2 - 3x}" />
        </span>
      ),
      answer: <span><M tex="2" /></span>,
      checkpoint: 'Прямая подстановка даёт 0/0 — сигнал: в числителе и знаменателе есть общий множитель, который создаёт «дырку». После сокращения функция становится непрерывной в этой точке — подставляем и получаем предел. Это устранимый разрыв.',
      steps: [
        {
          what: 'Пробуем прямую подстановку x = 3',
          why: 'Всегда начинаем с прямой подстановки. Если получаем неопределённость — ищем общий множитель.',
          formula: (
            <div>
              <F tex="\frac{9 - 9}{9 - 9} = \frac{0}{0}" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Неопределённость — нужно раскладывать на множители.</p>
            </div>
          ),
        },
        {
          what: 'Раскладываем числитель и знаменатель',
          why: 'Числитель: разность квадратов, a² − b² = (a−b)(a+b). Знаменатель: выносим общий множитель x. После разложения виден общий множитель (x−3).',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Числитель:</p>
              <F tex="x^2 - 9 = (x-3)(x+3)" />
              <p style={{ margin: '4px 0 4px', fontSize: 12, color: T.muted }}>Знаменатель:</p>
              <F tex="x^2 - 3x = x(x-3)" />
            </div>
          ),
        },
        {
          what: 'Сокращаем общий множитель (x − 3)',
          why: 'Сокращение законно для всех x ≠ 3. Именно при x = 3 была проблема — мы её «убираем». Функция и упрощённое выражение совпадают всюду, кроме x = 3.',
          formula: (
            <div>
              <F tex="\frac{(x-3)(x+3)}{x(x-3)} = \frac{x+3}{x}, \quad x \neq 3" />
            </div>
          ),
        },
        {
          what: 'Подставляем x = 3 в упрощённое выражение',
          why: 'Теперь знаменатель не ноль — подстановка безопасна. Сокращение убрало именно тот ноль, который мешал.',
          formula: (
            <div>
              <F tex="\frac{3 + 3}{3} = \frac{6}{3} = 2" />
              <FBox tex="\lim_{x \to 3} \frac{x^2 - 9}{x^2 - 3x} = 2" hint="Геометрически: дырка в точке (3, 2) — устранимый разрыв" />
            </div>
          ),
        },
      ],
    },

    // ── Пример 3: кусочная функция и непрерывность ────────────────────────────
    {
      id: 'lc-w3',
      title: 'Кусочная функция: исследование непрерывности',
      level: 'стандартный',
      timeMin: 10,
      given: (
        <div>
          <F tex="f(x) = \begin{cases} x^2+1, & x < 0 \\ 2, & x = 0 \\ e^x, & 0 < x < 2 \\ 3x-2, & x \geq 2 \end{cases}" />
        </div>
      ),
      find: <span>Исследовать непрерывность в точках <M tex="x = 0" /> и <M tex="x = 2" /></span>,
      answer: (
        <div style={{ lineHeight: 2 }}>
          <div><M tex="x=0" />: устранимый разрыв</div>
          <div><M tex="x=2" />: скачок (разрыв 1-го рода)</div>
        </div>
      ),
      checkpoint: 'Три условия непрерывности в точке a: (1) f(a) определено, (2) предел существует, (3) предел = f(a). На интервалах между точками стыка элементарные функции непрерывны автоматически — проверять нужно только точки стыка.',
      steps: [
        {
          what: 'Точка x = 0: значение функции',
          why: 'По условию при x = 0 функция явно задана как f(0) = 2. Первое условие непрерывности выполнено.',
          formula: (
            <div>
              <F tex="f(0) = 2" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Берётся из строки «x = 0» определения, а не из соседних формул.</p>
            </div>
          ),
        },
        {
          what: 'Точка x = 0: односторонние пределы',
          why: 'Слева от 0 действует формула x² + 1, справа — eˣ. Вычисляем оба предела и сравниваем.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Предел слева (ветка x² + 1):</p>
              <F tex="\lim_{x \to 0^-} f(x) = 0^2 + 1 = 1" />
              <p style={{ margin: '4px 0 4px', fontSize: 12, color: T.muted }}>Предел справа (ветка eˣ):</p>
              <F tex="\lim_{x \to 0^+} f(x) = e^0 = 1" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Оба равны 1 → двусторонний предел существует и равен 1.</p>
            </div>
          ),
        },
        {
          what: 'Точка x = 0: вывод о разрыве',
          why: 'Предел (= 1) существует, но не совпадает со значением функции f(0) = 2. Нарушено третье условие непрерывности. Оба односторонних предела конечны и равны → разрыв первого рода.',
          formula: (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: T.redLight, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 4 }}>Нарушение</div>
                  <p style={{ margin: 0, fontSize: 13, color: T.text }}><M tex="\lim = 1 \neq 2 = f(0)" /></p>
                </div>
                <div style={{ background: T.amberLight, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', marginBottom: 4 }}>Тип разрыва</div>
                  <p style={{ margin: 0, fontSize: 13, color: T.text }}>Устранимый. Если задать f(0) = 1, разрыв исчезнет.</p>
                </div>
              </div>
            </div>
          ),
        },
        {
          what: 'Точка x = 2: значение и односторонние пределы',
          why: 'При x ≥ 2 действует ветка 3x − 2, поэтому f(2) = 4. Слева от 2 (но до 2) действует eˣ, справа — та же ветка 3x − 2.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Значение:</p>
              <F tex="f(2) = 3 \cdot 2 - 2 = 4" />
              <p style={{ margin: '4px 0 4px', fontSize: 12, color: T.muted }}>Предел слева (ветка eˣ):</p>
              <F tex="\lim_{x \to 2^-} f(x) = e^2 \approx 7{,}39" />
              <p style={{ margin: '4px 0 4px', fontSize: 12, color: T.muted }}>Предел справа (ветка 3x − 2):</p>
              <F tex="\lim_{x \to 2^+} f(x) = 3 \cdot 2 - 2 = 4" />
            </div>
          ),
        },
        {
          what: 'Точка x = 2: вывод о разрыве',
          why: 'Левый и правый пределы разные (e² ≠ 4) → двусторонний предел не существует. Оба односторонних конечны → разрыв первого рода, скачок. Устранить его нельзя.',
          formula: (
            <div>
              <div style={{ background: T.redLight, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 4 }}>Скачок</div>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>
                  <M tex="e^2 \approx 7{,}39 \neq 4" /> → предел не существует
                </p>
              </div>
              <FBox
                tex="\text{Величина скачка: } e^2 - 4 \approx 3{,}39"
                hint="Разрыв первого рода, неустранимый (скачок)"
              />
            </div>
          ),
        },
      ],
    },

    // ── Пример 4: предел с корнем — сопряжённое выражение ────────────────────
    {
      id: 'lc-w4',
      title: 'Предел с корнем — умножение на сопряжённое',
      level: 'стандартный',
      timeMin: 8,
      given: (
        <div>
          <F tex="\frac{\sqrt{x+3} - 2}{x - 1}" />
        </div>
      ),
      find: (
        <span>
          <M tex="\lim_{x \to 1} \dfrac{\sqrt{x+3} - 2}{x - 1}" />
        </span>
      ),
      answer: <span><M tex="\dfrac{1}{4}" /></span>,
      checkpoint: 'Прямая подстановка даёт 0/0, но раскложить на множители мешает корень. Стандартный приём: умножить на сопряжённое выражение. Разность квадратов убирает корень, после чего появляется общий множитель для сокращения. Геометрически этот предел — производная функции √(x+3) в точке x = 1.',
      steps: [
        {
          what: 'Пробуем прямую подстановку x = 1',
          why: 'Всегда начинаем с прямой подстановки. Неопределённость 0/0 при наличии корня — сигнал к умножению на сопряжённое.',
          formula: (
            <div>
              <F tex="\frac{\sqrt{1+3} - 2}{1 - 1} = \frac{2 - 2}{0} = \frac{0}{0}" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Нужно устранить корень в числителе.</p>
            </div>
          ),
        },
        {
          what: 'Умножаем числитель и знаменатель на сопряжённое',
          why: 'Сопряжённое к (√(x+3) − 2) — то же выражение, но с плюсом: (√(x+3) + 2). Их произведение даёт разность квадратов: (√a − b)(√a + b) = a − b². Умножение на сопряжённое/сопряжённое = умножение на 1.',
          formula: (
            <div>
              <F tex="\frac{\sqrt{x+3} - 2}{x-1} \cdot \frac{\sqrt{x+3}+2}{\sqrt{x+3}+2}" />
            </div>
          ),
        },
        {
          what: 'Раскрываем числитель через разность квадратов',
          why: 'Корень исчез! Числитель стал просто (x + 3) − 4 = x − 1 — тот самый множитель, что стоит в знаменателе.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Числитель:</p>
              <F tex="(\sqrt{x+3})^2 - 2^2 = (x+3) - 4 = x - 1" />
              <p style={{ margin: '4px 0 4px', fontSize: 12, color: T.muted }}>Получаем:</p>
              <F tex="\frac{x-1}{(x-1)(\sqrt{x+3}+2)}" />
            </div>
          ),
        },
        {
          what: 'Сокращаем (x − 1) и подставляем x = 1',
          why: 'Сокращение законно при x ≠ 1. Теперь подстановка безопасна.',
          formula: (
            <div>
              <F tex="\frac{1}{\sqrt{x+3}+2} \;\xrightarrow{x=1}\; \frac{1}{\sqrt{4}+2} = \frac{1}{2+2} = \frac{1}{4}" />
              <FBox
                tex="\lim_{x \to 1} \frac{\sqrt{x+3}-2}{x-1} = \frac{1}{4}"
                hint="Это производная f(x) = √(x+3) в точке x = 1 — угловой коэф. касательной в (1, 2)"
              />
            </div>
          ),
        },
      ],
    },

    // ── Пример 5: замечательный предел + сопряжённое ─────────────────────────
    {
      id: 'lc-w5',
      title: 'Первый замечательный предел в комбинации с корнем',
      level: 'продвинутый',
      timeMin: 12,
      given: (
        <div>
          <F tex="\frac{\sin 3x}{\sqrt{x+4} - 2}" />
        </div>
      ),
      find: (
        <span>
          <M tex="\lim_{x \to 0} \dfrac{\sin 3x}{\sqrt{x+4}-2}" />
        </span>
      ),
      answer: <span><M tex="12" /></span>,
      checkpoint: 'Комбинированный предел: числитель требует первого замечательного предела (sin u / u → 1), знаменатель — умножения на сопряжённое. Разбираем числитель и знаменатель отдельно, затем используем теорему о пределе произведения.',
      steps: [
        {
          what: 'Пробуем прямую подстановку x = 0',
          why: 'sin 0 = 0 в числителе и √4 − 2 = 0 в знаменателе. Неопределённость 0/0 при одновременном участии синуса и корня — нужны два разных приёма.',
          formula: (
            <div>
              <F tex="\frac{\sin 0}{\sqrt{0+4}-2} = \frac{0}{2-2} = \frac{0}{0}" />
            </div>
          ),
        },
        {
          what: 'Убираем корень: умножаем на сопряжённое',
          why: 'Домножаем дробь на (√(x+4) + 2) / (√(x+4) + 2). Знаменатель превращается в x через разность квадратов.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Знаменатель после умножения:</p>
              <F tex="(\sqrt{x+4}-2)(\sqrt{x+4}+2) = (x+4) - 4 = x" />
              <p style={{ margin: '4px 0 4px', fontSize: 12, color: T.muted }}>Всё выражение:</p>
              <F tex="\lim_{x \to 0} \frac{\sin 3x \cdot (\sqrt{x+4}+2)}{x}" />
            </div>
          ),
        },
        {
          what: 'Разделяем предел на два множителя',
          why: 'Предел произведения равен произведению пределов, если оба существуют. Выделяем часть с sin 3x / x и часть с корнем.',
          formula: (
            <div>
              <F tex="\lim_{x \to 0} \frac{\sin 3x}{x} \cdot \lim_{x \to 0}(\sqrt{x+4}+2)" />
            </div>
          ),
        },
        {
          what: 'Первый множитель: применяем первый замечательный предел',
          why: 'Первый замечательный предел: sin u / u → 1 при u → 0. Здесь u = 3x, поэтому нужно привести sin 3x / x к виду 3 · (sin 3x / 3x).',
          formula: (
            <div>
              <F tex="\frac{\sin 3x}{x} = 3 \cdot \frac{\sin 3x}{3x} \;\xrightarrow{x \to 0}\; 3 \cdot 1 = 3" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                Если написать sin 3x / x = (1/3) · (sin 3x)/(x/3) — это ошибка: нужно именно 3x в знаменателе.
              </p>
            </div>
          ),
        },
        {
          what: 'Второй множитель и итог',
          why: 'Выражение √(x+4) + 2 непрерывно в x = 0, поэтому подставляем напрямую. Перемножаем два предела.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Второй множитель:</p>
              <F tex="\lim_{x \to 0}(\sqrt{x+4}+2) = \sqrt{4}+2 = 4" />
              <p style={{ margin: '4px 0 4px', fontSize: 12, color: T.muted }}>Итог:</p>
              <FBox
                tex="\lim_{x \to 0} \frac{\sin 3x}{\sqrt{x+4}-2} = 3 \cdot 4 = 12"
                hint="Альтернатива: эквивалентность sin 3x ~ 3x и √(x+4) − 2 ~ x/4 при x → 0 даёт тот же ответ"
              />
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>

      {/* Вводный блок */}
      <div style={{ background: T.white, borderRadius: 24, border: `1px solid ${T.border}`, padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 16, background: T.primaryLight, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PenTool size={20} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: T.text }}>Разбор задач</h2>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
              Каждый разбор: <strong>Дано → Найти → Ответ</strong> и пошаговое решение. Слева — <em>почему так</em>, справа — <em>запись формулой</em>. Кнопка «Скрыть» переводит в режим самостоятельного решения.
            </p>
          </div>
        </div>
      </div>

      {/* Разборы */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {examples.map((ex, i) => (
          <WorkedCard key={ex.id} ex={ex} index={i} onGoTheory={onGoTheory ?? (() => {})} />
        ))}
      </div>

      {/* CTA к практике */}
      <div style={{ marginTop: 28, borderRadius: 24, background: '#0f172a', color: T.white, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#34d399', textTransform: 'uppercase', marginBottom: 6 }}>Разборы пройдены</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Готов решать сам? Открой тренажёр.</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Задачи с проверкой и подсказками ИИ-ментора.</div>
        </div>
        <button
          onClick={onGoPractice ?? (() => {})}
          style={{ background: T.white, color: '#0f172a', padding: '12px 24px', borderRadius: 16, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          К практике <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
