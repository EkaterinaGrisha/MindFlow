import { useMemo, useRef, useState } from 'react';

const COLORS = ['#EF4444', '#3B82F6', '#F97316', '#8B5CF6'];
type Vec2 = [number, number];
const GRID = 320; const ORIGIN = GRID / 2; const SCALE = 28;
const norm = ([x, y]: Vec2) => Math.hypot(x, y);
const cross = (a: Vec2, b: Vec2) => a[0] * b[1] - a[1] * b[0];
const clamp = (v: number) => Math.max(-5, Math.min(5, Math.round(v * 2) / 2));

function rank2(vectors: Vec2[]) {
  const nonZero = vectors.filter((v) => norm(v) > 0.05);
  if (nonZero.length === 0) return 0;
  for (let i = 0; i < nonZero.length; i++) for (let j = i + 1; j < nonZero.length; j++) if (Math.abs(cross(nonZero[i], nonZero[j])) > 0.08) return 2;
  return 1;
}

function tip(dim: number, count: number, dependent: boolean) {
  if (count === 0) return 'Добавь первый вектор: пока оболочка содержит только нулевой вектор.';
  if (count === 1) return '1 вектор: оболочка — прямая. Размерность = 1.';
  if (dim === 2 && count === 2) return '2 вектора под углом: оболочка — вся плоскость. Размерность = 2. Это базис ℝ²!';
  if (dim === 2 && count >= 3) return '3+ векторов на плоскости: размерность всё ещё 2. Лишние векторы выражаются через базисные два.';
  if (dependent) return 'Векторы лежат на одной прямой: оболочка — прямая. Размерность = 1. Они зависимы.';
  return 'Меняй наконечники и наблюдай, когда размерность перестаёт расти.';
}

export default function SpanVisualizerLab() {
  const [vectors, setVectors] = useState<Vec2[]>([[3, 1]]);
  const [drag, setDrag] = useState<number | null>(null);
  const [mode3d, setMode3d] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dim = useMemo(() => rank2(vectors), [vectors]);
  const dependent = vectors.length > dim;
  const toSvg = ([x, y]: Vec2): Vec2 => [ORIGIN + x * SCALE, ORIGIN - y * SCALE];
  const fromEvent = (event: React.PointerEvent<SVGSVGElement>): Vec2 => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    return [clamp((event.clientX - rect.left - ORIGIN) / SCALE), clamp(-(event.clientY - rect.top - ORIGIN) / SCALE)];
  };
  const updateDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (drag === null) return;
    const next = fromEvent(event);
    setVectors((items) => items.map((v, i) => (i === drag ? next : v)));
  };
  const lineDir = vectors.find((v) => norm(v) > 0.05) ?? [1, 0] as Vec2;
  const lineNorm = norm(lineDir) || 1;
  const unit: Vec2 = [lineDir[0] / lineNorm, lineDir[1] / lineNorm];
  const [l1x, l1y] = toSvg([-unit[0] * 8, -unit[1] * 8]);
  const [l2x, l2y] = toSvg([unit[0] * 8, unit[1] * 8]);

  return (
    <div>
      <h4 className="text-xl font-extrabold text-slate-900">Лаборатория 1: «Натяни оболочку»</h4>
      <p className="mt-2 text-sm text-slate-700"><b>Идея:</b> добавляй и таскай векторы, чтобы увидеть связь между числом векторов, span и линейной зависимостью.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button disabled={vectors.length >= 4} onClick={() => setVectors((v) => [...v, [Math.round(Math.random() * 6 - 3) || 2, Math.round(Math.random() * 6 - 3) || 1]])} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">Добавить вектор</button>
        <button disabled={vectors.length === 0} onClick={() => setVectors((v) => v.slice(0, -1))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-40">Удалить</button>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={mode3d} onChange={(e) => setMode3d(e.target.checked)} /> 3D-режим</label>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
        <svg ref={svgRef} viewBox={`0 0 ${GRID} ${GRID}`} className={`rounded-3xl border bg-white ${dependent ? 'border-red-300' : 'border-slate-200'}`} onPointerMove={updateDrag} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
          {dim === 2 && <rect width={GRID} height={GRID} fill="#6366F1" opacity="0.08" />}
          {dim === 1 && <line x1={l1x} y1={l1y} x2={l2x} y2={l2y} stroke="#F59E0B" strokeWidth="12" strokeDasharray="10 8" opacity="0.55" />}
          {Array.from({ length: 11 }, (_, i) => i - 5).map((g) => <g key={g}><line x1={ORIGIN + g * SCALE} x2={ORIGIN + g * SCALE} y1="0" y2={GRID} stroke={g === 0 ? '#64748b' : '#e2e8f0'} /><line y1={ORIGIN + g * SCALE} y2={ORIGIN + g * SCALE} x1="0" x2={GRID} stroke={g === 0 ? '#64748b' : '#e2e8f0'} /></g>)}
          {vectors.map((v, i) => { const [x, y] = toSvg(v); return <g key={i}><line x1={ORIGIN} y1={ORIGIN} x2={x} y2={y} stroke={COLORS[i]} strokeWidth="4" strokeLinecap="round" /><circle cx={x} cy={y} r="9" fill={COLORS[i]} className="cursor-grab" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(i); }} /><text x={x + 8} y={y - 8} fill={COLORS[i]} fontSize="13" fontWeight="800">v{i + 1}</text></g>; })}
        </svg>
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Размерность оболочки</div><div className="mt-1 text-5xl font-black text-indigo-700">{dim}</div><p className="mt-2 text-sm text-slate-700">{tip(dim, vectors.length, dependent)}</p></div>
          {dependent && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">Зависим: добавленный вектор не увеличил размерность span.</div>}
          {mode3d && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">3D-режим: в ℝ³ максимум независимых векторов уже 3; четвёртый неизбежно будет лишним.</div>}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><b>💡 Ключевое наблюдение:</b> в n-мерном пространстве не может быть больше n линейно независимых векторов. На плоскости три вектора всегда зависимы.</div>
        </div>
      </div>
    </div>
  );
}
