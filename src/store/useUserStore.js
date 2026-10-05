import { create } from 'zustand';
import { CURRENT_USER } from '../data/mockData';

export const useUserStore = create((set, get) => ({
  currentUser: { ...CURRENT_USER },

  updateProfile: (updates) => {
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        ...updates,
      },
    }));
  },

  setUserName: (name) => {
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        name: name.trim() || 'You',
      },
    }));
  },

  toggleSafeCheckIn: () => {
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        isSafe: !state.currentUser.isSafe,
      },
    }));
  },

  setTrackingMode: (modeId) => {
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        trackingMode: modeId,
      },
    }));
  },
}));
