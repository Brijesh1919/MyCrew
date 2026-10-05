export const COLORS = {
  primary: '#2563EB',      // Main brand blue
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  secondary: '#3B82F6',    // Secondary blue
  accent: '#0EA5E9',       // Cyan/Sky accent
  success: '#22C55E',      // Green (Live / Safe)
  successBg: '#DCFCE7',
  warning: '#F59E0B',      // Amber (Delayed)
  warningBg: '#FEF3C7',
  danger: '#EF4444',       // Red (Offline / Emergency / I'm Lost)
  dangerBg: '#FEE2E2',
  background: '#F8FAFC',   // Off-white sleek background
  surface: '#FFFFFF',      // Pure white cards
  surfaceSubtle: '#F1F5F9', // Subtle card background
  cardBorder: '#E2E8F0',
  textPrimary: '#0F172A',  // Slate 900
  textSecondary: '#64748B',// Slate 500
  textMuted: '#94A3B8',    // Slate 400
  white: '#FFFFFF',
  darkMapOverlay: '#0F172A',
  pulseRing: 'rgba(34, 197, 94, 0.25)',
  radarSweep: 'rgba(37, 99, 235, 0.15)',
  clusterBg: '#2563EB',
  clusterBorder: '#60A5FA',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color = COLORS.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  bodySecondary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
};
