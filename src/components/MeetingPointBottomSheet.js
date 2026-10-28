import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import {
  MapPin,
  Clock,
  FileText,
  Compass,
  ArrowUp,
  X,
  User,
} from 'lucide-react-native';
import {
  calculateBearing,
  getCardinalDirection,
  calculateDistanceMeters,
  formatDistance,
  getProximityColor,
} from '../utils/distance';
import { useThemeStore } from '../store/useThemeStore';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const MeetingPointBottomSheet = ({
  visible,
  meetingPoint,
  userLocation,
  onClose,
  onNavigate,
}) => {
  const { triggerLight, triggerSuccess } = useHapticFeedback();
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  if (!meetingPoint) return null;

  const coords =
    meetingPoint.coordinates ||
    (meetingPoint.latitude && meetingPoint.longitude
      ? {
        latitude: Number(meetingPoint.latitude),
        longitude: Number(meetingPoint.longitude),
      }
      : null);

  // Distance calculation
  const distance =
    userLocation && coords
      ? calculateDistanceMeters(userLocation, coords)
      : null;
  const distFormatted = distance !== null ? formatDistance(distance) : '--';

  // Bearing & Cardinal Direction
  const bearing =
    userLocation && coords ? calculateBearing(userLocation, coords) : 45;
  const cardinal = getCardinalDirection(bearing);
  const proximity = getProximityColor(distance, isDark, colors.primary);

  const landmark =
    meetingPoint.landmarkNote ||
    meetingPoint.description ||
    meetingPoint.landmark;
  const meetTime = meetingPoint.meetTime || meetingPoint.time;

  const handleNavigatePress = () => {
    triggerSuccess();
    if (!coords || isNaN(coords.latitude) || isNaN(coords.longitude)) {
      Alert.alert(
        'Location Unavailable',
        'This meeting point does not have valid GPS coordinates.'
      );
      return;
    }
    onClose && onClose();
    onNavigate && onNavigate(meetingPoint);
  };

  const handleClose = () => {
    triggerLight();
    onClose && onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
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

              {/* Header: Pin Icon, Name, Close Button */}
              <View style={styles.headerRow}>
                <View style={styles.titleGroup}>
                  <View
                    style={[
                      styles.pinIconBubble,
                      {
                        backgroundColor: proximity.circleBg,
                      },
                    ]}
                  >
                    <MapPin size={22} color={proximity.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.rallyBadge,
                          {
                            backgroundColor: proximity.badgeBg,
                          },
                        ]}
                      >
                        <Text style={[styles.rallyBadgeText, { color: proximity.badgeText }]}>RALLY POINT</Text>
                      </View>
                      {meetingPoint.isActive && (
                        <View
                          style={[
                            styles.livePill,
                            {
                              backgroundColor: proximity.badgeBg,
                            },
                          ]}
                        >
                          <Text style={[styles.livePillText, { color: proximity.badgeText }]}>ACTIVE NOW</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.pointName,
                        { color: isDark ? '#F9FAFB' : colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {meetingPoint.name || 'Meeting Point'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
                  ]}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X
                    size={18}
                    color={isDark ? '#9CA3AF' : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Distance Card with Dynamic Proximity & Compass Bearing */}
              <View
                style={[
                  styles.distanceCard,
                  {
                    backgroundColor: proximity.cardBg,
                    borderColor: proximity.cardBorder,
                  },
                ]}
              >
                <View style={styles.distLeft}>
                  <Text style={[styles.distNumber, { color: colors.textPrimary }]}>
                    {distFormatted}
                  </Text>
                  <Text style={[styles.distLabel, { color: colors.textSecondary }]}>
                    {distance !== null ? (
                      <>
                        Head{' '}
                        <Text style={{ color: proximity.accent, fontWeight: '800' }}>
                          {cardinal}
                        </Text>{' '}
                        • towards this rally point
                      </>
                    ) : (
                      'Calculating distance from GPS...'
                    )}
                  </Text>
                </View>
                <View
                  style={[
                    styles.bearingCircle,
                    {
                      borderColor: proximity.circleBorder,
                      backgroundColor: proximity.circleBg,
                      transform: [{ rotate: `${bearing}deg` }],
                    },
                  ]}
                >
                  <ArrowUp size={24} color={proximity.arrowColor} strokeWidth={2.6} />
                </View>
              </View>

              {/* Details: Scheduled Time & Landmark Note */}
              <View
                style={[
                  styles.detailsContainer,
                  {
                    backgroundColor: isDark ? '#1A2234' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                {meetTime ? (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <Clock size={16} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        SCHEDULED TIME
                      </Text>
                      <Text style={[styles.detailVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                        {meetTime}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {landmark ? (
                  <View
                    style={[
                      styles.detailRow,
                      meetTime && {
                        borderTopWidth: 1,
                        borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
                        paddingTop: 10,
                        marginTop: 10,
                      },
                    ]}
                  >
                    <View style={styles.detailIconWrap}>
                      <FileText size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        LANDMARK & NOTES
                      </Text>
                      <Text style={[styles.detailVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                        {landmark}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {meetingPoint.createdByName ? (
                  <View
                    style={[
                      styles.detailRow,
                      (meetTime || landmark) && {
                        borderTopWidth: 1,
                        borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
                        paddingTop: 10,
                        marginTop: 10,
                      },
                    ]}
                  >
                    <View style={styles.detailIconWrap}>
                      <User size={16} color="#A855F7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        CREATED BY
                      </Text>
                      <Text style={[styles.detailVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                        {meetingPoint.createdByName}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Action Button: Navigate to this Meeting Point */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.navigateBtn}
                  activeOpacity={0.88}
                  onPress={handleNavigatePress}
                >
                  <Compass
                    size={20}
                    color="#FFFFFF"
                    strokeWidth={2.4}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.navigateBtnText}>
                    Navigate to this Meeting Point
                  </Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
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
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  pinIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  rallyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rallyBadgeText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  livePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  livePillText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
  },
  pointName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  distLeft: {
    flex: 1,
    marginRight: 12,
  },
  distNumber: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  distLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  bearingCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconWrap: {
    marginRight: 10,
    marginTop: 2,
  },
  detailKey: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigateBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  navigateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
