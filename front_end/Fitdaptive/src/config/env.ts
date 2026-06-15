import Config from 'react-native-config';

export const ENV = {
  WEB_CLIENT_ID: Config.WEB_CLIENT_ID || '934660874085-gj6fteq3bc6f68ne1357ulapug1ctt69.apps.googleusercontent.com',
  WEB_CLIENT_SECRET: Config.WEB_CLIENT_SECRET || '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',
  ANDROID_CLIENT_ID: Config.ANDROID_CLIENT_ID || '934660874085-oijpqv5pqk3csovqkvsldih4rifhqios.apps.googleusercontent.com',
  // API_URL: Config.API_URL || 'http://localhost:3000/api/v1',
  API_URL: Config.API_URL || 'https://finalprojectfitnessappbackend-production.up.railway.app',
  GOOGLE_EVENTS_STORAGE_KEY: Config.GOOGLE_EVENTS_STORAGE_KEY || 'unified_calendar_google_events',
};
