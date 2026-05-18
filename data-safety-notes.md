# Data Safety Notes for Google Play Console

**App:** MindVault
**Developer:** Old Alex Hub
**Purpose:** Developer-facing reference for completing the Google Play data safety section

---

## Quick Reference

| Field | Value |
|---|---|
| Contains ads | Yes (AdMob banner ads) |
| Account required | No |
| Custom backend / server | No |
| Local gameplay data uploaded | No (device only) |
| Developer collects user data | No |
| Data encrypted in transit | Yes (HTTPS for ad requests and API calls) |
| Users can request deletion | Yes |

---

## Permissions

| Permission | Used For |
|---|---|
| INTERNET | AdMob banner ads; optional public puzzle data refresh (Datamuse API, REST Countries API) |

Permissions NOT present in this app:

- No location permissions
- No camera permission
- No microphone permission
- No contacts permissions
- No storage permissions beyond app sandbox

---

## Data Collected by the Developer

**Developer data collection: NONE**

Old Alex Hub does not collect, receive, store, or process any user data. The developer has no backend server and receives no data from the app.

---

## Data Collected by AdMob (Google Mobile Ads SDK)

AdMob is integrated for banner advertisements. Google (not Old Alex Hub) is responsible for data collected by the Google Mobile Ads SDK.

| Data Type | Collected By | Purpose |
|---|---|---|
| Advertising identifiers (Android Advertising ID) | Google AdMob | Ad targeting and measurement |
| Diagnostic / crash data | Google AdMob | SDK stability and performance |

- This data collection is Google's responsibility and is governed by Google's Privacy Policy.
- Mark these in the Play Console data safety form under "Ads" attributed to Google Play Services / AdMob.

---

## User-Initiated Sharing

- MindVault allows users to share puzzle results via the Android share sheet.
- Sharing occurs ONLY when the user explicitly taps the Share button.
- The app does not auto-share, upload, or transmit any results.
- No personal data is included in the shared content (only score text).

---

## Local Data (Never Uploaded)

The following data is stored locally on the device via AsyncStorage and is NEVER transmitted to any server:

- Game scores and Vault Scores
- Puzzle streak data
- App settings and preferences
- Theme unlock status

---

## Data Deletion

Users can delete all local data by:

1. Using the in-app reset option in Settings
2. Going to Android Settings > Apps > MindVault > Storage > Clear Data

---

## Encryption

All network communications in MindVault use HTTPS:

- AdMob ad requests: HTTPS
- Optional public API calls (Datamuse API, REST Countries API): HTTPS

---

## Play Console Data Safety Form Guidance

When completing the Google Play data safety section, follow these steps:

### Step 1: Data collection and security

- "Does your app collect or share any of the required user data types?" Select **No** for developer-collected data.
- Note: AdMob SDK data is handled under Google Play Services. You should still review the AdMob SDK data safety documentation and disclose it appropriately.

### Step 2: Data types

- Under "Device or other IDs" > "Device or other identifiers": Mark as collected by AdMob / Google Play Services for "Advertising or marketing" purposes.
- Do NOT mark any data as collected by the developer (Old Alex Hub).

### Step 3: Ads

- Mark **"Contains ads"** as Yes.
- Select Google AdMob as the ads SDK.
- The AdMob SDK may handle its own data safety disclosure via auto-filled SDK data safety information in the Play Console.

### Step 4: Core app data (local storage)

- Core gameplay data (scores, streaks, settings) stays on device only.
- This data is NOT collected or transmitted; it does not need to be declared as "collected" data.

### Step 5: User-initiated sharing

- Sharing occurs via Android share sheet only when the user taps Share.
- No data is sent to a developer-controlled endpoint, so this is not a developer data collection event.

### Step 6: Security practices

- "Is data encrypted in transit?" Select Yes
- "Can users request data deletion?" Select Yes (via in-app reset or Android app data clear)

---

## Summary Statement for Play Console

> MindVault does not collect or share any user data. All gameplay data (scores, streaks, settings) is stored locally on the device and never uploaded. The app uses Google AdMob for banner ads. AdMob may collect advertising identifiers and diagnostic data per Google's privacy policy. No other data is collected by the developer.
