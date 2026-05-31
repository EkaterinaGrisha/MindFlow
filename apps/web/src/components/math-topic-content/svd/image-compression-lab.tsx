import { useMemo, useState } from 'react';

type ImageKind = 'portrait' | 'landscape' | 'text';

type ImagePreset = {
  id: ImageKind;
  title: string;
  description: string;
  effectiveRank: number;
  cliff?: number;
  decay: number;
};

const SIZE = 300;
const MAX_RANK = 300;
const ORIGINAL_VALUES = SIZE * SIZE;
const COMPRESSED_VALUES_PER_RANK = SIZE + SIZE + 1;

const IMAGE_PRESETS: ImagePreset[] = [
  {
    id: 'portrait',
    title: 'Портрет',
    description: 'Крупные гладкие области кожи и фона дают быстрый спад спектра: лицо узнаётся рано, детали глаз и волос требуют большего k.',
    effectiveRank: 150,
    cliff: 150,
    decay: 24,
  },
  {
    id: 'landscape',
    title: 'Пейзаж',
    description: 'Небо и горизонт хорошо сжимаются, но трава, деревья и мелкие текстуры удерживают длинный хвост сингулярных чисел.',
    effectiveRank: 260,
    cliff: 100,
    decay: 42,
  },
  {
    id: 'text',
    title: 'Текст',
    description: 'Резкие границы букв плохо переносят малый ранг: сюжет понятен быстро, но читаемость появляется заметно позже.',
    effectiveRank: 300,
    decay: 70,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function makeSigmas({ id, effectiveRank, cliff, decay }: ImagePreset) {
  return Array.from({ length: MAX_RANK }, (_, i) => {
    const rank = i + 1;
    if (rank > effectiveRank) return 0;

    const base = 220 * Math.exp(-i / decay) + 8 * Math.exp(-i / 160);
    const texture = id === 'text' ? 24 / Math.sqrt(rank) : id === 'landscape' ? 14 / Math.sqrt(rank) : 8 / Math.sqrt(rank);
    const cliffFactor = cliff && rank > cliff ? 0.12 * Math.exp(-(rank - cliff) / 10) : 1;

    return Math.max(0, (base + texture) * cliffFactor);
  });
}

function metricsFor(k: number, sigmas: number[]) {
  const totalEnergy = sigmas.reduce((sum, sigma) => sum + sigma * sigma, 0);
  const keptEnergy = sigmas.slice(0, k).reduce((sum, sigma) => sum + sigma * sigma, 0);
  const lostShare = totalEnergy > 0 ? Math.max(0, 1 - keptEnergy / totalEnergy) : 0;
  const relativeError = Math.sqrt(lostShare);
  const psnr = relativeError <= 1e-6 ? Infinity : 20 * Math.log10(1 / relativeError);
  const storedValues = k * COMPRESSED_VALUES_PER_RANK;

  return {
    compressionRatio: ORIGINAL_VALUES / storedValues,
    storedShare: storedValues / ORIGINAL_VALUES,
    relativeError,
    psnr,
    keptShare: totalEnergy > 0 ? keptEnergy / totalEnergy : 1,
  };
}

function qualityFor(k: number, preset: ImagePreset, keptShare: number) {
  const rankQuality = clamp(k / Math.min(preset.effectiveRank, MAX_RANK), 0, 1);
  return clamp(0.25 * rankQuality + 0.75 * Math.sqrt(keptShare), 0, 1);
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-900 tabular-nums">{value}</div>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{hint}</p>
    </div>
  );
}

function ImageScene({ kind, reconstructed, quality }: { kind: ImageKind; reconstructed?: boolean; quality: number }) {
  const blur = reconstructed ? Math.max(0, 9 * (1 - quality)) : 0;
  const detailOpacity = reconstructed ? clamp((quality - 0.32) / 0.5, 0, 1) : 1;
  const fineOpacity = reconstructed ? clamp((quality - 0.62) / 0.35, 0, 1) : 1;
  const posterize = reconstructed ? clamp(0.9 - quality, 0, 0.9) : 0;
  const idPrefix = `${kind}-${reconstructed ? 'reconstructed' : 'original'}`;

  return (
    <svg viewBox="0 0 300 300" className="aspect-square w-full rounded-2xl border border-slate-200 bg-slate-100 shadow-inner" role="img">
      <defs>
        <linearGradient id={`${idPrefix}-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={kind === 'landscape' ? '#dbeafe' : '#f8fafc'} />
          <stop offset="1" stopColor={kind === 'text' ? '#e2e8f0' : '#94a3b8'} />
        </linearGradient>
        <filter id={`${idPrefix}-rank-filter`}>
          <feGaussianBlur stdDeviation={blur} />
          {posterize > 0 && <feComponentTransfer><feFuncR type="discrete" tableValues="0 .18 .36 .54 .72 .9 1"/><feFuncG type="discrete" tableValues="0 .18 .36 .54 .72 .9 1"/><feFuncB type="discrete" tableValues="0 .18 .36 .54 .72 .9 1"/></feComponentTransfer>}
        </filter>
        <pattern id={`${idPrefix}-hatch`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 12 L12 0" stroke="#334155" strokeWidth="1" opacity="0.22" />
        </pattern>
      </defs>
      <g filter={reconstructed ? `url(#${idPrefix}-rank-filter)` : undefined}>
        <rect width="300" height="300" fill={`url(#${idPrefix}-bg)`} />
        {kind === 'portrait' && (
          <>
            <path d="M72 255 C88 212 105 196 150 196 C195 196 214 214 228 255 Z" fill="#475569" />
            <path d="M88 122 C90 62 119 35 154 36 C196 37 221 73 213 129 C206 181 183 210 150 210 C116 210 94 176 88 122 Z" fill="#cbd5e1" />
            <path d="M92 106 C100 55 132 29 168 38 C202 47 220 78 213 121 C195 94 174 84 145 91 C123 96 111 105 92 106 Z" fill="#334155" opacity={0.92} />
            <g opacity={detailOpacity}>
              <path d="M108 137 C119 131 131 131 141 137" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
              <path d="M160 137 C172 131 184 132 195 139" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
              <path d="M148 145 C144 158 143 167 152 170" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
              <path d="M123 184 C140 194 164 194 181 184" fill="none" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
            </g>
            <g opacity={fineOpacity}>
              <path d="M82 112 C111 84 137 74 183 82" fill="none" stroke={`url(#${idPrefix}-hatch)`} strokeWidth="16" />
              <circle cx="126" cy="140" r="4" fill="#020617" /><circle cx="176" cy="141" r="4" fill="#020617" />
            </g>
          </>
        )}
        {kind === 'landscape' && (
          <>
            <path d="M0 172 C45 150 80 154 123 169 C165 186 205 176 300 144 L300 300 L0 300 Z" fill="#475569" />
            <path d="M0 206 C65 170 107 166 160 198 C206 226 244 203 300 178 L300 300 L0 300 Z" fill="#64748b" opacity="0.92" />
            <path d="M42 162 L96 84 L153 164 Z" fill="#cbd5e1" />
            <path d="M116 168 L190 57 L269 170 Z" fill="#94a3b8" />
            <path d="M142 129 L190 57 L224 130 C192 111 169 112 142 129 Z" fill="#f8fafc" opacity="0.8" />
            <circle cx="244" cy="58" r="24" fill="#e2e8f0" opacity="0.86" />
            <g opacity={detailOpacity}>
              {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${24 + i * 27} 236 C${39 + i * 25} 214 ${47 + i * 22} 215 ${65 + i * 24} 235`} fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />)}
            </g>
            <g opacity={fineOpacity}>
              {Array.from({ length: 34 }, (_, i) => <path key={i} d={`M${(i * 23) % 300} 274 l${8 + (i % 5)} -${18 + (i % 7)}`} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />)}
            </g>
          </>
        )}
        {kind === 'text' && (
          <>
            <rect x="34" y="38" width="232" height="224" rx="10" fill="#f8fafc" />
            <path d="M62 86 H238 M62 128 H216 M62 170 H238 M62 212 H199" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" opacity="0.75" />
            <g opacity={detailOpacity} fill="#0f172a">
              <path d="M62 74 V54 H102 V62 H74 V72 H98 V80 H74 V92 H104 V100 H62 Z" />
              <path d="M116 100 V54 H128 L150 82 V54 H162 V100 H150 L128 72 V100 Z" />
              <path d="M178 100 V54 H194 C211 54 224 63 224 77 C224 91 212 100 194 100 Z M190 91 H194 C204 91 211 86 211 77 C211 68 204 63 194 63 H190 Z" />
              <path d="M62 156 V112 H76 L90 136 L104 112 H118 V156 H106 V130 L94 150 H86 L74 130 V156 Z" />
              <path d="M134 156 V112 H169 V121 H146 V129 H166 V138 H146 V147 H171 V156 Z" />
              <path d="M62 210 V172 H74 V200 H100 V210 Z" />
              <path d="M115 210 V172 H127 V210 Z" />
              <path d="M145 210 V172 H157 L179 194 V172 H191 V210 H179 L157 188 V210 Z" />
            </g>
            <g opacity={fineOpacity}>
              <path d="M62 236 H236" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
              <path d="M62 246 H206" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
            </g>
          </>
        )}
      </g>
      {reconstructed && quality < 0.22 && <rect width="300" height="300" fill="#e2e8f0" opacity={0.35 - quality} />}
    </svg>
  );
}

function SpectrumPlot({ sigmas, k }: { sigmas: number[]; k: number }) {
  const width = 640;
  const height = 210;
  const pad = 28;
  const positive = sigmas.filter((sigma) => sigma > 0);
  const maxLog = Math.log10(Math.max(...positive, 1));
  const minLog = Math.log10(Math.max(Math.min(...positive), 0.01));
  const xFor = (index: number) => pad + (index / (MAX_RANK - 1)) * (width - pad * 2);
  const yFor = (sigma: number) => {
    if (sigma <= 0) return height - pad;
    const t = (Math.log10(sigma) - minLog) / Math.max(1e-6, maxLog - minLog);
    return height - pad - t * (height - pad * 2);
  };
  const path = sigmas.map((sigma, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index).toFixed(2)} ${yFor(sigma).toFixed(2)}`).join(' ');
  const kx = xFor(k - 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-2xl border border-slate-200 bg-slate-950">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#475569" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#475569" />
      <path d={path} fill="none" stroke="#818cf8" strokeWidth="3" />
      <line x1={kx} x2={kx} y1={pad - 8} y2={height - pad} stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 5" />
      <text x={kx + 8} y={42} fill="#fbbf24" fontSize="13" fontWeight="700">k={k}</text>
      <text x={pad} y={20} fill="#cbd5e1" fontSize="12">log σᵢ</text>
      <text x={width - 74} y={height - 8} fill="#cbd5e1" fontSize="12">i = 300</text>
    </svg>
  );
}

export default function SVDImageCompressionLab() {
  const [kind, setKind] = useState<ImageKind>('portrait');
  const [rank, setRank] = useState(24);
  const preset = IMAGE_PRESETS.find((item) => item.id === kind) ?? IMAGE_PRESETS[0];
  const sigmas = useMemo(() => makeSigmas(preset), [preset]);
  const metrics = useMemo(() => metricsFor(rank, sigmas), [rank, sigmas]);
  const quality = qualityFor(rank, preset, metrics.keptShare);
  const firstFortyDb = useMemo(() => {
    const found = sigmas.findIndex((_, index) => metricsFor(index + 1, sigmas).psnr >= 40);
    return found === -1 ? null : found + 1;
  }, [sigmas]);

  return (
    <div>
      <h4 className="text-xl font-extrabold text-slate-900">Лаборатория 1: Сжатие изображения — найди предел</h4>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">
        <b>Исследовательский вопрос:</b> Насколько сильно можно сжать изображение с помощью SVD, чтобы человеческий глаз не заметил разницы?
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {IMAGE_PRESETS.map((item) => (
          <button
            key={item.id}
            onClick={() => setKind(item.id)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${item.id === kind ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'}`}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Ранг усечения</div>
            <div className="mt-1 text-sm text-slate-700">Aₖ хранит только первые k сингулярных направлений.</div>
          </div>
          <div className="text-3xl font-black text-indigo-700 tabular-nums">k={rank}</div>
        </div>
        <input
          type="range"
          min={1}
          max={MAX_RANK}
          step={1}
          value={rank}
          onChange={(event) => setRank(Number(event.target.value))}
          className="mt-4 w-full accent-indigo-600"
        />
        <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-500"><span>1</span><span>300</span></div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-extrabold text-slate-800">Исходное ч/б изображение 300×300</div>
          <ImageScene kind={kind} quality={1} />
        </div>
        <div>
          <div className="mb-2 text-sm font-extrabold text-slate-800">Восстановление Aₖ после усечённого SVD</div>
          <ImageScene kind={kind} reconstructed quality={quality} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MetricCard label="Коэффициент сжатия" value={`${metrics.compressionRatio.toFixed(1)}×`} hint={`${(metrics.storedShare * 100).toFixed(2)}% от исходных 90 000 чисел.`} />
        <MetricCard label="Относительная ошибка Фробениуса" value={`${(metrics.relativeError * 100).toFixed(2)}%`} hint="√(потерянная энергия / полная энергия)." />
        <MetricCard label="PSNR" value={Number.isFinite(metrics.psnr) ? `${metrics.psnr.toFixed(1)} дБ` : '∞ дБ'} hint={firstFortyDb ? `Порог 40 дБ здесь впервые достигается при k≈${firstFortyDb}.` : '40 дБ не достигается на этом спектре.'} />
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">График сингулярных чисел в лог-шкале</div>
        <SpectrumPlot sigmas={sigmas} k={rank} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-950">
          <div className="font-extrabold">Что исследовать</div>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Проверь k=1: справа остаётся только грубый градиент и меньше 1% данных.</li>
            <li>Найди k, где впервые узнаётся сюжет изображения: часто это диапазон 5–10.</li>
            <li>Определи визуально приемлемый диапазон: обычно черты уже читаются около k=20–50.</li>
            <li>Сравни момент, когда PSNR переходит 40 дБ, с субъективным качеством.</li>
            <li>Переключи портрет, пейзаж и текст: лучше сжимаются гладкие и повторяющиеся структуры.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <div className="font-extrabold">Встроенные загадки</div>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>У портрета 50% сингулярных чисел нулевые: при k=150 восстановление становится идеальным, потому что реальный ранг равен 150.</li>
            <li>У пейзажа резкий обрыв около i=100 выдаёт низкоранговую структуру с повторяющимся паттерном.</li>
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-950">
        <b>Ключевое открытие:</b> качество определяется не размером изображения, а его эффективным рангом — числом значимых сингулярных чисел.
        <p className="mt-2 text-emerald-900">Текущий набор: {preset.description}</p>
      </div>
    </div>
  );
}
