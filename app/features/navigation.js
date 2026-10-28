import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Phone } from 'lucide-react-native';
import { RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { useThemeStore } from '../../src/store/useThemeStore';
import { AppHeader } from '../../src/components/AppHeader';
import { MapView } from '../../src/components/MapView';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useUserStore } from '../../src/store/useUserStore';
import { locationService } from '../../src/services/locationService';
import { formatDistance } from '../../src/utils/distance';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { triggerSuccess, triggerLight } = useHapticFeedback();

  // Dynamic Theme
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);

  const members = useCrewStore((state) => state.members);
  const userLocation = useLocationStore((state) => state.userLocation);
  const currentUser = useUserStore((state) => state.currentUser);

  // Target member or meeting point
  const memberId = params.memberId;
  const otherMembers = (members || []).filter(
    (m) =>
      m.id !== currentUser?.id &&
      m.id !== 'user' &&
      m.id !== 'me' &&
      !m.isCurrentUser &&
      (!currentUser?.name || m.name !== currentUser.name)
  );
  const targetMember =
    members.find((m) => m.id === memberId) || otherMembers[0] || null;

  const [hasArrived, setHasArrived] = useState(false);

  // Calculate distance & directional bearing
  const destinationCoord =
    params.destLat && params.destLon
      ? { latitude: Number(params.destLat), longitude: Number(params.destLon) }
      : targetMember?.coordinates || null;

  const distanceMeters =
    userLocation && destinationCoord
      ? locationService.getDistance(userLocation, destinationCoord)
      : null;

  const directionData =
    userLocation && destinationCoord
      ? locationService.getDirectionToMember(
          userLocation,
          destinationCoord,
          userLocation?.heading || 0
        )
      : { bearing: 0, relative: { direction: 'ahead', arrow: '↑', label: 'Straight ahead' } };

  const handleArrived = () => {
    triggerSuccess();
    setHasArrived(true);
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 1500);
  };

  const handleCall = () => {
    triggerLight();
    if (targetMember?.phone) {
      Linking.openURL(`tel:${targetMember.phone}`);
    } else {
      Alert.alert(
        'No Phone Number',
        `${targetMember?.name || 'This member'} has not added a contact number yet.`
      );
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isDark ? '#0B0F17' : colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <AppHeader
        title={`Walk to ${targetMember?.name || 'Destination'}`}
        subtitle={`${formatDistance(distanceMeters)} away`}
        showBack={true}
        backgroundColor={isDark ? '#0B0F17' : colors.background}
      />

      <View style={styles.container}>
        {/* Map with Direction Polyline */}
        <View style={[styles.mapContainer, { backgroundColor: isDark ? '#0B0F17' : '#0F172A' }]}>
          <MapView
            userLocation={userLocation}
            members={targetMember ? [targetMember] : []}
            selectedMember={targetMember || undefined}
            showRoute={Boolean(targetMember)}
            routeDestination={targetMember || undefined}
            height={SCREEN_HEIGHT * 0.42}
            interactive={true}
            showClusters={false}
          />
        </View>

        {/* DIRECTIONAL GUIDANCE CARD */}
        <View
          style={[
            styles.guidanceCard,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderTopColor: isDark ? '#1F2937' : '#E5E7EB',
            },
          ]}
        >
          {hasArrived ? (
            <View style={styles.arrivedBox}>
              <View style={[styles.arrivedIcon, { backgroundColor: colors.success }]}>
                <Check size={36} color="#FFFFFF" />
              </View>
              <Text style={[styles.arrivedTitle, { color: colors.textPrimary }]}>Reunited!</Text>
              <Text style={[styles.arrivedSub, { color: colors.textSecondary }]}>
                You've met up with {targetMember?.name || 'your crew member'}. Returning to home map...
              </Text>
            </View>
          ) : (
            <View>
              {/* LARGE DIRECTIONAL INDICATOR: ↑ */}
              <View style={styles.indicatorRow}>
                <View
                  style={[
                    styles.arrowBox,
                    {
                      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : '#93C5FD',
                    },
                  ]}
                >
                  <Text style={[styles.arrowIcon, { color: colors.primary }]}>
                    {directionData.relative?.arrow || '↑'}
                  </Text>
                </View>

                <View style={styles.indicatorInfo}>
                  <Text style={[styles.walkLabel, { color: colors.textSecondary }]}>
                    Walk toward {targetMember?.name || 'Member'}
                  </Text>
                  <Text
                    style={[
                      styles.distanceBig,
                      { color: isDark ? '#38BDF8' : colors.primary },
                    ]}
                  >
                    {formatDistance(distanceMeters)}
                  </Text>
                  <Text style={[styles.bearingLabel, { color: colors.success }]}>
                    {directionData.relative?.label || 'Straight ahead'}
                  </Text>
                </View>
              </View>

              {/* Target Member Mini Strip */}
              <View
                style={[
                  styles.targetStrip,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <MemberAvatar
                  uri={targetMember?.avatar}
                  name={targetMember?.name || 'Crew'}
                  size="sm"
                  status={targetMember?.status}
                />
                <View style={styles.targetInfo}>
                  <Text style={[styles.targetName, { color: colors.textPrimary }]}>
                    {targetMember?.name || 'Awaiting friends'}
                  </Text>
                  <Text style={[styles.targetFreshness, { color: colors.textSecondary }]}>
                    {targetMember ? (targetMember.freshness?.label || 'Live location') : 'Invite friends to navigate together'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.callBtn,
                    {
                      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.25)' : '#DBEAFE',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#BFDBFE',
                    },
                  ]}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <Phone size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* ACTION: I'VE ARRIVED */}
              <PrimaryButton
                title="I've Arrived / Met Up"
                onPress={handleArrived}
                icon={Check}
                variant="success"
                size="lg"
                style={{ marginTop: 14 }}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mapContainer: {
    overflow: 'hidden',
  },
  guidanceCard: {
    flex: 1,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1,
    marginTop: -20,
    padding: 20,
    justifyContent: 'space-between',
    ...SHADOWS.lg,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    borderWidth: 2,
  },
  arrowIcon: {
    fontSize: 40,
    fontWeight: '900',
    marginTop: -4,
  },
  indicatorInfo: {
    flex: 1,
  },
  walkLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  distanceBig: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  bearingLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    fontSize: 13,
  },
  targetStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  targetInfo: {
    marginLeft: 12,
    flex: 1,
  },
  targetName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  targetFreshness: {
    ...TYPOGRAPHY.caption,
    marginTop: 1,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  arrivedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  arrivedIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...SHADOWS.md,
  },
  arrivedTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
    marginBottom: 6,
  },
  arrivedSub: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
  },
});
