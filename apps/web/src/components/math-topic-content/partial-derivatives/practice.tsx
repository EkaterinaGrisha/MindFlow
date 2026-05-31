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

export default function PartialDerivativesWorkedRich({ onGoTheory, onGoPractice }: { onGoTheory?: () => void; onGoPractice?: () => void }) {

  const examples = [

    // ── Пример 1: нахождение частных производных ─────────────────────────────
    {
      id: 'pd-w1',
      title: 'Нахождение частных производных',
      level: 'базовый',
      timeMin: 5,
      given: (
        <div>
          <F tex="f(x,y) = 3x^4y^2 - 2xy^3 + 5y - 7" />
        </div>
      ),
      find: (
        <span>
          Частные производные <M tex="\dfrac{\partial f}{\partial x}" /> и <M tex="\dfrac{\partial f}{\partial y}" />
        </span>
      ),
      answer: (
        <div style={{ lineHeight: 2 }}>
          <div><M tex="f_x = 12x^3y^2 - 2y^3" /></div>
          <div><M tex="f_y = 6x^4y - 6xy^2 + 5" /></div>
        </div>
      ),
      checkpoint: 'При дифференцировании по одной переменной все остальные переменные считаются константами. Ключевая ошибка — забыть, что (5y)′ по x равно 0 (а не 5): вся функция от другой переменной — это константа.',
      steps: [
        {
          what: 'Дифференцируем по x: фиксируем y как константу',
          why: 'Смысл ∂f/∂x — скорость изменения f при движении строго вдоль оси x. Все выражения с y не меняются, значит они — постоянные множители или нулевые слагаемые.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Правило: y и любая функция от y — константа по x.</p>
              <FBox tex="\frac{\partial}{\partial x}[\,c \cdot g(y)\,] = 0 \qquad \frac{\partial}{\partial x}[\,g(y) \cdot x^n\,] = g(y) \cdot nx^{n-1}" />
            </div>
          ),
        },
        {
          what: 'Считаем ∂f/∂x по слагаемым',
          why: '3x⁴y²: y² — постоянный множитель, дифференцируем x⁴. −2xy³: y³ — множитель, (x)′ = 1. 5y и −7 не содержат x → производная 0.',
          formula: (
            <div>
              <F tex="(3x^4y^2)_x' = 3 \cdot 4x^3 \cdot y^2 = 12x^3y^2" />
              <F tex="(-2xy^3)_x' = -2 \cdot 1 \cdot y^3 = -2y^3" />
              <F tex="(5y)_x' = 0, \quad (-7)_x' = 0" />
              <FBox tex="\frac{\partial f}{\partial x} = 12x^3y^2 - 2y^3" />
            </div>
          ),
        },
        {
          what: 'Дифференцируем по y: фиксируем x как константу',
          why: 'Теперь все степени x — константные множители. Роли переменных меняются.',
          formula: (
            <div>
              <F tex="(3x^4y^2)_y' = 3x^4 \cdot 2y = 6x^4y" />
              <F tex="(-2xy^3)_y' = -2x \cdot 3y^2 = -6xy^2" />
              <F tex="(5y)_y' = 5, \quad (-7)_y' = 0" />
              <FBox tex="\frac{\partial f}{\partial y} = 6x^4y - 6xy^2 + 5" />
            </div>
          ),
        },
      ],
    },

    // ── Пример 2: градиент и его значение в точке ────────────────────────────
    {
      id: 'pd-w2',
      title: 'Градиент и его значение в точке',
      level: 'базовый',
      timeMin: 6,
      given: (
        <div>
          <F tex="f(x,y) = \ln(x^2 + y^2)" />
        </div>
      ),
      find: (
        <span>
          а) <M tex="\nabla f" /> в общем виде, б) <M tex="\nabla f(1,1)" />, в) <M tex="\|\nabla f(1,1)\|" />
        </span>
      ),
      answer: (
        <div style={{ lineHeight: 2 }}>
          <div>а) <M tex="\nabla f = \dfrac{2}{x^2+y^2}(x,\,y)^\top" /></div>
          <div>б) <M tex="\nabla f(1,1) = (1,\,1)^\top" /></div>
          <div>в) <M tex="\|\nabla f(1,1)\| = \sqrt{2}" /></div>
        </div>
      ),
      checkpoint: 'Градиент — вектор частных производных: ∇f = (f_x, f_y)ᵀ. Он указывает направление наибыстрейшего роста функции, а его модуль — максимальную скорость роста. Для f = ln(x² + y²) градиент направлен от начала координат — логично, ведь функция растёт при удалении от нуля.',
      steps: [
        {
          what: 'Находим ∂f/∂x через цепное правило',
          why: '(ln u)′ = 1/u · u′. Здесь u = x² + y², его производная по x равна 2x (y² не содержит x → 0).',
          formula: (
            <div>
              <F tex="\frac{\partial f}{\partial x} = \frac{1}{x^2+y^2} \cdot 2x = \frac{2x}{x^2+y^2}" />
            </div>
          ),
        },
        {
          what: 'Находим ∂f/∂y аналогично',
          why: 'Та же логика, но теперь x² — константа по y. Производная x² + y² по y равна 2y.',
          formula: (
            <div>
              <F tex="\frac{\partial f}{\partial y} = \frac{1}{x^2+y^2} \cdot 2y = \frac{2y}{x^2+y^2}" />
            </div>
          ),
        },
        {
          what: 'Записываем градиент в общем виде',
          why: 'Выносим общий множитель 2/(x²+y²). Градиент пропорционален радиус-вектору (x, y)ᵀ — значит он всегда направлен от начала координат.',
          formula: (
            <div>
              <FBox
                tex="\nabla f = \frac{2}{x^2+y^2}\begin{pmatrix}x\\y\end{pmatrix}"
                hint="Направление: от начала координат. Это типичная структура для радиально-симметричных функций."
              />
            </div>
          ),
        },
        {
          what: 'Подставляем точку (1, 1) и вычисляем модуль',
          why: 'x² + y² = 1 + 1 = 2, множитель 2/2 = 1. Модуль вектора (1, 1)ᵀ — длина по теореме Пифагора.',
          formula: (
            <div>
              <F tex="\nabla f(1,1) = \frac{2}{2}\begin{pmatrix}1\\1\end{pmatrix} = \begin{pmatrix}1\\1\end{pmatrix}" />
              <F tex="\|\nabla f(1,1)\| = \sqrt{1^2+1^2} = \sqrt{2} \approx 1{,}414" />
            </div>
          ),
        },
      ],
    },

    // ── Пример 3: многомерное цепное правило ─────────────────────────────────
    {
      id: 'pd-w3',
      title: 'Многомерное цепное правило',
      level: 'стандартный',
      timeMin: 10,
      given: (
        <div>
          <F tex="f(x,y) = x^2y + e^{xy}, \quad x = t^2,\; y = \sin t" />
        </div>
      ),
      find: <span>Полная производная <M tex="\dfrac{df}{dt}" /></span>,
      answer: (
        <div>
          <M tex="\dfrac{df}{dt} = (2xy + ye^{xy})\cdot 2t + (x^2 + xe^{xy})\cdot \cos t" />
        </div>
      ),
      checkpoint: 'Полная производная по t собирается по всем путям: через x и через y. df/dt = f_x · dx/dt + f_y · dy/dt. Это многомерный аналог backpropagation: градиент ошибки в нейросети распространяется по всем путям от выхода к параметрам — ровно так же.',
      steps: [
        {
          what: 'Находим ∂f/∂x',
          why: 'y считаем константой. Слагаемое x²y: y — множитель, (x²)′ = 2x. Слагаемое eˣʸ: цепное правило, производная показателя xy по x равна y.',
          formula: (
            <div>
              <F tex="\frac{\partial f}{\partial x} = 2x \cdot y + e^{xy} \cdot y = 2xy + ye^{xy}" />
            </div>
          ),
        },
        {
          what: 'Находим ∂f/∂y',
          why: 'x считаем константой. x²y: x² — множитель, (y)′ = 1. eˣʸ: производная показателя xy по y равна x.',
          formula: (
            <div>
              <F tex="\frac{\partial f}{\partial y} = x^2 \cdot 1 + e^{xy} \cdot x = x^2 + xe^{xy}" />
            </div>
          ),
        },
        {
          what: 'Находим dx/dt и dy/dt',
          why: 'x и y — обычные функции одной переменной t, дифференцируем по стандартным правилам.',
          formula: (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>x = t²</div>
                  <M tex="\dfrac{dx}{dt} = 2t" />
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>y = sin t</div>
                  <M tex="\dfrac{dy}{dt} = \cos t" />
                </div>
              </div>
            </div>
          ),
        },
        {
          what: 'Собираем по формуле полной производной',
          why: 'df/dt = f_x · x_t + f_y · y_t. Суммируем вклады через оба пути: через x и через y. Можно оставить в виде через x, y или подставить x = t², y = sin t.',
          formula: (
            <div>
              <FBox
                tex="\frac{df}{dt} = (2xy + ye^{xy})\cdot 2t + (x^2 + xe^{xy})\cdot \cos t"
                hint="Подстановка x = t², y = sin t даёт выражение только через t"
              />
            </div>
          ),
        },
      ],
    },

    // ── Пример 4: стационарные точки и их классификация ──────────────────────
    {
      id: 'pd-w4',
      title: 'Стационарные точки: система ∇f = 0 и гессиан',
      level: 'стандартный',
      timeMin: 14,
      given: (
        <div>
          <F tex="f(x,y) = x^4 + y^4 - 4xy + 1" />
        </div>
      ),
      find: <span>Все стационарные точки и их тип</span>,
      answer: (
        <div style={{ lineHeight: 2, fontSize: 13 }}>
          <div><M tex="(0,0)" /> — седло</div>
          <div><M tex="(1,1)" /> и <M tex="(-1,-1)" /> — минимумы, <M tex="f_{\min} = -1" /></div>
        </div>
      ),
      checkpoint: 'Стационарные точки: решения системы ∇f = 0. Тип определяется через гессиан H: det H > 0, f_xx > 0 → минимум; det H > 0, f_xx < 0 → максимум; det H < 0 → седло. Не забывай: det H = f_xx · f_yy − f_xy².',
      steps: [
        {
          what: 'Находим частные производные и составляем систему',
          why: 'В стационарных точках обе частные производные равны нулю — это необходимое условие экстремума.',
          formula: (
            <div>
              <F tex="f_x = 4x^3 - 4y = 0 \;\Rightarrow\; y = x^3" />
              <F tex="f_y = 4y^3 - 4x = 0 \;\Rightarrow\; x = y^3" />
            </div>
          ),
        },
        {
          what: 'Решаем систему подстановкой',
          why: 'Подставляем y = x³ во второе уравнение. Получаем x = x⁹, то есть x⁹ − x = 0. Выносим x за скобку.',
          formula: (
            <div>
              <F tex="x = (x^3)^3 = x^9 \;\Rightarrow\; x^9 - x = 0 \;\Rightarrow\; x(x^8 - 1) = 0" />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                Вещественные корни: <M tex="x = 0,\; x = 1,\; x = -1" />. Соответствующие y: <M tex="0^3=0,\;1^3=1,\;(-1)^3=-1" />.
              </p>
            </div>
          ),
        },
        {
          what: 'Находим вторые производные и гессиан',
          why: 'Гессиан — матрица вторых производных. Для классификации нужны f_xx, f_xy, f_yy и det H = f_xx · f_yy − f_xy².',
          formula: (
            <div>
              <F tex="f_{xx} = 12x^2, \quad f_{xy} = -4, \quad f_{yy} = 12y^2" />
              <F tex="H = \begin{pmatrix} 12x^2 & -4 \\ -4 & 12y^2 \end{pmatrix}, \quad \det H = 144x^2y^2 - 16" />
            </div>
          ),
        },
        {
          what: 'Классифицируем каждую стационарную точку',
          why: 'Подставляем координаты в det H и f_xx. Знак определяет тип: отрицательный det H → седло; положительный + f_xx > 0 → минимум.',
          formula: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: T.redLight, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 4 }}>
                  (0, 0): det H = 144·0·0 − 16 = −16 &lt; 0
                </div>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>Седло — не экстремум.</p>
              </div>
              <div style={{ background: T.greenLight, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 4 }}>
                  (1, 1) и (−1, −1): det H = 144 − 16 = 128 &gt; 0, f_xx = 12 &gt; 0
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: T.text }}>Минимумы.</p>
                <M tex="f(1,1) = f(-1,-1) = 1+1-4+1 = -1" />
              </div>
            </div>
          ),
        },
      ],
    },

    // ── Пример 5: гессиан, собственные значения, обусловленность ─────────────
    {
      id: 'pd-w5',
      title: 'Гессиан, собственные значения и обусловленность',
      level: 'продвинутый',
      timeMin: 12,
      given: (
        <div>
          <F tex="f(x,y) = \tfrac{1}{2}(x^2 + 100y^2) \quad \text{(функция-овраг)}" />
        </div>
      ),
      find: (
        <span>
          а) Гессиан, б) собственные значения, в) число обусловленности <M tex="\kappa" />, г) последствия для градиентного спуска
        </span>
      ),
      answer: (
        <div style={{ lineHeight: 2, fontSize: 13 }}>
          <div>а) <M tex="H = \operatorname{diag}(1,\,100)" /></div>
          <div>б) <M tex="\lambda_1 = 1,\; \lambda_2 = 100" /></div>
          <div>в) <M tex="\kappa = 100" /></div>
          <div>г) Зигзагообразная траектория, медленная сходимость</div>
        </div>
      ),
      checkpoint: 'Число обусловленности κ = λ_max / λ_min показывает «вытянутость» оврага. Большое κ означает: в одном направлении функция почти плоская, в другом — крутая. Градиентный спуск вынужден использовать маленький шаг (из-за крутого направления) и медленно продвигается вдоль пологого. Методы Adam, RMSprop, momentum решают это за счёт адаптивного шага.',
      steps: [
        {
          what: 'Находим все вторые производные',
          why: 'f = ½x² + 50y². Дифференцируем дважды по каждой переменной и смешанно. Смешанная производная f_xy = 0 означает, что оси координат — собственные векторы гессиана.',
          formula: (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>f_xx</div>
                  <M tex="(x)_x' = 1" />
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>f_xy</div>
                  <M tex="(x)_y' = 0" />
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>f_yy</div>
                  <M tex="(100y)_y' = 100" />
                </div>
              </div>
            </div>
          ),
        },
        {
          what: 'Записываем гессиан',
          why: 'Гессиан — симметричная матрица вторых производных. Нули на антидиагонали: направления x и y не «связаны», функция растёт независимо по каждой оси.',
          formula: (
            <div>
              <FBox
                tex="H = \begin{pmatrix} 1 & 0 \\ 0 & 100 \end{pmatrix}"
                hint="Диагональная матрица — собственные векторы совпадают с осями координат"
              />
            </div>
          ),
        },
        {
          what: 'Собственные значения и число обусловленности',
          why: 'Для диагональной матрицы собственные значения — элементы на диагонали. Число обусловленности κ = λ_max / λ_min показывает соотношение кривизн в крутом и пологом направлениях.',
          formula: (
            <div>
              <F tex="\lambda_1 = 1 \;\text{(вдоль x, пологое)}, \quad \lambda_2 = 100 \;\text{(вдоль y, крутое)}" />
              <FBox
                tex="\kappa = \frac{\lambda_{\max}}{\lambda_{\min}} = \frac{100}{1} = 100"
                hint="При κ ≫ 1 говорят о плохой обусловленности задачи оптимизации"
              />
            </div>
          ),
        },
        {
          what: 'Последствия для градиентного спуска',
          why: '∇f = (x, 100y). Вблизи дна оврага y ≈ 0, но градиент по y в 100 раз больше. Маленький learning rate → медленно вдоль x. Большой → «перелёт» через дно по y. Итог: зигзаги.',
          formula: (
            <div>
              <div style={{ background: T.redLight, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 4 }}>Проблема</div>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>
                  Алгоритм «прыгает» поперёк оврага (по y), почти не двигаясь вдоль него (по x). Число итераций ~ κ = 100.
                </p>
              </div>
              <div style={{ background: T.greenLight, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 4 }}>Решение</div>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>
                  Momentum, Adam, RMSprop адаптируют шаг отдельно по каждой оси — эффективно выравнивают кривизну.
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
