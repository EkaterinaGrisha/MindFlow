import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Класс — потому что error-boundary до сих пор работает только через
// componentDidCatch / getDerivedStateFromError. React 19 хуков не дал.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // На прод-логи Railway, плюс GA/Plausible через window.gtag/window.plausible
    // если они подгружены. Не используем wrapper analytics — он может сам упасть.
    console.error("[ErrorBoundary]", error.message, info.componentStack);
    try {
      const w = window as unknown as {
        gtag?: (...args: unknown[]) => void;
        plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
      };
      w.gtag?.("event", "exception", { description: error.message.slice(0, 200), fatal: false });
      w.plausible?.("error", { props: { message: error.message.slice(0, 200) } });
    } catch {
      /* боевая телеметрия — не валим страницу второй раз */
    }
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.assign(window.location.pathname);
  };

  handleHome = () => {
    this.setState({ error: null });
    window.location.assign("/dashboard");
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#fafafa",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🤷</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Что-то пошло не так
          </h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
            Страница упала. Мы уже знаем — попробуй обновить или вернись на главную.
          </p>
          <details
            style={{ marginBottom: 24, color: "#999", fontSize: 12, textAlign: "left" }}
          >
            <summary style={{ cursor: "pointer" }}>Детали ошибки</summary>
            <pre style={{ marginTop: 8, padding: 12, background: "#f0f0f0", borderRadius: 8, overflow: "auto" }}>
              {this.state.error.message}
            </pre>
          </details>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "white",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Обновить страницу
            </button>
            <button
              onClick={this.handleHome}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#6366f1",
                color: "white",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }
}
