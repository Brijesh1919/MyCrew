import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tripService } from '../services/tripService';
import { useCrewStore } from './useCrewStore';

const STORAGE_KEY_TRIP = '@mycrew_active_trip';
const STORAGE_KEY_ROLE = '@mycrew_user_role';
const STORAGE_KEY_ONBOARDING = '@mycrew_onboarding_completed';

export const useTripStore = create((set, get) => ({
  // Crucial: activeTrip is NULL by default for fresh launches
  activeTrip: null,
  userRole: null, // 'organizer' | 'participant' | null
  isOnboardingCompleted: false,
  hasLocationPermission: true,
  isInitialized: false,
  isLoading: false,

  // Initialize from AsyncStorage on app launch
  initializeStore: async () => {
    try {
      const [storedTrip, storedRole, storedOnboarding] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_TRIP),
        AsyncStorage.getItem(STORAGE_KEY_ROLE),
        AsyncStorage.getItem(STORAGE_KEY_ONBOARDING),
      ]);

      const isOnboarding = storedOnboarding === 'true';
      let activeTrip = null;
      let userRole = null;

      if (storedTrip) {
        try {
          const parsed = JSON.parse(storedTrip);
          // Check expiration
          const isExpired = parsed?.endTime ? new Date(parsed.endTime) < new Date() : false;
          if (parsed && !isExpired && !parsed.isExpired) {
            activeTrip = parsed;
            userRole = storedRole || 'participant';
            tripService.setActiveTrip(activeTrip);

            // Populate crew members if demo trip
            if (activeTrip.code === 'GOA7K2' || activeTrip.code === 'GOA2026') {
              useCrewStore.getState().loadDemoMembers();
            } else {
              useCrewStore.getState().setMembers([
                {
                  id: 'me',
                  name: activeTrip.organizer?.name || 'You',
                  status: 'live',
                  lastSeenSecondsAgo: 0,
                  battery: 100,
                  isSafe: true,
                  cluster: 'Main Area',
                  coordinates: activeTrip.centerCoordinate || { latitude: 15.5898, longitude: 73.7438 },
                },
              ]);
            }
          } else {
            // Expired trip, clear it
            await AsyncStorage.multiRemove([STORAGE_KEY_TRIP, STORAGE_KEY_ROLE]);
            useCrewStore.getState().clearMembers();
          }
        } catch (e) {
          console.warn('Error parsing stored trip:', e);
        }
      }

      set({
        activeTrip,
        userRole,
        isOnboardingCompleted: isOnboarding,
        isInitialized: true,
      });
    } catch (err) {
      console.warn('Failed to initialize trip store:', err);
      set({ isInitialized: true });
    }
  },

  setOnboardingCompleted: async (val) => {
    set({ isOnboardingCompleted: val });
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ONBOARDING, val ? 'true' : 'false');
    } catch (e) {
      // storage fallback
    }
  },

  setLocationPermission: (val) => set({ hasLocationPermission: val }),

  // User creates a new trip -> role is 'organizer'
  createTrip: async (tripData) => {
    set({ isLoading: true });
    const newTrip = tripService.createTrip(tripData);
    set({
      activeTrip: newTrip,
      userRole: 'organizer',
      isLoading: false,
    });

    // Populate organizer's crew
    useCrewStore.getState().setMembers([
      {
        id: 'me',
        name: tripData.organizerName || 'You (Host)',
        status: 'live',
        lastSeenSecondsAgo: 0,
        battery: 100,
        isSafe: true,
        cluster: 'Main Area',
        coordinates: newTrip.centerCoordinate,
      },
    ]);

    try {
      await AsyncStorage.setItem(STORAGE_KEY_TRIP, JSON.stringify(newTrip));
      await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'organizer');
    } catch (e) {
      // storage fallback
    }

    return newTrip;
  },

  // User joins with code or QR -> role is 'participant'
  joinTrip: async (code, userName = 'You') => {
    set({ isLoading: true });
    const res = tripService.findTripByCode(code);

    if (res.success) {
      const trip = res.trip;
      tripService.setActiveTrip(trip);
      set({
        activeTrip: trip,
        userRole: 'participant',
        isLoading: false,
      });

      // If demo festival, load full 20 members
      const cleanCode = code?.trim().toUpperCase();
      if (cleanCode === 'GOA7K2' || cleanCode === 'GOA2026') {
        useCrewStore.getState().loadDemoMembers();
      } else {
        useCrewStore.getState().setMembers([
          {
            id: 'host',
            name: trip.organizer?.name || 'Organizer',
            status: 'live',
            lastSeenSecondsAgo: 5,
            battery: 88,
            isSafe: true,
            cluster: 'Main Area',
            coordinates: trip.centerCoordinate,
          },
        ]);
      }

      try {
        await AsyncStorage.setItem(STORAGE_KEY_TRIP, JSON.stringify(trip));
        await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'participant');
      } catch (e) {
        // storage fallback
      }

      return { success: true, trip };
    } else {
      set({ isLoading: false });
      return res;
    }
  },

  // Participant leaves the crew
  leaveTrip: async () => {
    tripService.clearTrip();
    useCrewStore.getState().clearMembers();
    set({
      activeTrip: null,
      userRole: null,
    });
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY_TRIP, STORAGE_KEY_ROLE]);
    } catch (e) {
      // storage fallback
    }
  },

  // Organizer ends the trip
  endTrip: async () => {
    tripService.clearTrip();
    useCrewStore.getState().clearMembers();
    set({
      activeTrip: null,
      userRole: null,
    });
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY_TRIP, STORAGE_KEY_ROLE]);
    } catch (e) {
      // storage fallback
    }
  },

  // Explicit demo activator (for developer convenience if needed)
  resetDemoTrip: async () => {
    const demo = tripService.getDemoTrip();
    tripService.setActiveTrip(demo);
    useCrewStore.getState().loadDemoMembers();
    set({
      activeTrip: demo,
      userRole: 'organizer',
    });
    try {
      await AsyncStorage.setItem(STORAGE_KEY_TRIP, JSON.stringify(demo));
      await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'organizer');
    } catch (e) {
      // storage fallback
    }
  },
}));

