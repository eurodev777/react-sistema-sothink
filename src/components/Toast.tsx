import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface SingleToastProps {
  show: boolean;
  type: ToastType;
  title: string;
  description?: string;
  onClose: () => void;
}

export const Toast: React.FC<SingleToastProps> = ({ show, type, title, description, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-white dark:bg-slate-900 shadow-emerald-500/10',
    error: 'border-rose-500/30 bg-white dark:bg-slate-900 shadow-rose-500/10',
    info: 'border-sky-500/30 bg-white dark:bg-slate-900 shadow-sky-500/10',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 pointer-events-none">
      <div
        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${
          borders[type]
        }`}
      >
        {icons[type]}
        <div className="flex-1 text-xs">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{title}</h4>
          {description && (
            <p className="text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-white dark:bg-slate-900 shadow-emerald-500/10',
    error: 'border-rose-500/30 bg-white dark:bg-slate-900 shadow-rose-500/10',
    info: 'border-sky-500/30 bg-white dark:bg-slate-900 shadow-sky-500/10',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${
        borders[toast.type]
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{toast.title}</h4>
        {toast.description && (
          <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-xs">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
