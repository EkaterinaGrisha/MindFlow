import { motion } from "motion/react";
import {
  ArrowLeft,
  Download,
  Share2,
  Wallet,
  BarChart3,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Target,
  ShieldCheck,
  ListChecks,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

type DailyCost = {
  utcDate: string;
  model: string;
  costUsd: number;
  requests: number;
};

type MetricRow = {
  utcDate: string;
  model: string;
  type: "output_tokens" | "input_cache_hit_tokens" | "input_cache_miss_tokens";
  price: number;
  amount: number;
};

const dollarRateRub = 82;

const dailyCosts: DailyCost[] = [
  { utcDate: "2026-04-18", model: "deepseek-chat & deepseek-reasoner", costUsd: 0.00072716, requests: 2 },
  { utcDate: "2026-04-22", model: "deepseek-chat & deepseek-reasoner", costUsd: 0.014395192, requests: 49 },
  { utcDate: "2026-04-23", model: "deepseek-chat & deepseek-reasoner", costUsd: 0.00080738, requests: 2 },
  { utcDate: "2026-04-25", model: "deepseek-v4-flash", costUsd: 0.00069398, requests: 4 },
  { utcDate: "2026-04-26", model: "deepseek-v4-flash", costUsd: 0.00096404, requests: 5 },
  { utcDate: "2026-04-27", model: "deepseek-v4-flash", costUsd: 0.0019046272, requests: 8 },
];

const metricRows: MetricRow[] = [
  { utcDate: "2026-04-18", model: "deepseek-chat & deepseek-reasoner", type: "output_tokens", price: 0.00000042, amount: 862 },
  { utcDate: "2026-04-18", model: "deepseek-chat & deepseek-reasoner", type: "input_cache_miss_tokens", price: 0.00000028, amount: 1304 },

  { utcDate: "2026-04-22", model: "deepseek-chat & deepseek-reasoner", type: "output_tokens", price: 0.00000042, amount: 19522 },
  { utcDate: "2026-04-22", model: "deepseek-chat & deepseek-reasoner", type: "input_cache_hit_tokens", price: 0.000000028, amount: 10624 },
  { utcDate: "2026-04-22", model: "deepseek-chat & deepseek-reasoner", type: "input_cache_miss_tokens", price: 0.00000028, amount: 21066 },

  { utcDate: "2026-04-23", model: "deepseek-chat & deepseek-reasoner", type: "output_tokens", price: 0.00000042, amount: 1177 },
  { utcDate: "2026-04-23", model: "deepseek-chat & deepseek-reasoner", type: "input_cache_miss_tokens", price: 0.00000028, amount: 1118 },

  { utcDate: "2026-04-25", model: "deepseek-v4-flash", type: "output_tokens", price: 0.00000028, amount: 1196 },
  { utcDate: "2026-04-25", model: "deepseek-v4-flash", type: "input_cache_miss_tokens", price: 0.00000014, amount: 2565 },

  { utcDate: "2026-04-26", model: "deepseek-v4-flash", type: "output_tokens", price: 0.00000028, amount: 1916 },
  { utcDate: "2026-04-26", model: "deepseek-v4-flash", type: "input_cache_miss_tokens", price: 0.00000014, amount: 3054 },

  { utcDate: "2026-04-27", model: "deepseek-v4-flash", type: "output_tokens", price: 0.00000028, amount: 5370 },
  { utcDate: "2026-04-27", model: "deepseek-v4-flash", type: "input_cache_hit_tokens", price: 0.0000000028, amount: 1024 },
  { utcDate: "2026-04-27", model: "deepseek-v4-flash", type: "input_cache_miss_tokens", price: 0.00000014, amount: 2844 },
];

const metricNameMap: Record<MetricRow["type"], string> = {
  output_tokens: "Output tokens",
  input_cache_hit_tokens: "Input cache hit",
  input_cache_miss_tokens: "Input cache miss",
};

const metricColorMap: Record<MetricRow["type"], string> = {
  output_tokens: "#4f46e5",
  input_cache_hit_tokens: "#10b981",
  input_cache_miss_tokens: "#f59e0b",
};

const totalCostUsd = dailyCosts.reduce((sum, row) => sum + row.costUsd, 0);
const totalRequests = dailyCosts.reduce((sum, row) => sum + row.requests, 0);
const avgCostPerRequestUsd = totalCostUsd / totalRequests;
const peakDay = dailyCosts.reduce((max, row) => (row.costUsd > max.costUsd ? row : max), dailyCosts[0]);

const metricSpend = metricRows.reduce<Record<MetricRow["type"], number>>(
  (acc, row) => {
    acc[row.type] += row.price * row.amount;
    return acc;
  },
  { output_tokens: 0, input_cache_hit_tokens: 0, input_cache_miss_tokens: 0 }
);

const metricSpendData = (Object.keys(metricSpend) as MetricRow["type"][]).map((key) => ({
  name: metricNameMap[key],
  value: metricSpend[key],
  color: metricColorMap[key],
}));

const modelSpendMap = dailyCosts.reduce<Record<string, number>>((acc, row) => {
  acc[row.model] = (acc[row.model] ?? 0) + row.costUsd;
  return acc;
}, {});

const modelSpendData = Object.entries(modelSpendMap).map(([name, value]) => ({ name, value }));

const timelineData = dailyCosts.map((row) => ({
  date: row.utcDate.slice(5),
  costUsd: row.costUsd,
  requests: row.requests,
}));

const fmtUsd = (v: number) => `$${v.toFixed(6)}`;
const fmtRub = (v: number) => `${Math.round(v).toLocaleString("ru-RU")} ₽`;

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
    color: "#4f46e5", background: "rgba(79,70,229,0.08)",
    padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(79,70,229,0.15)",
  }}>{children}</span>
);

const SectionDivider = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "56px 0 32px" }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(79,70,229,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={18} color="#4f46e5" />
    </div>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f0f1a", margin: 0, flex: 1 }}>{label}</h2>
    <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #e0e7ff, transparent)" }} />
  </div>
);

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8eaf6", padding: 24, ...style }}>
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, accent = false }: { label: string; value: string; sub?: React.ReactNode; accent?: boolean }) => (
  <div style={{
    background: accent ? "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)" : "#fff",
    borderRadius: 16, border: accent ? "none" : "1px solid #e8eaf6",
    padding: "24px 20px", position: "relative", overflow: "hidden",
  }}>
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 8px", color: accent ? "rgba(255,255,255,0.7)" : "#4f46e5" }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 900, margin: "0 0 4px", color: accent ? "#fff" : "#0f0f1a", lineHeight: 1 }}>{value}</p>
    {sub && <div style={{ fontSize: 11, color: accent ? "rgba(255,255,255,0.75)" : "#6b7280", marginTop: 4 }}>{sub}</div>}
  </div>
);

const InsightBox = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{
    background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.15)",
    borderRadius: 12, padding: "14px 16px", marginTop: 16,
  }}>
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "#4f46e5", textTransform: "uppercase", margin: "0 0 6px" }}>💡 {title}</p>
    <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.6 }}>{children}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8eaf6", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", margin: "0 0 4px" }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 800, color: p.color || "#4f46e5", margin: 0 }}>
            {p.name}: {p.dataKey === "requests" ? p.value : fmtUsd(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EconomicReport() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#0f0f1a", background: "#f8f9ff", minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(248,249,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e8eaf6", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/reports")} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={15} /> Отчёты
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", border: "1px solid #e8eaf6", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            <Download size={14} /> PDF
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg, #4f46e5, #6d28d9)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Share2 size={14} /> Поделиться
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 80px" }}>
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Tag><Sparkles size={10} /> Экономика проекта · фактические данные</Tag>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>ПЕРИОД: 18–27 АПРЕЛЯ 2026</span>
          </div>
          <h1 style={{ fontSize: 46, fontWeight: 900, color: "#0f0f1a", lineHeight: 1.06, letterSpacing: "-0.02em", margin: "0 0 20px", maxWidth: 840 }}>
            Финансовый отчёт без «вранья»:
            <span style={{ color: "#4f46e5" }}> только подтверждённые траты и прозрачные выводы</span>
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.65, maxWidth: 760, margin: 0 }}>
            Переписали отчёт в дизайне MarketAnalysis и убрали неподтверждённые/гипотетические суммы.
            Все цифры в этом экране — из предоставленных логов расходов и токенов.
          </p>
        </motion.section>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 }}>
          <KpiCard label="Итого за период" value={fmtUsd(totalCostUsd)} sub={`${fmtRub(totalCostUsd * dollarRateRub)} при курсе ${dollarRateRub} ₽/$`} accent />
          <KpiCard label="Всего запросов" value={String(totalRequests)} sub="По API-логам" />
          <KpiCard label="Средняя цена запроса" value={fmtUsd(avgCostPerRequestUsd)} sub={`≈ ${fmtRub(avgCostPerRequestUsd * dollarRateRub)}`} />
          <KpiCard label="Пиковый день" value={peakDay.utcDate} sub={`${fmtUsd(peakDay.costUsd)} · ${peakDay.requests} запросов`} />
        </motion.div>

        <SectionDivider icon={BarChart3} label="Динамика фактических расходов" />

        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>USD по датам + число запросов</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>
            Самая высокая нагрузка была 2026-04-22 — это подтверждается и суммой, и количеством запросов.
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timelineData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(3)}`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="costUsd" name="Расход" stroke="#4f46e5" strokeWidth={2.5} fill="url(#costGrad)" dot={{ r: 4, fill: "#4f46e5" }} />
              <Area yAxisId="right" type="monotone" dataKey="requests" name="Запросы" stroke="#10b981" strokeWidth={2} fill="none" dot={{ r: 3, fill: "#10b981" }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <SectionDivider icon={Wallet} label="Из чего складывается стоимость" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>Распределение затрат по типам биллинга</p>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metricSpendData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} innerRadius={54} paddingAngle={4}>
                    {metricSpendData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [fmtUsd(v), "Сумма"]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>Сравнение моделей по фактическим расходам</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={modelSpendData} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(3)}`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} width={180} />
                <Tooltip formatter={(v: number) => fmtUsd(v)} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                  {modelSpendData.map((_, i) => <Cell key={i} fill={i === 0 ? "#6366f1" : "#10b981"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <InsightBox title="Фактчекинг">
              Здесь нет гипотетических сравнений с чужими тарифами: показаны только реальные списания из вашего журнала.
            </InsightBox>
          </Card>
        </div>

        <SectionDivider icon={Target} label="Что хочется видеть vs что реально делаем" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 48 }}>
          <Card style={{ borderTop: "3px solid #4f46e5" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px" }}>В идеале хочется</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Плановый бюджет по месяцам с подтверждёнными источниками цен.",
                "Прозрачный лимит расходов на день/неделю с алертами при перерасходе.",
                "Разделение затрат: MVP, рост, production — без смешивания гипотез и фактов.",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(79,70,229,0.04)", border: "1px solid rgba(79,70,229,0.1)" }}>
                  <ShieldCheck size={16} color="#4f46e5" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ borderTop: "3px solid #10b981" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px" }}>Что реально уже можно сделать</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Использовать текущие дневные данные как базу для реального monthly-forecast.",
                "Обновлять отчёт автоматом по новым строкам биллинга, а не вручную.",
                "Оставлять в отчёте только подтверждённые цифры, а планы показывать отдельно текстом.",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}>
                  <ListChecks size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <SectionDivider icon={AlertTriangle} label="Проверка на «предмет вранья»" />

        <Card style={{ marginBottom: 40 }}>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <li style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}><strong>Убраны</strong> неподтверждённые блоки «идеальный стек», «x22/x32 экономии» и оценочные суммы без источника.</li>
            <li style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}><strong>Оставлены</strong> только цифры, которые бьются с вашими сырыми данными (стоимость, токены, запросы).</li>
            <li style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}><strong>Явно помечен</strong> используемый курс пересчёта USD → RUB ({dollarRateRub} ₽/$), чтобы не было скрытых допущений.</li>
          </ul>
          <InsightBox title="Рекомендация дальше">
            Если хотите, следующим шагом можно вынести данные в JSON/API и строить отчёт полностью динамически,
            чтобы исключить ручные правки и риск случайных несоответствий.
          </InsightBox>
        </Card>

        <div style={{ borderTop: "1px solid #e8eaf6", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>© 2026 MindFlow · Экономический отчёт на фактах из репозитория.</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#4f46e5", background: "#eef2ff", borderRadius: 8, padding: "6px 10px" }}>
            <CheckCircle2 size={14} /> Проверено по журналам за 2026-04-18…2026-04-27
          </span>
        </div>
      </div>
    </div>
  );
}
