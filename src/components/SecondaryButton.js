import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useThemeStore } from '../store/useThemeStore';

export const SecondaryButton = ({
  title,
  onPress,
  icon: IconComponent = null,
  disabled = false,
  variant = 'outline', // 'outline' | 'subtle' | 'ghost'
  size = 'md',
  fullWidth = true,
  style,
  textStyle,
}) => {
  const { triggerLight } = useHapticFeedback();
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  const handlePress = () => {
    if (disabled) return;
    triggerLight();
    onPress && onPress();
  };

  const getDynamicContainerStyle = () => {
    if (variant === 'ghost') {
      return { backgroundColor: 'transparent' };
    }
    if (variant === 'subtle') {
      return { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : colors.surfaceSubtle };
    }
    return {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: isDark ? '#374151' : colors.border,
    };
  };

  const getTextColor = () => {
    if (variant === 'subtle') return colors.primary;
    if (variant === 'ghost') return colors.textSecondary;
    return colors.primary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        getDynamicContainerStyle(),
        { width: fullWidth ? '100%' : 'auto' },
        size === 'sm' && styles.btnSm,
        size === 'lg' && styles.btnLg,
        style,
      ]}
    >
      <View style={styles.content}>
        {IconComponent && (
          <View style={styles.iconContainer}>
            <IconComponent size={size === 'sm' ? 16 : 18} color={getTextColor()} />
          </View>
        )}
        <Text
          style={[
            styles.text,
            { color: getTextColor() },
            size === 'sm' && styles.textSm,
            size === 'lg' && styles.textLg,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  btnSm: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  btnLg: {
    height: 54,
    paddingHorizontal: 22,
    borderRadius: RADIUS.xl,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  subtle: {
    backgroundColor: COLORS.primaryLight,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 6,
  },
  text: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    fontSize: 15,
  },
  textSm: {
    fontSize: 13,
  },
  textLg: {
    fontSize: 16,
  },
});
