import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isAppExperience } from './platform/appExperience';
import {
  applyProductAppToDocument,
  parseBakedNativeProductApp,
  persistProductApp,
  productAppFromPath,
  readStoredProductApp,
  resolveProductApp,
  type ProductApp,
} from './productApps';

interface ProductAppContextValue {
  productApp: ProductApp;
  setProductApp: (app: ProductApp) => void;
}

const ProductAppContext = createContext<ProductAppContextValue>({
  productApp: 'website',
  setProductApp: () => {},
});

function readCurrentProductApp(): ProductApp {
  if (typeof window === 'undefined') return 'website';
  const baked = parseBakedNativeProductApp(window.__GUARDR_NATIVE_PRODUCT_APP__);
  const resolved = resolveProductApp({
    url: window.location.pathname + window.location.search,
    isInstalledShell: isAppExperience(),
    stored: readStoredProductApp(),
    baked,
  });
  if (baked) persistProductApp(baked);
  return resolved;
}

export function ProductAppProvider({ children }: { children: React.ReactNode }) {
  const [productApp, setProductAppState] = useState<ProductApp>(() => {
    const initial = readCurrentProductApp();
    applyProductAppToDocument(initial);
    return initial;
  });

  useEffect(() => {
    applyProductAppToDocument(productApp);
  }, [productApp]);

  useEffect(() => {
    const sync = () => {
      const next = readCurrentProductApp();
      setProductAppState((current) => (current === next ? current : next));
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const value = useMemo<ProductAppContextValue>(
    () => ({
      productApp,
      setProductApp: (app) => {
        persistProductApp(app);
        applyProductAppToDocument(app);
        setProductAppState(app);
      },
    }),
    [productApp],
  );

  return <ProductAppContext.Provider value={value}>{children}</ProductAppContext.Provider>;
}

export function useProductApp(): ProductAppContextValue {
  return useContext(ProductAppContext);
}

export function syncProductAppFromLocation(): ProductApp {
  const app = productAppFromPath(
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );
  applyProductAppToDocument(app);
  return app;
}
