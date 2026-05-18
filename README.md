# MindVault

**Unlock every vault. Challenge your mind.**

MindVault is an IQ-style brain puzzle game for Android. It challenges your logic, memory, word skills, and pattern recognition across multiple vault modes. MindVault is entertainment software and is NOT a certified IQ test, a professional cognitive assessment, or a clinical intelligence measurement tool.

---

## Features

- Four Vault Modes: Logic, Memory, Word, and Pattern puzzles
- Daily Vault with a fresh challenge that resets every 24 hours
- Local scoring and streak tracking (stored on device, never uploaded)
- Unlockable themes earned through gameplay
- Result sharing via the Android share sheet (user-initiated only)
- No account required, no login, no backend server
- Core gameplay works offline
- Banner ads via Google AdMob (no interstitials or rewarded ads in v1)

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Bare React Native (TypeScript) |
| Navigation | React Navigation |
| Local storage | AsyncStorage |
| Ads | react-native-google-mobile-ads |
| Build tool | Gradle (Android) |
| Language | TypeScript |

---

## AdMob Configuration

| Item | Value |
|---|---|
| AdMob App ID | ca-app-pub-7831002909037560~9376774674 |
| Banner Ad Unit ID | ca-app-pub-7831002909037560/6489618814 |
| Publisher ID | pub-7831002909037560 |
| app-ads.txt seller line | google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0 |

All AdMob configuration is centralized in `src/config/admob.ts`.

### Debug vs. Production Ads

- Debug builds (`__DEV__ === true`): Google's official test banner ID is used automatically. Test ads generate no revenue.
- Production / release builds (`__DEV__ === false`): The production banner ad unit ID above is used automatically.

No manual changes are needed when switching between debug and release. The `getBannerAdUnitId()` function in `src/config/admob.ts` handles this automatically.

---

## app-ads.txt

The app-ads.txt seller line for this app is:

```
google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0
```

**Important:** app-ads.txt is NOT bundled inside the APK. It is a plain text file that must be hosted at the root of your developer website domain:

```
https://[your-developer-website]/app-ads.txt
```

The developer website URL must match the website in your Google Play Console developer profile. See `store_assets/app-ads-txt-notes.md` for full setup instructions.

---

## Social Sharing

MindVault allows users to share puzzle results using the Android system share sheet. Sharing is entirely user-initiated and only occurs when the user taps the Share button. The app does not auto-share, upload, or transmit results to any server.

---

## No Login, No Backend

MindVault has no backend server, no API login, no cloud sync, and no user accounts. All app data is stored locally on the device using AsyncStorage.

---

## Setup Instructions

### Prerequisites

- Node.js 18 or later
- Android Studio with Android SDK
- JDK 17 (Android Studio bundled JDK is recommended)
- React Native CLI environment set up per the official React Native docs

### Install Dependencies

```bash
npm install
```

### Start Metro (Development)

```bash
npm start
```

### Run on Android (Development)

```bash
npm run android
```

### Build Release APK

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Build Release AAB (for Play Store upload)

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## release.py: Release Automation Script

The `release.py` script automates the full release process. It requires only Python 3 and the Python standard library (no pip installs needed).

### Usage

```bash
# Full build: check env, sign, build APK + AAB, copy artifacts, print summary
python release.py

# Skip Gradle build, just copy existing artifacts and store assets
python release.py --skip-build

# Print environment check and exit (no build)
python release.py --check-env

# Generate signing keystore only, then exit
python release.py --generate-key-only

# Clean Gradle before building
python release.py --clean

# Skip Gradle clean before building
python release.py --no-clean
```

### What release.py does

1. Locates the project directory
2. Finds and configures JAVA_HOME and keytool
3. Finds and configures the Android SDK and writes android/local.properties
4. Prepares the signing keystore (generates one with strong random passwords if it does not exist)
5. Verifies AdMob configuration in src/config/admob.ts
6. Runs Gradle assembleRelease and bundleRelease
7. Copies the APK and AAB to releases/builds/v1.0.0/
8. Copies store assets to releases/store-assets/
9. Prints a final summary with all artifact paths and reminders

### Signing Keystore

The release keystore is stored at:

```
android/keystore/mindvault-release.keystore
```

Keystore properties are stored at:

```
android/keystore/keystore.properties
```

Both files are excluded from version control via .gitignore. Back up the keystore and its passwords securely. Loss of the keystore means you cannot update the app on Google Play.

---

## Store Assets

All Google Play Store listing files are in `mindvault/store_assets/`:

| File | Purpose |
|---|---|
| store-listing.md | Full store listing reference document |
| short-description.txt | Play Store short description (80 char max) |
| full-description.txt | Play Store full description |
| promo-text.txt | Optional promotional text |
| release-notes.txt | What's new / release notes for v1.0.0 |
| screenshot-captions.txt | Captions for 8 app screenshots |
| privacy-summary.txt | Short privacy summary for Play Console |
| feature-graphic-notes.md | Design notes for 1024x500 feature graphic |
| app-ads-txt-notes.md | Full app-ads.txt setup guide |
| admob-setup-notes.md | AdMob setup and policy reference |
| data-safety-notes.md | Data safety form guidance for Play Console |
| play-console-checklist.md | Step-by-step Play Console release checklist |

Release artifacts are copied to:

```
releases/builds/v1.0.0/
releases/store-assets/
```

---

## Privacy Policy

The full privacy policy is in `PRIVACYPOLICY.md`. It must be hosted at a public URL before submitting the app to Google Play. The contact email is info@oldalexhub.com.

---

## License

All rights reserved. This software and its source code are proprietary to Old Alex Hub. No part of this project may be reproduced, distributed, modified, or used in any form without explicit written permission from the author.
