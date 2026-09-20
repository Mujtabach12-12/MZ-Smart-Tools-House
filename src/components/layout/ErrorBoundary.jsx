import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, MessageCircle, RefreshCcw, Search } from "lucide-react";

const isDev = import.meta.env.DEV;

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "", stack: "", componentStack: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "This section could not be loaded.",
      stack: isDev ? String(error?.stack || "") : "",
    };
  }

  componentDidCatch(error, info) {
    // Keep production output friendly while retaining useful diagnostics in development.
    console.error("MZ Smart Tool House runtime error:", error, info);
    if (isDev) this.setState({ componentStack: String(info?.componentStack || "") });
  }

  reload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mz-section py-16 sm:py-24">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-7 text-center shadow-soft dark:border-red-900/60 dark:bg-navy-900 sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-navy-950 dark:text-white">This page ran into a problem</h1>
          <p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">
            Your other tools are still available. Reload this route, or return to the tool directory.
          </p>
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-left text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-200">
            {this.state.message}
          </p>
          {isDev && (this.state.stack || this.state.componentStack) ? (
            <details className="mt-3 rounded-xl border border-navy-200 bg-navy-50 p-3 text-left dark:border-navy-700 dark:bg-navy-950">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-navy-600 dark:text-navy-300">Developer details</summary>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-navy-600 dark:text-navy-300">
                {[this.state.stack, this.state.componentStack].filter(Boolean).join("\n\n")}
              </pre>
            </details>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" className="mz-btn-primary" onClick={this.reload}>
              <RefreshCcw className="h-4 w-4" /> Reload page
            </button>
            <Link to="/tools" className="mz-btn-secondary"><Search className="h-4 w-4" /> Search tools</Link>
            <button type="button" className="mz-btn-secondary" onClick={() => window.dispatchEvent(new Event("mz-feedback-open"))}><MessageCircle className="h-4 w-4" /> Report problem</button>
            <Link to="/" className="mz-btn-ghost"><Home className="h-4 w-4" /> Home</Link>
          </div>
        </div>
      </div>
    );
  }
}
