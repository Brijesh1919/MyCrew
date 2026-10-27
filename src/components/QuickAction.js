import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useThemeStore } from '../store/useThemeStore';

export const QuickAction = ({
  title,
  icon: IconComponent,
  onPress,
  variant = 'default', // 'default' | 'danger' | 'primary' | 'accent'
  badge = null,
}) => {
  const { triggerLight, triggerHeavy } = useHapticFeedback();
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  const handlePress = () => {
    if (variant === 'danger') {
      triggerHeavy();
    } else {
      triggerLight();
    }
    onPress && onPress();
  };

  const isDanger = variant === 'danger';
  const isPrimary = variant === 'primary';

  const containerBg = isDanger
    ? (isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2')
    : isPrimary
    ? colors.primary
    : colors.surface;

  const containerBorder = isDanger
    ? (isDark ? 'rgba(239, 68, 68, 0.28)' : '#FECACA')
    : isPrimary
    ? colors.primary
    : colors.border;

  const circleBg = isDanger
    ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')
    : isPrimary
    ? 'rgba(255, 255, 255, 0.2)'
    : colors.surfaceSubtle;

  const iconColor = isDanger
    ? colors.danger
    : isPrimary
    ? '#FFFFFF'
    : colors.primary;

  const titleColor = isDanger
    ? colors.danger
    : isPrimary
    ? '#FFFFFF'
    : colors.textPrimary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: containerBg,
          borderColor: containerBorder,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: circleBg }]}>
        <IconComponent size={20} color={iconColor} />
      </View>
      <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
        {title}
      </Text>
      {badge && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    minWidth: 0,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: -0.2,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
