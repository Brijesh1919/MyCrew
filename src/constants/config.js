export const APP_CONFIG = {
  appName: 'MyCrew',
  tagline: 'Never lose your group again.',
  positioning: 'A temporary live map for your whole group.',
  philosophy: "We're together temporarily. Help us stay together.",
  version: '1.0.0',
  mockMode: false,

  // Supabase Configuration
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://duwtfgpoodwmboehfioe.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1d3RmZ3Bvb2R3bWJvZWhmaW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDQ4MTUsImV4cCI6MjEwNjc4MDgxNX0.TeuMOX8USC6ArEMlGNINSe63EGF6pCI1TFKpnCuByVE',
  },

  // Centralized Mapbox configuration
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
    defaultStyle: 'streets-v12',
    outdoorStyle: 'outdoors-v12',
    darkStyle: 'dark-v11',
    satelliteStyle: 'satellite-streets-v12',
  },

  // Central default fallback region (only if neither user location nor trip coordinates exist)
  defaultRegion: null,

  // Location freshness thresholds (in seconds)
  freshness: {
    liveThresholdSec: 30,      // < 30 sec = Live (Green)
    delayedThresholdSec: 120,  // 30 sec to 2 min = Delayed (Yellow)
    offlineThresholdSec: 120,  // > 2 min = Offline (Red)
  },

  // Smart tracking settings
  trackingModes: [
    { id: 'crowded', label: 'Crowded Event', intervalSec: 5, accuracy: 'High', batteryImpact: 'Medium' },
    { id: 'normal', label: 'Normal Dynamic', intervalSec: 15, accuracy: 'Balanced', batteryImpact: 'Low' },
    { id: 'walking', label: 'Walking / Trekking', intervalSec: 8, accuracy: 'High', batteryImpact: 'Medium' },
    { id: 'stationary', label: 'Stationary / Chill', intervalSec: 60, accuracy: 'Low-power', batteryImpact: 'Minimal' },
    { id: 'low_battery', label: 'Battery Saver', intervalSec: 120, accuracy: 'Coarse', batteryImpact: 'Ultra-low' },
  ],
};
