require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: jest.fn(() => ({
      initialize: jest.fn(() => Promise.resolve()),
    })),
    BannerAd: jest.fn((props) => React.createElement(View, props)),
    BannerAdSize: {
      ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
    },
    TestIds: {
      BANNER: 'test-banner',
    },
  };
});

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
    createChannel: jest.fn(() => Promise.resolve('mindvault_daily')),
    createTriggerNotification: jest.fn(() => Promise.resolve()),
    cancelTriggerNotification: jest.fn(() => Promise.resolve()),
  },
  AndroidImportance: {
    DEFAULT: 3,
  },
  TriggerType: {
    TIMESTAMP: 0,
  },
  RepeatFrequency: {
    DAILY: 1,
  },
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
}));
