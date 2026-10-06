// ==========================================================
// MyCrew - TripHistoryCard Component
// Clean reusable card for past/expired trips and active list
// ==========================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Users, ChevronRight, ShieldCheck, Clock } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { getTripStatusBadge } from '../utils/tripStatus';

export const TripHistoryCard = ({ trip, onPress }) => {
  if (!trip) return null;

  const badge = getTripStatusBadge(trip);

  // Format dates
  const startDate = trip.starts_at || trip.startTime ? new Date(trip.starts_at || trip.startTime) : null;
  const endDate = trip.ends_at || trip.endTime ? new Date(trip.ends_at || trip.endTime) : null;

  let formattedDateRange = 'Past Outing';
  if (startDate && !isNaN(startDate.getTime())) {
    const dateStr = startDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = startDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endTimeStr = endDate && !isNaN(endDate.getTime())
      ? endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : '';
    formattedDateRange = endTimeStr ? `${dateStr} · ${timeStr} – ${endTimeStr}` : `${dateStr} · ${timeStr}`;
  }

  const isOrganizer = trip.userRole === 'organizer';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(trip)}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiText}>{trip.emoji || '🎪'}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.tripName} numberOfLines={1}>
              {trip.name}
            </Text>
            <Text style={styles.dateText} numberOfLines={1}>
              {formattedDateRange}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            badge.status === 'active' && styles.statusActive,
            badge.status === 'upcoming' && styles.statusUpcoming,
            badge.status === 'expired' && styles.statusExpired,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              badge.status === 'active' && styles.statusActiveText,
              badge.status === 'upcoming' && styles.statusUpcomingText,
              badge.status === 'expired' && styles.statusExpiredText,
            ]}
          >
            {badge.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomMetaRow}>
        <View style={styles.metaPill}>
          <Users size={12} color={COLORS.textSecondary} />
          <Text style={styles.metaPillText}>
            {trip.memberCount || 1} {trip.memberCount === 1 ? 'member' : 'members'}
          </Text>
        </View>

        <View style={styles.metaPill}>
          <Text style={styles.roleText}>{isOrganizer ? '👑 Host' : '👤 Member'}</Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.viewDetailsRow}>
          <Text style={styles.viewDetailsText}>Details</Text>
          <ChevronRight size={14} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emojiText: {
    fontSize: 22,
  },
  nameBlock: {
    flex: 1,
  },
  tripName: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusActive: {
    backgroundColor: COLORS.successBg,
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  statusUpcoming: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  statusExpired: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActiveText: {
    color: COLORS.success,
  },
  statusUpcomingText: {
    color: COLORS.primary,
  },
  statusExpiredText: {
    color: COLORS.textSecondary,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  metaPillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  roleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 2,
  },
});
