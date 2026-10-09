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
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
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

  const members = useCrewStore((state) => state.members);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
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
    ? member?.role === 'organizer'
      ? 'You (Trip Host)'
      : 'You (Crew Member)'
    : member?.role === 'organizer'
    ? 'Trip Host'
    : 'Crew Member';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title={member?.name?.toUpperCase() || 'PERSON'}
        subtitle={subtitleText}
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* AVATAR HERO CARD */}
        <View style={styles.heroCard}>
          <MemberAvatar
            uri={member?.avatar}
            name={member?.name}
            size="xl"
            status={member?.status}
          />
          <Text style={styles.name}>{member?.name}</Text>

          {/* Status & Freshness */}
          <View style={styles.statusPillRow}>
            <StatusBadge
              status={member?.status}
              lastSeenSecondsAgo={member?.lastSeenSecondsAgo}
              showDetail={true}
              size="md"
            />
          </View>

          {/* Distance Callout */}
          <View style={styles.distanceBox}>
            {isSelf ? (
              <>
                <Text style={styles.distanceValue}>Your Location</Text>
                <Text style={styles.distanceLabel}>Active & visible to crew</Text>
              </>
            ) : (
              <>
                <Text style={styles.distanceValue}>{formatDistance(distanceMeters)}</Text>
                <Text style={styles.distanceLabel}>away from you</Text>
              </>
            )}
          </View>
        </View>

        {/* DETAILS LIST */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Compass size={18} color={COLORS.primary} />
              <Text style={styles.detailTitle}>Current Area</Text>
            </View>
            <Text style={styles.detailValue}>
              {member?.cluster || 'Active Crew'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Battery size={18} color={COLORS.primary} />
              <Text style={styles.detailTitle}>Battery</Text>
            </View>
            <Text style={styles.detailValue}>
              {typeof resolvedBattery === 'number' ? `${resolvedBattery}%` : 'Not reported'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Phone size={18} color={COLORS.primary} />
              <Text style={styles.detailTitle}>Contact Number</Text>
            </View>
            {isSelf ? (
              <TouchableOpacity
                onPress={() => setShowContactModal(true)}
                activeOpacity={0.7}
                style={styles.inlinePhoneEditBtn}
              >
                <Text
                  style={[
                    styles.detailValue,
                    !resolvedPhone && { color: COLORS.primary, fontWeight: '700' },
                  ]}
                >
                  {resolvedPhone || '+ Add Number'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.detailValue}>
                {resolvedPhone || 'Not provided'}
              </Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <ShieldCheck size={18} color={COLORS.success} />
              <Text style={styles.detailTitle}>Safety Check-in</Text>
            </View>
            <Text style={[styles.detailValue, { color: COLORS.success }]}>
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
                  onPress={handleMeetHere}
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
                title={`Walk to ${member?.name}`}
                onPress={handleNavigate}
                icon={Navigation}
                size="lg"
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
                  onPress={handleMeetHere}
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...SHADOWS.md,
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
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
  },
  distanceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  distanceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTitle: {
    ...TYPOGRAPHY.bodySecondary,
    color: COLORS.textPrimary,
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#F1F5F9',
  },
});
