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

export default function RankBasisWorkedRich({ onGoTheory, onGoPractice }: { onGoTheory?: () => void; onGoPractice?: () => void }) {

  const examples = [

    // ── Пример 1: ранг матрицы ────────────────────────────────────────────────
    {
      id: 'rb-w1',
      title: 'Нахождение ранга матрицы',
      level: 'базовый',
      timeMin: 5,
      given: (
        <div>
          <F tex="A = \begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{pmatrix}" />
        </div>
      ),
      find: <span>Ранг матрицы <M tex="A" /></span>,
      answer: <span><M tex="\operatorname{rank}(A) = 2" /></span>,
      checkpoint: 'Ранг = число ненулевых строк в ступенчатом виде. Элементарные преобразования строк не меняют ранг — этим и пользуемся.',
      steps: [
        {
          what: 'Обнуляем первый столбец ниже ведущего элемента',
          why: 'Метод Гаусса: вычитаем из каждой нижней строки первую строку, умноженную на подходящий множитель. Это элементарное преобразование строк — оно не меняет ранг.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="R_2 \leftarrow R_2 - 4R_1" />,&ensp;<M tex="R_3 \leftarrow R_3 - 7R_1" />
              </p>
              <F tex="\begin{pmatrix} 1 & 2 & 3 \\ 0 & -3 & -6 \\ 0 & -6 & -12 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Обнуляем второй столбец в третьей строке',
          why: 'Вычитаем из третьей строки вторую, умноженную на 2. Если строка стала нулевой — она не вносит вклад в ранг.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="R_3 \leftarrow R_3 - 2R_2" />
              </p>
              <F tex="\begin{pmatrix} 1 & 2 & 3 \\ 0 & -3 & -6 \\ 0 & 0 & 0 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Считаем ненулевые строки',
          why: 'Ранг равен числу ведущих (ненулевых) строк в ступенчатом виде. Первые две строки содержат ведущие элементы, третья — нулевая.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: T.text }}>
                Ведущих строк: <strong>2</strong>
              </p>
              <FBox tex="\operatorname{rank}(A) = 2" />
            </div>
          ),
        },
      ],
    },

    // ── Пример 2: базис пространства строк ───────────────────────────────────
    {
      id: 'rb-w2',
      title: 'Базис пространства строк',
      level: 'базовый',
      timeMin: 7,
      given: (
        <div>
          <F tex="A = \begin{pmatrix} 1 & 2 & 1 \\ 2 & 4 & 2 \\ 1 & 3 & 0 \end{pmatrix}" />
        </div>
      ),
      find: <span>Базис пространства строк матрицы <M tex="A" /></span>,
      answer: (
        <div>
          <M tex="\{(1,\,2,\,1),\;(0,\,1,\,-1)\}" />
        </div>
      ),
      checkpoint: 'Ненулевые строки ступенчатой формы всегда линейно независимы и порождают то же пространство строк, что и исходная матрица.',
      steps: [
        {
          what: 'Обнуляем первый столбец',
          why: 'Вычитаем из нижних строк первую с нужным множителем. Вторая строка — удвоенная первая, поэтому обнуляется полностью.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="R_2 \leftarrow R_2 - 2R_1" />,&ensp;<M tex="R_3 \leftarrow R_3 - R_1" />
              </p>
              <F tex="\begin{pmatrix} 1 & 2 & 1 \\ 0 & 0 & 0 \\ 0 & 1 & -1 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Переставляем строки для ступенчатого вида',
          why: 'Перестановка строк — законное элементарное преобразование; оно не меняет пространство строк. Нулевую строку опускаем вниз.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}><M tex="R_2 \leftrightarrow R_3" /></p>
              <F tex="\begin{pmatrix} 1 & 2 & 1 \\ 0 & 1 & -1 \\ 0 & 0 & 0 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Выделяем базис из ненулевых строк',
          why: 'Ненулевые строки ступенчатой матрицы линейно независимы (у каждой ведущий элемент стоит правее предыдущей). Они порождают то же пространство строк.',
          formula: (
            <FBox
              tex="\mathbf{v}_1 = (1,\,2,\,1), \quad \mathbf{v}_2 = (0,\,1,\,-1)"
              hint="dim(строчное пространство) = rank(A) = 2"
            />
          ),
        },
      ],
    },

    // ── Пример 3: все три фундаментальных подпространства ────────────────────
    {
      id: 'rb-w3',
      title: 'Базисы пространства строк, столбцов и ядра',
      level: 'стандартный',
      timeMin: 12,
      given: (
        <div>
          <F tex="A = \begin{pmatrix} 1 & 2 & 1 & 3 \\ 2 & 4 & 1 & 5 \\ 1 & 2 & 0 & 2 \end{pmatrix}" />
        </div>
      ),
      find: <span>Базисы пространства строк, пространства столбцов и ядра <M tex="\ker A" /></span>,
      answer: (
        <div style={{ lineHeight: 2 }}>
          <div><strong>Строки:</strong> <M tex="\{(1,2,0,2),\,(0,0,1,1)\}" /></div>
          <div><strong>Столбцы:</strong> <M tex="\{c_1,\,c_3\}" /> — 1-й и 3-й столбцы <M tex="A" /></div>
          <div><strong>Ядро:</strong> <M tex="\{(-2,1,0,0)^\top,\,(-2,0,-1,1)^\top\}" /></div>
        </div>
      ),
      checkpoint: 'Теорема о рангах: dim(ker A) = n − rank(A). Здесь 4 − 2 = 2. Ведущие столбцы ступенчатой формы указывают, какие столбцы исходной матрицы брать в базис столбцового пространства.',
      steps: [
        {
          what: 'Приводим к ступенчатому виду — первый проход',
          why: 'Вычитаем из строк 2 и 3 кратные первой строки. Цель — получить нули в первом столбце ниже ведущего.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="R_2 \leftarrow R_2 - 2R_1" />,&ensp;<M tex="R_3 \leftarrow R_3 - R_1" />
              </p>
              <F tex="\begin{pmatrix} 1 & 2 & 1 & 3 \\ 0 & 0 & -1 & -1 \\ 0 & 0 & -1 & -1 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Второй проход — обнуляем третью строку и нормируем',
          why: 'Третья строка — копия второй, поэтому обнуляется. Умножаем вторую на −1, чтобы ведущий элемент был положительным. Затем добавляем обратную подстановку (вычитаем R2 из R1).',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="R_3 \leftarrow R_3 - R_2" />, затем <M tex="R_2 \leftarrow -R_2" />, затем <M tex="R_1 \leftarrow R_1 - R_2" />
              </p>
              <F tex="\begin{pmatrix} 1 & 2 & 0 & 2 \\ 0 & 0 & 1 & 1 \\ 0 & 0 & 0 & 0 \end{pmatrix}" />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: T.muted }}>
                Ведущие позиции: столбцы <strong>1</strong> и <strong>3</strong>. Ранг = 2.
              </p>
            </div>
          ),
        },
        {
          what: 'Базис пространства строк',
          why: 'Ненулевые строки приведённой ступенчатой формы линейно независимы и порождают то же пространство строк, что и исходная матрица.',
          formula: (
            <FBox
              tex="\mathbf{r}_1 = (1,2,0,2), \quad \mathbf{r}_2 = (0,0,1,1)"
              hint="dim(строчное пр-во) = rank = 2"
            />
          ),
        },
        {
          what: 'Базис пространства столбцов',
          why: 'Берём столбцы исходной матрицы A с теми индексами, где в ступенчатой форме стоят ведущие элементы (1 и 3). Важно брать из исходной матрицы, а не из приведённой.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>1-й и 3-й столбцы матрицы A:</p>
              <F tex="c_1 = \begin{pmatrix}1\\2\\1\end{pmatrix}, \qquad c_3 = \begin{pmatrix}1\\1\\0\end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Базис ядра — выражаем ведущие переменные через свободные',
          why: 'Ведущие переменные: x₁, x₃ (столбцы 1 и 3). Свободные: x₂, x₄. Из уравнений ступенчатой формы выражаем x₃ = −x₄, x₁ = −2x₂ − 2x₄. Каждому свободному параметру отвечает один базисный вектор ядра.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="x_2 = s,\; x_4 = t" /> (свободные параметры):
              </p>
              <F tex="x = s\begin{pmatrix}-2\\1\\0\\0\end{pmatrix} + t\begin{pmatrix}-2\\0\\-1\\1\end{pmatrix}" />
              <FBox
                tex="\ker A = \operatorname{span}\!\left\{\begin{pmatrix}-2\\1\\0\\0\end{pmatrix},\;\begin{pmatrix}-2\\0\\-1\\1\end{pmatrix}\right\}"
                hint="dim(ker A) = 4 − rank(A) = 4 − 2 = 2 ✓"
              />
            </div>
          ),
        },
      ],
    },

    // ── Пример 4: ранг с параметром ──────────────────────────────────────────
    {
      id: 'rb-w4',
      title: 'Ранг матрицы с параметром',
      level: 'стандартный',
      timeMin: 10,
      given: (
        <div>
          <F tex="A = \begin{pmatrix} 1 & 2 & 1 \\ 2 & 3 & 3 \\ 1 & 1 & \alpha \end{pmatrix}" />
        </div>
      ),
      find: <span>При каком <M tex="\alpha" /> выполняется <M tex="\operatorname{rank}(A) = 2" /></span>,
      answer: <span><M tex="\alpha = 2" /></span>,
      checkpoint: 'Ранг зависит от параметра через «последнюю» строку ступенчатого вида. Если она обнуляется — ранг падает на 1. Ищем условие на параметр, при котором это происходит.',
      steps: [
        {
          what: 'Обнуляем первый столбец',
          why: 'Стандартный первый шаг метода Гаусса: вычитаем из строк 2 и 3 кратные первой строки.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="R_2 \leftarrow R_2 - 2R_1" />,&ensp;<M tex="R_3 \leftarrow R_3 - R_1" />
              </p>
              <F tex="\begin{pmatrix} 1 & 2 & 1 \\ 0 & -1 & 1 \\ 0 & -1 & \alpha-1 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Обнуляем второй столбец в третьей строке',
          why: 'Вычитаем из третьей строки вторую — третий столбец останется с выражением, зависящим от α. Именно оно определит ранг.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="R_3 \leftarrow R_3 - R_2" />
              </p>
              <F tex="\begin{pmatrix} 1 & 2 & 1 \\ 0 & -1 & 1 \\ 0 & 0 & \alpha-2 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Анализируем ранг в зависимости от α',
          why: 'Первые две строки всегда ненулевые. Третья строка нулевая тогда и только тогда, когда α − 2 = 0, то есть α = 2. Только в этом случае ранг = 2.',
          formula: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: T.greenLight, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 4 }}>α = 2</div>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>Третья строка нулевая → <strong>rank = 2</strong></p>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>α ≠ 2</div>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>Третья строка ненулевая → <strong>rank = 3</strong></p>
              </div>
            </div>
          ),
        },
      ],
    },

    // ── Пример 5: сложный — два параметра ────────────────────────────────────
    {
      id: 'rb-w5',
      title: 'Ранг и базис строк при двух параметрах',
      level: 'продвинутый',
      timeMin: 15,
      given: (
        <div>
          <F tex="A = \begin{pmatrix} 1 & 1 & 2 & 1 \\ 2 & 1 & 1 & 0 \\ 3 & 2 & p & q \end{pmatrix}" />
        </div>
      ),
      find: (
        <span>Ранг и базис пространства строк при всех значениях <M tex="p,\,q" /></span>
      ),
      answer: (
        <div style={{ lineHeight: 2, fontSize: 13 }}>
          <div>• <M tex="p \neq 3" />: rank = 3, базис <M tex="\{r_1,r_2,r_3\}" /></div>
          <div>• <M tex="p=3,\,q=1" />: rank = 2, базис <M tex="\{r_1,r_2\}" /></div>
          <div>• <M tex="p=3,\,q\neq 1" />: rank = 3, базис <M tex="\{r_1,r_2,r_3'\}" /></div>
        </div>
      ),
      checkpoint: 'При двух параметрах нужно исследовать их независимо: сначала один (p) определяет «вид» третьей строки, потом второй (q) добавляет подслучай. Итоговая таблица случаев — стандартный формат ответа.',
      steps: [
        {
          what: 'Обнуляем первый столбец — строки 2 и 3',
          why: 'Вычитаем из строки 2 удвоенную строку 1, из строки 3 — утроенную. Параметры p и q пока «остаются» в третьей строке.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="R_2 \leftarrow R_2 - 2R_1" />,&ensp;<M tex="R_3 \leftarrow R_3 - 3R_1" />
              </p>
              <F tex="\begin{pmatrix} 1 & 1 & 2 & 1 \\ 0 & -1 & -3 & -2 \\ 0 & -1 & p-6 & q-3 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Обнуляем второй столбец в строке 3',
          why: 'Вычитаем из строки 3 строку 2. После этого второй столбец строки 3 обнуляется, а в третьем и четвёртом появляются выражения с параметрами.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: T.muted }}>
                <M tex="R_3 \leftarrow R_3 - R_2" />, затем <M tex="R_2 \leftarrow -R_2" />
              </p>
              <F tex="\begin{pmatrix} 1 & 1 & 2 & 1 \\ 0 & 1 & 3 & 2 \\ 0 & 0 & p-3 & q-1 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Анализ: случай p ≠ 3',
          why: 'Если p − 3 ≠ 0, то элемент (3,3) является ведущим вне зависимости от q. Все три строки содержат ведущие элементы — ранг равен 3.',
          formula: (
            <div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase' }}>p ≠ 3 (любое q)</span>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text }}>rank = 3</p>
              </div>
              <F tex="\text{Базис: } \{(1,1,2,1),\;(0,1,3,2),\;(0,0,p{-}3,q{-}1)\}" />
            </div>
          ),
        },
        {
          what: 'Анализ: случай p = 3',
          why: 'При p = 3 третья строка превращается в (0, 0, 0, q−1). Теперь ранг зависит от q: если q = 1, строка нулевая и ранг = 2; иначе строка вида (0,0,0,*) ненулевая — ранг = 3.',
          formula: (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: T.greenLight, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 4 }}>p = 3, q = 1</div>
                  <p style={{ margin: 0, fontSize: 13, color: T.text }}>Строка 3 = (0,0,0,0) → <strong>rank = 2</strong></p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Базис: <M tex="\{(1,1,2,1),(0,1,3,2)\}" /></p>
                </div>
                <div style={{ background: `${T.amber}18`, border: `1px solid ${T.amber}44`, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', marginBottom: 4 }}>p = 3, q ≠ 1</div>
                  <p style={{ margin: 0, fontSize: 13, color: T.text }}>Строка 3 = (0,0,0,q−1) ≠ 0 → <strong>rank = 3</strong></p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Базис: <M tex="\{(1,1,2,1),(0,1,3,2),(0,0,0,q{-}1)\}" /></p>
                </div>
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
