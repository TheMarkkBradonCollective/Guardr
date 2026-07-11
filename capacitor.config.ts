/**
 * Capacitor shell config — wraps the Vite build for Android APK / iOS.
 *
 * Build APK:
 *   npm run android:apk
 *
 * Sync after web changes:
 *   npm run build && npx cap sync android
 */
const config = {
  appId: 'com.signaturesecurity.guardr',
  appName: 'Guardr',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#5E7B61',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#5E7B61',
    },
  },
};

export default config;
