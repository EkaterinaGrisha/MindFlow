import type { TourStep } from './tourSteps';

type Props = { kind: NonNullable<TourStep['illustration']> };

export default function StepIllustration({ kind }: Props) {
  if (kind === 'graph') {
    return (
      <svg viewBox="0 0 240 120" className="w-full h-32" role="img" aria-label="Граф знаний">
        <defs>
          <linearGradient id="ill-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--color-secondary)" />
            <stop offset="100%" stopColor="var(--color-primary)" />
          </linearGradient>
        </defs>
        {/* edges */}
        <g stroke="var(--color-outline-variant)" strokeWidth="1.5" fill="none">
          <line x1="40" y1="80" x2="100" y2="50" />
          <line x1="40" y1="80" x2="100" y2="95" />
          <line x1="100" y1="50" x2="170" y2="35" />
          <line x1="100" y1="95" x2="170" y2="85" />
          <line x1="170" y1="35" x2="210" y2="60" />
          <line x1="170" y1="85" x2="210" y2="60" />
        </g>
        {/* nodes */}
        <circle cx="40" cy="80" r="11" fill="url(#ill-grad)" />
        <circle cx="100" cy="50" r="11" fill="var(--color-secondary)" opacity="0.5" />
        <circle cx="100" cy="95" r="11" fill="var(--color-surface-container-high)" stroke="var(--color-outline-variant)" />
        <circle cx="170" cy="35" r="11" fill="var(--color-surface-container-high)" stroke="var(--color-outline-variant)" />
        <circle cx="170" cy="85" r="11" fill="#ef4444" opacity="0.65" />
        <circle cx="210" cy="60" r="11" fill="var(--color-surface-container-high)" stroke="var(--color-outline-variant)" />
      </svg>
    );
  }

  if (kind === 'workspace') {
    return (
      <svg viewBox="0 0 240 120" className="w-full h-32" role="img" aria-label="AI Workspace">
        {/* left panel - sources */}
        <rect x="10" y="10" width="50" height="100" rx="6" fill="var(--color-surface-container-high)" />
        <rect x="18" y="22" width="34" height="6" rx="2" fill="var(--color-outline-variant)" />
        <rect x="18" y="34" width="28" height="6" rx="2" fill="var(--color-outline-variant)" />
        <rect x="18" y="46" width="34" height="6" rx="2" fill="var(--color-secondary)" opacity="0.5" />
        {/* center - chat */}
        <rect x="68" y="10" width="100" height="100" rx="6" fill="var(--color-surface-container-low)" />
        <rect x="78" y="26" width="60" height="8" rx="3" fill="var(--color-secondary)" opacity="0.4" />
        <rect x="78" y="42" width="80" height="8" rx="3" fill="var(--color-outline-variant)" />
        <rect x="78" y="58" width="40" height="8" rx="3" fill="var(--color-outline-variant)" />
        <rect x="78" y="92" width="80" height="10" rx="5" fill="var(--color-primary)" opacity="0.85" />
        {/* right panel - tools */}
        <rect x="176" y="10" width="54" height="100" rx="6" fill="var(--color-surface-container-high)" />
        <rect x="184" y="22" width="38" height="6" rx="2" fill="var(--color-outline-variant)" />
        <rect x="184" y="34" width="38" height="6" rx="2" fill="var(--color-outline-variant)" />
        <rect x="184" y="46" width="30" height="6" rx="2" fill="var(--color-outline-variant)" />
      </svg>
    );
  }

  if (kind === 'course') {
    const labels = ['Теория', 'Разборы', 'Практика', 'Лабы'];
    return (
      <svg viewBox="0 0 240 120" className="w-full h-32" role="img" aria-label="Структура курса">
        {labels.map((label, i) => {
          const x = 12 + i * 56;
          return (
            <g key={label}>
              <rect x={x} y={36} width={48} height={48} rx="8" fill="var(--color-surface-container-high)" stroke="var(--color-outline-variant)" />
              <text x={x + 24} y={66} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-primary)">{label}</text>
              {i < labels.length - 1 && (
                <path d={`M${x + 50} 60 L${x + 54} 60`} stroke="var(--color-secondary)" strokeWidth="2" markerEnd="url(#arrow-course)" />
              )}
            </g>
          );
        })}
        <defs>
          <marker id="arrow-course" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L4,3 L0,6 z" fill="var(--color-secondary)" />
          </marker>
        </defs>
      </svg>
    );
  }

  // progress
  return (
    <svg viewBox="0 0 240 120" className="w-full h-32" role="img" aria-label="Шкала освоения">
      <rect x="20" y="50" width="200" height="14" rx="7" fill="var(--color-surface-container-high)" />
      <rect x="20" y="50" width="160" height="14" rx="7" fill="var(--color-secondary)" />
      <g fontSize="9" fill="var(--color-on-surface-variant)" fontWeight="600">
        <text x="20" y="82">0%</text>
        <text x="68" y="82" textAnchor="middle">30%</text>
        <text x="128" y="82" textAnchor="middle">60%</text>
        <text x="188" y="82" textAnchor="middle">90%</text>
        <text x="220" y="82" textAnchor="end">100%</text>
      </g>
      <g fontSize="10" fontWeight="700">
        <text x="20" y="36" fill="var(--color-primary)">Освоение темы</text>
        <text x="220" y="36" textAnchor="end" fill="var(--color-secondary)">87%</text>
      </g>
    </svg>
  );
}
