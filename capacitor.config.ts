import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'dizaar',
  webDir: 'www',

  plugins: {
    SystemBars: {
      insetsHandling: 'native',
      style: 'DARK',
      hidden: false
    },

    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: '#8f071f',
      showSpinner: false,
      androidScaleType: 'CENTER_INSIDE',
      splashFullScreen: false,
      splashImmersive: false
    }
  }
};

export default config;