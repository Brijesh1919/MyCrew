import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Navigation,
  MapPin,
  Compass,
  Phone,
  Battery,
  ShieldCheck,
  Share2,
  MessageSquare,
} from 'lucide-react-native';
import { RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { useThemeStore } from '../../src/store/useThemeStore';
import { AppHeader } from '../../src/components/AppHeader';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { ContactNumberModal } from '../../src/components/ContactNumberModal';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useUserStore } from '../../src/store/useUserStore';
import { batteryService } from '../../src/services/batteryService';
import { calculateDistanceMeters, formatDistance } from '../../src/utils/distance';

export default function PersonDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Dynamic Theme
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);

  const members = useCrewStore((state) => state.members);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const isLocationSharingActive = useLocationStore((state) => state.isLocationSharingActive);
  const currentUser = useUserStore((state) => state.currentUser);

  const member =
    members.find((m) => m.id === params.memberId) ||
    useCrewStore.getState().selectedMember ||
    members[0];

  const isSelf =
    member?.id === currentUser?.id ||
    member?.id === 'user' ||
    member?.id === 'me' ||
    member?.isCurrentUser ||
    (currentUser?.name && member?.name === currentUser.name);

  const isTargetOffline = isSelf
    ? (!isLocationSharingActive || member?.status === 'offline')
    : (member?.status === 'offline' || !member?.coordinates);

  const [deviceBattery, setDeviceBattery] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    batteryService.getBatteryLevel().then((lvl) => {
      if (isMounted && typeof lvl === 'number') {
        setDeviceBattery(lvl);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedBattery = isSelf
    ? deviceBattery ?? member?.battery ?? null
    : member?.battery ?? null;

  const resolvedPhone = isSelf
    ? currentUser?.phone || member?.phone || null
    : member?.phone || null;

  const distanceMeters = calculateDistanceMeters(userLocation, member?.coordinates);

  const handleNavigate = () => {
    setSelectedMember(member);
    router.push({
      pathname: '/features/navigation',
      params: { memberId: member.id },
    });
  };

  const handleMeetHere = () => {
    if (!member?.coordinates) return;
    router.push({
      pathname: '/features/meeting-point',
      params: {
        customLat: member.coordinates.latitude,
        customLon: member.coordinates.longitude,
        suggestedName: isSelf ? 'Meet at My Location' : `Meet near ${member.name}`,
      },
    });
  };

  const handleViewOnMap = () => {
    setSelectedMember(member);
    router.push('/(tabs)/map');
  };

  const subtitleText = isSelf
    ? 'Your live trip status'
    : member?.role === 'admin'
    ? 'Trip Leader'
    : 'Crew Member';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isDark ? '#0B0F17' : colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <AppHeader
        title={member?.name?.toUpperCase() || 'PERSON'}
        subtitle={subtitleText}
        showBack={true}
        backgroundColor={isDark ? '#0B0F17' : colors.background}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* AVATAR HERO */}
        <View style={styles.heroSection}>
          <MemberAvatar
            uri={member?.avatar}
            name={member?.name}
            size="xl"
            status={member?.status}
          />
          <Text style={[styles.name, { color: colors.textPrimary }]}>{member?.name}</Text>

          {/* Status & Freshness */}
          <View style={styles.statusPillRow}>
            <StatusBadge
              status={member?.status}
              lastSeenSecondsAgo={member?.lastSeenSecondsAgo}
              showDetail={true}
              size="md"
            />
          </View>

          {/* Distance Callout Chip */}
          <View
            style={[
              styles.distanceBox,
              {
                backgroundColor: isDark
                  ? isTargetOffline
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(37, 99, 235, 0.2)'
                  : isTargetOffline
                  ? '#FEF2F2'
                  : '#EFF6FF',
              },
            ]}
          >
            {isSelf ? (
              !isTargetOffline ? (
                <Text style={[styles.distanceValue, { color: colors.primary }]}>Active & visible to crew</Text>
              ) : (
                <Text style={[styles.distanceValue, { color: colors.danger }]}>
                  Location Paused • Sharing off
                </Text>
              )
            ) : isTargetOffline ? (
              <Text style={[styles.distanceValue, { color: colors.danger }]}>
                Location Paused by member
              </Text>
            ) : (
              <Text style={[styles.distanceValue, { color: colors.primary }]}>
                {formatDistance(distanceMeters)}{' '}
                <Text style={[styles.distanceLabel, { color: colors.textSecondary }]}>away from you</Text>
              </Text>
            )}
          </View>
        </View>

        {/* DETAILS LIST */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: isDark ? '#1F2937' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Compass size={18} color={colors.primary} />
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Current Area</Text>
            </View>
            <Text
              style={[
                styles.detailValue,
                { color: colors.textPrimary },
                isTargetOffline && { color: colors.textMuted },
              ]}
            >
              {isTargetOffline
                ? 'Location Hidden'
                : member?.cluster && member.cluster !== 'Active Crew'
                ? member.cluster
                : 'In Trip Area'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Battery
                size={18}
                color={
                  typeof resolvedBattery === 'number' && resolvedBattery <= 20
                    ? colors.danger
                    : colors.primary
                }
              />
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Battery</Text>
            </View>
            <Text
              style={[
                styles.detailValue,
                { color: colors.textPrimary },
                typeof resolvedBattery === 'number' &&
                  resolvedBattery <= 20 && {
                    color: colors.danger,
                    fontWeight: '700',
                  },
              ]}
            >
              {typeof resolvedBattery === 'number'
                ? resolvedBattery <= 20
                  ? `⚠️ ${resolvedBattery}% (Critically Low)`
                  : `${resolvedBattery}%`
                : 'Not reported'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Phone size={18} color={colors.primary} />
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Contact Number</Text>
            </View>
            {isSelf ? (
              <TouchableOpacity
                onPress={() => setShowContactModal(true)}
                activeOpacity={0.7}
                style={[
                  styles.inlinePhoneEditBtn,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <Text
                  style={[
                    styles.detailValue,
                    { color: colors.textPrimary },
                    !resolvedPhone && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {resolvedPhone || '+ Add Number'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {resolvedPhone || 'Not provided'}
              </Text>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <ShieldCheck size={18} color={colors.success} />
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Safety Check-in</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.success }]}>
              {member?.isSafe ? 'Confirmed Safe' : 'No Response'}
            </Text>
          </View>
        </View>

        {/* CORE ACTIONS: NAVIGATE | MEET HERE | VIEW ON MAP */}
        <View style={styles.actionsSection}>
          {isSelf ? (
            <>
              {!resolvedPhone && (
                <SecondaryButton
                  title="Add My Contact Number"
                  onPress={() => setShowContactModal(true)}
                  icon={Phone}
                  size="md"
                  variant="subtle"
                  style={{ marginBottom: 10 }}
                />
              )}
              <PrimaryButton
                title="View My Location on Map"
                onPress={handleViewOnMap}
                icon={Compass}
                size="lg"
                style={{ marginBottom: 10 }}
              />
              <View style={styles.btnRow}>
                <SecondaryButton
                  title="Meet Here"
                  onPress={() => {
                    if (isTargetOffline || !userLocation) {
                      Alert.alert(
                        'Location Paused',
                        'Please turn on location sharing in Profile to set a meeting point at your current position.'
                      );
                      return;
                    }
                    handleMeetHere();
                  }}
                  icon={MapPin}
                  size="md"
                  variant="subtle"
                  style={styles.halfBtn}
                />
                <View style={{ width: 10 }} />
                <SecondaryButton
                  title="My Profile"
                  onPress={() => router.push('/(tabs)/profile')}
                  size="md"
                  variant="outline"
                  style={styles.halfBtn}
                />
              </View>
            </>
          ) : (
            <>
              <PrimaryButton
                title={
                  isTargetOffline
                    ? `Location Paused (${member?.name || 'Member'})`
                    : `Walk to ${member?.name}`
                }
                onPress={() => {
                  if (isTargetOffline) {
                    Alert.alert(
                      'Location Unavailable',
                      `${member?.name || 'This member'} has paused location sharing. Please call or message them instead.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        member?.phone
                          ? {
                              text: `Call ${member.name?.split(' ')[0]}`,
                              onPress: () => Linking.openURL(`tel:${member.phone}`),
                            }
                          : null,
                      ].filter(Boolean)
                    );
                  } else {
                    handleNavigate();
                  }
                }}
                icon={isTargetOffline ? Phone : Navigation}
                variant={isTargetOffline ? 'subtle' : 'primary'}
                size="lg"
                style={{ marginBottom: 10 }}
              />

              <SecondaryButton
                title={`Chat with ${member?.name?.split(' ')[0] || 'Member'}`}
                onPress={() => {
                  router.push({
                    pathname: '/features/chat',
                    params: { memberId: member.id },
                  });
                }}
                icon={MessageSquare}
                size="md"
                variant="subtle"
                style={{ marginBottom: 10 }}
              />

              <SecondaryButton
                title={
                  member?.phone
                    ? `Call ${member?.name?.split(' ')[0] || 'Member'} (${member.phone})`
                    : `Call ${member?.name?.split(' ')[0] || 'Member'}`
                }
                onPress={() => {
                  if (member?.phone) {
                    Linking.openURL(`tel:${member.phone}`);
                  } else {
                    Alert.alert(
                      'No Contact Number',
                      `${member?.name || 'This member'} has not added a contact number yet.`
                    );
                  }
                }}
                icon={Phone}
                size="md"
                variant="subtle"
                style={{ marginBottom: 10 }}
              />

              <View style={styles.btnRow}>
                <SecondaryButton
                  title="Meet Here"
                  onPress={() => {
                    if (isTargetOffline || !member?.coordinates) {
                      Alert.alert(
                        'Location Unavailable',
                        `Cannot set a meeting point at ${member?.name || 'this member'}'s location because their location sharing is paused.`
                      );
                      return;
                    }
                    handleMeetHere();
                  }}
                  icon={MapPin}
                  size="md"
                  variant="subtle"
                  style={styles.halfBtn}
                />
                <View style={{ width: 10 }} />
                <SecondaryButton
                  title="View on Map"
                  onPress={handleViewOnMap}
                  icon={Compass}
                  size="md"
                  variant="outline"
                  style={styles.halfBtn}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* QUICK CONTACT NUMBER MODAL */}
      <ContactNumberModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  name: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
    marginTop: 12,
  },
  statusPillRow: {
    marginTop: 6,
  },
  distanceBox: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  distanceLabel: {
    fontWeight: '400',
  },
  detailsCard: {
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTitle: {
    ...TYPOGRAPHY.bodySecondary,
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 14,
  },
  detailValue: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 32,
  },
  actionsSection: {
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
  },
  halfBtn: {
    flex: 1,
  },
  inlinePhoneEditBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
});
