# Google Play Console Release Checklist

**App:** MindVault
**Version:** 1.0.0
**Developer:** Old Alex Hub

---

## Pre-Upload Preparation

- [ ] Release AAB (Android App Bundle) has been built using `bundleRelease`
- [ ] AAB is signed with the production keystore
- [ ] AAB is located in `releases/builds/v1.0.0/`
- [ ] Privacy policy is hosted publicly at a stable URL
- [ ] app-ads.txt is hosted at the root of the developer website domain

---

## Step 1: Upload AAB

1. Go to Google Play Console > MindVault > Release > Production (or create a new app if first time)
2. Click "Create new release"
3. Upload the AAB file from `releases/builds/v1.0.0/app-release.aab`
4. Enter version name: 1.0.0
5. Enter version code: 1
6. Paste release notes from `store_assets/release-notes.txt`
7. Save the release draft (do not publish yet; complete all steps below first)

---

## Step 2: Set App Name and Icon

1. Go to Store presence > Main store listing
2. App name: MindVault
3. Upload app icon: 512 x 512 px PNG (no transparency on outer shape if adaptive icon)
4. Save

---

## Step 3: Enter Descriptions

1. Short description: Paste content from `store_assets/short-description.txt` (max 80 characters)
2. Full description: Paste content from `store_assets/full-description.txt` (max 4000 characters)
3. Promo text (optional): Paste content from `store_assets/promo-text.txt`
4. Save

---

## Step 4: Fill Data Safety Section

1. Go to Store presence > Data safety
2. "Does your app collect or share any of the required user data types?" Answer based on AdMob
3. Under Device or other IDs: mark advertising identifiers as collected by AdMob for advertising purposes
4. The developer (Old Alex Hub) does not collect any user data independently
5. "Is data encrypted in transit?" Select Yes
6. "Can users request data deletion?" Select Yes
7. Reference `store_assets/data-safety-notes.md` for full guidance
8. Save

---

## Step 5: Mark Contains Ads

1. Go to Store presence > App content
2. Under "Ads": select "Yes, my app contains ads"
3. Save

---

## Step 6: Set Content Rating

1. Go to Store presence > App content > Content rating
2. Click "Start questionnaire"
3. Category: Games
4. Answer all questions honestly:
   - No violence
   - No sexual content
   - No gambling
   - No user-generated content requiring moderation
   - No location sharing
   - No unrestricted internet access for users (INTERNET permission is only for AdMob and public read-only APIs)
5. Submit the questionnaire
6. Expected rating: Everyone (ESRB Everyone / PEGI 3 or similar)

---

## Step 7: Set Pricing

1. Go to Monetization > Pricing
2. Select: Free
3. Save

---

## Step 8: Select Category

1. Go to Store presence > Main store listing > App category
2. Application type: Game
3. Category: Puzzle
4. Save

---

## Step 9: Add Screenshots

1. Go to Store presence > Main store listing > Phone screenshots
2. Upload at minimum 2 phone screenshots (recommended: 8)
3. Refer to `store_assets/screenshot-captions.txt` for caption suggestions
4. Supported sizes: between 320px and 3840px per side, 16:9 or 9:16 aspect ratio recommended
5. Save

---

## Step 10: Add Feature Graphic

1. Go to Store presence > Main store listing > Feature graphic
2. Upload the 1024 x 500 px feature graphic
3. Refer to `store_assets/feature-graphic-notes.md` for design guidance
4. Save

---

## Step 11: Enter Contact Details

1. Go to Store presence > Main store listing > Contact details
2. Email: oldalexhub@gmail.com
3. Website: (your developer website URL, must match domain hosting app-ads.txt)
4. Save

---

## Step 12: Add Privacy Policy URL

1. Go to Store presence > Main store listing > Privacy policy
2. Enter the public URL where PRIVACYPOLICY.md content is hosted
3. Example: https://oldalexhub.github.io/mindvault/privacy
4. The privacy policy page must be publicly accessible without login
5. Save

---

## Step 13: Publish app-ads.txt

1. Ensure the file `google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0` is hosted at:
   `https://[your-developer-website]/app-ads.txt`
2. Verify the developer website URL in Google Play Console matches the domain hosting app-ads.txt
3. See `store_assets/app-ads-txt-notes.md` for full instructions
4. Google and AdMob will crawl this file within 24 to 72 hours after publishing

---

## Step 14: Final Review and Publish

1. Return to Release > Production > your draft release
2. Review the release summary for any errors or warnings
3. Address any policy warnings before submitting
4. Click "Review release"
5. If everything looks correct, click "Start rollout to Production"
6. The app will enter review (typically 1 to 7 days for a new app)

---

## Post-Publish Actions

- [ ] Verify app is visible in the Play Store after review approval
- [ ] Test install from the Play Store on a real device
- [ ] Confirm banner ads appear in the production build
- [ ] Confirm app-ads.txt is verified in AdMob (check after 24 to 72 hours)
- [ ] Monitor AdMob dashboard for ad performance
- [ ] Monitor Play Console for crash reports and ANRs
