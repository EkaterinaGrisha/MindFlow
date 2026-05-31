import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  question: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export default function FAQItem({ question, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-container-low transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-primary">{question}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-[14px] text-on-surface-variant leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
