# /setupapk — Build or rebuild the Android APK

Build or rebuild the **Android APK** (`shellKind: native`, Capacitor).

## Create

- Native-style navigation and back-button handling
- Material Design touch feedback
- Permissions flow (camera, GPS, notifications; storage/biometrics when added)
- FCM push notifications
- Device integrations (camera, GPS)

## Optimize

- Performance, battery, and memory
- Enhanced animations and native interactions
- Edge-to-edge safe areas (`app-native.css`, `nativeSafeArea.ts`)
- APK binary version sync with `package.json`
- Premium haptic confirm via Vibration API (`nativeHaptics.ts`)

## Deliver

- Premium Android experience with all supported native features
- `capacitor.config.ts` and `android/` project config
- CI APK build (no `ALLOW_APK_WITHOUT_FCM`)

## Rules

- Gate install prompts with `shellKind !== 'native'`
- Run `npm run lint`, `npm test`, and verify `npm run android:apk` when applicable

## Branch & PR

- Branch: `cursor/setupapk-<descriptive-name>-e760`

## Report back

- APK features built or updated
- Permissions and push verification
- Version/build info
- Test/lint status
