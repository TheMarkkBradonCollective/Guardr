/**
 * Capacitor shell — loads the Guardr UI from the Cloudflare Worker origin.
 */
const WORKER_ORIGIN =
  process.env.VITE_APP_URL?.trim().replace(/\/$/, '') ||
  'https://guardr.themarkkbrandoncollective-2d9.workers.dev';

const config = {
  appId: 'com.tmbcworks.guardr',
  appName: 'Guardr',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: WORKER_ORIGIN,
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    adjustMarginsForEdgeToEdge: 'auto',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: false,
    },
  },
};

export default config;
