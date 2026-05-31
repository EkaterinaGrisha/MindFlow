import { useState, type ReactNode } from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';

type Props = {
  id: string;
  number: number;
  icon: ReactNode;
  title: string;
  lead?: string;
  children: ReactNode;
};

export default function GuideSection({ id, number, icon, title, lead, children }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard blocked — fall back silently
    }
  };

  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-5 flex items-start gap-4">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary mb-1">
            Раздел {number}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors rounded-lg px-2 py-1 hover:bg-surface-container-low"
              title="Скопировать ссылку на раздел"
              aria-label="Скопировать ссылку на раздел"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
              {copied ? 'Скопировано' : 'Ссылка'}
            </button>
          </div>
          {lead && <p className="text-on-surface-variant mt-2 leading-relaxed">{lead}</p>}
        </div>
      </header>

      <div className="space-y-4 text-[15px] leading-relaxed text-on-surface-variant">{children}</div>
    </section>
  );
}
