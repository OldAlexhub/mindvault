import React, { useEffect } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import RootNavigator from './src/navigation';
import { initNotifications } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .catch(() => {
        // Ad SDK init failure must never crash the app
      });

    initNotifications();
  }, []);

  return (
    <RootNavigator />
  );
}
