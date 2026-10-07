import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, ShieldCheck } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { MemberAvatar } from './MemberAvatar';
import { StatusBadge } from './StatusBadge';
import { DistanceBadge } from './DistanceBadge';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const MemberCard = ({
  member,
  distanceMeters,
  onPress,
  showNavigateAction = false,
  onNavigate,
  isHighlighted = false,
  isCurrentUser = false,
}) => {
  const { triggerLight } = useHapticFeedback();

  const handlePress = () => {
    triggerLight();
    onPress && onPress(member);
  };

  const isOrganizer = member.role === 'organizer' || member.isOrganizer;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={handlePress}
      style={[
        styles.card,
        isHighlighted && styles.cardHighlighted,
        isCurrentUser && styles.cardCurrentUser,
      ]}
    >
      <View style={styles.leftRow}>
        <MemberAvatar
          uri={member.avatar}
          name={member.name}
          size="md"
          status={member.status}
        />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {member.name}
            </Text>
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
            {isOrganizer ? (
              <View style={styles.organizerBadge}>
                <Text style={styles.organizerText}>HOST</Text>
              </View>
            ) : !isCurrentUser ? (
              <View style={styles.crewBadge}>
                <Text style={styles.crewBadgeText}>CREW</Text>
              </View>
            ) : null}
            {member.isSafe && (
              <ShieldCheck size={14} color={COLORS.success} style={styles.safeIcon} />
            )}
          </View>
          <View style={styles.statusRow}>
            <StatusBadge
              status={member.status}
              lastSeenSecondsAgo={member.lastSeenSecondsAgo}
              size="sm"
            />
            {member.cluster && (
              <Text style={styles.clusterText} numberOfLines={1}>
                • {member.cluster}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightRow}>
        {distanceMeters !== undefined && (
          <DistanceBadge meters={distanceMeters} isHighlight={isHighlighted} />
        )}
        <ChevronRight size={18} color={COLORS.textMuted} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  cardHighlighted: {
    borderColor: COLORS.primary,
    backgroundColor: '#F8FAFF',
  },
  cardCurrentUser: {
    borderColor: '#93C5FD',
    backgroundColor: '#F0F7FF',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  youBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  organizerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  organizerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  crewBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  crewBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  safeIcon: {
    marginLeft: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clusterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontSize: 11,
    flex: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 6,
  },
});
