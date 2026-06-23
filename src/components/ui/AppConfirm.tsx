import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppModal } from './motion/AppMotion';

export type AppConfirmTone = 'default' | 'danger';

export interface AppConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: AppConfirmTone;
}

export interface AppPromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  multiline?: boolean;
  inputType?: 'text' | 'number';
}

type DialogRequest =
  | { kind: 'confirm'; options: AppConfirmOptions; resolve: (value: boolean) => void }
  | { kind: 'prompt'; options: AppPromptOptions; resolve: (value: string | null) => void };

type Listener = (request: DialogRequest | null) => void;

let activeRequest: DialogRequest | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(activeRequest);
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(activeRequest);
  return () => listeners.delete(listener);
}

function dismissCurrent(value: boolean | string | null) {
  if (!activeRequest) return;
  const current = activeRequest;
  activeRequest = null;
  emit();
  if (current.kind === 'confirm') {
    current.resolve(Boolean(value));
  } else {
    current.resolve(typeof value === 'string' ? value : null);
  }
}

export function showAppConfirm(options: AppConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (activeRequest) {
      dismissCurrent(activeRequest.kind === 'confirm' ? false : null);
    }
    activeRequest = { kind: 'confirm', options, resolve };
    emit();
  });
}

export function showAppPrompt(options: AppPromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    if (activeRequest) {
      dismissCurrent(activeRequest.kind === 'confirm' ? false : null);
    }
    activeRequest = { kind: 'prompt', options, resolve };
    emit();
  });
}

function ConfirmDialogBody({
  options,
  onConfirm,
  onCancel,
}: {
  options: AppConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const danger = options.tone === 'danger';

  return (
    <div className="app-confirm-dialog">
      <h2 id={titleId} className="app-confirm-title">
        {options.title}
      </h2>
      {options.message ? <p className="app-confirm-message">{options.message}</p> : null}
      <div className="app-confirm-actions">
        <button type="button" onClick={onCancel} className="app-button-outline app-confirm-btn">
          {options.cancelLabel ?? 'Cancel'}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={danger ? 'app-button-danger app-confirm-btn' : 'app-button-primary app-confirm-btn'}
        >
          {options.confirmLabel ?? 'Confirm'}
        </button>
      </div>
    </div>
  );
}

function PromptDialogBody({
  options,
  onSubmit,
  onCancel,
}: {
  options: AppPromptOptions;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const [value, setValue] = useState(options.defaultValue ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(options.defaultValue ?? '');
    setError(null);
  }, [options.defaultValue, options.title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed && options.inputType !== 'number') {
      setError('This field is required.');
      return;
    }
    if (options.inputType === 'number') {
      const n = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(n) || n <= 0) {
        setError('Enter a valid positive number.');
        return;
      }
    }
    onSubmit(trimmed);
  };

  return (
    <form className="app-confirm-dialog" onSubmit={handleSubmit}>
      <h2 id={titleId} className="app-confirm-title">
        {options.title}
      </h2>
      {options.message ? <p className="app-confirm-message">{options.message}</p> : null}
      {options.multiline ? (
        <textarea
          className="uber-input w-full resize-none min-h-[5.5rem]"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder={options.placeholder}
          autoFocus
        />
      ) : (
        <input
          className="uber-input w-full"
          type={options.inputType === 'number' ? 'number' : 'text'}
          inputMode={options.inputType === 'number' ? 'numeric' : undefined}
          min={options.inputType === 'number' ? 1 : undefined}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder={options.placeholder}
          autoFocus
        />
      )}
      {error ? <p className="text-xs text-red-500 mt-2">{error}</p> : null}
      <div className="app-confirm-actions">
        <button type="button" onClick={onCancel} className="app-button-outline app-confirm-btn">
          {options.cancelLabel ?? 'Cancel'}
        </button>
        <button type="submit" className="app-button-primary app-confirm-btn">
          {options.confirmLabel ?? 'Continue'}
        </button>
      </div>
    </form>
  );
}

export function AppConfirmHost() {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  useEffect(() => subscribe(setRequest), []);

  if (!request) return null;

  const handleClose = () => {
    dismissCurrent(request.kind === 'confirm' ? false : null);
  };

  const dialog = (
    <AppModal open align="center" onClose={handleClose} panelClassName="app-confirm-panel" zIndex={2200}>
      {request.kind === 'confirm' ? (
        <ConfirmDialogBody
          options={request.options}
          onCancel={handleClose}
          onConfirm={() => dismissCurrent(true)}
        />
      ) : (
        <PromptDialogBody
          options={request.options}
          onCancel={handleClose}
          onSubmit={(value) => dismissCurrent(value)}
        />
      )}
    </AppModal>
  );

  return createPortal(dialog, document.body);
}
