import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { AudiotoolProvider } from '@/lib/AudiotoolContext';
import Lark from './pages/Lark';

/** Catches runtime errors (e.g. SDK init) instead of a blank white screen. */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center"
          style={{ background: '#080808', color: '#f0eef6' }}
        >
          <p className="text-sm font-semibold">Lark failed to load</p>
          <p className="text-xs max-w-md opacity-70">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AudiotoolProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router basename={import.meta.env.BASE_URL}>
                <Routes>
                  <Route path="/" element={<Lark />} />
                  <Route path="*" element={<PageNotFound />} />
                </Routes>
              </Router>
              <Toaster />
            </QueryClientProvider>
          </AudiotoolProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App