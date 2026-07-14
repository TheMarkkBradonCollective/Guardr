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

export default defineConfig(() => {
  return {
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
      'import.meta.env.VITE_NATIVE_FCM_CONFIGURED': JSON.stringify(nativeFcmConfigured ? 'true' : 'false'),
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
        output: {
          manualChunks: {
            'vendor-map': ['leaflet', 'react-leaflet'],
            'vendor-motion': ['motion'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  };
});
