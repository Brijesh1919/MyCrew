// ==========================================================
// MyCrew - Real User & Auth Store
// Backed by Supabase Auth and public.profiles
// ==========================================================

import { create } from 'zustand';
import { authService } from '../services/authService';

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
            isSafe: true,
            trackingMode: 'crowded',
          },
          authStatus: 'authenticated',
          isAuthInitialized: true,
        });

        // Restore user's persistent trips from Supabase
        const { useTripStore } = require('./useTripStore');
        useTripStore.getState().fetchUserTrips(user.id);
      } else {
        set({
          session: null,
          currentUser: null,
          profile: null,
          authStatus: 'unauthenticated',
          isAuthInitialized: true,
        });
      }

      // Subscribe to real-time auth changes
      authService.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession?.user) {
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
              isSafe: true,
              trackingMode: 'crowded',
            },
            authStatus: 'authenticated',
          });

          const { useTripStore } = require('./useTripStore');
          useTripStore.getState().fetchUserTrips(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
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
    if (updates.name) {
      await authService.upsertProfile(current.id, { full_name: updates.name });
    }
    if (updates.avatar) {
      await authService.upsertProfile(current.id, { avatar_url: updates.avatar });
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
