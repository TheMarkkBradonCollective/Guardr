import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export type AppToastTone = 'success' | 'error' | 'info';

const TOAST_ICONS: Record<AppToastTone, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 shrink-0 text-green-500" strokeWidth={2} />,
  error: <AlertCircle className="w-4 h-4 shrink-0 text-red-500" strokeWidth={2} />,
  info: <Info className="w-4 h-4 shrink-0 text-brand-primary" strokeWidth={2} />,
};

export interface AppToastMessage {
  id: number;
  title: string;
  body?: string;
  tone: AppToastTone;
}

type Listener = (toast: AppToastMessage | null) => void;

let nextId = 1;
let activeToast: AppToastMessage | null = null;
const listeners = new Set<Listener>();
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const listener of listeners) listener(activeToast);
}

export function subscribeAppToast(listener: Listener): () => void {
  listeners.add(listener);
  listener(activeToast);
  return () => listeners.delete(listener);
}

export function showAppToast(
  title: string,
  options?: { body?: string; tone?: AppToastTone; durationMs?: number }
) {
  const toast: AppToastMessage = {
    id: nextId++,
    title,
    body: options?.body,
    tone: options?.tone ?? 'info',
  };
  activeToast = toast;
  emit();
  if (dismissTimer) clearTimeout(dismissTimer);
  dismissTimer = setTimeout(() => {
    if (activeToast?.id === toast.id) {
      activeToast = null;
      emit();
    }
  }, options?.durationMs ?? 5200);
}

export function dismissAppToast() {
  activeToast = null;
  emit();
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

export function AppToastHost() {
  const [toast, setToast] = useState<AppToastMessage | null>(null);

  useEffect(() => subscribeAppToast(setToast), []);

  if (!toast) return null;

  const host = (
    <div className="app-toast-host" role="status" aria-live="polite">
      <div className={`app-toast app-toast-${toast.tone}`}>
        {TOAST_ICONS[toast.tone]}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-snug">{toast.title}</p>
          {toast.body && <p className="text-xs mt-1 opacity-90 leading-relaxed">{toast.body}</p>}
        </div>
        <button type="button" onClick={dismissAppToast} className="app-toast-dismiss" aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return host;
  return createPortal(host, document.body);
}
