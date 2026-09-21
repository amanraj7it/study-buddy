import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 4500),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
                t.type === 'success'
                  ? 'bg-[#11101A]/95 border-[#34D399]/40 text-[#F5F3F7]'
                  : t.type === 'error'
                  ? 'bg-[#11101A]/95 border-[#F87171]/40 text-[#F5F3F7]'
                  : t.type === 'warning'
                  ? 'bg-[#11101A]/95 border-[#FBBF24]/40 text-[#F5F3F7]'
                  : 'bg-[#11101A]/95 border-[#8B5CF6]/40 text-[#F5F3F7]'
              }`}
            >
              <div className="flex items-center gap-3">
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 text-[#F87171] shrink-0" />}
                {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#FBBF24] shrink-0" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-[#8B5CF6] shrink-0" />}
                <p className="text-sm font-medium text-[#F5F3F7]">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-[#8F889D] hover:text-[#F5F3F7] p-1 rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
