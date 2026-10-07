// ==========================================================
// MyCrew - Supabase Client Instance
// ==========================================================

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { APP_CONFIG } from '../constants/config';

const fallbackUrl = 'https://duwtfgpoodwmboehfioe.supabase.co';
const fallbackKey = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1d3RmZ3Bvb2R3bWJvZWhmaW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDQ4MTUsImV4cCI6MjEwNjc4MDgxNX0',
  'TeuMOX8USC6ArEMlGNINSe63EGF6pCI1TFKpnCuByVE',
].join('.');

const supabaseUrl = APP_CONFIG.supabase?.url || fallbackUrl;
const supabaseAnonKey = APP_CONFIG.supabase?.anonKey || fallbackKey;

let client;
try {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
} catch (e) {
  console.warn('Failed to initialize Supabase client:', e);
  client = createClient(fallbackUrl, fallbackKey);
}

export const supabase = client;
