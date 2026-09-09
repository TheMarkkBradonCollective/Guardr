/**
 * Capacitor shell config — wraps the Vite build for Android APK / iOS.
 *
 * Sideload three role APKs + zip:
 *   npm run android:apk:all
 *
 * Single role:
 *   node scripts/build-android-apk.mjs --role=guard
 *
 * Sync after web changes:
 *   npm run build && npx cap sync android
 *
 * Capacitor appId stays the base package. Gradle `role` flavors add
 * applicationIdSuffix so Client, Guard, and Staff install side by side.
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
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      // Light (white) status-bar icons on the black APK splash/shell.
      // Capacitor: Style.Dark = light icons; Style.Light = dark icons.
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: false,
    },
  },
};

export default config;
