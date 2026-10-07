import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Shield,
  MapPin,
  Cpu,
  LogOut,
  ChevronRight,
  Sparkles,
  AlertCircle,
  History,
  X,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { TripHistoryCard } from '../../src/components/TripHistoryCard';
import { HistoricalTripModal } from '../../src/components/HistoricalTripModal';
import { useUserStore } from '../../src/store/useUserStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';
import { tripService } from '../../src/services/tripService';
import { locationService } from '../../src/services/locationService';

export default function ProfileScreen() {
  const router = useRouter();
  const { triggerLight, triggerWarning } = useHapticFeedback();

  // Stores
  const currentUser = useUserStore((state) => state.currentUser);
  const clearAuth = useUserStore((state) => state.clearAuth);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const userRole = useTripStore((state) => state.userRole);
  const tripHistory = useTripStore((state) => state.tripHistory);
  const isSharing = useLocationStore((state) => state.isLocationSharingActive);
  const setIsSharing = useLocationStore((state) => state.setIsLocationSharingActive);

  // Logout state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Trip History state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoricalTrip, setSelectedHistoricalTrip] = useState(null);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Stop location sharing
      setIsSharing(false);
      // 2. Sign out of Supabase and clear local user/trip state (WITHOUT leaving crews in Supabase)
      await clearAuth();
      setShowLogoutModal(false);
      // 3. Route back to auth
      router.replace('/(auth)');
    } catch (err) {
      console.warn('Error during logout:', err);
      setShowLogoutModal(false);
      router.replace('/(auth)');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleToggleLocationSharing = async (val) => {
    triggerLight();
    setIsSharing(val);

    if (!activeTrip?.id || !currentUser?.id) return;

    if (!val) {
      try {
        await tripService.pauseLocationSharing({
          tripId: activeTrip.id,
          userId: currentUser.id,
        });
      } catch (err) {
        console.warn('Error pausing location sharing:', err);
      }
    } else {
      try {
        const pos = await locationService.getCurrentPosition(true);
        if (pos) {
          useLocationStore.getState().setUserLocation(pos);
          await tripService.updateMemberLocation({
            tripId: activeTrip.id,
            userId: currentUser.id,
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy: pos.accuracy,
            heading: pos.heading,
            speed: pos.speed,
            force: true,
          });
        }
      } catch (err) {
        console.warn('Error resuming location sharing:', err);
      }
    }
  };

  const menuSections = [
    {
      title: 'CREW SETTINGS',
      items: [
        {
          id: 'smart_tracking',
          label: 'Smart Tracking',
          sublabel: 'Crowded Mode • Battery optimized',
          icon: Cpu,
          route: '/features/smart-tracking',
        },
        {
          id: 'privacy',
          label: 'Privacy & Sharing',
          sublabel: 'Only shared during active trips',
          icon: Shield,
          route: '/features/privacy',
        },
      ],
    },
    {
      title: 'APP & PREFERENCES',
      items: [
        {
          id: 'history',
          label: 'Trip History',
          sublabel:
            tripHistory.length > 0
              ? `${tripHistory.length} past crew${tripHistory.length === 1 ? '' : 's'}`
              : 'No past trips yet',
          icon: History,
          action: () => {
            triggerLight();
            setShowHistoryModal(true);
          },
        },
        {
          id: 'radar',
          label: 'Group Radar',
          sublabel: 'Relative compass view',
          icon: MapPin,
          route: '/features/group-radar',
        },
        {
          id: 'checkin',
          label: 'Safety Check-in',
          sublabel: currentUser?.isSafe ? 'Checked in as Safe' : 'Not checked in',
          icon: Sparkles,
          route: '/features/check-in',
        },
      ],
    },
  ];

  const displayName = currentUser?.name || 'Crew Member';
  const displayEmail = currentUser?.email || 'Authenticated User';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>

        {/* REAL USER PROFILE CARD */}
        <View style={styles.profileCard}>
          <MemberAvatar
            uri={currentUser?.avatar}
            name={displayName}
            size="lg"
            status={activeTrip ? 'live' : 'offline'}
            isUser={true}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {displayEmail}
            </Text>
            <View
              style={[
                styles.statusPill,
                !activeTrip && { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  !activeTrip && { backgroundColor: COLORS.textMuted },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  !activeTrip && { color: COLORS.textSecondary },
                ]}
              >
                {activeTrip
                  ? `Active in ${activeTrip.name} (${userRole === 'organizer' ? 'Host' : 'Member'})`
                  : 'Not in any crew'}
              </Text>
            </View>
          </View>
        </View>

        {/* LOCATION SHARING TOGGLE CARD */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <View style={styles.iconCircle}>
              <MapPin size={20} color={COLORS.primary} />
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Location Sharing</Text>
              <Text style={styles.toggleSub}>
                {!activeTrip
                  ? 'No sharing active (no crew joined)'
                  : isSharing
                  ? 'Visible to crew members'
                  : 'Temporarily paused'}
              </Text>
            </View>
          </View>
          <Switch
            value={Boolean(activeTrip && isSharing)}
            disabled={!activeTrip}
            onValueChange={handleToggleLocationSharing}
            trackColor={{ false: '#CBD5E1', true: COLORS.primaryLight }}
            thumbColor={isSharing && activeTrip ? COLORS.primary : '#F1F5F9'}
          />
        </View>

        {/* SETTINGS MENU SECTIONS */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.menuBox}>
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        if (item.action) {
                          item.action();
                        } else if (item.route) {
                          router.push(item.route);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={styles.menuIconBox}>
                          <Icon size={18} color={COLORS.primary} />
                        </View>
                        <View>
                          <Text style={styles.menuItemLabel}>{item.label}</Text>
                          {item.sublabel && (
                            <Text style={styles.menuItemSub}>{item.sublabel}</Text>
                          )}
                        </View>
                      </View>
                      <ChevronRight size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                    {idx < section.items.length - 1 && (
                      <View style={styles.menuDivider} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ))}

        {/* ACCOUNT / LOG OUT SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                triggerWarning();
                setShowLogoutModal(true);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.logoutBtnLeft}>
                <View style={styles.logoutIconBox}>
                  <LogOut size={18} color={COLORS.danger} />
                </View>
                <View>
                  <Text style={styles.logoutBtnLabel}>Log Out</Text>
                  <Text style={styles.logoutBtnSub}>Sign out of your account on this device</Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* APP INFO FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>MyCrew v1.0.0</Text>
          <Text style={styles.footerTagline}>
            Never lose your group again • Private by design
          </Text>
        </View>
      </ScrollView>

      {/* CONFIRMATION LOGOUT MODAL */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isLoggingOut && setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <AlertCircle size={28} color={COLORS.danger} />
            </View>
            <Text style={styles.modalTitle}>Log out of MyCrew?</Text>
            <Text style={styles.modalMessage}>
              You'll need to sign in again to access your account.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmLogout}
                disabled={isLoggingOut}
                activeOpacity={0.85}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TRIP HISTORY MODAL */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <SafeAreaView style={styles.historyModalContainer} edges={['top', 'bottom']}>
          <View style={styles.historyModalHeader}>
            <View>
              <Text style={styles.historyModalTitle}>Trip History</Text>
              <Text style={styles.historyModalSub}>
                {tripHistory.length > 0
                  ? `${tripHistory.length} past crew${tripHistory.length === 1 ? '' : 's'}`
                  : 'Real Supabase trip history'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowHistoryModal(false)}
              style={styles.historyModalCloseBtn}
              activeOpacity={0.7}
            >
              <X size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.historyModalContent}
            showsVerticalScrollIndicator={false}
          >
            {tripHistory.length > 0 ? (
              tripHistory.map((trip) => (
                <TripHistoryCard
                  key={trip.id}
                  trip={trip}
                  onPress={(item) => setSelectedHistoricalTrip(item)}
                />
              ))
            ) : (
              <View style={styles.emptyHistoryBox}>
                <View style={styles.emptyHistoryIconCircle}>
                  <History size={32} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyHistoryTitle}>No past trips yet</Text>
                <Text style={styles.emptyHistorySub}>
                  When trips end or expire, they will safely appear here for your reference.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* READ-ONLY HISTORICAL DETAIL MODAL */}
      <HistoricalTripModal
        visible={Boolean(selectedHistoricalTrip)}
        trip={selectedHistoricalTrip}
        onClose={() => setSelectedHistoricalTrip(null)}
      />
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  screenTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 26,
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.h2,
    fontSize: 19,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  statusPillText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 11,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  toggleSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
  },
  menuItemSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 62,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  logoutBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoutIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutBtnLabel: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: '700',
  },
  logoutBtnSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  footerBrand: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  footerTagline: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    ...TYPOGRAPHY.bodyPrimary,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    ...TYPOGRAPHY.bodyPrimary,
    fontWeight: '700',
    color: COLORS.white,
  },
  historyModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  historyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: COLORS.surface,
  },
  historyModalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  historyModalSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyModalContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyHistoryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyHistoryIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyHistoryTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 17,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptyHistorySub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
