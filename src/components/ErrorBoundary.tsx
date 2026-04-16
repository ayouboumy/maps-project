import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 max-w-sm w-full">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              The application encountered an unexpected error. This might be due to a recent update or a connection issue.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
              >
                <RefreshCw size={18} />
                Reload Application
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
            {this.state.error && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-[10px] font-mono text-gray-400 break-all bg-gray-50 p-2 rounded">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
