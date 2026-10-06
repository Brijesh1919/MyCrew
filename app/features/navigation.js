import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, X, Compass, Phone } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { MapView } from '../../src/components/MapView';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { locationService } from '../../src/services/locationService';
import { formatDistance } from '../../src/utils/distance';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { triggerSuccess, triggerLight } = useHapticFeedback();

  const members = useCrewStore((state) => state.members);
  const userLocation = useLocationStore((state) => state.userLocation);

  // Target member or meeting point
  const memberId = params.memberId;
  const targetMember =
    members.find((m) => m.id === memberId) || members[0]; // Priya by default

  const [hasArrived, setHasArrived] = useState(false);

  // Calculate distance & directional bearing
  const destinationCoord = (params.destLat && params.destLon)
    ? { latitude: Number(params.destLat), longitude: Number(params.destLon) }
    : targetMember?.coordinates || null;

  const distanceMeters = (userLocation && destinationCoord)
    ? locationService.getDistance(userLocation, destinationCoord)
    : null;

  const directionData = (userLocation && destinationCoord)
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title={`Walk to ${targetMember?.name || 'Destination'}`}
        subtitle={`${formatDistance(distanceMeters)} away`}
        showBack={true}
      />

      <View style={styles.container}>
        {/* Map with Direction Polyline */}
        <View style={styles.mapContainer}>
          <MapView
            userLocation={userLocation}
            members={[targetMember]}
            selectedMember={targetMember}
            showRoute={true}
            routeDestination={targetMember}
            height={SCREEN_HEIGHT * 0.42}
            interactive={true}
            showClusters={false}
          />
        </View>

        {/* DIRECTIONAL GUIDANCE CARD */}
        <View style={styles.guidanceCard}>
          {hasArrived ? (
            <View style={styles.arrivedBox}>
              <View style={styles.arrivedIcon}>
                <Check size={36} color={COLORS.white} />
              </View>
              <Text style={styles.arrivedTitle}>Reunited!</Text>
              <Text style={styles.arrivedSub}>
                You've met up with {targetMember?.name}. Returning to home map...
              </Text>
            </View>
          ) : (
            <View>
              {/* LARGE DIRECTIONAL INDICATOR: ↑ */}
              <View style={styles.indicatorRow}>
                <View style={styles.arrowBox}>
                  <Text style={styles.arrowIcon}>
                    {directionData.relative?.arrow || '↑'}
                  </Text>
                </View>

                <View style={styles.indicatorInfo}>
                  <Text style={styles.walkLabel}>
                    Walk toward {targetMember?.name}
                  </Text>
                  <Text style={styles.distanceBig}>
                    {formatDistance(distanceMeters)}
                  </Text>
                  <Text style={styles.bearingLabel}>
                    {directionData.relative?.label || 'Straight ahead'}
                  </Text>
                </View>
              </View>

              {/* Target Member Mini Strip */}
              <View style={styles.targetStrip}>
                <MemberAvatar
                  uri={targetMember?.avatar}
                  name={targetMember?.name}
                  size="sm"
                  status={targetMember?.status}
                />
                <View style={styles.targetInfo}>
                  <Text style={styles.targetName}>{targetMember?.name}</Text>
                  <Text style={styles.targetFreshness}>
                    {targetMember?.freshness?.label || 'Live location'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => triggerLight()}
                >
                  <Phone size={16} color={COLORS.primary} />
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
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mapContainer: {
    backgroundColor: '#0F172A',
  },
  guidanceCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
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
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  arrowIcon: {
    fontSize: 40,
    color: COLORS.primary,
    fontWeight: '900',
    marginTop: -4,
  },
  indicatorInfo: {
    flex: 1,
  },
  walkLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  distanceBig: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  bearingLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 13,
  },
  targetStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: COLORS.success,
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
