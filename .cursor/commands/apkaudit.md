# /apkaudit — Android APK audit

Perform a complete **Android APK** audit (`shellKind: native`, Capacitor).

## Verify

### Native shell
- Native navigation and back-button behavior
- Material-style touch feedback and animations
- Safe areas and edge-to-edge layout (`app-native.css`)
- Device orientation (portrait / landscape)

### Permissions & integrations
- Camera, GPS, notifications, storage, biometrics (when available)
- FCM push (`@capacitor/push-notifications`)
- Deep links and app URL scheme

### Quality
- Authentication and session in native WebView
- Performance, memory usage, battery impact
- Crash prevention and error boundaries
- APK version matches `package.json` and `public/download/version.json`
- CI build without `ALLOW_APK_WITHOUT_FCM`

## Repair

- APK-specific and native UI issues
- Permission prompts and denied-state handling
- Performance and memory leaks
- Device compatibility issues

## Design target

**Premium mobile experience** — native feel, enhanced animations, full device integrations.

## Architecture

```
capacitor.config.ts, android/
src/lib/platform/nativePermissions.ts, nativeSafeArea.ts
src/styles/app-native.css
body[data-shell="native"], body[data-view-surface^="native-"]
npm run android:apk
```

## Branch & PR

- Branch: `cursor/apkaudit-<descriptive-name>-e760`

## APK audit report

- **APK Health Score** (1–10)
- **Device Compatibility Report**
- **Production Readiness Report**
- Issues found and fixed
- Recommendations
