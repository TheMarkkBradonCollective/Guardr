import { Capacitor } from '@capacitor/core';

/** True for Capacitor Android/iOS shells (bundled UI, Supabase-first backends). */
export function isNativeAppShell(): boolean {
  return Capacitor.isNativePlatform();
}

/** Group chat / message REST fallbacks require guardr.co — skip on native when Supabase is enough. */
export function shouldUseSiteMessageApiFallback(isDbConnected: boolean): boolean {
  if (isNativeAppShell()) return false;
  return !isDbConnected;
}

/** Stripe, FCM fan-out, and cron still need the API host; registration and inbox can use Supabase. */
export function prefersDirectSupabaseBackend(): boolean {
  return isNativeAppShell();
}
