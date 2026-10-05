import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Shield,
  MapPin,
  Cpu,
  Bell,
  HelpCircle,
  Info,
  RotateCcw,
  ChevronRight,
  Sparkles,
  BatteryCharging,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { useUserStore } from '../../src/store/useUserStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function ProfileScreen() {
  const router = useRouter();
  const { triggerSuccess, triggerLight } = useHapticFeedback();

  // Stores
  const currentUser = useUserStore((state) => state.currentUser);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const userRole = useTripStore((state) => state.userRole);
  const resetDemoTrip = useTripStore((state) => state.resetDemoTrip);
  const isSharing = useLocationStore((state) => state.isLocationSharingActive);
  const setIsSharing = useLocationStore((state) => state.setIsLocationSharingActive);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleResetDemo = async () => {
    triggerSuccess();
    await resetDemoTrip();
    router.replace('/(tabs)/home');
  };

  const menuSections = [
    {
      title: 'CREW SETTINGS',
      items: [
        {
          id: 'smart_tracking',
          label: 'Smart Tracking',
          sublabel: 'Crowded Mode • 64% battery',
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
          id: 'radar',
          label: 'Group Radar',
          sublabel: 'Relative compass view',
          icon: MapPin,
          route: '/features/group-radar',
        },
        {
          id: 'checkin',
          label: 'Safety Check-in',
          sublabel: currentUser.isSafe ? 'Checked in as Safe' : 'Not safe/no response',
          icon: Sparkles,
          route: '/features/check-in',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>

        {/* USER PROFILE CARD */}
        <View style={styles.profileCard}>
          <MemberAvatar
            uri={currentUser.avatar}
            name={currentUser.name}
            size="lg"
            status={activeTrip ? 'live' : 'offline'}
            isUser={true}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{currentUser.name}</Text>
            <Text style={styles.userPhone}>{currentUser.phone}</Text>
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
            onValueChange={(val) => {
              triggerLight();
              setIsSharing(val);
            }}
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
                      onPress={() => router.push(item.route)}
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

        {/* DEMO CONTROLS / RESET */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>DEMO ENVIRONMENT</Text>
          <TouchableOpacity
            style={styles.demoResetBtn}
            onPress={handleResetDemo}
            activeOpacity={0.75}
          >
            <RotateCcw size={16} color={COLORS.primary} />
            <Text style={styles.demoResetText}>
              Reset Demo Trip (Goa Music Festival)
            </Text>
          </TouchableOpacity>
        </View>

        {/* APP INFO FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>MyCrew v1.0.0</Text>
          <Text style={styles.footerTagline}>
            Never lose your group again • Private by design
          </Text>
        </View>
      </ScrollView>
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
  userPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  demoResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...SHADOWS.sm,
  },
  demoResetText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
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
});
