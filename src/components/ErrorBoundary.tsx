import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
              <AlertCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado</h2>
            <p className="text-slate-600 mb-8">
              Ocorreu um erro inesperado na aplicação. Tente recarregar a página para continuar.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-600/20"
              >
                <RefreshCw className="h-5 w-5" />
                Recarregar Página
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                Tentar Novamente
              </button>
            </div>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mt-8 p-4 bg-slate-50 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-600 whitespace-pre-wrap">
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
