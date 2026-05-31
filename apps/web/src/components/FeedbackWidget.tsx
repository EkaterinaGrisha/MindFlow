import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { buildApiHeaders, getApiBaseUrl } from "../lib/api";
import { analytics } from "../lib/analytics";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "general", label: "Общее впечатление" },
  { value: "ai_quality", label: "Качество ответов AI" },
  { value: "content_quality", label: "Качество контента" },
  { value: "ux", label: "Удобство интерфейса" },
  { value: "bug", label: "Баг / ошибка" },
  { value: "feature_request", label: "Хочу новую фичу" },
  { value: "other", label: "Другое" },
];

const DISMISS_KEY = "mindflow-feedback-dismissed-at";
const DISMISS_HOURS = 24;

function recentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < DISMISS_HOURS * 60 * 60 * 1000;
}

function markDismissed(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }
}

/**
 * Floating feedback button — bottom-right corner of the page.
 * Click → modal with NPS scale + category + free-text + optional contact.
 * Submits to POST /api/feedback. Persists to BD for the report.
 */
export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState<boolean>(() => recentlyDismissed());

  const [nps, setNps] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("general");
  const [message, setMessage] = useState<string>("");
  const [contactOk, setContactOk] = useState(false);
  const [contactInfo, setContactInfo] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hide on /admin pages (dashboard already collects feedback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/admin")) {
      setHidden(true);
    }
  }, []);

  if (hidden) return null;

  const reset = () => {
    setNps(null);
    setCategory("general");
    setMessage("");
    setContactOk(false);
    setContactInfo("");
    setSubmitted(false);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    if (!submitted) {
      // Don't auto-mark as dismissed — user might come back
    }
  };

  const handleDismissForever = () => {
    markDismissed();
    setHidden(true);
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/feedback`, {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({
          nps,
          category,
          message: message.trim(),
          contact_ok: contactOk,
          contact_info: contactOk ? contactInfo.trim() : null,
          page_url:
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : null,
        }),
      });

      if (!response.ok) {
        const txt = await response.text();
        analytics.feedbackError(txt.slice(0, 100) || "http_error", response.status);
        throw new Error(txt || `HTTP ${response.status}`);
      }

      setSubmitted(true);
      analytics.feedbackSubmitted(category, nps !== null);

      // Auto-close after 2.5s
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 2500);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Неизвестная ошибка";
      analytics.feedbackError(detail.slice(0, 100));
      setError(`Не удалось отправить: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
          aria-label="Оставить отзыв"
        >
          <MessageCircle size={16} />
          Отзыв
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-start bg-black/30 p-4 sm:items-center sm:justify-start sm:p-6">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-secondary" />
                <h3 className="text-sm font-bold text-primary">Поделитесь впечатлением</h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {submitted ? (
                <div className="py-6 text-center">
                  <div className="mb-2 text-3xl">🙏</div>
                  <p className="text-sm font-semibold text-primary">Спасибо!</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Ваш отзыв сохранён и поможет улучшить платформу.
                  </p>
                </div>
              ) : (
                <>
                  {/* NPS scale */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-primary">
                      Насколько вероятно, что вы порекомендуете MindFlow коллеге?
                    </label>
                    <p className="mb-2 text-xs text-on-surface-variant">
                      0 — точно нет, 10 — обязательно
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 11 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setNps(i)}
                          className={[
                            "h-8 w-8 rounded-lg border text-xs font-semibold transition",
                            nps === i
                              ? "border-secondary bg-secondary text-white"
                              : "border-outline-variant/40 bg-white text-primary hover:bg-secondary/5",
                          ].join(" ")}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-semibold text-primary">
                      О чём отзыв?
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm text-primary focus:border-secondary focus:outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-semibold text-primary">
                      Что хотите сказать? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={4000}
                      placeholder="Что понравилось / не понравилось / что не хватает..."
                      className="w-full resize-none rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm text-primary placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none"
                    />
                    <p className="mt-1 text-right text-xs text-on-surface-variant/60">
                      {message.length}/4000
                    </p>
                  </div>

                  {/* Contact */}
                  <div className="mb-4">
                    <label className="flex cursor-pointer items-start gap-2 text-xs text-primary">
                      <input
                        type="checkbox"
                        checked={contactOk}
                        onChange={(e) => setContactOk(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-outline-variant/40 text-secondary focus:ring-secondary"
                      />
                      <span>Можно связаться со мной для уточнений</span>
                    </label>
                    {contactOk && (
                      <input
                        type="text"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="Email или Telegram"
                        className="mt-2 w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-1.5 text-xs text-primary focus:border-secondary focus:outline-none"
                      />
                    )}
                  </div>

                  {error && (
                    <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={handleDismissForever}
                      className="text-xs text-on-surface-variant/70 hover:text-on-surface-variant underline-offset-2 hover:underline"
                    >
                      Не показывать сутки
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!message.trim() || submitting}
                      className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Отправляю..." : "Отправить"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
