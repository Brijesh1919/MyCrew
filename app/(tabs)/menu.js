import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Phone,
  Edit3,
  Camera,
  Sun,
  Moon,
  Smartphone,
  Shield,
  Compass,
  Battery,
  LogOut,
  ChevronRight,
  Copy,
  QrCode,
  Users,
  AlertTriangle,
  History,
  MapPin,
  Plus,
  UserPlus,
  ShieldCheck,
  MessageSquare,
  X,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useUserStore } from '../../src/store/useUserStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useMeetingPointStore } from '../../src/store/useMeetingPointStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';
import { authService } from '../../src/services/authService';

export default function MenuScreen() {
  const router = useRouter();
  const { triggerLight, triggerSuccess, triggerWarning } = useHapticFeedback();

  // Stores
  const currentUser = useUserStore((state) => state.currentUser);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const clearAuth = useUserStore((state) => state.clearAuth);

  const activeTrip = useTripStore((state) => state.activeTrip);
  const userRole = useTripStore((state) => state.userRole);
  const leaveTrip = useTripStore((state) => state.leaveTrip);
  const endTrip = useTripStore((state) => state.endTrip);
  const tripHistory = useTripStore((state) => state.tripHistory);
  const members = useCrewStore((state) => state.members);
  const getStatusCounts = useCrewStore((state) => state.getStatusCounts);
  const statusCounts = getStatusCounts();
  const meetingPoints = useMeetingPointStore((state) => state.meetingPoints);

  const isLocationSharingActive = useLocationStore((state) => state.isLocationSharingActive);
  const setIsLocationSharingActive = useLocationStore((state) => state.setIsLocationSharingActive);

  // Theme store
  const themeMode = useThemeStore((state) => state.themeMode);
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);

  // Edit Profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // QR Modal
  const [showQRModal, setShowQRModal] = useState(false);

  // Tracking Mode State
  const [batterySaver, setBatterySaver] = useState(currentUser?.trackingMode === 'battery_saver');

  const displayName = currentUser?.name || 'Crew Member';
  const displayPhone = currentUser?.phone || 'No phone set';

  const handleOpenEdit = () => {
    triggerLight();
    setEditName(currentUser?.name || '');
    setEditPhone(currentUser?.phone || '');
    setEditAvatar(currentUser?.avatar || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      triggerWarning();
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    triggerLight();
    setIsSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim() || null,
        avatar: editAvatar.trim() || null,
      });
      triggerSuccess();
      setShowEditModal(false);
    } catch (err) {
      triggerWarning();
      Alert.alert('Error', 'Could not update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickPhoto = async () => {
    triggerLight();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  const handleShareTrip = async () => {
    if (!activeTrip?.code) return;
    triggerLight();
    try {
      await Share.share({
        message: `Join my crew on MyCrew! Enter code: ${activeTrip.code}\nOr open: https://mycrew.app/join/${activeTrip.code}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleCopyCode = async () => {
    triggerSuccess();
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(activeTrip?.code || '');
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`Trip code ${activeTrip?.code} copied to clipboard!`);
        }
        return;
      } catch (e) {}
    }
    Alert.alert('Copied!', `Trip code ${activeTrip?.code} copied to clipboard.`);
  };

  const performLeaveTrip = async () => {
    triggerLight();
    await leaveTrip();
    router.replace('/(tabs)/home');
  };

  const handleLeaveTrip = () => {
    triggerWarning();
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm('Leave Trip? You will stop sharing location with this crew.')
        : true;
      if (confirmed) {
        performLeaveTrip();
      }
      return;
    }
    Alert.alert(
      'Leave Trip?',
      'You will stop sharing location with this crew. You can rejoin anytime using the trip code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Trip',
          style: 'destructive',
          onPress: performLeaveTrip,
        },
      ]
    );
  };

  const performEndTrip = async () => {
    triggerLight();
    await endTrip();
    router.replace('/(tabs)/home');
  };

  const handleEndTrip = () => {
    triggerWarning();
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm('End Trip for Everyone? As the trip creator, this will finish the trip for all crew members and stop location sharing.')
        : true;
      if (confirmed) {
        performEndTrip();
      }
      return;
    }
    Alert.alert(
      'End Trip for Everyone?',
      'As the trip creator, this will finish the trip for all crew members and stop location sharing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: performEndTrip,
        },
      ]
    );
  };

  const performSignOut = async () => {
    triggerLight();
    try {
      await authService.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    clearAuth();
    router.replace('/(auth)');
  };

  const handleSignOut = () => {
    triggerWarning();
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm('Log Out: Are you sure you want to log out of MyCrew?')
        : true;
      if (confirmed) {
        performSignOut();
      }
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out of MyCrew?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: performSignOut,
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Menu & Settings</Text>
        </View>

        {/* 1. Profile Card Header */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileAvatarWrap}>
            <MemberAvatar
              uri={currentUser?.avatar}
              name={displayName}
              size="lg"
              isUser={true}
            />
            <TouchableOpacity
              style={[styles.avatarCameraBadge, { backgroundColor: colors.primary }]}
              onPress={handleOpenEdit}
              activeOpacity={0.8}
            >
              <Camera size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileTextInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.phoneBadgeRow}>
              <Phone size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.profilePhone, { color: colors.textSecondary }]} numberOfLines={1}>
                {displayPhone}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
            onPress={handleOpenEdit}
            activeOpacity={0.7}
          >
            <Edit3 size={14} color={colors.textPrimary} style={{ marginRight: 4 }} />
            <Text style={[styles.editBtnText, { color: colors.textPrimary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Trip Coordination (Prioritized on top right after user profile card) */}
        {activeTrip ? (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>CURRENT TRIP</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.tripCardHeader}>
                <View style={styles.tripStatusDot} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tripTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {activeTrip.name || 'Active Crew Trip'}
                  </Text>
                  <Text style={[styles.tripSubtitle, { color: colors.textSecondary }]}>
                    Role: {userRole === 'owner' ? 'Trip Creator (Admin)' : 'Member'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.qrCodeBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={() => setShowQRModal(true)}
                  activeOpacity={0.7}
                >
                  <QrCode size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Trip Code Row */}
              <View style={styles.tripCodeRow}>
                <View>
                  <Text style={[styles.tripCodeLabel, { color: colors.textMuted }]}>CREW INVITE CODE</Text>
                  <Text style={[styles.tripCodeVal, { color: colors.primary }]}>{activeTrip.code || '------'}</Text>
                </View>
                <View style={styles.codeActionsRow}>
                  <TouchableOpacity
                    style={[styles.smallActionBtn, { backgroundColor: colors.surfaceSubtle }]}
                    onPress={handleCopyCode}
                  >
                    <Copy size={13} color={colors.textPrimary} style={{ marginRight: 4 }} />
                    <Text style={[styles.smallActionText, { color: colors.textPrimary }]}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallActionBtn, { backgroundColor: colors.surfaceSubtle }]}
                    onPress={handleShareTrip}
                  >
                    <Users size={13} color={colors.textPrimary} style={{ marginRight: 4 }} />
                    <Text style={[styles.smallActionText, { color: colors.textPrimary }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Trip Tools Rows (Emergency SOS removed) */}
              <TouchableOpacity
                style={styles.menuNavRow}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/people')}
              >
                <View style={[styles.menuNavIconWrap, { backgroundColor: colors.surfaceSubtle }]}>
                  <Users size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.menuNavTitle, { color: colors.textPrimary }]}>Crew Status & Check-in</Text>
                  <Text style={[styles.menuNavSub, { color: colors.textSecondary }]}>
                    {statusCounts.active || 1} Active • {statusCounts.delayed || 0} Delayed
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuNavRow}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/meet')}
              >
                <View style={[styles.menuNavIconWrap, { backgroundColor: colors.surfaceSubtle }]}>
                  <MapPin size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.menuNavTitle, { color: colors.textPrimary }]}>Meeting Points</Text>
                  <Text style={[styles.menuNavSub, { color: colors.textSecondary }]}>
                    {meetingPoints?.length || 0} designated meetup spots
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Leave / End Trip Action */}
              <TouchableOpacity
                style={styles.dangerActionRow}
                onPress={userRole === 'owner' ? handleEndTrip : handleLeaveTrip}
                activeOpacity={0.7}
              >
                <AlertTriangle size={16} color={colors.danger} style={{ marginRight: 8 }} />
                <Text style={[styles.dangerActionText, { color: colors.danger }]}>
                  {userRole === 'owner' ? 'End Trip for Everyone' : 'Leave Trip'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>TRIP COORDINATION</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => {
                  triggerLight();
                  router.push('/(auth)/create-trip');
                }}
                activeOpacity={0.7}
                accessibilityLabel="Create New Trip"
              >
                <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceSubtle }]}>
                  <Plus size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Create New Trip</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Start a new temporary crew & invite friends
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => {
                  triggerLight();
                  router.push('/(auth)/join');
                }}
                activeOpacity={0.7}
                accessibilityLabel="Join a Crew"
              >
                <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceSubtle }]}>
                  <UserPlus size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Join a Crew</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Enter 6-digit invite code or scan QR
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. Past Trips / Trip History */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>PAST TRIPS</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                triggerLight();
                router.push('/(tabs)/trip');
              }}
              activeOpacity={0.7}
              accessibilityLabel="Trip History"
            >
              <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceSubtle }]}>
                <History size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Trip History</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {tripHistory?.length ? `${tripHistory.length} completed trips` : 'View past trips and past crews'}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Appearance Settings (Moved lower down as trip is prioritized) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>APPEARANCE</Text>
          <View style={[styles.themeSelectorRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Light Mode Pill */}
            <TouchableOpacity
              style={[
                styles.themePill,
                themeMode === 'light' && [styles.themePillActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => {
                triggerLight();
                setThemeMode('light');
              }}
              activeOpacity={0.75}
            >
              <Sun size={15} color={themeMode === 'light' ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.themePillText, { color: themeMode === 'light' ? '#FFFFFF' : colors.textSecondary }]}>
                Light
              </Text>
            </TouchableOpacity>

            {/* Dark Mode Pill */}
            <TouchableOpacity
              style={[
                styles.themePill,
                themeMode === 'dark' && [styles.themePillActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => {
                triggerLight();
                setThemeMode('dark');
              }}
              activeOpacity={0.75}
            >
              <Moon size={15} color={themeMode === 'dark' ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.themePillText, { color: themeMode === 'dark' ? '#FFFFFF' : colors.textSecondary }]}>
                Dark
              </Text>
            </TouchableOpacity>

            {/* System Default Pill */}
            <TouchableOpacity
              style={[
                styles.themePill,
                themeMode === 'system' && [styles.themePillActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => {
                triggerLight();
                setThemeMode('system');
              }}
              activeOpacity={0.75}
            >
              <Smartphone size={15} color={themeMode === 'system' ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.themePillText, { color: themeMode === 'system' ? '#FFFFFF' : colors.textSecondary }]}>
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Safety & Tracking Settings */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>LOCATION & ACCURACY</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Location Sharing Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Compass size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Location Sharing</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {isLocationSharingActive ? 'Live sharing active with your crew' : 'Location paused'}
                </Text>
              </View>
              <Switch
                value={isLocationSharingActive}
                onValueChange={(val) => {
                  triggerLight();
                  setIsLocationSharingActive(val);
                }}
                trackColor={{ false: '#64748B', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Battery Saver Mode */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Battery size={18} color={batterySaver ? '#F59E0B' : colors.primary} />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Battery Saver Mode</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {batterySaver ? 'Balanced 60s GPS pings' : 'Festival Mode (10s live pings)'}
                </Text>
              </View>
              <Switch
                value={batterySaver}
                onValueChange={(val) => {
                  triggerLight();
                  setBatterySaver(val);
                  updateProfile({ trackingMode: val ? 'battery_saver' : 'crowded' });
                }}
                trackColor={{ false: '#64748B', true: '#F59E0B' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* 6. Account & Sign Out */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>ACCOUNT</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconWrap, { backgroundColor: colors.dangerBg }]}>
                <LogOut size={18} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.danger }]}>Log Out</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>Sign out of your MyCrew session</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer brand info */}
        <View style={styles.footerWrap}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>MyCrew v1.0.0 • Group Live Coordination</Text>
          <Text style={[styles.footerSub, { color: colors.textMuted }]}>Temporary by design. No permanent tracking.</Text>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16 }}>
              {/* Photo preview */}
              <View style={styles.editAvatarCenter}>
                <MemberAvatar uri={editAvatar} name={editName || 'User'} size="lg" isUser={true} />
                <TouchableOpacity
                  style={[styles.pickPhotoBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={handlePickPhoto}
                >
                  <Camera size={14} color={colors.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={[styles.pickPhotoText, { color: colors.textPrimary }]}>Choose Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Full Name Input */}
              <View style={styles.modalInputBlock}>
                <Text style={[styles.modalInputLabel, { color: colors.textSecondary }]}>YOUR FULL NAME</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.surfaceSubtle, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Alex Sharma"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              {/* Mobile Number Input */}
              <View style={styles.modalInputBlock}>
                <Text style={[styles.modalInputLabel, { color: colors.textSecondary }]}>MOBILE NUMBER (FOR CREW CALLS)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.surfaceSubtle, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <PrimaryButton
                title="Save Changes"
                onPress={handleSaveProfile}
                loading={isSaving}
                icon={Check}
                size="lg"
                style={{ marginTop: 12, backgroundColor: colors.primary }}
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.qrModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.qrModalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{activeTrip?.name || 'Crew Invite'}</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              <QRCode
                value={`https://mycrew.app/join/${activeTrip?.code || ''}`}
                size={200}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>

            <Text style={[styles.qrCodeText, { color: colors.primary }]}>{activeTrip?.code}</Text>
            <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
              Ask your friends to open MyCrew and scan this code or enter it manually to join your live group.
            </Text>

            <SecondaryButton
              title="Close"
              onPress={() => setShowQRModal(false)}
              style={{ marginTop: 16 }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: 16,
  },
  screenTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  profileAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTextInfo: {
    flex: 1,
  },
  profileName: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  phoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhone: {
    fontSize: 13,
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeading: {
    ...TYPOGRAPHY.badge,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 5,
    gap: 6,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  themePillActive: {},
  themePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tripStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginRight: 10,
  },
  tripTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '700',
  },
  tripSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  qrCodeBtn: {
    padding: 8,
    borderRadius: RADIUS.md,
  },
  tripCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  tripCodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tripCodeVal: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dangerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  dangerActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  footerWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  editAvatarCenter: {
    alignItems: 'center',
    marginVertical: 14,
  },
  pickPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginTop: 10,
  },
  pickPhotoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalInputBlock: {
    marginBottom: 14,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  qrModalCard: {
    marginHorizontal: 24,
    borderRadius: RADIUS.xxl,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    width: '90%',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    marginBottom: 16,
  },
  qrCodeText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  qrHint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  menuNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  menuNavIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  menuNavSub: {
    fontSize: 12,
    fontWeight: '500',
  },
});
