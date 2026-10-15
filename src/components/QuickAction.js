import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const QuickAction = ({
  title,
  icon: IconComponent,
  onPress,
  variant = 'default', // 'default' | 'danger' | 'primary' | 'accent'
  badge = null,
}) => {
  const { triggerLight, triggerHeavy } = useHapticFeedback();

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

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.container,
        isDanger && styles.containerDanger,
        isPrimary && styles.containerPrimary,
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          isDanger && styles.iconCircleDanger,
          isPrimary && styles.iconCirclePrimary,
        ]}
      >
        <IconComponent
          size={20}
          color={isDanger ? COLORS.danger : isPrimary ? COLORS.white : COLORS.primary}
        />
      </View>
      <Text
        style={[
          styles.title,
          isDanger && styles.titleDanger,
          isPrimary && styles.titlePrimary,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {badge && (
        <View style={styles.badge}>
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
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 0,
    ...SHADOWS.sm,
  },
  containerDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  containerPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircleDanger: {
    backgroundColor: '#FEE2E2',
  },
  iconCirclePrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: -0.2,
  },
  titleDanger: {
    color: COLORS.danger,
  },
  titlePrimary: {
    color: COLORS.white,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
