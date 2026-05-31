// @ts-nocheck
import React from 'react';
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
};

const LEVEL_STYLE: Record<string, { bg: string; color: string; label: string }> = {
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
    <div style={{ background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 12, padding: '14px 18px', margin: '10px 0', textAlign: 'center' }}>
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
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.mutedLight, textTransform: 'uppercase', marginBottom: 3 }}>Шаг {idx + 1}</div>
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

export default function MatrixOperationsWorkedRich({ onGoTheory, onGoPractice }: { onGoTheory?: () => void; onGoPractice?: () => void }) {

  const examples = [
    // ── Пример 1: C = 2A − 3B ──────────────────────────────────────────────
    {
      id: 'w1',
      title: 'Сложение, вычитание и умножение на скаляр',
      level: 'базовый',
      timeMin: 5,
      given: (
        <div>
          <M tex="A = \begin{pmatrix} 3 & -1 \\ 0 & 4 \end{pmatrix},\quad B = \begin{pmatrix} 1 & 5 \\ -2 & 0 \end{pmatrix}" />
        </div>
      ),
      find: <span>Матрицу <M tex="C = 2A - 3B" /></span>,
      answer: <M tex="C = \begin{pmatrix} 3 & -17 \\ 6 & 8 \end{pmatrix}" />,
      checkpoint: 'Умножение на скаляр и сложение/вычитание матриц выполняются поэлементно. Порядок действий: сначала умножить, потом сложить — как в обычной арифметике.',
      steps: [
        {
          what: 'Проверяем размерности',
          why: 'Сложение и вычитание матриц определены только для матриц одинакового размера. Если размеры не совпадают, операция не существует.',
          formula: (
            <div>
              <p style={{ margin: '0 0 6px', color: T.muted, fontSize: 12 }}>A и B — оба размера 2×2. Все операции определены.</p>
            </div>
          ),
        },
        {
          what: 'Умножаем A на 2',
          why: 'При умножении матрицы на скаляр каждый элемент умножается на этот скаляр. Размер матрицы не меняется.',
          formula: (
            <F tex="2A = 2 \cdot \begin{pmatrix} 3 & -1 \\ 0 & 4 \end{pmatrix} = \begin{pmatrix} 6 & -2 \\ 0 & 8 \end{pmatrix}" />
          ),
        },
        {
          what: 'Умножаем B на 3',
          why: 'То же правило — каждый элемент B умножается на 3.',
          formula: (
            <F tex="3B = 3 \cdot \begin{pmatrix} 1 & 5 \\ -2 & 0 \end{pmatrix} = \begin{pmatrix} 3 & 15 \\ -6 & 0 \end{pmatrix}" />
          ),
        },
        {
          what: 'Вычитаем 2A − 3B',
          why: 'Вычитание — это поэлементная операция. Из каждого элемента 2A вычитаем соответствующий элемент 3B. Знак «минус» стоит перед всей матрицей 3B, поэтому вычитаем каждый её элемент.',
          formula: (
            <div>
              <F tex="2A - 3B = \begin{pmatrix} 6-3 & -2-15 \\ 0-(-6) & 8-0 \end{pmatrix} = \begin{pmatrix} 3 & -17 \\ 6 & 8 \end{pmatrix}" />
            </div>
          ),
        },
      ],
    },

    // ── Пример 2: B = (3A)ᵀ ───────────────────────────────────────────────
    {
      id: 'w2',
      title: 'Транспонирование произведения матрицы на скаляр',
      level: 'базовый',
      timeMin: 5,
      given: (
        <div>
          <M tex="A = \begin{pmatrix} 2 & 1 & 0 \\ -1 & 3 & 4 \end{pmatrix}" />
        </div>
      ),
      find: <span>Матрицу <M tex="B = (3A)^\top" /></span>,
      answer: <M tex="B = \begin{pmatrix} 6 & -3 \\ 3 & 9 \\ 0 & 12 \end{pmatrix}" />,
      checkpoint: 'Свойство (λA)ᵀ = λAᵀ означает, что скаляр можно выносить из-под знака транспонирования. Этим можно пользоваться для упрощения: сначала транспонировать, потом умножить.',
      steps: [
        {
          what: 'Определяем размер A',
          why: 'Нужно знать размер, чтобы понять, что произойдёт после транспонирования. Строки и столбцы поменяются местами.',
          formula: (
            <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
              A имеет размер 2×3 (2 строки, 3 столбца). После транспонирования получим 3×2.
            </p>
          ),
        },
        {
          what: 'Умножаем A на скаляр 3',
          why: 'Каждый элемент матрицы A умножается на 3. Это первое действие, результат — матрица 3A того же размера 2×3.',
          formula: (
            <F tex="3A = \begin{pmatrix} 6 & 3 & 0 \\ -3 & 9 & 12 \end{pmatrix}" />
          ),
        },
        {
          what: 'Транспонируем 3A',
          why: 'При транспонировании строки становятся столбцами. Первая строка 3A — это (6, 3, 0), она станет первым столбцом. Вторая строка (−3, 9, 12) — вторым столбцом. Размер меняется с 2×3 на 3×2.',
          formula: (
            <F tex="(3A)^\top = \begin{pmatrix} 6 & -3 \\ 3 & 9 \\ 0 & 12 \end{pmatrix}" />
          ),
        },
        {
          what: 'Проверяем через свойство',
          why: 'Свойство (λA)ᵀ = λAᵀ позволяет убедиться в правильности: можно сначала транспонировать A, затем умножить на 3 — результат совпадёт.',
          formula: (
            <div>
              <F tex="A^\top = \begin{pmatrix} 2 & -1 \\ 1 & 3 \\ 0 & 4 \end{pmatrix}" />
              <F tex="3A^\top = \begin{pmatrix} 6 & -3 \\ 3 & 9 \\ 0 & 12 \end{pmatrix} \checkmark" />
            </div>
          ),
        },
      ],
    },

    // ── Пример 3: C = AᵀBᵀ ────────────────────────────────────────────────
    {
      id: 'w3',
      title: 'Умножение транспонированных матриц',
      level: 'стандартный',
      timeMin: 8,
      given: (
        <div>
          <M tex="A = \begin{pmatrix} 1 & 2 \\ 0 & 1 \\ -1 & 0 \end{pmatrix}\!,\quad B = \begin{pmatrix} 2 & 0 & 1 \\ -1 & 1 & 0 \end{pmatrix}" />
        </div>
      ),
      find: <span>Матрицу <M tex="C = A^\top B^\top" /></span>,
      answer: <M tex="C = \begin{pmatrix} 1 & -1 \\ 4 & -1 \end{pmatrix}" />,
      checkpoint: 'Свойство AᵀBᵀ = (BA)ᵀ позволяет избежать лишней работы: вместо транспонирования двух матриц и их умножения достаточно перемножить исходные матрицы в обратном порядке, а затем транспонировать один раз.',
      steps: [
        {
          what: 'Анализируем размеры',
          why: 'Нужно убедиться, что умножение AᵀBᵀ вообще возможно: число столбцов Aᵀ должно равняться числу строк Bᵀ.',
          formula: (
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.8 }}>
              <p style={{ margin: '0 0 4px' }}>A: 3×2 → Aᵀ: 2×3</p>
              <p style={{ margin: '0 0 4px' }}>B: 2×3 → Bᵀ: 3×2</p>
              <p style={{ margin: 0 }}>Aᵀ(2×3) · Bᵀ(3×2): столбцов у Aᵀ = 3 = строкам Bᵀ. Результат — матрица 2×2.</p>
            </div>
          ),
        },
        {
          what: 'Применяем свойство AᵀBᵀ = (BA)ᵀ',
          why: 'Это частный случай общего свойства (MN)ᵀ = NᵀMᵀ. Выгода в том, что вместо двух транспонирований и умножения 2×3 на 3×2 делаем умножение 2×3 на 3×2 в другом порядке (B·A) и одно транспонирование.',
          formula: (
            <F tex="A^\top B^\top = (BA)^\top" />
          ),
        },
        {
          what: 'Вычисляем D = BA',
          why: 'B имеет размер 2×3, A — 3×2. Умножение определено, результат 2×2. Каждый элемент cᵢⱼ = скалярное произведение строки i матрицы B на столбец j матрицы A.',
          formula: (
            <div>
              <F tex="d_{11} = 2{\cdot}1 + 0{\cdot}0 + 1{\cdot}(-1) = 1" />
              <F tex="d_{12} = 2{\cdot}2 + 0{\cdot}1 + 1{\cdot}0 = 4" />
              <F tex="d_{21} = (-1){\cdot}1 + 1{\cdot}0 + 0{\cdot}(-1) = -1" />
              <F tex="d_{22} = (-1){\cdot}2 + 1{\cdot}1 + 0{\cdot}0 = -1" />
              <F tex="D = BA = \begin{pmatrix} 1 & 4 \\ -1 & -1 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Транспонируем результат',
          why: 'По формуле C = (BA)ᵀ. При транспонировании строки становятся столбцами: строка [1, 4] → столбец [1, 4]ᵀ.',
          formula: (
            <F tex="C = D^\top = \begin{pmatrix} 1 & -1 \\ 4 & -1 \end{pmatrix}" />
          ),
        },
      ],
    },

    // ── Пример 4: 2X + A = X + B ──────────────────────────────────────────
    {
      id: 'w4',
      title: 'Матричное уравнение — выразить X',
      level: 'стандартный',
      timeMin: 7,
      given: (
        <div>
          <M tex="A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix},\quad B = \begin{pmatrix} 3 & 0 \\ 1 & -1 \end{pmatrix}" />
        </div>
      ),
      find: <span>Матрицу <M tex="X" /> из уравнения <M tex="2X + A = X + B" /></span>,
      answer: <M tex="X = \begin{pmatrix} 1 & -1 \\ 0 & -3 \end{pmatrix}" />,
      checkpoint: 'Линейные матричные уравнения решаются теми же алгебраическими приёмами, что и обычные — переносом слагаемых, приведением подобных. Единственное требование: все операции должны быть определены (матрицы одного размера).',
      steps: [
        {
          what: 'Анализируем уравнение',
          why: 'Все матрицы квадратные порядка 2 — операции сложения и вычитания определены. X — неизвестная матрица того же размера 2×2.',
          formula: (
            <F tex="2X + A = X + B, \quad X \in \mathbb{R}^{2 \times 2}" />
          ),
        },
        {
          what: 'Переносим слагаемые с X в одну сторону',
          why: 'Перенос работает так же, как в обычных уравнениях: X из правой части переносим в левую со знаком «минус», A из левой — в правую.',
          formula: (
            <F tex="2X - X = B - A" />
          ),
        },
        {
          what: 'Упрощаем: 2X − X = X',
          why: 'По свойству дистрибутивности: 2X − X = (2−1)X = X. Уравнение принимает простой вид.',
          formula: (
            <F tex="X = B - A" />
          ),
        },
        {
          what: 'Вычисляем B − A поэлементно',
          why: 'Вычитание матриц — поэлементная операция. Из каждого элемента B вычитаем соответствующий элемент A.',
          formula: (
            <F tex="X = B - A = \begin{pmatrix} 3-2 & 0-1 \\ 1-1 & -1-2 \end{pmatrix} = \begin{pmatrix} 1 & -1 \\ 0 & -3 \end{pmatrix}" />
          ),
        },
        {
          what: 'Проверяем подстановкой',
          why: 'Подставляем найденное X в исходное уравнение и проверяем, что левая и правая части совпадают.',
          formula: (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Левая часть:</p>
              <F tex="2X + A = \begin{pmatrix} 2 & -2 \\ 0 & -6 \end{pmatrix} + \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix} = \begin{pmatrix} 4 & -1 \\ 1 & -4 \end{pmatrix}" />
              <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>Правая часть:</p>
              <F tex="X + B = \begin{pmatrix} 1 & -1 \\ 0 & -3 \end{pmatrix} + \begin{pmatrix} 3 & 0 \\ 1 & -1 \end{pmatrix} = \begin{pmatrix} 4 & -1 \\ 1 & -4 \end{pmatrix} \checkmark" />
            </div>
          ),
        },
      ],
    },

    // ── Пример 5: (AXB)ᵀ = D → X = A⁻¹DᵀB⁻¹ ─────────────────────────────
    {
      id: 'w5',
      title: 'Матричное уравнение с обратными матрицами и транспонированием',
      level: 'продвинутый',
      timeMin: 15,
      given: (
        <div>
          <M tex="A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix},\; B = \begin{pmatrix} 2 & 1 \\ 0 & -1 \end{pmatrix},\; D = \begin{pmatrix} 5 & 1 \\ -2 & 3 \end{pmatrix}" />
        </div>
      ),
      find: <span>Матрицу <M tex="X" /> из уравнения <M tex="(AXB)^\top = D" /></span>,
      answer: <M tex="X = \begin{pmatrix} -4.5 & -11.5 \\ 3.5 & 8 \end{pmatrix}" />,
      checkpoint: 'Ключ к задаче — три шага: (1) снять транспонирование через свойство (Mᵀ)ᵀ = M; (2) изолировать X умножением на обратные матрицы строго с нужных сторон; (3) не забыть, что порядок матриц при умножении нельзя менять.',
      steps: [
        {
          what: 'Проверяем согласованность размеров',
          why: 'Перед решением важно убедиться, что задача вообще имеет решение. AXB должно иметь тот же размер, что D, чтобы уравнение (AXB)ᵀ = D было корректным.',
          formula: (
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.8 }}>
              <p style={{ margin: '0 0 4px' }}>A: 2×2, B: 2×2 → X должна быть 2×2, тогда AXB: 2×2.</p>
              <p style={{ margin: 0 }}>D: 2×2. После транспонирования (AXB)ᵀ — тоже 2×2. Размеры согласованы.</p>
            </div>
          ),
        },
        {
          what: 'Снимаем транспонирование',
          why: 'Транспонируем обе части уравнения. По свойству (Mᵀ)ᵀ = M, левая часть упрощается до AXB.',
          formula: (
            <div>
              <F tex="(AXB)^\top = D \;\Rightarrow\; AXB = D^\top" />
              <F tex="D^\top = \begin{pmatrix} 5 & -2 \\ 1 & 3 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Выражаем X через обратные матрицы',
          why: 'Чтобы убрать A слева, умножаем уравнение слева на A⁻¹. Чтобы убрать B справа, умножаем справа на B⁻¹. Порядок критически важен: матричное умножение некоммутативно.',
          formula: (
            <div>
              <F tex="A^{-1}(AXB) = A^{-1}D^\top \;\Rightarrow\; XB = A^{-1}D^\top" />
              <F tex="(XB)B^{-1} = A^{-1}D^\top B^{-1} \;\Rightarrow\; X = A^{-1}D^\top B^{-1}" />
            </div>
          ),
        },
        {
          what: 'Находим A⁻¹',
          why: 'Для матрицы 2×2 используем формулу: A⁻¹ = (1/det A)·[[d,−b],[−c,a]]. Сначала вычисляем det A, затем переставляем/меняем знаки элементов.',
          formula: (
            <div>
              <F tex="\det A = 1 \cdot 4 - 2 \cdot 3 = -2" />
              <F tex="A^{-1} = \frac{1}{-2}\begin{pmatrix} 4 & -2 \\ -3 & 1 \end{pmatrix} = \begin{pmatrix} -2 & 1 \\ 1.5 & -0.5 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Находим B⁻¹',
          why: 'Та же формула для 2×2. Вычисляем det B, строим обратную матрицу.',
          formula: (
            <div>
              <F tex="\det B = 2 \cdot (-1) - 1 \cdot 0 = -2" />
              <F tex="B^{-1} = \frac{1}{-2}\begin{pmatrix} -1 & -1 \\ 0 & 2 \end{pmatrix} = \begin{pmatrix} 0.5 & 0.5 \\ 0 & -1 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Вычисляем A⁻¹Dᵀ',
          why: 'Поочерёдно выполняем умножения в формуле X = A⁻¹DᵀB⁻¹. Начинаем с левой пары: A⁻¹ умножаем на Dᵀ.',
          formula: (
            <div>
              <F tex="A^{-1}D^\top = \begin{pmatrix} -2 & 1 \\ 1.5 & -0.5 \end{pmatrix}\begin{pmatrix} 5 & -2 \\ 1 & 3 \end{pmatrix}" />
              <F tex="= \begin{pmatrix} -10+1 & 4+3 \\ 7.5-0.5 & -3-1.5 \end{pmatrix} = \begin{pmatrix} -9 & 7 \\ 7 & -4.5 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Домножаем справа на B⁻¹',
          why: 'Завершаем вычисление: умножаем полученный промежуточный результат справа на B⁻¹.',
          formula: (
            <div>
              <F tex="X = \begin{pmatrix} -9 & 7 \\ 7 & -4.5 \end{pmatrix}\begin{pmatrix} 0.5 & 0.5 \\ 0 & -1 \end{pmatrix}" />
              <F tex="= \begin{pmatrix} -4.5 & -4.5-7 \\ 3.5 & 3.5+4.5 \end{pmatrix} = \begin{pmatrix} -4.5 & -11.5 \\ 3.5 & 8 \end{pmatrix}" />
            </div>
          ),
        },
        {
          what: 'Краткая проверка одного элемента',
          why: 'Полная проверка трудоёмка, но можно убедиться в правильности хотя бы для элемента (1,1) итогового AXB: он должен совпасть с соответствующим элементом Dᵀ.',
          formula: (
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.75 }}>
              <p style={{ margin: '0 0 4px' }}>AX = [[1,2],[3,4]]·[[-4.5,-11.5],[3.5,8]]</p>
              <p style={{ margin: '0 0 4px' }}>(AX)₁₁ = 1·(-4.5) + 2·3.5 = 2.5</p>
              <p style={{ margin: '0 0 4px' }}>(AXB)₁₁ = 2.5·2 + (-4.5)·0 = 5 = (Dᵀ)₁₁ ✓</p>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {examples.map((ex, i) => (
          <WorkedCard
            key={ex.id}
            ex={ex}
            index={i}
            onGoTheory={onGoTheory ?? (() => {})}
          />
        ))}
      </div>

      {onGoPractice && (
        <div style={{ marginTop: 32, borderRadius: 24, background: '#0f172a', color: T.white, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#34d399', textTransform: 'uppercase', marginBottom: 6 }}>Разборы пройдены</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Готов решать самостоятельно?</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Пять задач с AI-проверкой и подсказками.</div>
          </div>
          <button
            onClick={onGoPractice}
            style={{ background: T.white, color: '#0f172a', padding: '12px 22px', borderRadius: 14, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            К практике <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
