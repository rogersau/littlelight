import type { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_WEB_BASE_PATH || undefined,
  },
});
