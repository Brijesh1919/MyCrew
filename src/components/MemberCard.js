import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, ShieldCheck, BatteryWarning } from 'lucide-react-native';
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
  variant = 'row',
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
        variant === 'card' ? styles.card : styles.row,
        isHighlighted && (variant === 'card' ? styles.cardHighlighted : styles.rowHighlighted),
        isCurrentUser && (variant === 'card' ? styles.cardCurrentUser : styles.rowCurrentUser),
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
            {member.battery !== null && member.battery !== undefined && member.battery <= 20 && (
              <View style={styles.lowBatteryBadge}>
                <BatteryWarning size={12} color={COLORS.danger} />
                <Text style={styles.lowBatteryText}>{member.battery}%</Text>
              </View>
            )}
            {member.cluster && member.cluster !== 'Active Crew' && member.status !== 'offline' && (
              <Text style={styles.clusterText} numberOfLines={1}>
                • {member.cluster}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightRow}>
        {!isCurrentUser && distanceMeters !== undefined && distanceMeters !== null && member.status !== 'offline' && (
          <DistanceBadge meters={distanceMeters} isHighlight={isHighlighted} />
        )}
        <ChevronRight size={18} color={COLORS.textMuted} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 58,
  },
  rowHighlighted: {
    backgroundColor: '#F0F7FF',
  },
  rowCurrentUser: {
    backgroundColor: '#F8FAFC',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOWS.sm,
  },
  cardHighlighted: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFF',
  },
  cardCurrentUser: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
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
  lowBatteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 3,
  },
  lowBatteryText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.danger,
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
