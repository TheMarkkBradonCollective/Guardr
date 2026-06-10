import { useEffect, useState } from 'react';
import { readThemeFromDocument, ThemeMode } from './theme';

/** Reactive theme — updates when user toggles Dark / Light / Shade */
export function useThemeMode(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>(readThemeFromDocument);

  useEffect(() => {
    const sync = () => setMode(readThemeFromDocument());
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return mode;
}
