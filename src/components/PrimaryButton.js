import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useThemeStore } from '../store/useThemeStore';

export const PrimaryButton = ({
  title,
  onPress,
  icon: IconComponent = null,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'danger' | 'success' | 'dark'
  size = 'md',        // 'sm' | 'md' | 'lg'
  fullWidth = true,
  style,
  textStyle,
}) => {
  const { triggerLight } = useHapticFeedback();
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  const handlePress = () => {
    if (disabled || loading) return;
    triggerLight();
    onPress && onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#374151' : '#CBD5E1';
    if (variant === 'danger') return colors.danger;
    if (variant === 'success') return colors.success;
    if (variant === 'dark') return colors.textPrimary;
    return colors.primary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          width: fullWidth ? '100%' : 'auto',
        },
        size === 'sm' && styles.btnSm,
        size === 'lg' && styles.btnLg,
        !disabled && SHADOWS.md,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <View style={styles.content}>
          {IconComponent && (
            <View style={styles.iconContainer}>
              <IconComponent size={size === 'sm' ? 16 : 20} color={COLORS.white} />
            </View>
          )}
          <Text
            style={[
              styles.text,
              size === 'sm' && styles.textSm,
              size === 'lg' && styles.textLg,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  btnSm: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
  },
  btnLg: {
    height: 58,
    paddingHorizontal: 24,
    borderRadius: RADIUS.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.white,
    fontSize: 16,
  },
  textSm: {
    fontSize: 14,
  },
  textLg: {
    fontSize: 17,
  },
});
