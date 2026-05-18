# app-ads.txt Setup Guide

**App:** MindVault
**Publisher ID:** pub-7831002909037560

---

## What is app-ads.txt?

app-ads.txt (Authorized Digital Sellers for Apps) is a text file that declares which ad networks are authorized to sell ad inventory for your app. It provides transparency in the mobile advertising ecosystem and helps prevent unauthorized ad selling. It is an industry standard file, NOT something that is bundled inside the APK.

---

## Your Exact Seller Line

The content of your app-ads.txt file must include exactly this line:

```
google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0
```

This line declares that Google (AdMob) is a direct authorized seller for your ad inventory under your publisher account pub-7831002909037560.

---

## Where to Host This File

The file must be hosted at the root of your developer website domain. The URL must be:

```
https://[your-developer-website]/app-ads.txt
```

Example: If your developer website is https://oldalexhub.github.io, the file must be accessible at:

```
https://oldalexhub.github.io/app-ads.txt
```

Your developer website must match the website URL listed in your Google Play developer profile (Google Play Console > Setup > Developer account > Developer page).

---

## File Content

Create a plain text file named app-ads.txt with exactly this content (one line only):

```
google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0
```

No additional formatting, no BOM, no trailing spaces. UTF-8 encoding.

---

## Hosting Instructions

### Option 1: GitHub Pages (Recommended for simplicity)

1. Create a GitHub repository for your developer website (e.g., https://github.com/oldalexhub/oldalexhub.github.io)
2. Add a file named app-ads.txt at the repository root with the seller line above
3. Enable GitHub Pages in the repository settings
4. Verify the file is accessible at https://oldalexhub.github.io/app-ads.txt

### Option 2: Personal or Custom Domain

1. Log in to your web hosting control panel or file manager
2. Upload app-ads.txt to the root directory of your domain (typically public_html/ or www/)
3. Ensure the file is publicly accessible via HTTPS at https://yourdomain.com/app-ads.txt

---

## Google Play Console: Set Your Developer Website

1. Go to Google Play Console > Setup > Developer account > Developer page
2. Enter the URL of the website where you host app-ads.txt
3. This URL must match the domain where app-ads.txt is hosted

---

## Verification Timeline

After publishing app-ads.txt:

- Google Play Console and AdMob may take 24 to 72 hours to crawl and verify the file
- AdMob may show a warning about app-ads.txt during this period; this is normal
- After verification, the warning will clear automatically
- You can check the status in AdMob under Apps > [your app] > App settings

---

## Important Reminders

- app-ads.txt is NOT bundled inside the APK. It is a web-hosted file only.
- The developer website in your Google Play Console profile must match the domain hosting app-ads.txt.
- The file must be publicly accessible without authentication (no login required to view it).
- If you change domains later, update both the Google Play Console developer page URL and the app-ads.txt hosting location.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| AdMob shows "app-ads.txt not found" | Verify the file is at the root of your developer website domain |
| File found but not verified | Wait 24 to 72 hours for Google to crawl it; check for typos in the seller line |
| Developer website not set | Go to Google Play Console > Setup > Developer account > Developer page and enter your website URL |
| HTTPS required | Ensure your developer website supports HTTPS; HTTP-only sites may not be accepted |
