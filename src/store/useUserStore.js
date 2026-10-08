// ==========================================================
// MyCrew - Real User & Auth Store
// Backed by Supabase Auth and public.profiles
// ==========================================================

import { create } from 'zustand';
import { authService } from '../services/authService';
import { analytics } from '../services/analyticsService';
import { crashlytics } from '../services/crashlyticsService';

export const useUserStore = create((set, get) => ({
  // Real authentication state (No mock defaults)
  session: null,
  currentUser: null, // { id, email, name, avatar, isSafe, trackingMode }
  profile: null,
  authStatus: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
  isAuthInitialized: false,

  /**
   * Initializes real Supabase auth session on app startup
   */
  initializeAuth: async () => {
    try {
      const { session, user } = await authService.getSession();

      if (session && user) {
        const profile = await authService.getProfile(user.id);
        const displayName =
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Crew Member';

        set({
          session,
          profile,
          currentUser: {
            id: user.id,
            email: user.email,
            name: displayName,
            avatar: profile?.avatar_url || user.user_metadata?.avatar_url || null,
            phone: profile?.phone || user.user_metadata?.phone || null,
            isSafe: true,
            trackingMode: 'crowded',
          },
          authStatus: 'authenticated',
          isAuthInitialized: true,
        });

        // Restore user's persistent trips from Supabase
        const { useTripStore } = require('./useTripStore');
        useTripStore.getState().fetchUserTrips(user.id);
        analytics.setUserId(user.id);
        crashlytics.setUserId(user.id);
      } else {
        set({
          session: null,
          currentUser: null,
          profile: null,
          authStatus: 'unauthenticated',
          isAuthInitialized: true,
        });
        analytics.setUserId(null);
        crashlytics.setUserId(null);
      }

      // Subscribe to real-time auth changes
      authService.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession?.user) {
          analytics.setUserId(newSession.user.id);
          crashlytics.setUserId(newSession.user.id);
          analytics.logLogin();
          const profile = await authService.getProfile(newSession.user.id);
          const displayName =
            profile?.full_name ||
            newSession.user.user_metadata?.full_name ||
            newSession.user.user_metadata?.name ||
            newSession.user.email?.split('@')[0] ||
            'Crew Member';

          set({
            session: newSession,
            profile,
            currentUser: {
              id: newSession.user.id,
              email: newSession.user.email,
              name: displayName,
              avatar: profile?.avatar_url || newSession.user.user_metadata?.avatar_url || null,
              phone: profile?.phone || newSession.user.user_metadata?.phone || null,
              isSafe: true,
              trackingMode: 'crowded',
            },
            authStatus: 'authenticated',
          });

          const { useTripStore } = require('./useTripStore');
          useTripStore.getState().fetchUserTrips(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          analytics.setUserId(null);
          crashlytics.setUserId(null);
          const { useTripStore } = require('./useTripStore');
          useTripStore.getState().clearStoreOnLogout();

          set({
            session: null,
            currentUser: null,
            profile: null,
            authStatus: 'unauthenticated',
          });
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          set({ session: newSession });
        }
      });
    } catch (err) {
      console.warn('initializeAuth exception:', err);
      set({
        session: null,
        currentUser: null,
        authStatus: 'unauthenticated',
        isAuthInitialized: true,
      });
    }
  },

  /**
   * Set user session after successful signup or login
   */
  setSession: (session, user, profile) => {
    const displayName =
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'Crew Member';

    set({
      session,
      profile,
      currentUser: user
        ? {
            id: user.id,
            email: user.email,
            name: displayName,
            avatar: profile?.avatar_url || user.user_metadata?.avatar_url || null,
            phone: profile?.phone || user.user_metadata?.phone || null,
            isSafe: true,
            trackingMode: 'crowded',
          }
        : null,
      authStatus: user ? 'authenticated' : 'unauthenticated',
    });

    if (user?.id) {
      const { useTripStore } = require('./useTripStore');
      useTripStore.getState().fetchUserTrips(user.id);
    }
  },

  /**
   * Update profile in Supabase and local store
   */
  updateProfile: async (updates) => {
    const current = get().currentUser;
    if (!current?.id) return;

    // Update local state immediately
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        ...updates,
      },
    }));

    // Sync to Supabase public.profiles
    const profilePayload = {};
    if (updates.name !== undefined) profilePayload.full_name = updates.name.trim();
    if (updates.avatar !== undefined) profilePayload.avatar_url = updates.avatar;
    if (updates.phone !== undefined) profilePayload.phone = updates.phone ? updates.phone.trim() : null;

    if (Object.keys(profilePayload).length > 0) {
      await authService.upsertProfile(current.id, profilePayload);
    }

    // Also sync to public.trip_members if in an active trip
    try {
      const { useTripStore } = require('./useTripStore');
      const activeTrip = useTripStore.getState().activeTrip;
      if (activeTrip?.id && !String(activeTrip.id).startsWith('trip_goa')) {
        const { supabase } = require('../services/supabase');
        const memberPayload = {};
        if (updates.name !== undefined) memberPayload.user_name = updates.name.trim();
        if (updates.avatar !== undefined) memberPayload.avatar_url = updates.avatar;
        if (updates.phone !== undefined) memberPayload.phone = updates.phone ? updates.phone.trim() : null;

        if (Object.keys(memberPayload).length > 0) {
          await supabase
            .from('trip_members')
            .update(memberPayload)
            .match({ trip_id: activeTrip.id, user_id: current.id });
        }
      }

      // Update in useCrewStore
      const { useCrewStore } = require('./useCrewStore');
      const members = useCrewStore.getState().members;
      const idx = members.findIndex((m) => m.id === current.id || m.id === 'user');
      if (idx >= 0) {
        const updatedMembers = [...members];
        updatedMembers[idx] = {
          ...updatedMembers[idx],
          name: updates.name !== undefined ? updates.name : updatedMembers[idx].name,
          avatar: updates.avatar !== undefined ? updates.avatar : updatedMembers[idx].avatar,
          phone: updates.phone !== undefined ? updates.phone : updatedMembers[idx].phone,
        };
        useCrewStore.getState().setMembers(updatedMembers);
      }
    } catch (e) {
      console.warn('Error syncing member updates:', e);
    }
  },

  setUserName: async (name) => {
    const cleanName = name.trim() || 'You';
    const current = get().currentUser;
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, name: cleanName } : null,
    }));
    if (current?.id) {
      await authService.upsertProfile(current.id, { full_name: cleanName });
    }
  },

  toggleSafeCheckIn: () => {
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, isSafe: !state.currentUser.isSafe }
        : null,
    }));
  },

  setTrackingMode: (modeId) => {
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, trackingMode: modeId }
        : null,
    }));
  },

  /**
   * Cleanly log out and clear user state
   */
  clearAuth: async () => {
    const { useTripStore } = require('./useTripStore');
    useTripStore.getState().clearStoreOnLogout();
    await authService.signOut();
    set({
      session: null,
      currentUser: null,
      profile: null,
      authStatus: 'unauthenticated',
    });
  },
}));
