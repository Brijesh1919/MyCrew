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
  // 1. If explicitly offline (or sharing paused)
  if (status === 'offline') {
    let detailLabel = 'Offline';
    if (showDetail) {
      if (lastSeenSecondsAgo && lastSeenSecondsAgo >= 60 && lastSeenSecondsAgo < 999999) {
        const mins = Math.round(lastSeenSecondsAgo / 60);
        detailLabel = mins >= 60 ? `Offline • ${Math.round(mins / 60)}h ago` : `Offline • ${mins}m ago`;
      } else {
        detailLabel = 'Offline • Sharing Paused';
      }
    }

    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: COLORS.dangerBg },
          size === 'sm' && styles.badgeSm,
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: COLORS.danger },
            size === 'sm' && styles.dotSm,
          ]}
        />
        <Text
          style={[
            styles.text,
            { color: COLORS.danger },
            size === 'sm' && styles.textSm,
          ]}
        >
          {showDetail ? detailLabel : 'Offline'}
        </Text>
      </View>
    );
  }

  // 2. If explicitly delayed
  if (status === 'delayed') {
    const mins = lastSeenSecondsAgo ? Math.max(1, Math.round(lastSeenSecondsAgo / 60)) : 1;
    const detailLabel = `Delayed • ${mins}m ago`;

    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: COLORS.warningBg },
          size === 'sm' && styles.badgeSm,
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: COLORS.warning },
            size === 'sm' && styles.dotSm,
          ]}
        />
        <Text
          style={[
            styles.text,
            { color: COLORS.warning },
            size === 'sm' && styles.textSm,
          ]}
        >
          {showDetail ? detailLabel : 'Delayed'}
        </Text>
      </View>
    );
  }

  // 3. Status is live — verify signal freshness based on lastSeenSecondsAgo
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
