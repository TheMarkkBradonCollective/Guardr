import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { existsSync, readFileSync } from 'node:fs';
import {defineConfig} from 'vite';

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));
const googleServicesPath = path.resolve(__dirname, 'android/app/google-services.json');
const nativeFcmConfigured =
  process.env.VITE_NATIVE_FCM_CONFIGURED === 'true' ||
  (process.env.VITE_NATIVE_FCM_CONFIGURED !== 'false' && existsSync(googleServicesPath));
const playStoreBuild = process.env.VITE_PLAY_STORE_BUILD === 'true';
const productApp =
  process.env.VITE_PRODUCT_APP === 'client' ||
  process.env.VITE_PRODUCT_APP === 'guard' ||
  process.env.VITE_PRODUCT_APP === 'staff'
    ? process.env.VITE_PRODUCT_APP
    : '';

export default defineConfig(() => {
  return {
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
      'import.meta.env.VITE_NATIVE_FCM_CONFIGURED': JSON.stringify(nativeFcmConfigured ? 'true' : 'false'),
      'import.meta.env.VITE_PLAY_STORE_BUILD': JSON.stringify(playStoreBuild ? 'true' : 'false'),
      'import.meta.env.VITE_PRODUCT_APP': JSON.stringify(productApp),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Split heavy vendor libraries so the initial app shell loads faster and
      // long-lived dependencies stay cached across deploys.
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('/leaflet') || id.includes('/react-leaflet')) {
              return 'vendor-map';
            }
            if (id.includes('/motion/')) return 'vendor-motion';
            if (id.includes('/@supabase/')) return 'vendor-supabase';
            if (id.includes('/lucide-react/')) return 'vendor-icons';
            if (
              id.includes('/baseui/') ||
              id.includes('/styletron-react/') ||
              id.includes('/styletron-engine-monolithic/')
            ) {
              return 'vendor-baseweb';
            }
          },
        },
      },
    },
  };
});
