import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getBannerAdUnitId, ADS_ENABLED } from '../config/admob';

interface AdBannerProps {
  style?: object;
}

type AdState = 'idle' | 'loading' | 'loaded' | 'error';

export function AdBanner({ style }: AdBannerProps): React.ReactElement | null {
  const [adState, setAdState] = useState<AdState>('idle');

  // Do not render if ads are disabled
  if (!ADS_ENABLED) {
    return null;
  }

  let adUnitId: string;
  try {
    adUnitId = getBannerAdUnitId();
  } catch {
    return null;
  }

  if (!adUnitId) {
    return null;
  }

  // After a failed load, render nothing to avoid blank space
  if (adState === 'error') {
    return null;
  }

  try {
    return (
      <View style={[styles.container, style]}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          onAdLoaded={() => setAdState('loaded')}
          onAdFailedToLoad={() => setAdState('error')}
        />
      </View>
    );
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
