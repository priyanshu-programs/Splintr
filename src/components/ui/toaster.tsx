"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { Check, AlertCircle } from "lucide-react";

export type ToastType = "success" | "error";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a Toaster Provider");
  }
  return context;
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from(toastRef.current, {
        y: 25,
        opacity: 0,
        scale: 0.9,
        duration: 0.4,
        ease: "power3.out",
      });
    });

    const timer = setTimeout(() => {
      gsap.to(toastRef.current, {
        y: 15,
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => onDismiss(toast.id),
      });
    }, 3500);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [toast.id, onDismiss]);

  const handleManualDismiss = () => {
    gsap.to(toastRef.current, {
      y: 15,
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => onDismiss(toast.id),
    });
  };

  return (
    <div
      ref={toastRef}
      className={`relative z-[200] flex w-max max-w-[90vw] items-center gap-3 px-5 py-3 rounded-full shadow-2xl border backdrop-blur-xl text-sm font-medium ${
        toast.type === "success"
          ? "bg-white/90 dark:bg-[#111111]/90 border-black/10 dark:border-white/10 text-black dark:text-white"
          : "bg-white/90 dark:bg-[#111111]/90 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
      }`}
    >
      <div
        className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
          toast.type === "success"
            ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
            : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500"
        }`}
      >
        {toast.type === "success" ? (
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        ) : (
          <AlertCircle className="w-3.5 h-3.5" strokeWidth={3} />
        )}
      </div>
      <p className="tracking-tight">{toast.message}</p>
      <div className="w-px h-4 bg-black/10 dark:bg-white/15 mx-1" />
      <button
        onClick={handleManualDismiss}
        className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
      >
        <span className="sr-only">Close</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((options: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...options }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
