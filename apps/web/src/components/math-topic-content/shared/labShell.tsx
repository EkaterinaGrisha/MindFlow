import type { ReactNode } from 'react';

export type LabListItem = {
  id: string;
  shortTitle: string;
};

type LabShellProps = {
  title: string;
  intro: string;
  labs: ReadonlyArray<LabListItem>;
  activeId: string;
  onSelect: (id: string) => void;
  children: ReactNode;
};

export function LabShell({ title, intro, labs, activeId, onSelect, children }: LabShellProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-6">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-700 mb-2">Explorable Explanations</div>
        <h3 className="text-2xl font-extrabold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-700 mt-2 leading-relaxed">{intro}</p>
      </div>
      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <div className="space-y-2">
          {labs.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full text-left rounded-2xl border p-3 transition ${
                item.id === activeId
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-indigo-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Лаборатория {index + 1}</div>
              <div className="text-sm font-bold text-slate-900 mt-1 leading-snug">{item.shortTitle}</div>
            </button>
          ))}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">{children}</div>
      </div>
    </div>
  );
}

type LabBodyProps = {
  title: string;
  question: string;
  mechanics: ReadonlyArray<string>;
  explore: ReadonlyArray<string>;
  insight: string;
  riddle?: string;
  riddles?: ReadonlyArray<string>;
};

export function LabBody({ title, question, mechanics, explore, insight, riddle, riddles }: LabBodyProps) {
  return (
    <>
      <h4 className="text-xl font-extrabold text-slate-900">{title}</h4>
      <p className="text-sm text-slate-700 mt-3 leading-relaxed">
        <b>Исследовательский вопрос:</b> {question}
      </p>
      <div className="mt-4">
        <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 mb-2">Как устроен стенд</div>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
          {mechanics.map((m) => <li key={m}>{m}</li>)}
        </ul>
      </div>
      <div className="mt-4">
        <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 mb-2">Что исследовать</div>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
          {explore.map((m) => <li key={m}>{m}</li>)}
        </ul>
      </div>
      {riddles && riddles.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700 mb-2">Встроенные загадки</div>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-amber-900">
            {riddles.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      )}
      {riddle && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <b>Загадка:</b> {riddle}
        </div>
      )}
      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 leading-relaxed">
        <b>Ключевое открытие:</b> {insight}
      </div>
    </>
  );
}

export function SliderRow({
  label, value, setValue, min = -3, max = 3, step = 0.5,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-slate-500 w-4">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="flex-1 accent-indigo-600"
      />
      <span className="font-mono text-xs text-slate-900 w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}

export function PlainMatrixDisplay({ data }: { data: number[][] }) {
  return (
    <div className="inline-flex items-stretch">
      <div className="relative w-2">
        <div className="absolute inset-y-0 left-0 w-2 border-l-2 border-t-2 border-b-2 border-slate-700 rounded-tl-md rounded-bl-md" />
      </div>
      <table className="font-mono text-slate-900 mx-1 border-separate" style={{ borderSpacing: 0 }}>
        <tbody>
          {data.map((row, r) => (
            <tr key={r}>
              {row.map((v, c) => (
                <td key={c} className="text-center tabular-nums px-3 py-1 text-[15px]">{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="relative w-2">
        <div className="absolute inset-y-0 right-0 w-2 border-r-2 border-t-2 border-b-2 border-slate-700 rounded-tr-md rounded-br-md" />
      </div>
    </div>
  );
}
