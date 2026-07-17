import type { SnackbarElementProps } from 'baseui/snackbar';

type EnqueueFn = (elementProps: SnackbarElementProps, duration?: number) => void;
type DequeueFn = () => void;

let enqueueRef: EnqueueFn | null = null;
let dequeueRef: DequeueFn | null = null;

export function registerSnackbarHandlers(enqueue: EnqueueFn | null, dequeue: DequeueFn | null): void {
  enqueueRef = enqueue;
  dequeueRef = dequeue;
}

export function enqueueSnackbar(elementProps: SnackbarElementProps, duration?: number): void {
  enqueueRef?.(elementProps, duration);
}

export function dequeueSnackbar(): void {
  dequeueRef?.();
}
