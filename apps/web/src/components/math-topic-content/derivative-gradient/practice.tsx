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
          <div style={{ padding: '16px 20px', background: T.surface, borderRight: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Почему так</div>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.75, margin: 0 }}>{step.why}</p>
          </div>
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

export default function DerivativeGradientWorkedRich({ onGoTheory, onGoPractice }: { onGoTheory?: () => void; onGoPractice?: () => void }) {

  const examples = [

    // ── Пример 1: производная многочлена ─────────────────────────────────────
    {
      id: 'dg-w1',
      title: 'Производная многочлена — степенное правило',
      level: 'базовый',
      timeMin: 4,
      given: (
        <div>
          <F tex="f(x) = 4x^5 - 3x^3 + 2x^2 - 7x + 10" />
        </div>
      ),
      find: <span>Производная <M tex="f'(x)" /></span>,
      answer: <span><M tex="f'(x) = 20x^4 - 9x^2 + 4x - 7" /></span>,
      checkpoint: 'Производная многочлена находится почленно: степень «падает» множителем, показатель уменьшается на единицу, константа исчезает. Проверка: f′(1) = 20 − 9 + 4 − 7 = 8 означает, что вблизи x = 1 функция растёт со скоростью ~8 единиц на единицу x.',
      steps: [
        {
          what: 'Дифференцируем 4x⁵',
          why: 'Правило степенной функции: (xⁿ)′ = nxⁿ⁻¹. Константный множитель выносится. Степень 5 «падает» вниз, показатель уменьшается до 4.',
          formula: (
            <div>
              <F tex="(4x^5)' = 4 \cdot 5x^{5-1} = 20x^4" />
            </div>
          ),
        },
        {
          what: 'Дифференцируем −3x³',
          why: 'Та же логика. Знак минус перед коэффициентом сохраняется — его нельзя потерять.',
          formula: (
            <div>
              <F tex="(-3x^3)' = -3 \cdot 3x^2 = -9x^2" />
            </div>
          ),
        },
        {
          what: 'Дифференцируем 2x² и −7x',
          why: 'Для 2x²: степень 2 падает, показатель становится 1, x¹ = x. Для −7x: (x)′ = 1·x⁰ = 1, поэтому результат −7.',
          formula: (
            <div>
              <F tex="(2x^2)' = 4x \qquad (-7x)' = -7" />
            </div>
          ),
        },
        {
          what: 'Дифференцируем константу 10',
          why: 'Производная любой константы равна нулю: функция f(x) = c не меняется, угловой коэффициент касательной — 0.',
          formula: (
            <div>
              <F tex="(10)' = 0" />
            </div>
          ),
        },
        {
          what: 'Собираем все слагаемые',
          why: 'Правило суммы: производная суммы равна сумме производных. Суммируем результаты каждого шага.',
          formula: (
            <div>
              <FBox
                tex="f'(x) = 20x^4 - 9x^2 + 4x - 7"
                hint="Проверка: f′(1) = 20 − 9 + 4 − 7 = 8"
              />
            </div>
          ),
        },
      ],
    },

    // ── Пример 2: уравнение касательной ──────────────────────────────────────
    {
      id: 'dg-w2',
      title: 'Уравнение касательной к графику',
      level: 'базовый',
      timeMin: 5,
      given: (
        <div>
          <F tex="f(x) = x^2 + 3x, \quad x_0 = 2" />
        </div>
      ),
      find: <span>Уравнение касательной в точке <M tex="x_0 = 2" /></span>,
      answer: <span><M tex="y = 7x - 4" /></span>,
      checkpoint: 'Касательная — прямая. Чтобы её задать, нужны точка (x₀, f(x₀)) и угловой коэффициент f′(x₀). Формула: y = f(x₀) + f′(x₀)(x − x₀). Геометрически: если «зумить» график в точке касания, функция и касательная сливаются — касательная есть лучшее линейное приближение функции.',
      steps: [
        {
          what: 'Находим производную f′(x)',
          why: '(x²)′ = 2x по степенному правилу. (3x)′ = 3. Сначала находим производную в общем виде — и только потом подставляем x₀.',
          formula: (
            <div>
              <F tex="f'(x) = 2x + 3" />
            </div>
          ),
        },
        {
          what: 'Вычисляем f(2) — точку касания',
          why: 'Нам нужна координата y точки, через которую проходит касательная.',
          formula: (
            <div>
              <F tex="f(2) = 2^2 + 3 \cdot 2 = 4 + 6 = 10" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Точка касания: <M tex="(2,\,10)" /></p>
            </div>
          ),
        },
        {
          what: 'Вычисляем f′(2) — угловой коэффициент',
          why: 'Производная в точке — это наклон касательной. Именно это число показывает, насколько круто прямая поднимается.',
          formula: (
            <div>
              <F tex="f'(2) = 2 \cdot 2 + 3 = 7" />
            </div>
          ),
        },
        {
          what: 'Подставляем в уравнение касательной',
          why: 'Стандартная форма уравнения касательной: y = f(x₀) + f′(x₀)(x − x₀). Раскрываем скобки и приводим к виду y = kx + b.',
          formula: (
            <div>
              <F tex="y = 10 + 7(x - 2) = 10 + 7x - 14" />
              <FBox tex="y = 7x - 4" hint="Вблизи точки (2, 10) парабола и прямая неразличимы" />
            </div>
          ),
        },
      ],
    },

    // ── Пример 3: экстремумы функции ─────────────────────────────────────────
    {
      id: 'dg-w3',
      title: 'Экстремумы функции: максимум и минимум',
      level: 'стандартный',
      timeMin: 10,
      given: (
        <div>
          <F tex="f(x) = x^3 - 6x^2 + 9x + 1" />
        </div>
      ),
      find: <span>Точки экстремума и их характер</span>,
      answer: (
        <div style={{ lineHeight: 2 }}>
          <div>Максимум: <M tex="(1,\,5)" /></div>
          <div>Минимум: <M tex="(3,\,1)" /></div>
        </div>
      ),
      checkpoint: 'f′(x) = 0 — необходимое условие экстремума, но не достаточное. Нужна проверка: знак f″ в критической точке (f″ < 0 → максимум-«холм», f″ > 0 → минимум-«яма») или смена знака f′ слева и справа от точки.',
      steps: [
        {
          what: 'Находим f′(x) и приравниваем к нулю',
          why: 'Экстремумы могут быть только в критических точках — где производная равна нулю (или не существует). Выносим 3 за скобки, чтобы упростить квадратное уравнение.',
          formula: (
            <div>
              <F tex="f'(x) = 3x^2 - 12x + 9 = 3(x^2 - 4x + 3) = 0" />
              <F tex="(x-1)(x-3) = 0 \;\Rightarrow\; x = 1,\; x = 3" />
            </div>
          ),
        },
        {
          what: 'Находим f″(x) — вторую производную',
          why: 'Вторая производная покажет знак кривизны в критических точках: отрицательная → выпуклость вверх (холм), положительная → выпуклость вниз (яма).',
          formula: (
            <div>
              <F tex="f''(x) = 6x - 12" />
            </div>
          ),
        },
        {
          what: 'Проверяем x = 1: знак f″',
          why: 'f″(1) < 0 означает, что в точке x = 1 функция выпукла вверх — это максимум. Вычисляем значение функции, чтобы получить координату y.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Второй признак:</p>
              <F tex="f''(1) = 6 - 12 = -6 < 0 \;\Rightarrow\; \text{максимум}" />
              <F tex="f(1) = 1 - 6 + 9 + 1 = 5" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Точка максимума: <M tex="(1,\,5)" /></p>
            </div>
          ),
        },
        {
          what: 'Проверяем x = 3: знак f″',
          why: 'f″(3) > 0 означает, что в точке x = 3 функция выпукла вниз — это минимум.',
          formula: (
            <div>
              <F tex="f''(3) = 18 - 12 = 6 > 0 \;\Rightarrow\; \text{минимум}" />
              <F tex="f(3) = 27 - 54 + 27 + 1 = 1" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Точка минимума: <M tex="(3,\,1)" /></p>
            </div>
          ),
        },
        {
          what: 'Подтверждаем первым признаком: смена знака f′',
          why: 'Первый признак надёжнее в пограничных случаях. Смотрим знак производной на трёх интервалах.',
          formula: (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ background: T.greenLight, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 2 }}>x &lt; 1</div>
                  <M tex="f'(0) = 9 > 0" />
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>↗ растёт</div>
                </div>
                <div style={{ background: T.redLight, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 2 }}>1 &lt; x &lt; 3</div>
                  <M tex="f'(2) = -3 < 0" />
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>↘ убывает</div>
                </div>
                <div style={{ background: T.greenLight, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 2 }}>x &gt; 3</div>
                  <M tex="f'(4) = 9 > 0" />
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>↗ растёт</div>
                </div>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: T.muted }}>
                В x = 1: «+» → «−» — максимум. В x = 3: «−» → «+» — минимум. Совпадает.
              </p>
            </div>
          ),
        },
      ],
    },

    // ── Пример 4: перегиб и полное исследование ───────────────────────────────
    {
      id: 'dg-w4',
      title: 'Точка перегиба и интервалы выпуклости',
      level: 'стандартный',
      timeMin: 12,
      given: (
        <div>
          <F tex="f(x) = x^3 - 3x^2" />
        </div>
      ),
      find: (
        <span>
          Критические точки, экстремумы, точка перегиба, интервалы выпуклости
        </span>
      ),
      answer: (
        <div style={{ lineHeight: 2, fontSize: 13 }}>
          <div>Максимум: <M tex="(0,\,0)" />, минимум: <M tex="(2,\,-4)" /></div>
          <div>Перегиб: <M tex="(1,\,-2)" /></div>
          <div>Выпукла вверх на <M tex="(-\infty,1)" />, вниз на <M tex="(1,+\infty)" /></div>
        </div>
      ),
      checkpoint: 'Полное исследование — два прохода. Первый: f′ → критические точки → экстремумы. Второй: f″ → точки перегиба → интервалы выпуклости. В точке перегиба f′ ≠ 0, это не экстремум — функция там не останавливается, только меняет кривизну.',
      steps: [
        {
          what: 'Первая производная: критические точки',
          why: 'Выносим 3x за скобку — видим два множителя, сразу находим корни без квадратного уравнения.',
          formula: (
            <div>
              <F tex="f'(x) = 3x^2 - 6x = 3x(x-2) = 0" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Критические точки: <M tex="x = 0" /> и <M tex="x = 2" /></p>
            </div>
          ),
        },
        {
          what: 'Вторая производная: общий вид',
          why: 'Вычисляем f″ один раз — он нужен и для проверки экстремумов (шаги 3–4), и для поиска перегиба (шаги 5–6).',
          formula: (
            <div>
              <F tex="f''(x) = 6x - 6 = 6(x - 1)" />
            </div>
          ),
        },
        {
          what: 'Характер критических точек через f″',
          why: 'Подставляем x = 0 и x = 2 во вторую производную. Знак определяет тип экстремума: минус → холм (максимум), плюс → яма (минимум).',
          formula: (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: T.amberLight, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', marginBottom: 4 }}>x = 0</div>
                  <M tex="f''(0) = -6 < 0" />
                  <p style={{ margin: '4px 0 0', fontSize: 12 }}>→ максимум, <M tex="f(0) = 0" /></p>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>x = 2</div>
                  <M tex="f''(2) = 6 > 0" />
                  <p style={{ margin: '4px 0 0', fontSize: 12 }}>→ минимум, <M tex="f(2) = -4" /></p>
                </div>
              </div>
            </div>
          ),
        },
        {
          what: 'Ищем точку перегиба: f″(x) = 0',
          why: 'Точка перегиба — где вторая производная меняет знак. Сначала находим кандидата: f″ = 0.',
          formula: (
            <div>
              <F tex="6(x-1) = 0 \;\Rightarrow\; x = 1" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                Проверяем смену знака: <M tex="f''(0) = -6 < 0" /> (слева), <M tex="f''(2) = 6 > 0" /> (справа). Знак меняется — перегиб подтверждён.
              </p>
            </div>
          ),
        },
        {
          what: 'Значение в точке перегиба и итог',
          why: 'f′(1) = 3 − 6 = −3 ≠ 0 подтверждает: в перегибе функция не останавливается, это не экстремум. Собираем полный ответ.',
          formula: (
            <div>
              <F tex="f(1) = 1 - 3 = -2" />
              <FBox
                tex="\text{Перегиб: } (1,\,-2)"
                hint="Выпукла вверх ∩ на (−∞, 1), выпукла вниз ∪ на (1, +∞)"
              />
            </div>
          ),
        },
      ],
    },

    // ── Пример 5: цепное правило ──────────────────────────────────────────────
    {
      id: 'dg-w5',
      title: 'Сложная функция и цепное правило',
      level: 'продвинутый',
      timeMin: 12,
      given: (
        <div>
          <F tex="f(x) = \ln\bigl(\cos(x^2 + 1)\bigr)" />
        </div>
      ),
      find: (
        <span>
          Производная <M tex="f'(x)" /> и значение <M tex="f'(0)" />
        </span>
      ),
      answer: (
        <div style={{ lineHeight: 2 }}>
          <div><M tex="f'(x) = -2x\tan(x^2+1)" /></div>
          <div><M tex="f'(0) = 0" /></div>
        </div>
      ),
      checkpoint: 'Цепное правило: производная композиции = произведение производных всех слоёв, от внешнего к внутреннему. Это математический аналог backpropagation в нейросетях — градиент «распутывается» снаружи внутрь, слой за слоем.',
      steps: [
        {
          what: 'Определяем слои композиции',
          why: 'Цепное правило применяется снаружи внутрь. Определяем три вложенных функции и записываем формулу для каждой производной отдельно.',
          formula: (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 4 }}>Внешняя</div>
                  <M tex="\ln u" />
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>→ <M tex="1/u" /></div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>Средняя</div>
                  <M tex="\cos t" />
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>→ <M tex="-\sin t" /></div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>Внутренняя</div>
                  <M tex="x^2 + 1" />
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>→ <M tex="2x" /></div>
                </div>
              </div>
            </div>
          ),
        },
        {
          what: 'Перемножаем производные всех слоёв',
          why: 'Цепное правило: f′ = (производная внешней) · (производная средней) · (производная внутренней). Перемножаем три результата из предыдущего шага.',
          formula: (
            <div>
              <F tex="f'(x) = \frac{1}{\cos(x^2+1)} \cdot \bigl(-\sin(x^2+1)\bigr) \cdot 2x" />
            </div>
          ),
        },
        {
          what: 'Упрощаем: sin/cos = tan',
          why: 'Собираем числители и знаменатели. Отношение sin/cos — это тангенс. Знак минус выносим вперёд.',
          formula: (
            <div>
              <F tex="f'(x) = -2x \cdot \frac{\sin(x^2+1)}{\cos(x^2+1)}" />
              <FBox
                tex="f'(x) = -2x\tan(x^2+1)"
                hint="Не забыть минус из производной косинуса: (cos t)′ = −sin t"
              />
            </div>
          ),
        },
        {
          what: 'Вычисляем f′(0)',
          why: 'Подставляем x = 0. Множитель 2x обращается в 0 — произведение равно нулю независимо от значения тангенса. Касательная горизонтальна.',
          formula: (
            <div>
              <F tex="f'(0) = -2 \cdot 0 \cdot \tan(0^2+1) = 0 \cdot \tan 1 = 0" />
              <div style={{ background: T.greenLight, borderRadius: 10, padding: '10px 14px', marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 4 }}>Геометрический смысл</div>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>
                  В точке x = 0 касательная горизонтальна. <M tex="f(0) = \ln(\cos 1) \approx -0.62" /> — возможный экстремум.
                </p>
              </div>
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
