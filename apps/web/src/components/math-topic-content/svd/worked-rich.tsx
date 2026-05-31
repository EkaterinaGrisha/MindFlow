// @ts-nocheck
import { useState } from 'react';
import {
  ArrowRight, BarChart3, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp,
  Clock, Eye, EyeOff, Lightbulb, Link2, PenTool, Play, AlertTriangle, HelpCircle,
} from 'lucide-react';
import { MarkdownRenderer } from '../../MarkdownRenderer';

const T = {
  text: '#1e293b', muted: '#64748b', mutedLight: '#94a3b8',
  primary: '#6366f1', primaryLight: '#eef2ff', primaryBorder: '#c7d2fe', primaryDark: '#4f46e5',
  accent: '#7c3aed', green: '#10b981', greenLight: '#d1fae5',
  amber: '#f59e0b', amberLight: '#fef3c7', red: '#ef4444', redLight: '#fee2e2',
  white: '#ffffff', surface: '#f8fafc', border: '#e2e8f0', cyan: '#06b6d4',
};

const LEVEL_STYLE = {
  basic: { bg: '#ecfdf5', color: '#065f46', label: 'Basic' },
  intermediate: { bg: '#eef2ff', color: '#4338ca', label: 'Intermediate' },
  advanced: { bg: '#f5f3ff', color: '#5b21b6', label: 'Advanced' },
};

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
        {open ? <ChevronUp size={16} color={T.mutedLight} style={{ marginTop: 6, flexShrink: 0 }} /> : <ChevronDown size={16} color={T.mutedLight} style={{ marginTop: 6, flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', borderTop: `1px solid ${T.border}` }}>
          <div style={{ padding: '16px 20px', background: T.surface, borderRight: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Почему так</div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{step.why}</div>
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

function GivenFind({ given, find, answer, hidden }: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, margin: '0 0 18px' }}>
      <InfoBox label="Дано" muted>{given}</InfoBox>
      <InfoBox label="Найти">{find}</InfoBox>
      <InfoBox label="Ответ" answer hidden={hidden}>{hidden ? 'Скрыто' : answer}</InfoBox>
    </div>
  );
}

function InfoBox({ label, children, muted, answer, hidden }: any) {
  return (
    <div style={{ background: muted ? T.surface : answer ? `${T.green}10` : T.white, border: `1px solid ${answer ? '#bbf7d0' : T.border}`, borderRadius: 14, padding: '14px 18px', opacity: hidden ? 0.75 : 1 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: answer ? '#047857' : T.muted, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 14, color: hidden ? T.muted : T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 18, borderRadius: 16, border: `1px dashed ${T.primaryBorder}`, background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.primary, color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Play size={15} /></div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.primaryDark }}>Видео-разбор</div>
        <div style={{ fontSize: 12, color: T.muted }}>Плейсхолдер под короткое объяснение: «{title}».</div>
      </div>
    </div>
  );
}

function NoteList({ icon: Icon, title, items, tone = 'primary' }: any) {
  const palette = tone === 'danger'
    ? { bg: T.redLight, border: '#fecaca', color: '#991b1b' }
    : tone === 'amber'
      ? { bg: T.amberLight, border: '#fde68a', color: '#92400e' }
      : { bg: T.primaryLight, border: T.primaryBorder, color: T.primaryDark };
  return (
    <div style={{ borderRadius: 14, background: palette.bg, border: `1px solid ${palette.border}`, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: palette.color, textTransform: 'uppercase', marginBottom: 8 }}>
        <Icon size={13} /> {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        {items.map((item: any, i: number) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

function WorkedCard({ ex, index, onGoTheory }: any) {
  const [hidden, setHidden] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const lvl = LEVEL_STYLE[ex.level] ?? LEVEL_STYLE.intermediate;
  function toggle(i: number) { setExpanded(s => ({ ...s, [i]: !s[i] })); }

  return (
    <article style={{ background: T.white, borderRadius: 24, border: `1px solid ${T.border}`, padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.mutedLight, textTransform: 'uppercase' }}>Разбор №{index + 1}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: lvl.color, background: lvl.bg, padding: '2px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}><BarChart3 size={9} /> {lvl.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, background: T.surface, padding: '2px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={9} /> ≈{ex.timeMin} мин</span>
            <button onClick={onGoTheory} style={{ fontSize: 11, fontWeight: 700, color: T.primary, background: T.primaryLight, border: 'none', padding: '2px 10px', borderRadius: 20, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Link2 size={9} /> К теории</button>
          </div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: T.text, lineHeight: 1.3 }}>{ex.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => { setHidden(h => !h); setAllOpen(false); }} style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 12, border: `1px solid ${hidden ? '#fde68a' : T.border}`, background: hidden ? T.amberLight : T.white, color: hidden ? '#92400e' : T.muted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {hidden ? <EyeOff size={12} /> : <Eye size={12} />} {hidden ? 'Решаю сам' : 'Скрыть'}
          </button>
          {!hidden && <button onClick={() => setAllOpen(v => !v)} style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.white, color: T.muted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{allOpen ? <ChevronsUp size={12} /> : <ChevronsDown size={12} />} {allOpen ? 'Свернуть' : 'Все шаги'}</button>}
        </div>
      </div>

      <div style={{ borderRadius: 14, background: `${T.cyan}10`, border: `1px solid ${T.cyan}33`, padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#0e7490', textTransform: 'uppercase', marginBottom: 5 }}>Big Idea</div>
        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{ex.idea}</div>
      </div>

      <GivenFind given={ex.given} find={ex.find} answer={ex.answer} hidden={hidden} />
      <VideoPlaceholder title={ex.title} />

      {!hidden ? (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Решение пошагово</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ex.steps.map((s: any, i: number) => <StepCard key={i} step={s} idx={i} total={ex.steps.length} expanded={!!expanded[i]} onToggle={() => toggle(i)} expandedAll={allOpen} />)}
          </div>
          {ex.checkpoint && (
            <div style={{ marginTop: 14, borderRadius: 14, background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, padding: '14px 18px', display: 'flex', gap: 10 }}>
              <Lightbulb size={15} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
              <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.primaryDark, textTransform: 'uppercase', marginBottom: 4 }}>Чек-поинт</div><div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{ex.checkpoint}</div></div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 14 }}>
            <NoteList icon={HelpCircle} title="Подсказки" items={ex.hints} tone="amber" />
            <NoteList icon={AlertTriangle} title="Типовые ошибки" items={ex.mistakes} tone="danger" />
          </div>
          {ex.related && <div style={{ marginTop: 12, fontSize: 12, color: T.muted }}>Связанные задачи: {ex.related}</div>}
        </>
      ) : (
        <div style={{ borderRadius: 14, background: T.amberLight, border: `1px solid #fde68a`, padding: '14px 18px', fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>Попробуй решить самостоятельно. Когда будешь готов — выключи «Скрыть», чтобы сверить решение.</div>
      )}
    </article>
  );
}

export default function SVDWorkedRich({ onGoTheory, onGoPractice }: { onGoTheory?: () => void; onGoPractice?: () => void }) {
  const examples = [
    {
      id: 'svd-w1', title: 'Узнать компоненты SVD по готовому разложению', level: 'basic', timeMin: 6,
      idea: <span>Когда SVD уже дано как <M tex="A=U\Sigma V^T" />, все компоненты видны напрямую. Главное — не перепутать <M tex="V" /> и <M tex="V^T" />: правые сингулярные векторы — столбцы <M tex="V" />, а не столбцы третьей матрицы.</span>,
      given: <F tex="A=\begin{pmatrix}\frac1{\sqrt2}&\frac1{\sqrt2}\\\frac1{\sqrt2}&-\frac1{\sqrt2}\end{pmatrix}\begin{pmatrix}4&0\\0&1\end{pmatrix}\begin{pmatrix}\frac35&\frac45\\-\frac45&\frac35\end{pmatrix}" />,
      find: <span>а) <M tex="\sigma_i" />; б) <M tex="u_i" />; в) <M tex="v_i" />; г) <M tex="\operatorname{rank}(A)" /></span>,
      answer: <div><M tex="\sigma_1=4,\ \sigma_2=1" />; <M tex="u_1=\frac1{\sqrt2}(1,1)^T,\ u_2=\frac1{\sqrt2}(1,-1)^T" />; <M tex="v_1=(\frac35,\frac45)^T,\ v_2=(-\frac45,\frac35)^T" />; ранг = 2.</div>,
      checkpoint: 'Третья матрица в записи — это Vᵀ. Чтобы получить правые сингулярные векторы, нужно транспонировать её и взять столбцы V.',
      steps: [
        { what: 'Определяем Σ', why: 'Матрица Σ всегда стоит посередине и диагональна.', formula: <F tex="\Sigma=\begin{pmatrix}4&0\\0&1\end{pmatrix}" /> },
        { what: 'Считываем сингулярные числа', why: 'Сингулярные числа — диагональные элементы Σ, обычно записанные по убыванию.', formula: <FBox tex="\sigma_1=4,\qquad \sigma_2=1" /> },
        { what: 'Считываем U и левые сингулярные векторы', why: 'U — первая матрица в произведении. Её столбцы являются левыми сингулярными векторами.', formula: <F tex="u_1=\begin{pmatrix}1/\sqrt2\\1/\sqrt2\end{pmatrix},\qquad u_2=\begin{pmatrix}1/\sqrt2\\-1/\sqrt2\end{pmatrix}" /> },
        { what: 'Аккуратно находим V из Vᵀ', why: 'Третья матрица — именно Vᵀ. Правые сингулярные векторы живут в столбцах V, поэтому транспонируем.', formula: <F tex="V=(V^T)^T=\begin{pmatrix}\frac35&-\frac45\\\frac45&\frac35\end{pmatrix}" /> },
        { what: 'Выписываем правые сингулярные векторы', why: 'Берём столбцы V и можно быстро проверить ортогональность: v₁ᵀv₂ = −12/25 + 12/25 = 0.', formula: <F tex="v_1=\begin{pmatrix}3/5\\4/5\end{pmatrix},\qquad v_2=\begin{pmatrix}-4/5\\3/5\end{pmatrix}" /> },
        { what: 'Находим ранг', why: 'Ранг равен числу ненулевых сингулярных чисел. Здесь оба σ положительны.', formula: <FBox tex="\operatorname{rank}(A)=2" /> },
      ],
      hints: ['U — первая матрица, Σ — вторая, Vᵀ — третья.', 'Чтобы получить правые сингулярные векторы, транспонируйте Vᵀ.', 'Нет нулевых σ, значит ранг равен 2.'],
      mistakes: ['Взять столбцы Vᵀ вместо столбцов V.', 'Перепутать U и V местами.', 'Забыть, что ранг — число ненулевых сингулярных чисел.'],
      related: 'Разбор №2 (найти A по SVD), Разбор №3 (вычисление SVD).',
    },
    {
      id: 'svd-w2', title: 'Восстановить матрицу по её SVD', level: 'basic', timeMin: 5,
      idea: <span>SVD — это произведение трёх матриц. Если даны <M tex="U,\Sigma,V" />, восстанавливаем <M tex="A=U\Sigma V^T" />. Спектральная норма — <M tex="\sigma_1" />, ранг — число ненулевых <M tex="\sigma_i" />.</span>,
      given: <div><F tex="\Sigma=\begin{pmatrix}3&0\\0&2\end{pmatrix},\qquad V=\begin{pmatrix}1&0\\0&1\end{pmatrix},\qquad U=\begin{pmatrix}0&1\\1&0\end{pmatrix}" /></div>,
      find: <span>Матрицу <M tex="A" />; проверить <M tex="\|A\|_2=3" /> и <M tex="\operatorname{rank}(A)=2" />.</span>,
      answer: <div><M tex="A=\begin{pmatrix}0&2\\3&0\end{pmatrix}" />, <M tex="\|A\|_2=3" />, <M tex="\operatorname{rank}(A)=2" />.</div>,
      checkpoint: 'Порядок умножения важен: UΣVᵀ. Здесь V = I, поэтому Vᵀ = I и задача сводится к UΣ.',
      steps: [
        { what: 'Определяем Vᵀ', why: 'V — единичная матрица, транспонирование её не меняет.', formula: <F tex="V^T=I=\begin{pmatrix}1&0\\0&1\end{pmatrix}" /> },
        { what: 'Вычисляем ΣVᵀ', why: 'Умножение на единичную матрицу ничего не меняет.', formula: <F tex="\Sigma V^T=\begin{pmatrix}3&0\\0&2\end{pmatrix}" /> },
        { what: 'Умножаем слева на U', why: 'Матрица U переставляет строки: первая строка результата становится второй строкой Σ, а вторая — первой.', formula: <F tex="A=U\Sigma=\begin{pmatrix}0&1\\1&0\end{pmatrix}\begin{pmatrix}3&0\\0&2\end{pmatrix}=\begin{pmatrix}0&2\\3&0\end{pmatrix}" /> },
        { what: 'Проверяем спектральную норму', why: 'Спектральная норма матрицы равна максимальному сингулярному числу.', formula: <FBox tex="\|A\|_2=\sigma_1=3" /> },
        { what: 'Проверяем ранг', why: 'Оба сингулярных числа ненулевые: 3 и 2.', formula: <FBox tex="\operatorname{rank}(A)=2" /> },
      ],
      hints: ['Перемножайте UΣVᵀ в правильном порядке.', 'V = I, значит Vᵀ = I и ΣVᵀ = Σ.', 'Норма ‖A‖₂ — это σ₁, а не максимальный элемент матрицы в общем случае.'],
      mistakes: ['Перемножить матрицы в порядке ΣUVᵀ или VΣUᵀ.', 'Забыть транспонировать V в общей формуле.', 'Спутать спектральную норму с нормой Фробениуса.'],
      related: 'Разбор №1 (чтение SVD), Разбор №4 (SVD и нормы).',
    },
    {
      id: 'svd-w3', title: 'Вычисление SVD для диагональной матрицы с минусом', level: 'intermediate', timeMin: 8,
      idea: <span>Для диагональной матрицы SVD почти готово, но сингулярные числа всегда неотрицательны. Минус в <M tex="-3" /> должен перейти в один из сингулярных векторов.</span>,
      given: <F tex="A=\begin{pmatrix}5&0\\0&-3\end{pmatrix}" />,
      find: <span>Найти <M tex="U,\Sigma,V" /> такие, что <M tex="A=U\Sigma V^T" />.</span>,
      answer: <div><M tex="U=\begin{pmatrix}1&0\\0&-1\end{pmatrix}" />, <M tex="\Sigma=\begin{pmatrix}5&0\\0&3\end{pmatrix}" />, <M tex="V=I" />.</div>,
      checkpoint: 'Сингулярные числа — это 5 и 3, а не 5 и −3. Отрицательный знак забирает u₂ = (0, −1)ᵀ.',
      steps: [
        { what: 'Считаем AᵀA', why: 'Матрица A диагональна и симметрична, поэтому AᵀA = A².', formula: <F tex="A^TA=\begin{pmatrix}25&0\\0&9\end{pmatrix}" /> },
        { what: 'Находим сингулярные числа', why: 'Собственные значения AᵀA равны 25 и 9, а σᵢ = √λᵢ.', formula: <FBox tex="\sigma_1=5,\qquad \sigma_2=3" /> },
        { what: 'Берём правые сингулярные векторы', why: 'Для диагональной AᵀA собственные векторы — стандартный базис.', formula: <F tex="v_1=\begin{pmatrix}1\\0\end{pmatrix},\qquad v_2=\begin{pmatrix}0\\1\end{pmatrix},\qquad V=I" /> },
        { what: 'Считаем u₁ через Av₁/σ₁', why: 'Для ненулевых σ работает формула uᵢ = Avᵢ/σᵢ.', formula: <F tex="u_1=\frac15A v_1=\frac15\begin{pmatrix}5\\0\end{pmatrix}=\begin{pmatrix}1\\0\end{pmatrix}" /> },
        { what: 'Считаем u₂ и переносим минус', why: 'Второй диагональный элемент A отрицателен, поэтому Av₂ направлен вниз. Минус уходит в u₂, а σ₂ остаётся положительным.', formula: <F tex="u_2=\frac13A v_2=\frac13\begin{pmatrix}0\\-3\end{pmatrix}=\begin{pmatrix}0\\-1\end{pmatrix}" /> },
        { what: 'Собираем SVD и проверяем', why: 'Проверка Avᵢ = σᵢuᵢ подтверждает выбранные знаки.', formula: <FBox tex="U=\begin{pmatrix}1&0\\0&-1\end{pmatrix},\quad \Sigma=\begin{pmatrix}5&0\\0&3\end{pmatrix},\quad V=I" /> },
      ],
      hints: ['Сингулярные числа не бывают отрицательными.', 'Если на диагонали есть минус — он уходит в U или V.', 'Проверьте Av₂ = σ₂u₂.'],
      mistakes: ['Написать Σ с элементом −3.', 'Решить, что U = I только потому, что A диагональна.', 'Ошибиться в знаке u₂.'],
      related: 'Разбор №5 (SVD для матрицы с ядром), тема «Спектральное разложение vs SVD».',
    },
    {
      id: 'svd-w4', title: 'Нормы через сингулярные числа', level: 'intermediate', timeMin: 6,
      idea: <span>Спектральная норма, норма Фробениуса, ранг и число обусловленности читаются напрямую из сингулярных чисел — сама матрица не нужна.</span>,
      given: <span>Сингулярные числа матрицы <M tex="A\in\mathbb{R}^{3\times 3}" />: <M tex="\sigma_1=10,\ \sigma_2=4,\ \sigma_3=0" />.</span>,
      find: <span>а) <M tex="\|A\|_2" />; б) <M tex="\|A\|_F" />; в) <M tex="\operatorname{rank}(A)" />; г) <M tex="\kappa(A)" />.</span>,
      answer: <div><M tex="\|A\|_2=10" />; <M tex="\|A\|_F=\sqrt{116}=2\sqrt{29}\approx10.77" />; <M tex="\operatorname{rank}(A)=2" />; <M tex="\kappa(A)=\infty" />.</div>,
      checkpoint: 'Нулевое сингулярное число означает вырожденность: ранг меньше 3, а число обусловленности бесконечно.',
      steps: [
        { what: 'Находим спектральную норму', why: 'По определению ‖A‖₂ — максимальное сингулярное число.', formula: <FBox tex="\|A\|_2=\sigma_1=10" /> },
        { what: 'Находим норму Фробениуса', why: 'Норма Фробениуса равна корню из суммы квадратов всех сингулярных чисел.', formula: <F tex="\|A\|_F=\sqrt{10^2+4^2+0^2}=\sqrt{116}=2\sqrt{29}\approx10.77" /> },
        { what: 'Находим ранг', why: 'Ранг равен числу ненулевых сингулярных чисел.', formula: <FBox tex="\operatorname{rank}(A)=2" /> },
        { what: 'Находим число обусловленности', why: 'Для квадратной матрицы κ = σmax/σmin. Здесь σmin = 0, значит матрица вырождена.', formula: <FBox tex="\kappa(A)=\frac{10}{0}=\infty" hint="Бесконечная обусловленность: задача Ax=b неустойчива или не имеет единственного решения." /> },
      ],
      hints: ['‖A‖₂ = σ₁.', '‖A‖F = √(σ₁² + σ₂² + σ₃²).', 'Если среди σ есть ноль, квадратная матрица вырождена.'],
      mistakes: ['Спутать ‖A‖₂ и ‖A‖F.', 'Сложить 10 + 4 вместо квадратов 10² + 4².', 'Написать κ = 0 для вырожденной матрицы.'],
      related: 'Разбор №3 (вычисление SVD), тема «Число обусловленности».',
    },
    {
      id: 'svd-w5', title: 'SVD для матрицы с ядром (ранг 1)', level: 'advanced', timeMin: 14,
      idea: <span>Матрица <M tex="3\times2" /> имеет пропорциональные столбцы, значит ранг равен 1: только <M tex="\sigma_1>0" />, а <M tex="\sigma_2=0" />. Нулевой σ задаёт ядро, а U нужно дополнить до ортонормированного базиса.</span>,
      given: <F tex="A=\begin{pmatrix}2&1\\4&2\\0&0\end{pmatrix}" />,
      find: <span>Найти полное SVD матрицы <M tex="A" />.</span>,
      answer: <div><M tex="\Sigma=\begin{pmatrix}5&0\\0&0\\0&0\end{pmatrix}" />, <M tex="V=\frac1{\sqrt5}\begin{pmatrix}2&1\\1&-2\end{pmatrix}" />, <M tex="U=\begin{pmatrix}1/\sqrt5&-2/\sqrt5&0\\2/\sqrt5&1/\sqrt5&0\\0&0&1\end{pmatrix}" />.</div>,
      checkpoint: 'Для σ₂ = 0 нельзя считать u₂ = Av₂/0. Векторы u₂ и u₃ выбираются как любое ортонормированное дополнение к u₁.',
      steps: [
        { what: 'Замечаем ранг 1', why: 'Второй столбец равен половине первого: (1,2,0)ᵀ = 1/2·(2,4,0)ᵀ. Поэтому независимый столбец только один.', formula: <FBox tex="\operatorname{rank}(A)=1" /> },
        { what: 'Считаем AᵀA', why: 'Правые сингулярные векторы — собственные векторы AᵀA.', formula: <F tex="A^TA=\begin{pmatrix}20&10\\10&5\end{pmatrix}" /> },
        { what: 'Находим собственные значения и σ', why: 'Характеристический многочлен λ(λ−25), поэтому λ₁ = 25, λ₂ = 0.', formula: <FBox tex="\sigma_1=\sqrt{25}=5,\qquad \sigma_2=0" /> },
        { what: 'Находим v₁ для λ₁ = 25', why: 'Из (AᵀA−25I)v=0 получаем x₁ = 2x₂. Нормируем вектор (2,1).', formula: <F tex="v_1=\frac1{\sqrt5}\begin{pmatrix}2\\1\end{pmatrix}" /> },
        { what: 'Находим v₂ из ядра', why: 'Для λ₂ = 0 получаем 2x₁ + x₂ = 0. Берём вектор (1,−2), ортогональный v₁.', formula: <F tex="v_2=\frac1{\sqrt5}\begin{pmatrix}1\\-2\end{pmatrix},\qquad V=\frac1{\sqrt5}\begin{pmatrix}2&1\\1&-2\end{pmatrix}" /> },
        { what: 'Считаем u₁', why: 'Для единственного ненулевого σ используем формулу u₁ = Av₁/σ₁.', formula: <F tex="u_1=\frac15A\frac1{\sqrt5}\begin{pmatrix}2\\1\end{pmatrix}=\frac1{\sqrt5}\begin{pmatrix}1\\2\\0\end{pmatrix}" /> },
        { what: 'Дополняем U до ортонормированного базиса', why: 'u₂ и u₃ должны быть ортонормированы и ортогональны u₁. Удобный выбор: один вектор в плоскости xy и один по оси z.', formula: <F tex="u_2=\frac1{\sqrt5}\begin{pmatrix}-2\\1\\0\end{pmatrix},\qquad u_3=\begin{pmatrix}0\\0\\1\end{pmatrix}" /> },
        { what: 'Собираем полное SVD', why: 'Σ имеет тот же размер, что и A: 3×2. U — 3×3, V — 2×2.', formula: <FBox tex="U=\begin{pmatrix}1/\sqrt5&-2/\sqrt5&0\\2/\sqrt5&1/\sqrt5&0\\0&0&1\end{pmatrix},\quad \Sigma=\begin{pmatrix}5&0\\0&0\\0&0\end{pmatrix}" /> },
        { what: 'Проверяем действие на v₁ и v₂', why: 'Ненулевой правый вектор переходит в 5u₁, а вектор ядра зануляется.', formula: <F tex="Av_1=5u_1,\qquad Av_2=0" /> },
      ],
      hints: ['Столбцы пропорциональны, поэтому ранг = 1.', 'AᵀA = [[20,10],[10,5]], его λ: 25 и 0.', 'v₂ — в ядре A; u₂ и u₃ выбираются как ортонормированное дополнение.'],
      mistakes: ['Сделать Σ размера 2×2 вместо 3×2.', 'Пытаться вычислять u₂ = Av₂/0.', 'Не дополнить U до квадратной матрицы 3×3.', 'Не проверить, что Av₂ = 0.'],
      related: 'Часть 2 «SVD и низкоранговая аппроксимация», тема «Псевдообращение».',
    },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: T.white, borderRadius: 24, border: `1px solid ${T.border}`, padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 16, background: T.primaryLight, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PenTool size={20} /></div>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: T.text }}>Разборы задач: SVD — часть 1</h2>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
              Формат как в теме «Ранг и базис»: <strong>Дано → Найти → Ответ</strong>, Big Idea, пошаговое решение, подсказки и типовые ошибки. В фокусе — чтение SVD, восстановление матрицы, ручной расчёт и свойства через сингулярные числа.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {examples.map((ex, i) => <WorkedCard key={ex.id} ex={ex} index={i} onGoTheory={onGoTheory ?? (() => {})} />)}
      </div>

      <div style={{ marginTop: 28, borderRadius: 24, background: '#0f172a', color: T.white, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#34d399', textTransform: 'uppercase', marginBottom: 6 }}>Разборы пройдены</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Готов решать сам? Открой тренажёр.</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Практика закрепит чтение SVD, нормы, ранг и работу с нулевыми сингулярными числами.</div>
        </div>
        <button onClick={onGoPractice ?? (() => {})} style={{ background: T.white, color: '#0f172a', padding: '12px 24px', borderRadius: 16, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          К практике <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
