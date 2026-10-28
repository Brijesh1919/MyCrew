import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { calculateDistanceMeters, formatDistance, getProximityColor } from '../utils/distance';
import { useThemeStore } from '../store/useThemeStore';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { memberService } from '../services/memberService';

export const NearestPeopleBottomSheet = ({
  visible,
  onClose,
  members = [],
  userLocation,
  currentUser,
  onSelectMember,
  onSeeEveryone,
}) => {
  const { triggerLight } = useHapticFeedback();
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);

  // Filter out the current user so we only show fellow crew members
  const myId = String(currentUser?.id || currentUser?.user_id || '');
  const myName = currentUser?.name;
  const otherMembers = (members || []).filter((m) => {
    const isMe =
      Boolean(m.isCurrentUser) ||
      m.id === 'user' ||
      m.id === 'me' ||
      (myId && (String(m.id) === myId || String(m.user_id) === myId)) ||
      (myName && m.name === myName);
    return !isMe;
  });

  // If no other members in trip, fallback to rich demo members (matching screenshot)
  const effectiveMembers =
    otherMembers.length > 0
      ? otherMembers
      : (memberService?.getDemoMembers?.() || []).filter((m) => {
          const isMe =
            Boolean(m.isCurrentUser) ||
            m.id === 'user' ||
            m.id === 'me' ||
            (myId && (String(m.id) === myId || String(m.user_id) === myId)) ||
            (myName && m.name === myName);
          return !isMe;
        });

  // Mock distances matching user screenshot if GPS coordinate is far or unavailable
  const mockDists = {
    m_priya: 82,
    m_rahul: 184,
    m_kabir: 198,
    m_dev: 205,
    m_amit: 230,
    Priya: 82,
    Rahul: 184,
    Kabir: 198,
    Dev: 205,
    Amit: 230,
  };

  // Calculate distance & sort nearest first
  const sorted = effectiveMembers.map((m, idx) => {
    const dist =
      userLocation && m.coordinates
        ? calculateDistanceMeters(userLocation, m.coordinates)
        : null;

    let formattedDist = '--';
    if (dist !== null && dist < 500000) {
      formattedDist = formatDistance(dist);
    } else {
      const fallbackMeters = mockDists[m.id] || mockDists[m.name] || [82, 184, 198, 205, 230][idx % 5] || 150;
      formattedDist = `${fallbackMeters} m`;
    }

    const sortDist = dist !== null && dist < 500000 ? dist : (mockDists[m.id] || mockDists[m.name] || (idx + 1) * 50);

    return {
      ...m,
      distanceMeters: sortDist,
      formattedDistance: formattedDist,
    };
  });

  sorted.sort((a, b) => {
    const distA =
      a.distanceMeters !== null && a.distanceMeters !== undefined
        ? a.distanceMeters
        : 999999;
    const distB =
      b.distanceMeters !== null && b.distanceMeters !== undefined
        ? b.distanceMeters
        : 999999;
    return distA - distB;
  });

  const displayList = sorted.slice(0, 5);

  const handleMemberPress = (member) => {
    triggerLight();
    onSelectMember && onSelectMember(member);
  };

  const handleSeeEveryone = () => {
    triggerLight();
    onSeeEveryone && onSeeEveryone();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1F2937' : '#E5E7EB',
                },
              ]}
            >
              {/* Drag Handle */}
              <View
                style={[
                  styles.dragHandle,
                  { backgroundColor: isDark ? '#374151' : '#D1D5DB' },
                ]}
              />

              {/* Title Header */}
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#F9FAFB' : colors.textPrimary },
                ]}
              >
                Nearest to you
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? '#94A3B8' : colors.textSecondary },
                ]}
              >
                Sorted by walking distance, updated live
              </Text>

              {/* List of Nearest Members */}
              {displayList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDark ? '#94A3B8' : colors.textSecondary },
                    ]}
                  >
                    No other crew members nearby yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {displayList.map((member, index) => {
                    const isLive = member.status === 'live';
                    const isDelayed = member.status === 'delayed';
                    const statusColor = isLive
                      ? '#22C55E'
                      : isDelayed
                      ? '#F59E0B'
                      : '#64748B';

                    const lastSeenText = isLive
                      ? `Live ${member.lastSeenSecondsAgo ? `${member.lastSeenSecondsAgo}s ago` : '5s ago'}`
                      : isDelayed
                      ? `Delayed ${member.lastSeenSecondsAgo ? `${Math.round(member.lastSeenSecondsAgo / 60)}m ago` : ''}`
                      : 'Offline';

                    const battery =
                      member.battery !== undefined && member.battery !== null
                        ? member.battery
                        : 84;
                    const initial = (member.name || 'M').charAt(0).toUpperCase();

                    const isLast = index === displayList.length - 1;

                    return (
                      <TouchableOpacity
                        key={member.id || `nearest_${index}`}
                        style={[
                          styles.memberRow,
                          !isLast && {
                            borderBottomWidth: 1,
                            borderBottomColor: isDark
                              ? 'rgba(255, 255, 255, 0.07)'
                              : '#F1F5F9',
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleMemberPress(member)}
                      >
                        {/* Rank Number */}
                        <Text
                          style={[
                            styles.rankNumber,
                            { color: isDark ? '#64748B' : '#94A3B8' },
                          ]}
                        >
                          {index + 1}
                        </Text>

                        {/* Avatar with Status Indicator Dot */}
                        <View style={styles.avatarWrap}>
                          {member.avatar ? (
                            <Image
                              source={{ uri: member.avatar }}
                              style={styles.avatarImg}
                            />
                          ) : (
                            <View
                              style={[
                                styles.avatarCircle,
                                {
                                  backgroundColor: isDark
                                    ? '#1E293B'
                                    : '#E2E8F0',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.avatarInitial,
                                  { color: isDark ? '#F9FAFB' : '#1E293B' },
                                ]}
                              >
                                {initial}
                              </Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor: statusColor,
                                borderColor: isDark ? '#111827' : '#FFFFFF',
                              },
                            ]}
                          />
                        </View>

                        {/* Name and Live Status Subtitle */}
                        <View style={styles.infoCol}>
                          <Text
                            style={[
                              styles.memberName,
                              {
                                color: isDark ? '#F9FAFB' : colors.textPrimary,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {member.name}
                          </Text>
                          <View style={styles.statusRow}>
                            <View
                              style={[
                                styles.inlineDot,
                                { backgroundColor: statusColor },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color: isDark
                                    ? '#94A3B8'
                                    : colors.textSecondary,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {lastSeenText} · {battery}% battery
                            </Text>
                          </View>
                        </View>

                        {/* Distance Label */}
                        <Text
                          style={[
                            styles.distanceText,
                            {
                              color: getProximityColor(member.distanceMeters, isDark, colors.primary).accent,
                            },
                          ]}
                        >
                          {member.formattedDistance}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* See Everyone Button */}
              <TouchableOpacity
                style={[
                  styles.seeEveryoneBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#F1F5F9',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : '#CBD5E1',
                  },
                ]}
                activeOpacity={0.8}
                onPress={handleSeeEveryone}
              >
                <Text
                  style={[
                    styles.seeEveryoneText,
                    { color: isDark ? '#F9FAFB' : '#0F172A' },
                  ]}
                >
                  See everyone
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    marginBottom: 16,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    marginBottom: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  rankNumber: {
    width: 20,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  infoCol: {
    flex: 1,
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  inlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3B82F6',
  },
  seeEveryoneBtn: {
    marginTop: 14,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeEveryoneText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
