import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Users, Copy, Sparkles } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { formatRemainingTime } from '../utils/freshness';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const TripCard = ({
  trip,
  membersCount = 0,
  onPress,
  onCopyCode,
}) => {
  const { triggerSuccess } = useHapticFeedback();
  const timeLeft = formatRemainingTime(trip?.endTime);

  const handleCopy = () => {
    triggerSuccess();
    onCopyCode && onCopyCode(trip?.code);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Text style={styles.emoji}>{trip?.emoji || '🎪'}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{trip?.type?.toUpperCase() || 'EVENT'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.codeButton}
          activeOpacity={0.7}
          onPress={handleCopy}
        >
          <Text style={styles.codeText}>{trip?.code || 'MYCREW'}</Text>
          <Copy size={13} color={COLORS.primary} style={styles.copyIcon} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {trip?.name || 'Active Crew Trip'}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Users size={15} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>
            {membersCount} connected
          </Text>
        </View>

        <View style={styles.metaDot} />

        <View style={styles.metaItem}>
          <Clock size={15} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>
            Ends in {timeLeft}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  codeText: {
    fontWeight: '800',
    color: COLORS.primary,
    fontSize: 13,
    letterSpacing: 1,
  },
  copyIcon: {
    marginLeft: 5,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 19,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
});
