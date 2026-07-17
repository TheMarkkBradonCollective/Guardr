import { useEffect, useState } from 'react';

/** Tracks navigator.onLine and mirrors it to body[data-online] for CSS + banners. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  );

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.dataset.online = online ? 'true' : 'false';
  }, [online]);

  return online;
}
