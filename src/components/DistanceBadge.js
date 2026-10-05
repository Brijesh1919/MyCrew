import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { formatDistance } from '../utils/distance';

export const DistanceBadge = ({ meters, size = 'md', isHighlight = false }) => {
  return (
    <View
      style={[
        styles.badge,
        isHighlight ? styles.badgeHighlight : styles.badgeDefault,
        size === 'lg' && styles.badgeLg,
      ]}
    >
      <Text
        style={[
          styles.text,
          isHighlight ? styles.textHighlight : styles.textDefault,
          size === 'lg' && styles.textLg,
        ]}
      >
        {formatDistance(meters)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeDefault: {
    backgroundColor: COLORS.surfaceSubtle,
  },
  badgeHighlight: {
    backgroundColor: COLORS.primaryLight,
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  text: {
    ...TYPOGRAPHY.badge,
    fontSize: 12,
  },
  textDefault: {
    color: COLORS.textSecondary,
  },
  textHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  textLg: {
    fontSize: 15,
  },
});
