import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';

// ─── Citation popover ────────────────────────────────────────────────────────

function CitationPopover({ title, children }: { title?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Parse "Title • (page) • snippet" into parts
  const parts = title ? title.split(' • ') : [];
  const sourceTitle = parts[0] ?? '';
  const pageHint = parts.find((p) => p.startsWith('(') && p.endsWith(')'))?.slice(1, -1);
  const snippet = parts.find((p) => !p.startsWith('(') && p !== sourceTitle);

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center rounded bg-indigo-50 text-indigo-700 px-1 py-0.5 text-[0.8em] font-semibold cursor-help border border-indigo-100 hover:bg-indigo-100 transition-colors"
      >
        {children}
      </span>
      {open && title && (
        <span
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute bottom-full left-0 mb-1.5 z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-lg text-xs text-slate-800 pointer-events-auto"
        >
          {/* Arrow */}
          <span className="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white" />
          <span className="block px-3 pt-2.5 pb-1 font-semibold text-slate-900 leading-snug">{sourceTitle}</span>
          {pageHint && (
            <span className="block px-3 pb-1 text-indigo-600 text-[0.9em]">{pageHint}</span>
          )}
          {snippet && (
            <span className="block px-3 pb-2.5 text-slate-500 leading-relaxed border-t border-slate-100 pt-1 mt-0.5 line-clamp-4">
              {snippet}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

interface MarkdownRendererProps {
  content: string;
  /** Extra CSS classes on the wrapper div */
  className?: string;
  /** Compact mode: tighter spacing for small chat bubbles */
  compact?: boolean;
}

export function MarkdownRenderer({ content, className = '', compact = false }: MarkdownRendererProps) {
  const components: Components = {
    // Paragraphs — no extra margin in compact mode
    p({ children }) {
      return (
        <p className={compact ? 'mb-1 last:mb-0' : 'mb-2 last:mb-0'}>
          {children}
        </p>
      );
    },
    // Headers
    h1({ children }) {
      return <h1 className="text-base font-bold mt-3 mb-1 first:mt-0">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-sm font-bold mt-3 mb-1 first:mt-0">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>;
    },
    // Inline code
    code({ children, className: codeClass }) {
      const isBlock = codeClass?.startsWith('language-');
      if (isBlock) {
        return (
          <code className="block text-[0.85em] font-mono leading-relaxed">
            {children}
          </code>
        );
      }
      return (
        <code className="text-[0.85em] font-mono bg-black/[0.07] rounded px-1 py-0.5">
          {children}
        </code>
      );
    },
    // Code blocks
    pre({ children }) {
      return (
        <pre className="my-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono overflow-x-auto leading-relaxed">
          {children}
        </pre>
      );
    },
    // Unordered list
    ul({ children }) {
      return <ul className={`list-disc pl-4 ${compact ? 'mb-1' : 'mb-2'} space-y-0.5`}>{children}</ul>;
    },
    // Ordered list
    ol({ children }) {
      return <ol className={`list-decimal pl-4 ${compact ? 'mb-1' : 'mb-2'} space-y-0.5`}>{children}</ol>;
    },
    li({ children }) {
      return <li className="leading-snug">{children}</li>;
    },
    // Bold
    strong({ children }) {
      return <strong className="font-semibold">{children}</strong>;
    },
    // Italic
    em({ children }) {
      return <em className="italic">{children}</em>;
    },
    // Blockquote
    blockquote({ children }) {
      return (
        <blockquote className="border-l-2 border-indigo-300 pl-3 italic text-slate-500 my-2">
          {children}
        </blockquote>
      );
    },
    // Horizontal rule
    hr() {
      return <hr className="my-2 border-slate-200" />;
    },
    // Tables (remark-gfm)
    table({ children }) {
      return (
        <div className="overflow-x-auto my-2">
          <table className="text-xs border-collapse w-full">{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-slate-100">{children}</thead>;
    },
    th({ children }) {
      return <th className="border border-slate-200 px-2 py-1 font-semibold text-left">{children}</th>;
    },
    td({ children }) {
      return <td className="border border-slate-200 px-2 py-1">{children}</td>;
    },
    a({ href, title, children }) {
      const isInlineCitation = href === '#';
      if (isInlineCitation) {
        return <CitationPopover title={title}>{children}</CitationPopover>;
      }
      return (
        <a href={href} title={title} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
          {children}
        </a>
      );
    },
  };

  return (
    <div className={`break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
