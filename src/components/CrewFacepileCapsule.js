import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, ChevronRight } from 'lucide-react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { MemberAvatar } from './MemberAvatar';

/**
 * CrewFacepileCapsule
 * Sleek, modern floating capsule card on the map area.
 * Displays overlapping member avatars (facepile) + online status & crew count.
 */
export const CrewFacepileCapsule = ({
  members = [],
  onlineCount = 0,
  onPress,
  style,
}) => {
  // Sort so online/active members appear first in the avatar stack
  const sortedMembers = [...members].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (a.status !== 'live' && b.status === 'live') return 1;
    return 0;
  });

  const displayMembers = sortedMembers.slice(0, 3);
  const remainingCount = Math.max(0, members.length - 3);

  return (
    <TouchableOpacity
      style={[styles.capsule, style]}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Crew summary: ${members.length} members, ${onlineCount} online`}
    >
      {/* 1. OVERLAPPING AVATAR FACEPILE */}
      <View style={styles.facepileRow}>
        {displayMembers.length > 0 ? (
          displayMembers.map((m, index) => (
            <View
              key={m.id ? `face_${m.id}` : `face_idx_${index}`}
              style={[
                styles.avatarWrapper,
                index > 0 && styles.overlappingAvatar,
                { zIndex: 10 - index },
              ]}
            >
              <MemberAvatar
                uri={m.avatar}
                name={m.name}
                size="xs"
                showBorder={true}
                borderColor="rgba(15, 23, 42, 0.95)"
              />
            </View>
          ))
        ) : (
          <View style={styles.avatarWrapper}>
            <View style={styles.emptyAvatar}>
              <Users size={14} color="#94A3B8" />
            </View>
          </View>
        )}

        {/* Overflow Pill (+N) */}
        {remainingCount > 0 && (
          <View style={[styles.overflowBadge, { zIndex: 5 }]}>
            <Text style={styles.overflowText}>+{remainingCount}</Text>
          </View>
        )}
      </View>

      {/* 2. STATUS & COUNT TEXT */}
      <View style={styles.infoCol}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: onlineCount > 0 ? COLORS.success : COLORS.textMuted },
            ]}
          />
          <Text style={styles.statusText} numberOfLines={1}>
            {onlineCount > 0 ? `${onlineCount} Online` : 'Crew Active'}
          </Text>
        </View>

        <View style={styles.countRow}>
          <Users size={11} color="rgba(255, 255, 255, 0.72)" style={{ marginRight: 4 }} />
          <Text style={styles.countText} numberOfLines={1}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>

      {/* 3. CHEVRON ARROW */}
      <ChevronRight size={14} color="rgba(255, 255, 255, 0.55)" style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  facepileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  overlappingAvatar: {
    marginLeft: -10,
  },
  emptyAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.95)',
  },
  overflowBadge: {
    marginLeft: -9,
    height: 26,
    minWidth: 26,
    paddingHorizontal: 5,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overflowText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  infoCol: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  countText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 6,
  },
});
