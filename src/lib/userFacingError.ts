/**
 * Map unknown failures onto short, non-technical copy.
 * Never surface raw backend / stack traces to the user.
 */
export function userFacingError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error == null) return fallback;
  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : '';
  const message = raw.trim();
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    lower.includes('could not reach')
  ) {
    return 'Could not reach Guardr. Check your connection and try again.';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'That took too long. Check your connection and try again.';
  }
  if (lower.includes('abort')) {
    return 'The request was interrupted. Try again.';
  }
  if (lower.includes('unauthorized') || lower.includes('not authenticated') || lower.includes('jwt')) {
    return 'Your session expired. Sign in again to continue.';
  }
  if (lower.includes('forbidden') || lower.includes('not allowed') || lower.includes('permission')) {
    return 'You do not have permission to do that.';
  }
  if (lower.includes('not found') || lower.includes('no rows') || /\b404\b/.test(lower)) {
    return 'We could not find that record. It may have been removed.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many requests. Wait a moment and try again.';
  }
  if (lower.includes('payload too large') || lower.includes('file too large')) {
    return 'That file is too large. Try a smaller file.';
  }
  if (
    lower.includes('function_invocation_failed') ||
    lower.includes('internal server') ||
    lower.includes('econnreset') ||
    /\b50[0-9]\b/.test(lower)
  ) {
    return 'Guardr is temporarily unavailable. Please try again in a moment.';
  }
  if (
    /select |insert |update |delete |supabase|postgres|stack|at http|node_modules|\/api\/|relation |column /i.test(
      message,
    ) ||
    message.length > 180
  ) {
    return fallback;
  }
  return message;
}

export function isOfflineError(error: unknown): boolean {
  const message = userFacingError(error).toLowerCase();
  return message.includes('connection') || message.includes('offline') || message.includes('reach guardr');
}
