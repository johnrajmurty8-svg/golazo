export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

export const toastStore = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  getAll() {
    return [...toasts];
  },
};

function add(message: string, variant: ToastVariant, duration = 4000) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, variant }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, duration);
}

export const toast = {
  success: (message: string) => add(message, "success"),
  error: (message: string) => add(message, "error"),
  warning: (message: string) => add(message, "warning"),
  info: (message: string) => add(message, "info"),
};
