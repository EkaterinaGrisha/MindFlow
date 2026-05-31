// @ts-nocheck
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Database,
  Film,
  Image,
  Layers,
  Music,
  Waves,
  Play,
  Sigma,
  SlidersHorizontal,
  Sparkles,
  Target,
  Wand2,
  Zap,
} from 'lucide-react';
import { MarkdownRenderer } from '../../MarkdownRenderer';

const T = {
  text: '#1e293b',
  muted: '#64748b',
  mutedLight: '#94a3b8',
  primary: '#6366f1',
  primaryLight: '#eef2ff',
  primaryBorder: '#c7d2fe',
  primaryDark: '#4f46e5',
  accent: '#7c3aed',
  green: '#10b981',
  greenLight: '#d1fae5',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  red: '#ef4444',
  redLight: '#fee2e2',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  pink: '#ec4899',
  white: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
};

function F({ tex }: { tex: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 4px' }}>
      <MarkdownRenderer content={`$$${tex}$$`} />
    </div>
  );
}

function M({ tex }: { tex: string }) {
  return (
    <span style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: 1 }}>
      <MarkdownRenderer content={`$${tex}$`} />
    </span>
  );
}

function SectionHeader({ icon: Icon, label, title, color = T.primary }: any) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <h2 style={{ margin: 0, color: T.text, fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>{title}</h2>
    </div>
  );
}

function Card({ children, style }: any) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 22px', marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

function FormulaBox({ tex, hint, color = T.primary }: { tex: string; hint?: string; color?: string }) {
  return (
    <div style={{ background: color === T.primary ? T.primaryLight : `${color}12`, border: `1px solid ${color === T.primary ? T.primaryBorder : `${color}40`}`, borderRadius: 14, padding: '16px 22px', margin: '14px 0', textAlign: 'center' }}>
      <MarkdownRenderer content={`$$${tex}$$`} />
      {hint && <div style={{ fontSize: 12, color, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

function Callout({ color = T.amber, title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 12, padding: '13px 18px', margin: '14px 0' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function MiniCard({ icon: Icon, title, children, color = T.primary }: any) {
  return (
    <div style={{ background: `${color}0b`, border: `1px solid ${color}30`, borderRadius: 14, padding: '15px 17px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={17} color={color} />
        <div style={{ fontSize: 13, fontWeight: 800, color }}>{title}</div>
      </div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function VideoPlaceholder({ title, desc, duration, badge }: { title: string; desc: string; duration: string; badge: string }) {
  return (
    <div style={{ borderRadius: 20, background: '#0f172a', color: T.white, padding: '22px 26px', margin: '18px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle at 18px 18px, #fff 0 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div style={{ position: 'relative', display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ border: '1px solid rgba(255,255,255,.2)', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: '#c4b5fd' }}>{badge}</span>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{duration} · loop</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: '#cbd5e1', maxWidth: 640 }}>{desc}</div>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 999, background: 'rgba(99,102,241,.22)', border: '1px solid rgba(196,181,253,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Play size={20} fill="#c4b5fd" color="#c4b5fd" />
        </div>
      </div>
    </div>
  );
}

function ImageCompressionSVG() {
  const blocks = [
    { k: 'k=1', p: '0.5%', opacity: 0.18, label: 'пятно' },
    { k: 'k=5', p: '2.5%', opacity: 0.38, label: 'контуры' },
    { k: 'k=20', p: '10%', opacity: 0.68, label: 'узнаваемо' },
    { k: 'k=50', p: '25%', opacity: 0.92, label: 'почти оригинал' },
  ];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, margin: '16px 0' }}>
      <svg viewBox="0 0 760 250" width="100%" height="auto" role="img" aria-label="Сжатие изображения через SVD">
        <defs>
          <linearGradient id="svdFace" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#c7d2fe" />
            <stop offset="1" stopColor="#312e81" />
          </linearGradient>
        </defs>
        {blocks.map((b, i) => {
          const x = 34 + i * 178;
          return (
            <g key={b.k}>
              <rect x={x} y="24" width="128" height="128" rx="16" fill="url(#svdFace)" opacity={b.opacity} />
              <ellipse cx={x + 64} cy="84" rx={34 + i * 4} ry={44} fill="#111827" opacity={0.08 + i * 0.07} />
              <circle cx={x + 48} cy="78" r={2 + i} fill="#111827" opacity={i > 0 ? 0.3 + i * 0.1 : 0} />
              <circle cx={x + 80} cy="78" r={2 + i} fill="#111827" opacity={i > 0 ? 0.3 + i * 0.1 : 0} />
              <path d={`M${x + 43} ${112 - i * 2} Q${x + 64} ${122 - i * 2} ${x + 85} ${112 - i * 2}`} stroke="#111827" strokeWidth="3" fill="none" opacity={i > 1 ? 0.28 + i * 0.12 : 0} />
              <text x={x + 64} y="181" textAnchor="middle" fontSize="14" fontWeight="800" fill={T.primary}>{b.k}</text>
              <text x={x + 64} y="202" textAnchor="middle" fontSize="12" fill={T.muted}>храним {b.p}</text>
              <text x={x + 64} y="221" textAnchor="middle" fontSize="12" fill={T.muted}>{b.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function VarianceSVG() {
  const bars = [90, 70, 52, 40, 31, 24, 19, 15, 12, 10, 8, 7, 6, 5, 4, 3, 3, 2];
  const cum = [20, 34, 47, 58, 67, 74, 80, 84, 87, 90, 92, 94, 96, 97, 98, 98.5, 99, 99.3];
  const path = cum.map((v, i) => `${i === 0 ? 'M' : 'L'} ${50 + i * 34} ${160 - v * 1.25}`).join(' ');
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, margin: '16px 0' }}>
      <svg viewBox="0 0 700 230" width="100%" height="auto" role="img" aria-label="График выбора k">
        <line x1="45" y1="170" x2="650" y2="170" stroke={T.border} strokeWidth="2" />
        <line x1="45" y1="28" x2="45" y2="170" stroke={T.border} strokeWidth="2" />
        <text x="52" y="24" fontSize="11" fill={T.muted}>σᵢ</text>
        <text x="610" y="26" fontSize="11" fill={T.muted}>доля</text>
        {bars.map((h, i) => (
          <rect key={i} x={45 + i * 34} y={170 - h * 1.35} width="18" height={h * 1.35} rx="4" fill={T.primary} opacity={i < 5 ? 0.82 : i < 10 ? 0.52 : 0.24} />
        ))}
        <path d={path} fill="none" stroke={T.green} strokeWidth="4" strokeLinecap="round" />
        {[{ k: 5, y: 67, text: '70%' }, { k: 10, y: 90, text: '90% · локоть' }, { k: 18, y: 99, text: '99%' }].map((p) => {
          const x = 50 + (p.k - 1) * 34;
          const y = 160 - p.y * 1.25;
          return <g key={p.k}><circle cx={x} cy={y} r="6" fill={T.green} /><line x1={x} y1={y} x2={x} y2="170" stroke={T.green} strokeDasharray="4 4" /><text x={x + 8} y={y - 8} fontSize="12" fontWeight="800" fill={T.green}>k={p.k}: {p.text}</text></g>;
        })}
        <text x="350" y="208" textAnchor="middle" fontSize="12" fill={T.muted}>Выбор k — компромисс между сжатием и качеством</text>
      </svg>
    </div>
  );
}

function SwissKnifeSVG() {
  const items = [
    ['Сжатие', 'A≈Aₖ', 380, 34, T.primary],
    ['PCA', 'Vₖ = компоненты', 565, 98, T.green],
    ['Рекомендации', 'скрытые факторы', 555, 252, T.amber],
    ['Псевдообращение', 'A⁺=VΣ⁺Uᵀ', 380, 326, T.violet],
    ['Шумоподавление', 'хвост = шум', 120, 252, T.cyan],
    ['Ранг и базисы', 'rank = #σᵢ>0', 105, 98, T.pink],
  ];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, margin: '16px 0' }}>
      <svg viewBox="0 0 760 420" width="100%" height="auto" role="img" aria-label="SVD — швейцарский нож">
        <circle cx="380" cy="210" r="78" fill={T.primaryLight} stroke={T.primaryBorder} strokeWidth="2" />
        <text x="380" y="198" textAnchor="middle" fontSize="18" fontWeight="900" fill={T.primary}>SVD</text>
        <text x="380" y="224" textAnchor="middle" fontSize="16" fontFamily="monospace" fill={T.text}>A = UΣVᵀ</text>
        {items.map(([title, sub, x, y, color]) => (
          <g key={title}>
            <line x1="380" y1="210" x2={x} y2={y} stroke={color} strokeWidth="2" opacity="0.35" />
            <rect x={x - 82} y={y - 30} width="164" height="60" rx="14" fill="#fff" stroke={color} strokeWidth="1.5" />
            <text x={x} y={y - 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{title}</text>
            <text x={x} y={y + 15} textAnchor="middle" fontSize="11" fill={T.muted}>{sub}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const applications = [
  ['Сжатие', 'Оставляем Aₖ вместо A', 'Усечённое SVD'],
  ['PCA', 'Центрируем X, берём Vₖ', 'Полное или усечённое SVD'],
  ['Рекомендации', 'R≈UₖΣₖVₖᵀ', 'Усечённое SVD / матричная факторизация'],
  ['МНК / регрессия', 'x=A⁺b', 'Псевдообращение через SVD'],
  ['Шумоподавление', 'Первые k компонент = сигнал', 'Усечённое SVD'],
  ['Ранг и базисы', 'rank = число ненулевых σᵢ', 'Полное SVD'],
  ['Число обусловленности', 'κ=σ₁/σᵣ', 'Полное SVD'],
  ['Нормы', '||A||₂=σ₁, ||A||F²=Σσᵢ²', 'Полное SVD'],
];

const quiz = [
  ['В каком смысле Aₖ оптимальна?', 'Она минимизирует ошибку среди всех матриц ранга ≤ k в норме Фробениуса; в спектральной норме ошибка равна σₖ₊₁.'],
  ['Как связаны PCA и SVD?', 'PCA — это SVD на центрированной X: правые сингулярные векторы V задают главные компоненты, а σᵢ²/(n−1) — дисперсии.'],
  ['Зачем нужна A⁺?', 'Псевдообратная A⁺=VΣ⁺Uᵀ даёт МНК-решение, а при множестве решений выбирает решение минимальной нормы.'],
  ['Почему SVD лучше простого уменьшения разрешения?', 'SVD сохраняет главные структурные паттерны матрицы, а не просто удаляет пиксели или высокие частоты.'],
  ['Что означает k=50 факторов в рекомендациях?', 'Пользователи и фильмы представлены 50-мерными векторами скрытых вкусов; оценка предсказывается их скалярным произведением.'],
];

export default function SVDApplicationsTheoryRich() {
  const navSections = [
    ['why', 'Зачем'], ['low-rank', 'Aₖ'], ['eckart', 'Оптимальность'], ['image', 'Сжатие'], ['choose', 'Выбор k'],
    ['pca', 'PCA'], ['recs', 'Рекомендации'], ['pinv', 'A⁺'], ['noise', 'Шум'], ['map', 'Карта'], ['check', 'Проверь себя'],
  ];

  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Sigma size={15} color={T.primary} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: T.primary, textTransform: 'uppercase' }}>Линейная алгебра</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 11, color: T.muted }}>25–30 минут</span>
        </div>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>SVD: сингулярное разложение — часть 2</h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 16 }}>Применения: сжатие, PCA, рекомендации, псевдообращение и шумоподавление.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 46 }}>
        {navSections.map(([id, label]) => (
          <a key={id} href={`#${id}`} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${T.primary}0f`, color: T.primary, border: `1px solid ${T.primaryBorder}`, textDecoration: 'none' }}>{label}</a>
        ))}
      </div>

      <section id="why" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Sparkles} label="Мотивация" title="Зачем это вообще нужно" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginBottom: 18 }}>
          <MiniCard icon={Image} title="Фото 4000×3000" color={T.primary}>12 миллионов чисел можно заменить первыми компонентами SVD и передать почти без потерь.</MiniCard>
          <MiniCard icon={Film} title="Netflix-матрица" color={T.amber}>Пользователи × фильмы почти вся пустая, но SVD находит скрытые факторы вкусов.</MiniCard>
          <MiniCard icon={Database} title="10 000 генов" color={T.green}>Тысячи признаков сжимаются до нескольких главных компонент — «супер-признаков».</MiniCard>
        </div>
        <Callout title="Главная идея" color={T.primary}>SVD ранжирует информацию по важности: <M tex="\sigma_1" /> — самая сильная компонента, затем всё слабее. Отбрасывая малые сингулярные числа, мы получаем сжатие, очистку и предсказание.</Callout>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><Music size={18} color={T.violet} /><strong style={{ color: T.text }}>Метафора: музыка и ноты</strong></div>
          <p style={{ margin: 0, color: T.text, lineHeight: 1.8 }}>Оркестр из 100 инструментов кажется 100 независимыми дорожками. Но часто музыку описывают 5–6 главных «голосов»: тема, контрапункт, ритм, оттенки. SVD делает то же с данными: выделяет главные мелодии и оставляет обертоны в хвосте.</p>
        </Card>
        <ImageCompressionSVG />
        <VideoPlaceholder badge="Видео 1" duration="25 сек" title="Сжатие изображения — слои проявляются" desc="Ползунок k меняет ранг приближения: при k=1 — мутное пятно, k=5 — контуры, k=20 — узнаваемое изображение, k=50 — почти оригинал. Рядом падающий спектр сингулярных чисел." />
      </section>

      <section id="low-rank" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Layers} label="Механика" title="Низкоранговая аппроксимация: как оставить главное" />
        <FormulaBox tex="A=U\Sigma V^T=\sigma_1u_1v_1^T+\sigma_2u_2v_2^T+\dots+\sigma_ru_rv_r^T" hint="каждое слагаемое — матрица ранга 1" />
        <p style={{ color: T.text, lineHeight: 1.8 }}>Слагаемое <M tex="\sigma_i u_i v_i^T" /> — один паттерн: все его столбцы пропорциональны <M tex="u_i" />, а строки пропорциональны <M tex="v_i" />. Компоненты идут по убыванию силы <M tex="\sigma_i" />.</p>
        <FormulaBox tex="A_k=\sigma_1u_1v_1^T+\dots+\sigma_ku_kv_k^T=U_k\Sigma_kV_k^T" hint="оставляем первые k слоёв и получаем матрицу ранга k" color={T.green} />
        <Card>
          <div style={{ fontWeight: 800, color: T.text, marginBottom: 8 }}>Экономия памяти</div>
          <p style={{ margin: 0, color: T.text, lineHeight: 1.8 }}>Полная матрица <M tex="m\times n" /> требует <M tex="mn" /> чисел. Усечённое SVD требует примерно <M tex="k(m+n+1)" />: k сингулярных чисел, k столбцов U и k столбцов V.</p>
          <FormulaBox tex="m=n=1000,\; k=20:\quad 1\,000\,000 \to 20(1000+1000+1)=40\,020" hint="примерно в 25 раз меньше" />
        </Card>
        <VideoPlaceholder badge="Видео 2" duration="22 сек" title="Сумма слоёв — от пятна к портрету" desc="Компоненты добавляются одна за другой: первый слой даёт грубую структуру, второй усиливает контраст, третий проявляет черты, последние слои добавляют мелкие детали." />
      </section>

      <section id="eckart" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Target} label="Теорема" title="Эккарт–Янг: почему это оптимально" color={T.green} />
        <FormulaBox tex="\lVert A-A_k\rVert_F=\min_{\operatorname{rank}(B)\le k}\lVert A-B\rVert_F=\sqrt{\sigma_{k+1}^2+\dots+\sigma_r^2}" hint="в норме Фробениуса ошибка равна энергии отброшенного хвоста" color={T.green} />
        <FormulaBox tex="\lVert A-A_k\rVert_2=\sigma_{k+1}" hint="в спектральной норме ошибка равна первому отброшенному сингулярному числу" color={T.green} />
        <Callout title="Что это значит" color={T.green}>Никакой другой метод не сохранит больше информации при том же ранге k, если качество измеряется квадратами ошибок. SVD — не просто удобное сжатие, а математически лучшее низкоранговое приближение.</Callout>
      </section>

      <section id="image" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Image} label="Пример" title="Сжатие изображения" />
        <Card>
          <p style={{ margin: '0 0 12px', color: T.text, lineHeight: 1.8 }}>Серое изображение — матрица яркостей от 0 до 255. В игрушечном примере 10×10 с тремя тёмными блоками первые три сингулярные компоненты уже восстанавливают структуру.</p>
          <pre style={{ margin: 0, background: '#0f172a', color: '#e2e8f0', borderRadius: 12, padding: 16, overflowX: 'auto', lineHeight: 1.25 }}>{`■■■■□□□□□□
■■■■□□□□□□
■■■■□□□□□□
■■■■□□□□□□
□□□□■■■■□□
□□□□■■■■□□
□□□□■■■■□□
□□□□□□■■■■
□□□□□□■■■■
□□□□□□■■■■`}</pre>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          <MiniCard icon={Layers} title="k=1" color={T.muted}>21 число вместо 100: средняя яркость и грубый фон.</MiniCard>
          <MiniCard icon={Layers} title="k=2" color={T.primary}>Появляются две зоны, блоки начинают разделяться.</MiniCard>
          <MiniCard icon={Layers} title="k=3" color={T.green}>Три блока почти восстановлены: 63 числа вместо 100.</MiniCard>
          <MiniCard icon={Layers} title="k=5" color={T.amber}>105 чисел больше исходных 100 — сжатие теряет смысл.</MiniCard>
        </div>
      </section>

      <section id="choose" style={{ marginBottom: 52 }}>
        <SectionHeader icon={SlidersHorizontal} label="Практика" title="Как выбрать k" color={T.amber} />
        <VarianceSVG />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <MiniCard icon={BarChart3} title="1. Локоть спектра" color={T.primary}>Строим <M tex="\sigma_i" />. Точка, где резкое падение переходит в хвост, — хороший кандидат.</MiniCard>
          <MiniCard icon={Activity} title="2. Объяснённая дисперсия" color={T.green}><M tex="\frac{\sum_{i=1}^k\sigma_i^2}{\sum_{i=1}^r\sigma_i^2}" />: для изображений часто хотят 90–95%, для PCA — 70–90%.</MiniCard>
          <MiniCard icon={Wand2} title="3. Проверка задачей" color={T.amber}>Для сжатия смотрят на визуальную разницу; для шумоподавления убирают хвост, похожий на равномерный шум.</MiniCard>
        </div>
      </section>

      <section id="pca" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Brain} label="Связь" title="SVD и PCA: одно и то же" color={T.violet} />
        <Card>
          <p style={{ margin: '0 0 10px', color: T.text, lineHeight: 1.8 }}>Пусть <M tex="X" /> — центрированная матрица данных размера <M tex="n\times p" />. Классический PCA строит ковариационную матрицу <M tex="C=\frac{1}{n-1}X^TX" /> и ищет её собственные векторы.</p>
          <FormulaBox tex="X=U\Sigma V^T \quad\Rightarrow\quad X^TX=V\Sigma^2V^T" hint="собственные векторы XᵀX — это столбцы V" color={T.violet} />
          <p style={{ margin: 0, color: T.text, lineHeight: 1.8 }}>Значит, правые сингулярные векторы <M tex="v_i" /> — главные компоненты, а дисперсии равны <M tex="\lambda_i=\sigma_i^2/(n-1)" />. Координаты объектов в новом базисе — <M tex="U\Sigma" />.</p>
        </Card>
        <VideoPlaceholder badge="Видео 3" duration="24 сек" title="PCA через SVD — два пути к одному результату" desc="Слева PCA через XᵀX, справа SVD сразу на X. Стрелки главных компонент и проекции точек совпадают: PCA = SVD на центрированной матрице." />
      </section>

      <section id="recs" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Film} label="Data Science" title="Рекомендательные системы: скрытые факторы" color={T.amber} />
        <p style={{ color: T.text, lineHeight: 1.8 }}>Матрица рейтингов <M tex="R" />: строки — пользователи, столбцы — фильмы. Большинство ячеек пустые, но вкусы и фильмы можно описать общим пространством скрытых факторов.</p>
        <FormulaBox tex="R\approx U_k\Sigma_kV_k^T" hint="пользователи и фильмы живут в одном k-мерном пространстве" color={T.amber} />
        <Card>
          <ul style={{ margin: 0, paddingLeft: 18, color: T.text, lineHeight: 1.8 }}>
            <li><M tex="U_k\Sigma_k^{1/2}" /> — векторы пользователей.</li>
            <li><M tex="\Sigma_k^{1/2}V_k^T" /> — векторы фильмов.</li>
            <li>Предсказанная оценка — скалярное произведение векторов пользователя и фильма.</li>
          </ul>
        </Card>
        <Callout title="Netflix Prize" color={T.amber}>В конкурсе Netflix Prize (2006–2009) SVD и его вариации были ядром успешных моделей: скрытые факторы улучшали предсказание рейтингов.</Callout>
        <VideoPlaceholder badge="Видео 4" duration="24 сек" title="Рекомендательная система — скрытые факторы" desc="Разреженная матрица рейтингов раскладывается на векторы пользователей и фильмов; серые пропуски заполняются предсказанными оценками." />
      </section>

      <section id="pinv" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Zap} label="Линейные системы" title="Псевдообращение: МНК через SVD" color={T.cyan} />
        <FormulaBox tex="A^+=V\Sigma^+U^T" hint="ненулевые σᵢ заменяем на 1/σᵢ, нули оставляем нулями" color={T.cyan} />
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <MiniCard icon={CheckCircle2} title="Система совместна" color={T.green}><M tex="x=A^+b" /> даёт решение минимальной нормы.</MiniCard>
            <MiniCard icon={Target} title="Система несовместна" color={T.cyan}><M tex="x=A^+b" /> минимизирует <M tex="\lVert Ax-b\rVert" />.</MiniCard>
            <MiniCard icon={Activity} title="Мультиколлинеарность" color={T.violet}>SVD решает регрессию без обращения вырожденной <M tex="X^TX" />.</MiniCard>
          </div>
        </Card>
        <FormulaBox tex="\hat\beta=(X^TX)^{-1}X^Ty\quad\text{если обратима, а в общем случае}\quad \hat\beta=X^+y" hint="связь с линейной регрессией" color={T.cyan} />
        <VideoPlaceholder badge="Видео 5" duration="22 сек" title="Псевдообращение — решение неразрешимой системы" desc="Вектор b проецируется на пространство столбцов A; A⁺b выбирает ближайшую точку, а при множестве решений — самое короткое решение." />
      </section>

      <section id="noise" style={{ marginBottom: 52 }}>
        <SectionHeader icon={Waves} label="Фильтр" title="Шумоподавление: SVD как умный фильтр" color={T.pink} />
        <p style={{ color: T.text, lineHeight: 1.8 }}>Реальные данные — сигнал плюс шум. Сигнал часто имеет низкий ранг: несколько независимых факторов. Шум имеет высокий ранг: много независимых мелких ошибок.</p>
        <FormulaBox tex="\text{данные}=\text{первые }k\text{ компонент} + \text{хвост}" hint="первые компоненты = сигнал, хвост = шум" color={T.pink} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          <MiniCard icon={Activity} title="Аудио" color={T.pink}>В спектрограмме голос образует крупную структуру, а фоновый шум размазан по частотам.</MiniCard>
          <MiniCard icon={Image} title="Изображения" color={T.pink}>Усечение SVD убирает пиксельную зернистость, сохраняя основные контуры.</MiniCard>
        </div>
        <VideoPlaceholder badge="Видео 6" duration="20 сек" title="Шумоподавление — SVD как умный фильтр" desc="После добавления шума хвост сингулярных чисел поднимается. Ползунок k оставляет первые компоненты и отбрасывает шумовой хвост." />
      </section>

      <section id="map" style={{ marginBottom: 52 }}>
        <SectionHeader icon={BookOpen} label="Система знаний" title="SVD как швейцарский нож" />
        <SwissKnifeSVG />
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr>{['Применение', 'Что делаем', 'Какой SVD'].map(h => <th key={h} style={{ textAlign: 'left', color: T.muted, borderBottom: `1px solid ${T.border}`, padding: '10px 8px' }}>{h}</th>)}</tr></thead>
              <tbody>{applications.map((row) => <tr key={row[0]}>{row.map((cell, i) => <td key={cell} style={{ borderBottom: `1px solid ${T.border}`, padding: '10px 8px', color: i === 0 ? T.primary : T.text, fontWeight: i === 0 ? 800 : 500 }}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </Card>
        <Callout title="Ограничения" color={T.red}>Полное SVD дорого для огромных матриц; компоненты не всегда интерпретируемы; признаки нужно масштабировать; для разреженных матриц с пропусками нужны специальные варианты SVD и матричной факторизации.</Callout>
      </section>

      <section id="check" style={{ marginBottom: 20 }}>
        <SectionHeader icon={CheckCircle2} label="Самопроверка" title="Проверьте себя" color={T.green} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quiz.map(([q, a], i) => (
            <Card key={q} style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: T.greenLight, color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 6 }}>{q}</div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{a}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Callout title="Финальная мысль" color={T.primary}>SVD — это способ разложить данные на упорядоченные по важности слои. Поэтому из одной формулы вырастают сжатие, PCA, рекомендации, МНК и шумоподавление.</Callout>
      </section>
    </div>
  );
}
