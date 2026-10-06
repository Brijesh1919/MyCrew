// ==========================================================
// MyCrew - HistoricalTripModal Component
// Clean read-only detail view for past/expired trips
// ==========================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  KeyRound,
  MapPin,
  CheckCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { getTripStatusBadge } from '../utils/tripStatus';

export const HistoricalTripModal = ({ visible, trip, onClose }) => {
  if (!trip) return null;

  const badge = getTripStatusBadge(trip);

  const startDate = trip.starts_at || trip.startTime ? new Date(trip.starts_at || trip.startTime) : null;
  const endDate = trip.ends_at || trip.endTime ? new Date(trip.ends_at || trip.endTime) : null;

  // Duration calculation
  let durationStr = '--';
  if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    durationStr = `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }

  const isOrganizer = trip.userRole === 'organizer';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.titleRow}>
              <View style={styles.emojiBadge}>
                <Text style={styles.emojiText}>{trip.emoji || '🎪'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {trip.name}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusPill,
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
                  <Text style={styles.roleSubtext}>
                    {isOrganizer ? '• You were Host' : '• You joined as Member'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Historical Notice Card */}
            <View style={styles.noticeCard}>
              <ShieldCheck size={18} color={COLORS.success} />
              <View style={styles.noticeTextCol}>
                <Text style={styles.noticeTitle}>Temporary trip completed</Text>
                <Text style={styles.noticeDesc}>
                  Location sharing ended when this trip expired. All member GPS tracking is terminated.
                </Text>
              </View>
            </View>

            {/* Structured Details Grid */}
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Calendar size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>TIMEFRAME</Text>
                  <Text style={styles.detailValue}>
                    {startDate ? startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Past'}
                    {endDate ? ` · Ended ${endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Clock size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>TOTAL DURATION</Text>
                  <Text style={styles.detailValue}>{durationStr}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Users size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>CREW MEMBERS</Text>
                  <Text style={styles.detailValue}>
                    {trip.memberCount || 1} connected members
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <KeyRound size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>TRIP CODE</Text>
                  <Text style={styles.detailValueCode}>{trip.code || trip.trip_code}</Text>
                </View>
              </View>

              {trip.locationName && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <MapPin size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>LOCATION</Text>
                      <Text style={styles.detailValue}>{trip.locationName}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
    ...SHADOWS.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  emojiBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emojiText: {
    fontSize: 24,
  },
  sheetTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  statusActive: {
    backgroundColor: COLORS.successBg,
  },
  statusUpcoming: {
    backgroundColor: '#EFF6FF',
  },
  statusExpired: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
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
  roleSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScroll: {
    marginTop: 6,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  noticeTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  noticeDesc: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
    marginTop: 2,
  },
  detailsBox: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  detailValueCode: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLORS.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
