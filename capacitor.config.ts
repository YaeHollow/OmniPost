import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omnipost.app',
  appName: 'OmniPost',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;