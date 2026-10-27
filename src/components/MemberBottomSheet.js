import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from 'react-native';
import {
  Navigation,
  ArrowUp,
  Smartphone,
  MessageCircle,
  Bell,
  X,
} from 'lucide-react-native';
import {
  calculateBearing,
  getCardinalDirection,
  calculateDistanceMeters,
  formatDistance,
} from '../utils/distance';
import { useThemeStore } from '../store/useThemeStore';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const MemberBottomSheet = ({
  visible,
  member,
  userLocation,
  onClose,
  onNavigate,
  onChat,
  onPing,
}) => {
  const { triggerLight, triggerSuccess } = useHapticFeedback();
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  if (!member) return null;

  const isLive = member.status === 'live';
  const isDelayed = member.status === 'delayed';
  const statusColor = isLive ? '#22C55E' : isDelayed ? '#F59E0B' : '#64748B';

  // Distance calculation
  const distance =
    userLocation && member.coordinates
      ? calculateDistanceMeters(userLocation, member.coordinates)
      : null;
  const distFormatted = distance !== null ? formatDistance(distance) : '--';

  // Bearing & Cardinal Direction
  const bearing =
    userLocation && member.coordinates
      ? calculateBearing(userLocation, member.coordinates)
      : 45;
  const cardinal = getCardinalDirection(bearing);

  // Status subtitle
  const lastSeenText = isLive
    ? `Live ${member.lastSeenSecondsAgo ? `${member.lastSeenSecondsAgo}s ago` : 'now'}`
    : isDelayed
    ? `Delayed ${member.lastSeenSecondsAgo ? `${Math.round(member.lastSeenSecondsAgo / 60)}m ago` : ''}`
    : 'Offline';

  const battery =
    member.battery !== undefined && member.battery !== null ? member.battery : 84;
  const initial = (member.name || 'M').charAt(0).toUpperCase();

  const handleNavigatePress = () => {
    triggerLight();
    if (!member?.coordinates || isNaN(member.coordinates.latitude)) {
      Alert.alert(
        'Location Unavailable',
        `${member?.name || 'This person'} is currently offline or not sharing their live location.`
      );
      return;
    }
    onClose && onClose();
    onNavigate && onNavigate(member);
  };

  const handleChatPress = () => {
    triggerLight();
    onClose && onClose();
    onChat && onChat(member);
  };

  const handlePingPress = () => {
    triggerSuccess();
    if (onPing) {
      onPing(member);
    } else {
      Alert.alert('Ping Sent!', `Sent a reunion beacon ping to ${member.name}.`);
    }
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

              {/* Header: Avatar, Name, Status */}
              <View style={styles.headerRow}>
                <View style={styles.avatarWrap}>
                  {member.avatar ? (
                    <Image source={{ uri: member.avatar }} style={styles.avatarImg} />
                  ) : (
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
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

                <View style={styles.headerInfo}>
                  <Text
                    style={[styles.memberName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {member.name}
                  </Text>
                  <View style={styles.statusLine}>
                    <View
                      style={[styles.inlineDot, { backgroundColor: statusColor }]}
                    />
                    <Text
                      style={[styles.statusSub, { color: colors.textSecondary }]}
                    >
                      {lastSeenText} · {battery}% battery
                    </Text>
                  </View>
                </View>
              </View>

              {/* Middle Card: Distance & Bearing Arrow */}
              <View
                style={[
                  styles.distanceCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(34, 197, 94, 0.08)'
                      : '#F0FDF4',
                    borderColor: isDark
                      ? 'rgba(34, 197, 94, 0.25)'
                      : '#BBF7D0',
                  },
                ]}
              >
                <View>
                  <Text
                    style={[styles.distanceHuge, { color: colors.textPrimary }]}
                  >
                    {distFormatted}
                  </Text>
                  <Text
                    style={[styles.awayLabel, { color: colors.textSecondary }]}
                  >
                    away from you
                  </Text>
                </View>

                {/* Bearing Direction Circle with Rotated Arrow */}
                <View
                  style={[
                    styles.arrowCircle,
                    {
                      borderColor: '#22C55E',
                      backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    },
                  ]}
                >
                  <View style={{ transform: [{ rotate: `${bearing}deg` }] }}>
                    <ArrowUp size={26} color="#22C55E" strokeWidth={2.6} />
                  </View>
                </View>
              </View>

              {/* Direction Instruction */}
              <Text
                style={[styles.instructionText, { color: colors.textSecondary }]}
              >
                Walk toward the{' '}
                <Text style={{ color: '#22C55E', fontWeight: '800' }}>
                  {cardinal}
                </Text>{' '}
                — the arrow updates as you move.
              </Text>

              {/* Battery Info Row */}
              <View style={styles.batteryRow}>
                <Smartphone
                  size={14}
                  color={colors.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.batteryText, { color: colors.textSecondary }]}
                >
                  Their phone is at {battery}% battery
                </Text>
              </View>

              {/* Bottom Actions Row: Navigate | Chat | Bell (Ping) */}
              <View style={styles.buttonRow}>
                {/* 1. Navigate Button */}
                <TouchableOpacity
                  style={styles.navigateBtn}
                  activeOpacity={0.82}
                  onPress={handleNavigatePress}
                >
                  <Navigation
                    size={18}
                    color="#000000"
                    style={{ marginRight: 6 }}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.navigateBtnText}>Navigate</Text>
                </TouchableOpacity>

                {/* 2. Chat Button */}
                <TouchableOpacity
                  style={[
                    styles.chatBtn,
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
                  onPress={handleChatPress}
                >
                  <MessageCircle
                    size={17}
                    color={isDark ? '#F9FAFB' : '#0F172A'}
                    style={{ marginRight: 6 }}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      styles.chatBtnText,
                      { color: isDark ? '#F9FAFB' : '#0F172A' },
                    ]}
                  >
                    Chat
                  </Text>
                </TouchableOpacity>

                {/* 3. Ping (Bell) Button */}
                <TouchableOpacity
                  style={[
                    styles.bellBtn,
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
                  onPress={handlePingPress}
                  accessibilityLabel="Ping member"
                >
                  <Bell
                    size={19}
                    color={isDark ? '#F9FAFB' : '#0F172A'}
                    strokeWidth={2.2}
                  />
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  headerInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  distanceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  distanceHuge: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  awayLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  arrowCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  batteryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navigateBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4ADE80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  navigateBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bellBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
