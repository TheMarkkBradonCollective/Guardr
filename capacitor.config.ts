/**
 * Capacitor shell config — used when wrapping the Vite build for App Store / Play Store.
 *
 * Setup (step 5 of cross-platform roadmap):
 *   npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
 *   npx cap init
 *   npm run build && npx cap sync
 */
const config = {
  appId: 'com.signaturesecurity.guardr',
  appName: 'Guardr',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#000000',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
  },
};

export default config;
