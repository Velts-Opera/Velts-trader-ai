import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RootErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col items-center justify-center p-6 font-mono text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 text-xl font-bold mb-4">
            !
          </div>
          <h1 className="text-lg font-bold text-white mb-2">Recuperação de Interface - VELTS TRADER</h1>
          <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed font-sans">
            Ocorreu uma instabilidade pontual na renderização. Clique abaixo para reiniciar a sessão em modo seguro (Paper Trading local).
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-colors cursor-pointer"
          >
            Reiniciar Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
