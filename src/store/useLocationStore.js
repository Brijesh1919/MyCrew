import { create } from 'zustand';
import { CURRENT_USER } from '../data/mockData';
import { APP_CONFIG } from '../constants/config';

export const useLocationStore = create((set, get) => ({
  userLocation: { ...CURRENT_USER.coordinates },
  isLocationSharingActive: true,
  mapRegion: { ...APP_CONFIG.defaultRegion },
  zoomLevel: 16,

  setUserLocation: (coords) => {
    set((state) => ({
      userLocation: {
        ...state.userLocation,
        ...coords,
      },
    }));
  },

  setMapRegion: (region) => set({ mapRegion: region }),

  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

  zoomIn: () => set((state) => ({ zoomLevel: Math.min(state.zoomLevel + 1, 20) })),

  zoomOut: () => set((state) => ({ zoomLevel: Math.max(state.zoomLevel - 1, 10) })),

  recenterOnUser: () => {
    const loc = get().userLocation;
    set({
      mapRegion: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      zoomLevel: 16.5,
    });
  },

  setIsLocationSharingActive: (active) => set({ isLocationSharingActive: active }),
}));
