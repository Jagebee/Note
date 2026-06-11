'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-card/50 px-6 py-16 text-center backdrop-blur-sm">
          <p className="text-3xl">⚠️</p>
          <p className="mt-3 text-lg font-medium text-white">加载出错了</p>
          <p className="mt-1 text-sm text-zinc-400">请重试或刷新页面</p>
          <button
            className="btn-primary mt-5"
            onClick={this.handleRetry}
            type="button"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
