import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  X,
  Trash2,
  Sparkles
} from 'lucide-react';

const ToastContext = createContext({
  addToast: () => {},
  removeToast: () => {}
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 3500 }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast = { id, title, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'trash':
        return <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Global Floating Toast Container */}
      <aside
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 p-3.5 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-2xl shadow-xl border border-slate-800/80 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="p-1 rounded-lg bg-white/10 shrink-0 mt-0.5">
              {getToastIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <p className="font-semibold text-slate-100 leading-tight">
                  {toast.title}
                </p>
              )}
              {toast.message && (
                <p className={`text-slate-300 ${toast.title ? 'mt-0.5' : ''} leading-normal`}>
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
};
