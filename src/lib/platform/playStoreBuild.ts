/** True when the native shell was built with the Play Store flavor (no sideload APK updates). */
export function isPlayStoreBuild(): boolean {
  return import.meta.env.VITE_PLAY_STORE_BUILD === 'true';
}
