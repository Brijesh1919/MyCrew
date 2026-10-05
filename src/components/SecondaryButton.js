import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

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

  const handlePress = () => {
    if (disabled) return;
    triggerLight();
    onPress && onPress();
  };

  const getContainerStyle = () => {
    if (variant === 'ghost') return styles.ghost;
    if (variant === 'subtle') return styles.subtle;
    return styles.outline;
  };

  const getTextColor = () => {
    if (variant === 'subtle') return COLORS.primary;
    if (variant === 'ghost') return COLORS.textSecondary;
    return COLORS.primary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        getContainerStyle(),
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
