// ==========================================================
// MyCrew - Authentication Service
// Encapsulates Supabase Auth, Profiles, and OAuth flows
// ==========================================================

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';

// Ensure WebBrowser completes redirect on web & native
WebBrowser.maybeCompleteAuthSession();

/**
 * Translates raw backend errors into consumer-friendly messages.
 */
function translateAuthError(error) {
  if (!error) return 'An unknown error occurred.';
  const msg = typeof error === 'string' ? error : error.message || '';

  if (/invalid login credentials/i.test(msg) || /invalid grant/i.test(msg)) {
    return 'Email or password is incorrect.';
  }
  if (/user already registered/i.test(msg) || /already exists/i.test(msg)) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (/email not confirmed/i.test(msg)) {
    return 'Please confirm your email address or check your inbox.';
  }
  if (/password.*(least|short|characters)/i.test(msg)) {
    return 'Password must be at least 8 characters.';
  }
  if (/unsupported provider/i.test(msg) || /provider is not enabled/i.test(msg)) {
    return 'Google sign-in is not yet enabled in the Supabase Dashboard. Please enable the Google provider in Supabase Auth -> Providers.';
  }
  if (/network/i.test(msg) || /fetch failed/i.test(msg) || /failed to fetch/i.test(msg)) {
    return "We couldn't connect to MyCrew. Check your internet connection and try again.";
  }
  if (/rate limit/i.test(msg) || /too many requests/i.test(msg)) {
    return 'Too many attempts. Please wait a minute and try again.';
  }

  return msg || 'Something went wrong. Please try again.';
}

class AuthService {
  /**
   * Get current Supabase session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session: data.session, user: data.session?.user || null };
    } catch (err) {
      console.warn('AuthService.getSession error:', err);
      return { session: null, user: null };
    }
  }

  /**
   * Listen to auth state transitions
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  /**
   * Email & Password Sign Up
   */
  async signUp({ email, password, fullName }) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        return { success: false, error: translateAuthError(error) };
      }

      const user = data.user;
      if (user) {
        // Guarantee profile row is created / synced
        await this.upsertProfile(user.id, {
          full_name: cleanName,
        });
      }

      return {
        success: true,
        user,
        session: data.session,
      };
    } catch (err) {
      return { success: false, error: translateAuthError(err) };
    }
  }

  /**
   * Email & Password Sign In
   */
  async signIn({ email, password }) {
    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: translateAuthError(error) };
      }

      // Fetch or sync user profile
      let profile = null;
      if (data.user) {
        profile = await this.getProfile(data.user.id);
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        profile,
      };
    } catch (err) {
      return { success: false, error: translateAuthError(err) };
    }
  }

  /**
   * Google OAuth Sign In / Sign Up
   */
  async signInWithGoogle() {
    try {
      if (Platform.OS === 'web') {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) {
          return { success: false, error: translateAuthError(error) };
        }

        return { success: true, url: data?.url };
      } else {
        // Native (iOS / Android) Expo OAuth flow
        const redirectUrl = makeRedirectUri({
          scheme: 'mycrew',
          path: 'auth/callback',
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          return { success: false, error: translateAuthError(error) };
        }

        if (data?.url) {
          const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

          if (authResult.type === 'success' && authResult.url) {
            const { params } = QueryParams.getQueryParams(authResult.url);

            if (params.access_token && params.refresh_token) {
              const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              });

              if (sessionErr) throw sessionErr;
              return { success: true, session: sessionData.session };
            } else if (params.code) {
              const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(params.code);
              if (codeErr) throw codeErr;
              return { success: true, session: codeData.session };
            }
          }

          if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
            return { success: false, cancelled: true };
          }
        }

        return { success: true };
      }
    } catch (err) {
      return { success: false, error: translateAuthError(err) };
    }
  }

  /**
   * Password Reset Email
   */
  async resetPassword(email) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const redirectUrl = Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : 'mycrew://reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: translateAuthError(error) };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: translateAuthError(err) };
    }
  }

  /**
   * Sign Out
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('AuthService.signOut error:', err);
      return { success: false, error: translateAuthError(err) };
    }
  }

  /**
   * Fetch User Profile from public.profiles
   */
  async getProfile(userId) {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If not found, attempt to fetch user metadata from session
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const fallbackName = userData.user.user_metadata?.full_name ||
            userData.user.user_metadata?.name ||
            userData.user.email?.split('@')[0] ||
            'User';
          return {
            id: userId,
            full_name: fallbackName,
            avatar_url: userData.user.user_metadata?.avatar_url || null,
          };
        }
        return null;
      }

      return data;
    } catch (err) {
      console.warn('AuthService.getProfile error:', err);
      return null;
    }
  }

  /**
   * Upsert User Profile
   */
  async upsertProfile(userId, profileData) {
    if (!userId) return null;
    try {
      const payload = {
        id: userId,
        updated_at: new Date().toISOString(),
        ...profileData,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        console.warn('AuthService.upsertProfile error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.warn('AuthService.upsertProfile exception:', err);
      return null;
    }
  }
}

export const authService = new AuthService();
