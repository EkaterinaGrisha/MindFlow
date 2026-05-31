// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, RotateCcw, Play, Pause } from 'lucide-react';
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

function StatBadge({ label, value, color = T.primary, mono = true }: { label: string; value: string | number; color?: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 9, background: `${color}0c`, border: `1px solid ${color}30` }}>
      <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
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

// ─── Contour / heatmap helpers ────────────────────────────────────────────────
function renderHeatmap(ctx: CanvasRenderingContext2D, W: number, H: number,
  f: (x: number, y: number) => number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  colorLow: string, colorHigh: string) {
  const GRID = 100;
  const vals: number[] = [];
  for (let i = 0; i <= GRID; i++) {
    for (let j = 0; j <= GRID; j++) {
      const x = xMin + (j / GRID) * (xMax - xMin);
      const y = yMin + (i / GRID) * (yMax - yMin);
      try { const v = f(x, y); vals.push(isFinite(v) ? Math.min(v, 1e6) : 1e6); } catch { vals.push(1e6); }
    }
  }
  const finite = vals.filter(v => v < 1e5);
  if (!finite.length) return;
  const mn = Math.min(...finite), mx = Math.max(...finite);
  const range = mx - mn || 1;
  const hr = (hex: string) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  const [r0,g0,b0] = hr(colorLow);
  const [r1,g1,b1] = hr(colorHigh);
  const cw = W / GRID, ch = H / GRID;
  for (let idx = 0; idx < vals.length; idx++) {
    const t = Math.pow(Math.min((vals[idx] - mn) / range, 1), 0.4);
    ctx.fillStyle = `rgb(${Math.round(r0+(r1-r0)*t)},${Math.round(g0+(g1-g0)*t)},${Math.round(b0+(b1-b0)*t)})`;
    const j = idx % (GRID+1), i = Math.floor(idx / (GRID+1));
    ctx.fillRect(j*cw, H-(i+1)*ch, cw+0.5, ch+0.5);
  }
}

function renderContours(ctx: CanvasRenderingContext2D, W: number, H: number,
  f: (x: number, y: number) => number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  levels: number[], color: string, alpha = 0.45) {
  const GRID = 80;
  const toX = (x: number) => ((x-xMin)/(xMax-xMin))*W;
  const toY = (y: number) => H-((y-yMin)/(yMax-yMin))*H;
  const grid: number[][] = Array.from({length:GRID+1},(_,i)=>Array.from({length:GRID+1},(_,j)=>{
    try { const v = f(xMin+(j/GRID)*(xMax-xMin), yMin+(i/GRID)*(yMax-yMin)); return isFinite(v)?Math.min(v,1e6):1e6; } catch { return 1e6; }
  }));
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = 1;
  for (const lv of levels) {
    ctx.beginPath();
    for (let i=0;i<GRID;i++) for (let j=0;j<GRID;j++) {
      const x0=xMin+(j/GRID)*(xMax-xMin), x1=xMin+((j+1)/GRID)*(xMax-xMin);
      const y0=yMin+(i/GRID)*(yMax-yMin), y1=yMin+((i+1)/GRID)*(yMax-yMin);
      const v00=grid[i][j],v01=grid[i][j+1],v10=grid[i+1][j],v11=grid[i+1][j+1];
      const lr=(a:number,b:number,va:number,vb:number)=>Math.abs(vb-va)<1e-9?(a+b)/2:a+(b-a)*(lv-va)/(vb-va);
      const pts:[number,number][]=[];
      if((v00<lv)!==(v01<lv)) pts.push([lr(x0,x1,v00,v01),y0]);
      if((v10<lv)!==(v11<lv)) pts.push([lr(x0,x1,v10,v11),y1]);
      if((v00<lv)!==(v10<lv)) pts.push([x0,lr(y0,y1,v00,v10)]);
      if((v01<lv)!==(v11<lv)) pts.push([x1,lr(y0,y1,v01,v11)]);
      if(pts.length===2){ ctx.moveTo(toX(pts[0][0]),toY(pts[0][1])); ctx.lineTo(toX(pts[1][0]),toY(pts[1][1])); }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrajectory(ctx: CanvasRenderingContext2D, pts: {x:number,y:number}[],
  color: string, W: number, H: number, xMin: number, xMax: number, yMin: number, yMax: number,
  lineW = 2, alpha = 1) {
  if (pts.length < 2) return;
  const toX = (x:number) => ((x-xMin)/(xMax-xMin))*W;
  const toY = (y:number) => H-((y-yMin)/(yMax-yMin))*H;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lineW; ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.moveTo(toX(pts[0].x), toY(pts[0].y));
  pts.forEach(p => ctx.lineTo(toX(p.x), toY(p.y)));
  ctx.stroke();
  // Endpoint dot
  const last = pts[pts.length-1];
  ctx.beginPath(); ctx.arc(toX(last.x), toY(last.y), 5, 0, Math.PI*2);
  ctx.fillStyle = color; ctx.globalAlpha = 1; ctx.fill();
  ctx.strokeStyle = T.white; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

function drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number,
  W: number, H: number, xMin: number, xMax: number, yMin: number, yMax: number,
  color: string, r = 7) {
  const px = ((x-xMin)/(xMax-xMin))*W;
  const py = H-((y-yMin)/(yMax-yMin))*H;
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = T.white; ctx.lineWidth = 2; ctx.stroke();
}

// ─── Surface functions ────────────────────────────────────────────────────────
const bowl    = (x:number,y:number) => x*x + y*y;
const ravine  = (c:number) => (x:number,y:number) => x*x + c*y*y;
const rosenbrock = (x:number,y:number) => (1-x)**2 + 100*(y-x*x)**2;
const twoMins = (x:number,y:number) => x**4 - 2*x*x + x + y*y;
const saddle  = (x:number,y:number) => x*x - y*y + 0.1*(x**4+y**4);
const ring    = (x:number,y:number) => (x*x+y*y-1)**2 + 0.3*y;

const gradBowl    = (x:number,y:number) => ({ gx:2*x, gy:2*y });
const gradRavine  = (c:number) => (x:number,y:number) => ({ gx:2*x, gy:2*c*y });
const gradRosenbrock = (x:number,y:number) => ({ gx:-2*(1-x)-400*x*(y-x*x), gy:200*(y-x*x) });
const gradTwoMins = (x:number,y:number) => ({ gx:4*x**3-4*x+1, gy:2*y });
const gradSaddle  = (x:number,y:number) => ({ gx:2*x+0.4*x**3, gy:-2*y+0.4*y**3 });
const gradRing    = (x:number,y:number) => ({ gx:4*x*(x*x+y*y-1), gy:4*y*(x*x+y*y-1)+0.3 });

// ─── Lab meta ─────────────────────────────────────────────────────────────────
const GD2_LABS = [
  { id:'gd2-sgd-variants',   title:'Лаборатория 1: SGD vs Batch vs Mini-batch',      shortTitle:'SGD / Batch / Mini-batch' },
  { id:'gd2-momentum',       title:'Лаборатория 2: Momentum — велосипед в овраге',    shortTitle:'Momentum' },
  { id:'gd2-adam',           title:'Лаборатория 3: Adam — адаптивный шаг',            shortTitle:'Adam' },
  { id:'gd2-linreg',         title:'Лаборатория 4: Линейная регрессия изнутри',        shortTitle:'Линейная регрессия' },
  { id:'gd2-race',           title:'Лаборатория 5: Гонка оптимизаторов',              shortTitle:'Гонка оптимизаторов' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 1 — SGD vs Batch vs Mini-batch  (side-by-side noise visualization)
// ═══════════════════════════════════════════════════════════════════════════════
function SGDVariantsLab() {
  type SurfKey = 'bowl' | 'ravine' | 'twoMins';
  const [surfKey, setSurfKey] = useState<SurfKey>('bowl');
  const [lr, setLr]     = useState(0.08);
  const [noise, setNoise] = useState(0.4);
  const [batchSz, setBatchSz] = useState(8);
  const [running, setRunning] = useState(false);
  const [trBatch, setTrBatch] = useState<{x:number,y:number}[]>([{x:1.8,y:1.6}]);
  const [trSGD,   setTrSGD]   = useState<{x:number,y:number}[]>([{x:1.8,y:1.6}]);
  const [trMini,  setTrMini]  = useState<{x:number,y:number}[]>([{x:1.8,y:1.6}]);
  const [steps, setSteps] = useState(0);
  const rafRef = useRef<number|null>(null);
  const canvRefs = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];

  const surfs: Record<SurfKey, {f:(x:number,y:number)=>number; grad:(x:number,y:number)=>{gx:number,gy:number}; label:string; xMin:number; xMax:number; yMin:number; yMax:number; color:string; levels:number[]}> = {
    bowl:    { f: bowl,    grad: gradBowl,    label:'Чаша x²+y²',       xMin:-2.2,xMax:2.2,yMin:-2.2,yMax:2.2, color:T.primary, levels:[0.2,0.5,1,2,4,7] },
    ravine:  { f: ravine(20), grad: gradRavine(20), label:'Овраг x²+20y²', xMin:-2.2,xMax:2.2,yMin:-0.5,yMax:0.5, color:T.amber, levels:[0.5,1,2,4,8,16] },
    twoMins: { f: twoMins, grad: gradTwoMins, label:'Два минимума',      xMin:-2,xMax:2,yMin:-2,yMax:2, color:T.violet, levels:[0.5,1,2,3,5,8] },
  };
  const surf = surfs[surfKey];
  const W = 220, H = 220;

  const gaussNoise = (s:number) => { const u=Math.random(), v=Math.random(); return s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };

  const step = () => {
    const maxStep = 500;
    if (steps >= maxStep) { setRunning(false); return; }
    setTrBatch(tr => {
      const last = tr[tr.length-1];
      const {gx,gy} = surf.grad(last.x,last.y);
      if (Math.hypot(gx,gy)<1e-4) return tr;
      return [...tr, {x:last.x-lr*gx, y:last.y-lr*gy}];
    });
    setTrSGD(tr => {
      const last = tr[tr.length-1];
      const {gx,gy} = surf.grad(last.x,last.y);
      return [...tr, {x:last.x-lr*(gx+gaussNoise(noise)), y:last.y-lr*(gy+gaussNoise(noise))}];
    });
    setTrMini(tr => {
      const last = tr[tr.length-1];
      const {gx,gy} = surf.grad(last.x,last.y);
      const s = noise/Math.sqrt(batchSz);
      return [...tr, {x:last.x-lr*(gx+gaussNoise(s)), y:last.y-lr*(gy+gaussNoise(s))}];
    });
    setSteps(s => s+1);
  };

  useEffect(() => {
    if (!running) { if(rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    let last=0;
    const tick = (t:number) => {
      if (t-last>25) { step(); last=t; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, steps, lr, noise, batchSz, surfKey]);

  const reset = () => {
    setRunning(false);
    const p0 = surfKey==='ravine'?{x:1.8,y:0.4}:{x:1.8,y:1.6};
    setTrBatch([p0]); setTrSGD([p0]); setTrMini([p0]); setSteps(0);
  };

  useEffect(reset,[surfKey]);

  const TRAJ_COLS = [T.green, T.red, T.cyan];
  const trajs = [trBatch, trSGD, trMini];
  const labels = ['Batch GD','SGD','Mini-batch'];

  useEffect(() => {
    canvRefs.forEach((ref,i) => {
      const canvas = ref.current; if(!canvas) return;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0,0,W,H);
      renderHeatmap(ctx,W,H,surf.f,surf.xMin,surf.xMax,surf.yMin,surf.yMax,'#1e1b4b',surf.color);
      renderContours(ctx,W,H,surf.f,surf.xMin,surf.xMax,surf.yMin,surf.yMax,surf.levels,T.white,0.4);
      drawTrajectory(ctx,trajs[i],TRAJ_COLS[i],W,H,surf.xMin,surf.xMax,surf.yMin,surf.yMax,2);
      const p0=trajs[i][0]; drawPoint(ctx,p0.x,p0.y,W,H,surf.xMin,surf.xMax,surf.yMin,surf.yMax,T.white,4);
    });
  });

  const lastBatch = trBatch[trBatch.length-1];
  const fBatch = surf.f(lastBatch.x,lastBatch.y);

  return (
    <div style={{fontFamily:"'Inter',sans-serif"}}>
      <LabHeader badge="Лаборатория 1 · Градиентный спуск" title="SGD, Batch, Mini-batch — три характера"
        question="Чем отличается поведение трёх вариантов градиентного спуска? Когда шум SGD мешает, а когда — помогает?" />

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginBottom:18}}>
        <InfoCard color={T.green} title="Batch GD">Градиент точный — по всем данным. Траектория гладкая. Каждый шаг дорогой, но надёжный. Не масштабируется на большие датасеты.</InfoCard>
        <InfoCard color={T.red} title="SGD">К градиенту добавляется шум (один пример). Траектория «дрожит». Шум иногда помогает: выбивает из плохих локальных минимумов.</InfoCard>
        <InfoCard color={T.cyan} title="Mini-batch">Золотая середина. Шум уменьшается как 1/√B. Использует параллелизм GPU. B=32–256 — типичный выбор на практике.</InfoCard>
      </div>

      <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,marginBottom:14}}>
        {(['bowl','ravine','twoMins'] as SurfKey[]).map(k=>(
          <PresetButton key={k} active={surfKey===k} onClick={()=>setSurfKey(k)} label={surfs[k].label} color={surfs[k].color}/>
        ))}
      </div>

      {/* Three canvases side by side */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
        {canvRefs.map((ref,i)=>(
          <div key={i} style={{background:'#0f172a',borderRadius:14,overflow:'hidden'}}>
            <div style={{padding:'7px 12px',background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:TRAJ_COLS[i],flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.7)'}}>{labels[i]}</span>
              <span style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.4)'}}>шагов: {trajs[i].length-1}</span>
            </div>
            <canvas ref={ref} width={W} height={H} style={{display:'block',width:'100%',height:'auto'}}/>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
        <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px 16px'}}>
          <SectionLabel>Параметры</SectionLabel>
          {[
            ['η (learning rate)', lr, setLr, 0.005, 0.3, 0.005, T.primary],
            ['σ шума SGD', noise, setNoise, 0.05, 2, 0.05, T.red],
            ['B (размер батча)', batchSz, setBatchSz, 1, 64, 1, T.cyan],
          ].map(([lbl,val,setter,mn,mx,step,col]:[any,any,any,any,any,any,any])=>(
            <div key={lbl} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:2}}>
                <span>{lbl}</span><strong style={{color:col}}>{typeof val==='number'?val.toFixed(3):val}</strong>
              </div>
              <input type="range" min={mn} max={mx} step={step} value={val}
                onChange={e=>(setter as any)(Number(e.target.value))}
                style={{width:'100%',accentColor:col}}/>
            </div>
          ))}
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>
            Шум mini-batch = σ/√B = <strong style={{color:T.cyan}}>{(noise/Math.sqrt(batchSz)).toFixed(3)}</strong>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column' as const,gap:8}}>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setRunning(r=>!r)} style={{flex:1,padding:'10px',borderRadius:12,background:running?T.amber:T.green,color:T.white,border:'none',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {running ? '⏸ Пауза' : '▶ Запустить'}
            </button>
            <button onClick={reset} style={{padding:'10px 14px',borderRadius:12,background:T.surface,color:T.muted,border:`1px solid ${T.border}`,fontSize:13,cursor:'pointer'}}>
              <RotateCcw size={14} style={{display:'inline'}}/>
            </button>
          </div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}>
            <StatBadge label="f(Batch финал)" value={fBatch.toFixed(4)} color={T.green}/>
            <StatBadge label="Итераций" value={steps} color={T.primary}/>
          </div>
          <Collapsible title="На двух минимумах: SGD иногда выигрывает?" color={T.violet}>
            Batch застрянет в ближайшем локальном минимуме. SGD с шумом может «перескочить» барьер и найти глобальный — особенно при большой σ. Это эффект «имитации отжига»: шум заменяет случайные перестановки оптимизационного ландшафта.
          </Collapsible>
          <Collapsible title="Загадка: SGD шумит, но в среднем сходится. Почему?" color={T.red}>
            Шум несмещён: E[шум] = 0. В среднем каждый шаг SGD делает то же, что Batch. Отдельные «плохие» шаги компенсируются «хорошими». Это как идти к цели в тумане — каждый шаг неточен, но в среднем идёшь правильно.
          </Collapsible>
        </div>
      </div>

      <Callout color={T.primary} title="Главный вывод">
        Batch — точный, но дорогой. SGD — дешёвый, шумный, иногда полезно «встряхивает». Mini-batch — компромисс. На практике: батч 32–256, Adam или SGD с momentum. Шум SGD — не баг, а фича для глубоких сетей.
      </Callout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 2 — Momentum
// ═══════════════════════════════════════════════════════════════════════════════
function MomentumLab() {
  const [c, setC]       = useState(50);
  const [lr, setLr]     = useState(0.01);
  const [beta, setBeta] = useState(0.9);
  const [running, setRunning] = useState(false);
  const [trPlain, setTrPlain] = useState<{x:number,y:number}[]>([{x:1.8,y:0.4}]);
  const [trMom,   setTrMom]   = useState<{x:number,y:number}[]>([{x:1.8,y:0.4}]);
  const [vx,setVx] = useState(0), [vy,setVy] = useState(0);
  const [steps,setSteps] = useState(0);
  const rafRef = useRef<number|null>(null);
  const canvRef = useRef<HTMLCanvasElement>(null);
  const [vHistory, setVHistory] = useState<{vx:number,vy:number}[]>([{vx:0,vy:0}]);

  const f    = ravine(c);
  const grad = gradRavine(c);
  const XMN=-2.2,XMX=2.2,YMN=-0.55,YMX=0.55;
  const W=460,H=240;

  const levels = useMemo(()=>{
    const step=(c*4)/8; return Array.from({length:8},(_,i)=>step*(i+0.5));
  },[c]);

  const stepFn = () => {
    setTrPlain(tr=>{
      const p=tr[tr.length-1];
      const {gx,gy}=grad(p.x,p.y);
      const nx=p.x-lr*gx, ny=p.y-lr*gy;
      if(!isFinite(nx)||!isFinite(ny)||Math.abs(nx)>5) return tr;
      return [...tr,{x:nx,y:ny}];
    });
    setVx(vx_=>{
      setVy(vy_=>{
        setTrMom(tr=>{
          const p=tr[tr.length-1];
          const {gx,gy}=grad(p.x,p.y);
          const nvx=beta*vx_+gx, nvy=beta*vy_+gy;
          const nx=p.x-lr*nvx, ny=p.y-lr*nvy;
          if(!isFinite(nx)||!isFinite(ny)||Math.abs(nx)>5) return tr;
          setVHistory(h=>[...h.slice(-60),{vx:nvx,vy:nvy}]);
          return [...tr,{x:nx,y:ny}];
        });
        return beta*vy_+grad(trMom[trMom.length-1]?.x??1.8,trMom[trMom.length-1]?.y??0.4).gy;
      });
      return beta*vx_+grad(trMom[trMom.length-1]?.x??1.8,trMom[trMom.length-1]?.y??0.4).gx;
    });
    setSteps(s=>s+1);
  };

  useEffect(()=>{
    if(!running){if(rafRef.current)cancelAnimationFrame(rafRef.current);return;}
    let last=0;
    const tick=(t:number)=>{if(t-last>30){stepFn();last=t;}rafRef.current=requestAnimationFrame(tick);};
    rafRef.current=requestAnimationFrame(tick);
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[running,steps,lr,beta,c]);

  const reset=()=>{
    setRunning(false);
    const p0={x:1.8,y:0.4};
    setTrPlain([p0]);setTrMom([p0]);setVx(0);setVy(0);setSteps(0);setVHistory([{vx:0,vy:0}]);
  };
  useEffect(reset,[c]);

  useEffect(()=>{
    const canvas=canvRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d')!;
    ctx.clearRect(0,0,W,H);
    renderHeatmap(ctx,W,H,f,XMN,XMX,YMN,YMX,'#0f172a',T.amber);
    renderContours(ctx,W,H,f,XMN,XMX,YMN,YMX,levels,T.white,0.4);
    drawTrajectory(ctx,trPlain,T.red,W,H,XMN,XMX,YMN,YMX,2,0.85);
    drawTrajectory(ctx,trMom,T.cyan,W,H,XMN,XMX,YMN,YMX,2.5);
    const p0=trPlain[0];drawPoint(ctx,p0.x,p0.y,W,H,XMN,XMX,YMN,YMX,T.white,5);
  });

  // Velocity component chart
  const VH=80,VW=260;
  const maxV=Math.max(1,...vHistory.map(v=>Math.abs(v.vx)+Math.abs(v.vy)));

  return (
    <div style={{fontFamily:"'Inter',sans-serif"}}>
      <LabHeader badge="Лаборатория 2 · Градиентный спуск" title="Momentum — велосипед в овраге"
        question="Почему обычный градиентный спуск застревает в оврагах? Как инерция решает эту проблему?" />

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginBottom:18}}>
        <InfoCard color={T.red} title="Без momentum (красный)">Зигзаги поперёк оврага. Каждый шаг смотрит только вперёд — не помнит, куда шёл раньше. В узком овраге практически не движется вдоль.</InfoCard>
        <InfoCard color={T.cyan} title="С momentum (синий)">v_{t+1} = β·v_t + ∇f. Скорость накапливается вдоль оврага, колебания поперёк гасятся. β=0.9: «помнит» последние ~10 шагов.</InfoCard>
        <InfoCard color={T.amber} title="Физическая аналогия">Без momentum — пешеход: на каждом шагу заново смотрит на компас. С momentum — велосипедист: разгоняется и не отвлекается на каждую кочку.</InfoCard>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 240px',gap:18,alignItems:'start'}}>
        <div>
          <div style={{background:'#0f172a',borderRadius:16,overflow:'hidden',marginBottom:12}}>
            <div style={{padding:'8px 14px',display:'flex',gap:16,background:'rgba(255,255,255,0.04)'}}>
              <span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,0.7)'}}>
                <span style={{width:12,height:3,background:T.red,display:'inline-block',borderRadius:2}}/>Без momentum ({trPlain.length-1} шагов)
              </span>
              <span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,0.7)'}}>
                <span style={{width:12,height:3,background:T.cyan,display:'inline-block',borderRadius:2}}/>С momentum ({trMom.length-1} шагов)
              </span>
            </div>
            <canvas ref={canvRef} width={W} height={H} style={{display:'block',width:'100%',height:'auto'}}/>
          </div>

          {/* Velocity component chart */}
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:'12px 14px'}}>
            <SectionLabel color={T.cyan}>Скорость v_t: компоненты вдоль оси (синий) и поперёк (оранжевый)</SectionLabel>
            <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`} style={{display:'block',width:'100%',background:T.surface,borderRadius:8}}>
              <line x1={0} y1={VH/2} x2={VW} y2={VH/2} stroke={T.border} strokeWidth={1}/>
              {vHistory.length>1&&(
                <>
                  <path d={vHistory.map((v,i)=>`${i===0?'M':'L'}${(i/(vHistory.length-1))*VW},${VH/2-v.vx/maxV*(VH/2-4)}`).join(' ')}
                    fill="none" stroke={T.cyan} strokeWidth="1.5"/>
                  <path d={vHistory.map((v,i)=>`${i===0?'M':'L'}${(i/(vHistory.length-1))*VW},${VH/2-v.vy/maxV*(VH/2-4)}`).join(' ')}
                    fill="none" stroke={T.amber} strokeWidth="1.5"/>
                </>
              )}
              <text x={4} y={12} fontSize="9" fill={T.cyan}>v_x (вдоль оврага)</text>
              <text x={4} y={VH-4} fontSize="9" fill={T.amber}>v_y (поперёк)</text>
            </svg>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column' as const,gap:12}}>
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px 16px'}}>
            <SectionLabel>Параметры оврага</SectionLabel>
            <div style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:2}}>
                <span>c (крутость)</span><strong style={{color:T.amber}}>{c}</strong>
              </div>
              <input type="range" min={5} max={200} step={5} value={c} onChange={e=>{setC(Number(e.target.value));}} style={{width:'100%',accentColor:T.amber}}/>
              <div style={{display:'flex',gap:5,marginTop:5,flexWrap:'wrap' as const}}>
                {[10,50,100,200].map(v=><button key={v} onClick={()=>setC(v)} style={{padding:'2px 8px',borderRadius:7,border:`1px solid ${T.amberLight}`,background:T.amberLight,color:'#92400e',fontSize:10,fontWeight:700,cursor:'pointer'}}>c={v}</button>)}
              </div>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:2}}>
                <span>η</span><strong style={{color:T.primary}}>{lr.toFixed(4)}</strong>
              </div>
              <input type="range" min={0.0005} max={0.05} step={0.0005} value={lr} onChange={e=>setLr(Number(e.target.value))} style={{width:'100%',accentColor:T.primary}}/>
            </div>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:2}}>
                <span>β (инерция)</span><strong style={{color:T.cyan}}>{beta.toFixed(2)}</strong>
              </div>
              <input type="range" min={0} max={0.99} step={0.01} value={beta} onChange={e=>setBeta(Number(e.target.value))} style={{width:'100%',accentColor:T.cyan}}/>
              <div style={{display:'flex',gap:5,marginTop:5,flexWrap:'wrap' as const}}>
                {[0,0.5,0.9,0.99].map(v=><button key={v} onClick={()=>setBeta(v)} style={{padding:'2px 8px',borderRadius:7,border:`1px solid ${T.primaryBorder}`,background:T.primaryLight,color:T.primaryDark,fontSize:10,fontWeight:700,cursor:'pointer'}}>β={v}</button>)}
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setRunning(r=>!r)} style={{flex:1,padding:'10px',borderRadius:12,background:running?T.amber:T.green,color:T.white,border:'none',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {running?'⏸':'▶'}
            </button>
            <button onClick={reset} style={{padding:'10px 12px',borderRadius:12,background:T.surface,color:T.muted,border:`1px solid ${T.border}`,cursor:'pointer'}}>
              <RotateCcw size={14} style={{display:'inline'}}/>
            </button>
          </div>

          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}>
            <StatBadge label="Шагов (без mom.)" value={trPlain.length-1} color={T.red}/>
            <StatBadge label="Шагов (с mom.)" value={trMom.length-1} color={T.cyan}/>
            <StatBadge label="κ = c (обусл.)" value={c} color={T.amber}/>
          </div>

          <Collapsible title="β=0.99 — слишком много? Когда плохо?" color={T.amber}>
            При очень большой β накопленная скорость «разгоняется» сильнее, чем нужно. Алгоритм «перелетает» минимум, колеблется вдоль оврага. Плюс при большом η и β система может вообще расходиться. Оптимум часто β=0.9.
          </Collapsible>
        </div>
      </div>

      <Callout color={T.cyan} title="Главный вывод">
        Momentum накапливает скорость вдоль устойчивого направления спуска и гасит поперечные колебания. v_y (поперёк оврага) колеблется вокруг нуля и взаимно гасится. v_x (вдоль) нарастает. Именно поэтому синяя траектория «летит» прямо к минимуму, не зигзагируя.
      </Callout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 3 — Adam anatomy
// ═══════════════════════════════════════════════════════════════════════════════
function AdamLab() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(80);
  const [lr, setLr]   = useState(0.05);
  const [b1, setB1]   = useState(0.9);
  const [b2, setB2]   = useState(0.999);
  const [running, setRunning] = useState(false);
  const [trAdam, setTrAdam] = useState<{x:number,y:number}[]>([{x:1.8,y:0.4}]);
  const [trSGD,  setTrSGD]  = useState<{x:number,y:number}[]>([{x:1.8,y:0.4}]);
  const [adamState, setAdamState] = useState({m1:0,m2:0,v1:0,v2:0,t:1});
  const [history,setHistory] = useState<{eff1:number,eff2:number,m1:number,m2:number}[]>([]);
  const [steps,setSteps] = useState(0);
  const rafRef = useRef<number|null>(null);
  const canvRef = useRef<HTMLCanvasElement>(null);

  const f    = (x:number,y:number) => a*x*x + b*y*y;
  const grad = (x:number,y:number) => ({gx:2*a*x, gy:2*b*y});
  const XMN=-2.2,XMX=2.2,YMN=-0.55,YMX:number=b>50?0.25:0.55;
  const W=460,H=220;
  const levels = useMemo(()=>{const s=b/8;return Array.from({length:8},(_,i)=>s*(i+0.5));},[a,b]);
  const eps=1e-8;

  const stepFn=()=>{
    setAdamState(st=>{
      const p=trAdam[trAdam.length-1];
      const {gx,gy}=grad(p.x,p.y);
      const nm1=b1*st.m1+(1-b1)*gx, nm2=b1*st.m2+(1-b1)*gy;
      const nv1=b2*st.v1+(1-b2)*gx*gx, nv2=b2*st.v2+(1-b2)*gy*gy;
      const t=st.t;
      const mh1=nm1/(1-Math.pow(b1,t)), mh2=nm2/(1-Math.pow(b1,t));
      const vh1=nv1/(1-Math.pow(b2,t)), vh2=nv2/(1-Math.pow(b2,t));
      const eff1=lr/(Math.sqrt(vh1)+eps), eff2=lr/(Math.sqrt(vh2)+eps);
      const nx=p.x-eff1*mh1, ny=p.y-eff2*mh2;
      setHistory(h=>[...h.slice(-80),{eff1,eff2,m1:nm1,m2:nm2}]);
      if(isFinite(nx)&&isFinite(ny)&&Math.abs(nx)<5)
        setTrAdam(tr=>[...tr,{x:nx,y:ny}]);
      return {m1:nm1,m2:nm2,v1:nv1,v2:nv2,t:t+1};
    });
    setTrSGD(tr=>{
      const p=tr[tr.length-1];
      const {gx,gy}=grad(p.x,p.y);
      const nx=p.x-lr*gx, ny=p.y-lr*gy;
      if(!isFinite(nx)||!isFinite(ny)||Math.abs(nx)>5) return tr;
      return [...tr,{x:nx,y:ny}];
    });
    setSteps(s=>s+1);
  };

  useEffect(()=>{
    if(!running){if(rafRef.current)cancelAnimationFrame(rafRef.current);return;}
    let last=0;
    const tick=(t:number)=>{if(t-last>35){stepFn();last=t;}rafRef.current=requestAnimationFrame(tick);};
    rafRef.current=requestAnimationFrame(tick);
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[running,steps,lr,b1,b2,a,b]);

  const reset=()=>{
    setRunning(false);
    const p0={x:1.8,y:0.4};
    setTrAdam([p0]);setTrSGD([p0]);
    setAdamState({m1:0,m2:0,v1:0,v2:0,t:1});setHistory([]);setSteps(0);
  };
  useEffect(reset,[a,b]);

  useEffect(()=>{
    const canvas=canvRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d')!;
    ctx.clearRect(0,0,W,H);
    renderHeatmap(ctx,W,H,f,XMN,XMX,YMN,YMX,'#0f172a',T.violet);
    renderContours(ctx,W,H,f,XMN,XMX,YMN,YMX,levels,T.white,0.4);
    drawTrajectory(ctx,trSGD,T.red,W,H,XMN,XMX,YMN,YMX,1.5,0.6);
    drawTrajectory(ctx,trAdam,T.green,W,H,XMN,XMX,YMN,YMX,2.5);
    const p0=trAdam[0];drawPoint(ctx,p0.x,p0.y,W,H,XMN,XMX,YMN,YMX,T.white,5);
  });

  const CH=70,CW=260;
  const maxEff=Math.max(lr*5,...history.map(h=>Math.max(h.eff1,h.eff2)));

  return (
    <div style={{fontFamily:"'Inter',sans-serif"}}>
      <LabHeader badge="Лаборатория 3 · Градиентный спуск" title="Adam — адаптивный шаг"
        question="Adam — самый популярный оптимизатор. Что внутри? Как два момента делают шаг адаптивным?" />

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginBottom:18}}>
        <InfoCard color={T.green} title="Первый момент m_t">Бегущее среднее градиентов (как momentum). Направление шага. m_t = β₁·m_{t-1} + (1-β₁)·∇f. Типичный β₁=0.9.</InfoCard>
        <InfoCard color={T.violet} title="Второй момент v_t">Бегущее среднее квадратов градиентов. Масштаб. v_t = β₂·v_{t-1} + (1-β₂)·∇f². Там, где градиент большой — v_t большой → шаг маленький. β₂=0.999.</InfoCard>
        <InfoCard color={T.primary} title="Эффективный lr">η_eff = η/√v_t. По крутой оси (большие градиенты) → маленький шаг. По пологой (маленькие градиенты) → большой шаг. Именно это адаптирует алгоритм к форме поверхности.</InfoCard>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:18,alignItems:'start'}}>
        <div>
          <div style={{background:'#0f172a',borderRadius:16,overflow:'hidden',marginBottom:12}}>
            <div style={{padding:'8px 14px',display:'flex',gap:16,background:'rgba(255,255,255,0.04)'}}>
              <span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,0.6)'}}>
                <span style={{width:12,height:2,background:T.red,display:'inline-block'}}/>SGD ({trSGD.length-1} шагов)
              </span>
              <span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,0.8)'}}>
                <span style={{width:12,height:3,background:T.green,display:'inline-block'}}/>Adam ({trAdam.length-1} шагов)
              </span>
              <span style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.4)'}}>f = {a}w₁² + {b}w₂²</span>
            </div>
            <canvas ref={canvRef} width={W} height={H} style={{display:'block',width:'100%',height:'auto'}}/>
          </div>

          {/* Effective lr chart */}
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:'12px 14px'}}>
            <SectionLabel color={T.primary}>Эффективный learning rate: η/√v_t по оси 1 (синий) и оси 2 (красный)</SectionLabel>
            <svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`} style={{display:'block',width:'100%',background:T.surface,borderRadius:8}}>
              <line x1={0} y1={CH/2} x2={CW} y2={CH/2} stroke={T.border} strokeWidth={1}/>
              {history.length>1&&(
                <>
                  <path d={history.map((h,i)=>`${i===0?'M':'L'}${(i/(history.length-1))*CW},${CH-h.eff1/maxEff*(CH-4)}`).join(' ')}
                    fill="none" stroke={T.cyan} strokeWidth="1.5"/>
                  <path d={history.map((h,i)=>`${i===0?'M':'L'}${(i/(history.length-1))*CW},${CH-h.eff2/maxEff*(CH-4)}`).join(' ')}
                    fill="none" stroke={T.red} strokeWidth="1.5"/>
                </>
              )}
              <text x={4} y={12} fontSize="9" fill={T.cyan}>η_eff для w₁ (пологая ось)</text>
              <text x={4} y={CH-4} fontSize="9" fill={T.red}>η_eff для w₂ (крутая ось)</text>
            </svg>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column' as const,gap:12}}>
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px 16px'}}>
            <SectionLabel>Форма поверхности f = aw₁² + bw₂²</SectionLabel>
            {[['a (пологая ось)',a,setA,1,50,1,T.cyan],['b (крутая ось)',b,setB,1,300,5,T.red]].map(([lbl,val,setter,mn,mx,st,col]:[any,any,any,any,any,any,any])=>(
              <div key={lbl} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:2}}>
                  <span>{lbl}</span><strong style={{color:col}}>{val}</strong>
                </div>
                <input type="range" min={mn} max={mx} step={st} value={val} onChange={e=>(setter as any)(Number(e.target.value))} style={{width:'100%',accentColor:col}}/>
              </div>
            ))}
            <div style={{fontSize:11,color:T.muted}}>κ = b/a = <strong style={{color:T.amber}}>{(b/a).toFixed(0)}</strong></div>
          </div>

          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px 16px'}}>
            <SectionLabel>Гиперпараметры Adam</SectionLabel>
            {[['η',lr,setLr,0.001,0.3,0.001,T.primary],['β₁',b1,setB1,0.5,0.999,0.01,T.green],['β₂',b2,setB2,0.9,0.9999,0.0001,T.violet]].map(([lbl,val,setter,mn,mx,st,col]:[any,any,any,any,any,any,any])=>(
              <div key={lbl} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:2}}>
                  <span style={{fontFamily:'monospace'}}>{lbl}</span><strong style={{color:col}}>{(val as number).toFixed(4)}</strong>
                </div>
                <input type="range" min={mn} max={mx} step={st} value={val} onChange={e=>(setter as any)(Number(e.target.value))} style={{width:'100%',accentColor:col}}/>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setRunning(r=>!r)} style={{flex:1,padding:'10px',borderRadius:12,background:running?T.amber:T.green,color:T.white,border:'none',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {running?'⏸':'▶'}
            </button>
            <button onClick={reset} style={{padding:'10px 12px',borderRadius:12,background:T.surface,color:T.muted,border:`1px solid ${T.border}`,cursor:'pointer'}}>
              <RotateCcw size={14} style={{display:'inline'}}/>
            </button>
          </div>

          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}>
            <StatBadge label="t (шаг)" value={adamState.t} color={T.primary}/>
            <StatBadge label="η_eff по w₁" value={history.length?(history[history.length-1].eff1).toFixed(5):'—'} color={T.cyan}/>
            <StatBadge label="η_eff по w₂" value={history.length?(history[history.length-1].eff2).toFixed(5):'—'} color={T.red}/>
          </div>

          <Collapsible title="Загадка: зачем поправка смещения 1/(1-β^t)?" color={T.violet}>
            В начале (t=1) m_1 = (1-β₁)·∇f — маленькое число. Без поправки Adam делал бы слишком маленькие шаги. Поправка компенсирует начальное смещение и делает первые шаги нормального размера. При t→∞ поправка → 1.
          </Collapsible>
        </div>
      </div>

      <Callout color={T.green} title="Главный вывод">
        Adam = momentum + адаптивный шаг. Первый момент даёт инерцию. Второй момент масштабирует шаг по каждой оси отдельно: большой градиент → маленький шаг, маленький градиент → большой шаг. На оврагах Adam адаптируется автоматически — без тонкой настройки lr.
      </Callout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 4 — Linear regression live fit
// ═══════════════════════════════════════════════════════════════════════════════
function LinRegLab() {
  const [points,setPoints] = useState<{x:number,y:number}[]>([
    {x:-1.5,y:-1.2},{x:-0.8,y:-0.5},{x:0,y:0.1},{x:0.6,y:0.8},{x:1.4,y:1.3},{x:1.8,y:1.9}
  ]);
  const [w0,setW0] = useState(0.5), [w1,setW1] = useState(0.0);
  const [lr,setLr] = useState(0.05);
  const [optType,setOptType] = useState<'batch'|'sgd'|'adam'>('batch');
  const [running,setRunning] = useState(false);
  const [steps,setSteps] = useState(0);
  const [lossHist,setLossHist] = useState<number[]>([]);
  const [adamSt,setAdamSt] = useState({m0:0,m1:0,v0:0,v1:0,t:1});
  const rafRef = useRef<number|null>(null);
  const dataCanv = useRef<HTMLCanvasElement>(null);
  const lossCanv = useRef<HTMLCanvasElement>(null);
  const [trajectory,setTrajectory] = useState<{x:number,y:number}[]>([{x:0.5,y:0}]);

  const loss = (w0_:number,w1_:number) => {
    if(!points.length) return 0;
    return points.reduce((s,p)=>s+(p.y-(w1_*p.x+w0_))**2,0)/points.length;
  };
  const gradLoss = (w0_:number,w1_:number,pts:{x:number,y:number}[]) => {
    if(!pts.length) return {g0:0,g1:0};
    const g0 = pts.reduce((s,p)=>s-2*(p.y-(w1_*p.x+w0_)),0)/pts.length;
    const g1 = pts.reduce((s,p)=>s-2*p.x*(p.y-(w1_*p.x+w0_)),0)/pts.length;
    return {g0,g1};
  };

  // Analytical solution
  const analytic = useMemo(()=>{
    const n=points.length; if(n<2) return {w0:0,w1:0};
    const mx=points.reduce((s,p)=>s+p.x,0)/n, my=points.reduce((s,p)=>s+p.y,0)/n;
    const num=points.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0);
    const den=points.reduce((s,p)=>s+(p.x-mx)**2,0);
    const w1_=den<1e-9?0:num/den;
    return {w0:my-w1_*mx, w1:w1_};
  },[points]);

  const eps=1e-8;

  const stepFn=()=>{
    let pts=points;
    if(optType==='sgd'&&points.length>0) {
      const idx=Math.floor(Math.random()*points.length);
      pts=[points[idx]];
    }
    const {g0,g1}=gradLoss(w0,w1,pts);

    if(optType==='adam') {
      setAdamSt(st=>{
        const nm0=0.9*st.m0+0.1*g0, nm1=0.9*st.m1+0.1*g1;
        const nv0=0.999*st.v0+0.001*g0*g0, nv1=0.999*st.v1+0.001*g1*g1;
        const t=st.t;
        const mh0=nm0/(1-0.9**t), mh1=nm1/(1-0.9**t);
        const vh0=nv0/(1-0.999**t), vh1=nv1/(1-0.999**t);
        const nw0=w0-lr/(Math.sqrt(vh0)+eps)*mh0;
        const nw1=w1-lr/(Math.sqrt(vh1)+eps)*mh1;
        setW0(nw0); setW1(nw1);
        setTrajectory(tr=>[...tr.slice(-200),{x:nw0,y:nw1}]);
        return {m0:nm0,m1:nm1,v0:nv0,v1:nv1,t:t+1};
      });
    } else {
      const nw0=w0-lr*g0, nw1=w1-lr*g1;
      setW0(nw0); setW1(nw1);
      setTrajectory(tr=>[...tr.slice(-200),{x:nw0,y:nw1}]);
    }
    setLossHist(h=>[...h.slice(-100),loss(w0,w1)]);
    setSteps(s=>s+1);
  };

  useEffect(()=>{
    if(!running){if(rafRef.current)cancelAnimationFrame(rafRef.current);return;}
    let last=0;
    const tick=(t:number)=>{if(t-last>40){stepFn();last=t;}rafRef.current=requestAnimationFrame(tick);};
    rafRef.current=requestAnimationFrame(tick);
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[running,steps,w0,w1,lr,optType,points]);

  const reset=()=>{
    setRunning(false);setW0(0.5);setW1(0);setSteps(0);setLossHist([]);
    setAdamSt({m0:0,m1:0,v0:0,v1:0,t:1});setTrajectory([{x:0.5,y:0}]);
  };

  const addNoise=()=>{
    setPoints(Array.from({length:8},()=>{const x=(Math.random()-0.5)*4;return {x,y:1.2*x+0.3+(Math.random()-0.5)*0.6};}));
    reset();
  };
  const addOutlier=()=>{
    setPoints(pts=>[...pts,{x:0,y:3}]);reset();
  };

  // Draw data canvas
  const DW=340,DH=300,DOX=170,DOY=150,DSC=65;
  useEffect(()=>{
    const c=dataCanv.current;if(!c)return;
    const ctx=c.getContext('2d')!;
    ctx.clearRect(0,0,DW,DH);
    ctx.fillStyle=T.surface;ctx.fillRect(0,0,DW,DH);
    // Grid
    [-2,-1,0,1,2].forEach(t=>{
      ctx.strokeStyle=T.border;ctx.lineWidth=t===0?1.5:0.5;
      ctx.beginPath();ctx.moveTo(DOX+t*DSC,0);ctx.lineTo(DOX+t*DSC,DH);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,DOY-t*DSC);ctx.lineTo(DW,DOY-t*DSC);ctx.stroke();
    });
    // Current line
    ctx.strokeStyle=T.primary;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(0,DOY-(-3*w1+w0)*DSC);ctx.lineTo(DW,DOY-(3*w1+w0)*DSC);ctx.stroke();
    // Analytic line
    ctx.strokeStyle=T.green;ctx.lineWidth=1.5;ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.moveTo(0,DOY-(-3*analytic.w1+analytic.w0)*DSC);ctx.lineTo(DW,DOY-(3*analytic.w1+analytic.w0)*DSC);ctx.stroke();
    ctx.setLineDash([]);
    // Residuals
    points.forEach(p=>{
      const pred=w1*p.x+w0;
      const px=DOX+p.x*DSC,py=DOY-p.y*DSC,pp=DOY-pred*DSC;
      ctx.strokeStyle=`${T.red}60`;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,pp);ctx.stroke();
    });
    // Points
    points.forEach(p=>{
      ctx.beginPath();ctx.arc(DOX+p.x*DSC,DOY-p.y*DSC,5,0,Math.PI*2);
      ctx.fillStyle=T.text;ctx.fill();
      ctx.strokeStyle=T.white;ctx.lineWidth=1.5;ctx.stroke();
    });
    // Labels
    ctx.font='bold 10px monospace';ctx.fillStyle=T.primary;ctx.textBaseline='bottom';
    ctx.fillText(`y = ${w1.toFixed(2)}x + ${w0.toFixed(2)}`,8,DH-6);
    ctx.fillStyle=T.green;
    ctx.fillText(`МНК: y = ${analytic.w1.toFixed(2)}x + ${analytic.w0.toFixed(2)}`,8,DH-20);
  });

  // Loss chart
  const LW=340,LH=80;
  useEffect(()=>{
    const c=lossCanv.current;if(!c)return;
    const ctx=c.getContext('2d')!;
    ctx.clearRect(0,0,LW,LH);
    ctx.fillStyle=T.surface;ctx.fillRect(0,0,LW,LH);
    if(lossHist.length<2) return;
    const mx=Math.max(...lossHist)+0.01;
    ctx.strokeStyle=T.amber;ctx.lineWidth=1.5;
    ctx.beginPath();
    lossHist.forEach((v,i)=>{
      const x=(i/(lossHist.length-1))*LW, y=LH-v/mx*(LH-4);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
    ctx.font='9px monospace';ctx.fillStyle=T.muted;ctx.textBaseline='top';
    ctx.fillText(`MSE: ${lossHist[lossHist.length-1].toFixed(4)}`,4,4);
  });

  return (
    <div style={{fontFamily:"'Inter',sans-serif"}}>
      <LabHeader badge="Лаборатория 4 · Градиентный спуск" title="Линейная регрессия изнутри"
        question="Как градиентный спуск «подгоняет» прямую под данные? Что делает выброс? Как выглядит обучение в пространстве параметров?" />

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginBottom:18}}>
        <InfoCard color={T.primary} title="Прямая регрессии">y = w₁x + w₀. Градиент MSE по w₀ = -2·Σ(yᵢ - ŷᵢ)/n. По w₁ = -2·Σxᵢ(yᵢ - ŷᵢ)/n. Красные вертикальные отрезки — остатки (ошибки).</InfoCard>
        <InfoCard color={T.green} title="Аналитическое решение">МНК: w₁=(X^TY-nȳx̄)/(X^TX-nx̄²). Зелёная пунктирная линия. Градиентный спуск итеративно приближается к ней.</InfoCard>
        <InfoCard color={T.red} title="Выброс">MSE штрафует квадратично: далёкая точка имеет непропорционально большой вес. Прямая «тянется» к выбросу. MAE был бы устойчивее.</InfoCard>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 240px',gap:18,alignItems:'start'}}>
        <div>
          <canvas ref={dataCanv} width={DW} height={DH} style={{display:'block',width:'100%',background:T.surface,borderRadius:14,marginBottom:10,cursor:'crosshair'}}
            onClick={e=>{
              const rect=(e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
              const x=(e.clientX-rect.left)/rect.width*DW;
              const y=(e.clientY-rect.top)/rect.height*DH;
              setPoints(pts=>[...pts,{x:(x-DOX)/DSC,y:(DOY-y)/DSC}]);
            }}/>
          <canvas ref={lossCanv} width={LW} height={LH} style={{display:'block',width:'100%',background:T.surface,borderRadius:12}}/>
          <div style={{fontSize:10,color:T.muted,marginTop:4,textAlign:'center' as const}}>↑ кликни для добавления точки | MSE по итерациям</div>
        </div>

        <div style={{display:'flex',flexDirection:'column' as const,gap:10}}>
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px 16px'}}>
            <SectionLabel>Оптимизатор</SectionLabel>
            <div style={{display:'flex',flexDirection:'column' as const,gap:5,marginBottom:10}}>
              {(['batch','sgd','adam'] as const).map(o=>(
                <button key={o} onClick={()=>{setOptType(o);reset();}}
                  style={{padding:'7px 12px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',background:optType===o?T.primary:T.surface,color:optType===o?T.white:T.text,border:`1px solid ${optType===o?T.primary:T.border}`,textAlign:'left' as const}}>
                  {o==='batch'?'Batch GD':o==='sgd'?'SGD (1 пример)':'Adam'}
                </button>
              ))}
            </div>
            <div style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:2}}>
                <span>η</span><strong style={{color:T.primary}}>{lr.toFixed(4)}</strong>
              </div>
              <input type="range" min={0.001} max={0.3} step={0.001} value={lr} onChange={e=>setLr(Number(e.target.value))} style={{width:'100%',accentColor:T.primary}}/>
            </div>
          </div>

          <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
            <button onClick={addNoise} style={{flex:1,padding:'8px',borderRadius:10,background:T.primaryLight,color:T.primaryDark,border:`1px solid ${T.primaryBorder}`,fontSize:11,fontWeight:700,cursor:'pointer'}}>🎲 Случайные</button>
            <button onClick={addOutlier} style={{flex:1,padding:'8px',borderRadius:10,background:T.redLight,color:T.red,border:`1px solid ${T.red}40`,fontSize:11,fontWeight:700,cursor:'pointer'}}>⚡ Выброс</button>
            <button onClick={()=>{setPoints([]);reset();}} style={{flex:1,padding:'8px',borderRadius:10,background:T.surface,color:T.muted,border:`1px solid ${T.border}`,fontSize:11,cursor:'pointer'}}>Очистить</button>
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setRunning(r=>!r)} style={{flex:1,padding:'10px',borderRadius:12,background:running?T.amber:T.green,color:T.white,border:'none',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {running?'⏸':'▶'}
            </button>
            <button onClick={reset} style={{padding:'10px 12px',borderRadius:12,background:T.surface,color:T.muted,border:`1px solid ${T.border}`,cursor:'pointer'}}>
              <RotateCcw size={14} style={{display:'inline'}}/>
            </button>
          </div>

          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}>
            <StatBadge label="w₀ (intercept)" value={w0.toFixed(4)} color={T.primary}/>
            <StatBadge label="w₁ (slope)" value={w1.toFixed(4)} color={T.primary}/>
            <StatBadge label="MSE" value={loss(w0,w1).toFixed(5)} color={T.amber}/>
            <StatBadge label="Шагов" value={steps} color={T.muted}/>
          </div>

          <Collapsible title="Зачем градиентный спуск, если есть формула МНК?" color={T.primary}>
            МНК требует обращения матрицы X^TX размером p×p (p = число признаков). При p=10000 — матрица 10000×10000. Обращение O(p³). Для нейросети с миллионами параметров — невозможно. Градиентный спуск: один шаг O(n·p) и память O(p).
          </Collapsible>
        </div>
      </div>

      <Callout color={T.amber} title="Главный вывод">
        Каждый шаг градиентного спуска чуть поворачивает прямую, уменьшая сумму квадратов остатков. Batch GD сходится к точному МНК-решению. SGD «танцует» вокруг. Adam — быстро и без тонкой настройки. Выброс тянет прямую к себе из-за квадратичной ошибки.
      </Callout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAB 5 — Optimizer race
// ═══════════════════════════════════════════════════════════════════════════════
function OptimizerRaceLab() {
  type SurfKey2 = 'rosenbrock' | 'twoMins' | 'saddle' | 'ring';
  const [surfKey,setSurfKey] = useState<SurfKey2>('rosenbrock');
  const [lrBatch,setLrBatch]   = useState(0.003);
  const [lrMom,setLrMom]       = useState(0.005);
  const [lrAdam,setLrAdamR]    = useState(0.05);
  const [betaMom,setBetaMom]   = useState(0.9);
  const [running,setRunning]   = useState(false);
  const [finished,setFinished] = useState<Record<string,number>>({});

  type Traj = {x:number,y:number}[];
  const [trBatch,setTrBatch] = useState<Traj>([]);
  const [trMom,setTrMom]     = useState<Traj>([]);
  const [trAdam,setTrAdam]   = useState<Traj>([]);
  const [adamSt,setAdamSt]   = useState({m0:0,m1:0,v0:0,v1:0,t:1});
  const [momV,setMomV]       = useState({vx:0,vy:0});
  const [steps,setSteps]     = useState(0);
  const rafRef = useRef<number|null>(null);
  const canvRef = useRef<HTMLCanvasElement>(null);

  const surfs: Record<SurfKey2,{f:(x:number,y:number)=>number;grad:(x:number,y:number)=>{gx:number,gy:number};label:string;xMin:number;xMax:number;yMin:number;yMax:number;start:{x:number,y:number};minima:{x:number,y:number}[];color:string}> = {
    rosenbrock: { f:rosenbrock, grad:gradRosenbrock, label:'Розенброк', xMin:-2,xMax:2,yMin:-0.5,yMax:3, start:{x:-1.2,y:1}, minima:[{x:1,y:1}], color:T.red },
    twoMins:    { f:twoMins, grad:gradTwoMins, label:'Два минимума', xMin:-2,xMax:2,yMin:-2.5,yMax:2.5, start:{x:1.5,y:1.5}, minima:[{x:-1.2,y:0},{x:1.2,y:0}], color:T.violet },
    saddle:     { f:saddle, grad:gradSaddle, label:'Через седло', xMin:-2.2,xMax:2.2,yMin:-2.2,yMax:2.2, start:{x:1.8,y:1.8}, minima:[{x:1.6,y:1.6},{x:-1.6,y:-1.6}], color:T.amber },
    ring:       { f:ring, grad:gradRing, label:'Кольцо', xMin:-2,xMax:2,yMin:-2,yMax:2, start:{x:0,y:0}, minima:[{x:0,y:-1}], color:T.cyan },
  };
  const surf = surfs[surfKey];
  const W=460,H=380;

  const converged = (p:{x:number,y:number}) =>
    surf.minima.some(m=>Math.hypot(p.x-m.x,p.y-m.y)<0.1);

  const levels = useMemo(()=>{
    const vals:number[]=[];
    for(let i=-2;i<=3;i+=0.3) for(let j=-2;j<=3;j+=0.3) {
      try{const v=surf.f(i,j);if(isFinite(v)&&v<1e4)vals.push(v);}catch{}
    }
    if(!vals.length) return [];
    const mn=Math.min(...vals),mx=Math.max(...vals),step=(mx-mn)/12;
    return Array.from({length:12},(_,i)=>mn+step*(i+0.5));
  },[surfKey]);

  const eps=1e-8;
  const stepFn=()=>{
    const maxSteps=800;
    if(steps>=maxSteps){setRunning(false);return;}

    // Batch GD
    if(!finished['batch'])
      setTrBatch(tr=>{
        const p=tr[tr.length-1];
        const {gx,gy}=surf.grad(p.x,p.y);
        const nx=p.x-lrBatch*gx,ny=p.y-lrBatch*gy;
        if(!isFinite(nx)||!isFinite(ny)||Math.abs(nx)>5||Math.abs(ny)>5) return tr;
        const np={x:nx,y:ny};
        if(converged(np)) setFinished(f=>({...f,batch:steps+1}));
        return [...tr,np];
      });

    // Momentum
    if(!finished['mom'])
      setMomV(v=>{
        const p2=trMom[trMom.length-1];
        if(!p2) return v;
        const {gx,gy}=surf.grad(p2.x,p2.y);
        const nvx=betaMom*v.vx+gx,nvy=betaMom*v.vy+gy;
        const nx=p2.x-lrMom*nvx,ny=p2.y-lrMom*nvy;
        if(isFinite(nx)&&isFinite(ny)&&Math.abs(nx)<5&&Math.abs(ny)<5) {
          const np={x:nx,y:ny};
          if(converged(np)) setFinished(f=>({...f,mom:steps+1}));
          setTrMom(tr=>[...tr,np]);
        }
        return {vx:nvx,vy:nvy};
      });

    // Adam
    if(!finished['adam'])
      setAdamSt(st=>{
        const p3=trAdam[trAdam.length-1];
        if(!p3) return st;
        const {gx,gy}=surf.grad(p3.x,p3.y);
        const nm0=0.9*st.m0+0.1*gx,nm1=0.9*st.m1+0.1*gy;
        const nv0=0.999*st.v0+0.001*gx*gx,nv1=0.999*st.v1+0.001*gy*gy;
        const t=st.t;
        const mh0=nm0/(1-0.9**t),mh1=nm1/(1-0.9**t);
        const vh0=nv0/(1-0.999**t),vh1=nv1/(1-0.999**t);
        const nx=p3.x-lrAdam/(Math.sqrt(vh0)+eps)*mh0;
        const ny=p3.y-lrAdam/(Math.sqrt(vh1)+eps)*mh1;
        if(isFinite(nx)&&isFinite(ny)&&Math.abs(nx)<5&&Math.abs(ny)<5) {
          const np={x:nx,y:ny};
          if(converged(np)) setFinished(f=>({...f,adam:steps+1}));
          setTrAdam(tr=>[...tr,np]);
        }
        return {m0:nm0,m1:nm1,v0:nv0,v1:nv1,t:t+1};
      });

    setSteps(s=>s+1);
  };

  useEffect(()=>{
    if(!running){if(rafRef.current)cancelAnimationFrame(rafRef.current);return;}
    let last=0;
    const tick=(t:number)=>{if(t-last>25){stepFn();last=t;}rafRef.current=requestAnimationFrame(tick);};
    rafRef.current=requestAnimationFrame(tick);
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[running,steps,lrBatch,lrMom,lrAdam,betaMom,surfKey]);

  const reset=()=>{
    setRunning(false);
    const p0=surf.start;
    setTrBatch([p0]);setTrMom([p0]);setTrAdam([p0]);
    setAdamSt({m0:0,m1:0,v0:0,v1:0,t:1});setMomV({vx:0,vy:0});
    setSteps(0);setFinished({});
  };
  useEffect(reset,[surfKey]);

  const COLORS:{key:string;color:string;label:string;traj:Traj}[] = [
    {key:'batch',color:T.red,   label:'Batch GD', traj:trBatch},
    {key:'mom',  color:T.cyan,  label:'Momentum', traj:trMom},
    {key:'adam', color:T.green, label:'Adam',      traj:trAdam},
  ];

  useEffect(()=>{
    const canvas=canvRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d')!;
    ctx.clearRect(0,0,W,H);
    renderHeatmap(ctx,W,H,surf.f,surf.xMin,surf.xMax,surf.yMin,surf.yMax,'#0f172a',surf.color);
    renderContours(ctx,W,H,surf.f,surf.xMin,surf.xMax,surf.yMin,surf.yMax,levels,T.white,0.35);
    COLORS.forEach(({color,traj})=>drawTrajectory(ctx,traj,color,W,H,surf.xMin,surf.xMax,surf.yMin,surf.yMax,2));
    // Minima stars
    const toX=(x:number)=>((x-surf.xMin)/(surf.xMax-surf.xMin))*W;
    const toY=(y:number)=>H-((y-surf.yMin)/(surf.yMax-surf.yMin))*H;
    surf.minima.forEach(m=>{
      ctx.font='16px sans-serif';ctx.fillText('★',toX(m.x)-8,toY(m.y)+6);
    });
    // Start
    const s=surf.start;drawPoint(ctx,s.x,s.y,W,H,surf.xMin,surf.xMax,surf.yMin,surf.yMax,T.white,6);
  });

  // Rank by steps (finished first)
  const ranked = Object.entries(finished).sort(([,a],[,b])=>a-b);

  return (
    <div style={{fontFamily:"'Inter',sans-serif"}}>
      <LabHeader badge="Лаборатория 5 · Градиентный спуск" title="Гонка оптимизаторов"
        question="Как разные оптимизаторы справляются с одной и той же функцией? Всегда ли Adam выигрывает?" />

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginBottom:18}}>
        <InfoCard color={T.red} title="Batch GD">Простой. Гладкий. Плохо справляется с оврагами и изогнутыми долинами. Нужна ручная настройка lr.</InfoCard>
        <InfoCard color={T.cyan} title="Momentum">Быстрее Batch на оврагах. Нужен подбор β. Может «перелететь» минимум при β→1.</InfoCard>
        <InfoCard color={T.green} title="Adam">Адаптивный lr по каждой оси. Обычно быстрее всех. Но на «изотропных» функциях преимущество исчезает.</InfoCard>
      </div>

      <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,marginBottom:14}}>
        {(Object.keys(surfs) as SurfKey2[]).map(k=>(
          <PresetButton key={k} active={surfKey===k} onClick={()=>setSurfKey(k)} label={surfs[k].label} color={surfs[k].color}/>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:18,alignItems:'start'}}>
        <div style={{background:'#0f172a',borderRadius:16,overflow:'hidden'}}>
          <div style={{padding:'8px 14px',display:'flex',gap:12,background:'rgba(255,255,255,0.04)',flexWrap:'wrap' as const}}>
            {COLORS.map(({color,label,traj,key})=>(
              <span key={key} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,0.7)'}}>
                <span style={{width:12,height:3,background:color,display:'inline-block',borderRadius:2}}/>
                {label} ({traj.length-1} шагов)
                {finished[key]&&<span style={{color:T.green,fontWeight:800}}>✓{finished[key]}</span>}
              </span>
            ))}
            <span style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.4)'}}>★ = минимум</span>
          </div>
          <canvas ref={canvRef} width={W} height={H} style={{display:'block',width:'100%',height:'auto'}}/>
        </div>

        <div style={{display:'flex',flexDirection:'column' as const,gap:12}}>
          {/* Scoreboard */}
          {ranked.length>0&&(
            <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:'12px 14px'}}>
              <SectionLabel>Результаты гонки</SectionLabel>
              {ranked.map(([key,st],i)=>{
                const info=COLORS.find(c=>c.key===key)!;
                return (
                  <div key={key} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,padding:'6px 10px',borderRadius:9,background:`${info.color}10`}}>
                    <span style={{fontSize:14,fontWeight:900,color:info.color}}>{i+1}</span>
                    <span style={{width:10,height:10,borderRadius:'50%',background:info.color,flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:700,color:T.text,flex:1}}>{info.label}</span>
                    <span style={{fontSize:12,fontWeight:800,color:info.color,fontFamily:'monospace'}}>{st} шагов</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* LR controls */}
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px 16px'}}>
            <SectionLabel>Learning rates</SectionLabel>
            {[
              ['η Batch', lrBatch, setLrBatch, 0.0005, 0.05, 0.0005, T.red],
              ['η Momentum', lrMom, setLrMom, 0.0005, 0.05, 0.0005, T.cyan],
              ['β Momentum', betaMom, setBetaMom, 0, 0.99, 0.01, T.cyan],
              ['η Adam', lrAdam, setLrAdamR, 0.005, 0.3, 0.005, T.green],
            ].map(([lbl,val,setter,mn,mx,st,col]:[any,any,any,any,any,any,any])=>(
              <div key={lbl} style={{marginBottom:7}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:1}}>
                  <span style={{fontFamily:'monospace'}}>{lbl}</span><strong style={{color:col}}>{(val as number).toFixed(4)}</strong>
                </div>
                <input type="range" min={mn} max={mx} step={st} value={val} onChange={e=>(setter as any)(Number(e.target.value))} style={{width:'100%',accentColor:col}}/>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setRunning(r=>!r)} style={{flex:1,padding:'10px',borderRadius:12,background:running?T.amber:T.green,color:T.white,border:'none',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {running?'⏸ Пауза':'▶ Старт'}
            </button>
            <button onClick={reset} style={{padding:'10px 12px',borderRadius:12,background:T.surface,color:T.muted,border:`1px solid ${T.border}`,cursor:'pointer'}}>
              <RotateCcw size={14} style={{display:'inline'}}/>
            </button>
          </div>

          <Collapsible title="Загадка: SGD иногда быстрее Adam. Когда?" color={T.primary}>
            На изотропных функциях (κ≈1) адаптивный lr Adam не даёт выигрыша, зато overhead на вычисление двух моментов замедляет его. Плюс Adam может «обобщаться хуже» в некоторых задачах — феномен из статьи «On the Convergence of Adam». SGD с хорошо подобранным lr decay часто даёт лучшее качество модели при большем числе шагов.
          </Collapsible>
          <Collapsible title="Почему на функции с седлом все застревают в (0,0)?" color={T.amber}>
            В точке (0,0) градиент = 0. Все три оптимизатора получают нулевой сигнал и не двигаются. Momentum может проскочить через седло, если подойти к нему с ненулевой скоростью. Запусти из (0.01, 0.01) — малейшее отклонение даёт ненулевой градиент и алгоритмы уходят.
          </Collapsible>
        </div>
      </div>

      <Callout color={T.green} title="Главный вывод">
        Нет «абсолютно лучшего» оптимизатора. Adam хорош «из коробки» на большинстве задач глубокого обучения. Momentum прост и эффективен на оврагах. SGD с правильным расписанием lr иногда даёт лучшее обобщение. Выбор оптимизатора — часть искусства обучения моделей.
      </Callout>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function GradientDescent2LabView() {
  const [activeLab, setActiveLab] = useState<string>(GD2_LABS[0].id);
  const lab = GD2_LABS.find(item => item.id === activeLab) ?? GD2_LABS[0];

  return (
    <LabShell
      title="Лаборатории: Градиентный спуск — часть 2"
      intro="Пять интерактивных стендов: SGD vs Batch, momentum в овраге, внутренности Adam, живая линейная регрессия и гонка оптимизаторов."
      labs={GD2_LABS}
      activeId={activeLab}
      onSelect={setActiveLab}
    >
      {lab.id === 'gd2-sgd-variants' ? <SGDVariantsLab />
        : lab.id === 'gd2-momentum'  ? <MomentumLab />
        : lab.id === 'gd2-adam'      ? <AdamLab />
        : lab.id === 'gd2-linreg'    ? <LinRegLab />
        : lab.id === 'gd2-race'      ? <OptimizerRaceLab />
        : <LabBody title={lab.title} question={lab.shortTitle} mechanics={[]} explore={[]} insight="" />
      }
    </LabShell>
  );
}
