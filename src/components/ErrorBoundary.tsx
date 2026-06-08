import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

// Global error log (persists across sessions)
class ErrorLogger {
  static log(error: Error, componentStack?: string) {
    const entry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack,
    };

    try {
      const logs = JSON.parse(localStorage.getItem('erp_error_log') || '[]');
      logs.push(entry);
      if (logs.length > 100) logs.shift(); // Keep last 100 errors
      localStorage.setItem('erp_error_log', JSON.stringify(logs));
    } catch {}

    console.error('[ERP Error]', entry);
  }

  static getAll(): any[] {
    try {
      return JSON.parse(localStorage.getItem('erp_error_log') || '[]');
    } catch { return []; }
  }

  static clear() {
    localStorage.removeItem('erp_error_log');
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    ErrorLogger.log(error, errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4" dir="rtl">
          <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-8 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-red-900">خطای سیستمی</h1>
                <p className="text-sm text-slate-500">متأسفانه یک خطای غیرمنتظره رخ داد</p>
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-red-50 p-4">
              <p className="mb-2 text-sm font-semibold text-red-900">پیام خطا:</p>
              <p className="text-sm text-red-800">{this.state.error?.message}</p>
            </div>

            {this.state.errorInfo?.componentStack && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
                  جزئیات فنی (Stack Trace)
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                تلاش مجدد
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                بارگذاری مجدد صفحه
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              این خطا به طور خودکار در گزارش‌های سیستم ثبت شد.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Utility function for manual error logging
export function logError(error: Error, context?: string) {
  ErrorLogger.log(error, context);
}

export function getErrorLogs() {
  return ErrorLogger.getAll();
}

export function clearErrorLogs() {
  ErrorLogger.clear();
}
