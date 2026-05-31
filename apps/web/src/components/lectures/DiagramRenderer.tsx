import type { Diagram, AccentKey } from "./types";
import { ACCENT_TO_HEX, T } from "./types";

// Canvas size (viewBox units). 16:10 reads comfortably on most layouts.
const W = 640;
const H = 400;

function color(c: AccentKey | undefined): string {
  return c ? ACCENT_TO_HEX[c] : T.primary;
}

// Linear map from data range [a,b] → pixel range [pxA,pxB].
function lerp(v: number, a: number, b: number, pxA: number, pxB: number): number {
  if (b === a) return (pxA + pxB) / 2;
  return pxA + ((v - a) / (b - a)) * (pxB - pxA);
}

// ─── 1. function_plot ────────────────────────────────────────────────────────

function FunctionPlot(d: Extract<Diagram, { type: "function_plot" }>) {
  const padL = 50, padR = 24, padT = 24, padB = 40;
  const x = (v: number) => lerp(v, d.xRange[0], d.xRange[1], padL, W - padR);
  const y = (v: number) => lerp(v, d.yRange[0], d.yRange[1], H - padB, padT);

  const x0 = x(0), y0 = y(0);
  const inX = x0 >= padL && x0 <= W - padR;
  const inY = y0 >= padT && y0 <= H - padB;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 720 }}>
      {/* frame */}
      <rect x={padL} y={padT} width={W - padL - padR} height={H - padT - padB}
            fill="#fff" stroke={T.border} />
      {/* axes through origin if visible */}
      {inY && <line x1={padL} y1={y0} x2={W - padR} y2={y0} stroke={T.mutedLight} strokeWidth={1} />}
      {inX && <line x1={x0} y1={padT} x2={x0} y2={H - padB} stroke={T.mutedLight} strokeWidth={1} />}
      {/* range labels */}
      <text x={padL} y={H - padB + 18} fontSize={11} fill={T.muted}>{d.xRange[0]}</text>
      <text x={W - padR} y={H - padB + 18} fontSize={11} fill={T.muted} textAnchor="end">{d.xRange[1]}</text>
      <text x={padL - 6} y={padT + 4} fontSize={11} fill={T.muted} textAnchor="end">{d.yRange[1]}</text>
      <text x={padL - 6} y={H - padB} fontSize={11} fill={T.muted} textAnchor="end">{d.yRange[0]}</text>
      {/* axis labels */}
      {d.xLabel && <text x={(padL + W - padR) / 2} y={H - 8} fontSize={12} fill={T.text} textAnchor="middle">{d.xLabel}</text>}
      {d.yLabel && <text x={14} y={(padT + H - padB) / 2} fontSize={12} fill={T.text} textAnchor="middle" transform={`rotate(-90 14 ${(padT + H - padB) / 2})`}>{d.yLabel}</text>}
      {/* series */}
      {d.series.map((s, i) => {
        const pts = s.points.map(([px, py]) => `${x(px).toFixed(1)},${y(py).toFixed(1)}`).join(" ");
        const stroke = color(s.color);
        return (
          <g key={i}>
            <polyline points={pts} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {s.label && (
              <text x={W - padR - 8} y={padT + 14 + i * 16} fontSize={12} fill={stroke} textAnchor="end" fontWeight={700}>
                {s.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── 2. coordinate_axes ──────────────────────────────────────────────────────

function CoordinateAxes(d: Extract<Diagram, { type: "coordinate_axes" }>) {
  const padL = 40, padR = 40, padT = 30, padB = 30;
  const x = (v: number) => lerp(v, d.xRange[0], d.xRange[1], padL, W - padR);
  const y = (v: number) => lerp(v, d.yRange[0], d.yRange[1], H - padB, padT);
  const x0 = x(0), y0 = y(0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 720 }}>
      <defs>
        {(["primary", "green", "amber", "red", "cyan", "violet", "pink"] as AccentKey[]).map((c) => (
          <marker key={c} id={`arrow-${c}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={ACCENT_TO_HEX[c]} />
          </marker>
        ))}
      </defs>
      {/* grid */}
      <line x1={padL} y1={y0} x2={W - padR} y2={y0} stroke={T.mutedLight} />
      <line x1={x0} y1={padT} x2={x0} y2={H - padB} stroke={T.mutedLight} />
      {/* ticks at integer values */}
      {Array.from({ length: d.xRange[1] - d.xRange[0] + 1 }, (_, i) => d.xRange[0] + i).map((v) => (
        <line key={`xt${v}`} x1={x(v)} y1={y0 - 4} x2={x(v)} y2={y0 + 4} stroke={T.mutedLight} />
      ))}
      {Array.from({ length: d.yRange[1] - d.yRange[0] + 1 }, (_, i) => d.yRange[0] + i).map((v) => (
        <line key={`yt${v}`} x1={x0 - 4} y1={y(v)} x2={x0 + 4} y2={y(v)} stroke={T.mutedLight} />
      ))}
      <text x={W - padR + 6} y={y0 + 4} fontSize={11} fill={T.muted}>x</text>
      <text x={x0 - 4} y={padT - 6} fontSize={11} fill={T.muted} textAnchor="end">y</text>
      {/* vectors */}
      {d.vectors.map((v, i) => {
        const stroke = color(v.color);
        const c = v.color ?? "primary";
        return (
          <g key={i}>
            <line x1={x(v.from[0])} y1={y(v.from[1])} x2={x(v.to[0])} y2={y(v.to[1])}
                  stroke={stroke} strokeWidth={2.5} markerEnd={`url(#arrow-${c})`} />
            {v.label && (
              <text x={x(v.to[0]) + 6} y={y(v.to[1]) - 6} fontSize={13} fill={stroke} fontWeight={700}>
                {v.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── 3. bar_chart ────────────────────────────────────────────────────────────

function BarChart(d: Extract<Diagram, { type: "bar_chart" }>) {
  const padL = 50, padR = 24, padT = 24, padB = 50;
  const n = d.bars.length || 1;
  const max = d.max ?? Math.max(1, ...d.bars.map((b) => b.value));
  const gap = 12;
  const totalW = W - padL - padR;
  const barW = Math.max(8, (totalW - gap * (n - 1)) / n);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 720 }}>
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke={T.muted} />
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke={T.muted} />
      <text x={padL - 8} y={padT + 4} fontSize={11} fill={T.muted} textAnchor="end">{max}</text>
      <text x={padL - 8} y={H - padB} fontSize={11} fill={T.muted} textAnchor="end">0</text>
      {d.bars.map((b, i) => {
        const h = (b.value / max) * (H - padT - padB);
        const x = padL + i * (barW + gap);
        const yTop = H - padB - h;
        const fill = color(b.color);
        return (
          <g key={i}>
            <rect x={x} y={yTop} width={barW} height={h} fill={fill} opacity={0.85} rx={4} />
            <text x={x + barW / 2} y={H - padB + 18} fontSize={11} fill={T.text} textAnchor="middle">{b.label}</text>
            <text x={x + barW / 2} y={yTop - 6} fontSize={11} fill={fill} fontWeight={700} textAnchor="middle">{b.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── 4. matrix_grid ──────────────────────────────────────────────────────────

function MatrixGrid(d: Extract<Diagram, { type: "matrix_grid" }>) {
  const cell = 56;
  const gap = 6;
  const widthPx = d.cols * cell + (d.cols - 1) * gap;
  const heightPx = d.rows * cell + (d.rows - 1) * gap;
  const padL = 40;
  const padT = 30;

  const totalW = widthPx + padL * 2;
  const totalH = heightPx + padT * 2;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ width: "100%", maxWidth: Math.max(360, totalW) }}>
      {d.brackets !== false && (
        <>
          <path d={`M ${padL - 14} ${padT - 6} L ${padL - 22} ${padT - 6} L ${padL - 22} ${padT + heightPx + 6} L ${padL - 14} ${padT + heightPx + 6}`}
                stroke={T.text} strokeWidth={2} fill="none" />
          <path d={`M ${padL + widthPx + 14} ${padT - 6} L ${padL + widthPx + 22} ${padT - 6} L ${padL + widthPx + 22} ${padT + heightPx + 6} L ${padL + widthPx + 14} ${padT + heightPx + 6}`}
                stroke={T.text} strokeWidth={2} fill="none" />
        </>
      )}
      {d.cells.map((row, ri) =>
        row.map((c, ci) => {
          const x = padL + ci * (cell + gap);
          const y = padT + ri * (cell + gap);
          const fill = c.highlight ? `${ACCENT_TO_HEX[c.highlight]}22` : T.surface;
          const stroke = c.highlight ? ACCENT_TO_HEX[c.highlight] : T.border;
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={x} y={y} width={cell} height={cell} fill={fill} stroke={stroke} rx={6} />
              <text x={x + cell / 2} y={y + cell / 2 + 5} fontSize={15} fontWeight={700} fill={T.text} textAnchor="middle" fontFamily="monospace">
                {c.value}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}

// ─── 5. concept_diagram ──────────────────────────────────────────────────────

function ConceptDiagram(d: Extract<Diagram, { type: "concept_diagram" }>) {
  const nodeR = 36;
  // Normalize node coords if they look like 0..100 percentages
  const xs = d.nodes.map((n) => n.x);
  const ys = d.nodes.map((n) => n.y);
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 100);
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 100);
  const padX = 60, padY = 50;
  const X = (v: number) => lerp(v, minX, maxX, padX, W - padX);
  const Y = (v: number) => lerp(v, minY, maxY, padY, H - padY);

  const byId = new Map(d.nodes.map((n) => [n.id, n]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 720 }}>
      <defs>
        <marker id="cd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={T.muted} />
        </marker>
      </defs>
      {d.edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const x1 = X(a.x), y1 = Y(a.y), x2 = X(b.x), y2 = Y(b.y);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.muted} strokeWidth={1.5} markerEnd="url(#cd-arrow)" />
            {e.label && (
              <text x={mx} y={my - 4} fontSize={11} fill={T.muted} textAnchor="middle">{e.label}</text>
            )}
          </g>
        );
      })}
      {d.nodes.map((n) => {
        const fill = color(n.color);
        return (
          <g key={n.id}>
            <circle cx={X(n.x)} cy={Y(n.y)} r={nodeR} fill={`${fill}1a`} stroke={fill} strokeWidth={2} />
            <text x={X(n.x)} y={Y(n.y) + 4} fontSize={12} fontWeight={700} fill={T.text} textAnchor="middle">
              {n.label.length > 14 ? `${n.label.slice(0, 13)}…` : n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── 6. number_line ──────────────────────────────────────────────────────────

function NumberLine(d: Extract<Diagram, { type: "number_line" }>) {
  const padL = 50, padR = 50, padT = 100, padB = 100;
  const x = (v: number) => lerp(v, d.range[0], d.range[1], padL, W - padR);
  const baselineY = H / 2;
  const span = d.range[1] - d.range[0];
  const tickStep = span > 20 ? 5 : span > 8 ? 1 : 0.5;
  const ticks: number[] = [];
  for (let v = Math.ceil(d.range[0] / tickStep) * tickStep; v <= d.range[1]; v += tickStep) {
    ticks.push(Math.round(v * 100) / 100);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 720 }}>
      {/* main axis */}
      <line x1={padL - 12} y1={baselineY} x2={W - padR + 12} y2={baselineY}
            stroke={T.text} strokeWidth={2} />
      {/* arrow at right */}
      <path d={`M ${W - padR + 12} ${baselineY} L ${W - padR + 4} ${baselineY - 5} L ${W - padR + 4} ${baselineY + 5} Z`} fill={T.text} />
      {/* ticks + labels */}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={x(v)} y1={baselineY - 6} x2={x(v)} y2={baselineY + 6} stroke={T.muted} />
          <text x={x(v)} y={baselineY + 24} fontSize={11} fill={T.muted} textAnchor="middle">{v}</text>
        </g>
      ))}
      {/* segments */}
      {(d.segments ?? []).map((s, i) => {
        const c = color(s.color);
        return (
          <g key={`seg${i}`}>
            <line x1={x(s.from)} y1={baselineY - 16 - i * 6} x2={x(s.to)} y2={baselineY - 16 - i * 6}
                  stroke={c} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
            {s.label && (
              <text x={(x(s.from) + x(s.to)) / 2} y={baselineY - 26 - i * 6} fontSize={12}
                    fill={c} fontWeight={700} textAnchor="middle">{s.label}</text>
            )}
          </g>
        );
      })}
      {/* marks */}
      {d.marks.map((m, i) => {
        const c = color(m.color);
        const emp = m.emphasis ?? "dot";
        return (
          <g key={`mk${i}`}>
            {emp === "tick" && (
              <line x1={x(m.at)} y1={baselineY - 14} x2={x(m.at)} y2={baselineY + 14} stroke={c} strokeWidth={3} />
            )}
            {emp === "dot" && (
              <circle cx={x(m.at)} cy={baselineY} r={6.5} fill={c} stroke="#fff" strokeWidth={2} />
            )}
            {emp === "open" && (
              <circle cx={x(m.at)} cy={baselineY} r={6.5} fill="#fff" stroke={c} strokeWidth={2.5} />
            )}
            {m.label && (
              <text x={x(m.at)} y={baselineY - 18} fontSize={12} fill={c} fontWeight={700} textAnchor="middle">{m.label}</text>
            )}
          </g>
        );
      })}
      {/* discreet pad helpers */}
      {padT}{padB}
    </svg>
  );
}

// ─── 7. distribution_curve ───────────────────────────────────────────────────

function DistributionCurve(d: Extract<Diagram, { type: "distribution_curve" }>) {
  const padL = 50, padR = 24, padT = 26, padB = 44;

  // default ranges per distribution
  const defaultRange = (): [number, number] => {
    if (d.distribution === "normal") {
      const m = d.params.mean ?? 0, s = Math.max(0.1, d.params.std ?? 1);
      return [m - 4 * s, m + 4 * s];
    }
    if (d.distribution === "uniform") {
      const a = d.params.a ?? 0, b = d.params.b ?? 1;
      const pad = (b - a) * 0.3;
      return [a - pad, b + pad];
    }
    // exponential
    return [0, 8 / Math.max(0.1, d.params.lambda ?? 1)];
  };
  const [xMin, xMax] = d.xRange ?? defaultRange();

  // PDF
  const pdf = (xv: number): number => {
    if (d.distribution === "normal") {
      const m = d.params.mean ?? 0, s = Math.max(0.1, d.params.std ?? 1);
      return (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-((xv - m) ** 2) / (2 * s * s));
    }
    if (d.distribution === "uniform") {
      const a = d.params.a ?? 0, b = d.params.b ?? 1;
      return xv >= a && xv <= b ? 1 / (b - a) : 0;
    }
    const lam = Math.max(0.01, d.params.lambda ?? 1);
    return xv >= 0 ? lam * Math.exp(-lam * xv) : 0;
  };

  // sample
  const N = 200;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= N; i++) {
    const xv = xMin + (i / N) * (xMax - xMin);
    xs.push(xv);
    ys.push(pdf(xv));
  }
  const yMax = Math.max(...ys, 0.01) * 1.15;

  const px = (v: number) => lerp(v, xMin, xMax, padL, W - padR);
  const py = (v: number) => lerp(v, 0, yMax, H - padB, padT);

  const pathPoints = xs.map((xv, i) => `${px(xv).toFixed(1)},${py(ys[i]).toFixed(1)}`).join(" ");

  const shadeColor = d.shade ? color(d.shade.color) : null;
  const shadePoly = d.shade ? (() => {
    const pts: string[] = [`${px(d.shade!.from).toFixed(1)},${py(0).toFixed(1)}`];
    for (let i = 0; i <= N; i++) {
      const xv = xs[i];
      if (xv >= d.shade!.from && xv <= d.shade!.to) {
        pts.push(`${px(xv).toFixed(1)},${py(ys[i]).toFixed(1)}`);
      }
    }
    pts.push(`${px(d.shade!.to).toFixed(1)},${py(0).toFixed(1)}`);
    return pts.join(" ");
  })() : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 720 }}>
      <rect x={padL} y={padT} width={W - padL - padR} height={H - padT - padB} fill="#fff" stroke={T.border} />
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke={T.muted} />
      {/* shaded area */}
      {shadePoly && shadeColor && (
        <polygon points={shadePoly} fill={shadeColor} opacity={0.25} stroke={shadeColor} strokeWidth={1} />
      )}
      {/* curve */}
      <polyline points={pathPoints} fill="none" stroke={T.primary} strokeWidth={2.5}
                strokeLinejoin="round" strokeLinecap="round" />
      {/* range labels */}
      <text x={padL} y={H - padB + 18} fontSize={11} fill={T.muted}>{xMin.toFixed(1)}</text>
      <text x={W - padR} y={H - padB + 18} fontSize={11} fill={T.muted} textAnchor="end">{xMax.toFixed(1)}</text>
      {/* shade label */}
      {d.shade && d.shade.label && shadeColor && (
        <text x={px((d.shade.from + d.shade.to) / 2)} y={padT + 16} fontSize={12} fontWeight={700}
              fill={shadeColor} textAnchor="middle">{d.shade.label}</text>
      )}
      {/* distribution name */}
      <text x={W - padR - 10} y={padT + 14} fontSize={11} fill={T.muted} textAnchor="end">
        {d.distribution}
      </text>
    </svg>
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────

export function DiagramRenderer({ diagram }: { diagram: Diagram }) {
  switch (diagram.type) {
    case "function_plot":      return <FunctionPlot {...diagram} />;
    case "coordinate_axes":    return <CoordinateAxes {...diagram} />;
    case "bar_chart":          return <BarChart {...diagram} />;
    case "matrix_grid":        return <MatrixGrid {...diagram} />;
    case "concept_diagram":    return <ConceptDiagram {...diagram} />;
    case "number_line":        return <NumberLine {...diagram} />;
    case "distribution_curve": return <DistributionCurve {...diagram} />;
    default: return null;
  }
}
