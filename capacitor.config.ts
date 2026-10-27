import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.virtuoso.piano',
  appName: 'Virtuoso Piano',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#000000',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: true,
    allowsLinkPreview: false,
    scrollEnabled: false,
  },
}

export default config
