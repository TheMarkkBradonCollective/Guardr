export type PreviewScreenState = 'ready' | 'empty' | 'error';

/** `?state=empty` or `?state=error` on the surface preview harness. */
export function previewScreenState(): PreviewScreenState {
  if (typeof window === 'undefined') return 'ready';
  const state = new URLSearchParams(window.location.search).get('state');
  if (state === 'empty' || state === 'error') return state;
  return 'ready';
}
