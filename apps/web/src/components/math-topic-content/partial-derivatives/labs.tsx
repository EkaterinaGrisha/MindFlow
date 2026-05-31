// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { LabBody, LabShell } from '../shared/labShell';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  text:          '#1e293b',
  muted:         '#64748b',
  mutedLight:    '#94a3b8',
  primary:       '#6366f1',
  primaryLight:  '#eef2ff',
  primaryBorder: '#c7d2fe',
  primaryDark:   '#4f46e5',
  accent:        '#7c3aed',
  green:         '#10b981',
  greenLight:    '#d1fae5',
  amber:         '#f59e0b',
  amberLight:    '#fef3c7',
  red:           '#ef4444',
  redLight:      '#fee2e2',
  white:         '#ffffff',
  surface:       '#f8fafc',
  border:        '#e2e8f0',
  cyan:          '#06b6d4',
  violet:        '#8b5cf6',
  pink:          '#ec4899',
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
function LabHeader({ title, question, badge }: { title: string; question: string; badge: string }) {
  return (
    <div style={{ borderRadius: 18, background: `linear-gradient(135deg,${T.primaryLight} 0%,${T.white} 60%,#f0fdf4 100%)`, border: `1px solid ${T.primaryBorder}`, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: T.primary, textTransform: 'uppercase' as const, background: T.primaryLight, border: `1px solid ${T.primaryBorder}`, borderRadius: 20, padding: '3px 10px' }}>{badge}</span>
      </div>
      <h3 style={{ margin: '0 0 7px', fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1.25 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>
        <strong style={{ color: T.text }}>Исследовательский вопрос:</strong> {question}
      </p>
    </div>
  );
}

function InfoCard({ color = T.primary, title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}0c`, border: `1px solid ${color}35`, borderRadius: 13, padding: '12px 15px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Callout({ color = T.amber, title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 11, padding: '11px 15px', marginTop: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function StatBadge({ label, value, color = T.primary }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 9, background: `${color}0c`, border: `1px solid ${color}30` }}>
      <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function PresetButton({ active, onClick, label, color = T.primary }: { active?: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: active ? color : T.white, color: active ? T.white : T.text, border: `1.5px solid ${active ? color : T.border}`, transition: 'all 0.15s' }}>
      {label}
    </button>
  );
}

function SectionLabel({ children, color = T.muted }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color, textTransform: 'uppercase' as const, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Collapsible({ title, children, color = T.primary }: { title: string; children: React.ReactNode; color?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${color}30`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: `${color}08`, border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{title}</span>
        {open ? <ChevronUp size={14} color={color} /> : <ChevronDown size={14} color={color} />}
      </button>
      {open && <div style={{ padding: '11px 14px', fontSize: 12, color: T.text, lineHeight: 1.75, background: T.white }}>{children}</div>}
    </div>
  );
}

// ─── Surface functions ────────────────────────────────────────────────────────
type SurfKey = 'bowl' | 'saddle' | 'waves' | 'xy' | 'rosenbrock';

const SURFS: Record<SurfKey, {
  label: string; latex: string;
  f:   (x: number, y: number) => number;
  dfx: (x: number, y: number) => number;
  dfy: (x: number, y: number) => number;
  fxx: (x: number, y: number) => number;
  fyy: (x: number, y: number) => number;
  fxy: (x: number, y: number) => number;
  color: string;
}> = {
  bowl: {
    label: 'Чаша', latex: 'z = x² + y²',
    f:   (x,y) => x*x + y*y,
    dfx: (x,_) => 2*x,
    dfy: (_,y) => 2*y,
    fxx: ()    => 2,
    fyy: ()    => 2,
    fxy: ()    => 0,
    color: T.primary,
  },
  saddle: {
    label: 'Седло', latex: 'z = x² − y²',
    f:   (x,y) => x*x - y*y,
    dfx: (x,_) => 2*x,
    dfy: (_,y) => -2*y,
    fxx: ()    => 2,
    fyy: ()    => -2,
    fxy: ()    => 0,
    color: T.amber,
  },
  waves: {
    label: 'Волны', latex: 'z = sin x · cos y',
    f:   (x,y) => Math.sin(x)*Math.cos(y),
    dfx: (x,y) => Math.cos(x)*Math.cos(y),
    dfy: (x,y) => -Math.sin(x)*Math.sin(y),
    fxx: (x,y) => -Math.sin(x)*Math.cos(y),
    fyy: (x,y) => -Math.sin(x)*Math.cos(y),
    fxy: (x,y) => -Math.cos(x)*Math.sin(y),
    color: T.cyan,
  },
  xy: {
    label: 'Гиперб. парабол.', latex: 'z = xy',
    f:   (x,y) => x*y,
    dfx: (_,y) => y,
    dfy: (x,_) => x,
    fxx: ()    => 0,
    fyy: ()    => 0,
    fxy: ()    => 1,
    color: T.violet,
  },
  rosenbrock: {
    label: 'Овраг Розенброка', latex: 'z = (1−x)² + 10(y−x²)²',
    f:   (x,y) => (1-x)**2 + 10*(y - x*x)**2,
    dfx: (x,y) => -2*(1-x) - 40*x*(y - x*x),
    dfy: (x,y) => 20*(y - x*x),
    fxx: (x,y) => 2 - 40*(y - x*x) + 80*x*x,
    fyy: ()    => 20,
    fxy: (x,_) => -40*x,
    color: T.red,
  },
};

// ─── Isoline renderer (2D contour) ───────────────────────────────────────────
function renderContours(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  f: (x: number, y: number) => number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  levels: number[],
  color: string,
  alpha = 0.55,
) {
  const toX = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
  const toY = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;
  const GRID = 80;
  const grid: number[][] = Array.from({ length: GRID + 1 }, (_, i) => {
    const y = yMin + (i / GRID) * (yMax - yMin);
    return Array.from({ length: GRID + 1 }, (_, j) => {
      const x = xMin + (j / GRID) * (xMax - xMin);
      try { const v = f(x, y); return isFinite(v) ? v : 0; } catch { return 0; }
    });
  });

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.2;

  for (const level of levels) {
    ctx.beginPath();
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const x0 = xMin + (j / GRID) * (xMax - xMin);
        const x1 = xMin + ((j+1) / GRID) * (xMax - xMin);
        const y0 = yMin + (i / GRID) * (yMax - yMin);
        const y1 = yMin + ((i+1) / GRID) * (yMax - yMin);
        const v00 = grid[i][j], v01 = grid[i][j+1];
        const v10 = grid[i+1][j], v11 = grid[i+1][j+1];

        const pts: [number,number][] = [];
        const lerp = (a: number, b: number, va: number, vb: number) => {
          if (Math.abs(vb - va) < 1e-9) return (a + b) / 2;
          return a + (b - a) * (level - va) / (vb - va);
        };
        if ((v00 < level) !== (v01 < level)) pts.push([lerp(x0,x1,v00,v01), y0]);
        if ((v10 < level) !== (v11 < level)) pts.push([lerp(x0,x1,v10,v11), y1]);
        if ((v00 < level) !== (v10 < level)) pts.push([x0, lerp(y0,y1,v00,v10)]);
        if ((v01 < level) !== (v11 < level)) pts.push([x1, lerp(y0,y1,v01,v11)]);
        if (pts.length === 2) {
          ctx.moveTo(toX(pts[0][0]), toY(pts[0][1]));
          ctx.lineTo(toX(pts[1][0]), toY(pts[1][1]));
        }
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Surface heat-map ─────────────────────────────────────────────────────────
function renderHeatmap(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  f: (x: number, y: number) => number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  colorA: string, colorB: string,
) {
  const GRID = 120;
  const vals: number[] = [];
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i <= GRID; i++) {
    for (let j = 0; j <= GRID; j++) {
      const x = xMin + (j / GRID) * (xMax - xMin);
      const y = yMin + (i / GRID) * (yMax - yMin);
      try { const v = f(x, y); vals.push(isFinite(v) ? v : 0); } catch { vals.push(0); }
      xs.push(x); ys.push(y);
    }
  }
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return [r,g,b];
  };
  const [r0,g0,b0] = hexToRgb(colorA.replace(/[^#\da-f]/gi,'').padEnd(7,'0').slice(0,7));
  const [r1,g1,b1] = hexToRgb(colorB.replace(/[^#\da-f]/gi,'').padEnd(7,'0').slice(0,7));

  const cellW = W / GRID, cellH = H / GRID;
  for (let idx = 0; idx < vals.length; idx++) {
    const t = (vals[idx] - min) / range;
    const r = Math.round(r0 + (r1 - r0) * t);
    const g = Math.round(g0 + (g1 - g0) * t);
    const b = Math.round(b0 + (b1 - b0) * t);
    const col = `rgb(${r},${g},${b})`;
    const j = idx % (GRID + 1), i = Math.floor(idx / (GRID + 1));
    ctx.fillStyle = col;
    ctx.fillRect(j * cellW, H - (i+1)*cellH, cellW + 0.5, cellH + 0.5);
  }
}

// ─── Lab definitions ──────────────────────────────────────────────────────────
const PARTIAL_LABS = [
  {
    id: 'pd-slices',
    title: 'Лаборатория 1: Частная производная как сечение',
    shortTitle: 'Частная производная',
    question: 'Что измеряет частная производная? Как увидеть её геометрический смысл через сечения поверхности?',
    mechanics: ['Тепловая карта поверхности + изолинии.', 'Два сечения: y=y₀ (зелёное) и x=x₀ (синее).', 'Наклоны касательных = частные производные.'],
    explore: ['Чаша в (0,0): оба наклона равны нулю — минимум.', 'Точка (2,0) на седле: ∂f/∂x=4, ∂f/∂y=0.', 'Включи касательную плоскость.'],
    insight: 'Частная производная — наклон поверхности при разрезе вертикальной плоскостью вдоль одной оси. Два наклона вместе определяют касательную плоскость.',
  },
  {
    id: 'pd-gradient-compass',
    title: 'Лаборатория 2: Градиент как компас на карте',
    shortTitle: 'Градиент — компас',
    question: 'Куда указывает градиент? Как он связан с линиями уровня? Где функция растёт быстрее всего?',
    mechanics: ['Вид сверху: тепловая карта + изолинии.', 'Вектор градиента и произвольное направление — ползунок угла.', 'Скорость роста = проекция градиента на направление.'],
    explore: ['При каком угле скорость роста максимальна?', 'При каком равна нулю? (вдоль линии уровня)', 'Градиент всегда ⊥ линиям уровня — почему?'],
    insight: 'Градиент — компас: всегда показывает в сторону наибольшего роста, перпендикулярен линиям уровня. Его длина — крутизна этого роста.',
  },
  {
    id: 'pd-critical-points',
    title: 'Лаборатория 3: Стационарные точки — минимум, максимум, седло',
    shortTitle: 'Минимум, максимум, седло',
    question: 'Что происходит, когда градиент равен нулю? Как по гессиану отличить минимум от максимума от седла?',
    mechanics: ['Настраиваемая поверхность f = ax² + by².', 'Ползунки a и b меняют тип стационарной точки.', 'Гессиан, его собственные значения и классификация в реальном времени.'],
    explore: ['a>0, b>0 → чаша (минимум).', 'a>0, b<0 → седло.', 'a=0, b>0 → цилиндр — бесконечно много минимумов.'],
    insight: '∇f=0 — необходимое, но не достаточное условие экстремума. Гессиан смотрит на кривизну по всем направлениям и даёт окончательный ответ.',
  },
  {
    id: 'pd-hessian-curvature',
    title: 'Лаборатория 4: Гессиан и кривизна — тест на форму',
    shortTitle: 'Гессиан и кривизна',
    question: 'Как собственные значения гессиана связаны с формой поверхности? Что такое «овраг» и почему он мешает оптимизации?',
    mechanics: ['Интерактивная матрица гессиана 2×2 — прямые ползунки элементов.', 'Собственные значения и собственные векторы вычисляются мгновенно.', 'SVG-схема собственных направлений на плоскости.'],
    explore: ['Сделай λ₁=2, λ₂=20: овраг. Какое направление круче?', 'Сделай λ₁=λ₂: изотропная кривизна — «сферическая чаша».', 'det(H)=0: одно направление совсем плоское.'],
    insight: 'Собственные векторы гессиана — направления главных кривизн. Собственные значения — их величины. Большое отношение λ_max/λ_min = «число обусловленности» = плохо для градиентного спуска.',
  },
  {
    id: 'pd-gradient-descent',
    title: 'Лаборатория 5: Градиентный спуск — как машина учится',
    shortTitle: 'Градиентный спуск',
    question: 'Как выглядит путь градиентного спуска на разных поверхностях? Почему в «овраге» он зигзагами? Что меняет learning rate?',
    mechanics: ['Клик = старт траектории градиентного спуска.', 'Ползунок learning rate от 0.01 до 2.', 'Анимация шагов, история траектории, счётчик итераций.'],
    explore: ['Чаша: спуск прямой или кривой?', 'Розенброк: запусти из (-1,1). Зигзаги?', 'Большой lr: расходится или прыгает?'],
    insight: 'Градиентный спуск — жадный алгоритм: каждый шаг в сторону наискорейшего убывания. В «оврагах» он зигзагами скачет через долину вместо движения вдоль неё.',
  },
  {
    id: 'pd-directional-derivative',
    title: 'Лаборатория 6: Производная по направлению — скорость роста под углом',
    shortTitle: 'Производная по направлению',
    question: 'Как быстро меняется функция, если двигаться не вдоль осей, а под произвольным углом? Как это связано с градиентом?',
    mechanics: ['360° ползунок угла направления.', 'Полярный график скорости роста — «роза кривизны».', 'Формула D_u f = ∇f · u показана пошагово.'],
    explore: ['В каком направлении скорость максимальна?', 'В каком равна нулю? (вдоль изолинии)', 'Как форма «розы» меняется от точки к точке?'],
    insight: 'Производная по направлению D_u f = ∇f · u = |∇f|·cos(θ). Максимум при θ=0 (по градиенту), ноль при θ=90° (⊥ градиенту), минимум при θ=180° (против градиента).',
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 1 — Partial derivative as slice
// ═══════════════════════════════════════════════════════════════════════════════
function SlicesLab() {
  const [surfKey, setSurfKey] = useState<SurfKey>('bowl');
  const [x0, setX0] = useState(1.0);
  const [y0, setY0] = useState(0.5);
  const [showTangentPlane, setShowTangentPlane] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const surf = SURFS[surfKey];
  const W = 420, H = 420;
  const XMN = -2.5, XMX = 2.5, YMN = -2.5, YMX = 2.5;
  const toCanX = (x: number) => ((x - XMN) / (XMX - XMN)) * W;
  const toCanY = (y: number) => H - ((y - YMN) / (YMX - YMN)) * H;

  const dfx = surf.dfx(x0, y0);
  const dfy = surf.dfy(x0, y0);
  const fval = surf.f(x0, y0);

  // Levels for contours
  const levels = useMemo(() => {
    const vals: number[] = [];
    for (let i = -2.5; i <= 2.5; i += 0.25) for (let j = -2.5; j <= 2.5; j += 0.25) {
      try { const v = surf.f(i, j); if (isFinite(v)) vals.push(v); } catch {}
    }
    if (!vals.length) return [];
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const step = (mx - mn) / 10;
    return Array.from({ length: 10 }, (_, i) => mn + step * (i + 0.5));
  }, [surfKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    // Heatmap
    renderHeatmap(ctx, W, H, surf.f, XMN, XMX, YMN, YMX, '#eef2ff', surf.color);

    // Contours
    renderContours(ctx, W, H, surf.f, XMN, XMX, YMN, YMX, levels, T.white, 0.4);

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toCanX(0), 0); ctx.lineTo(toCanX(0), H);
    ctx.moveTo(0, toCanY(0)); ctx.lineTo(W, toCanY(0));
    ctx.stroke();

    // Y=y0 slice line (green)
    ctx.strokeStyle = T.green; ctx.lineWidth = 2; ctx.setLineDash([6,4]);
    ctx.beginPath(); ctx.moveTo(0, toCanY(y0)); ctx.lineTo(W, toCanY(y0)); ctx.stroke();

    // X=x0 slice line (blue)
    ctx.strokeStyle = T.cyan; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(toCanX(x0), 0); ctx.lineTo(toCanX(x0), H); ctx.stroke();
    ctx.setLineDash([]);

    // Point
    const px = toCanX(x0), py = toCanY(y0);
    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2);
    ctx.fillStyle = T.red; ctx.fill();
    ctx.strokeStyle = T.white; ctx.lineWidth = 2; ctx.stroke();

    // Gradient arrow
    const gLen = Math.hypot(dfx, dfy);
    if (gLen > 0.01 && gLen < 50) {
      const sc = Math.min(40 / gLen, 25);
      const ex = px + dfx * sc, ey = py - dfy * sc;
      ctx.strokeStyle = T.red; ctx.lineWidth = 3; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
      // Arrowhead
      const ang = Math.atan2(ey - py, ex - px);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 10*Math.cos(ang-0.4), ey - 10*Math.sin(ang-0.4));
      ctx.lineTo(ex - 10*Math.cos(ang+0.4), ey - 10*Math.sin(ang+0.4));
      ctx.closePath(); ctx.fillStyle = T.red; ctx.fill();
    }

    // Labels
    ctx.font = 'bold 11px monospace'; ctx.textBaseline = 'middle';
    ctx.fillStyle = T.green;
    ctx.fillText(`y = ${y0.toFixed(1)}`, 6, toCanY(y0) - 10);
    ctx.fillStyle = T.cyan;
    ctx.fillText(`x = ${x0.toFixed(1)}`, toCanX(x0) + 5, 14);
  }, [surfKey, x0, y0, levels]);

  const fmt = (v: number) => isFinite(v) ? v.toFixed(3) : '∞';

  // Section curves: f(x, y0) and f(x0, y)
  const sectionXPts = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const x = XMN + (i / 100) * (XMX - XMN);
      try { const v = surf.f(x, y0); if (isFinite(v) && Math.abs(v) < 15) pts.push({ x, v }); } catch {}
    }
    return pts;
  }, [surfKey, y0]);

  const sectionYPts = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const y = YMN + (i / 100) * (YMX - YMN);
      try { const v = surf.f(x0, y); if (isFinite(v) && Math.abs(v) < 15) pts.push({ y, v }); } catch {}
    }
    return pts;
  }, [surfKey, x0]);

  const SW = 180, SH = 120, SXM = -3, SXX = 3, SVM = -8, SVX = 8;
  const toSX = (x: number) => ((x - SXM) / (SXX - SXM)) * SW;
  const toSV = (v: number) => SH - ((v - SVM) / (SVX - SVM)) * SH;

  const surfOptions: {key: SurfKey; label: string}[] = [
    { key: 'bowl',    label: 'Чаша z=x²+y²' },
    { key: 'saddle',  label: 'Седло z=x²−y²' },
    { key: 'waves',   label: 'Волны sin·cos' },
    { key: 'xy',      label: 'z = xy' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 1 · Частные производные"
        title="Частная производная как сечение"
        question="Что на самом деле измеряет частная производная? Как увидеть её через разрезы поверхности?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.green} title="Сечение y = y₀">
          Фиксируем y, смотрим как f меняется вдоль X. Наклон касательной к этой кривой в точке x₀ — это ∂f/∂x. Зелёная горизонтальная линия на карте.
        </InfoCard>
        <InfoCard color={T.cyan} title="Сечение x = x₀">
          Фиксируем x, смотрим вдоль Y. Наклон — ∂f/∂y. Синяя вертикальная линия. Вместе два наклона определяют касательную плоскость.
        </InfoCard>
        <InfoCard color={T.red} title="Вектор градиента">
          Красная стрелка = (∂f/∂x, ∂f/∂y). Показывает направление наибольшего роста функции в данной точке.
        </InfoCard>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {surfOptions.map(o => (
          <PresetButton key={o.key} active={surfKey === o.key} onClick={() => setSurfKey(o.key)} label={o.label} color={SURFS[o.key].color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        {/* Canvas */}
        <div style={{ background: '#1e293b', borderRadius: 16, overflow: 'hidden', position: 'relative' as const }}>
          <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', width: '100%', height: 'auto', cursor: 'crosshair' }}
            onClick={e => {
              const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
              const cx = (e.clientX - rect.left) * (W / rect.width);
              const cy = (e.clientY - rect.top) * (H / rect.height);
              setX0(XMN + (cx / W) * (XMX - XMN));
              setY0(YMX - (cy / H) * (YMX - YMN));
            }} />
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
            кликни для перемещения точки
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Точка (x₀, y₀)</SectionLabel>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}><span>x₀</span><strong style={{ color: T.cyan }}>{x0.toFixed(2)}</strong></div>
              <input type="range" min={-2.3} max={2.3} step={0.05} value={x0} onChange={e => setX0(Number(e.target.value))} style={{ width: '100%', accentColor: T.cyan }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}><span>y₀</span><strong style={{ color: T.green }}>{y0.toFixed(2)}</strong></div>
              <input type="range" min={-2.3} max={2.3} step={0.05} value={y0} onChange={e => setY0(Number(e.target.value))} style={{ width: '100%', accentColor: T.green }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <StatBadge label="f(x₀, y₀)" value={fmt(fval)} color={surf.color} />
            <StatBadge label="∂f/∂x (наклон по X)" value={fmt(dfx)} color={T.green} />
            <StatBadge label="∂f/∂y (наклон по Y)" value={fmt(dfy)} color={T.cyan} />
            <StatBadge label="|∇f| (крутизна)" value={fmt(Math.hypot(dfx, dfy))} color={T.red} />
          </div>

          {/* Section X graph */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.green, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>
              Сечение f(x, y₀) — зелёное
            </div>
            <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ display: 'block', width: '100%', background: T.surface, borderRadius: 8 }}>
              <line x1={0} y1={toSV(0)} x2={SW} y2={toSV(0)} stroke={T.border} strokeWidth={1} />
              <line x1={toSX(0)} y1={0} x2={toSX(0)} y2={SH} stroke={T.border} strokeWidth={1} />
              <path d={sectionXPts.map((p,i) => `${i===0?'M':'L'}${toSX(p.x).toFixed(1)},${toSV(p.v).toFixed(1)}`).join(' ')} fill="none" stroke={T.green} strokeWidth="2" />
              {/* Tangent */}
              {isFinite(dfx) && Math.abs(dfx) < 30 && (() => {
                const x1s = x0 - 0.8, x2s = x0 + 0.8;
                const y1s = fval + dfx * (x1s - x0), y2s = fval + dfx * (x2s - x0);
                return <line x1={toSX(x1s)} y1={toSV(y1s)} x2={toSX(x2s)} y2={toSV(y2s)} stroke={T.amber} strokeWidth="1.5" strokeDasharray="4 3" />;
              })()}
              <circle cx={toSX(x0)} cy={toSV(fval)} r={4} fill={T.red} />
            </svg>
          </div>

          {/* Section Y graph */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.cyan, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>
              Сечение f(x₀, y) — синее
            </div>
            <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ display: 'block', width: '100%', background: T.surface, borderRadius: 8 }}>
              <line x1={0} y1={toSV(0)} x2={SW} y2={toSV(0)} stroke={T.border} strokeWidth={1} />
              <line x1={toSX(0)} y1={0} x2={toSX(0)} y2={SH} stroke={T.border} strokeWidth={1} />
              <path d={sectionYPts.map((p,i) => `${i===0?'M':'L'}${toSX(p.y).toFixed(1)},${toSV(p.v).toFixed(1)}`).join(' ')} fill="none" stroke={T.cyan} strokeWidth="2" />
              {isFinite(dfy) && Math.abs(dfy) < 30 && (() => {
                const y1s = y0 - 0.8, y2s = y0 + 0.8;
                const v1 = fval + dfy * (y1s - y0), v2 = fval + dfy * (y2s - y0);
                return <line x1={toSX(y1s)} y1={toSV(v1)} x2={toSX(y2s)} y2={toSV(v2)} stroke={T.amber} strokeWidth="1.5" strokeDasharray="4 3" />;
              })()}
              <circle cx={toSX(y0)} cy={toSV(fval)} r={4} fill={T.red} />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="Чаша в (0,0): почему оба наклона нулевые?" color={T.primary}>
          В минимуме функция «не растёт» ни вдоль X, ни вдоль Y — касательная плоскость горизонтальна. ∂f/∂x = 2·0 = 0, ∂f/∂y = 2·0 = 0. Именно это условие ∇f=0 и есть признак стационарной точки.
        </Collapsible>
        <Collapsible title="Для z=xy в точке (1,1): каковы частные производные?" color={T.violet}>
          ∂f/∂x = y = 1. ∂f/∂y = x = 1. Градиент = (1,1) — направлен под 45°. Вдоль оси X — наклон 1 (рост), вдоль Y — тоже 1. Это гиперболическое седло, но не в начале координат, а «перевёрнутое».
        </Collapsible>
        <Collapsible title="Почему ∂f/∂x и ∂f/∂y иногда не равны смешанным ∂²f/∂x∂y?" color={T.amber}>
          Частные производные первого порядка — наклоны. Смешанные производные второго порядка — насколько один наклон меняется при изменении другой переменной. Теорема Шварца: для «хороших» функций fxy = fyx. Но бывают патологии.
        </Collapsible>
      </div>

      <Callout color={T.primary} title="Главный вывод">
        Частная производная — это наклон функции в одном конкретном направлении (вдоль оси). Она измеряет, как быстро меняется f, если двигаться строго вдоль X при фиксированном Y, или наоборот. Два таких наклона вместе определяют касательную плоскость к поверхности.
      </Callout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 2 — Gradient compass
// ═══════════════════════════════════════════════════════════════════════════════
function GradientCompassLab() {
  const [surfKey, setSurfKey] = useState<SurfKey>('bowl');
  const [x0, setX0] = useState(1.0);
  const [y0, setY0] = useState(0.5);
  const [angle, setAngle] = useState(0); // degrees
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const surf = SURFS[surfKey];
  const W = 420, H = 420;
  const XMN = -2.5, XMX = 2.5, YMN = -2.5, YMX = 2.5;
  const toCanX = (x: number) => ((x - XMN) / (XMX - XMN)) * W;
  const toCanY = (y: number) => H - ((y - YMN) / (YMX - YMN)) * H;

  const dfx = surf.dfx(x0, y0);
  const dfy = surf.dfy(x0, y0);
  const gradLen = Math.hypot(dfx, dfy);
  const rad = angle * Math.PI / 180;
  const ux = Math.cos(rad), uy = Math.sin(rad);
  const dirDerivative = dfx * ux + dfy * uy;

  const levels = useMemo(() => {
    const vals: number[] = [];
    for (let i = -2.5; i <= 2.5; i += 0.3) for (let j = -2.5; j <= 2.5; j += 0.3) {
      try { const v = surf.f(i, j); if (isFinite(v)) vals.push(v); } catch {}
    }
    if (!vals.length) return [];
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const step = (mx - mn) / 12;
    return Array.from({ length: 12 }, (_, i) => mn + step * (i + 0.5));
  }, [surfKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    renderHeatmap(ctx, W, H, surf.f, XMN, XMX, YMN, YMX, '#1e293b', surf.color);
    renderContours(ctx, W, H, surf.f, XMN, XMX, YMN, YMX, levels, T.white, 0.5);

    const px = toCanX(x0), py = toCanY(y0);

    // Direction arrow (blue)
    const dsc = 60;
    const dex = px + ux * dsc, dey = py - uy * dsc;
    ctx.strokeStyle = T.cyan; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(dex, dey); ctx.stroke();
    const da = Math.atan2(dey - py, dex - px);
    ctx.beginPath(); ctx.moveTo(dex, dey);
    ctx.lineTo(dex - 10*Math.cos(da-0.4), dey - 10*Math.sin(da-0.4));
    ctx.lineTo(dex - 10*Math.cos(da+0.4), dey - 10*Math.sin(da+0.4));
    ctx.closePath(); ctx.fillStyle = T.cyan; ctx.fill();

    // Gradient arrow (red)
    if (gradLen > 0.01 && gradLen < 50) {
      const sc = Math.min(55 / gradLen, 30);
      const gex = px + dfx * sc, gey = py - dfy * sc;
      ctx.strokeStyle = T.red; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(gex, gey); ctx.stroke();
      const ga = Math.atan2(gey - py, gex - px);
      ctx.beginPath(); ctx.moveTo(gex, gey);
      ctx.lineTo(gex - 12*Math.cos(ga-0.4), gey - 12*Math.sin(ga-0.4));
      ctx.lineTo(gex - 12*Math.cos(ga+0.4), gey - 12*Math.sin(ga+0.4));
      ctx.closePath(); ctx.fillStyle = T.red; ctx.fill();
    }

    // Point
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI*2);
    ctx.fillStyle = T.white; ctx.fill();
    ctx.strokeStyle = T.red; ctx.lineWidth = 2.5; ctx.stroke();

    // Labels
    ctx.font = 'bold 10px monospace'; ctx.fillStyle = T.red; ctx.textBaseline = 'bottom';
    ctx.fillText('∇f', px + 5, py - 5);
    ctx.fillStyle = T.cyan;
    ctx.fillText('u', dex + 4, dey - 4);
  }, [surfKey, x0, y0, angle, levels]);

  const speedColor = dirDerivative > 0.05 ? T.green : dirDerivative < -0.05 ? T.red : T.amber;
  const speedText  = dirDerivative > 0.05 ? `↗ рост +${dirDerivative.toFixed(3)}` : dirDerivative < -0.05 ? `↘ спуск ${dirDerivative.toFixed(3)}` : '⎯ вдоль линии уровня';

  // Polar rose — directional derivative as function of angle
  const rosePts = useMemo(() => {
    const pts = [];
    for (let a = 0; a < 360; a += 3) {
      const r = a * Math.PI / 180;
      const ux2 = Math.cos(r), uy2 = Math.sin(r);
      const dd = dfx * ux2 + dfy * uy2;
      pts.push({ a, dd });
    }
    return pts;
  }, [dfx, dfy]);

  const RW = 160, RH = 160, RC = 80;
  const maxDd = Math.max(gradLen, 0.01);

  const surfOptions: {key: SurfKey; label: string}[] = [
    { key: 'bowl', label: 'Чаша' }, { key: 'saddle', label: 'Седло' },
    { key: 'waves', label: 'Волны' }, { key: 'xy', label: 'z=xy' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 2 · Частные производные"
        title="Градиент как компас на карте"
        question="Куда указывает градиент? Как он связан с линиями уровня? Где функция растёт быстрее всего?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.red} title="Красная стрелка: ∇f">
          Градиент = (∂f/∂x, ∂f/∂y). Всегда указывает в сторону наибольшего роста. Перпендикулярен линиям уровня. Длина = крутизна.
        </InfoCard>
        <InfoCard color={T.cyan} title="Синяя стрелка: направление u">
          Произвольное направление — крути ползунок. Скорость роста вдоль u = ∇f · u = |∇f|·cos(θ), где θ — угол между ними.
        </InfoCard>
        <InfoCard color={T.violet} title="Роза кривизны">
          Полярный график скорости роста по всем углам. Форма = эллипс. Красная лепестка — рост, синяя — убывание. Максимум всегда по направлению ∇f.
        </InfoCard>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {surfOptions.map(o => (
          <PresetButton key={o.key} active={surfKey === o.key} onClick={() => setSurfKey(o.key)} label={o.label} color={SURFS[o.key].color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        <div style={{ background: '#1e293b', borderRadius: 16, overflow: 'hidden', cursor: 'crosshair' }}>
          <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', width: '100%', height: 'auto' }}
            onClick={e => {
              const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
              setX0(XMN + (e.clientX - rect.left) / rect.width * (XMX - XMN));
              setY0(YMX - (e.clientY - rect.top) / rect.height * (YMX - YMN));
            }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Положение точки</SectionLabel>
            {[['x₀', x0, setX0, T.cyan], ['y₀', y0, setY0, T.green]].map(([lbl, val, setter, color]: any) => (
              <div key={lbl} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}>
                  <span>{lbl}</span><strong style={{ color }}>{(val as number).toFixed(2)}</strong>
                </div>
                <input type="range" min={-2.3} max={2.3} step={0.05} value={val as number} onChange={e => (setter as any)(Number(e.target.value))} style={{ width: '100%', accentColor: color as string }} />
              </div>
            ))}
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Направление u (угол)</SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.cyan, textAlign: 'center' as const, marginBottom: 6 }}>{angle}°</div>
            <input type="range" min={0} max={359} step={1} value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ width: '100%', accentColor: T.cyan }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
              {[0, 45, 90, 135, 180, 270].map(a => (
                <button key={a} onClick={() => setAngle(a)} style={{ padding: '3px 9px', borderRadius: 8, border: `1px solid ${T.primaryBorder}`, background: T.primaryLight, color: T.primaryDark, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{a}°</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
            <StatBadge label="∂f/∂x" value={dfx.toFixed(3)} color={T.green} />
            <StatBadge label="∂f/∂y" value={dfy.toFixed(3)} color={T.cyan} />
            <StatBadge label="|∇f|" value={gradLen.toFixed(3)} color={T.red} />
            <div style={{ padding: '8px 12px', borderRadius: 9, background: `${speedColor}10`, border: `1px solid ${speedColor}30`, fontSize: 12, fontWeight: 700, color: speedColor }}>
              D_u f = {speedText}
            </div>
          </div>

          {/* Polar rose */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }}>
            <SectionLabel>Роза кривизны D_u f(θ)</SectionLabel>
            <svg width={RW} height={RH} viewBox={`0 0 ${RW} ${RH}`} style={{ display: 'block', margin: '0 auto' }}>
              {/* Axes */}
              <line x1={RC} y1={0} x2={RC} y2={RH} stroke={T.border} strokeWidth={1} />
              <line x1={0} y1={RC} x2={RW} y2={RC} stroke={T.border} strokeWidth={1} />
              <circle cx={RC} cy={RC} r={RC * 0.5} fill="none" stroke={T.border} strokeWidth={0.5} strokeDasharray="3 2" />
              <circle cx={RC} cy={RC} r={RC * 0.9} fill="none" stroke={T.border} strokeWidth={0.5} strokeDasharray="3 2" />

              {/* Rose positive */}
              <path d={rosePts.map((p, i) => {
                const r = p.a * Math.PI / 180;
                const len = Math.max(0, p.dd) / maxDd * (RC - 8);
                const sx = RC + Math.cos(r) * len, sy = RC - Math.sin(r) * len;
                return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
              }).join(' ')} fill={`${T.green}30`} stroke={T.green} strokeWidth="1" />

              {/* Rose negative */}
              <path d={rosePts.map((p, i) => {
                const r = p.a * Math.PI / 180;
                const len = Math.max(0, -p.dd) / maxDd * (RC - 8);
                const sx = RC + Math.cos(r) * len, sy = RC - Math.sin(r) * len;
                return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
              }).join(' ')} fill={`${T.red}20`} stroke={T.red} strokeWidth="1" />

              {/* Current direction */}
              <line x1={RC} y1={RC} x2={RC + Math.cos(rad) * (RC - 6)} y2={RC - Math.sin(rad) * (RC - 6)} stroke={T.cyan} strokeWidth="1.5" strokeDasharray="4 2" />
              <circle cx={RC} cy={RC} r={3} fill={T.text} />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="Почему градиент всегда ⊥ линиям уровня?" color={T.primary}>
          На линии уровня f = const, значит производная по направлению вдоль неё равна нулю: D_u f = ∇f · u = 0. Это означает, что ∇f ⊥ u — градиент перпендикулярен любому направлению вдоль линии уровня.
        </Collapsible>
        <Collapsible title="При каком угле роза кривизны максимальна по ширине?" color={T.green}>
          Когда направление u совпадает с ∇f (угол θ=0 между ними). Тогда D_u f = |∇f|·cos(0) = |∇f| — максимум. Форма розы — эллипс, максимальная ось направлена по ∇f.
        </Collapsible>
        <Collapsible title="Для седла в точке (0,0): куда указывает ∇f?" color={T.amber}>
          ∂f/∂x = 2·0 = 0, ∂f/∂y = -2·0 = 0. Градиент = (0,0). В стационарной точке градиент нулевой — нет «предпочтительного» направления роста. Поэтому роза кривизны сжата в точку.
        </Collapsible>
      </div>

      <Callout color={T.green} title="Главный вывод">
        Градиент — компас: всегда указывает в сторону наибольшего роста и перпендикулярен линиям уровня. Скорость роста в произвольном направлении u = ∇f · u = |∇f|·cos(θ). Максимум при θ=0, ноль при θ=90°, минимум при θ=180°.
      </Callout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 3 — Critical points classifier
// ═══════════════════════════════════════════════════════════════════════════════
function CriticalPointsLab() {
  const [a, setA] = useState(1.0);
  const [b, setB] = useState(1.0);

  // f(x,y) = a*x² + b*y²
  const f   = (x: number, y: number) => a*x*x + b*y*y;
  const fxx = 2*a, fyy = 2*b, fxy = 0;
  const detH = fxx * fyy - fxy * fxy;
  const trH  = fxx + fyy;

  // Eigenvalues of [[2a,0],[0,2b]]
  const l1 = 2*a, l2 = 2*b;

  const type: 'minimum' | 'maximum' | 'saddle' | 'degenerate' =
    Math.abs(detH) < 0.001 ? 'degenerate' :
    detH > 0 && fxx > 0 ? 'minimum' :
    detH > 0 && fxx < 0 ? 'maximum' :
    'saddle';

  const typeInfo = {
    minimum:   { label: 'Минимум', color: T.green,   icon: '▲', desc: 'Все λ > 0 → функция «поднимается» во всех направлениях.' },
    maximum:   { label: 'Максимум', color: T.red,    icon: '▼', desc: 'Все λ < 0 → функция «опускается» во всех направлениях.' },
    saddle:    { label: 'Седло', color: T.amber,     icon: '✕', desc: 'λ разных знаков → в одних направлениях рост, в других спуск.' },
    degenerate:{ label: 'Вырожденный', color: T.muted, icon: '∼', desc: 'det(H)=0: одно λ=0 — функция «плоская» в одном направлении.' },
  }[type];

  const W = 320, H = 260;
  const XMN = -2.5, XMX = 2.5, YMN = -2, YMX = 2;
  const toX = (x: number) => ((x - XMN) / (XMX - XMN)) * W;
  const toY = (y: number) => H - ((y - YMN) / (YMX - YMN)) * H;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const levels = useMemo(() => {
    const vals: number[] = [];
    for (let x = -2.4; x <= 2.4; x += 0.2) for (let y = -1.9; y <= 1.9; y += 0.2) vals.push(f(x,y));
    const mn = Math.min(...vals.filter(isFinite)), mx = Math.max(...vals.filter(isFinite));
    const step = (mx - mn) / 10;
    return Array.from({ length: 10 }, (_, i) => mn + step * (i + 0.5));
  }, [a, b]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const col1 = type === 'minimum' ? '#eef2ff' : type === 'maximum' ? '#fee2e2' : type === 'saddle' ? '#fef3c7' : '#f8fafc';
    renderHeatmap(ctx, W, H, f, XMN, XMX, YMN, YMX, col1, typeInfo.color);
    renderContours(ctx, W, H, f, XMN, XMX, YMN, YMX, levels, typeInfo.color, 0.5);

    // Axes
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(toX(0), 0); ctx.lineTo(toX(0), H);
    ctx.moveTo(0, toY(0)); ctx.lineTo(W, toY(0));
    ctx.stroke();

    // Stationarity marker
    ctx.beginPath(); ctx.arc(toX(0), toY(0), 8, 0, Math.PI*2);
    ctx.fillStyle = typeInfo.color; ctx.fill();
    ctx.strokeStyle = T.white; ctx.lineWidth = 2.5; ctx.stroke();
  }, [a, b, levels, type]);

  // Section graphs
  const secXPts = Array.from({ length: 60 }, (_, i) => {
    const x = -2.5 + (i / 59) * 5;
    return { x, v: f(x, 0) };
  });
  const secYPts = Array.from({ length: 60 }, (_, i) => {
    const y = -2.5 + (i / 59) * 5;
    return { x: y, v: f(0, y) };
  });

  const SW = 130, SH = 80;
  const toSX = (x: number) => ((x + 2.5) / 5) * SW;
  const toSV = (v: number, mn: number, mx: number) => SH - ((v - mn) / (mx - mn + 0.001)) * SH;

  const secXMin = Math.min(...secXPts.map(p => p.v)), secXMax = Math.max(...secXPts.map(p => p.v));
  const secYMin = Math.min(...secYPts.map(p => p.v)), secYMax = Math.max(...secYPts.map(p => p.v));

  const presets = [
    { label: 'Чаша',     a:  1,    b:  1,    color: T.primary },
    { label: 'Шапка',    a: -1,    b: -1,    color: T.red     },
    { label: 'Седло',    a:  1,    b: -1,    color: T.amber   },
    { label: 'Овраг',    a: 0.05,  b:  3,    color: T.violet  },
    { label: 'Цилиндр',  a:  0,    b:  1,    color: T.muted   },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 3 · Частные производные"
        title="Стационарные точки: минимум, максимум, седло"
        question="Что происходит с функцией в точке, где ∇f=0? Как гессиан отличает минимум от седла?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Матрица Гессе H">
          H = [[fxx, fxy],[fyx, fyy]]. Описывает кривизну поверхности во всех направлениях. Для f=ax²+by² это диагональная матрица [[2a,0],[0,2b]].
        </InfoCard>
        <InfoCard color={T.green} title="Критерий второго порядка">
          det(H) {'>'} 0, fxx {'>'} 0 → минимум. det(H) {'>'} 0, fxx {'<'} 0 → максимум. det(H) {'<'} 0 → седло. det(H) = 0 → нужен дополнительный анализ.
        </InfoCard>
        <InfoCard color={T.amber} title="Собственные значения">
          λ₁=2a, λ₂=2b. Все {'>'} 0 → чаша. Все {'<'} 0 → шапка. Разных знаков → седло. Одно = 0 → вырожденный случай (цилиндр, плоскость).
        </InfoCard>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 }}>
        {presets.map(p => (
          <PresetButton key={p.label} active={Math.abs(a - p.a) < 0.01 && Math.abs(b - p.b) < 0.01}
            onClick={() => { setA(p.a); setB(p.b); }} label={p.label} color={p.color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>
        {/* Map + sections */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textAlign: 'center' as const }}>
              f(x,y) = {a.toFixed(2)}x² + {b.toFixed(2)}y²
            </div>
            <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', width: '100%', height: 'auto' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'f(x,0) вдоль X', pts: secXPts, mn: secXMin, mx: secXMax, color: T.green },
              { label: 'f(0,y) вдоль Y', pts: secYPts, mn: secYMin, mx: secYMax, color: T.cyan },
            ].map(s => (
              <div key={s.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: s.color, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 5 }}>{s.label}</div>
                <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ display: 'block', width: '100%', background: T.surface, borderRadius: 6 }}>
                  <line x1={0} y1={toSV(0, s.mn, s.mx)} x2={SW} y2={toSV(0, s.mn, s.mx)} stroke={T.border} strokeWidth={1} />
                  <path d={s.pts.map((p, i) => `${i===0?'M':'L'}${toSX(p.x).toFixed(1)},${toSV(p.v, s.mn, s.mx).toFixed(1)}`).join(' ')} fill="none" stroke={s.color} strokeWidth="2" />
                  <circle cx={toSX(0)} cy={toSV(f(0,0), s.mn, s.mx)} r={4} fill={typeInfo.color} />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis panel */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {/* Type indicator */}
          <div style={{ padding: '16px 18px', borderRadius: 14, background: `${typeInfo.color}12`, border: `2px solid ${typeInfo.color}40`, textAlign: 'center' as const }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: typeInfo.color, marginBottom: 4 }}>{typeInfo.icon} {typeInfo.label}</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{typeInfo.desc}</div>
          </div>

          {/* Sliders */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Коэффициенты f = ax² + by²</SectionLabel>
            {[['a', a, setA], ['b', b, setB]].map(([lbl, val, setter]: any) => (
              <div key={lbl} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{lbl}</span>
                  <strong style={{ color: T.text }}>{(val as number).toFixed(2)}</strong>
                </div>
                <input type="range" min={-3} max={3} step={0.05} value={val as number}
                  onChange={e => (setter as any)(Number(e.target.value))}
                  style={{ width: '100%', accentColor: T.primary }} />
              </div>
            ))}
          </div>

          {/* Hessian */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Матрица Гессе в (0,0)</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 10, fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}>
              <span style={{ fontSize: 24, color: T.muted }}>[</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                <span style={{ textAlign: 'right' as const, color: T.green }}>{fxx.toFixed(1)}</span>
                <span style={{ color: T.muted }}>{fxy.toFixed(1)}</span>
                <span style={{ textAlign: 'right' as const, color: T.muted }}>{fxy.toFixed(1)}</span>
                <span style={{ color: T.cyan }}>{fyy.toFixed(1)}</span>
              </div>
              <span style={{ fontSize: 24, color: T.muted }}>]</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
              <StatBadge label="det(H) = λ₁·λ₂" value={detH.toFixed(2)} color={detH > 0.01 ? T.green : detH < -0.01 ? T.red : T.muted} />
              <StatBadge label="tr(H) = λ₁+λ₂" value={trH.toFixed(2)} color={T.primary} />
              <StatBadge label="λ₁ = 2a" value={l1.toFixed(2)} color={l1 > 0 ? T.green : l1 < 0 ? T.red : T.muted} />
              <StatBadge label="λ₂ = 2b" value={l2.toFixed(2)} color={l2 > 0 ? T.green : l2 < 0 ? T.red : T.muted} />
              <StatBadge label="λ_max/λ_min (обусл.)" value={Math.abs(l1) > 0.01 && Math.abs(l2) > 0.01 ? (Math.max(Math.abs(l1),Math.abs(l2))/Math.min(Math.abs(l1),Math.abs(l2))).toFixed(1) : '∞'} color={T.amber} />
            </div>
          </div>

          <Collapsible title="Овраг a=0.05, b=3: почему плохо для оптимизации?" color={T.amber}>
            Число обусловленности = λ_max/λ_min = 3/0.05 = 60. Вдоль Y кривизна в 60 раз больше, чем вдоль X. Градиентный спуск будет зигзагом скакать поперёк оврага, вместо того чтобы идти вдоль него к минимуму. Именно для этого придумали momentum, Adam и предобусловливание.
          </Collapsible>
        </div>
      </div>

      <Callout color={T.primary} title="Главный вывод">
        ∇f=0 — необходимое, но не достаточное условие экстремума. Гессиан смотрит на кривизну по всем направлениям. Все λ {'>'} 0 → чаша (минимум). Все λ {'<'} 0 → шапка (максимум). Разные знаки → седло. Нулевые λ → нужен дополнительный анализ.
      </Callout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 4 — Hessian eigenstructure (interactive 2×2 matrix)
// ═══════════════════════════════════════════════════════════════════════════════
function HessianLab() {
  const [h11, setH11] = useState(2.0);
  const [h12, setH12] = useState(0.5);
  const [h22, setH22] = useState(3.0);

  // Eigenvalues of [[h11,h12],[h12,h22]]
  const tr = h11 + h22;
  const det = h11 * h22 - h12 * h12;
  const disc = tr * tr / 4 - det;
  const l1 = tr / 2 + Math.sqrt(Math.max(0, disc));
  const l2 = tr / 2 - Math.sqrt(Math.max(0, disc));

  // Eigenvectors
  const ev1 = Math.abs(h12) < 0.001
    ? (h11 >= h22 ? [1, 0] : [0, 1])
    : (() => {
        const v = [l1 - h22, h12]; const n = Math.hypot(v[0], v[1]); return [v[0]/n, v[1]/n];
      })();
  const ev2 = [-ev1[1], ev1[0]];

  const type = Math.abs(det) < 0.001 ? 'degenerate' : det > 0 && h11 > 0 ? 'minimum' : det > 0 && h11 < 0 ? 'maximum' : 'saddle';
  const typeColors = { minimum: T.green, maximum: T.red, saddle: T.amber, degenerate: T.muted };
  const typeLabels = { minimum: 'Минимум', maximum: 'Максимум', saddle: 'Седло', degenerate: 'Вырожд.' };

  const W = 320, H = 320, CX = 160, CY = 160;
  const sc = (v: number) => Math.min(Math.abs(v) * 25, 90);

  const presets = [
    { label: 'Изотр. чаша',  h11:  2, h12: 0,    h22:  2 },
    { label: 'Изотр. шапка', h11: -2, h12: 0,    h22: -2 },
    { label: 'Седло',        h11:  2, h12: 0,    h22: -2 },
    { label: 'Овраг',        h11:  0.2, h12: 0,  h22: 10 },
    { label: 'Повёрнутое',   h11:  1, h12: 2,    h22:  1 },
    { label: 'Вырожд.',      h11:  2, h12: 0,    h22:  0 },
  ];

  const cond = Math.abs(l2) > 0.001 ? Math.abs(l1) / Math.abs(l2) : Infinity;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 4 · Частные производные"
        title="Гессиан и кривизна: тест на форму"
        question="Как собственные значения гессиана связаны с формой поверхности? Что такое «овраг» и почему он мешает оптимизации?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Собственные вектора H">
          Указывают направления главных кривизн. Вдоль одного — «самый крутой» склон. Вдоль другого — «самый пологий». Они всегда ортогональны (для симметричного H).
        </InfoCard>
        <InfoCard color={T.amber} title="Число обусловленности">
          κ = λ_max / λ_min. Для «круглой» чаши κ ≈ 1 — градиентный спуск идёт прямо. Для оврага κ ≫ 1 — зигзаги. κ → ∞ при det(H) → 0.
        </InfoCard>
        <InfoCard color={T.violet} title="Лапласиан = tr(H)">
          tr(H) = fxx + fyy = λ₁ + λ₂ = средняя кривизна. Положителен → чаша. Отрицателен → шапка. Равен нулю → седло (но не всегда!).
        </InfoCard>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {presets.map(p => (
          <PresetButton key={p.label} active={Math.abs(h11-p.h11)<0.01 && Math.abs(h12-p.h12)<0.01 && Math.abs(h22-p.h22)<0.01}
            onClick={() => { setH11(p.h11); setH12(p.h12); setH22(p.h22); }} label={p.label} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        {/* Eigenvector diagram */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 10, textAlign: 'center' as const }}>
            Собственные направления гессиана
          </div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
            {/* Grid */}
            {[-3,-2,-1,0,1,2,3].map(g => (
              <g key={g}>
                <line x1={CX + g*44} y1={0} x2={CX + g*44} y2={H} stroke={T.border} strokeWidth={g===0?1.5:0.5} />
                <line x1={0} y1={CY + g*44} x2={W} y2={CY + g*44} stroke={T.border} strokeWidth={g===0?1.5:0.5} />
              </g>
            ))}

            {/* Quadratic approximation ellipses */}
            {[0.5, 1, 1.5, 2, 2.5].map(level => {
              if (Math.abs(det) < 0.01 || det < 0) return null;
              const scl = Math.sqrt(level / Math.max(0.01, l1)) * 44;
              const scl2 = Math.sqrt(level / Math.max(0.01, l2)) * 44;
              if (!isFinite(scl) || !isFinite(scl2)) return null;
              const angle = Math.atan2(ev1[1], ev1[0]);
              return (
                <ellipse key={level}
                  cx={CX} cy={CY}
                  rx={Math.min(scl, 130)} ry={Math.min(scl2, 130)}
                  transform={`rotate(${angle * 180 / Math.PI}, ${CX}, ${CY})`}
                  fill="none" stroke={typeColors[type]} strokeWidth="1"
                  opacity={0.15 + level * 0.1} />
              );
            })}

            {/* Eigenvector 1 */}
            {isFinite(l1) && (() => {
              const len1 = sc(l1);
              const x1 = CX + ev1[0] * len1, y1 = CY - ev1[1] * len1;
              const x2 = CX - ev1[0] * len1, y2 = CY + ev1[1] * len1;
              return (
                <g>
                  <line x1={x2} y1={y2} x2={x1} y2={y1} stroke={T.red} strokeWidth="3" strokeLinecap="round" />
                  <circle cx={x1} cy={y1} r={6} fill={T.red} />
                  <circle cx={x2} cy={y2} r={6} fill={T.red} />
                  <text x={x1 + 8} y={y1 - 4} fontSize="11" fill={T.red} fontWeight="800">
                    λ₁={l1.toFixed(2)}
                  </text>
                </g>
              );
            })()}

            {/* Eigenvector 2 */}
            {isFinite(l2) && (() => {
              const len2 = sc(l2);
              const x1 = CX + ev2[0] * len2, y1 = CY - ev2[1] * len2;
              const x2 = CX - ev2[0] * len2, y2 = CY + ev2[1] * len2;
              return (
                <g>
                  <line x1={x2} y1={y2} x2={x1} y2={y1} stroke={T.cyan} strokeWidth="3" strokeLinecap="round" />
                  <circle cx={x1} cy={y1} r={6} fill={T.cyan} />
                  <circle cx={x2} cy={y2} r={6} fill={T.cyan} />
                  <text x={x1 + 8} y={y1 + 14} fontSize="11" fill={T.cyan} fontWeight="800">
                    λ₂={l2.toFixed(2)}
                  </text>
                </g>
              );
            })()}

            <circle cx={CX} cy={CY} r={5} fill={T.text} />
          </svg>

          <div style={{ textAlign: 'center' as const, marginTop: 10, padding: '8px 12px', borderRadius: 10, background: `${typeColors[type]}12`, border: `1px solid ${typeColors[type]}30`, fontSize: 14, fontWeight: 800, color: typeColors[type] }}>
            {typeLabels[type]}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {/* Matrix sliders */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Матрица H (симметричная)</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12, fontFamily: 'monospace', fontSize: 14, fontWeight: 700, alignItems: 'center' }}>
              <span style={{ fontSize: 22, color: T.muted, lineHeight: 1 }}>[</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px', textAlign: 'center' as const }}>
                <span style={{ color: T.red }}>{h11.toFixed(1)}</span>
                <span style={{ color: T.muted }}>{h12.toFixed(1)}</span>
                <span style={{ color: T.muted }}>{h12.toFixed(1)}</span>
                <span style={{ color: T.cyan }}>{h22.toFixed(1)}</span>
              </div>
              <span style={{ fontSize: 22, color: T.muted, lineHeight: 1 }}>]</span>
            </div>
            {[
              ['h₁₁ (fxx)', h11, setH11, T.red],
              ['h₁₂ (fxy)', h12, setH12, T.muted],
              ['h₂₂ (fyy)', h22, setH22, T.cyan],
            ].map(([lbl, val, setter, color]: any) => (
              <div key={lbl} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'monospace' }}>{lbl}</span>
                  <strong style={{ color }}>{(val as number).toFixed(1)}</strong>
                </div>
                <input type="range" min={-5} max={5} step={0.1} value={val as number}
                  onChange={e => (setter as any)(Number(e.target.value))}
                  style={{ width: '100%', accentColor: color as string }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
            <StatBadge label="λ₁ (красный)" value={isFinite(l1) ? l1.toFixed(3) : '∄'} color={l1 > 0.01 ? T.green : l1 < -0.01 ? T.red : T.muted} />
            <StatBadge label="λ₂ (синий)" value={isFinite(l2) ? l2.toFixed(3) : '∄'} color={l2 > 0.01 ? T.green : l2 < -0.01 ? T.red : T.muted} />
            <StatBadge label="det(H) = λ₁·λ₂" value={det.toFixed(3)} color={det > 0.01 ? T.green : det < -0.01 ? T.red : T.muted} />
            <StatBadge label="tr(H) = λ₁+λ₂ = Лапл." value={tr.toFixed(3)} color={T.primary} />
            <StatBadge label="κ = λ_max/λ_min" value={isFinite(cond) ? cond.toFixed(1) : '∞'} color={cond > 10 ? T.red : cond > 3 ? T.amber : T.green} />
          </div>

          <Collapsible title="Что показывают эллипсы на схеме?" color={T.primary}>
            Эллипсы — это линии уровня квадратичного приближения f ≈ ½·xᵀHx. Их оси направлены по собственным векторам H. Вытянутый эллипс → овраг → плохое число обусловленности. Окружность → κ=1 → идеально для градиентного спуска.
          </Collapsible>
          <Collapsible title="Почему повёрнутое седло (h12≠0) — тоже седло?" color={T.amber}>
            Тип стационарной точки определяется знаками собственных значений, а не знаками диагональных элементов. Даже если h11{'>'} 0 и h22{'>'} 0, но |h12| большое, det(H) может быть отрицательным → седло.
          </Collapsible>
        </div>
      </div>

      <Callout color={T.violet} title="Главный вывод">
        Гессиан — «микроскоп» в точку поверхности. Собственные векторы — направления главных кривизн. Собственные значения — их величины. Число обусловленности κ = λ_max/λ_min описывает «вытянутость» чаши и напрямую влияет на скорость сходимости градиентного спуска.
      </Callout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 5 — Gradient descent simulator
// ═══════════════════════════════════════════════════════════════════════════════
function GradientDescentLab() {
  const [surfKey, setSurfKey] = useState<SurfKey>('bowl');
  const [lr, setLr] = useState(0.15);
  const [trajectories, setTrajectories] = useState<{ x: number; y: number }[][]>([]);
  const [running, setRunning] = useState<number | null>(null); // index of running trajectory
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const surf = SURFS[surfKey];
  const W = 420, H = 420;
  const XMN = -2.5, XMX = 2.5, YMN = -2.5, YMX = 2.5;
  const toCanX = (x: number) => ((x - XMN) / (XMX - XMN)) * W;
  const toCanY = (y: number) => H - ((y - YMN) / (YMX - YMN)) * H;

  const levels = useMemo(() => {
    const vals: number[] = [];
    for (let i = -2.5; i <= 2.5; i += 0.3) for (let j = -2.5; j <= 2.5; j += 0.3) {
      try { const v = surf.f(i, j); if (isFinite(v) && Math.abs(v) < 100) vals.push(v); } catch {}
    }
    if (!vals.length) return [];
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const step = (mx - mn) / 12;
    return Array.from({ length: 12 }, (_, i) => mn + step * (i + 0.5));
  }, [surfKey]);

  const COLORS = [T.red, T.cyan, T.green, T.pink, T.amber, T.violet];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    renderHeatmap(ctx, W, H, surf.f, XMN, XMX, YMN, YMX, '#0f172a', surf.color);
    renderContours(ctx, W, H, surf.f, XMN, XMX, YMN, YMX, levels, T.white, 0.4);

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(toCanX(0), 0); ctx.lineTo(toCanX(0), H);
    ctx.moveTo(0, toCanY(0)); ctx.lineTo(W, toCanY(0));
    ctx.stroke();

    // Draw trajectories
    trajectories.forEach((traj, ti) => {
      if (traj.length < 2) return;
      const col = COLORS[ti % COLORS.length];
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(toCanX(traj[0].x), toCanY(traj[0].y));
      traj.forEach(p => ctx.lineTo(toCanX(p.x), toCanY(p.y)));
      ctx.stroke();

      // Start marker
      ctx.beginPath(); ctx.arc(toCanX(traj[0].x), toCanY(traj[0].y), 6, 0, Math.PI*2);
      ctx.fillStyle = col; ctx.globalAlpha = 0.7; ctx.fill();

      // End marker
      const last = traj[traj.length - 1];
      ctx.beginPath(); ctx.arc(toCanX(last.x), toCanY(last.y), 7, 0, Math.PI*2);
      ctx.fillStyle = col; ctx.globalAlpha = 1; ctx.fill();
      ctx.strokeStyle = T.white; ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }, [surfKey, trajectories, levels]);

  // Animate running trajectory
  useEffect(() => {
    if (running === null) return;
    const traj = trajectories[running];
    if (!traj || traj.length === 0) return;

    let step = 0;
    const maxSteps = 300;

    const tick = () => {
      if (step >= maxSteps) { setRunning(null); return; }
      const last = traj[traj.length - 1];
      const gx = surf.dfx(last.x, last.y);
      const gy = surf.dfy(last.x, last.y);
      const newX = last.x - lr * gx;
      const newY = last.y - lr * gy;

      if (!isFinite(newX) || !isFinite(newY) || Math.abs(newX) > 10 || Math.abs(newY) > 10) {
        setRunning(null); return;
      }

      const gradNorm = Math.hypot(gx, gy);
      if (gradNorm < 0.001) { setRunning(null); return; }

      setTrajectories(ts => ts.map((t, i) => i === running ? [...t, { x: newX, y: newY }] : t));
      step++;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, surfKey, lr]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (running !== null) return;
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const x0 = XMN + (e.clientX - rect.left) / rect.width * (XMX - XMN);
    const y0 = YMX - (e.clientY - rect.top) / rect.height * (YMX - YMN);
    const newIdx = trajectories.length;
    setTrajectories(ts => [...ts, [{ x: x0, y: y0 }]]);
    setRunning(newIdx);
  };

  const surfOptions: { key: SurfKey; label: string }[] = [
    { key: 'bowl', label: 'Чаша' },
    { key: 'saddle', label: 'Седло' },
    { key: 'waves', label: 'Волны' },
    { key: 'rosenbrock', label: 'Розенброк' },
  ];

  const lastTraj = trajectories[trajectories.length - 1];
  const lastPt   = lastTraj ? lastTraj[lastTraj.length - 1] : null;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 5 · Частные производные"
        title="Градиентный спуск — как машина учится"
        question="Как выглядит путь градиентного спуска на разных поверхностях? Почему в «овраге» он зигзагами? Что меняет learning rate?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Алгоритм">
          Каждый шаг: w ← w − α·∇f(w). Движение против градиента уменьшает f. α = learning rate — размер шага. Маленький α: медленно, но надёжно. Большой: быстро, но можно «промахнуться».
        </InfoCard>
        <InfoCard color={T.amber} title="Проблема оврагов">
          Если кривизна по одному направлению намного больше (κ≫1), градиент «тянет» поперёк оврага сильнее, чем вдоль. Траектория зигзагами. Именно это делает Розенброка злым тестом.
        </InfoCard>
        <InfoCard color={T.green} title="Области притяжения">
          Разные начальные точки ведут к разным минимумам. Граница между областями притяжения проходит через сёдла. Это объясняет, почему нейросети попадают в разные локальные минимумы.
        </InfoCard>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {surfOptions.map(o => (
          <PresetButton key={o.key} active={surfKey === o.key}
            onClick={() => { setSurfKey(o.key); setTrajectories([]); setRunning(null); if (rafRef.current) cancelAnimationFrame(rafRef.current); }}
            label={o.label} color={SURFS[o.key].color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 18, alignItems: 'start' }}>
        <div style={{ background: '#0f172a', borderRadius: 16, overflow: 'hidden' }}>
          <canvas ref={canvasRef} width={W} height={H}
            style={{ display: 'block', width: '100%', height: 'auto', cursor: running !== null ? 'wait' : 'crosshair' }}
            onClick={handleCanvasClick} />
          <div style={{ padding: '8px 14px', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
            {running !== null ? '⏳ Спуск идёт…' : '← кликни для старта траектории'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Learning rate α</SectionLabel>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.primary, textAlign: 'center' as const, marginBottom: 6 }}>
              α = {lr.toFixed(3)}
            </div>
            <input type="range" min={0.005} max={1.5} step={0.005} value={lr}
              onChange={e => setLr(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.primary }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
              {[0.01, 0.05, 0.1, 0.3, 0.5, 1.0].map(v => (
                <button key={v} onClick={() => setLr(v)}
                  style={{ padding: '3px 9px', borderRadius: 8, border: `1px solid ${T.primaryBorder}`, background: T.primaryLight, color: T.primaryDark, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: lr > 0.8 ? T.red : lr > 0.4 ? T.amber : T.green, fontWeight: 700 }}>
              {lr > 0.8 ? '⚠ Риск расходимости' : lr > 0.4 ? '⚡ Агрессивный шаг' : '✓ Стабильный шаг'}
            </div>
          </div>

          {/* Trajectory stats */}
          {lastTraj && (
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel>Последняя траектория</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                <StatBadge label="Шагов" value={lastTraj.length} color={T.primary} />
                {lastPt && <StatBadge label="f(финал)" value={surf.f(lastPt.x, lastPt.y).toFixed(4)} color={T.green} />}
                {lastPt && <StatBadge label="|∇f| финал" value={Math.hypot(surf.dfx(lastPt.x, lastPt.y), surf.dfy(lastPt.x, lastPt.y)).toFixed(4)} color={T.amber} />}
              </div>
            </div>
          )}

          <button onClick={() => { setTrajectories([]); setRunning(null); if (rafRef.current) cancelAnimationFrame(rafRef.current); }}
            style={{ padding: '9px 14px', borderRadius: 12, background: T.surface, color: T.muted, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <RotateCcw size={13} style={{ display: 'inline', marginRight: 4 }} />Очистить траектории
          </button>

          <Collapsible title="Почему Розенброк такой злой?" color={T.red}>
            f = (1−x)² + 10(y−x²)². Минимум в (1,1). Но вокруг него — банан-образный овраг с очень большим κ. Вдоль дна оврага кривизна мала, поперёк — велика. Градиентный спуск прыгает поперёк и еле ползёт вдоль. Именно поэтому его используют для тестирования оптимизаторов.
          </Collapsible>
          <Collapsible title="Что происходит при очень большом lr?" color={T.amber}>
            Если lr {'>'} 2/λ_max, шаг перескакивает через минимум и уходит ещё дальше. Алгоритм расходится. Для чаши z=x²+y² это lr {'>'} 1. Попробуй lr=1.2 и посмотри траекторию.
          </Collapsible>
        </div>
      </div>

      <Callout color={T.primary} title="Главный вывод">
        Градиентный спуск — жадный алгоритм: каждый шаг в сторону наискорейшего убывания. На «круглых» поверхностях (κ≈1) сходится быстро и прямо. На «оврагах» (κ≫1) зигзагами — именно это побудило изобрести momentum, RMSProp и Adam.
      </Callout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 6 — Directional derivative: polar rose at every point
// ═══════════════════════════════════════════════════════════════════════════════
function DirectionalDerivativeLab() {
  const [surfKey, setSurfKey] = useState<SurfKey>('bowl');
  const [x0, setX0] = useState(1.0);
  const [y0, setY0] = useState(0.5);
  const [angle, setAngle] = useState(45);
  const [animating, setAnimating] = useState(false);
  const rafRef = useRef<number | null>(null);

  const surf = SURFS[surfKey];
  const dfx = surf.dfx(x0, y0);
  const dfy = surf.dfy(x0, y0);
  const gradLen = Math.hypot(dfx, dfy);

  const rad = angle * Math.PI / 180;
  const ux = Math.cos(rad), uy = Math.sin(rad);
  const dirDeriv = dfx * ux + dfy * uy;

  // Gradient angle in degrees
  const gradAngle = Math.atan2(dfy, dfx) * 180 / Math.PI;
  const angleDiff = ((angle - gradAngle) % 360 + 360) % 360;
  const angleDiffSym = angleDiff > 180 ? angleDiff - 360 : angleDiff;

  // Animate angle rotation
  useEffect(() => {
    if (!animating) return;
    let a = 0;
    const tick = () => {
      setAngle(prev => (prev + 1.5) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [animating]);

  // Full rose data
  const roseFull = Array.from({ length: 180 }, (_, i) => {
    const a = i * 2 * Math.PI / 180;
    const ux2 = Math.cos(a), uy2 = Math.sin(a);
    return { a, dd: dfx * ux2 + dfy * uy2 };
  });

  const RW = 280, RH = 280, RC = 140;
  const maxDD = Math.max(gradLen, 0.01);
  const rScale = (RC - 20) / maxDD;

  const W = 340, H = 320, OX = 170, OY = 160, SCALE = 50;
  const toSx = (x: number) => OX + x * SCALE;
  const toSy = (y: number) => OY - y * SCALE;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const levels = useMemo(() => {
    const vals: number[] = [];
    for (let i = -2.5; i <= 2.5; i += 0.3) for (let j = -2.5; j <= 2.5; j += 0.3) {
      try { const v = surf.f(i, j); if (isFinite(v)) vals.push(v); } catch {}
    }
    if (!vals.length) return [];
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const step = (mx - mn) / 10;
    return Array.from({ length: 10 }, (_, i) => mn + step * (i + 0.5));
  }, [surfKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    renderHeatmap(ctx, W, H, surf.f, -2.5, 2.5, -2.5, 2.5, '#eef2ff', surf.color);
    renderContours(ctx, W, H, surf.f, -2.5, 2.5, -2.5, 2.5, levels, T.white, 0.45);

    const px = toSx(x0), py = toSy(y0);

    // Gradient arrow
    if (gradLen > 0.01) {
      const sc = Math.min(50 / gradLen, 35);
      const gex = px + dfx * sc, gey = py - dfy * sc;
      ctx.strokeStyle = T.red; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(gex, gey); ctx.stroke();
      const ga = Math.atan2(gey - py, gex - px);
      ctx.beginPath(); ctx.moveTo(gex, gey);
      ctx.lineTo(gex - 10*Math.cos(ga-0.4), gey - 10*Math.sin(ga-0.4));
      ctx.lineTo(gex - 10*Math.cos(ga+0.4), gey - 10*Math.sin(ga+0.4));
      ctx.closePath(); ctx.fillStyle = T.red; ctx.fill();
    }

    // Direction arrow
    const dex = px + ux * 50, dey = py - uy * 50;
    ctx.strokeStyle = T.cyan; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(dex, dey); ctx.stroke();
    const da = Math.atan2(dey - py, dex - px);
    ctx.beginPath(); ctx.moveTo(dex, dey);
    ctx.lineTo(dex - 9*Math.cos(da-0.4), dey - 9*Math.sin(da-0.4));
    ctx.lineTo(dex - 9*Math.cos(da+0.4), dey - 9*Math.sin(da+0.4));
    ctx.closePath(); ctx.fillStyle = T.cyan; ctx.fill();

    // Point
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI*2);
    ctx.fillStyle = T.white; ctx.fill();
    ctx.strokeStyle = T.red; ctx.lineWidth = 2; ctx.stroke();
  }, [surfKey, x0, y0, angle, levels, dfx, dfy, gradLen, ux, uy]);

  const surfOptions: { key: SurfKey; label: string }[] = [
    { key: 'bowl', label: 'Чаша' }, { key: 'saddle', label: 'Седло' },
    { key: 'waves', label: 'Волны' }, { key: 'xy', label: 'z=xy' },
  ];

  const ddColor = dirDeriv > 0.02 ? T.green : dirDeriv < -0.02 ? T.red : T.amber;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <LabHeader badge="Лаборатория 6 · Частные производные"
        title="Производная по направлению: роза кривизны"
        question="Как быстро меняется функция при движении под произвольным углом? Как это связано с градиентом?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 18 }}>
        <InfoCard color={T.primary} title="Формула D_u f">
          D_u f = ∇f · u = |∇f|·cos(θ). Зависит от угла между u и ∇f. Максимум когда θ=0 (по градиенту), ноль когда θ=90° (вдоль изолинии), минимум когда θ=180° (против градиента).
        </InfoCard>
        <InfoCard color={T.violet} title="Роза кривизны">
          Полярный график D_u f(θ). Форма — восьмёрка. Правый лепесток (зелёный) — направления роста. Левый (красный) — убывания. Максимальный радиус = |∇f|.
        </InfoCard>
        <InfoCard color={T.cyan} title="Связь с частными производными">
          {'D_{(1,0)} f = ∂f/∂x. D_{(0,1)} f = ∂f/∂y. Любая другая производная по направлению — линейная комбинация этих двух. Вот почему достаточно знать только ∂f/∂x и ∂f/∂y.'}
        </InfoCard>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14 }}>
        {surfOptions.map(o => (
          <PresetButton key={o.key} active={surfKey === o.key} onClick={() => setSurfKey(o.key)} label={o.label} color={SURFS[o.key].color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
        {/* Map */}
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
            <canvas ref={canvasRef} width={W} height={H}
              style={{ display: 'block', width: '100%', height: 'auto', cursor: 'crosshair' }}
              onClick={e => {
                const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
                setX0(-2.5 + (e.clientX - rect.left) / rect.width * 5);
                setY0(2.5 - (e.clientY - rect.top) / rect.height * 5);
              }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['x₀', x0, setX0], ['y₀', y0, setY0]].map(([lbl, val, setter]: any) => (
              <div key={lbl} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 4 }}>
                  <span>{lbl}</span><strong>{(val as number).toFixed(2)}</strong>
                </div>
                <input type="range" min={-2.3} max={2.3} step={0.05} value={val as number}
                  onChange={e => (setter as any)(Number(e.target.value))}
                  style={{ width: '100%', accentColor: T.primary }} />
              </div>
            ))}
          </div>
        </div>

        {/* Rose + controls */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {/* Polar rose */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '12px 14px' }}>
            <SectionLabel>Роза кривизны D_u f(θ)</SectionLabel>
            <svg width={RW} height={RH} viewBox={`0 0 ${RW} ${RH}`} style={{ display: 'block', width: '100%' }}>
              {/* Reference circles */}
              {[0.25, 0.5, 0.75, 1].map(r => (
                <circle key={r} cx={RC} cy={RC} r={(RC - 20) * r} fill="none" stroke={T.border} strokeWidth="0.5" />
              ))}
              <line x1={RC} y1={20} x2={RC} y2={RH - 20} stroke={T.border} strokeWidth={1} />
              <line x1={20} y1={RC} x2={RW - 20} y2={RC} stroke={T.border} strokeWidth={1} />

              {/* Positive lobe (green) */}
              <path d={[...roseFull, roseFull[0]].map((p, i) => {
                const len = Math.max(0, p.dd) * rScale;
                const sx = RC + Math.cos(p.a) * len, sy = RC - Math.sin(p.a) * len;
                return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
              }).join(' ')} fill={`${T.green}25`} stroke={T.green} strokeWidth="1.5" />

              {/* Negative lobe (red) */}
              <path d={[...roseFull, roseFull[0]].map((p, i) => {
                const len = Math.max(0, -p.dd) * rScale;
                const sx = RC + Math.cos(p.a) * len, sy = RC - Math.sin(p.a) * len;
                return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
              }).join(' ')} fill={`${T.red}20`} stroke={T.red} strokeWidth="1.5" />

              {/* Gradient direction */}
              {gradLen > 0.01 && (() => {
                const gRad = Math.atan2(dfy, dfx);
                const len = gradLen * rScale;
                return (
                  <g>
                    <line x1={RC} y1={RC} x2={RC + Math.cos(gRad) * len} y2={RC - Math.sin(gRad) * len}
                      stroke={T.red} strokeWidth="2.5" />
                    <circle cx={RC + Math.cos(gRad) * len} cy={RC - Math.sin(gRad) * len} r={4} fill={T.red} />
                  </g>
                );
              })()}

              {/* Current direction */}
              <line x1={RC} y1={RC}
                x2={RC + Math.cos(rad) * (RC - 18)}
                y2={RC - Math.sin(rad) * (RC - 18)}
                stroke={T.cyan} strokeWidth="2" strokeDasharray="6 3" />
              <circle cx={RC + Math.cos(rad) * (RC - 18)} cy={RC - Math.sin(rad) * (RC - 18)} r={5} fill={T.cyan} />

              {/* Center */}
              <circle cx={RC} cy={RC} r={4} fill={T.text} />

              {/* Labels */}
              <text x={RW - 18} y={RC + 4} fontSize="10" fill={T.muted} textAnchor="middle">0°</text>
              <text x={18} y={RC + 4} fontSize="10" fill={T.muted} textAnchor="middle">180°</text>
              <text x={RC} y={14} fontSize="10" fill={T.muted} textAnchor="middle">90°</text>
              <text x={RC} y={RH - 6} fontSize="10" fill={T.muted} textAnchor="middle">270°</text>
            </svg>
          </div>

          {/* Angle control */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel>Направление u (угол θ)</SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.cyan, textAlign: 'center' as const, marginBottom: 6 }}>{angle}°</div>
            <input type="range" min={0} max={359} step={1} value={angle}
              onChange={e => { setAnimating(false); setAngle(Number(e.target.value)); }}
              style={{ width: '100%', accentColor: T.cyan }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
              <button onClick={() => { setAnimating(false); setAngle(Math.round(((gradAngle % 360) + 360) % 360)); }}
                style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.red}40`, background: T.redLight, color: T.red, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                По ∇f
              </button>
              <button onClick={() => { setAnimating(false); setAngle(Math.round(((gradAngle + 90) % 360 + 360) % 360)); }}
                style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.amber}40`, background: T.amberLight, color: T.amber, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                ⊥ ∇f
              </button>
              <button onClick={() => { setAnimating(false); setAngle(Math.round(((gradAngle + 180) % 360 + 360) % 360)); }}
                style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.primaryBorder}`, background: T.primaryLight, color: T.primaryDark, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                Против ∇f
              </button>
              <button onClick={() => setAnimating(a => !a)}
                style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: animating ? T.primary : T.surface, color: animating ? T.white : T.muted, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                {animating ? '⏸ Стоп' : '▶ Крутить'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
            <StatBadge label="∂f/∂x" value={dfx.toFixed(3)} color={T.green} />
            <StatBadge label="∂f/∂y" value={dfy.toFixed(3)} color={T.cyan} />
            <StatBadge label="|∇f|" value={gradLen.toFixed(3)} color={T.red} />
            <StatBadge label="θ − ∠∇f" value={`${angleDiffSym.toFixed(1)}°`} color={T.muted} />
            <div style={{ padding: '10px 12px', borderRadius: 9, background: `${ddColor}10`, border: `1px solid ${ddColor}30`, fontSize: 13, fontWeight: 800, color: ddColor, textAlign: 'center' as const }}>
              D_u f = {dirDeriv.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <HelpCircle size={15} color={T.primary} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Загадки</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="Почему форма розы всегда восьмёрка (лемниската)?" color={T.primary}>
          D_u f = |∇f|·cos(θ). Полярный граф r = cos(θ) — это именно окружность, сдвинутая к правой стороне. В данном случае ∇f задаёт ось симметрии. Лепестки — проекция ∇f на все направления.
        </Collapsible>
        <Collapsible title="Как производная по направлению связана с частными производными?" color={T.green}>
          {'D_{e₁} f = ∂f/∂x (направление вдоль X), D_{e₂} f = ∂f/∂y (вдоль Y). Любая другая: D_u f = ux·∂f/∂x + uy·∂f/∂y. Это скалярное произведение (∂f/∂x, ∂f/∂y)·(ux, uy) = ∇f·u. Вот почему для знания всех производных по направлению достаточно двух частных.'}
        </Collapsible>
        <Collapsible title="В точке минимума: какова производная по любому направлению?" color={T.amber}>
          В стационарной точке ∇f=0. Значит D_u f = ∇f·u = 0 для любого u. Производная по направлению равна нулю во всех направлениях — роза кривизны сжата в точку.
        </Collapsible>
      </div>

      <Callout color={T.violet} title="Главный вывод">
        D_u f = ∇f · u = |∇f|·cos(θ). Это проекция градиента на направление u. Максимум при θ=0 (по ∇f), ноль при θ=90° (вдоль изолинии), минимум при θ=180°. Знание двух частных производных ∂f/∂x и ∂f/∂y полностью определяет поведение функции во всех направлениях.
      </Callout>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function PartialDerivativesLabView() {
  const [activeLab, setActiveLab] = useState<string>(PARTIAL_LABS[0].id);
  const lab = PARTIAL_LABS.find(item => item.id === activeLab) ?? PARTIAL_LABS[0];

  return (
    <LabShell
      title="Лаборатории: Частные производные"
      intro="Шесть интерактивных стендов: от сечений поверхности до градиентного спуска и розы кривизны. Кликай, двигай, исследуй."
      labs={PARTIAL_LABS}
      activeId={activeLab}
      onSelect={setActiveLab}
    >
      {lab.id === 'pd-slices'              ? <SlicesLab />
        : lab.id === 'pd-gradient-compass'   ? <GradientCompassLab />
        : lab.id === 'pd-critical-points'    ? <CriticalPointsLab />
        : lab.id === 'pd-hessian-curvature'  ? <HessianLab />
        : lab.id === 'pd-gradient-descent'   ? <GradientDescentLab />
        : lab.id === 'pd-directional-derivative' ? <DirectionalDerivativeLab />
        : <LabBody title={lab.title} question={lab.question} mechanics={lab.mechanics} explore={lab.explore} insight={lab.insight} />
      }
    </LabShell>
  );
}
