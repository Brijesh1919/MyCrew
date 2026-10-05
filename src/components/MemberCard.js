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
}) => {
  const { triggerLight } = useHapticFeedback();

  const handlePress = () => {
    triggerLight();
    onPress && onPress(member);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={handlePress}
      style={[
        styles.card,
        isHighlighted && styles.cardHighlighted,
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
            {member.isOrganizer && (
              <View style={styles.organizerBadge}>
                <Text style={styles.organizerText}>Host</Text>
              </View>
            )}
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
  organizerBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  organizerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
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
