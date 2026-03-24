'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="max-w-md space-y-4">
            <p className="text-5xl">😔</p>
            <h2 className="text-2xl font-bold text-charcoal">Something went wrong</h2>
            <p className="text-text-secondary text-sm">
              An unexpected error occurred. Please try reloading the page.
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-surface-alt p-3 text-left text-xs text-text-muted">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={this.handleReset}>Try again</Button>
              <Button variant="outline" onClick={() => window.location.assign('/')}>
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
