import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mzsmarttoolhouse.app',
  appName: 'MZ Tools',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#f8fafc',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 100,
      backgroundColor: '#07142f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#f8fafc',
      overlaysWebView: false,
    },
  },
};

export default config;
