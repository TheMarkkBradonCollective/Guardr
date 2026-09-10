/** True when the page is running as an installed PWA (standalone / iOS home screen). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
  } catch {
    /* matchMedia unavailable */
  }
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}
