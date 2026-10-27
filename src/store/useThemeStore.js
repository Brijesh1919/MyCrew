// ==========================================================
// MyCrew - Theme Store
// Supports Dark Mode, Light Mode, and System Default
// ==========================================================

import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/theme';

const THEME_STORAGE_KEY = '@mycrew_theme_mode';

const getSystemIsDark = () => Appearance.getColorScheme() === 'dark';

export const useThemeStore = create((set, get) => ({
  themeMode: 'dark', // Default to sleek tactical dark mode (as requested by reference design)
  isDark: true,
  colors: DARK_COLORS,
  isInitialized: false,

  /**
   * Initialize theme from AsyncStorage and listen to system changes
   */
  initializeTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const mode = savedMode === 'light' || savedMode === 'dark' || savedMode === 'system'
        ? savedMode
        : 'dark'; // Default dark mode

      const isDark = mode === 'system' ? getSystemIsDark() : mode === 'dark';
      const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

      set({
        themeMode: mode,
        isDark,
        colors,
        isInitialized: true,
      });

      // Listen for system theme changes if set to 'system'
      Appearance.addChangeListener(({ colorScheme }) => {
        if (get().themeMode === 'system') {
          const newIsDark = colorScheme === 'dark';
          set({
            isDark: newIsDark,
            colors: newIsDark ? DARK_COLORS : LIGHT_COLORS,
          });
        }
      });
    } catch (e) {
      console.warn('Failed to load theme:', e);
      set({ isInitialized: true });
    }
  },

  /**
   * Set theme mode ('light' | 'dark' | 'system')
   */
  setThemeMode: async (mode) => {
    try {
      const isDark = mode === 'system' ? getSystemIsDark() : mode === 'dark';
      const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

      set({
        themeMode: mode,
        isDark,
        colors,
      });

      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  },
}));
