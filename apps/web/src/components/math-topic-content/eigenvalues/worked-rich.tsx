// @ts-nocheck
import { useState } from 'react';
import {
  ChevronDown, ChevronUp, ChevronsDown, ChevronsUp,
  Eye, EyeOff, Lightbulb, ArrowRight, PenTool,
  BarChart3, Clock, Play, Link2, AlertTriangle,
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
          {ex.geometry && (
            <div style={{ marginTop: 10, borderRadius: 14, background: T.greenLight, border: `1px solid #a7f3d0`, padding: '14px 18px', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
              <strong>Геометрический смысл:</strong> {ex.geometry}
            </div>
          )}
          {ex.errors && (
            <div style={{ marginTop: 10, border: `1px solid #fecaca`, borderRadius: 14, padding: '14px 18px', background: T.redLight }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991b1b', fontSize: 12, fontWeight: 900, marginBottom: 10 }}>
                <AlertTriangle size={14} /> Типовые ошибки
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: T.text, fontSize: 13, lineHeight: 1.75 }}>
                {ex.errors.map((e: string) => <li key={e}>{e}</li>)}
              </ul>
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

export default function EigenvaluesWorkedRich({ onGoTheory, onGoPractice }: { onGoTheory?: () => void; onGoPractice?: () => void }) {

  const examples = [

    // ── Разбор 1: диагональная матрица ───────────────────────────────────────
    {
      id: 'ev-w1',
      title: 'Нахождение собственных значений и векторов для диагональной матрицы',
      level: 'базовый',
      timeMin: 6,
      given: <F tex={'A=\\begin{pmatrix}4&0\\\\0&-1\\end{pmatrix}'} />,
      find: <span>Собственные значения <M tex={'\\lambda'} /> и собственные векторы.</span>,
      answer: <M tex={'\\lambda_1=4,\\ v_1=\\begin{pmatrix}1\\\\0\\end{pmatrix};\\quad \\lambda_2=-1,\\ v_2=\\begin{pmatrix}0\\\\1\\end{pmatrix}'} />,
      checkpoint: 'Для диагональной матрицы собственные значения — элементы на главной диагонали, а собственные векторы — стандартные базисные векторы. Полный метод всё равно один и тот же: det(A − λI) = 0, затем (A − λI)x = 0.',
      geometry: 'ось X растягивается в 4 раза, а ось Y отражается из-за отрицательного собственного значения. Оси координат — собственные направления.',
      errors: [
        'Забыть, что A − (−1)I = A + I.',
        'Назвать собственными векторами строки, а не столбцы.',
        'Не проверить равенство Av = λv.',
      ],
      steps: [
        {
          what: 'Составляем A − λI',
          why: 'λ вычитается только из диагональных элементов.',
          formula: <F tex={'A-\\lambda I=\\begin{pmatrix}4-\\lambda&0\\\\0&-1-\\lambda\\end{pmatrix}'} />,
        },
        {
          what: 'Находим характеристическое уравнение',
          why: 'Для диагональной матрицы определитель — произведение диагональных элементов.',
          formula: <F tex={'\\det(A-\\lambda I)=(4-\\lambda)(-1-\\lambda)=0'} />,
        },
        {
          what: 'Решаем уравнение',
          why: 'Произведение равно нулю, если хотя бы один множитель равен нулю.',
          formula: <F tex={'4-\\lambda=0\\Rightarrow\\lambda_1=4,\\qquad -1-\\lambda=0\\Rightarrow\\lambda_2=-1'} />,
        },
        {
          what: 'Для λ = 4 решаем систему',
          why: 'Подставляем найденный корень в A − λI и ищем ненулевое решение.',
          formula: (
            <div>
              <F tex={'(A-4I)x=\\begin{pmatrix}0&0\\\\0&-5\\end{pmatrix}\\begin{pmatrix}x_1\\\\x_2\\end{pmatrix}=0'} />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                Отсюда <M tex={'x_2=0'} />, а <M tex={'x_1'} /> свободна. Берём <M tex={'v_1=(1,0)^T'} />.
              </p>
            </div>
          ),
        },
        {
          what: 'Для λ = −1 решаем систему',
          why: 'Важно: A − (−1)I = A + I.',
          formula: (
            <div>
              <F tex={'(A+I)x=\\begin{pmatrix}5&0\\\\0&0\\end{pmatrix}\\begin{pmatrix}x_1\\\\x_2\\end{pmatrix}=0'} />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                Отсюда <M tex={'x_1=0'} />, а <M tex={'x_2'} /> свободна. Берём <M tex={'v_2=(0,1)^T'} />.
              </p>
            </div>
          ),
        },
        {
          what: 'Проверяем ответ',
          why: 'Проверка Av = λv ловит почти все ошибки со знаками и векторами.',
          formula: <F tex={'Av_1=4v_1,\\qquad Av_2=-1\\cdot v_2\\quad\\checkmark'} />,
        },
      ],
    },

    // ── Разбор 2: матрица 2×2 общего вида ────────────────────────────────────
    {
      id: 'ev-w2',
      title: 'Нахождение собственных значений и векторов для матрицы 2×2 общего вида',
      level: 'базовый',
      timeMin: 9,
      given: <F tex={'A=\\begin{pmatrix}3&2\\\\4&1\\end{pmatrix}'} />,
      find: <span>Собственные значения и собственные векторы.</span>,
      answer: <M tex={'\\lambda_1=5,\\ v_1=\\begin{pmatrix}1\\\\1\\end{pmatrix};\\quad \\lambda_2=-1,\\ v_2=\\begin{pmatrix}1\\\\-2\\end{pmatrix}'} />,
      checkpoint: 'У недиагональной матрицы собственные направления обычно не совпадают с осями. Метод остаётся прежним: характеристическое уравнение → корни → система для каждого корня.',
      geometry: 'направление (1, 1) растягивается в 5 раз, а направление (1, −2) отражается без изменения масштаба. Матрица несимметрична, поэтому эти направления не обязаны быть ортогональными.',
      errors: [
        'Поставить плюс вместо минуса в определителе ad − bc.',
        'Ошибиться при раскрытии (3 − λ)(1 − λ).',
        'Для λ = −1 забыть заменить A − λI на A + I.',
      ],
      steps: [
        {
          what: 'Составляем A − λI',
          why: 'λ вычитается только на главной диагонали.',
          formula: <F tex={'A-\\lambda I=\\begin{pmatrix}3-\\lambda&2\\\\4&1-\\lambda\\end{pmatrix}'} />,
        },
        {
          what: 'Пишем определитель',
          why: 'Для 2×2 используем правило ad − bc.',
          formula: <F tex={'\\det(A-\\lambda I)=(3-\\lambda)(1-\\lambda)-2\\cdot4=0'} />,
        },
        {
          what: 'Раскрываем скобки',
          why: 'Приводим характеристический многочлен к стандартному виду.',
          formula: <F tex={'(3-\\lambda)(1-\\lambda)-8=\\lambda^2-4\\lambda-5=0'} />,
        },
        {
          what: 'Находим корни',
          why: 'Дискриминант равен 36, поэтому корни целые.',
          formula: <F tex={'\\lambda=\\frac{4\\pm\\sqrt{36}}{2}\\Rightarrow\\lambda_1=5,\\quad\\lambda_2=-1'} />,
        },
        {
          what: 'Для λ = 5 находим вектор',
          why: 'Решаем однородную систему и оставляем одну свободную переменную.',
          formula: (
            <div>
              <F tex={'A-5I=\\begin{pmatrix}-2&2\\\\4&-4\\end{pmatrix},\\qquad -2x_1+2x_2=0'} />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                <M tex={'x_1=x_2'} />, выбираем <M tex={'v_1=(1,1)^T'} />.
              </p>
            </div>
          ),
        },
        {
          what: 'Для λ = −1 находим вектор',
          why: 'Снова решаем ядро, теперь для A + I.',
          formula: (
            <div>
              <F tex={'A+I=\\begin{pmatrix}4&2\\\\4&2\\end{pmatrix},\\qquad 4x_1+2x_2=0'} />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                <M tex={'x_2=-2x_1'} />, выбираем <M tex={'v_2=(1,-2)^T'} />.
              </p>
            </div>
          ),
        },
        {
          what: 'Проверяем',
          why: 'След совпадает с суммой λ, а умножение подтверждает векторы.',
          formula: (
            <div>
              <F tex={'5+(-1)=4=\\operatorname{tr}A\\quad\\checkmark'} />
              <F tex={'A\\begin{pmatrix}1\\\\1\\end{pmatrix}=5\\begin{pmatrix}1\\\\1\\end{pmatrix},\\qquad A\\begin{pmatrix}1\\\\-2\\end{pmatrix}=-1\\begin{pmatrix}1\\\\-2\\end{pmatrix}\\quad\\checkmark'} />
            </div>
          ),
        },
      ],
    },

    // ── Разбор 3: матрица 3×3 с нулями, кратный корень ───────────────────────
    {
      id: 'ev-w3',
      title: 'Матрица 3×3 со многими нулями: кратный корень и два вектора',
      level: 'стандартный',
      timeMin: 11,
      given: <F tex={'A=\\begin{pmatrix}2&0&0\\\\0&3&1\\\\0&1&3\\end{pmatrix}'} />,
      find: <span>Собственные значения, собственные векторы и вывод о диагонализуемости.</span>,
      answer: (
        <div style={{ lineHeight: 2, fontSize: 13 }}>
          <div><M tex={'\\lambda=2'} /> кратности 2: <M tex={'(1,0,0)^T,\\;(0,1,-1)^T'} /></div>
          <div><M tex={'\\lambda=4'} />: <M tex={'(0,1,1)^T'} />. Матрица диагонализуема.</div>
        </div>
      ),
      checkpoint: 'Матрица блочная: первый координатный блок отделён, а нижний правый блок 2×2 решается отдельно. Кратный корень не страшен, если хватает независимых собственных векторов.',
      geometry: 'первое направление (ось x₁) живёт отдельно, а плоскость (x₂, x₃) раскладывается на сумму и разность координат: (0,1,1) растягивается до λ = 4, а (0,1,−1) соответствует λ = 2.',
      errors: [
        'Потерять множитель (2 − λ) и одно собственное значение.',
        'Для кратного λ = 2 найти только один вектор.',
        'Перепутать векторы (0,1,−1) и (0,1,1) между λ = 2 и λ = 4.',
      ],
      steps: [
        {
          what: 'Составляем A − λI',
          why: 'Стандартно вычитаем λ с диагонали.',
          formula: <F tex={'A-\\lambda I=\\begin{pmatrix}2-\\lambda&0&0\\\\0&3-\\lambda&1\\\\0&1&3-\\lambda\\end{pmatrix}'} />,
        },
        {
          what: 'Раскладываем определитель по первой строке',
          why: 'В первой строке два нуля, поэтому остаётся один минор.',
          formula: <F tex={'\\det(A-\\lambda I)=(2-\\lambda)\\det\\begin{pmatrix}3-\\lambda&1\\\\1&3-\\lambda\\end{pmatrix}'} />,
        },
        {
          what: 'Считаем внутренний определитель',
          why: 'Это обычный определитель 2×2: ad − bc.',
          formula: <F tex={'(3-\\lambda)^2-1=\\lambda^2-6\\lambda+8=(\\lambda-2)(\\lambda-4)'} />,
        },
        {
          what: 'Получаем собственные значения',
          why: 'Собираем все множители, не теряя (2 − λ).',
          formula: (
            <div>
              <F tex={'(2-\\lambda)(\\lambda-2)(\\lambda-4)=0'} />
              <FBox
                tex={'\\lambda=2\\;(\\text{кратность }2),\\qquad\\lambda=4\\;(\\text{кратность }1)'}
                hint={'Проверка: след = 2+3+3 = 8 = 2+2+4 ✓'}
              />
            </div>
          ),
        },
        {
          what: 'Для λ = 4 находим вектор',
          why: 'Система фиксирует x₁ = 0 и x₂ = x₃.',
          formula: (
            <div>
              <F tex={'A-4I=\\begin{pmatrix}-2&0&0\\\\0&-1&1\\\\0&1&-1\\end{pmatrix}'} />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                Из первой строки <M tex={'x_1=0'} />, из второй <M tex={'x_2=x_3'} />. Берём <M tex={'v=(0,1,1)^T'} />.
              </p>
            </div>
          ),
        },
        {
          what: 'Для λ = 2 находим все векторы',
          why: 'Первая строка A − 2I нулевая, поэтому x₁ — свободная переменная. Вторая строка даёт x₂ + x₃ = 0.',
          formula: (
            <div>
              <F tex={'A-2I=\\begin{pmatrix}0&0&0\\\\0&1&1\\\\0&1&1\\end{pmatrix},\\qquad x_2+x_3=0'} />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                <M tex={'x_1'} /> свободна и <M tex={'x_3=-x_2'} />. Два базисных вектора:
              </p>
              <FBox
                tex={'v_1^{(1)}=(1,0,0)^T,\\qquad v_1^{(2)}=(0,1,-1)^T'}
                hint={'Геометрическая кратность λ = 2 равна алгебраической: 2 = 2 → матрица диагонализуема ✓'}
              />
            </div>
          ),
        },
      ],
    },

    // ── Разбор 4: симметричная матрица 2×2 ───────────────────────────────────
    {
      id: 'ev-w4',
      title: 'Симметричная матрица 2×2: ортогональные собственные векторы',
      level: 'стандартный',
      timeMin: 8,
      given: <F tex={'A=\\begin{pmatrix}1&2\\\\2&1\\end{pmatrix}'} />,
      find: <span>Собственные значения, векторы и проверка ортогональности.</span>,
      answer: (
        <div style={{ lineHeight: 2, fontSize: 13 }}>
          <div><M tex={'\\lambda_1=3,\\;v_1=(1,1)^T;\\quad\\lambda_2=-1,\\;v_2=(1,-1)^T'} /></div>
          <div>Векторы ортогональны.</div>
        </div>
      ),
      checkpoint: 'Симметричная матрица имеет вещественные собственные значения, а собственные векторы для разных λ ортогональны. Это ключ к PCA: главные компоненты — перпендикулярные оси.',
      geometry: 'направления (1,1) и (1,−1) — диагонали координатной плоскости под 45°. Первое растягивается в 3 раза, второе отражается. Они перпендикулярны.',
      errors: [
        'Не проверить ортогональность — это главная фишка задачи.',
        'Испугаться вектора (−1,1)ᵀ: это то же направление, что (1,−1)ᵀ.',
        'Перенести свойство ортогональности на все матрицы: гарантия есть именно для симметричных.',
      ],
      steps: [
        {
          what: 'Составляем характеристическое уравнение',
          why: 'Матрица симметрична, но λ всё равно ищем через det(A − λI).',
          formula: <F tex={'\\det\\begin{pmatrix}1-\\lambda&2\\\\2&1-\\lambda\\end{pmatrix}=(1-\\lambda)^2-4=0'} />,
        },
        {
          what: 'Раскрываем и факторизуем',
          why: 'Получается квадратный многочлен с целыми корнями.',
          formula: <F tex={'(1-2\\lambda+\\lambda^2)-4=\\lambda^2-2\\lambda-3=(\\lambda-3)(\\lambda+1)=0'} />,
        },
        {
          what: 'Записываем собственные значения',
          why: 'Корни характеристического уравнения — собственные значения.',
          formula: <F tex={'\\lambda_1=3,\\qquad\\lambda_2=-1'} />,
        },
        {
          what: 'Для λ = 3 находим вектор',
          why: 'Система даёт равенство координат.',
          formula: (
            <div>
              <F tex={'A-3I=\\begin{pmatrix}-2&2\\\\2&-2\\end{pmatrix},\\qquad -2x_1+2x_2=0'} />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                <M tex={'x_1=x_2'} />, берём <M tex={'v_1=(1,1)^T'} />.
              </p>
            </div>
          ),
        },
        {
          what: 'Для λ = −1 находим вектор',
          why: 'Система даёт противоположные координаты.',
          formula: (
            <div>
              <F tex={'A+I=\\begin{pmatrix}2&2\\\\2&2\\end{pmatrix},\\qquad 2x_1+2x_2=0'} />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                <M tex={'x_1=-x_2'} />, берём <M tex={'v_2=(1,-1)^T'} />.
              </p>
            </div>
          ),
        },
        {
          what: 'Проверяем ортогональность',
          why: 'Скалярное произведение равно нулю — направления перпендикулярны.',
          formula: (
            <FBox
              tex={'v_1\\cdot v_2=1\\cdot1+1\\cdot(-1)=0\\quad\\checkmark'}
              hint={'Для симметричных матриц это гарантировано теоремой.'}
            />
          ),
        },
      ],
    },

    // ── Разбор 5: дефектная матрица (жорданова клетка) ───────────────────────
    {
      id: 'ev-w5',
      title: 'Недиагонализуемый случай: дефектная матрица',
      level: 'продвинутый',
      timeMin: 10,
      given: <F tex={'A=\\begin{pmatrix}2&1&0\\\\0&2&1\\\\0&0&2\\end{pmatrix}'} />,
      find: <span>Собственные значения, собственные векторы и ответ: можно ли диагонализовать?</span>,
      answer: (
        <div style={{ lineHeight: 2, fontSize: 13 }}>
          <div><M tex={'\\lambda=2'} /> алгебраической кратности 3.</div>
          <div>Единственный вектор: <M tex={'(1,0,0)^T'} />. Матрица не диагонализуема.</div>
        </div>
      ),
      checkpoint: 'Кратный корень не означает автоматически «плохо». Нужно сравнить алгебраическую кратность с геометрической. Если собственных направлений меньше, чем нужно, матрица дефектная.',
      geometry: 'матрица не просто удваивает пространство: она ещё сдвигает координаты вдоль цепочки e₃ → e₂ → e₁. Единственное настоящее собственное направление — ось e₁.',
      errors: [
        'Увидеть кратный корень и сразу объявить матрицу недиагонализуемой: нужно считать ядро.',
        'Думать, что кратность 3 автоматически даёт три собственных вектора.',
        'Забыть, что треугольная матрица имеет собственные значения на диагонали.',
      ],
      steps: [
        {
          what: 'Используем треугольный вид',
          why: 'У верхнетреугольной матрицы определитель равен произведению диагональных элементов.',
          formula: <F tex={'\\det(A-\\lambda I)=(2-\\lambda)^3'} />,
        },
        {
          what: 'Находим собственное значение',
          why: 'Единственный корень повторяется трижды.',
          formula: <F tex={'(2-\\lambda)^3=0\\Rightarrow\\lambda=2\\quad(\\text{алгебраическая кратность }3)'} />,
        },
        {
          what: 'Решаем систему для λ = 2',
          why: 'Количество независимых решений даст геометрическую кратность.',
          formula: <F tex={'A-2I=\\begin{pmatrix}0&1&0\\\\0&0&1\\\\0&0&0\\end{pmatrix},\\qquad (A-2I)x=0'} />,
        },
        {
          what: 'Описываем ядро',
          why: 'Первая строка даёт x₂ = 0, вторая — x₃ = 0; x₁ свободна.',
          formula: (
            <FBox
              tex={'x_2=0,\\quad x_3=0,\\quad x_1\\text{ свободна}\\Rightarrow v=(1,0,0)^T'}
              hint={'rank(A − 2I) = 2 → dim ker = 3 − 2 = 1'}
            />
          ),
        },
        {
          what: 'Сравниваем кратности',
          why: 'Для диагонализации матрицы 3×3 нужны три независимых собственных вектора.',
          formula: (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>Алгебраическая кратность</div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>3</p>
                </div>
                <div style={{ background: T.redLight, border: `1px solid #fecaca`, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', marginBottom: 4 }}>Геометрическая кратность</div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.red }}>1 &lt; 3 — дефект!</p>
                </div>
              </div>
              <FBox
                tex={'\\text{Матрица не диагонализуема}'}
                hint={'Это жорданова клетка размера 3.'}
              />
            </div>
          ),
        },
        {
          what: 'Интерпретируем как жорданову клетку',
          why: 'Матрица не раскладывается на независимые растяжения по трём направлениям.',
          formula: <F tex={'A=2I+\\begin{pmatrix}0&1&0\\\\0&0&1\\\\0&0&0\\end{pmatrix}'} />,
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
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: T.text }}>Разборы задач</h2>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
              Пять задач идут от диагональной матрицы до жордановой клетки. В каждом разборе одна и та же дорожная карта: характеристическое уравнение → собственные значения → ядро <M tex={'A-\\lambda I'} /> → проверка <M tex={'Av=\\lambda v'} />. Слева — <em>почему так</em>, справа — <em>запись формулой</em>. Кнопка «Скрыть» переводит в режим самостоятельного решения.
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
