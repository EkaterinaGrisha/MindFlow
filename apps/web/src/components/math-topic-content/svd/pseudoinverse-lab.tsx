import { useMemo, useState } from 'react';

type CaseId = 'rank2' | 'rank1';
type Vec2 = [number, number];
type Vec3 = [number, number, number];
type Matrix3x2 = [Vec2, Vec2, Vec2];

type PinvCase = {
  id: CaseId;
  title: string;
  short: string;
  matrix: Matrix3x2;
  col1: Vec3;
  col2: Vec3;
  defaultB: Vec3;
  description: string;
};

type Solution = {
  xhat: Vec2;
  projection: Vec3;
  residual: Vec3;
  residualNorm: number;
  solutionNorm: number;
  sigmas: number[];
  conditionLabel: string;
  kernelHint: string;
};

const CASES: PinvCase[] = [
  {
    id: 'rank2',
    title: 'A1 · ранг 2',
    short: 'Пространство столбцов — наклонная плоскость',
    matrix: [[1, 0.2], [0, 1], [0.45, 0.65]],
    col1: [1, 0, 0.45],
    col2: [0.2, 1, 0.65],
    defaultB: [1.25, 0.9, 1.8],
    description: 'Полный столбцовый ранг: если b лежит в плоскости Col(A), решение единственно; иначе A⁺b даёт точку плоскости, ближайшую к b.',
  },
  {
    id: 'rank1',
    title: 'A2 · ранг 1',
    short: 'Пространство столбцов — прямая',
    matrix: [[1.6, 0.8], [1.2, 0.6], [0.6, 0.3]],
    col1: [1.6, 1.2, 0.6],
    col2: [0.8, 0.6, 0.3],
    defaultB: [1.4, 0.1, 1.25],
    description: 'Вырожденная система: Col(A) — прямая, а ker(A) ненулевой. Среди бесконечных совместных решений псевдообращение выбирает кратчайшее.',
  },
];

function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, k: number): Vec3 {
  return [a[0] * k, a[1] * k, a[2] * k];
}

function norm3(a: Vec3) {
  return Math.hypot(a[0], a[1], a[2]);
}

function matVec(A: Matrix3x2, x: Vec2): Vec3 {
  return [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1], A[2][0] * x[0] + A[2][1] * x[1]];
}

function singularValues(A: Matrix3x2) {
  const a = A[0][0] ** 2 + A[1][0] ** 2 + A[2][0] ** 2;
  const b = A[0][0] * A[0][1] + A[1][0] * A[1][1] + A[2][0] * A[2][1];
  const d = A[0][1] ** 2 + A[1][1] ** 2 + A[2][1] ** 2;
  const trace = a + d;
  const delta = Math.sqrt(Math.max(0, (a - d) ** 2 + 4 * b * b));
  return [Math.sqrt(Math.max(0, (trace + delta) / 2)), Math.sqrt(Math.max(0, (trace - delta) / 2))];
}

function solveRank2(A: Matrix3x2, b: Vec3, sigmas: number[]): Solution {
  const g11 = A[0][0] ** 2 + A[1][0] ** 2 + A[2][0] ** 2;
  const g12 = A[0][0] * A[0][1] + A[1][0] * A[1][1] + A[2][0] * A[2][1];
  const g22 = A[0][1] ** 2 + A[1][1] ** 2 + A[2][1] ** 2;
  const rhs1 = A[0][0] * b[0] + A[1][0] * b[1] + A[2][0] * b[2];
  const rhs2 = A[0][1] * b[0] + A[1][1] * b[1] + A[2][1] * b[2];
  const det = g11 * g22 - g12 * g12;
  const xhat: Vec2 = [(g22 * rhs1 - g12 * rhs2) / det, (-g12 * rhs1 + g11 * rhs2) / det];
  const projection = matVec(A, xhat);
  const residual = sub(b, projection);
  const condition = sigmas[0] / sigmas[1];

  return {
    xhat,
    projection,
    residual,
    residualNorm: norm3(residual),
    solutionNorm: Math.hypot(xhat[0], xhat[1]),
    sigmas,
    conditionLabel: condition.toFixed(2),
    kernelHint: 'ker(A)={0}: при совместности решение единственно.',
  };
}

function solveRank1(A: Matrix3x2, b: Vec3, sigmas: number[]): Solution {
  const c = [A[0][0], A[1][0], A[2][0]] as Vec3;
  const cNorm2 = dot(c, c);
  const alpha = dot(c, b) / cNorm2;
  const projection = scale(c, alpha);
  const residual = sub(b, projection);
  const generator: Vec2 = [1, 0.5];
  const generatorNorm2 = generator[0] ** 2 + generator[1] ** 2;
  const xhat: Vec2 = [alpha * generator[0] / generatorNorm2, alpha * generator[1] / generatorNorm2];

  return {
    xhat,
    projection,
    residual,
    residualNorm: norm3(residual),
    solutionNorm: Math.hypot(xhat[0], xhat[1]),
    sigmas,
    conditionLabel: '∞',
    kernelHint: 'ker(A)=span{(-0.5, 1)}: A⁺b выбирает решение без компоненты ядра.',
  };
}

function solve(caseData: PinvCase, b: Vec3): Solution {
  const sigmas = singularValues(caseData.matrix);
  return caseData.id === 'rank2' ? solveRank2(caseData.matrix, b, sigmas) : solveRank1(caseData.matrix, b, sigmas);
}

function project3d([x, y, z]: Vec3): [number, number] {
  return [260 + 74 * (x - 0.62 * y), 250 + 34 * y - 78 * z];
}

function Arrow({ from, to, color, dashed, width = 4 }: { from: Vec3; to: Vec3; color: string; dashed?: boolean; width?: number }) {
  const [x1, y1] = project3d(from);
  const [x2, y2] = project3d(to);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 10;
  const left = [x2 - head * Math.cos(angle - Math.PI / 7), y2 - head * Math.sin(angle - Math.PI / 7)];
  const right = [x2 - head * Math.cos(angle + Math.PI / 7), y2 - head * Math.sin(angle + Math.PI / 7)];

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '8 7' : undefined} />
      {!dashed && <path d={`M ${x2} ${y2} L ${left[0]} ${left[1]} L ${right[0]} ${right[1]} Z`} fill={color} />}
    </g>
  );
}

function PointLabel({ point, label, color, dx = 8, dy = -8 }: { point: Vec3; label: string; color: string; dx?: number; dy?: number }) {
  const [x, y] = project3d(point);
  return <text x={x + dx} y={y + dy} fill={color} fontSize="13" fontWeight="800">{label}</text>;
}

function Scene3D({ caseData, b, solution }: { caseData: PinvCase; b: Vec3; solution: Solution }) {
  const origin: Vec3 = [0, 0, 0];
  const p = solution.projection;
  const planeCorners = [
    add(scale(caseData.col1, -1.35), scale(caseData.col2, -1.35)),
    add(scale(caseData.col1, 1.55), scale(caseData.col2, -1.35)),
    add(scale(caseData.col1, 1.55), scale(caseData.col2, 1.45)),
    add(scale(caseData.col1, -1.35), scale(caseData.col2, 1.45)),
  ];
  const planePath = planeCorners.map((point, index) => `${index === 0 ? 'M' : 'L'} ${project3d(point).join(' ')}`).join(' ') + ' Z';
  const lineEnd = scale(caseData.col1, 2.1);
  const lineStart = scale(caseData.col1, -1.45);

  return (
    <svg viewBox="0 0 560 360" className="w-full rounded-3xl border border-slate-200 bg-slate-950 shadow-inner" role="img">
      <defs>
        <linearGradient id="pinv-plane" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#818cf8" stopOpacity="0.36" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <rect width="560" height="360" fill="#020617" />
      <Arrow from={origin} to={[2.4, 0, 0]} color="#64748b" width={2} />
      <Arrow from={origin} to={[0, 2.4, 0]} color="#64748b" width={2} />
      <Arrow from={origin} to={[0, 0, 2.4]} color="#64748b" width={2} />
      <PointLabel point={[2.4, 0, 0]} label="e₁" color="#94a3b8" />
      <PointLabel point={[0, 2.4, 0]} label="e₂" color="#94a3b8" />
      <PointLabel point={[0, 0, 2.4]} label="e₃" color="#94a3b8" />

      {caseData.id === 'rank2' ? (
        <>
          <path d={planePath} fill="url(#pinv-plane)" stroke="#818cf8" strokeWidth="2" />
          <text x="24" y="34" fill="#c7d2fe" fontSize="14" fontWeight="800">Col(A) — плоскость</text>
        </>
      ) : (
        <>
          <line x1={project3d(lineStart)[0]} y1={project3d(lineStart)[1]} x2={project3d(lineEnd)[0]} y2={project3d(lineEnd)[1]} stroke="#818cf8" strokeWidth="9" strokeLinecap="round" opacity="0.85" />
          <text x="24" y="34" fill="#c7d2fe" fontSize="14" fontWeight="800">Col(A) — прямая</text>
        </>
      )}

      <Arrow from={origin} to={p} color="#38bdf8" />
      <Arrow from={origin} to={b} color="#ef4444" />
      <Arrow from={p} to={b} color="#f59e0b" dashed width={3} />
      <circle cx={project3d(p)[0]} cy={project3d(p)[1]} r="5" fill="#38bdf8" />
      <circle cx={project3d(b)[0]} cy={project3d(b)[1]} r="5" fill="#ef4444" />
      <PointLabel point={b} label="b" color="#fecaca" />
      <PointLabel point={p} label="p=Ax̂" color="#bae6fd" />
      <PointLabel point={add(p, scale(solution.residual, 0.58))} label="r=b−p" color="#fde68a" dx={10} dy={18} />
    </svg>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-mono text-slate-900 tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input type="range" min={-2.5} max={2.5} step={0.05} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-indigo-600" />
    </label>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-2xl font-black text-slate-900 tabular-nums">{value}</div>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{note}</p>
    </div>
  );
}

function MatrixDisplay({ A }: { A: Matrix3x2 }) {
  return (
    <div className="inline-flex items-stretch rounded-2xl bg-slate-50 px-3 py-2">
      <div className="border-y-2 border-l-2 border-slate-700 rounded-l-lg w-2" />
      <table className="mx-1 border-separate font-mono text-sm text-slate-900" style={{ borderSpacing: '10px 4px' }}>
        <tbody>
          {A.map((row, index) => (
            <tr key={index}>{row.map((value, col) => <td key={col} className="text-right tabular-nums">{value.toFixed(2)}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <div className="border-y-2 border-r-2 border-slate-700 rounded-r-lg w-2" />
    </div>
  );
}

export default function SVDPseudoinverseLab() {
  const [caseId, setCaseId] = useState<CaseId>('rank2');
  const caseData = CASES.find((item) => item.id === caseId) ?? CASES[0];
  const [bByCase, setBByCase] = useState<Record<CaseId, Vec3>>({ rank2: CASES[0].defaultB, rank1: CASES[1].defaultB });
  const b = bByCase[caseId];
  const solution = useMemo(() => solve(caseData, b), [caseData, b]);

  const setBComponent = (index: number, value: number) => {
    setBByCase((current) => ({
      ...current,
      [caseId]: current[caseId].map((component, componentIndex) => (componentIndex === index ? value : component)) as Vec3,
    }));
  };
  const setB = (next: Vec3) => setBByCase((current) => ({ ...current, [caseId]: next }));
  const compatibleB = caseData.id === 'rank2' ? add(scale(caseData.col1, 1.05), scale(caseData.col2, 0.75)) : scale(caseData.col1, 0.9);
  const shiftedB = caseData.id === 'rank2' ? add(compatibleB, [0, 0, 1.0]) : add(compatibleB, [-0.75, 0.95, 0.4]);

  return (
    <div>
      <h4 className="text-xl font-extrabold text-slate-900">Лаборатория 5: Псевдообращение — реши нерешаемое</h4>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">
        <b>Исследовательский вопрос:</b> Как найти лучшее решение Ax=b, когда точного решения нет или оно не единственно?
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {CASES.map((item) => (
          <button
            key={item.id}
            onClick={() => setCaseId(item.id)}
            className={`rounded-2xl border p-4 text-left transition ${item.id === caseId ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
          >
            <div className="font-extrabold text-slate-900">{item.title}</div>
            <div className="mt-1 text-sm leading-relaxed text-slate-600">{item.short}</div>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Scene3D caseData={caseData} b={b} solution={solution} />

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Матрица и геометрия</div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <MatrixDisplay A={caseData.matrix} />
              <div className="max-w-sm text-sm leading-relaxed text-slate-700">{caseData.description}</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Slider label="b₁" value={b[0]} onChange={(value) => setBComponent(0, value)} />
            <Slider label="b₂" value={b[1]} onChange={(value) => setBComponent(1, value)} />
            <Slider label="b₃" value={b[2]} onChange={(value) => setBComponent(2, value)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setB(compatibleB)} className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">b в Col(A)</button>
            <button onClick={() => setB(shiftedB)} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">b вне Col(A)</button>
            <button onClick={() => setB(caseData.defaultB)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700">Сброс</button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="x̂=A⁺b" value={`(${solution.xhat[0].toFixed(2)}, ${solution.xhat[1].toFixed(2)})`} note="Псевдорешение в координатах неизвестного x." />
        <Metric label="||r||" value={solution.residualNorm.toFixed(3)} note="Длина невязки r=b−p: расстояние от b до Col(A)." />
        <Metric label="||x̂||" value={solution.solutionNorm.toFixed(3)} note="Норма выбранного решения; при ранге 1 выбирается минимум." />
        <Metric label="κ=σ₁/σᵣ" value={solution.conditionLabel} note={`σ=[${solution.sigmas.map((sigma) => sigma.toFixed(2)).join(', ')}]. ${solution.kernelHint}`} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-950">
          <div className="font-extrabold">Что исследовать</div>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Для A1 положи b в плоскость и проверь нулевую невязку; затем выведи b из плоскости и смотри проекцию.</li>
            <li>Двигай b параллельно и перпендикулярно пространству столбцов: p следует только за компонентой внутри Col(A), а ||r|| измеряет внешнюю часть.</li>
            <li>Для A2 подвигай b параллельно прямой: p скользит по прямой; подвигай перпендикулярно — p почти не меняется.</li>
            <li>Сравни устойчивость решения с числом обусловленности κ=σ₁/σᵣ: у вырожденного случая κ=∞.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <div className="font-extrabold">Встроенные загадки</div>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Если система несовместна, x̂ всё равно существует: он минимизирует ||Ax−b||.</li>
            <li>Если система совместна, но вырождена, A⁺ обнуляет компоненту в ker(A) и выбирает кратчайшее решение.</li>
            <li>В A2 малые сдвиги b вне прямой не меняют p, но подчёркивают потерю направления и бесконечную обусловленность.</li>
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-950">
        <b>Ключевое открытие:</b> псевдообращение через SVD решает любую линейную систему в смысле метода наименьших квадратов. Геометрически это ортогональная проекция b на Col(A), а среди бесконечного множества совместных решений A⁺b выбирает кратчайшее — перпендикулярное ker(A).
      </div>
    </div>
  );
}
