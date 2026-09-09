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
    // Keep WebView above system nav (home/back/recents) on Android 15+ edge-to-edge.
    adjustMarginsForEdgeToEdge: 'auto',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 0,
      // Hire/Work default. Staff APK builds patch this to #FFFFFF.
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      // Light (white) status-bar icons on the black Hire/Work splash.
      // Capacitor: Style.Dark = light icons; Style.Light = dark icons.
      // Staff builds patch style to LIGHT and background to #FFFFFF.
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: false,
    },
  },
};

export default config;
