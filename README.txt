CLASH OF EQUATIONS - ANDROID APP
=================================

This Android Studio project wraps the existing Clash of Equations web game.

APP NAME:
Clash of Equations

PACKAGE:
com.aeslms.clashofequations

WHAT IT DOES:
- Full-screen Android WebView
- JavaScript enabled
- DOM/local storage enabled
- Audio enabled
- Internet permission enabled
- Android back button support
- Splash screen
- Uses the supplied Clash of Equations artwork as the launcher icon and splash artwork
- Loads the live game at:
  https://aeslms.space/math/

WHY THE LIVE URL IS USED:
The supplied game code uses the same website for its leaderboard APIs:
  /api/leaderboard
  /api/submit-score
Loading the live site keeps the existing Cloudflare Worker/D1 leaderboard and the exact current game behavior working without introducing CORS problems.

SOURCE SNAPSHOT:
app/src/main/assets/worker_source.js
app/src/main/assets/source_game.html

BUILD:
1. Open this folder in Android Studio.
2. Allow Gradle sync.
3. Build > Build Bundle(s) / APK(s) > Build APK(s).
4. The debug APK will be:
   app/build/outputs/apk/debug/app-debug.apk

AUTOMATIC BUILD:
A GitHub Actions workflow is included at:
.github/workflows/build-apk.yml

It builds app-debug.apk automatically when run manually or pushed to main/master.
