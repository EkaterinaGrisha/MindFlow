import { useEffect, useRef, useState } from 'react';
import katex from 'katex';

type Snippet = { label: string; latex: string; title: string };

const SNIPPETS: Snippet[] = [
  { label: 'a/b',   title: 'Дробь',          latex: '\\frac{a}{b}' },
  { label: 'xⁿ',    title: 'Степень',        latex: 'x^{n}' },
  { label: 'xᵢ',    title: 'Индекс',         latex: 'x_{i}' },
  { label: '√',     title: 'Корень',         latex: '\\sqrt{x}' },
  { label: 'Σ',     title: 'Сумма',          latex: '\\sum_{i=1}^{n} ' },
  { label: '∫',     title: 'Интеграл',       latex: '\\int_{a}^{b} ' },
  { label: 'lim',   title: 'Предел',         latex: '\\lim_{x \\to 0} ' },
  { label: '[ ]',   title: 'Матрица 2×2',    latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: '[3×3]', title: 'Матрица 3×3',    latex: '\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}' },
  { label: 'det',   title: 'Определитель',   latex: '\\det(A)' },
  { label: 'Aᵀ',    title: 'Транспонирование', latex: 'A^{T}' },
  { label: 'A⁻¹',   title: 'Обратная',       latex: 'A^{-1}' },
  { label: 'α β',   title: 'Греческие',      latex: '\\alpha \\beta \\gamma \\lambda \\mu \\sigma' },
  { label: '→',     title: 'Стрелка',        latex: '\\to' },
  { label: '≈',     title: 'Прибл. равно',   latex: '\\approx' },
  { label: '≤ ≥',   title: 'Неравенства',    latex: '\\leq \\geq' },
];

export default function FormulaInput({
  onInsert,
  onClose,
}: {
  onInsert: (text: string) => void;
  onClose: () => void;
}) {
  const [latex, setLatex] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!latex.trim()) { setPreview(''); setError(''); return; }
    try {
      const html = katex.renderToString(latex, {
        throwOnError: true,
        displayMode: true,
        output: 'html',
      });
      setPreview(html);
      setError('');
    } catch (e) {
      setPreview('');
      setError(e instanceof Error ? e.message.split('\n')[0].replace(/^KaTeX parse error:\s*/, '') : 'Ошибка синтаксиса');
    }
  }, [latex]);

  function insertSnippet(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      setLatex((prev) => prev + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = latex.slice(0, start) + snippet + latex.slice(end);
    setLatex(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function handleInsert() {
    const trimmed = latex.trim();
    if (!trimmed || error) return;
    onInsert(`$${trimmed}$`);
    onClose();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleInsert(); }
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Формула (LaTeX)</p>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-700 transition-colors px-2"
          title="Закрыть"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {SNIPPETS.map((s) => (
          <button
            key={s.title}
            onClick={() => insertSnippet(s.latex)}
            title={s.title}
            className="px-2 py-1 text-xs font-mono bg-white border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-400 text-indigo-700 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        onKeyDown={handleKey}
        rows={2}
        placeholder="Например: \frac{a}{b} или a^2 + b^2 = c^2"
        className="w-full font-mono text-sm bg-white border border-indigo-200 rounded-xl px-3 py-2 resize-none focus:ring-2 focus:ring-indigo-400 outline-none leading-relaxed"
        style={{ scrollbarWidth: 'thin' }}
      />

      <div className="mt-2 min-h-[2.5rem] bg-white rounded-xl border border-indigo-100 px-3 py-2 overflow-x-auto flex items-center">
        {preview ? (
          <div className="text-slate-800" dangerouslySetInnerHTML={{ __html: preview }} />
        ) : error ? (
          <p className="text-xs text-red-500 font-mono">⚠ {error}</p>
        ) : (
          <p className="text-xs text-slate-400">Превью появится здесь</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-slate-500">
          Ctrl/⌘+Enter — вставить · Esc — закрыть
        </p>
        <button
          onClick={handleInsert}
          disabled={!latex.trim() || !!error}
          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Вставить в чат
        </button>
      </div>
    </div>
  );
}
