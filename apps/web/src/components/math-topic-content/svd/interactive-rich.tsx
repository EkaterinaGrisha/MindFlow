import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

type Matrix2 = [[number, number], [number, number]];
type Vec2 = [number, number];

type LayerId = 'vt' | 'sigma' | 'u';

const COLORS = {
  blue: '#2563eb',
  green: '#059669',
  orange: '#ea580c',
  slate: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  grid: '#eef2f7',
  rose: '#e11d48',
  violet: '#7c3aed',
};

const pointColors = ['#e11d48', '#2563eb', '#059669', '#f59e0b'];
const samplePoints: Vec2[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

function clampSmall(x: number) {
  return Math.abs(x) < 1e-10 ? 0 : x;
}

function fmt(x: number) {
  const v = clampSmall(x);
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function mul(A: Matrix2, B: Matrix2): Matrix2 {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
}

function transpose(A: Matrix2): Matrix2 {
  return [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];
}

function apply(A: Matrix2, [x, y]: Vec2): Vec2 {
  return [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
}

function norm([x, y]: Vec2) {
  return Math.hypot(x, y);
}

function normalize(v: Vec2): Vec2 {
  const n = norm(v);
  return n < 1e-10 ? [1, 0] : [v[0] / n, v[1] / n];
}

function perp([x, y]: Vec2): Vec2 {
  return [-y, x];
}

function angleDeg([x, y]: Vec2) {
  return Math.round((Math.atan2(y, x) * 180) / Math.PI);
}

function eigenvectorForSymmetric(a: number, b: number, d: number, lambda: number): Vec2 {
  if (Math.abs(b) > 1e-10) return normalize([b, lambda - a]);
  return a >= d ? [1, 0] : [0, 1];
}

function svd2x2(A: Matrix2) {
  const [[a, b], [c, d]] = A;
  const s11 = a * a + c * c;
  const s12 = a * b + c * d;
  const s22 = b * b + d * d;
  const tr = s11 + s22;
  const delta = Math.hypot(s11 - s22, 2 * s12);
  const lambda1 = Math.max(0, (tr + delta) / 2);
  const lambda2 = Math.max(0, (tr - delta) / 2);
  const sigma1 = Math.sqrt(lambda1);
  const sigma2 = Math.sqrt(lambda2);

  let v1: Vec2;
  if (delta < 1e-10) v1 = [1, 0];
  else v1 = eigenvectorForSymmetric(s11, s12, s22, lambda1);
  let v2 = perp(v1);

  let u1 = sigma1 > 1e-9 ? normalize(apply(A, v1)) : [1, 0] as Vec2;
  let u2 = sigma2 > 1e-9 ? normalize(apply(A, v2)) : perp(u1);

  // Choose signs so that A ≈ UΣVᵀ and the second pair is consistent.
  const av2 = apply(A, v2);
  if (sigma2 > 1e-9 && av2[0] * u2[0] + av2[1] * u2[1] < 0) u2 = [-u2[0], -u2[1]];

  const U: Matrix2 = [[u1[0], u2[0]], [u1[1], u2[1]]];
  const V: Matrix2 = [[v1[0], v2[0]], [v1[1], v2[1]]];
  const Sigma: Matrix2 = [[sigma1, 0], [0, sigma2]];
  const Vt = transpose(V);
  return { U, Sigma, V, Vt, sigma1, sigma2, u1, u2, v1, v2 };
}

function MatrixDisplay({ label, data, color = COLORS.slate }: { label: string; data: Matrix2; color?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] mb-2" style={{ color }}>{label}</div>
      <div className="inline-flex items-stretch">
        <div className="w-2 border-l-2 border-y-2 rounded-l-md" style={{ borderColor: color }} />
        <table className="font-mono text-sm text-slate-900 mx-1 border-separate" style={{ borderSpacing: 0 }}>
          <tbody>{data.map((row, r) => <tr key={r}>{row.map((v, c) => <td key={c} className="px-2 py-0.5 text-center tabular-nums">{fmt(v)}</td>)}</tr>)}</tbody>
        </table>
        <div className="w-2 border-r-2 border-y-2 rounded-r-md" style={{ borderColor: color }} />
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="grid grid-cols-[42px_1fr_48px] items-center gap-2 text-xs">
      <span className="font-mono font-bold text-slate-600">{label}</span>
      <input type="range" min={-3} max={3} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-indigo-600" />
      <span className="font-mono tabular-nums text-right text-slate-900">{fmt(value)}</span>
    </label>
  );
}

function pathFor(A: Matrix2, toSvg: (p: Vec2) => Vec2) {
  const pts: string[] = [];
  for (let i = 0; i <= 144; i++) {
    const t = (i / 144) * Math.PI * 2;
    const [x, y] = toSvg(apply(A, [Math.cos(t), Math.sin(t)]));
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${pts.join(' ')} Z`;
}

function SvdCanvas({ activeMatrix, targetMatrix, layers }: { activeMatrix: Matrix2; targetMatrix: Matrix2; layers: Record<LayerId, boolean> }) {
  const W = 560;
  const H = 420;
  const ox = W / 2;
  const oy = H / 2;
  const sc = 64;
  const toSvg = ([x, y]: Vec2): Vec2 => [ox + x * sc, oy - y * sc];
  const [axisX, axisY] = toSvg([0, 0]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-3xl border border-slate-200 bg-white shadow-sm">
      {Array.from({ length: 11 }, (_, i) => i - 5).map((g) => (
        <g key={g}>
          <line x1={toSvg([g, -3])[0]} y1={toSvg([g, -3])[1]} x2={toSvg([g, 3])[0]} y2={toSvg([g, 3])[1]} stroke={g === 0 ? '#cbd5e1' : COLORS.grid} strokeWidth={g === 0 ? 1.5 : 1} />
          <line x1={toSvg([-4, g])[0]} y1={toSvg([-4, g])[1]} x2={toSvg([4, g])[0]} y2={toSvg([4, g])[1]} stroke={g === 0 ? '#cbd5e1' : COLORS.grid} strokeWidth={g === 0 ? 1.5 : 1} />
        </g>
      ))}

      <path d={pathFor([[1, 0], [0, 1]], toSvg)} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" />
      <path d={pathFor(targetMatrix, toSvg)} fill="none" stroke="#0f172a" strokeWidth={2} strokeDasharray="3 7" opacity={0.35} />
      <path d={pathFor(activeMatrix, toSvg)} fill="rgba(99,102,241,0.10)" stroke="#4f46e5" strokeWidth={4} />

      {samplePoints.map((p, index) => {
        const start = toSvg(p);
        const end = toSvg(apply(activeMatrix, p));
        return (
          <g key={index}>
            <line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke={pointColors[index]} strokeWidth={1.5} opacity={0.35} />
            <circle cx={start[0]} cy={start[1]} r={5} fill="white" stroke={pointColors[index]} strokeWidth={2} />
            <circle cx={end[0]} cy={end[1]} r={8} fill={pointColors[index]} />
          </g>
        );
      })}

      <circle cx={axisX} cy={axisY} r={3.5} fill="#0f172a" />
      <text x={18} y={28} className="fill-slate-500 text-xs font-bold">серый пунктир: исходная окружность</text>
      <text x={18} y={48} className="fill-slate-500 text-xs font-bold">чёрный пунктир: полное действие A</text>
      <text x={18} y={68} className="fill-indigo-700 text-xs font-bold">фиолетовый: выбранные слои ({Object.values(layers).filter(Boolean).length}/3)</text>
    </svg>
  );
}


function CompressionLabBlueprint() {
  return (
    <section className="rounded-3xl border border-indigo-200 bg-white p-6 md:p-8">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo-700">ЛАБОРАТОРИИ SVD — ЧАСТЬ 2 · EXPLORABLE EXPLANATIONS</div>
      <h3 className="mt-2 text-2xl font-black text-slate-950">Лаборатория 1: «Сжатие изображения — найди предел»</h3>
      <p className="mt-3 text-sm text-slate-700 leading-relaxed">Исследовательский вопрос: насколько сильно можно сжать изображение с помощью SVD, чтобы глаз почти не замечал разницы? Граница между «ещё похоже» и «уже безнадёжно» находится экспериментом — через ранг k, ошибку, PSNR и график сингулярных чисел.</p>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4 bg-slate-50">
        <svg viewBox="0 0 860 320" className="w-full">
          <rect x="16" y="32" width="240" height="240" rx="14" fill="#e2e8f0" stroke="#94a3b8"/>
          <rect x="304" y="32" width="240" height="240" rx="14" fill="#dbeafe" stroke="#6366f1"/>
          <text x="36" y="24" className="fill-slate-700 text-[14px] font-bold">Исходное изображение A (≈300×300)</text>
          <text x="324" y="24" className="fill-indigo-700 text-[14px] font-bold">Восстановление Aₖ после SVD</text>

          <line x1="604" y1="78" x2="824" y2="78" stroke="#64748b" strokeWidth="6" strokeLinecap="round"/>
          <circle cx="710" cy="78" r="13" fill="#4f46e5"/>
          <text x="604" y="52" className="fill-slate-700 text-[13px] font-bold">Ползунок k: 1 … 300</text>
          <text x="604" y="108" className="fill-slate-600 text-[12px]">Обновление в реальном времени</text>

          <text x="16" y="296" className="fill-slate-700 text-[12px]">Сжатие: в N раз · Ошибка: ||A−Aₖ||F/||A||F = X% · PSNR = Y дБ</text>
        </svg>
      </div>

      <div className="mt-5 grid lg:grid-cols-2 gap-4 text-sm text-slate-700">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="font-extrabold text-slate-900 mb-2">Как устроен стенд</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Слева оригинал 300×300, справа восстановление Aₖ после усечённого SVD.</li>
            <li>Единственный контрол — ползунок k от 1 до 300, обновление в реальном времени.</li>
            <li>Под изображениями: «Сжатие в N раз», относительная ошибка Фробениуса и PSNR.</li>
            <li>Ниже — график сингулярных чисел в лог-шкале и вертикальная отметка текущего k.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="font-extrabold text-emerald-900 mb-2">Что исследовать</div>
          <ul className="list-disc pl-5 space-y-1 text-emerald-950">
            <li>k=1: остаётся грубый градиент и обычно меньше 1% данных.</li>
            <li>k≈5–10: первое узнавание сюжета (портрет/пейзаж/текст).</li>
            <li>k≈20–50: «визуально приемлемо», но высокочастотные детали теряются.</li>
            <li>Найди k, где PSNR переходит 40 дБ: почти неотличимо для глаза.</li>
            <li>Сравни типы изображений: фото с плавными переходами сжимаются лучше текста и шума.</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 grid lg:grid-cols-2 gap-4 text-sm">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <div className="font-extrabold mb-2">Встроенные загадки</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Если 50% сингулярных чисел нулевые, почему k=150 уже даёт идеал при размере 300×300?</li>
            <li>Если у σᵢ резкий обрыв около i=100, что это говорит о повторяющемся паттерне в изображении?</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-950">
          <div className="font-extrabold mb-2">Ключевое открытие</div>
          <p>
            Предел сжатия определяет не размер матрицы, а её эффективный ранг — число действительно значимых σᵢ.
            «Локоть» спектра обычно совпадает с диапазоном, где картинка уже выглядит хорошо, а объём данных ещё сильно меньше исходного.
          </p>
        </div>
      </div>
    </section>
  );
}


function ElbowMethodLabBlueprint() {
  return (
    <section className="rounded-3xl border border-violet-200 bg-white p-6 md:p-8">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-violet-700">ЛАБОРАТОРИЯ 2 · ГРАФИК СИНГУЛЯРНЫХ ЧИСЕЛ И ЛОКОТЬ</div>
      <h3 className="mt-2 text-2xl font-black text-slate-950">«Научись выбирать k»</h3>
      <p className="mt-3 text-sm text-slate-700 leading-relaxed">Исследовательский вопрос: метод локтя — это искусство или наука? В этом стенде выбор k формализуется сразу тремя окнами: спектр σᵢ, кумулятивная дисперсия и таблица значений.</p>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4 bg-slate-50">
        <svg viewBox="0 0 920 340" className="w-full">
          <rect x="20" y="26" width="290" height="130" rx="12" fill="#ede9fe" stroke="#8b5cf6"/>
          <rect x="330" y="26" width="290" height="130" rx="12" fill="#e0f2fe" stroke="#0ea5e9"/>
          <rect x="640" y="26" width="260" height="130" rx="12" fill="#ecfccb" stroke="#65a30d"/>
          <text x="34" y="48" className="fill-violet-800 text-[13px] font-bold">График σᵢ (лог-шкала)</text>
          <text x="344" y="48" className="fill-sky-800 text-[13px] font-bold">Кумулятивная дисперсия (%)</text>
          <text x="654" y="48" className="fill-lime-800 text-[13px] font-bold">Таблица: k, σₖ, доля, сумма</text>
          <text x="24" y="190" className="fill-slate-700 text-[13px] font-bold">Наборы данных (кнопки): Быстрый спад · Плавный спад · Два локтя · Ступенька · Реальные данные</text>
          <line x1="24" y1="230" x2="340" y2="230" stroke="#64748b" strokeWidth="6" strokeLinecap="round"/>
          <circle cx="176" cy="230" r="13" fill="#7c3aed"/>
          <text x="24" y="214" className="fill-slate-700 text-[13px] font-bold">Ползунок k</text>
          <text x="24" y="272" className="fill-slate-600 text-[12px]">Вертикальная линия на графиках + подсветка строки таблицы</text>
        </svg>
      </div>

      <div className="mt-5 grid lg:grid-cols-2 gap-4 text-sm">
        <div className="rounded-2xl border border-slate-200 p-4 text-slate-700">
          <div className="font-extrabold text-slate-900 mb-2">Что исследовать</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>«Быстрый спад»: локоть обычно при k≈2–3, первые компоненты дают ~99%.</li>
            <li>«Плавный спад»: локоть размытый; выбирай по порогу дисперсии (например, 90%).</li>
            <li>«Два локтя»: первый перегиб = грубая модель, второй = более детальная.</li>
            <li>«Ступенька»: k=10 выделяется естественно, даже без классического «локтя».</li>
            <li>«Реальные данные»: сравни визуальный выбор и порог 90% по таблице.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <div className="font-extrabold mb-2">Открытие</div>
          <p>Метод локтя — эвристика, а не строгий алгоритм. При явном перегибе он работает хорошо; без перегиба лучше опираться на объяснённую дисперсию. Финальный выбор k — компромисс под задачу: сжатие, PCA-интерпретация или шумоподавление.</p>
        </div>
      </div>
    </section>
  );
}

export default function SVDDecompositionLab() {
  const [A, setA] = useState<Matrix2>([[2, 1], [1, 2]]);
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({ vt: true, sigma: true, u: true });
  const svd = useMemo(() => svd2x2(A), [A]);

  const activeMatrix = useMemo(() => {
    let M: Matrix2 = [[1, 0], [0, 1]];
    if (layers.vt) M = mul(svd.Vt, M);
    if (layers.sigma) M = mul(svd.Sigma, M);
    if (layers.u) M = mul(svd.U, M);
    return M;
  }, [layers, svd]);

  const reconstructed = useMemo(() => mul(mul(svd.U, svd.Sigma), svd.Vt), [svd]);
  const isSymmetric = Math.abs(A[0][1] - A[1][0]) < 0.05;
  const isDiagonal = Math.abs(A[0][1]) < 0.05 && Math.abs(A[1][0]) < 0.05;
  const isPureRotationScale = Math.abs(svd.sigma1 - svd.sigma2) < 0.05;

  const setEntry = (r: 0 | 1, c: 0 | 1, value: number) => setA((old) => {
    const next: Matrix2 = [[old[0][0], old[0][1]], [old[1][0], old[1][1]]];
    next[r][c] = value;
    return next;
  });

  const presets: { label: string; matrix: Matrix2 }[] = [
    { label: 'Симметричная', matrix: [[2, 1], [1, 2]] },
    { label: 'Диагональная', matrix: [[2.4, 0], [0, 0.8]] },
    { label: 'Поворот 90°', matrix: [[0, -1], [1, 0]] },
    { label: 'Сдвиг', matrix: [[1, 1.4], [0, 1]] },
  ];

  return (
    <div className="space-y-6">
      <CompressionLabBlueprint />
      <ElbowMethodLabBlueprint />
      <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-orange-50 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0"><Sparkles size={22} /></div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo-700">Лаборатория 1 · SVD как три действия</div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-950 mt-2">Разложи преобразование на три шага</h3>
            <p className="mt-3 text-sm md:text-base text-slate-700 leading-relaxed max-w-4xl">
              Исследуй вопрос: как матрица A превращает единичную окружность в эллипс? SVD говорит, что это можно прочитать как цепочку
              <b> Vᵀ</b> (подготовить вход), <b>Σ</b> (растянуть по горизонтали/вертикали), <b>U</b> (повернуть результат). Включай слои и меняй A — стенд сам пересчитывает разложение.
            </p>
          </div>
        </div>
      </section>

      <div className="grid xl:grid-cols-[1fr_360px] gap-6 items-start">
        <SvdCanvas activeMatrix={activeMatrix} targetMatrix={reconstructed} layers={layers} />

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-3">Матрица A</div>
            <div className="flex justify-center mb-4"><MatrixDisplay label="A" data={A} /></div>
            <div className="space-y-2">
              <Slider label="a₁₁" value={A[0][0]} onChange={(v) => setEntry(0, 0, v)} />
              <Slider label="a₁₂" value={A[0][1]} onChange={(v) => setEntry(0, 1, v)} />
              <Slider label="a₂₁" value={A[1][0]} onChange={(v) => setEntry(1, 0, v)} />
              <Slider label="a₂₂" value={A[1][1]} onChange={(v) => setEntry(1, 1, v)} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {presets.map((preset) => <button key={preset.label} onClick={() => setA(preset.matrix)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50">{preset.label}</button>)}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-3">Слои SVD</div>
            {[
              ['vt', 'Слой 1: Vᵀ · поворот входа', COLORS.blue, 'Окружность остаётся окружностью: мы только выбираем удобные направления v₁ и v₂.'],
              ['sigma', 'Слой 2: Σ · растяжение', COLORS.green, 'Теперь окружность становится эллипсом с осями строго вдоль x и y.'],
              ['u', 'Слой 3: U · поворот выхода', COLORS.orange, 'Эллипс доворачивается в финальное положение — его оси смотрят вдоль u₁ и u₂.'],
            ].map(([id, label, color, help]) => (
              <label key={id} className="flex gap-3 rounded-2xl border border-slate-200 p-3 mb-2 cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={layers[id as LayerId]} onChange={() => setLayers((old) => ({ ...old, [id]: !old[id as LayerId] }))} className="mt-1" style={{ accentColor: color }} />
                <span>
                  <span className="block text-sm font-extrabold" style={{ color }}>{label}</span>
                  <span className="block text-xs text-slate-600 leading-relaxed mt-1">{help}</span>
                </span>
              </label>
            ))}
            <button onClick={() => setLayers({ vt: true, sigma: true, u: true })} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"><RotateCcw size={13} /> Собрать все слои</button>
          </div>
        </aside>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <MatrixDisplay label="Vᵀ · поворот входа" data={svd.Vt} color={COLORS.blue} />
        <MatrixDisplay label={`Σ · σ₁=${fmt(svd.sigma1)}, σ₂=${fmt(svd.sigma2)}`} data={svd.Sigma} color={COLORS.green} />
        <MatrixDisplay label="U · поворот выхода" data={svd.U} color={COLORS.orange} />
      </div>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-3">Что попробовать прямо сейчас</div>
          <ol className="space-y-2 text-sm text-slate-700 leading-relaxed list-decimal pl-5">
            <li>Оставь только <b>Vᵀ + Σ</b>: результат похож на эллипс, оси которого смотрят по координатным осям.</li>
            <li>Включи <b>U</b>: эллипс повернётся в окончательное положение.</li>
            <li>Нажми «Симметричная» или сделай <b>a₁₂ = a₂₁</b>: входной и выходной ортогональные слои начинают совпадать по направлениям.</li>
            <li>Нажми «Диагональная»: повороты почти исчезают, остаётся понятное растяжение Σ.</li>
            <li>Нажми «Поворот 90°»: σ₁ = σ₂ = 1, поэтому средний слой не меняет форму — всё делает поворот.</li>
          </ol>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold mb-3"><CheckCircle2 size={18} /> Наблюдения стенда</div>
          <div className="space-y-2 text-sm text-emerald-950 leading-relaxed">
            <p><b>Сингулярные числа:</b> σ₁={fmt(svd.sigma1)}, σ₂={fmt(svd.sigma2)}. Чем больше σ, тем длиннее соответствующая полуось эллипса.</p>
            <p><b>Направления:</b> v₁ под углом {angleDeg(svd.v1)}°, u₁ под углом {angleDeg(svd.u1)}°.</p>
            <p>{isSymmetric ? '✓ A почти симметрична: направления U и V совпадают или отличаются только знаками.' : '• A несимметрична: входной и выходной повороты обычно разные.'}</p>
            <p>{isDiagonal ? '✓ A почти диагональна: SVD почти полностью сводится к растяжению по x/y.' : '• Есть смешивание координат: повороты берут на себя часть работы.'}</p>
            <p>{isPureRotationScale ? '✓ σ₁≈σ₂: растяжение одинаково во все стороны, поэтому окружность не превращается в вытянутый эллипс.' : '• σ₁ и σ₂ различаются: круг становится настоящим эллипсом.'}</p>
          </div>
        </div>
      </section>

      <div className="rounded-3xl bg-slate-900 p-6 text-white">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo-300 mb-2">Открытие</div>
        <p className="text-sm md:text-base leading-relaxed text-slate-100">
          SVD разделяет ответственность: <b>Vᵀ</b> выбирает правильные входные оси, <b>Σ</b> независимо растягивает их, <b>U</b> размещает результат в выходной плоскости. Когда ты меняешь элементы A, видно, как одна и та же матрица перераспределяет работу между поворотами и растяжением.
        </p>
      </div>
    </div>
  );
}
