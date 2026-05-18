// Central AdMob configuration. All ad IDs come from here only.

export const ADMOB_APP_ID = 'ca-app-pub-7831002909037560~9376774674';
export const BANNER_AD_UNIT_ID = 'ca-app-pub-7831002909037560/6489618814';
export const ADMOB_PUBLISHER_ID = 'pub-7831002909037560';
export const APP_ADS_TXT_LINE = 'google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0';
export const INTERSTITIAL_AD_UNIT_ID = '';
export const REWARDED_AD_UNIT_ID = '';
export const ADS_ENABLED = true;
export const DEBUG_ADS = __DEV__;

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

export function getBannerAdUnitId(): string {
  if (!ADS_ENABLED) return '';
  if (DEBUG_ADS) return TEST_BANNER_ID;
  return BANNER_AD_UNIT_ID;
}

export function adsConfigured(): boolean {
  return ADS_ENABLED && BANNER_AD_UNIT_ID.length > 0;
}
