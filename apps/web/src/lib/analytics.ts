// Lightweight analytics wrapper — dual-emits to Plausible + GA4.
//
// - Plausible (privacy-first, cookie-free): enabled when window.plausible is present.
//   Add the loader script to index.html and set VITE_PLAUSIBLE_DOMAIN to enable.
// - GA4 (gtag.js): подключите свой tracking ID в apps/web/index.html. При
//   наличии window.gtag все события зеркалятся в GA.
//
// Both emitters silently no-op if their script isn't loaded, so this module
// never throws and never blocks the UI.

import { sendServerEvent, type ServerEventType } from "./serverEvents";

type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> }
) => void;

type GtagFn = (
  command: "event" | "config" | "set" | "js",
  action: string | Date,
  params?: Record<string, unknown>
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

function trackPlausible(event: string, props?: Record<string, string | number | boolean>): void {
  try {
    if (typeof window !== "undefined" && typeof window.plausible === "function") {
      window.plausible(event, props ? { props } : undefined);
    }
  } catch {
    // never throw from analytics
  }
}

function trackGtag(event: string, props?: Record<string, string | number | boolean>): void {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", event, props ?? {});
    }
  } catch {
    // never throw from analytics
  }
}

/**
 * Universal track function — mirrors event to Plausible, GA4, and (optionally)
 * the server-side `events` table. Use `serverEvent` only for events that should
 * be in the BD-backed analytics dashboard.
 */
function track(
  event: string,
  props?: Record<string, string | number | boolean>,
  serverEvent?: ServerEventType,
): void {
  trackPlausible(event, props);
  trackGtag(event, props);

  if (serverEvent) {
    sendServerEvent(serverEvent, props as Record<string, unknown> | undefined).catch(() => {});
  }
}

// ── Named events ──────────────────────────────────────────────────────────────

export const analytics = {
  topicOpened(topicId: string, topicTitle: string) {
    track("topic_opened", { topic_id: topicId, topic_title: topicTitle }, "topic_opened");
  },

  mentorQuestion(role: string, topicId: string) {
    track(
      "mentor_question",
      { role, topic_id: topicId },
      "chat_message_sent",
    );
  },

  mentorResponseReceived(role: string, topicId: string, hasCitation: boolean) {
    track(
      "mentor_response",
      { role, topic_id: topicId, has_citation: hasCitation },
      "mentor_response_received",
    );
  },

  diagnosticStarted(courseId: string) {
    track("diagnostic_started", { course_id: courseId }, "diagnostic_started");
  },

  diagnosticCompleted(courseId: string, score: number) {
    track("diagnostic_completed", { course_id: courseId, score }, "diagnostic_completed");
  },

  practiceAttempt(topicId: string, correct: boolean, attemptNumber: number) {
    track(
      "practice_attempt",
      { topic_id: topicId, correct, attempt_number: attemptNumber },
      "practice_attempt",
    );
  },

  solutionRevealed(topicId: string, attemptNumber: number) {
    track(
      "solution_revealed",
      { topic_id: topicId, attempt_number: attemptNumber },
      "solution_revealed",
    );
  },

  pageView(path: string) {
    // GA4 already tracks pageviews automatically via gtag config; Plausible does too.
    // Only forward to server-side events for our own analytics dashboard.
    track("pageview", { path }, "page_view");
  },

  feedbackSubmitted(category: string, hasNps: boolean) {
    track("feedback_submitted", { category, has_nps: hasNps }, "feedback_submitted");
  },

  feedbackError(reason: string, status?: number) {
    track(
      "feedback_error",
      status !== undefined ? { reason, status } : { reason },
      "feedback_error",
    );
  },

  paymentStarted(plan: string) {
    track("payment_started", { plan }, "payment_started");
  },

  paymentSucceeded(plan: string, amount?: number) {
    track(
      "payment_succeeded",
      amount !== undefined ? { plan, amount } : { plan },
      "payment_succeeded",
    );
  },
};
