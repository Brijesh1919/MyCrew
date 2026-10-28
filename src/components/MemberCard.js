import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useThemeStore } from '../store/useThemeStore';

export const MemberCard = ({
  member,
  distanceMeters,
  onPress,
  onChatPress,
  isHighlighted = false,
  isCurrentUser = false,
  variant = 'row',
}) => {
  const { triggerLight } = useHapticFeedback();
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  const handlePress = () => {
    triggerLight();
    onPress && onPress(member);
  };

  const isOrganizer = member.role === 'organizer' || member.isOrganizer;
  const isLive = member.status === 'live';
  const isDelayed = member.status === 'delayed';
  const statusColor = isLive ? '#22C55E' : isDelayed ? '#F59E0B' : '#64748B';

  // Last seen text
  const lastSeenText = isLive
    ? `Live ${member.lastSeenSecondsAgo ? `${member.lastSeenSecondsAgo}s ago` : 'now'}`
    : isDelayed
    ? `Delayed ${member.lastSeenSecondsAgo ? `${Math.round(member.lastSeenSecondsAgo / 60)}m ago` : ''}`
    : 'Offline';

  const batteryText = member.battery !== undefined && member.battery !== null
    ? `${member.battery}% battery`
    : member.status !== 'offline' ? '84% battery' : '';

  const subtitle = member.status === 'offline'
    ? 'Offline · Sharing paused'
    : `${lastSeenText}${batteryText ? ` · ${batteryText}` : ''}`;

  // Formatted distance (e.g. 82m, 184m, 1.2km)
  const formatDist = (meters) => {
    if (meters === undefined || meters === null || isNaN(meters)) return '';
    const m = Math.round(meters);
    if (m < 1000) return `${m}m`;
    return `${(m / 1000).toFixed(1)}km`;
  };

  const distFormatted = formatDist(distanceMeters);

  // Avatar initial letter
  const initial = (member.name || 'M').charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[
        styles.row,
        { borderBottomColor: isDark ? '#1F2937' : colors.divider },
        isHighlighted && [
          styles.rowHighlighted,
          { borderColor: isDark ? '#374151' : colors.primary, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.08)' }
        ],
      ]}
    >
      {/* Left: Avatar with Status Dot */}
      <View style={styles.avatarWrap}>
        {member.avatar ? (
          <Image source={{ uri: member.avatar }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <Text style={[styles.avatarInitial, { color: isDark ? '#F9FAFB' : '#1E293B' }]}>{initial}</Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: statusColor, borderColor: isDark ? '#0B0F17' : '#FFFFFF' }]} />
      </View>

      {/* Center: Info */}
      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {member.name}
          </Text>
          {isOrganizer && (
            <View style={[styles.organizerBadge, { backgroundColor: isDark ? '#1E293B' : '#FEF3C7', borderColor: isDark ? '#334155' : '#FDE68A' }]}>
              <Text style={[styles.organizerText, { color: isDark ? '#94A3B8' : '#B45309' }]}>ORGANIZER</Text>
            </View>
          )}
          {isCurrentUser && (
            <View style={[styles.youBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE' }]}>
              <Text style={styles.youText}>YOU</Text>
            </View>
          )}
        </View>

        <View style={styles.subRow}>
          <View style={[styles.inlineStatusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.subText, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      {/* Right: Distance */}
      {distFormatted && member.status !== 'offline' ? (
        <Text style={[styles.distanceText, { color: colors.textPrimary }]}>
          {distFormatted}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  rowHighlighted: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  organizerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 8,
  },
  organizerText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 8,
  },
  youText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.6,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  inlineStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  subText: {
    fontSize: 13,
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginLeft: 10,
  },
});
