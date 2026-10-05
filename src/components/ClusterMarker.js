import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const ClusterMarker = ({
  cluster,
  count,
  name,
  onPress,
  isSelected = false,
}) => {
  const { triggerLight } = useHapticFeedback();

  const handlePress = () => {
    triggerLight();
    onPress && onPress(cluster);
  };

  const getDimension = () => {
    if (count >= 10) return 46;
    if (count >= 5) return 42;
    return 38;
  };

  const dim = getDimension();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.container, isSelected && styles.selectedContainer]}
    >
      <View
        style={[
          styles.outerRing,
          { width: dim + 10, height: dim + 10, borderRadius: (dim + 10) / 2 },
        ]}
      />
      <View
        style={[
          styles.bubble,
          { width: dim, height: dim, borderRadius: dim / 2 },
          isSelected && styles.bubbleSelected,
        ]}
      >
        <Text style={styles.countText}>{count}</Text>
      </View>
      {name && (
        <View style={styles.namePill}>
          <Text style={styles.nameText} numberOfLines={1}>
            {name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 75,
  },
  selectedContainer: {
    transform: [{ scale: 1.12 }],
  },
  outerRing: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
  },
  bubble: {
    backgroundColor: COLORS.primary,
    borderWidth: 2.5,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  bubbleSelected: {
    backgroundColor: COLORS.primaryDark,
    borderColor: '#93C5FD',
  },
  countText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
  namePill: {
    marginTop: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 68,
  },
  nameText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
