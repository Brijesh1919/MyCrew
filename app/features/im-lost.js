import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Navigation,
  Compass,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { DistanceBadge } from '../../src/components/DistanceBadge';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { locationService } from '../../src/services/locationService';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function ImLostScreen() {
  const router = useRouter();
  const { triggerDanger, triggerHeavy, triggerLight } = useHapticFeedback();

  const members = useCrewStore((state) => state.members);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);

  const [isScanning, setIsScanning] = useState(true);

  // Trigger tactile haptics on entrance
  useEffect(() => {
    triggerHeavy();
    const timer = setTimeout(() => {
      setIsScanning(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const nearestList = userLocation
    ? locationService.getNearestMembers(userLocation, members, 4)
    : [];
  const closestPerson = nearestList[0] || null;

  const handleNavigateToClosest = () => {
    if (!closestPerson) return;
    setSelectedMember(closestPerson);
    router.replace({
      pathname: '/features/navigation',
      params: { memberId: closestPerson.id },
    });
  };

  const handleShowEveryone = () => {
    router.replace('/(tabs)/map');
  };

  const handleClose = () => {
    try {
      triggerLight?.();
    } catch (e) {
      // ignore
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Dismiss Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* SOS HEADER */}
        <View style={styles.header}>
          <View style={styles.sosBadge}>
            <Text style={styles.sosBadgeText}>🆘 ASSISTANCE MODE</Text>
          </View>
          <Text style={styles.title}>You're not alone.</Text>
          <Text style={styles.subtitle}>
            {isScanning
              ? 'Finding the closest people in your crew...'
              : 'Here are the closest friends who can reunite with you right now.'}
          </Text>
        </View>

        {/* SCANNING STATE */}
        {isScanning ? (
          <View style={styles.scanningBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.scanningText}>Scanning nearby coordinates...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {!closestPerson ? (
              <View style={styles.noNearbyBox}>
                <Text style={styles.noNearbyTitle}>No active crew members nearby</Text>
                <Text style={styles.noNearbyDesc}>
                  {!userLocation
                    ? 'Acquiring high accuracy GPS coordinates for your device...'
                    : 'None of your crew members have their location sharing active right now.'}
                </Text>
              </View>
            ) : (
              <>
                {/* CLOSEST PERSON HERO CARD */}
                <View style={styles.closestHeroCard}>
                  <View style={styles.closestHeaderRow}>
                    <View style={styles.closestTag}>
                      <Sparkles size={12} color={COLORS.primary} />
                      <Text style={styles.closestTagText}>CLOSEST TO YOU</Text>
                    </View>
                    <DistanceBadge meters={closestPerson.distanceMeters} isHighlight={true} size="lg" />
                  </View>

                  <View style={styles.personHeroRow}>
                    <MemberAvatar
                      uri={closestPerson.avatar}
                      name={closestPerson.name}
                      size="lg"
                      status={closestPerson.status}
                    />
                    <View style={styles.heroInfo}>
                      <Text style={styles.heroName}>{closestPerson.name}</Text>
                      <Text style={styles.heroSub}>
                        {closestPerson.distanceMeters} meters away • Live
                      </Text>
                      <Text style={styles.heroTime}>
                        {closestPerson.freshness?.label || 'Active right now'}
                      </Text>
                    </View>
                  </View>

                  <PrimaryButton
                    title={`Navigate to ${closestPerson.name}`}
                    onPress={handleNavigateToClosest}
                    icon={Navigation}
                    size="lg"
                    style={styles.heroNavBtn}
                  />
                </View>

                {/* OTHER NEARBY MEMBERS LIST */}
                {nearestList.length > 1 && (
                  <>
                    <Text style={styles.sectionLabel}>ALSO NEARBY</Text>
                    <View style={styles.othersList}>
                      {nearestList.slice(1).map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={styles.otherItem}
                          onPress={() => {
                            setSelectedMember(m);
                            router.replace({
                              pathname: '/features/navigation',
                              params: { memberId: m.id },
                            });
                          }}
                        >
                          <MemberAvatar
                            uri={m.avatar}
                            name={m.name}
                            size="sm"
                            status={m.status}
                          />
                          <View style={styles.otherInfo}>
                            <Text style={styles.otherName}>{m.name}</Text>
                            <Text style={styles.otherDist}>{m.distanceMeters} m away</Text>
                          </View>
                          <ChevronRight size={16} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* BOTTOM ACTION */}
        <View style={styles.bottomSection}>
          <SecondaryButton
            title="Show Everyone on Map"
            onPress={handleShowEveryone}
            size="md"
            variant="outline"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-end',
  },
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  sosBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  sosBadgeText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.danger,
    fontSize: 11,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    marginBottom: 6,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySecondary,
    lineHeight: 20,
    fontSize: 15,
  },
  scanningBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    ...TYPOGRAPHY.bodySecondary,
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
  closestHeroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 20,
    ...SHADOWS.lg,
  },
  closestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  closestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  closestTagText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.primary,
    marginLeft: 4,
    fontSize: 10,
  },
  personHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroInfo: {
    marginLeft: 14,
    flex: 1,
  },
  heroName: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
  },
  heroSub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  heroTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '700',
    marginTop: 4,
  },
  heroNavBtn: {
    marginTop: 4,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  othersList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  otherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  otherInfo: {
    marginLeft: 12,
    flex: 1,
  },
  otherName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  otherDist: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  noNearbyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
    ...SHADOWS.sm,
  },
  noNearbyTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  noNearbyDesc: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSection: {
    paddingTop: 12,
  },
});
