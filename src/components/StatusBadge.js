import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { getLocationFreshness } from '../utils/freshness';

export const StatusBadge = ({
  status = 'live',
  lastSeenSecondsAgo = 0,
  showDetail = false,
  size = 'md',
}) => {
  const freshness = getLocationFreshness(lastSeenSecondsAgo);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: freshness.bgColor },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: freshness.color },
          size === 'sm' && styles.dotSm,
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: freshness.color },
          size === 'sm' && styles.textSm,
        ]}
      >
        {showDetail ? freshness.label : freshness.shortLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dotSm: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  text: {
    ...TYPOGRAPHY.badge,
    fontSize: 12,
  },
  textSm: {
    fontSize: 10,
  },
});
