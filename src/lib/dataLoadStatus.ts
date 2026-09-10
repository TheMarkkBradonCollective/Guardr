type Listener = (message: string | null) => void;

let current: string | null = null;
const listeners = new Set<Listener>();

export function setDataLoadIssue(message: string | null): void {
  current = message;
  listeners.forEach((listener) => listener(current));
}

export function getDataLoadIssue(): string | null {
  return current;
}

export function subscribeDataLoadIssue(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

export function rosterRequestStatus(
  itemCount: number,
  loadIssue: string | null | undefined
): 'empty' | 'error' | 'ready' {
  if (loadIssue && itemCount === 0) return 'error';
  if (itemCount === 0) return 'empty';
  return 'ready';
}
