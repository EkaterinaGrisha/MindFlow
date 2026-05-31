// Server-side event tracking — POSTs to /api/events for the admin dashboard.
// Always silent on failure: never breaks the UI if the API is down.

import { buildApiHeaders, getApiBaseUrl } from "./api";

export type ServerEventType =
  | "chat_session_started"
  | "chat_message_sent"
  | "mentor_response_received"
  | "topic_opened"
  | "practice_attempt"
  | "solution_revealed"
  | "diagnostic_started"
  | "diagnostic_completed"
  | "payment_started"
  | "payment_succeeded"
  | "payment_cancelled"
  | "feedback_submitted"
  | "feedback_error"
  | "onboarding_step_completed"
  | "subscription_upgraded"
  | "page_view";

export async function sendServerEvent(
  eventType: ServerEventType,
  payload?: Record<string, unknown>,
  extra?: { latency_ms?: number; session_id?: string },
): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl && import.meta.env.PROD) {
      return; // No API base configured in prod build, skip silently
    }

    const headers = await buildApiHeaders();
    const pageUrl =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : null;

    await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        event_type: eventType,
        payload: payload ?? {},
        latency_ms: extra?.latency_ms,
        page_url: pageUrl,
        session_id: extra?.session_id,
      }),
      keepalive: true, // ensure delivery on page unload
    });
  } catch {
    // Silent — analytics must never break the app
  }
}
