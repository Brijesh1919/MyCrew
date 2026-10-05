export const APP_CONFIG = {
  appName: 'MyCrew',
  tagline: 'Never lose your group again.',
  positioning: 'A temporary live map for your whole group.',
  philosophy: "We're together temporarily. Help us stay together.",
  version: '1.0.0',
  mockMode: true,

  // Centralized Mapbox configuration
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
    defaultStyle: 'streets-v12',
    outdoorStyle: 'outdoors-v12',
    darkStyle: 'dark-v11',
    satelliteStyle: 'satellite-streets-v12',
  },

  // Default coordinate center (Goa Music Festival / Vagator grounds)
  defaultRegion: {
    latitude: 15.5898,
    longitude: 73.7438,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
    name: 'Goa Music Festival Ground',
    city: 'Goa',
  },

  // Location freshness thresholds (in seconds)
  freshness: {
    liveThresholdSec: 30,      // < 30 sec = Live (Green)
    delayedThresholdSec: 300,  // 30 sec to 5 min = Delayed (Yellow)
    offlineThresholdSec: 300,  // > 5 min = Offline (Red)
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
