import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphMedium } from 'baseui/typography';
import { Textarea } from 'baseui/textarea';
import { GuardrButton } from '../baseui/GuardrButton';
import { GuardrInput } from '../baseui/GuardrInput';
import { GuardrModal } from '../baseui/overlays/GuardrModal';

export type AppConfirmTone = 'default' | 'danger';
export type AppAlertTone = 'default' | 'warning';

export interface AppAlertOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  tone?: AppAlertTone;
}

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
  | { kind: 'prompt'; options: AppPromptOptions; resolve: (value: string | null) => void }
  | { kind: 'alert'; options: AppAlertOptions; resolve: () => void };

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
  } else if (current.kind === 'prompt') {
    current.resolve(typeof value === 'string' ? value : null);
  } else {
    current.resolve();
  }
}

export function dismissAppConfirm(value: boolean | string | null = false): boolean {
  if (!activeRequest) return false;
  if (activeRequest.kind === 'alert') {
    dismissCurrent(null);
    return true;
  }
  dismissCurrent(value);
  return true;
}

export function isAppConfirmActive(): boolean {
  return activeRequest != null;
}

export function showAppConfirm(options: AppConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (activeRequest) {
      dismissCurrent(activeRequest.kind === 'confirm' ? false : activeRequest.kind === 'prompt' ? null : null);
    }
    activeRequest = { kind: 'confirm', options, resolve };
    emit();
  });
}

export function showAppPrompt(options: AppPromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    if (activeRequest) {
      dismissCurrent(activeRequest.kind === 'confirm' ? false : activeRequest.kind === 'prompt' ? null : null);
    }
    activeRequest = { kind: 'prompt', options, resolve };
    emit();
  });
}

export function showAppAlert(options: AppAlertOptions): Promise<void> {
  return new Promise((resolve) => {
    if (activeRequest) {
      dismissCurrent(activeRequest.kind === 'confirm' ? false : activeRequest.kind === 'prompt' ? null : null);
    }
    activeRequest = { kind: 'alert', options, resolve };
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
    <Block padding="scale800" className="app-confirm-dialog">
      <HeadingSmall id={titleId} marginTop="0" marginBottom="scale400">
        {options.title}
      </HeadingSmall>
      {options.message ? (
        <ParagraphMedium $style={{ color: 'contentSecondary', marginBottom: 'scale600' }}>{options.message}</ParagraphMedium>
      ) : null}
      <Block display="flex" gridGap="scale400" justifyContent="flex-end" flexWrap>
        <GuardrButton kind="secondary" size="compact" onClick={onCancel}>
          {options.cancelLabel ?? 'Cancel'}
        </GuardrButton>
        <GuardrButton kind={danger ? 'danger' : 'primary'} size="compact" onClick={onConfirm}>
          {options.confirmLabel ?? 'Confirm'}
        </GuardrButton>
      </Block>
    </Block>
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
    <Block as="form" padding="scale800" className="app-confirm-dialog" onSubmit={handleSubmit}>
      <HeadingSmall id={titleId} marginTop="0" marginBottom="scale400">
        {options.title}
      </HeadingSmall>
      {options.message ? (
        <ParagraphMedium $style={{ color: 'contentSecondary', marginBottom: 'scale500' }}>{options.message}</ParagraphMedium>
      ) : null}
      {options.multiline ? (
        <Textarea
          value={value}
          onChange={(e) => {
            setValue(e.currentTarget.value);
            setError(null);
          }}
          placeholder={options.placeholder}
          overrides={{ Input: { props: { autoFocus: true } } }}
        />
      ) : (
        <GuardrInput
          value={value}
          onChange={(e) => {
            setValue(e.currentTarget.value);
            setError(null);
          }}
          placeholder={options.placeholder}
          type={options.inputType === 'number' ? 'number' : 'text'}
          overrides={{ Input: { props: { autoFocus: true } } }}
        />
      )}
      {error ? (
        <ParagraphMedium $style={{ color: 'negative', fontSize: '12px', marginTop: 'scale300' }}>{error}</ParagraphMedium>
      ) : null}
      <Block display="flex" gridGap="scale400" justifyContent="flex-end" marginTop="scale600" flexWrap>
        <GuardrButton kind="secondary" size="compact" type="button" onClick={onCancel}>
          {options.cancelLabel ?? 'Cancel'}
        </GuardrButton>
        <GuardrButton kind="primary" size="compact" type="submit">
          {options.confirmLabel ?? 'Continue'}
        </GuardrButton>
      </Block>
    </Block>
  );
}

function AlertDialogBody({
  options,
  onClose,
}: {
  options: AppAlertOptions;
  onClose: () => void;
}) {
  const titleId = useId();
  const warning = options.tone === 'warning';

  return (
    <Block
      padding="scale800"
      className={`app-confirm-dialog${warning ? ' app-confirm-dialog--warning' : ''}`}
    >
      <HeadingSmall id={titleId} marginTop="0" marginBottom="scale400">
        {options.title}
      </HeadingSmall>
      {options.message ? (
        <ParagraphMedium $style={{ color: 'contentSecondary', marginBottom: 'scale600' }}>{options.message}</ParagraphMedium>
      ) : null}
      <Block display="flex" justifyContent="flex-end">
        <GuardrButton kind="primary" size="compact" onClick={onClose}>
          {options.confirmLabel ?? 'OK'}
        </GuardrButton>
      </Block>
    </Block>
  );
}

export function AppConfirmHost() {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  useEffect(() => subscribe(setRequest), []);

  if (!request) return null;

  const handleClose = () => {
    dismissCurrent(request.kind === 'confirm' ? false : request.kind === 'prompt' ? null : null);
  };

  const dialog = (
    <GuardrModal open align="center" onClose={handleClose} panelClassName="app-confirm-panel" zIndex={2200}>
      {request.kind === 'confirm' ? (
        <ConfirmDialogBody
          options={request.options}
          onCancel={handleClose}
          onConfirm={() => dismissCurrent(true)}
        />
      ) : request.kind === 'prompt' ? (
        <PromptDialogBody
          options={request.options}
          onCancel={handleClose}
          onSubmit={(value) => dismissCurrent(value)}
        />
      ) : (
        <AlertDialogBody options={request.options} onClose={handleClose} />
      )}
    </GuardrModal>
  );

  return createPortal(dialog, document.body);
}
