import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { MemberAvatar } from './MemberAvatar';

export const MemberMarker = ({
  member,
  isUser = false,
  isSelected = false,
  onPress,
}) => {
  const isLive = member.status === 'live';
  const isDelayed = member.status === 'delayed';
  const isOffline = member.status === 'offline';

  const borderColor = isUser
    ? COLORS.primary
    : isLive
    ? COLORS.success
    : isDelayed
    ? COLORS.warning
    : '#94A3B8';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress && onPress(member)}
      style={[styles.container, isSelected && styles.selectedContainer]}
    >
      {/* Outer pulse ring for user or live members */}
      {isUser && <View style={[styles.pulseRing, styles.userPulseRing]} />}
      {!isUser && isLive && <View style={styles.pulseRing} />}

      {/* Marker Avatar Circle */}
      <View
        style={[
          styles.markerBubble,
          { borderColor },
          isUser && styles.userMarkerBubble,
          isSelected && styles.selectedMarkerBubble,
        ]}
      >
        <MemberAvatar
          uri={member.avatar}
          name={member.name}
          size="sm"
          isUser={isUser}
        />
      </View>

      {/* Name Label */}
      <View style={[styles.namePill, isUser && styles.userNamePill, isSelected && styles.selectedNamePill]}>
        <Text style={[styles.nameText, isUser && styles.userNameText]} numberOfLines={1}>
          {isUser ? 'YOU' : member.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 70,
  },
  selectedContainer: {
    transform: [{ scale: 1.15 }],
  },
  pulseRing: {
    position: 'absolute',
    top: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.28)',
  },
  userPulseRing: {
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    width: 48,
    height: 48,
    borderRadius: 24,
    top: 2,
  },
  markerBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    borderWidth: 2.5,
    borderColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  userMarkerBubble: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  selectedMarkerBubble: {
    borderColor: COLORS.textPrimary,
    borderWidth: 3,
  },
  namePill: {
    marginTop: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 58,
  },
  userNamePill: {
    backgroundColor: COLORS.primary,
  },
  selectedNamePill: {
    backgroundColor: COLORS.textPrimary,
  },
  nameText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  userNameText: {
    color: COLORS.white,
  },
});
