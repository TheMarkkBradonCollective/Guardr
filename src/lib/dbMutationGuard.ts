/** Suppresses debounced realtime reload briefly after a local write to avoid racing optimistic UI. */
let suppressRealtimeUntil = 0;
let activationUploadDepth = 0;

export function beginLocalMutation(holdMs = 3500): void {
  suppressRealtimeUntil = Date.now() + holdMs;
}

export function beginActivationUploadSession(): void {
  activationUploadDepth += 1;
}

export function endActivationUploadSession(): void {
  activationUploadDepth = Math.max(0, activationUploadDepth - 1);
}

export function isActivationUploadSessionActive(): boolean {
  return activationUploadDepth > 0;
}

export function shouldSkipRealtimeSync(): boolean {
  return activationUploadDepth > 0 || Date.now() < suppressRealtimeUntil;
}
