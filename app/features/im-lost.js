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
import { DistanceBadge } from '../../src/components/DistanceBadge';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { locationService } from '../../src/services/locationService';
import { formatDistance } from '../../src/utils/distance';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function ImLostScreen() {
  const router = useRouter();
  const { triggerHeavy, triggerLight } = useHapticFeedback();

  // Dark/Light Theme
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);

  const members = useCrewStore((state) => state.members);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const currentUser = useUserStore((state) => state.currentUser);

  const [isScanning, setIsScanning] = useState(true);

  // Trigger tactile haptics on entrance
  useEffect(() => {
    triggerHeavy();
    const timer = setTimeout(() => {
      setIsScanning(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Exclude current user from nearby rescue candidates
  const otherMembers = (members || []).filter((m) => {
    const isMe =
      m.id === currentUser?.id ||
      m.id === 'user' ||
      m.id === 'me' ||
      m.isCurrentUser ||
      (currentUser?.name && m.name === currentUser.name);
    return !isMe;
  });

  const nearestList = userLocation
    ? locationService.getNearestMembers(userLocation, otherMembers, 4)
    : [];
  const closestPerson = nearestList[0] || null;

  const handleNavigateToClosest = () => {
    if (!closestPerson) return;
    setSelectedMember(closestPerson);
    const coords = closestPerson.coordinates;
    if (coords && !isNaN(coords.latitude) && !isNaN(coords.longitude)) {
      router.replace({
        pathname: '/(tabs)/home',
        params: {
          targetLat: coords.latitude,
          targetLng: coords.longitude,
          targetName: closestPerson.name,
          targetType: 'member',
          showPath: 'true',
        },
      });
    } else {
      router.replace({
        pathname: '/features/navigation',
        params: { memberId: closestPerson.id },
      });
    }
  };

  const handleShowEveryone = () => {
    try {
      triggerLight?.();
    } catch (e) {
      // ignore
    }
    router.replace('/(tabs)/home');
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0B0F17' : colors.background }]}>
      <View style={styles.container}>
        {/* Top Dismiss Button */}
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={22} color={isDark ? '#F3F4F6' : colors.textPrimary} />
        </TouchableOpacity>

        {/* SOS HEADER */}
        <View style={styles.header}>
          <View
            style={[
              styles.sosBadge,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
                borderWidth: 1,
              },
            ]}
          >
            <Text style={styles.sosBadgeText}>🆘 ASSISTANCE MODE</Text>
          </View>
          <Text style={[styles.title, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>
            You're not alone.
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
            {isScanning
              ? 'Finding the closest people in your crew...'
              : 'Here are the closest friends who can reunite with you right now.'}
          </Text>
        </View>

        {/* SCANNING STATE */}
        {isScanning ? (
          <View style={styles.scanningBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.scanningText, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
              Scanning nearby coordinates...
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {!closestPerson ? (
              <View
                style={[
                  styles.noNearbyBox,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: isDark ? '#1F2937' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={[styles.noNearbyTitle, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>
                  No active crew members nearby
                </Text>
                <Text style={[styles.noNearbyDesc, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
                  {!userLocation
                    ? 'Acquiring high accuracy GPS coordinates for your device...'
                    : 'None of your crew members have their location sharing active right now.'}
                </Text>
              </View>
            ) : (
              <>
                {/* CLOSEST PERSON HERO CARD */}
                <View
                  style={[
                    styles.closestHeroCard,
                    {
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : '#BFDBFE',
                    },
                  ]}
                >
                  <View style={styles.closestHeaderRow}>
                    <View
                      style={[
                        styles.closestTag,
                        {
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : COLORS.primaryLight,
                        },
                      ]}
                    >
                      <Sparkles size={12} color="#3B82F6" />
                      <Text style={[styles.closestTagText, { color: '#3B82F6' }]}>CLOSEST TO YOU</Text>
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
                      <Text style={[styles.heroName, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>
                        {closestPerson.name}
                      </Text>
                      <Text style={[styles.heroSub, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
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
                    <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
                      ALSO NEARBY
                    </Text>
                    <View
                      style={[
                        styles.othersList,
                        {
                          backgroundColor: isDark ? '#111827' : '#FFFFFF',
                          borderColor: isDark ? '#1F2937' : '#E2E8F0',
                        },
                      ]}
                    >
                      {nearestList.slice(1).map((m, idx) => (
                        <React.Fragment key={m.id}>
                          {idx > 0 && (
                            <View
                              style={[
                                styles.otherDivider,
                                { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
                              ]}
                            />
                          )}
                          <TouchableOpacity
                            style={styles.otherItem}
                            onPress={() => {
                              setSelectedMember(m);
                              const mCoords = m.coordinates;
                              if (mCoords && !isNaN(mCoords.latitude) && !isNaN(mCoords.longitude)) {
                                router.replace({
                                  pathname: '/(tabs)/home',
                                  params: {
                                    targetLat: mCoords.latitude,
                                    targetLng: mCoords.longitude,
                                    targetName: m.name,
                                    targetType: 'member',
                                    showPath: 'true',
                                  },
                                });
                              } else {
                                router.replace({
                                  pathname: '/features/navigation',
                                  params: { memberId: m.id },
                                });
                              }
                            }}
                          >
                            <MemberAvatar
                              uri={m.avatar}
                              name={m.name}
                              size="sm"
                              status={m.status}
                            />
                            <View style={styles.otherInfo}>
                              <Text style={[styles.otherName, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>
                                {m.name}
                              </Text>
                              <Text style={[styles.otherDist, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
                                {m.distanceMeters !== null && m.distanceMeters !== undefined
                                  ? `${formatDistance(m.distanceMeters)} away`
                                  : 'Location unavailable'}
                              </Text>
                            </View>
                            <ChevronRight size={16} color={isDark ? '#6B7280' : COLORS.textMuted} />
                          </TouchableOpacity>
                        </React.Fragment>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* BOTTOM ACTION: SHOW EVERYONE ON MAP */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.showEveryoneBtn,
              {
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderColor: isDark ? '#374151' : '#CBD5E1',
              },
            ]}
            activeOpacity={0.8}
            onPress={handleShowEveryone}
          >
            <Compass size={18} color={isDark ? '#F9FAFB' : colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.showEveryoneBtnText, { color: isDark ? '#F9FAFB' : colors.primary }]}>
              Show Everyone on Map
            </Text>
          </TouchableOpacity>
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
    padding: 20,
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  sosBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  sosBadgeText: {
    ...TYPOGRAPHY.badge,
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    marginBottom: 6,
    fontWeight: '800',
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
    borderRadius: RADIUS.xxl,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    ...SHADOWS.md,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  closestTagText: {
    ...TYPOGRAPHY.badge,
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '800',
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
    fontSize: 22,
    fontWeight: '800',
  },
  heroSub: {
    ...TYPOGRAPHY.body,
    marginTop: 2,
  },
  heroTime: {
    ...TYPOGRAPHY.caption,
    color: '#3B82F6',
    fontWeight: '700',
    marginTop: 4,
  },
  heroNavBtn: {
    marginTop: 4,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 11,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  othersList: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  otherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 58,
  },
  otherDivider: {
    height: 1,
    marginLeft: 60,
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
    marginTop: 2,
  },
  noNearbyBox: {
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 20,
    ...SHADOWS.sm,
  },
  noNearbyTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '700',
  },
  noNearbyDesc: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSection: {
    paddingTop: 12,
  },
  showEveryoneBtn: {
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  showEveryoneBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
