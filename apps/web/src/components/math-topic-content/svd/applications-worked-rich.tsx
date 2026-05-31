// @ts-nocheck
import { useState } from 'react';
import {
  ArrowRight, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp,
  Clock, Eye, EyeOff, HelpCircle, Lightbulb, Link2, PenTool, Play, AlertTriangle,
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

function FBox({ tex, hint, color = T.primary }: { tex: string; hint?: string; color?: string }) {
  return (
    <div style={{ background: color === T.primary ? T.primaryLight : `${color}12`, border: `1px solid ${color === T.primary ? T.primaryBorder : `${color}40`}`, borderRadius: 12, padding: '14px 18px', margin: '8px 0', textAlign: 'center' }}>
      <MarkdownRenderer content={`$$${tex}$$`} />
      {hint && <div style={{ fontSize: 12, color, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
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

function InfoBox({ label, children, muted, answer, hidden }: any) {
  return (
    <div style={{ background: muted ? T.surface : answer ? `${T.green}10` : T.white, border: `1px solid ${answer ? '#bbf7d0' : T.border}`, borderRadius: 14, padding: '14px 18px', opacity: hidden ? 0.75 : 1 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: answer ? '#047857' : T.muted, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 14, color: hidden ? T.muted : T.text, lineHeight: 1.7 }}>{children}</div>
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

function MiniList({ icon: Icon, title, items, color }: any) {
  return (
    <div style={{ background: `${color}0d`, border: `1px solid ${color}30`, borderRadius: 14, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={15} color={color} />
        <div style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.text, lineHeight: 1.75 }}>
        {items.map((item: any, i: number) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

function WorkedCard({ ex, index, onGoTheory }: any) {
  const [hidden, setHidden] = useState(false);
  const [allOpen, setAllOpen] = useState(index === 0);
  const [expanded, setExpanded] = useState({ 0: true });
  const level = LEVEL_STYLE[ex.level];
  const toggle = (i: number) => setExpanded((prev: any) => ({ ...prev, [i]: !prev[i] }));

  return (
    <article style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 22, padding: '22px 24px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.mutedLight, textTransform: 'uppercase' }}>Разбор №{index + 1}</span>
            <span style={{ background: level.bg, color: level.color, borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 800 }}>{level.label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.muted, fontSize: 11 }}><Clock size={11} /> {ex.timeMin} мин</span>
            <button onClick={onGoTheory} style={{ fontSize: 11, fontWeight: 700, color: T.primary, background: T.primaryLight, border: 'none', padding: '2px 10px', borderRadius: 20, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Link2 size={9} /> К теории</button>
          </div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: T.text, lineHeight: 1.3 }}>{ex.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => { setHidden((h) => !h); setAllOpen(false); }} style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 12, border: `1px solid ${hidden ? '#fde68a' : T.border}`, background: hidden ? T.amberLight : T.white, color: hidden ? '#92400e' : T.muted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {hidden ? <EyeOff size={12} /> : <Eye size={12} />}{hidden ? 'Решаю сам' : 'Скрыть'}
          </button>
          {!hidden && <button onClick={() => setAllOpen((v) => !v)} style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.white, color: T.muted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{allOpen ? <ChevronsUp size={12} /> : <ChevronsDown size={12} />}{allOpen ? 'Свернуть' : 'Все шаги'}</button>}
        </div>
      </div>

      <GivenFind given={ex.given} find={ex.find} answer={ex.answer} hidden={hidden} />
      <VideoPlaceholder title={ex.title} />

      {!hidden ? (
        <>
          <div style={{ background: `${T.cyan}0d`, border: `1px solid ${T.cyan}30`, borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.cyan, textTransform: 'uppercase', marginBottom: 6 }}>Big Idea</div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{ex.bigIdea}</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Решение пошагово</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ex.steps.map((s: any, i: number) => <StepCard key={i} step={s} idx={i} total={ex.steps.length} expanded={!!expanded[i]} onToggle={() => toggle(i)} expandedAll={allOpen} />)}
          </div>
          {ex.interpretation && (
            <div style={{ marginTop: 14, borderRadius: 14, background: `${T.primary}08`, border: `1px solid ${T.primaryBorder}`, padding: '14px 18px', display: 'flex', gap: 10 }}>
              <Lightbulb size={15} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
              <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.primaryDark, textTransform: 'uppercase', marginBottom: 4 }}>Интерпретация</div><div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{ex.interpretation}</div></div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 14 }}>
            <MiniList icon={HelpCircle} title="Подсказки" color={T.green} items={ex.hints} />
            <MiniList icon={AlertTriangle} title="Типовые ошибки" color={T.red} items={ex.mistakes} />
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: T.muted, lineHeight: 1.65 }}><strong>Связанные задачи:</strong> {ex.related}</div>
        </>
      ) : (
        <div style={{ borderRadius: 14, background: T.amberLight, border: '1px solid #fde68a', padding: '14px 18px', fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>Попробуй решить самостоятельно. Когда будешь готов — выключи «Скрыть», чтобы сверить решение.</div>
      )}
    </article>
  );
}

export default function SVDApplicationsWorkedRich({ onGoTheory, onGoPractice }: { onGoTheory?: () => void; onGoPractice?: () => void }) {
  const examples = [
    {
      id: 'svd2-w1', title: 'Сжатие данных — сколько чисел мы экономим', level: 'basic', timeMin: 6,
      given: <span>Матрица <M tex="1000\times 500" />, ранг <M tex="r=100" />, приближение ранга <M tex="k=20" />.</span>,
      find: <span>Полный объём, объём <M tex="A_k=U_k\Sigma_kV_k^T" /> и коэффициент сжатия.</span>,
      answer: <span>а) 500&nbsp;000; б) 30&nbsp;020; в) примерно <M tex="16.7" /> раза.</span>,
      bigIdea: <span>SVD-приближение хранит не все <M tex="mn" /> элементов, а только <M tex="k" /> сингулярных чисел и по <M tex="k" /> левых и правых сингулярных векторов.</span>,
      steps: [
        { what: 'Считаем размер полной матрицы', why: 'Если отправлять матрицу целиком, каждый элемент хранится отдельно.', formula: <FBox tex="1000\cdot 500=500\,000" /> },
        { what: 'Раскладываем объём SVD-приближения', why: 'Храним первые k столбцов U, k диагональных сингулярных чисел и первые k столбцов V.', formula: <F tex="U_k:1000\times k,\qquad \Sigma_k:k\text{ чисел},\qquad V_k:500\times k" /> },
        { what: 'Подставляем k = 20', why: 'Размеры левых и правых векторов зависят от m и n, а диагональ Σ даёт только k чисел.', formula: <F tex="1000\cdot20+20+500\cdot20=20\,000+20+10\,000=30\,020" /> },
        { what: 'Находим коэффициент сжатия', why: 'Делим исходный объём на объём SVD-представления.', formula: <FBox tex="\frac{500\,000}{30\,020}\approx 16.7" hint="То есть примерно в 17 раз меньше чисел." /> },
      ],
      interpretation: <span>Получатель восстанавливает матрицу <M tex="A_k" /> и заранее знает ошибку: в норме Фробениуса она равна <M tex="\sqrt{\sigma_{21}^2+\cdots+\sigma_{100}^2}" />.</span>,
      hints: ['Полная матрица: m×n чисел.', 'SVD-приближение: m×k + k + n×k = k(m+n+1).', 'Для k=20 получаем 30 020 и сжатие 500 000 / 30 020.'],
      mistakes: ['Хранить V как k×n: сама матрица V_k имеет размер n×k.', 'Считать Σ_k полной k×k матрицей вместо диагонали.', 'Подставить полный ранг r=100 вместо ранга приближения k=20.'],
      related: 'Разбор №2 (ошибка приближения), лаборатория «Сжатие изображения».',
    },
    {
      id: 'svd2-w2', title: 'Ошибка низкорангового приближения', level: 'basic', timeMin: 7,
      given: <span><M tex="\sigma=(100,50,20,5,1,0,\ldots,0)" /> для матрицы <M tex="200\times200" />, нужно приближение <M tex="A_2" />.</span>,
      find: <span>Ранг, <M tex="\|A-A_2\|_F" />, <M tex="\|A-A_2\|_2" /> и долю энергии.</span>,
      answer: <span><M tex="rank(A)=5" />; <M tex="\|A-A_2\|_F=\sqrt{426}\approx20.64" />; <M tex="\|A-A_2\|_2=20" />; энергия <M tex="96.7\%" />.</span>,
      bigIdea: <span>Ошибка оптимального <M tex="A_k" /> выражается через отброшенные сингулярные числа: Фробениус — корень из суммы квадратов, спектральная норма — первое отброшенное число.</span>,
      steps: [
        { what: 'Определяем ранг', why: 'Ранг равен количеству ненулевых сингулярных чисел.', formula: <FBox tex="rank(A)=5" /> },
        { what: 'Отбрасываем хвост после k = 2', why: 'В A₂ остаются σ₁ и σ₂, а в ошибку попадают σ₃, σ₄, σ₅ и нули.', formula: <F tex="\sigma_3=20,\qquad \sigma_4=5,\qquad \sigma_5=1" /> },
        { what: 'Считаем ошибку в норме Фробениуса', why: 'По теореме Эккарта–Янга берём корень из суммы квадратов отброшенных σ.', formula: <FBox tex="\|A-A_2\|_F=\sqrt{20^2+5^2+1^2}=\sqrt{426}\approx20.64" /> },
        { what: 'Считаем ошибку в спектральной норме', why: 'Спектральная норма ошибки равна максимальному отброшенному сингулярному числу.', formula: <FBox tex="\|A-A_2\|_2=\sigma_3=20" /> },
        { what: 'Считаем долю сохранённой энергии', why: 'Энергия в PCA/SVD — это сумма квадратов сингулярных чисел.', formula: <F tex="\frac{100^2+50^2}{100^2+50^2+20^2+5^2+1^2}=\frac{12\,500}{12\,926}\approx 0.967" /> },
      ],
      interpretation: <span>Две компоненты из пяти значимых сохраняют почти 97% энергии; цена замены <M tex="A" /> на <M tex="A_2" /> — первая отброшенная компонента <M tex="\sigma_3=20" /> в спектральной норме.</span>,
      hints: ['В ранге считаются только ненулевые σᵢ.', 'Для нормы Фробениуса квадраты σ₃, σ₄, σ₅ складываются под корнем.', 'Для спектральной нормы нужна σ_{k+1}.'],
      mistakes: ['Взять σ₂=50 вместо σ₃=20 для спектральной ошибки.', 'Забыть квадраты при энергии и норме Фробениуса.', 'Считать нули как отдельный вклад: 0² ничего не добавляет.'],
      related: 'Разбор №1 (объём сжатия), Разбор №4 (выбор k).',
    },
    {
      id: 'svd2-w3', title: 'PCA через SVD — пошагово на маленькой матрице', level: 'intermediate', timeMin: 12,
      given: <div><F tex="X=\begin{pmatrix}2&0\\0&1\\-2&-1\end{pmatrix}" /><span>Данные уже центрированы: 3 объекта, 2 признака.</span></div>,
      find: <span>Первую главную компоненту и проекции объектов.</span>,
      answer: <span><M tex="v_1\approx(0.96,0.29)^T" />; проекции <M tex="Xv_1\approx(1.92,0.29,-2.21)^T" />; объяснено <M tex="\approx86\%" /> дисперсии.</span>,
      bigIdea: <span>В PCA правый сингулярный вектор <M tex="v_1" /> — направление максимальной дисперсии, а координаты объектов на этой оси равны <M tex="Xv_1=u_1\sigma_1" />.</span>,
      steps: [
        { what: 'Считаем XᵀX', why: 'Правые сингулярные векторы — собственные векторы XᵀX.', formula: <F tex="X^TX=\begin{pmatrix}8&2\\2&2\end{pmatrix}" /> },
        { what: 'Находим собственные значения', why: 'Решаем det(XᵀX−λI)=0.', formula: <F tex="(8-\lambda)(2-\lambda)-4=\lambda^2-10\lambda+12=0,\qquad \lambda_{1,2}=5\pm\sqrt{13}" /> },
        { what: 'Переходим к сингулярным числам', why: 'Сингулярные числа — корни из собственных значений XᵀX.', formula: <F tex="\sigma_1=\sqrt{5+\sqrt{13}}\approx3.02,\qquad \sigma_2=\sqrt{5-\sqrt{13}}\approx1.18" /> },
        { what: 'Находим первую главную компоненту', why: 'Для λ₁ = 5 + √13 решаем (XᵀX−λ₁I)v₁=0 и нормируем.', formula: <FBox tex="v_1\approx\begin{pmatrix}0.96\\0.29\end{pmatrix}" /> },
        { what: 'Проецируем объекты', why: 'Координаты объектов на первой компоненте — это произведение X на v₁.', formula: <F tex="Xv_1\approx\begin{pmatrix}2&0\\0&1\\-2&-1\end{pmatrix}\begin{pmatrix}0.96\\0.29\end{pmatrix}=\begin{pmatrix}1.92\\0.29\\-2.21\end{pmatrix}" /> },
        { what: 'Считаем объяснённую дисперсию', why: 'Доля первой компоненты — λ₁/(λ₁+λ₂). Здесь сумма λ равна trace(XᵀX)=10.', formula: <FBox tex="\frac{5+\sqrt{13}}{10}\approx0.86" hint="Первая компонента объясняет около 86% дисперсии." /> },
      ],
      interpretation: <span>Первый объект получает большое положительное значение, третий — большое отрицательное, второй близок к нулю: PCA нашла одну ось, которая лучше всего разделяет наблюдения.</span>,
      hints: ['Данные уже центрированы — дополнительное центрирование не нужно.', 'Главные компоненты — столбцы V, а не U.', 'Дисперсия вдоль компоненты равна λᵢ/(n−1), а доля дисперсии — λᵢ/Σλ.'],
      mistakes: ['Спутать левые и правые сингулярные векторы.', 'Забыть центрирование в задачах, где оно не дано.', 'При численном округлении получить вектор противоположного знака: это не ошибка, если проекции тоже сменили знак.'],
      related: 'Разбор №4 (выбор k для PCA), лаборатория «SVD vs PCA».',
    },
    {
      id: 'svd2-w4', title: 'Выбор k — метод локтя на практике', level: 'intermediate', timeMin: 9,
      given: <span><M tex="\sigma=[50,30,15,8,5,3,2,1.5,1,0.8,0.5,0.3,0.1,0.05,0.02]" />.</span>,
      find: <span>Локоть графика и минимальное <M tex="k" /> для 90% дисперсии.</span>,
      answer: <span>Локоть: <M tex="k\approx2" /> или <M tex="3" />; для 90% достаточно <M tex="k=2" />.</span>,
      bigIdea: <span>Локоть — место, где резкое падение сингулярных чисел переходит в пологий хвост; порог по дисперсии считается по квадратам <M tex="\sigma_i^2" />.</span>,
      steps: [
        { what: 'Считаем полную энергию', why: 'Для PCA объяснённая дисперсия пропорциональна квадратам сингулярных чисел.', formula: <FBox tex="S=\sum_i\sigma_i^2=3731.24" /> },
        { what: 'Считаем накопленную энергию', why: 'Сравниваем сумму первых k квадратов с полной энергией.', formula: <F tex="k=1:\;2500/3731.24\approx67.0\%,\quad k=2:\;3400/3731.24\approx91.1\%,\quad k=3:\;3625/3731.24\approx97.2\%" /> },
        { what: 'Ищем визуальный локоть', why: 'Последовательность быстро падает 50 → 30 → 15, затем убывание становится заметно мягче.', formula: <F tex="50\to30\to15\to8\to5\to3\to\cdots" /> },
        { what: 'Выбираем k для 90%', why: 'Берём минимальное k, где накопленная доля не меньше 90%.', formula: <FBox tex="k=2:\;91.1\%\ge 90\%" /> },
      ],
      interpretation: <span>Из 15 измерений можно оставить 2–3 главных фактора. Если критерий строгий — 90% дисперсии, то достаточно двух компонент.</span>,
      hints: ['Сначала возведите все σᵢ в квадрат.', 'Локоть субъективен: рядом могут быть k=2 и k=3.', 'Порог 90% выбирается по накопленной энергии, не по самим σᵢ.'],
      mistakes: ['Назвать k=1 локтем: это начало падения, а не переход к хвосту.', 'Складывать σᵢ вместо σᵢ².', 'Ожидать, что локоть всегда единственный и очевидный.'],
      related: 'Разбор №3 (PCA руками), лаборатория «График сингулярных чисел и локоть».',
    },
    {
      id: 'svd2-w5', title: 'Псевдообращение — решение МНК для вырожденной системы', level: 'advanced', timeMin: 16,
      given: <div><F tex="A=\begin{pmatrix}1&2\\2&4\\0&0\end{pmatrix},\qquad b=\begin{pmatrix}3\\6\\1\end{pmatrix}" /></div>,
      find: <span>Есть ли точное решение, <M tex="A^+" />, <M tex="\hat x=A^+b" /> и минимальную невязку.</span>,
      answer: <span>Точного решения нет; <M tex="A^+=\begin{pmatrix}1/25&2/25&0\\2/25&4/25&0\end{pmatrix}" />; <M tex="\hat x=(0.6,1.2)^T" />; невязка <M tex="1" />.</span>,
      bigIdea: <span>Если <M tex="b\notin Col(A)" />, псевдообратная матрица даёт МНК-решение: она проецирует <M tex="b" /> на столбцовое пространство и минимизирует невязку.</span>,
      steps: [
        { what: 'Проверяем совместность системы', why: 'Столбцы A пропорциональны, поэтому Col(A) — прямая span((1,2,0)ᵀ). Вектор b имеет третью компоненту 1, которую столбцы A объяснить не могут.', formula: <F tex="c_2=2c_1,\qquad b\notin Col(A)" /> },
        { what: 'Считаем AᵀA и сингулярные числа', why: 'Правые сингулярные векторы берём из AᵀA; единственное ненулевое собственное значение равно 25.', formula: <F tex="A^TA=\begin{pmatrix}5&10\\10&20\end{pmatrix},\qquad \lambda=25,0,\qquad \sigma_1=5" /> },
        { what: 'Находим правые сингулярные векторы', why: 'Для λ₁=25 получаем направление (1,2); для нулевого λ — ядро A.', formula: <F tex="v_1=\frac1{\sqrt5}\begin{pmatrix}1\\2\end{pmatrix},\qquad v_2=\frac1{\sqrt5}\begin{pmatrix}-2\\1\end{pmatrix}" /> },
        { what: 'Строим левый сингулярный вектор', why: 'Для ненулевого σ используем u₁ = Av₁/σ₁.', formula: <F tex="u_1=\frac1{5}A\frac1{\sqrt5}\begin{pmatrix}1\\2\end{pmatrix}=\frac1{\sqrt5}\begin{pmatrix}1\\2\\0\end{pmatrix}" /> },
        { what: 'Собираем псевдообратную', why: 'В Σ⁺ переворачиваем только ненулевое σ₁: 5 превращается в 1/5, нули остаются нулями.', formula: <FBox tex="A^+=V\Sigma^+U^T=\begin{pmatrix}1/25&2/25&0\\2/25&4/25&0\end{pmatrix}" /> },
        { what: 'Находим МНК-решение', why: 'Умножаем псевдообратную на b. Третья компонента b не влияет, потому что третий столбец A⁺ нулевой.', formula: <F tex="\hat x=A^+b=\begin{pmatrix}1/25&2/25&0\\2/25&4/25&0\end{pmatrix}\begin{pmatrix}3\\6\\1\end{pmatrix}=\begin{pmatrix}0.6\\1.2\end{pmatrix}" /> },
        { what: 'Считаем минимальную невязку', why: 'A\hat x — ортогональная проекция b на Col(A); остаток — необъяснимая третья компонента.', formula: <FBox tex="A\hat x=\begin{pmatrix}3\\6\\0\end{pmatrix},\qquad \|A\hat x-b\|=\left\|\begin{pmatrix}0\\0\\-1\end{pmatrix}\right\|=1" /> },
      ],
      interpretation: <span>Геометрически МНК отбрасывает компоненту <M tex="(0,0,1)^T" />, перпендикулярную столбцам <M tex="A" />. Поэтому минимальная невязка равна ровно 1.</span>,
      hints: ['AᵀA вырождена, обычная формула с обратной матрицей не сработает.', 'Σ имеет размер 3×2, значит Σ⁺ имеет размер 2×3.', 'Единственное ненулевое σ равно 5.'],
      mistakes: ['Пытаться использовать (AᵀA)⁻¹Aᵀb, хотя AᵀA необратима.', 'Делить на σ₂=0 при построении Σ⁺.', 'Забыть, что нулевая третья строка A делает компоненту b₃ необъяснимой.'],
      related: 'Лаборатория «Псевдообращение», тема «Линейная регрессия и МНК».',
    },
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: T.white, borderRadius: 24, border: `1px solid ${T.border}`, padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 16, background: T.primaryLight, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PenTool size={20} /></div>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: T.text }}>Разборы задач: SVD — часть 2 (применения)</h2>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
              Формат как в теме «Ранг и базис»: <strong>Дано → Найти → Ответ</strong>, Big Idea, пошаговое решение, подсказки и типовые ошибки. В фокусе — сжатие, ошибка приближения, PCA, выбор <M tex="k" /> и псевдообращение.
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
          <div style={{ fontSize: 17, fontWeight: 800 }}>Готов проверить себя на применениях SVD?</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Практика закрепит выбор k, низкоранговые приближения, PCA и псевдообратную.</div>
        </div>
        <button onClick={onGoPractice ?? (() => {})} style={{ background: T.white, color: '#0f172a', padding: '12px 24px', borderRadius: 16, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          К практике <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
