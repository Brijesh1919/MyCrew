// ==========================================================
// MyCrew - Real Device Location Store (Zustand)
// Manages device GPS state, accuracy, camera centering, and sharing toggle
// ==========================================================

import { create } from 'zustand';
import { locationService } from '../services/locationService';

export const useLocationStore = create((set, get) => ({
  // Real GPS Coordinates: { latitude, longitude, accuracy, heading, speed, timestamp } | null
  userLocation: null,
  lastKnownLocation: null,

  isLocating: false, // True while acquiring initial GPS fix
  permissionStatus: 'undetermined', // 'undetermined' | 'granted' | 'denied' | 'blocked'
  isLocationSharingActive: true, // Master toggle for active-trip sharing

  accuracyLevel: null, // 'high' | 'medium' | 'low' | null
  accuracyRadius: null, // meters

  // Map camera centering
  cameraCenter: null, // { latitude, longitude } | null
  followUser: true, // Follow user on GPS update until manually panned
  zoomLevel: 16,

  setUserLocation: (coords) => {
    if (!coords || isNaN(coords.latitude) || isNaN(coords.longitude)) return;

    const accuracyLevel = locationService.getAccuracyLevel(coords.accuracy);

    set((state) => {
      const shouldUpdateCamera = state.followUser || !state.cameraCenter;
      return {
        userLocation: coords,
        lastKnownLocation: coords,
        isLocating: false,
        accuracyLevel,
        accuracyRadius: coords.accuracy || null,
        cameraCenter: shouldUpdateCamera
          ? { latitude: coords.latitude, longitude: coords.longitude }
          : state.cameraCenter,
      };
    });
  },

  setCameraCenter: (center, manualPan = false) => {
    set({
      cameraCenter: center,
      followUser: manualPan ? false : get().followUser,
    });
  },

  setFollowUser: (follow) => set({ followUser: follow }),

  setPermissionStatus: (status) => set({ permissionStatus: status }),

  setIsLocating: (locating) => set({ isLocating: locating }),

  recenterOnUser: () => {
    const loc = get().userLocation || get().lastKnownLocation;
    if (loc) {
      set({
        cameraCenter: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
        followUser: true,
        zoomLevel: 16.5,
      });
    }
  },

  setIsLocationSharingActive: (active) => set({ isLocationSharingActive: active }),

  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

  zoomIn: () => set((state) => ({ zoomLevel: Math.min(state.zoomLevel + 1, 20) })),

  zoomOut: () => set((state) => ({ zoomLevel: Math.max(state.zoomLevel - 1, 10) })),

  clearLocation: () =>
    set({
      userLocation: null,
      isLocating: false,
      accuracyLevel: null,
      accuracyRadius: null,
      cameraCenter: null,
      followUser: true,
    }),
}));
