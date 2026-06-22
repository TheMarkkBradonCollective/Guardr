/** Suppresses debounced realtime reload briefly after a local write to avoid racing optimistic UI. */
let suppressRealtimeUntil = 0;

export function beginLocalMutation(holdMs = 3500): void {
  suppressRealtimeUntil = Date.now() + holdMs;
}

export function shouldSkipRealtimeSync(): boolean {
  return Date.now() < suppressRealtimeUntil;
}
