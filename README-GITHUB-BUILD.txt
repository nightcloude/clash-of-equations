CLASH OF EQUATIONS — ANDROID / GITHUB ACTIONS

Build:
1. Upload the entire project to a GitHub repository.
2. Make sure .github/workflows/build-apk.yml exists.
3. Open GitHub -> Actions.
4. Select "Build Clash of Equations APK".
5. Click "Run workflow".
6. Download the "Clash-of-Equations-APK" artifact.
7. The artifact contains app-debug.apk.

The app is a WebView application and loads:
https://aeslms.space/math/

The project uses Java 17, Android SDK 35, and Gradle 8.11.1.
