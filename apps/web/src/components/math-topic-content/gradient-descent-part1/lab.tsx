// @ts-nocheck
/**
 * Лаборатории для темы «Градиентный спуск — часть 1».
 * Четыре интерактивных стенда: спуск по параболе, learning rate,
 * двумерный овраг, условия остановки. Палитра T — единая с теорией.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, ChevronUp, HelpCircle, Lightbulb, Play, Pause, RotateCcw,
  StepForward, MousePointer2, Gauge, Mountain, TrendingDown,
} from 'lucide-react';

// ─── Palette (та же, что в theory-rich.tsx) ───────────────────────────────────
const T = {
  text: '#1e293b', muted: '#64748b', mutedLight: '#94a3b8',
  primary: '#6366f1', primaryLight: '#eef2ff', primaryBorder: '#c7d2fe', primaryDark: '#4f46e5',
  accent: '#7c3aed', green: '#10b981', greenLight: '#d1fae5',
  amber: '#f59e0b', amberLight: '#fef3c7', red: '#ef4444', redLight: '#fee2e2',
  white: '#ffffff', surface: '#f8fafc', border: '#e2e8f0',
  cyan: '#06b6d4', violet: '#8b5cf6', pink: '#ec4899',
};

// ─── Утилитарные UI-компоненты ────────────────────────────────────────────────
function SectionLabel({ children, color = T.muted }: any) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color, textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
    </div>
  );
}

function StatBadge({ label, value, color = T.primary }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, padding: '6px 12px', borderRadius: 9, background: `${color}10`, border: `1px solid ${color}30` }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function Callout({ color = T.amber, title, children }: any) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 12, padding: '13px 18px', margin: '14px 0' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function Collapsible({ title, color = T.primary, children, defaultOpen = false }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${color}30`, borderRadius: 10, background: T.white, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', textAlign: 'left' as const, padding: '10px 14px', display: 'flex',
        alignItems: 'center', gap: 8, background: open ? `${color}08` : 'none',
        border: 'none', cursor: 'pointer', color: T.text, fontSize: 12, fontWeight: 700,
      }}>
        {open ? <ChevronUp size={14} color={color} /> : <ChevronDown size={14} color={color} />}
        <span style={{ flex: 1 }}>{title}</span>
      </button>
      {open && (
        <div style={{ padding: '10px 14px 12px', fontSize: 12.5, color: T.text, lineHeight: 1.7, borderTop: `1px solid ${color}20` }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, color = T.primary, suffix }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11 }}>
        <span style={{ color: T.muted, fontWeight: 700 }}>{label}</span>
        <span style={{ color, fontWeight: 800, fontFamily: 'monospace' }}>
          {typeof value === 'number' ? value.toFixed(value < 1 && value > -1 && value !== 0 ? 3 : 2) : value}{suffix || ''}
        </span>
      </div>
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: color }} />
    </div>
  );
}

function Button({ children, onClick, color = T.primary, disabled = false, active = false }: any) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        padding: '7px 14px', borderRadius: 9, border: `1px solid ${color}`,
        background: active ? color : 'transparent', color: active ? T.white : color,
        fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'all 0.15s',
      }}>
      {children}
    </button>
  );
}

// ─── LabShell: оболочка с табами ──────────────────────────────────────────────
function LabShell({ title, intro, labs, activeId, onSelect, children }: any) {
  return (
    <div style={{ padding: '0 0 56px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 8px', color: T.text, fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>{title}</h1>
        <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.7 }}>{intro}</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 24 }}>
        {labs.map((lab: any) => {
          const isActive = lab.id === activeId;
          return (
            <button key={lab.id} onClick={() => onSelect(lab.id)}
              style={{
                padding: '7px 14px', borderRadius: 20, border: `1px solid ${isActive ? T.primary : T.border}`,
                background: isActive ? T.primary : T.white, color: isActive ? T.white : T.text,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              {lab.icon && <lab.icon size={13} />}
              {lab.title}
            </button>
          );
        })}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ЛАБ 1: «Спуск по параболе»
// ═════════════════════════════════════════════════════════════════════════════
function ParabolaDescentLab() {
  const [a, setA] = useState(3);          // положение минимума
  const [eta, setEta] = useState(0.1);    // learning rate
  const [w0, setW0] = useState(0);        // стартовая точка

  const [w, setW] = useState(0);
  const [iter, setIter] = useState(0);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<number[]>([0]);
  const [converged, setConverged] = useState(false);
  const [diverged, setDiverged] = useState(false);

  // При смене параметров — сброс
  useEffect(() => {
    setW(w0); setIter(0); setHistory([w0]);
    setRunning(false); setConverged(false); setDiverged(false);
  }, [a, eta, w0]);

  function step() {
    if (converged || diverged) return;
    setW(prev => {
      const grad = 2 * (prev - a);
      const next = prev - eta * grad;
      setIter(i => i + 1);
      setHistory(h => [...h.slice(-200), next]);
      if (Math.abs(next - a) < 0.01) setConverged(true);
      if (!isFinite(next) || Math.abs(next) > 1e6) { setDiverged(true); setRunning(false); }
      return next;
    });
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => step(), 250);
    return () => clearInterval(id);
  }, [running, a, eta, converged, diverged]);

  function reset() {
    setW(w0); setIter(0); setHistory([w0]);
    setRunning(false); setConverged(false); setDiverged(false);
  }

  // Геометрия графика
  const W_SVG = 560, H_SVG = 320;
  const wMin = -6, wMax = 11;
  const fMaxView = 60;
  const ox = 40, oy = H_SVG - 36;
  const wRange = wMax - wMin;
  const xOf = (wVal: number) => ox + ((wVal - wMin) / wRange) * (W_SVG - 60);
  const yOf = (fVal: number) => oy - (Math.min(fMaxView, fVal) / fMaxView) * (H_SVG - 70);

  const parabolaPts = useMemo(() => {
    const pts: string[] = [];
    for (let wv = wMin; wv <= wMax; wv += 0.1) {
      const f = (wv - a) * (wv - a);
      if (f > fMaxView + 10) continue;
      pts.push(`${xOf(wv)},${yOf(f)}`);
    }
    return pts.join(' ');
  }, [a]);

  const fW = (w - a) * (w - a);
  const grad = 2 * (w - a);

  // Касательная: f(w0) + f'(w0)(x - w0)
  const tanLen = 1.3;
  const tx1 = w - tanLen, ty1 = fW + grad * (-tanLen);
  const tx2 = w + tanLen, ty2 = fW + grad * (tanLen);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'flex-start' }}>
      {/* График */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: 12 }}>
        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} style={{ width: '100%', display: 'block' }}>
          {/* Оси */}
          <line x1={ox} y1={oy} x2={W_SVG - 14} y2={oy} stroke={T.mutedLight} strokeWidth="1.2" />
          <line x1={ox} y1={20} x2={ox} y2={oy + 6} stroke={T.mutedLight} strokeWidth="1.2" />
          {/* Тики по оси w */}
          {[-5, 0, 3, 5, 10].map(wv => (
            <g key={wv}>
              <line x1={xOf(wv)} y1={oy} x2={xOf(wv)} y2={oy + 4} stroke={T.mutedLight} strokeWidth="1" />
              <text x={xOf(wv)} y={oy + 16} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{wv}</text>
            </g>
          ))}
          <text x={W_SVG - 14} y={oy - 4} fontSize="11" fill={T.muted}>w</text>
          <text x={ox + 4} y={20} fontSize="11" fill={T.muted}>f(w)</text>

          {/* Парабола */}
          <polyline points={parabolaPts} fill="none" stroke={T.green} strokeWidth="2.2" />

          {/* Минимум */}
          <circle cx={xOf(a)} cy={oy} r="5" fill={T.green} />
          <text x={xOf(a)} y={oy - 8} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.green}>min</text>

          {/* История */}
          {history.slice(-20).map((wv, i, arr) => {
            const op = 0.15 + (i / arr.length) * 0.4;
            const f = (wv - a) * (wv - a);
            const yClamp = Math.max(20, yOf(f));
            return <circle key={`h${i}`} cx={xOf(wv)} cy={yClamp} r="2.5" fill={T.primary} opacity={op} />;
          })}

          {/* Касательная в текущей точке */}
          {!diverged && Math.abs(grad) > 0.001 && Math.abs(w) < 100 && (
            <line
              x1={xOf(tx1)} y1={yOf(Math.max(0, ty1))}
              x2={xOf(tx2)} y2={yOf(Math.max(0, ty2))}
              stroke={T.muted} strokeWidth="1.4" strokeDasharray="4,3" opacity="0.7"
            />
          )}

          {/* Стрелка шага по оси w */}
          {!diverged && Math.abs(grad) > 0.001 && Math.abs(w) < 100 && (() => {
            const wNext = w - eta * grad;
            if (Math.abs(wNext) > 50) return null;
            return (
              <g>
                <defs>
                  <marker id="lab1-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                    <path d="M0,0 L7,3.5 L0,7 Z" fill={T.amber} />
                  </marker>
                </defs>
                <line x1={xOf(w)} y1={oy + 22} x2={xOf(wNext)} y2={oy + 22}
                  stroke={T.amber} strokeWidth="2" markerEnd="url(#lab1-arr)" />
                <text x={(xOf(w) + xOf(wNext)) / 2} y={oy + 36} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.amber}>
                  −η·f′
                </text>
              </g>
            );
          })()}

          {/* Текущая точка */}
          {!diverged && Math.abs(w) < 100 && (
            <g>
              <circle cx={xOf(w)} cy={yOf(fW)} r="7" fill={T.red} stroke={T.white} strokeWidth="2" />
              <text x={xOf(w)} y={yOf(fW) - 14} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.red}>
                w = {w.toFixed(2)}
              </text>
            </g>
          )}

          {/* Уведомление о расходимости */}
          {diverged && (
            <g>
              <rect x={W_SVG / 2 - 100} y={H_SVG / 2 - 28} width={200} height={56} rx={10}
                fill={T.redLight} stroke={T.red} strokeWidth="1.5" />
              <text x={W_SVG / 2} y={H_SVG / 2 - 6} textAnchor="middle" fontSize="13" fontWeight="800" fill={T.red}>
                Расходимость!
              </text>
              <text x={W_SVG / 2} y={H_SVG / 2 + 12} textAnchor="middle" fontSize="10" fill={T.muted}>
                η &gt; 2/f″ = 1, шаги растут
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Правая панель — управление и статус */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
          <SectionLabel color={T.primary}>Управление</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            <Slider label="a — положение минимума" value={a} onChange={setA} min={-5} max={5} step={0.5} color={T.green} />
            <Slider label="η — learning rate" value={eta} onChange={setEta} min={0.01} max={1.5} step={0.01} color={T.amber} />
            <Slider label="w₀ — стартовая точка" value={w0} onChange={setW0} min={-5} max={10} step={0.5} color={T.violet} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          <Button onClick={step} color={T.primary} disabled={converged || diverged}>
            <StepForward size={13} /> Шаг
          </Button>
          <Button onClick={() => setRunning(r => !r)} color={T.green} active={running} disabled={converged || diverged}>
            {running ? <Pause size={13} /> : <Play size={13} />} {running ? 'Пауза' : 'Авто'}
          </Button>
          <Button onClick={reset} color={T.muted}>
            <RotateCcw size={13} /> Сброс
          </Button>
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
          <SectionLabel>Состояние</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <StatBadge label="итерация t" value={iter} color={T.primary} />
            <StatBadge label="w_t" value={w.toFixed(4)} color={T.violet} />
            <StatBadge label="f(w_t)" value={fW.toFixed(4)} color={T.green} />
            <StatBadge label="f′(w_t) = 2(w − a)" value={grad.toFixed(4)} color={T.amber} />
            <StatBadge label="|w − a|" value={Math.abs(w - a).toFixed(4)} color={converged ? T.green : T.muted} />
          </div>
          {converged && (
            <div style={{ marginTop: 10, background: T.greenLight, border: `1px solid ${T.green}`, borderRadius: 9, padding: '8px 12px', fontSize: 12, color: '#065f46', fontWeight: 700 }}>
              ✓ Сошлось за {iter} шагов: |w − a| &lt; 0.01
            </div>
          )}
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
          <SectionLabel color={T.cyan}>Граница устойчивости</SectionLabel>
          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>
            Для f(w) = (w − a)² кривизна f″ = 2. <br />
            <span style={{ color: T.green, fontWeight: 700 }}>Оптимум:</span> η = 1/2 = 0.5 (1 шаг).<br />
            <span style={{ color: T.amber, fontWeight: 700 }}>Сходится при:</span> 0 &lt; η &lt; 1.<br />
            <span style={{ color: T.red, fontWeight: 700 }}>Расходится при:</span> η ≥ 1.
          </div>
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
        <SectionLabel color={T.violet}>Что попробовать</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
          <Collapsible title="Поставьте η = 0.5. Почему сходится за 1 шаг?" color={T.green}>
            {'f″ = 2 → оптимальный η = 1/2. Формула: w_{t+1} = w_t − 0.5·2(w_t − a) = a. После одного применения мы точно в минимуме, независимо от стартовой точки.'}
          </Collapsible>
          <Collapsible title="Поставьте η = 1.0. Что происходит?" color={T.amber}>
            {'w_{t+1} = w_t − 1·2(w_t − a) = 2a − w_t. Это отражение относительно минимума. Точка прыгает между w₀ и 2a − w₀, не приближаясь — алгоритм колеблется на границе устойчивости.'}
          </Collapsible>
          <Collapsible title="Поставьте η = 1.1. Куда уходит точка?" color={T.red}>
            При η &gt; 2/f″ = 1 расстояние до минимума умножается на |1 − 2η| = 1.2 на каждом шаге. Амплитуда колебаний растёт экспоненциально — расходимость.
          </Collapsible>
          <Collapsible title="Поменяйте a с 3 на −2. Изменилась ли скорость сходимости?" color={T.cyan}>
            Нет. Форма параболы зависит только от f″, а оно равно 2 при любом a. Оптимальный η = 0.5 — универсальный для всей семьи (w − a)².
          </Collapsible>
        </div>
        <Callout color={T.violet} title="Открытие">
          Для квадратичной функции сходимость определяется ТОЛЬКО кривизной (f″), а не положением минимума.
          Шаги уменьшаются естественно, потому что градиент f′(w) = 2(w − a) → 0 у минимума.
        </Callout>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ЛАБ 2: «Learning rate — три панели»
// ═════════════════════════════════════════════════════════════════════════════
function ThreeLearningRatesLab() {
  const [etaA, setEtaA] = useState(0.05);  // слишком малый
  const [etaB, setEtaB] = useState(0.5);   // оптимум
  const [etaC, setEtaC] = useState(1.2);   // расходимость
  const [mode, setMode] = useState<'parabola' | 'wild'>('parabola');

  // Параметры
  const w0 = mode === 'parabola' ? -3 : 2.5;
  const maxIter = 30;

  // f и f' для двух функций
  function f(w: number) {
    if (mode === 'parabola') return (w - 2) * (w - 2);
    // wild: w^4 - 3 w^3 + 2 w^2 + w
    return w * w * w * w - 3 * w * w * w + 2 * w * w + w;
  }
  function df(w: number) {
    if (mode === 'parabola') return 2 * (w - 2);
    return 4 * w * w * w - 9 * w * w + 4 * w + 1;
  }

  function simulate(eta: number) {
    const traj: number[] = [w0];
    let w = w0;
    let convergedAt = -1;
    let diverged = false;
    for (let i = 0; i < maxIter; i++) {
      const g = df(w);
      const wNext = w - eta * g;
      if (!isFinite(wNext) || Math.abs(wNext) > 100) { diverged = true; break; }
      traj.push(wNext);
      if (mode === 'parabola' && Math.abs(wNext - 2) < 0.01 && convergedAt < 0) convergedAt = i + 1;
      if (mode === 'wild' && Math.abs(g) < 0.01 && convergedAt < 0) convergedAt = i + 1;
      w = wNext;
    }
    return { traj, convergedAt, diverged };
  }

  const simA = useMemo(() => simulate(etaA), [etaA, mode]);
  const simB = useMemo(() => simulate(etaB), [etaB, mode]);
  const simC = useMemo(() => simulate(etaC), [etaC, mode]);

  // SVG-панель
  function renderPanel(eta: number, sim: any, color: string, label: string) {
    const W = 200, H = 180;
    const ox = 20, oy = H - 28;
    const wMin = mode === 'parabola' ? -4 : -2;
    const wMax = mode === 'parabola' ? 7 : 3;
    const fMaxView = mode === 'parabola' ? 30 : 10;
    const xOf = (wv: number) => ox + ((wv - wMin) / (wMax - wMin)) * (W - 30);
    const yOf = (fv: number) => oy - (Math.min(fMaxView, Math.max(-2, fv)) / fMaxView) * (H - 50);

    const fnPts: string[] = [];
    for (let wv = wMin; wv <= wMax; wv += 0.05) {
      const fv = f(wv);
      if (fv > fMaxView + 5) continue;
      fnPts.push(`${xOf(wv)},${yOf(fv)}`);
    }

    return (
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color }}>{label}</span>
          <code style={{ fontSize: 11, fontWeight: 800, color }}>η = {eta.toFixed(2)}</code>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          <line x1={ox} y1={oy} x2={W - 10} y2={oy} stroke={T.mutedLight} strokeWidth="1" />
          <line x1={ox} y1={10} x2={ox} y2={oy + 4} stroke={T.mutedLight} strokeWidth="1" />
          <polyline points={fnPts.join(' ')} fill="none" stroke={color} strokeOpacity="0.55" strokeWidth="1.6" />

          {/* Min marker for parabola */}
          {mode === 'parabola' && (
            <circle cx={xOf(2)} cy={oy} r="3" fill={color} />
          )}

          {/* Trajectory */}
          {sim.traj.map((wv: number, i: number) => {
            const fv = f(wv);
            const wClamp = Math.max(wMin - 0.5, Math.min(wMax + 0.5, wv));
            const yClamp = yOf(Math.min(fMaxView, fv));
            return (
              <circle key={i} cx={xOf(wClamp)} cy={yClamp} r="2.5"
                fill={color} opacity={0.3 + (i / sim.traj.length) * 0.7} />
            );
          })}
          {/* Connect lines for first 12 steps */}
          {sim.traj.slice(0, 12).map((wv: number, i: number) => {
            if (i === 0) return null;
            const wPrev = sim.traj[i - 1];
            const wClamp1 = Math.max(wMin - 0.5, Math.min(wMax + 0.5, wPrev));
            const wClamp2 = Math.max(wMin - 0.5, Math.min(wMax + 0.5, wv));
            return (
              <line key={`l${i}`}
                x1={xOf(wClamp1)} y1={yOf(Math.min(fMaxView, f(wPrev)))}
                x2={xOf(wClamp2)} y2={yOf(Math.min(fMaxView, f(wv)))}
                stroke={color} strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
            );
          })}
        </svg>
        <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, textAlign: 'center' as const,
          color: sim.diverged ? T.red : sim.convergedAt > 0 ? T.green : T.amber }}>
          {sim.diverged ? 'расходится' :
            sim.convergedAt > 0 ? `сошлось за ${sim.convergedAt} шагов` :
              `> ${maxIter} шагов`}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <Button color={T.primary} active={mode === 'parabola'} onClick={() => setMode('parabola')}>
          Парабола f = (w − 2)²
        </Button>
        <Button color={T.violet} active={mode === 'wild'} onClick={() => setMode('wild')}>
          Незнакомая функция w⁴ − 3w³ + 2w² + w
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {renderPanel(etaA, simA, T.amber, 'слишком малый')}
        {renderPanel(etaB, simB, T.green, 'оптимальный')}
        {renderPanel(etaC, simC, T.red, 'слишком большой')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
          <Slider label="η левый" value={etaA} onChange={setEtaA} min={0.005} max={2} step={0.005} color={T.amber} />
        </div>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
          <Slider label="η средний" value={etaB} onChange={setEtaB} min={0.005} max={2} step={0.005} color={T.green} />
        </div>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
          <Slider label="η правый" value={etaC} onChange={setEtaC} min={0.005} max={2} step={0.005} color={T.red} />
        </div>
      </div>

      {mode === 'parabola' && (
        <div style={{ background: T.cyan + '10', border: `1px solid ${T.cyan}40`, borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: T.text, lineHeight: 1.7, marginBottom: 14 }}>
          <strong style={{ color: T.cyan }}>Спектр гессиана:</strong> f″(w) = 2 (постоянная кривизна).
          <strong style={{ color: T.amber }}> Граница устойчивости:</strong> η_max = 2 / f″ = 1.
          <strong style={{ color: T.green }}> Оптимум:</strong> η = 1/2 = 0.5 — сходится за 1 шаг.
        </div>
      )}
      {mode === 'wild' && (
        <div style={{ background: T.violet + '10', border: `1px solid ${T.violet}40`, borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: T.text, lineHeight: 1.7, marginBottom: 14 }}>
          <strong style={{ color: T.violet }}>Внимание:</strong> у этой функции кривизна меняется от точки к точке.
          Один и тот же η может работать в одной области и расходиться в другой.
          Из <code>w₀ = 2.5</code> алгоритм идёт к локальному минимуму вблизи w ≈ 2.
          Большой η может «перескочить» через локальный минимум — попробуйте η около 0.3 на правой панели.
        </div>
      )}

      <SectionLabel color={T.violet}>Задания и загадки</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
        <Collapsible title="Найдите максимальный η, при котором алгоритм ещё сходится на параболе" color={T.amber}>
          η = 1.0 — граница: алгоритм колеблется между двумя точками, не сходясь и не расходясь.
          При η чуть больше 1 — расходимость. Это и есть η_max = 2/f″.
        </Collapsible>
        <Collapsible title="При η = 0.99 алгоритм сходится, но очень долго. Что за закономерность в колебаниях?" color={T.cyan}>
          {'Каждый шаг умножает расстояние до минимума на |1 − 2η·1| = |1 − 1.98| = 0.98. Колебания затухают как 0.98^t — очень медленно. При η = 0.5 множитель равен 0, отсюда мгновенная сходимость.'}
        </Collapsible>
        <Collapsible title="При η = 0.5 на (w − 2)² — 1 шаг. На (w − 5)² — тоже 1 шаг. Почему?" color={T.green}>
          Кривизна параболы (w − a)² равна 2 для любого a. Оптимальный η зависит ТОЛЬКО от кривизны,
          не от положения минимума. Поэтому формула «1 шаг к минимуму» работает для всей семьи парабол.
        </Collapsible>
      </div>

      <Callout color={T.primary} title="Открытие">
        Learning rate — компромисс между скоростью и устойчивостью. Граница определяется максимальной кривизной.
        Для неквадратичных функций η, работающий в одной точке, может расходиться в другой — отсюда
        потребность в <strong>адаптивных методах</strong> (Adam, RMSProp), которые сами подстраивают шаг.
      </Callout>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ЛАБ 3: «Спуск в чаше — 2D»
// ═════════════════════════════════════════════════════════════════════════════
function BowlDescent2DLab() {
  const [c, setC] = useState(10);
  const [eta, setEta] = useState(0.05);
  const [start, setStart] = useState<[number, number]>([3, 3]);
  const [traj, setTraj] = useState<Array<[number, number]>>([[3, 3]]);
  const [iter, setIter] = useState(0);
  const [running, setRunning] = useState(false);
  const [diverged, setDiverged] = useState(false);

  // Сброс при смене параметров
  useEffect(() => {
    setTraj([start]); setIter(0); setRunning(false); setDiverged(false);
  }, [c, eta, start]);

  function step() {
    if (diverged) return;
    setTraj(prev => {
      const [w1, w2] = prev[prev.length - 1];
      const g1 = 2 * w1, g2 = 2 * c * w2;
      const n1 = w1 - eta * g1, n2 = w2 - eta * g2;
      setIter(i => i + 1);
      if (!isFinite(n1) || !isFinite(n2) || Math.abs(n1) > 100 || Math.abs(n2) > 100) {
        setDiverged(true); setRunning(false);
        return prev;
      }
      const next = [...prev.slice(-200), [n1, n2] as [number, number]];
      return next;
    });
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => step(), 150);
    return () => clearInterval(id);
  }, [running, c, eta, diverged]);

  function reset() {
    setTraj([start]); setIter(0); setRunning(false); setDiverged(false);
  }

  // SVG-контурная карта
  const W_SVG = 460, H_SVG = 360;
  const w1Range = 4, w2Range = 4;  // от -range до +range
  const cx = W_SVG / 2, cy = H_SVG / 2;
  const scX = (W_SVG - 60) / (2 * w1Range);
  const scY = (H_SVG - 50) / (2 * w2Range);
  const toSvg = (w1: number, w2: number) => [cx + w1 * scX, cy - w2 * scY] as [number, number];
  const fromSvg = (sx: number, sy: number) => [(sx - cx) / scX, (cy - sy) / scY] as [number, number];

  const levels = [0.5, 1.5, 3, 5, 8];

  function onCanvasClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W_SVG;
    const sy = ((e.clientY - rect.top) / rect.height) * H_SVG;
    const [w1, w2] = fromSvg(sx, sy);
    if (Math.abs(w1) > w1Range || Math.abs(w2) > w2Range) return;
    setStart([w1, w2]);
  }

  const [curW1, curW2] = traj[traj.length - 1];
  const fCur = curW1 * curW1 + c * curW2 * curW2;
  const gradNorm = Math.sqrt((2 * curW1) ** 2 + (2 * c * curW2) ** 2);
  const kappa = c >= 1 ? c : 1 / c;
  const lamMax = 2 * Math.max(1, c);
  const etaMax = 2 / lamMax;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18 }}>
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: 10 }}>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MousePointer2 size={12} /> Кликни в любом месте, чтобы задать стартовую точку
        </div>
        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} onClick={onCanvasClick}
          style={{ width: '100%', display: 'block', cursor: 'crosshair', background: T.surface, borderRadius: 8 }}>
          {/* Оси */}
          <line x1={20} y1={cy} x2={W_SVG - 20} y2={cy} stroke={T.mutedLight} strokeWidth="1" />
          <line x1={cx} y1={20} x2={cx} y2={H_SVG - 20} stroke={T.mutedLight} strokeWidth="1" />
          <text x={W_SVG - 14} y={cy - 4} fontSize="10" fill={T.muted}>w₁</text>
          <text x={cx + 6} y={20} fontSize="10" fill={T.muted}>w₂</text>

          {/* Контурная карта f = w1² + c·w2² */}
          {levels.map((lv, i) => {
            const rx = Math.sqrt(lv) * scX;
            const ry = Math.sqrt(lv / c) * scY;
            return (
              <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
                fill="none" stroke={T.primary} strokeWidth={1 + i * 0.1} opacity={0.3 + i * 0.13} />
            );
          })}

          {/* Минимум */}
          <circle cx={cx} cy={cy} r="6" fill={T.green} />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={T.white}>★</text>

          {/* Траектория */}
          {traj.length > 1 && (
            <polyline
              points={traj.map(([w1, w2]) => {
                const [x, y] = toSvg(w1, w2);
                return `${x},${y}`;
              }).join(' ')}
              fill="none" stroke={T.amber} strokeWidth="1.8" strokeLinejoin="round"
            />
          )}
          {traj.map(([w1, w2], i) => {
            const [x, y] = toSvg(w1, w2);
            if (Math.abs(x - cx) > W_SVG || Math.abs(y - cy) > H_SVG) return null;
            return (
              <circle key={i} cx={x} cy={y} r="2.5" fill={T.amber}
                opacity={0.4 + (i / traj.length) * 0.6} />
            );
          })}

          {/* Текущая точка */}
          {!diverged && (() => {
            const [x, y] = toSvg(curW1, curW2);
            return (
              <g>
                <circle cx={x} cy={y} r="6" fill={T.red} stroke={T.white} strokeWidth="2" />
              </g>
            );
          })()}

          {/* Старт */}
          {(() => {
            const [x, y] = toSvg(start[0], start[1]);
            return (
              <g>
                <circle cx={x} cy={y} r="5" fill="none" stroke={T.violet} strokeWidth="2" />
                <text x={x + 8} y={y - 6} fontSize="9" fontWeight="700" fill={T.violet}>старт</text>
              </g>
            );
          })()}

          {/* Расходимость */}
          {diverged && (
            <g>
              <rect x={W_SVG / 2 - 100} y={H_SVG - 60} width={200} height={40} rx={9}
                fill={T.redLight} stroke={T.red} strokeWidth="1.5" />
              <text x={W_SVG / 2} y={H_SVG - 36} textAnchor="middle" fontSize="12" fontWeight="800" fill={T.red}>
                Расходимость! η &gt; 2/λ_max
              </text>
            </g>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
          <SectionLabel color={T.primary}>Управление</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            <Slider label="c — вытянутость чаши" value={c} onChange={setC} min={1} max={100} step={1} color={T.violet} />
            <Slider label="η — learning rate" value={eta} onChange={setEta} min={0.001} max={1} step={0.001} color={T.amber} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          <Button onClick={step} color={T.primary} disabled={diverged}><StepForward size={13} /> Шаг</Button>
          <Button onClick={() => setRunning(r => !r)} color={T.green} active={running} disabled={diverged}>
            {running ? <Pause size={13} /> : <Play size={13} />} {running ? 'Пауза' : 'Авто'}
          </Button>
          <Button onClick={reset} color={T.muted}><RotateCcw size={13} /> Сброс</Button>
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
          <SectionLabel>Состояние</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <StatBadge label="итерация" value={iter} color={T.primary} />
            <StatBadge label="(w₁, w₂)" value={`(${curW1.toFixed(3)}, ${curW2.toFixed(3)})`} color={T.violet} />
            <StatBadge label="f(w)" value={fCur.toFixed(4)} color={T.green} />
            <StatBadge label="‖∇f‖" value={gradNorm.toFixed(4)} color={T.amber} />
          </div>
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
          <SectionLabel color={T.cyan}>Спектр</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <StatBadge label="λ_max" value={lamMax.toFixed(1)} color={T.red} />
            <StatBadge label="λ_min" value={Math.min(2, 2 * c).toFixed(1)} color={T.green} />
            <StatBadge label="κ = λ_max/λ_min" value={kappa.toFixed(1)} color={T.violet} />
            <StatBadge label="η_max = 2/λ_max" value={etaMax.toFixed(4)} color={T.amber} />
          </div>
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
        <SectionLabel color={T.violet}>Что попробовать</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
          <Collapsible title="c = 1, η = 0.5. Запустите авто. Что увидите?" color={T.green}>
            Гессиан H = 2I — изотропная чаша. Оптимальный η = 1/2 даёт мгновенную сходимость
            из ЛЮБОЙ стартовой точки. Это особый случай — в реальности так почти не бывает.
          </Collapsible>
          <Collapsible title="c = 10, η = 0.05. Какова траектория?" color={T.amber}>
            Заметный изгиб: сначала резко падает w₂ (большой градиент), затем плавно w₁.
            Это уже не прямая линия — кривизна по w₂ в 10 раз больше.
          </Collapsible>
          <Collapsible title="c = 100, η = 0.01. Зигзаги! Почему?" color={T.red}>
            λ_max = 200. Граница устойчивости η = 2/200 = 0.01 — мы на самой грани.
            Поперёк оврага градиент огромен → шаг сильно колеблет w₂. Вдоль оврага градиент мал → продвижение крошечное.
          </Collapsible>
          <Collapsible title="c = 100, η = 0.05. Куда уходит точка?" color={T.red}>
            η = 0.05 &gt; η_max = 0.01 → расходимость по w₂. Каждый шаг увеличивает |w₂| в |1 − 0.05·200| = 9 раз.
            За несколько итераций точка улетает за границы.
          </Collapsible>
          <Collapsible title="Найдите максимальный η, при котором c = 100 ещё сходится" color={T.cyan}>
            Формула: η &lt; 2/λ_max = 2/200 = 0.01. На практике берут η чуть меньше (например, 0.009),
            чтобы было хоть какое-то затухание колебаний.
          </Collapsible>
        </div>
        <Callout color={T.violet} title="Открытие">
          В многомерном случае скорость GD определяется не просто η, а ВЗАИМОДЕЙСТВИЕМ η и кривизны
          по разным направлениям. Если κ велико, приходится выбирать η по самому «требовательному» направлению —
          и тогда по пологому движение становится мучительно медленным. Это главная проблема обычного GD,
          которую решают <strong>momentum</strong> и <strong>адаптивные методы</strong> (часть 2).
        </Callout>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ЛАБ 4: «Условия остановки»
// ═════════════════════════════════════════════════════════════════════════════
function StoppingCriteriaLab() {
  const [fnKind, setFnKind] = useState<'sharp' | 'flat' | 'quartic'>('sharp');
  const [eps1, setEps1] = useState(0.01);  // ‖∇f‖
  const [eps2, setEps2] = useState(0.001); // |Δf|
  const [maxT, setMaxT] = useState(50);

  // f, f' и эталонные параметры
  function f(w: number) {
    if (fnKind === 'sharp') return (w - 3) * (w - 3);
    if (fnKind === 'flat')  return 0.01 * (w - 3) * (w - 3);
    return Math.pow(w - 3, 4);
  }
  function df(w: number) {
    if (fnKind === 'sharp') return 2 * (w - 3);
    if (fnKind === 'flat')  return 0.02 * (w - 3);
    return 4 * Math.pow(w - 3, 3);
  }
  const w0 = -2;
  // Подбираем η под функцию, чтобы было устойчиво
  const eta = fnKind === 'sharp' ? 0.1 : fnKind === 'flat' ? 5 : 0.05;
  // Для quartic — фиксированный η невелик: f'(w) = 4(w−3)³, при w=−2 это ~−500 → нужно очень малый η
  // Возьмём вторую попытку: η = 0.001 для quartic
  const etaSafe = fnKind === 'quartic' ? 0.001 : eta;

  // Симуляция (большое число итераций для всех критериев)
  const N = 600;
  const trajData = useMemo(() => {
    const traj: number[] = [w0];
    let w = w0;
    for (let i = 0; i < N; i++) {
      const g = df(w);
      const next = w - etaSafe * g;
      if (!isFinite(next) || Math.abs(next) > 50) break;
      traj.push(next);
      w = next;
    }
    return traj;
  }, [fnKind]);

  // Точки остановки для каждого критерия
  function stopByGradNorm(): number {
    for (let i = 1; i < trajData.length; i++) {
      if (Math.abs(df(trajData[i])) < eps1) return i;
    }
    return trajData.length - 1;
  }
  function stopByFnChange(): number {
    for (let i = 1; i < trajData.length; i++) {
      if (Math.abs(f(trajData[i]) - f(trajData[i - 1])) < eps2) return i;
    }
    return trajData.length - 1;
  }
  const stopT = Math.min(trajData.length - 1, maxT);
  const stopG = stopByGradNorm();
  const stopF = stopByFnChange();

  // SVG
  const W_SVG = 560, H_SVG = 320;
  const wMin = -3, wMax = 8;
  const fMaxView = fnKind === 'flat' ? 1.5 : fnKind === 'quartic' ? 60 : 30;
  const ox = 40, oy = H_SVG - 40;
  const xOf = (wv: number) => ox + ((wv - wMin) / (wMax - wMin)) * (W_SVG - 60);
  const yOf = (fv: number) => oy - (Math.min(fMaxView, fv) / fMaxView) * (H_SVG - 60);

  const fnPts: string[] = [];
  for (let wv = wMin; wv <= wMax; wv += 0.05) {
    const fv = f(wv);
    if (fv > fMaxView + 5) continue;
    fnPts.push(`${xOf(wv)},${yOf(fv)}`);
  }

  const fnTitles = {
    sharp: 'f(w) = (w − 3)²',
    flat: 'f(w) = 0.01·(w − 3)²',
    quartic: 'f(w) = (w − 3)⁴',
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' as const }}>
        <Button color={T.primary} active={fnKind === 'sharp'} onClick={() => setFnKind('sharp')}>
          Острая парабола
        </Button>
        <Button color={T.amber} active={fnKind === 'flat'} onClick={() => setFnKind('flat')}>
          Пологая парабола (×0.01)
        </Button>
        <Button color={T.violet} active={fnKind === 'quartic'} onClick={() => setFnKind('quartic')}>
          Плато (w − 3)⁴
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18 }}>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: 12 }}>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{fnTitles[fnKind]} · η = {etaSafe} · старт w₀ = −2</div>
          <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} style={{ width: '100%', display: 'block' }}>
            {/* Оси */}
            <line x1={ox} y1={oy} x2={W_SVG - 14} y2={oy} stroke={T.mutedLight} strokeWidth="1.2" />
            <line x1={ox} y1={20} x2={ox} y2={oy + 4} stroke={T.mutedLight} strokeWidth="1.2" />
            {[-2, 0, 3, 5, 7].map(wv => (
              <g key={wv}>
                <line x1={xOf(wv)} y1={oy} x2={xOf(wv)} y2={oy + 4} stroke={T.mutedLight} strokeWidth="1" />
                <text x={xOf(wv)} y={oy + 16} textAnchor="middle" fontSize="9" fill={T.mutedLight}>{wv}</text>
              </g>
            ))}

            {/* Функция */}
            <polyline points={fnPts.join(' ')} fill="none" stroke={T.green} strokeWidth="2" />

            {/* Истинный минимум */}
            <circle cx={xOf(3)} cy={oy} r="5" fill={T.green} />
            <text x={xOf(3)} y={oy - 8} textAnchor="middle" fontSize="10" fontWeight="800" fill={T.green}>min</text>

            {/* Траектория — точки */}
            {trajData.slice(0, 60).map((wv, i) => {
              const fv = f(wv);
              return (
                <circle key={i} cx={xOf(wv)} cy={yOf(Math.min(fMaxView, fv))} r="2"
                  fill={T.muted} opacity="0.4" />
              );
            })}

            {/* Три вертикальные линии — точки остановки */}
            {[
              { id: 'g', t: stopG, color: T.primary, label: '‖∇f‖<ε₁' },
              { id: 'f', t: stopF, color: T.amber, label: '|Δf|<ε₂' },
              { id: 't', t: stopT, color: T.red, label: 't=T' },
            ].map((mark, i) => {
              const wv = trajData[Math.min(mark.t, trajData.length - 1)];
              const fv = f(wv);
              return (
                <g key={mark.id}>
                  <line x1={xOf(wv)} y1={20} x2={xOf(wv)} y2={oy}
                    stroke={mark.color} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.7" />
                  <circle cx={xOf(wv)} cy={yOf(Math.min(fMaxView, fv))} r="5"
                    fill={mark.color} stroke={T.white} strokeWidth="1.5" />
                  <text x={xOf(wv) + 6} y={32 + i * 14} fontSize="10" fontWeight="800" fill={mark.color}>
                    {mark.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel color={T.primary}>Критерий 1: ‖∇f‖ &lt; ε₁</SectionLabel>
            <Slider label="ε₁" value={eps1} onChange={setEps1} min={0.0001} max={1} step={0.0001} color={T.primary} />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <StatBadge label="останов на шаге" value={stopG} color={T.primary} />
              <div style={{ marginTop: 4 }}>
                <StatBadge label="|w − 3|" value={Math.abs(trajData[stopG] - 3).toFixed(4)} color={T.muted} />
              </div>
            </div>
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel color={T.amber}>Критерий 2: |Δf| &lt; ε₂</SectionLabel>
            <Slider label="ε₂" value={eps2} onChange={setEps2} min={0.000001} max={0.1} step={0.000001} color={T.amber} />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <StatBadge label="останов на шаге" value={stopF} color={T.amber} />
              <div style={{ marginTop: 4 }}>
                <StatBadge label="|w − 3|" value={Math.abs(trajData[stopF] - 3).toFixed(4)} color={T.muted} />
              </div>
            </div>
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <SectionLabel color={T.red}>Критерий 3: t = T</SectionLabel>
            <Slider label="T" value={maxT} onChange={setMaxT} min={1} max={300} step={1} color={T.red} />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <StatBadge label="останов на шаге" value={stopT} color={T.red} />
              <div style={{ marginTop: 4 }}>
                <StatBadge label="|w − 3|" value={Math.abs(trajData[stopT] - 3).toFixed(4)} color={T.muted} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionLabel color={T.violet}>Что попробовать</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
          <Collapsible title="Острая парабола: ε₁ = 0.01 vs ε₁ = 1" color={T.primary}>
            При ε₁ = 0.01 алгоритм останавливается очень близко к 3. При ε₁ = 1 — далеко
            (градиент при w = 2.5 уже равен 1, останавливаемся слишком рано). Порог надо подбирать под масштаб функции.
          </Collapsible>
          <Collapsible title="Пологая (×0.01) парабола: ε₁ = 0.01 — что происходит?" color={T.amber}>
            Градиент f′ = 0.02(w − 3) почти везде меньше 0.01. Алгоритм останавливается СРАЗУ
            или после первого шага, далеко от истинного минимума. Для этой функции нужен ε₁ ≈ 0.0001.
          </Collapsible>
          <Collapsible title="Плато (w − 3)⁴: какой критерий работает лучше?" color={T.violet}>
            На плато f′ → 0 очень быстро (как (w − 3)³), а Δf ≈ 0 ещё быстрее (как (w − 3)⁴).
            Критерий по |Δf| даёт <strong>ложную остановку</strong>: функция почти не меняется,
            хотя мы ещё далеко. Норма градиента — более надёжный сигнал.
          </Collapsible>
          <Collapsible title="Загадка: на плато алгоритм «застрял»?" color={T.cyan}>
            Нет. Плато — не стена: градиент мал, но не ноль. Шаги крошечные, но они есть.
            Посмотрите на w_t: оно медленно, но верно ползёт к 3. Критерий |Δf| ошибочно сигнализирует «всё, пришли».
          </Collapsible>
        </div>
        <Callout color={T.primary} title="Открытие">
          Нет универсального «правильного» критерия. <strong>Норма градиента</strong> — самый универсальный,
          но требует подбора порога под масштаб функции. <strong>Изменение функции</strong> интуитивно понятно,
          но обманывает на плато. <strong>Число итераций</strong> — грубый, но надёжный страховочный лимит.
          На практике используют комбинацию: <em>стоп, когда градиент мал ИЛИ достигнут лимит итераций</em>.
        </Callout>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Список лабораторий
// ═════════════════════════════════════════════════════════════════════════════
const GD1_LABS = [
  { id: 'gd1-parabola', title: 'Спуск по параболе', icon: TrendingDown,
    component: ParabolaDescentLab },
  { id: 'gd1-three-lr', title: 'Три learning rate', icon: Gauge,
    component: ThreeLearningRatesLab },
  { id: 'gd1-bowl-2d',  title: 'Спуск в чаше — 2D', icon: Mountain,
    component: BowlDescent2DLab },
  { id: 'gd1-stopping', title: 'Условия остановки', icon: HelpCircle,
    component: StoppingCriteriaLab },
];

// ═════════════════════════════════════════════════════════════════════════════
// Main export
// ═════════════════════════════════════════════════════════════════════════════
export default function GradientDescentPart1LabView() {
  const [activeLab, setActiveLab] = useState<string>(GD1_LABS[0].id);
  const lab = GD1_LABS.find(item => item.id === activeLab) ?? GD1_LABS[0];
  const LabComponent = lab.component;

  return (
    <LabShell
      title="Лаборатории: Градиентный спуск — часть 1"
      intro="Четыре интерактивных стенда: одномерный спуск, поиск золотого learning rate, двумерный овраг и сравнение критериев остановки. Двигай ползунки, кликай по карте, запускай авто-итерации."
      labs={GD1_LABS}
      activeId={activeLab}
      onSelect={setActiveLab}
    >
      <div style={{ background: T.surface, borderRadius: 14, padding: 16 }}>
        <LabComponent />
      </div>
    </LabShell>
  );
}
