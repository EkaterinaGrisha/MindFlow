import { useEffect, useState } from 'react';
import { LabBody, LabShell } from '../shared/labShell';
import SVDElbowLab from './elbow-lab';
import SVDImageCompressionLab from './image-compression-lab';
import SVDMissingRatingsLab from './missing-ratings-lab';
import SVDPseudoinverseLab from './pseudoinverse-lab';

const SVD_PART2_LABS = [
  {
    id: 'svd2-image-compress',
    title: 'Лаборатория 1: Сжатие изображения — найди предел',
    shortTitle: 'Сжатие изображения — найди предел',
    question: 'Насколько сильно можно сжать изображение с помощью SVD, чтобы человеческий глаз не заметил разницы?',
    mechanics: [
      'Слева показывается исходное ч/б изображение 300×300, справа — восстановление Aₖ после усечённого SVD.',
      'Один ползунок управляет рангом k от 1 до 300; картинка справа обновляется в реальном времени.',
      'Под изображением три метрики: коэффициент сжатия, относительная ошибка Фробениуса и PSNR в дБ.',
      'Ниже — график сингулярных чисел в лог-шкале с вертикальной отметкой текущего k.',
    ],
    explore: [
      'Проверь k=1: обычно остаётся только грубый градиент и менее 1% данных.',
      'Найди k, где впервые узнаётся сюжет изображения (часто около 5–10).',
      'Определи «визуально приемлемый» диапазон, где черты уже читаются (часто около 20–50).',
      'Посмотри при каком k PSNR переходит 40 дБ и сравни это с субъективным качеством.',
      'Сравни портрет, пейзаж и текст: какой тип данных сжимается лучше и почему.',
    ],
    riddles: [
      'Если 50% сингулярных чисел нулевые, то уже при k=150 восстановление идеально, потому что реальный ранг матрицы равен 150.',
      'Резкий обрыв σᵢ около i=100 указывает на выраженную низкоранговую структуру и повторяющийся паттерн.',
    ],
    insight: 'Качество определяется не размером изображения, а его эффективным рангом: числом значимых сингулярных чисел.',
  },
  {
    id: 'svd2-elbow',
    title: 'Лаборатория 2: График сингулярных чисел и локоть — научись выбирать k',
    shortTitle: 'График сингулярных чисел и локоть — научись выбирать k',
    question: 'Метод локтя — это искусство или наука? Можно ли формализовать выбор k?',
    mechanics: [
      'Доступны 5 наборов матриц: быстрый спад, плавный спад, два локтя, ступенька и реальные данные.',
      'Показываются график σᵢ (лог-шкала), кумулятивная объяснённая дисперсия и таблица значений по k.',
      'Ползунок k двигает вертикальную линию на графиках и подсвечивает соответствующую строку таблицы.',
    ],
    explore: [
      'Для «быстрого спада» сравни локоть (обычно k≈2–3) и накопленную дисперсию.',
      'Для «плавного спада» проверь, что локоть размыт, и примени порог 90% дисперсии.',
      'Для «двух локтей» сравни первый и второй перегиб как два режима детализации.',
      'Для «ступеньки» проверь, что выбор k=10 очевиден, даже если «локоть» геометрически не выражен.',
      'Для реальных данных сравни визуальную догадку по локтю с табличным порогом дисперсии.',
    ],
    riddles: [
      'Если σ₁=…=σ₁₀=50, а остальные нули, то формального локтя почти нет, но k=10 выделяется структурно.',
      'Когда даже k=20 даёт низкую долю дисперсии, это признак высокоразмерности и отсутствия доминирующих факторов.',
    ],
    insight: 'Локоть — эвристика. При явном перегибе она полезна, при плавном спектре надёжнее порог объяснённой дисперсии.',
  },
  {
    id: 'svd2-pca',
    title: 'Лаборатория 3: SVD vs PCA — один метод, два имени',
    shortTitle: 'SVD vs PCA — один метод, два имени',
    question: 'PCA предложил Пирсон (1901), а SVD — Бельтрами (1873): почему эти независимые идеи приводят к одному результату?',
    mechanics: [
      'На плоскости показано облако из 50 точек; точки можно перетаскивать и пересчитывать всё в реальном времени.',
      'Вкладка PCA: центрирование данных → ковариация C=(1/(n−1))XᵀX → собственные векторы C → проекция на первую компоненту.',
      'Вкладка SVD: центрирование данных → разложение X=UΣVᵀ (без явной ковариации) → правые сингулярные векторы V → проекция через Xv₁.',
      'Чекбокс «Показать разницу» сравнивает направления PCA и SVD (совпадение с точностью до знака).',
    ],
    explore: [
      'Сдвигай отдельные точки и проверяй, что направления на обеих вкладках меняются одинаково.',
      'Сделай почти линейное облако: σ₂≈0 и почти 100% дисперсии у первой компоненты.',
      'Сделай почти круг: λ₁≈λ₂ и направление «главной» компоненты становится неоднозначным (подходит почти любое).',
      'Включи «Показать разницу» и проверь, видна ли реальная разница между PCA и SVD.',
    ],
    riddles: [
      'Стрелка PCA может быть направлена противоположно стрелке SVD, и это не ошибка: v и −v эквивалентны.',
      'Если σ₁=10 и σ₂=3, то доля первой компоненты равна σ₁²/(σ₁²+σ₂²)=100/109≈91.7%.',
    ],
    insight: 'PCA и SVD — два алгоритмически разных пути к одной геометрии данных: статистический (ковариация) и матричный (разложение). На практике в ML чаще выбирают SVD из-за численной устойчивости и отсутствия необходимости формировать XᵀX.',
  },
  {
    id: 'svd2-missing',
    title: 'Лаборатория 4: Восстановление пропусков — SVD как детектив',
    shortTitle: 'Восстановление пропусков — SVD как детектив',
    question: 'Как SVD угадывает пропущенные оценки в матрице рейтингов и где начинается переобучение?',
    mechanics: [
      'Есть «истинная» матрица рейтингов 10×10, но студент видит версию с пропусками (часть ячеек скрыта).',
      'Ползунок k управляет числом компонент: заполнение средним по строке → SVD → восстановление пропусков.',
      'Показываются две метрики: RMSE на известных и RMSE на скрытых значениях.',
      'Кнопка «Раскрыть карты» показывает истинные оценки и визуально отмечает точность предсказаний.',
    ],
    explore: [
      'Сравни k=1 и k=3: от почти одинаковых рекомендаций к более персонализированным.',
      'Найди диапазон k с минимумом ошибки на скрытых данных (обычно середина, а не полный ранг).',
      'Проверь k=10: на известных ошибка стремится к нулю, но на скрытых часто растёт.',
      'Сопоставь наихудшие предсказания с «нетипичными» пользователями или фильмами.',
    ],
    riddles: [
      'Точное попадание в известные оценки не гарантирует обобщение: это может быть запоминание шума.',
      'Ошибка на скрытых отражает качество рекомендации, а не качество подгонки под обучающую часть.',
    ],
    insight: 'SVD-рекомендации — это баланс между недообучением и переобучением; лучший k выбирают по валидации.',
  },
  {
    id: 'svd2-pinv',
    title: 'Лаборатория 5: Псевдообращение — реши нерешаемое',
    shortTitle: 'Псевдообращение — реши нерешаемое',
    question: 'Как найти лучшее решение Ax=b, когда точного решения нет или оно не единственно?',
    mechanics: [
      'В 3D-сцене показываются пространство столбцов A, вектор b, проекция p=Ax̂ и невязка r=b−p.',
      'Переключаются два случая: A1 ранга 2 (плоскость) и A2 ранга 1 (прямая).',
      'Ползунки двигают b, а стенд считает x̂=A⁺b, длину невязки ||r|| и норму решения ||x̂||.',
    ],
    explore: [
      'Для A1 положи b в плоскость и проверь нулевую невязку; затем выведи b из плоскости и смотри проекцию.',
      'Двигай b параллельно/перпендикулярно пространству столбцов и отслеживай, что меняется в p и ||r||.',
      'Для A2 изучи, как A⁺ выбирает минимальную норму среди множества возможных решений.',
      'Сопоставь визуально устойчивость решения и число обусловленности κ=σ₁/σᵣ.',
    ],
    riddles: [
      'При несовместной системе x̂ существует как минимум нормы невязки ||Ax−b||.',
      'При совместной вырожденной системе A⁺ обнуляет компоненту в ker(A), выбирая кратчайшее решение.',
    ],
    insight: 'Псевдообращение через SVD даёт универсальное решение МНК и геометрически означает ортогональную проекцию на Col(A).',
  },
] as const;

type P2 = [number, number];

function SvdVsPcaExplorableLab() {
  const [elongation, setElongation] = useState(1.8);
  const [angle, setAngle] = useState(28);
  const [outlier, setOutlier] = useState(0);
  const [activeTab, setActiveTab] = useState<'pca'|'svd'>('pca');
  const [showDiff, setShowDiff] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const generate = (e = elongation, a = angle, o = outlier): P2[] => Array.from({ length: 50 }, (_, i) => {
    const t = (i / 50) * Math.PI * 2;
    const r1 = 0.5 + (Math.sin(i * 2.31) + 1) * 0.35;
    const x = Math.cos(t) * e * r1 + Math.sin(i * 7.1) * 0.08;
    const y = Math.sin(t) * 0.9 * r1 + Math.cos(i * 5.3) * 0.08;
    const th = (a * Math.PI) / 180;
    const xr = x * Math.cos(th) - y * Math.sin(th);
    const yr = x * Math.sin(th) + y * Math.cos(th);
    return i === 0 ? [xr + o * 0.9, yr + o * 0.25] : [xr, yr];
  });
  const [points, setPoints] = useState<P2[]>(() => generate());
  useEffect(() => setPoints(generate(elongation, angle, outlier)), [elongation, angle, outlier]);

  const mean: P2 = [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length];
  const centered = points.map((p) => [p[0] - mean[0], p[1] - mean[1]] as P2);
  const n = centered.length;
  const cxx = centered.reduce((s, p) => s + p[0] * p[0], 0) / (n - 1);
  const cxy = centered.reduce((s, p) => s + p[0] * p[1], 0) / (n - 1);
  const cyy = centered.reduce((s, p) => s + p[1] * p[1], 0) / (n - 1);
  const tr = cxx + cyy; const det = cxx * cyy - cxy * cxy; const d = Math.sqrt(Math.max(0, tr * tr - 4 * det));
  const l1 = (tr + d) / 2; const l2 = (tr - d) / 2;
  const raw: P2 = Math.abs(cxy) > 1e-8 ? [l1 - cyy, cxy] : (cxx >= cyy ? [1, 0] : [0, 1]);
  const norm = Math.hypot(raw[0], raw[1]) || 1;
  const v1: P2 = [raw[0] / norm, raw[1] / norm];
  const pcaV1 = v1;
  const svdV1: P2 = points[0][0] > mean[0] ? ([-v1[0], -v1[1]] as P2) : v1;
  const sigma1 = Math.sqrt(Math.max(0, l1 * (n - 1))); const sigma2 = Math.sqrt(Math.max(0, l2 * (n - 1)));
  const varianceShare = l1 / Math.max(1e-8, l1 + l2);

  const toSvg = (p: P2): P2 => [220 + p[0] * 90, 190 - p[1] * 90];
  const fromSvg = (x: number, y: number): P2 => [(x - 220) / 90, (190 - y) / 90];
  const useVec = activeTab === 'pca' ? pcaV1 : svdV1;
  const proj = centered.map((p) => {
    const t = p[0] * useVec[0] + p[1] * useVec[1];
    return [mean[0] + t * useVec[0], mean[1] + t * useVec[1]] as P2;
  });

  return <div>
    <h4 className="text-xl font-extrabold text-slate-900">Лаборатория 3: SVD vs PCA — один метод, два имени</h4>
    <p className="text-sm text-slate-700 mt-2">Перетаскивай точки и двигай ползунки: обе вкладки дают одинаковую геометрию (возможна разница знака вектора).</p>
    <div className="mt-4 grid md:grid-cols-3 gap-3 text-xs">
      <label>Вытянутость <input type="range" min={1} max={3} step={0.1} value={elongation} onChange={(e) => setElongation(Number(e.target.value))} className="w-full"/></label>
      <label>Угол <input type="range" min={-85} max={85} step={1} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full"/></label>
      <label>Выброс <input type="range" min={0} max={3} step={0.1} value={outlier} onChange={(e) => setOutlier(Number(e.target.value))} className="w-full"/></label>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <button className={`px-3 py-1.5 rounded-lg border ${activeTab==='pca'?'border-indigo-500 bg-indigo-50':'border-slate-300'}`} onClick={() => setActiveTab('pca')}>PCA</button>
      <button className={`px-3 py-1.5 rounded-lg border ${activeTab==='svd'?'border-indigo-500 bg-indigo-50':'border-slate-300'}`} onClick={() => setActiveTab('svd')}>SVD</button>
      <label className="flex items-center gap-2"><input type="checkbox" checked={showDiff} onChange={(e) => setShowDiff(e.target.checked)}/>Показать разницу</label>
    </div>
    <svg viewBox="0 0 440 380" className="w-full mt-4 rounded-2xl border border-slate-200 bg-slate-50"
      onPointerMove={(e) => { if (dragIdx === null) return; const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const p = fromSvg(e.clientX - r.left, e.clientY - r.top); setPoints((old) => old.map((q, i) => i === dragIdx ? p : q)); }}
      onPointerUp={() => setDragIdx(null)}>
      <line x1={220} y1={20} x2={220} y2={360} stroke="#cbd5e1"/><line x1={20} y1={190} x2={420} y2={190} stroke="#cbd5e1"/>
      {points.map((p, i) => { const s = toSvg(p); const pr = toSvg(proj[i]); return <g key={i}>
        <line x1={s[0]} y1={s[1]} x2={pr[0]} y2={pr[1]} stroke="#cbd5e1"/>
        <circle cx={s[0]} cy={s[1]} r={5} fill="#4f46e5" onPointerDown={() => setDragIdx(i)} />
      </g>; })}
      {(() => { const a = toSvg([mean[0] + pcaV1[0] * 2.2, mean[1] + pcaV1[1] * 2.2]); const b = toSvg([mean[0] - pcaV1[0] * 2.2, mean[1] - pcaV1[1] * 2.2]);
      return <line x1={b[0]} y1={b[1]} x2={a[0]} y2={a[1]} stroke="#111827" strokeWidth={4} />; })()}
      {showDiff && (() => { const a = toSvg([mean[0] + svdV1[0] * 2.2, mean[1] + svdV1[1] * 2.2]); const b = toSvg([mean[0] - svdV1[0] * 2.2, mean[1] - svdV1[1] * 2.2]); return <line x1={b[0]} y1={b[1]} x2={a[0]} y2={a[1]} stroke="#ef4444" strokeWidth={2} strokeDasharray="6 5"/>; })()}
    </svg>
    <div className="mt-3 grid md:grid-cols-3 gap-2 text-xs text-slate-700">
      <div className="rounded-lg border p-2">λ₁={l1.toFixed(3)}, λ₂={l2.toFixed(3)}</div>
      <div className="rounded-lg border p-2">σ₁={sigma1.toFixed(3)}, σ₂={sigma2.toFixed(3)}</div>
      <div className="rounded-lg border p-2">Доля 1 компоненты: {(varianceShare * 100).toFixed(1)}%</div>
    </div>
  </div>;
}

export default function SvdPart2LabView() {
  const [activeLab, setActiveLab] = useState<string>(SVD_PART2_LABS[0].id);
  const lab = SVD_PART2_LABS.find((item) => item.id === activeLab) ?? SVD_PART2_LABS[0];

  return (
    <LabShell
      title="Лаборатории SVD · Часть 2"
      intro="Пять исследовательских лабораторий про прикладной SVD: сжатие изображений, выбор k по спектру, связь с PCA, восстановление пропусков и псевдообращение."
      labs={SVD_PART2_LABS}
      activeId={activeLab}
      onSelect={setActiveLab}
    >
      {lab.id === 'svd2-image-compress' ? (
        <SVDImageCompressionLab />
      ) : lab.id === 'svd2-pca' ? (
        <SvdVsPcaExplorableLab />
      ) : lab.id === 'svd2-elbow' ? (
        <SVDElbowLab />
      ) : lab.id === 'svd2-missing' ? (
        <SVDMissingRatingsLab />
      ) : lab.id === 'svd2-pinv' ? (
        <SVDPseudoinverseLab />
      ) : (
        <LabBody
          title="Лаборатория"
          question="Выберите лабораторию."
          mechanics={[]}
          explore={[]}
          insight=""
        />
      )}
    </LabShell>
  );
}
