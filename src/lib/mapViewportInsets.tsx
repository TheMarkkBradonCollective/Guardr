import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

export type MapViewportInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const DEFAULT_INSETS: MapViewportInsets = {
  top: 72,
  right: 56,
  bottom: 24,
  left: 56,
};

type MapViewportInsetsContextValue = {
  insets: MapViewportInsets;
  setBottomInset: (px: number) => void;
  setTopInset: (px: number) => void;
  userMoved: boolean;
  markUserMoved: () => void;
  resetUserMoved: () => void;
};

const MapViewportInsetsContext = createContext<MapViewportInsetsContextValue | null>(null);

export function MapViewportInsetsProvider({ children }: { children: React.ReactNode }) {
  const [bottomInset, setBottomInsetState] = useState(DEFAULT_INSETS.bottom);
  const [topInset, setTopInsetState] = useState(DEFAULT_INSETS.top);
  const [userMoved, setUserMoved] = useState(false);

  const setBottomInset = useCallback((px: number) => {
    setBottomInsetState(Math.max(0, Math.ceil(px)));
  }, []);

  const setTopInset = useCallback((px: number) => {
    setTopInsetState(Math.max(0, Math.ceil(px)));
  }, []);

  const markUserMoved = useCallback(() => setUserMoved(true), []);
  const resetUserMoved = useCallback(() => setUserMoved(false), []);

  const value = useMemo<MapViewportInsetsContextValue>(
    () => ({
      insets: {
        top: topInset,
        right: DEFAULT_INSETS.right,
        bottom: bottomInset,
        left: DEFAULT_INSETS.left,
      },
      setBottomInset,
      setTopInset,
      userMoved,
      markUserMoved,
      resetUserMoved,
    }),
    [bottomInset, topInset, userMoved, setBottomInset, setTopInset, markUserMoved, resetUserMoved]
  );

  return (
    <MapViewportInsetsContext.Provider value={value}>{children}</MapViewportInsetsContext.Provider>
  );
}

export function useMapViewportInsets(): MapViewportInsetsContextValue {
  const ctx = useContext(MapViewportInsetsContext);
  if (!ctx) {
    return {
      insets: DEFAULT_INSETS,
      setBottomInset: () => {},
      setTopInset: () => {},
      userMoved: false,
      markUserMoved: () => {},
      resetUserMoved: () => {},
    };
  }
  return ctx;
}

/** Observe an overlay element and publish its height as the map bottom inset. */
export function useMapBottomOverlayInset(
  enabled: boolean,
  extraPadding = 16
): React.RefCallback<HTMLElement | null> {
  const { setBottomInset } = useMapViewportInsets();
  const observerRef = useRef<ResizeObserver | null>(null);

  return useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!enabled || !node) {
        setBottomInset(DEFAULT_INSETS.bottom);
        return;
      }

      const measure = () => {
        const rect = node.getBoundingClientRect();
        const mapRoot = node.closest('.guard-map-layout, .client-map-layout');
        const mapRect = mapRoot?.getBoundingClientRect();
        if (!mapRect) {
          setBottomInset(rect.height + extraPadding);
          return;
        }
        const inset = Math.max(0, mapRect.bottom - rect.top + extraPadding);
        setBottomInset(inset);
      };

      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      observerRef.current = observer;
    },
    [enabled, extraPadding, setBottomInset]
  );
}

/** Publish top chrome height (filter stepper, route banner, etc.). */
export function useMapTopOverlayInset(
  enabled: boolean,
  extraPadding = 12
): React.RefCallback<HTMLElement | null> {
  const { setTopInset } = useMapViewportInsets();
  const observerRef = useRef<ResizeObserver | null>(null);

  return useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!enabled || !node) {
        setTopInset(DEFAULT_INSETS.top);
        return;
      }

      const measure = () => {
        const rect = node.getBoundingClientRect();
        const mapRoot = node.closest('.guard-map-layout, .client-map-layout');
        const mapRect = mapRoot?.getBoundingClientRect();
        if (!mapRect) {
          setTopInset(rect.bottom + extraPadding);
          return;
        }
        const inset = Math.max(0, rect.bottom - mapRect.top + extraPadding);
        setTopInset(inset);
      };

      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      observerRef.current = observer;
    },
    [enabled, extraPadding, setTopInset]
  );
}
