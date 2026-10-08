// ==========================================================
// MyCrew - Real Trip Store (Zustand)
// Synchronized with Supabase as the authoritative source
// ==========================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tripService } from '../services/tripService';
import { locationService } from '../services/locationService';
import { useCrewStore } from './useCrewStore';
import { useMeetingPointStore } from './useMeetingPointStore';
import { useLocationStore } from './useLocationStore';
import { getTripStatus } from '../utils/tripStatus';
import { getLocationFreshness } from '../utils/freshness';
import { analytics } from '../services/analyticsService';

const STORAGE_KEY_TRIP = '@mycrew_active_trip';
const STORAGE_KEY_ROLE = '@mycrew_user_role';
const STORAGE_KEY_ONBOARDING = '@mycrew_onboarding_completed';

export const useTripStore = create((set, get) => ({
  // Active Trip State
  activeTrip: null,
  userRole: null, // 'organizer' | 'participant' | null
  activeTripsList: [], // All currently active trips for user
  tripHistory: [], // Real expired/past trips from Supabase (newest -> oldest)
  upcomingTrips: [], // Trips starting in future

  isOnboardingCompleted: false,
  hasLocationPermission: true,
  isInitialized: false,
  isLoading: false,

  /**
   * Initializes store on app launch (loads onboarding preference)
   */
  initializeStore: async () => {
    try {
      const storedOnboarding = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDING);
      const isOnboarding = storedOnboarding === 'true';

      set({
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

  /**
   * Fetches user's trips from Supabase and restores active trip state
   */
  fetchUserTrips: async (userId) => {
    if (!userId) return;
    set({ isLoading: true });

    try {
      const res = await tripService.getUserTrips(userId);

      if (res.success) {
        const { activeTrips, upcomingTrips, expiredTrips } = res;

        // Restore active trip
        if (activeTrips.length > 0) {
          const primaryTrip = activeTrips[0];
          tripService.setActiveTrip(primaryTrip);

          set({
            activeTrip: primaryTrip,
            userRole: primaryTrip.userRole || 'participant',
            activeTripsList: activeTrips,
            tripHistory: expiredTrips,
            upcomingTrips: upcomingTrips,
            isLoading: false,
          });

          // Populate members
          if (primaryTrip.code === 'GOA7K2' || primaryTrip.code === 'GOA2026') {
            useCrewStore.getState().loadDemoMembers();
            useMeetingPointStore.getState().loadDemoMeetingPoints();
          } else {
            // Fetch real members from Supabase
            const members = await tripService.getTripMembers(primaryTrip.id);
            const formattedMembers = (members || []).map((m) => {
              const hasCoords =
                m.latitude !== null &&
                m.longitude !== null &&
                !isNaN(Number(m.latitude)) &&
                !isNaN(Number(m.longitude)) &&
                Number(m.latitude) >= -90 &&
                Number(m.latitude) <= 90 &&
                Number(m.longitude) >= -180 &&
                Number(m.longitude) <= 180;

              const freshness = getLocationFreshness(m.location_updated_at);

              return {
                id: m.user_id,
                name: m.user_name || (m.role === 'organizer' ? 'Organizer' : 'Crew Member'),
                avatar: m.avatar_url || null,
                phone: m.phone || null,
                role: m.role || 'participant',
                status: freshness.state,
                freshness,
                lastSeenSecondsAgo: m.location_updated_at
                  ? Math.max(0, Math.round((Date.now() - new Date(m.location_updated_at).getTime()) / 1000))
                  : 0,
                location_updated_at: m.location_updated_at,
                isSafe: true,
                cluster: 'Active Crew',
                coordinates: hasCoords
                  ? {
                      latitude: Number(m.latitude),
                      longitude: Number(m.longitude),
                      accuracy: m.location_accuracy ? Number(m.location_accuracy) : null,
                      heading: m.location_heading ? Number(m.location_heading) : null,
                      speed: m.location_speed ? Number(m.location_speed) : null,
                    }
                  : null,
              };
            });

            // Find organizer phone if present and update primaryTrip.organizer
            const org = formattedMembers.find((m) => m.role === 'organizer');
            if (org?.phone && primaryTrip.organizer) {
              primaryTrip.organizer.phone = org.phone;
            }

            useCrewStore.getState().setMembers(formattedMembers);
            useMeetingPointStore.getState().fetchTripMeetingPoints(primaryTrip.id, formattedMembers);
          }

          try {
            await AsyncStorage.setItem(STORAGE_KEY_TRIP, JSON.stringify(primaryTrip));
            await AsyncStorage.setItem(STORAGE_KEY_ROLE, primaryTrip.userRole || 'participant');
          } catch (e) {
            // ignore
          }
        } else {
          // No active trips in Supabase
          tripService.clearTrip();
          useCrewStore.getState().clearMembers();
          useMeetingPointStore.getState().clearMeetingPoints();

          set({
            activeTrip: null,
            userRole: null,
            activeTripsList: [],
            tripHistory: expiredTrips,
            upcomingTrips: upcomingTrips,
            isLoading: false,
          });

          try {
            await AsyncStorage.multiRemove([STORAGE_KEY_TRIP, STORAGE_KEY_ROLE]);
          } catch (e) {
            // ignore
          }
        }
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.warn('fetchUserTrips error:', err);
      set({ isLoading: false });
    }
  },

  /**
   * In-app dynamic expiration check
   * Checks if activeTrip reached ends_at or was ended.
   * If expired, transitions activeTrip to history and stops location sharing.
   */
  checkTripExpiration: () => {
    const { activeTrip, tripHistory } = get();
    if (!activeTrip) return false;

    const status = getTripStatus(activeTrip);

    if (status === 'expired') {
      console.log('Trip reached end time. Moving to history:', activeTrip.name);

      // Stop live location sharing
      useLocationStore.getState().setIsLocationSharingActive(false);
      locationService.stopLocationWatch();
      tripService.unsubscribeFromTripLocations();

      // Clear members and active trip
      useCrewStore.getState().clearMembers();
      useMeetingPointStore.getState().clearMeetingPoints();
      tripService.clearTrip();

      const expiredItem = {
        ...activeTrip,
        ended_at: activeTrip.ended_at || new Date().toISOString(),
      };

      const updatedHistory = [expiredItem, ...tripHistory.filter((t) => t.id !== activeTrip.id)];

      set({
        activeTrip: null,
        userRole: null,
        activeTripsList: [],
        tripHistory: updatedHistory,
      });

      AsyncStorage.multiRemove([STORAGE_KEY_TRIP, STORAGE_KEY_ROLE]).catch(() => {});
      return true;
    }

    return false;
  },

  /**
   * Allows user to switch between active crews if they have multiple
   */
  selectActiveTrip: async (trip) => {
    if (!trip) return;
    tripService.setActiveTrip(trip);

    set({
      activeTrip: trip,
      userRole: trip.userRole || 'participant',
    });

    useCrewStore.getState().setMembers([
      {
        id: trip.owner_id,
        name: trip.organizer?.name || 'You',
        status: 'live',
        lastSeenSecondsAgo: 0,
        battery: 100,
        isSafe: true,
        cluster: 'Main Area',
        coordinates: trip.centerCoordinate,
      },
    ]);

    try {
      await AsyncStorage.setItem(STORAGE_KEY_TRIP, JSON.stringify(trip));
      await AsyncStorage.setItem(STORAGE_KEY_ROLE, trip.userRole || 'participant');
    } catch (e) {
      // ignore
    }
  },

  /**
   * User creates a new trip -> persisted in Supabase
   */
  createTrip: async (tripData, userId) => {
    set({ isLoading: true });

    const res = await tripService.createTrip({
      ...tripData,
      ownerId: userId,
    });

    if (res.success) {
      const newTrip = res.trip;
      set((state) => ({
        activeTrip: newTrip,
        userRole: 'organizer',
        activeTripsList: [newTrip, ...state.activeTripsList],
        isLoading: false,
      }));

      analytics.logTripCreated(tripData.name || 'New Trip', tripData.durationHours || 24);

      const userLoc = useLocationStore.getState().userLocation;
      useCrewStore.getState().setMembers([
        {
          id: userId,
          name: tripData.organizerName || 'You (Host)',
          role: 'organizer',
          status: 'live',
          lastSeenSecondsAgo: 0,
          isSafe: true,
          cluster: 'Active Crew',
          coordinates: userLoc || null,
        },
      ]);

      try {
        await AsyncStorage.setItem(STORAGE_KEY_TRIP, JSON.stringify(newTrip));
        await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'organizer');
      } catch (e) {
        // ignore
      }

      return res;
    } else {
      set({ isLoading: false });
      return res;
    }
  },

  /**
   * User joins with code or QR -> persisted in Supabase
   */
  joinTrip: async (code, user) => {
    set({ isLoading: true });

    const res = await tripService.joinTrip({
      code,
      userId: user?.id,
      userName: user?.name,
      avatarUrl: user?.avatar,
    });

    if (res.success) {
      analytics.logTripJoined(code);
      const trip = res.trip;
      const role = res.role || 'participant';

      set((state) => ({
        activeTrip: trip,
        userRole: role,
        activeTripsList: [trip, ...state.activeTripsList.filter((t) => t.id !== trip.id)],
        isLoading: false,
      }));

      // Demo festival support
      const cleanCode = code?.trim().toUpperCase();
      if (cleanCode === 'GOA7K2' || cleanCode === 'GOA2026') {
        useCrewStore.getState().loadDemoMembers();
        useMeetingPointStore.getState().loadDemoMeetingPoints();
      } else {
        const members = await tripService.getTripMembers(trip.id);
        const userLoc = useLocationStore.getState().userLocation;
        const formattedMembers = (members || []).map((m) => {
          const hasCoords =
            m.latitude !== null &&
            m.longitude !== null &&
            !isNaN(Number(m.latitude)) &&
            !isNaN(Number(m.longitude)) &&
            Number(m.latitude) >= -90 &&
            Number(m.latitude) <= 90 &&
            Number(m.longitude) >= -180 &&
            Number(m.longitude) <= 180;

          const freshness = getLocationFreshness(m.location_updated_at);

          return {
            id: m.user_id,
            name: m.user_name || (m.role === 'organizer' ? 'Organizer' : 'Crew Member'),
            avatar: m.avatar_url || null,
            phone: m.phone || null,
            role: m.role || 'participant',
            status: freshness.state,
            freshness,
            lastSeenSecondsAgo: m.location_updated_at
              ? Math.max(0, Math.round((Date.now() - new Date(m.location_updated_at).getTime()) / 1000))
              : 0,
            location_updated_at: m.location_updated_at,
            isSafe: true,
            cluster: 'Active Crew',
            coordinates: hasCoords
              ? {
                  latitude: Number(m.latitude),
                  longitude: Number(m.longitude),
                  accuracy: m.location_accuracy ? Number(m.location_accuracy) : null,
                  heading: m.location_heading ? Number(m.location_heading) : null,
                  speed: m.location_speed ? Number(m.location_speed) : null,
                }
              : (m.user_id === user?.id && userLoc ? userLoc : null),
          };
        });
        useCrewStore.getState().setMembers(formattedMembers);
        useMeetingPointStore.getState().fetchTripMeetingPoints(trip.id, formattedMembers);
      }

      try {
        await AsyncStorage.setItem(STORAGE_KEY_TRIP, JSON.stringify(trip));
        await AsyncStorage.setItem(STORAGE_KEY_ROLE, role);
      } catch (e) {
        // ignore
      }

      return res;
    } else {
      set({ isLoading: false });
      return res;
    }
  },

  /**
   * Participant leaves the crew -> updates Supabase membership
   */
  leaveTrip: async (userId) => {
    const { activeTrip } = get();
    if (activeTrip && userId) {
      await tripService.leaveTrip({ tripId: activeTrip.id, userId });
    }

    useCrewStore.getState().clearMembers();
    useMeetingPointStore.getState().clearMeetingPoints();
    useLocationStore.getState().setIsLocationSharingActive(false);
    locationService.stopLocationWatch();
    tripService.unsubscribeFromTripLocations();

    set({
      activeTrip: null,
      userRole: null,
      activeTripsList: [],
    });

    try {
      await AsyncStorage.multiRemove([STORAGE_KEY_TRIP, STORAGE_KEY_ROLE]);
    } catch (e) {
      // ignore
    }

    if (userId) {
      get().fetchUserTrips(userId);
    }
  },

  /**
   * Organizer ends the trip -> marks ended_at in Supabase (NOT deleted)
   */
  endTrip: async (userId) => {
    const { activeTrip, tripHistory } = get();
    if (activeTrip && userId) {
      await tripService.endTrip({ tripId: activeTrip.id, ownerId: userId });
    }

    useCrewStore.getState().clearMembers();
    useMeetingPointStore.getState().clearMeetingPoints();
    useLocationStore.getState().setIsLocationSharingActive(false);
    locationService.stopLocationWatch();
    tripService.unsubscribeFromTripLocations();

    if (activeTrip) {
      const endedItem = {
        ...activeTrip,
        ended_at: new Date().toISOString(),
      };
      set({
        activeTrip: null,
        userRole: null,
        activeTripsList: [],
        tripHistory: [endedItem, ...tripHistory.filter((t) => t.id !== activeTrip.id)],
      });
    } else {
      set({
        activeTrip: null,
        userRole: null,
        activeTripsList: [],
      });
    }

    try {
      await AsyncStorage.multiRemove([STORAGE_KEY_TRIP, STORAGE_KEY_ROLE]);
    } catch (e) {
      // ignore
    }

    if (userId) {
      get().fetchUserTrips(userId);
    }
  },

  /**
   * Clears in-memory state on logout
   * DOES NOT delete trips from Supabase!
   */
  clearStoreOnLogout: () => {
    tripService.clearTrip();
    useCrewStore.getState().clearMembers();
    useMeetingPointStore.getState().clearMeetingPoints();
    useLocationStore.getState().setIsLocationSharingActive(false);
    locationService.stopLocationWatch();
    tripService.unsubscribeFromTripLocations();

    set({
      activeTrip: null,
      userRole: null,
      activeTripsList: [],
      tripHistory: [],
      upcomingTrips: [],
    });

    AsyncStorage.multiRemove([STORAGE_KEY_TRIP, STORAGE_KEY_ROLE]).catch(() => {});
  },

  /**
   * Developer convenience demo trip activator
   */
  resetDemoTrip: async () => {
    const demo = tripService.getDemoTrip();
    tripService.setActiveTrip(demo);
    useCrewStore.getState().loadDemoMembers();
    useMeetingPointStore.getState().clearMeetingPoints();

    set({
      activeTrip: demo,
      userRole: 'organizer',
    });

    try {
      await AsyncStorage.setItem(STORAGE_KEY_TRIP, JSON.stringify(demo));
      await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'organizer');
    } catch (e) {
      // ignore
    }
  },
}));
