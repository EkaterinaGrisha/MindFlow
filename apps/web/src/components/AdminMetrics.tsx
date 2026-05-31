import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { buildApiHeaders, getApiBaseUrl } from "../lib/api";
import { useAuth } from "../lib/useAuth";

type Metrics = {
  generatedAt: string;
  windowDays: number;
  users: { dau: number; wau: number; mau: number };
  mentor: {
    totalSessions30d: number;
    totalSessions7d: number;
    totalMessages30d: number;
    avgMessagesPerSession: number;
    sessionsWithMin3Messages: number;
    deepEngagementRate: number;
  };
  rag: {
    totalQueries30d: number;
    avgPrecisionAtK: number;
    latencyP50Ms: number;
    latencyP95Ms: number;
    roleDistribution: Record<string, number>;
  };
  feedback: {
    total30d: number;
    npsResponses: number;
    npsScore: number | null;
    avgNps: number | null;
    promoters: number;
    detractors: number;
    byCategory: Record<string, number>;
  };
  billing: {
    totalSubscriptions: number;
    proCount: number;
    conversionToPro: number;
  };
};

type FeedbackItem = {
  id: number;
  user_id: string | null;
  nps: number | null;
  category: string;
  message: string;
  contact_ok: boolean;
  contact_info: string | null;
  created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Общее впечатление",
  ai_quality: "Качество AI",
  content_quality: "Контент",
  ux: "UX",
  bug: "Баг",
  feature_request: "Хочу фичу",
  other: "Другое",
};

export default function AdminMetrics() {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const headers = await buildApiHeaders();
      const base = getApiBaseUrl();

      const [metricsRes, feedbackRes] = await Promise.all([
        fetch(`${base}/api/admin/metrics`, { headers }),
        fetch(`${base}/api/admin/feedback?limit=50`, { headers }),
      ]);

      if (metricsRes.status === 403 || feedbackRes.status === 403) {
        throw new Error("Нет прав на админ-панель. Добавь свой user_id в ADMIN_USER_IDS в .env API.");
      }
      if (!metricsRes.ok) throw new Error(`metrics: ${metricsRes.status}`);
      if (!feedbackRes.ok) throw new Error(`feedback: ${feedbackRes.status}`);

      const metricsData = (await metricsRes.json()) as Metrics;
      const feedbackData = (await feedbackRes.json()) as { items: FeedbackItem[] };

      setMetrics(metricsData);
      setFeedback(feedbackData.items);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) loadAll();
    if (!authLoading && !user) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const downloadCsv = async (path: string, filename: string) => {
    try {
      const headers = await buildApiHeaders();
      const response = await fetch(`${getApiBaseUrl()}${path}`, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Неизвестная ошибка";
      alert(`Не удалось скачать: ${detail}`);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center text-sm text-on-surface-variant">Загрузка метрик...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-sm text-on-surface-variant">Войдите, чтобы открыть админ-панель.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-sm font-bold text-red-800">Ошибка</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={loadAll}
            className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Admin</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
            Метрики MindFlow
          </h1>
          {metrics && (
            <p className="mt-1 text-xs text-on-surface-variant">
              Окно: {metrics.windowDays} дней · Обновлено{" "}
              {new Date(metrics.generatedAt).toLocaleString("ru-RU")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-container"
          >
            <RefreshCw size={14} />
            Обновить
          </button>
          <button
            onClick={() =>
              downloadCsv(
                "/api/admin/feedback.csv",
                `feedback_${new Date().toISOString().slice(0, 10)}.csv`,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Download size={14} />
            Скачать отзывы (CSV)
          </button>
          <button
            onClick={() =>
              downloadCsv(
                "/api/admin/events.csv?days=30",
                `events_30d_${new Date().toISOString().slice(0, 10)}.csv`,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/30 bg-white px-3 py-2 text-sm font-semibold text-secondary hover:bg-secondary/5"
          >
            <Download size={14} />
            События (CSV)
          </button>
        </div>
      </header>

      {!metrics ? (
        <p className="text-sm text-on-surface-variant">Нет данных.</p>
      ) : (
        <>
          {/* KPI cards */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="DAU" value={metrics.users.dau} sub="за вчера" />
            <Kpi label="WAU" value={metrics.users.wau} sub="за 7 дней" />
            <Kpi label="MAU" value={metrics.users.mau} sub="за 30 дней" />
            <Kpi
              label="Pro подписки"
              value={metrics.billing.proCount}
              sub={`${(metrics.billing.conversionToPro * 100).toFixed(1)}% conversion`}
            />
          </section>

          {/* Mentor stats */}
          <section className="rounded-2xl border border-outline-variant/20 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-secondary">
              AI-Ментор
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat
                label="Сессий за 30 дн."
                value={metrics.mentor.totalSessions30d}
                hint={`${metrics.mentor.totalSessions7d} за неделю`}
              />
              <Stat label="Сообщений за 30 дн." value={metrics.mentor.totalMessages30d} />
              <Stat
                label="Среднее сообщений/сессию"
                value={metrics.mentor.avgMessagesPerSession.toFixed(1)}
              />
              <Stat
                label="Глубокие сессии (≥3 сообщ.)"
                value={`${(metrics.mentor.deepEngagementRate * 100).toFixed(1)}%`}
                hint={`${metrics.mentor.sessionsWithMin3Messages} сессий`}
              />
            </div>
          </section>

          {/* RAG stats */}
          <section className="rounded-2xl border border-outline-variant/20 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-secondary">
              Качество RAG
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Запросов с RAG" value={metrics.rag.totalQueries30d} />
              <Stat
                label="Precision@k (среднее)"
                value={metrics.rag.avgPrecisionAtK.toFixed(3)}
                hint="доля цитируемых чанков"
              />
              <Stat label="Latency p50" value={`${metrics.rag.latencyP50Ms} мс`} />
              <Stat label="Latency p95" value={`${metrics.rag.latencyP95Ms} мс`} />
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-on-surface-variant">
                Распределение ролей ментора:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.rag.roleDistribution).map(([role, count]) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-2.5 py-1 text-xs"
                  >
                    <span className="font-semibold text-primary">{role}</span>
                    <span className="text-on-surface-variant">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Feedback summary */}
          <section className="rounded-2xl border border-outline-variant/20 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-secondary">
              Обратная связь (NPS)
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Всего отзывов" value={metrics.feedback.total30d} />
              <Stat
                label="NPS Score"
                value={metrics.feedback.npsScore !== null ? metrics.feedback.npsScore : "—"}
                hint={`${metrics.feedback.npsResponses} ответов`}
              />
              <Stat label="Промоутеры (≥9)" value={metrics.feedback.promoters} />
              <Stat label="Детракторы (≤6)" value={metrics.feedback.detractors} />
            </div>
            {Object.keys(metrics.feedback.byCategory).length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-on-surface-variant">
                  По категориям:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(metrics.feedback.byCategory).map(([cat, count]) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-2.5 py-1 text-xs"
                    >
                      <span className="font-semibold text-primary">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </span>
                      <span className="text-on-surface-variant">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Recent feedback list */}
          <section className="rounded-2xl border border-outline-variant/20 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-secondary">
                Последние отзывы ({feedback.length})
              </h2>
            </div>
            {feedback.length === 0 ? (
              <p className="mt-3 text-sm text-on-surface-variant">Отзывов пока нет.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {feedback.map((f) => (
                  <li
                    key={f.id}
                    className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {f.nps !== null && (
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 font-semibold",
                            f.nps >= 9
                              ? "bg-emerald-100 text-emerald-800"
                              : f.nps <= 6
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800",
                          ].join(" ")}
                        >
                          NPS {f.nps}
                        </span>
                      )}
                      <span className="rounded-full bg-secondary/10 px-2 py-0.5 font-medium text-secondary">
                        {CATEGORY_LABELS[f.category] ?? f.category}
                      </span>
                      <span className="text-on-surface-variant">
                        {new Date(f.created_at).toLocaleString("ru-RU")}
                      </span>
                      {f.contact_ok && f.contact_info && (
                        <span className="text-on-surface-variant">
                          📩 {f.contact_info}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-primary">{f.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function Kpi({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-primary">{value}</p>
      {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <p className="mt-1 text-lg font-bold text-primary">{value}</p>
      {hint && <p className="text-xs text-on-surface-variant/70">{hint}</p>}
    </div>
  );
}
