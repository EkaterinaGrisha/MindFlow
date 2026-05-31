// Self-contained SVG infographics for the guide page.
// All colors via CSS vars so they respect the app theme.

export function GraphMapInfographic() {
  const nodes: Array<{ cx: number; cy: number; fill: string; label: string }> = [
    { cx: 50, cy: 150, fill: 'var(--color-secondary)', label: 'Векторы' },
    { cx: 50, cy: 220, fill: 'var(--color-secondary)', label: 'Матрицы' },
    { cx: 160, cy: 110, fill: 'rgba(124,58,237,0.5)', label: 'Определитель' },
    { cx: 160, cy: 200, fill: 'rgba(124,58,237,0.5)', label: 'СЛАУ' },
    { cx: 160, cy: 280, fill: 'var(--color-surface-container-high)', label: 'Ранг' },
    { cx: 290, cy: 90, fill: '#ef4444', label: 'Собств.\nзначения' },
    { cx: 290, cy: 200, fill: 'var(--color-surface-container-high)', label: 'PCA' },
    { cx: 290, cy: 300, fill: 'var(--color-surface-container-high)', label: 'SVD' },
    { cx: 410, cy: 150, fill: 'var(--color-surface-container-high)', label: 'Регрессия' },
    { cx: 410, cy: 240, fill: 'var(--color-surface-container-high)', label: 'Эмбеддинги' },
  ];
  const edges: Array<[number, number]> = [
    [0, 2], [0, 3], [1, 2], [1, 3], [1, 4],
    [2, 5], [3, 6], [4, 7], [4, 6],
    [5, 8], [6, 8], [7, 9],
  ];
  return (
    <svg viewBox="0 0 480 380" className="w-full h-auto" role="img" aria-label="Карта графа знаний">
      <defs>
        <marker id="g-arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill="var(--color-outline-variant)" />
        </marker>
      </defs>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx + 22}
          y1={nodes[a].cy}
          x2={nodes[b].cx - 22}
          y2={nodes[b].cy}
          stroke="var(--color-outline-variant)"
          strokeWidth="1.6"
          markerEnd="url(#g-arrow)"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.cx}
            cy={n.cy}
            r="22"
            fill={n.fill}
            stroke="var(--color-outline-variant)"
            strokeWidth="1"
          />
          {n.label.split('\n').map((line, k) => (
            <text
              key={k}
              x={n.cx}
              y={n.cy + 38 + k * 12}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="var(--color-primary)"
            >
              {line}
            </text>
          ))}
        </g>
      ))}
      {/* Legend */}
      <g transform="translate(20, 340)" fontSize="10" fontWeight="600">
        <circle cx="6" cy="0" r="6" fill="var(--color-surface-container-high)" stroke="var(--color-outline-variant)" />
        <text x="18" y="3" fill="var(--color-on-surface-variant)">Не освоено</text>
        <circle cx="118" cy="0" r="6" fill="rgba(124,58,237,0.5)" />
        <text x="130" y="3" fill="var(--color-on-surface-variant)">В работе</text>
        <circle cx="220" cy="0" r="6" fill="var(--color-secondary)" />
        <text x="232" y="3" fill="var(--color-on-surface-variant)">Освоено</text>
        <circle cx="320" cy="0" r="6" fill="#ef4444" />
        <text x="332" y="3" fill="var(--color-on-surface-variant)">Пробел</text>
      </g>
    </svg>
  );
}

export function WorkspaceLayoutInfographic() {
  return (
    <svg viewBox="0 0 480 260" className="w-full h-auto" role="img" aria-label="AI Workspace: три панели">
      {/* Left — sources */}
      <g>
        <rect x="14" y="14" width="120" height="232" rx="10" fill="var(--color-surface-container-high)" />
        <text x="74" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-primary)">Источники</text>
        {['Тема курса', 'Загруженный PDF', 'Вставленный текст', 'Заметки'].map((label, i) => (
          <g key={label}>
            <rect x="26" y={50 + i * 36} width="96" height="26" rx="6" fill={i === 0 ? 'var(--color-secondary)' : 'var(--color-surface-container-low)'} opacity={i === 0 ? 0.18 : 1} />
            <text x="34" y={67 + i * 36} fontSize="10" fontWeight="600" fill="var(--color-primary)">{label}</text>
          </g>
        ))}
      </g>
      {/* Center — chat */}
      <g>
        <rect x="148" y="14" width="190" height="232" rx="10" fill="var(--color-surface-container-low)" />
        <text x="243" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-primary)">Чат с AI</text>
        <rect x="162" y="50" width="120" height="36" rx="10" fill="var(--color-surface-container-high)" />
        <text x="172" y="72" fontSize="10" fill="var(--color-on-surface-variant)">Объясни PCA на пальцах</text>
        <rect x="204" y="100" width="120" height="60" rx="10" fill="var(--color-secondary)" opacity="0.18" />
        <text x="214" y="120" fontSize="10" fontWeight="600" fill="var(--color-secondary)">AI-ментор</text>
        <text x="214" y="136" fontSize="9" fill="var(--color-on-surface-variant)">PCA ищет направления,</text>
        <text x="214" y="148" fontSize="9" fill="var(--color-on-surface-variant)">где данные разбросаны…</text>
        <rect x="162" y="200" width="160" height="32" rx="10" fill="var(--color-surface-container-high)" />
        <text x="174" y="220" fontSize="10" fill="var(--color-on-surface-variant)">Спросите что-нибудь…</text>
      </g>
      {/* Right — tools */}
      <g>
        <rect x="352" y="14" width="114" height="232" rx="10" fill="var(--color-surface-container-high)" />
        <text x="409" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-primary)">Инструменты</text>
        {['Карточки', 'Цитаты', 'Заметка', 'Карта темы'].map((label, i) => (
          <g key={label}>
            <rect x="364" y={50 + i * 36} width="90" height="26" rx="6" fill="var(--color-surface-container-lowest)" stroke="var(--color-outline-variant)" />
            <text x="372" y={67 + i * 36} fontSize="10" fontWeight="600" fill="var(--color-primary)">{label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export function AIRolesInfographic() {
  const roles = [
    { title: 'Ментор', desc: 'Объясняет, отвечает на «почему», подкидывает примеры.', color: 'var(--color-secondary)' },
    { title: 'Методист', desc: 'Собирает план из ваших файлов и тем под вашу цель.', color: 'var(--color-primary)' },
    { title: 'Экзаменатор', desc: 'Проверяет — карточки, цепочки, найди ошибку.', color: '#0ea5e9' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {roles.map((r) => (
        <div
          key={r.title}
          className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4"
        >
          <div
            className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center text-white text-sm font-bold"
            style={{ background: r.color }}
          >
            {r.title[0]}
          </div>
          <p className="font-bold text-primary mb-1">{r.title}</p>
          <p className="text-sm text-on-surface-variant leading-relaxed">{r.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function CourseCycleInfographic() {
  const items = [
    { label: 'Теория', body: 'Идея и формулы простыми словами.', tone: 'rgba(124,58,237,0.18)' },
    { label: 'Разборы', body: 'Решения шаг за шагом с пояснениями AI.', tone: 'rgba(14,165,233,0.18)' },
    { label: 'Практика', body: 'Задачи с автоматической проверкой.', tone: 'rgba(16,185,129,0.18)' },
    { label: 'Лаборатории', body: 'Меняйте параметры — смотрите эффект.', tone: 'rgba(244,114,182,0.18)' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it, i) => (
        <div
          key={it.label}
          className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 relative"
        >
          <div
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 inline-block rounded-full px-2 py-0.5"
            style={{ background: it.tone, color: 'var(--color-primary)' }}
          >
            {i + 1}. {it.label}
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{it.body}</p>
        </div>
      ))}
    </div>
  );
}

export function BKTScaleInfographic() {
  const bands = [
    { from: 0, to: 30, label: 'Только начинаете', color: 'var(--color-surface-container-high)' },
    { from: 30, to: 60, label: 'В процессе', color: 'rgba(124,58,237,0.4)' },
    { from: 60, to: 90, label: 'Уверенное знание', color: 'var(--color-secondary)' },
    { from: 90, to: 100, label: 'Освоено', color: 'var(--color-primary)' },
  ];
  return (
    <div className="space-y-3">
      <div className="relative h-10 rounded-full overflow-hidden ring-1 ring-outline-variant/30">
        {bands.map((b) => (
          <div
            key={b.from}
            className="absolute top-0 bottom-0"
            style={{
              left: `${b.from}%`,
              width: `${b.to - b.from}%`,
              background: b.color,
            }}
          />
        ))}
        {[30, 60, 90].map((tick) => (
          <div
            key={tick}
            className="absolute top-0 bottom-0 w-px bg-white/70"
            style={{ left: `${tick}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {bands.map((b) => (
          <div key={b.from} className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="font-bold text-primary">{b.from}–{b.to}%</p>
            <p className="text-on-surface-variant">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BKTComparisonInfographic() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
          Обычный тест
        </p>
        <p className="text-3xl font-extrabold text-primary mb-1">5 / 10</p>
        <p className="text-sm text-on-surface-variant">Просто счёт — не видно, где именно пробел.</p>
      </div>
      <div className="rounded-2xl border border-secondary/40 bg-secondary/10 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary mb-2">
          BKT
        </p>
        <p className="text-3xl font-extrabold text-primary mb-1">87% по теме</p>
        <p className="text-sm text-on-surface-variant">
          Но <span className="font-semibold text-primary">собственные значения — 45%</span>,
          стоит повторить.
        </p>
      </div>
    </div>
  );
}
