# 말로일정 store app (Android / iOS)

The store app is a Capacitor shell that loads the production site
(`https://delivery-app-fe-kohl.vercel.app`, set in `capacitor.config.ts`).

- **Web changes** (pages, speech logic, styles): deploy to Vercel production as usual.
  Installed apps pick them up on next launch, with no store release.
- **Native changes** (`capacitor.config.ts`, `android/`, `ios/`, Capacitor plugins,
  app icon/splash): need a new store build, as described below.

Inside the app, the web view has no Web Speech API, so `lib/speech/native-recognition.ts`
and `lib/speech/tts.ts` use the phone's speech recogniser and TTS instead
(`isNativeApp()` in `lib/native/platform.ts`). Browsers keep using the Web Speech API.

| | |
| --- | --- |
| App ID / bundle ID | `net.opuscore.malloiljeong` (permanent) |
| Android upload key | `D:\docker-projects\Delivery-app\mobile-signing\` (not in git, **back it up**) |
| Icons / splash source | `resources/` → `npx @capacitor/assets generate --iconBackgroundColor '#ffffff' --splashBackgroundColor '#1b3358' --splashBackgroundColorDark '#1b3358'` (then delete the generated `icons/` folder and `public/manifest.webmanifest`) |

## Android release (Windows)

Needs JDK 21 and the Android SDK (`%LOCALAPPDATA%\Android\Sdk`).
`android/local.properties` and `android/keystore.properties` are local only.

1. Raise `versionCode` (+1 every upload) and `versionName` in `android/app/build.gradle`.
2. Build:
   ```sh
   npx cap sync android
   cd android
   JAVA_HOME="/c/Program Files/Java/jdk-21" ./gradlew.bat bundleRelease
   ```
3. Upload `android/app/build/outputs/bundle/release/app-release.aab` in Play Console.

## iOS release (Codemagic)

One-time setup:
1. Enrol in the Apple Developer Program.
2. In App Store Connect, create the app with bundle ID `net.opuscore.malloiljeong`.
3. Create an App Store Connect API key (Users and Access → Integrations, App Manager role)
   and add it in Codemagic → Team settings → Integrations, named `malloiljeong`.
4. Add this repository to Codemagic. It reads `codemagic.yaml`.

Each release: raise `MARKETING_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` when
the visible version changes, push, and start the `ios-release` workflow in Codemagic.
The build appears in TestFlight. Submit it for review from App Store Connect.
