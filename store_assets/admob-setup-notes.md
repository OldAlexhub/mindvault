# AdMob Setup Notes

**App:** MindVault
**Developer:** Old Alex Hub

---

## AdMob Identifiers

| Item | Value |
|---|---|
| AdMob App ID | ca-app-pub-7831002909037560~9376774674 |
| Banner Ad Unit ID | ca-app-pub-7831002909037560/6489618814 |
| Publisher ID | pub-7831002909037560 |
| app-ads.txt Seller Line | google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0 |

---

## Ad Strategy for v1.0.0

MindVault v1.0.0 uses a banner-only ad strategy:

- Banner ads: Enabled
- Interstitial ads: Not used in v1
- Rewarded ads: Not used in v1
- Native ads: Not used in v1

This keeps the user experience simple and ad load minimal for the initial release. Interstitials or rewarded ads may be considered in future versions.

---

## Debug vs. Production Ad IDs

The app is configured to automatically use the correct ad IDs based on build type:

### Debug builds (when __DEV__ is true)

- Test banner ID is used automatically: ca-app-pub-3940256099942544/6300978111
- This is Google's official test banner ad unit ID
- Test ads do NOT generate real revenue
- Test ads prevent policy violations from accidental self-clicks during development

### Production / release builds (when __DEV__ is false)

- Production banner ID is used automatically: ca-app-pub-7831002909037560/6489618814
- Production ads generate real revenue
- Policy violations apply in production

The switching logic is implemented in src/config/admob.ts via the getBannerAdUnitId() function. No manual changes are needed when building for release.

---

## AndroidManifest.xml

The AdMob App ID must be declared in AndroidManifest.xml. Verify this entry exists:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-7831002909037560~9376774674"/>
```

If this entry is missing or has the wrong value, the app will crash on startup.

---

## Google Play Console: Mark "Contains Ads"

After uploading the AAB to Google Play Console, you must mark the app as containing ads:

1. Go to Google Play Console
2. Select MindVault
3. Go to Store presence > App content
4. Under "Ads", select "Yes, my app contains ads"
5. Save

Failure to mark this will result in a policy violation warning.

---

## app-ads.txt

The app-ads.txt seller line for this app is:

```
google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0
```

This file must be hosted at the root of your developer website domain. See app-ads-txt-notes.md for full setup instructions.

---

## AdMob Policy Reminders

- Do NOT click your own ads. Clicking your own ads is a serious violation of AdMob policies and can result in account suspension or permanent ban.
- Do NOT place ads where they can be accidentally clicked (e.g., directly adjacent to buttons or interactive elements with no spacing).
- Do NOT use incentivized clicks or ask users to click ads.
- Do NOT use bots, automated traffic, or any artificial means to generate ad impressions or clicks.
- Ensure your privacy policy mentions AdMob and links to Google's privacy policy.
- Ensure "Contains ads" is marked in Google Play Console.

---

## AdMob Dashboard

Monitor ad performance at: https://apps.admob.com

Key metrics to watch:
- Daily estimated earnings
- eCPM (effective cost per thousand impressions)
- Fill rate
- Impressions
- Clicks and CTR

---

## Testing Checklist Before Release

- [ ] AdMob App ID declared in AndroidManifest.xml
- [ ] getBannerAdUnitId() returns test ID in __DEV__ mode
- [ ] getBannerAdUnitId() returns production ID in release build
- [ ] Banner ad appears visually in a release build (test on a real device)
- [ ] No ad-related crashes in logcat
- [ ] "Contains ads" marked in Google Play Console
- [ ] Privacy policy mentions AdMob and Google's privacy policy
- [ ] app-ads.txt hosted and accessible at developer website domain
