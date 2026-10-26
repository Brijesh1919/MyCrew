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
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Shield,
  MapPin,
  Cpu,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  History,
  X,
  Edit3,
  Phone,
  User,
  Check,
  Camera,
  Trash2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../src/services/supabase';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { TripHistoryCard } from '../../src/components/TripHistoryCard';
import { HistoricalTripModal } from '../../src/components/HistoricalTripModal';
import { ContactNumberModal } from '../../src/components/ContactNumberModal';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useUserStore } from '../../src/store/useUserStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';
import { tripService } from '../../src/services/tripService';
import { locationService } from '../../src/services/locationService';

export default function ProfileScreen() {
  const router = useRouter();
  const { triggerLight, triggerWarning, triggerSuccess } = useHapticFeedback();

  // Stores
  const currentUser = useUserStore((state) => state.currentUser);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const clearAuth = useUserStore((state) => state.clearAuth);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const userRole = useTripStore((state) => state.userRole);
  const tripHistory = useTripStore((state) => state.tripHistory);
  const isSharing = useLocationStore((state) => state.isLocationSharingActive);
  const setIsSharing = useLocationStore((state) => state.setIsLocationSharingActive);

  // Edit Profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
  ];

  const handleOpenEditModal = () => {
    setEditName(currentUser?.name || '');
    setEditPhone(currentUser?.phone || '');
    setEditAvatar(currentUser?.avatar || '');
    setShowEditModal(true);
    triggerLight();
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim() || null,
        avatar: editAvatar.trim() || null,
      });
      triggerSuccess();
      setShowEditModal(false);
    } catch (err) {
      console.warn('Error saving profile:', err);
      Alert.alert('Error', 'Could not update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Please allow photo gallery access in settings to upload your profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingPhoto(true);

      let targetUrl = asset.uri;

      // Upload to Supabase storage 'avatars' bucket
      if (asset.base64 && currentUser?.id) {
        try {
          const filePath = `${currentUser.id}_${Date.now()}.jpg`;
          const byteCharacters = atob(asset.base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, byteArray, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!uploadError) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            if (data?.publicUrl) {
              targetUrl = data.publicUrl;
            }
          } else {
            console.warn('Supabase avatar upload error:', uploadError.message);
          }
        } catch (storageErr) {
          console.warn('Avatar storage error:', storageErr);
        }
      }

      setEditAvatar(targetUrl);
      triggerSuccess();
    } catch (err) {
      console.warn('Image picker error:', err);
      Alert.alert('Error', 'Could not access device photos.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

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

    // Immediately update local crew store so all tabs (People, Map, Home) reflect state instantly
    useCrewStore.getState().setUserLocationSharingState(currentUser.id, val);

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
  const displayEmail = currentUser?.email || currentUser?.phone || 'Crew Member';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenHeaderRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/home');
              }
            }}
            accessibilityLabel="Back to Home"
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Profile & Settings</Text>
        </View>

        {/* 1. OPEN PROFILE HERO HEADER (No heavy card box) */}
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <MemberAvatar
              uri={currentUser?.avatar}
              name={displayName}
              size="lg"
              status={activeTrip ? (isSharing ? 'live' : 'offline') : 'offline'}
              isUser={true}
            />
            <TouchableOpacity
              style={styles.avatarEditBadge}
              onPress={handleOpenEditModal}
              activeOpacity={0.8}
            >
              <Camera size={13} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {displayEmail}
          </Text>

          {/* Quick Info & Action Chips */}
          <View style={styles.heroPillsRow}>
            <TouchableOpacity
              style={[
                styles.contactPill,
                !currentUser?.phone && styles.contactPillWarning,
              ]}
              onPress={() => {
                triggerLight();
                setShowContactModal(true);
              }}
              activeOpacity={0.75}
            >
              <Phone
                size={12}
                color={currentUser?.phone ? COLORS.primary : '#D97706'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.contactPillText,
                  !currentUser?.phone && styles.contactPillWarningText,
                ]}
                numberOfLines={1}
              >
                {currentUser?.phone ? currentUser.phone : '+ Add Phone'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={handleOpenEditModal}
              activeOpacity={0.75}
            >
              <Edit3 size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Active Trip Status Indicator */}
          <View
            style={[
              styles.statusPill,
              !activeTrip && { backgroundColor: '#F1F5F9' },
              activeTrip && !isSharing && { backgroundColor: '#FEF2F2' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                !activeTrip && { backgroundColor: COLORS.textMuted },
                activeTrip && !isSharing && { backgroundColor: COLORS.danger },
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                !activeTrip && { color: COLORS.textSecondary },
                activeTrip && !isSharing && { color: COLORS.danger },
              ]}
            >
              {!activeTrip
                ? 'Not in any crew'
                : isSharing
                ? `Active in ${activeTrip.name} (${userRole === 'organizer' ? 'Host' : 'Member'})`
                : `Location Paused in ${activeTrip.name} (${userRole === 'organizer' ? 'Host' : 'Member'})`}
            </Text>
          </View>
        </View>

        {/* 2. CREW & SHARING INSET GROUP */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>CREW & SHARING</Text>
          <View style={styles.menuBox}>
            {/* Integrated Location Sharing Row */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleRowLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <MapPin size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.menuItemLabel}>Location Sharing</Text>
                  <Text style={styles.menuItemSub} numberOfLines={1}>
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

            <View style={styles.menuDivider} />

            {/* Smart Tracking */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/features/smart-tracking')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Cpu size={18} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Smart Tracking</Text>
                  <Text style={styles.menuItemSub}>Crowded Mode • Battery optimized</Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Privacy & Sharing */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/features/privacy')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Shield size={18} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Privacy & Sharing</Text>
                  <Text style={styles.menuItemSub}>Only shared during active trips</Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. APP & PREFERENCES INSET GROUP */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>APP & PREFERENCES</Text>
          <View style={styles.menuBox}>
            {/* Trip History */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                triggerLight();
                setShowHistoryModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
                  <History size={18} color={COLORS.textPrimary} />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Trip History</Text>
                  <Text style={styles.menuItemSub}>
                    {tripHistory.length > 0
                      ? `${tripHistory.length} past crew${tripHistory.length === 1 ? '' : 's'}`
                      : 'No past trips yet'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Group Radar */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/features/group-radar')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
                  <MapPin size={18} color={COLORS.textPrimary} />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Group Radar</Text>
                  <Text style={styles.menuItemSub}>Relative compass view</Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Safety Check-in */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/features/check-in')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Sparkles size={18} color={COLORS.success} />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Safety Check-in</Text>
                  <Text style={styles.menuItemSub}>
                    {currentUser?.isSafe ? 'Checked in as Safe' : 'Not checked in'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. ACCOUNT INSET GROUP */}
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
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 10 }}
            resizeMode="cover"
          />
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

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.editModalContainer} edges={['top', 'bottom']}>
          <View style={styles.editModalHeader}>
            <View>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <Text style={styles.editModalSub}>
                Update your personal details & contact number
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowEditModal(false)}
              style={styles.editModalCloseBtn}
              activeOpacity={0.7}
            >
              <X size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.editModalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Active Avatar Preview */}
            <View style={styles.avatarPreviewCenter}>
              <MemberAvatar
                uri={editAvatar}
                name={editName || 'You'}
                size="xl"
                status="live"
                isUser={true}
              />
              <Text style={styles.avatarPickerLabel}>CHOOSE YOUR AVATAR</Text>
            </View>

            {/* Avatar Selector Grid */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarScrollRow}
            >
              {PRESET_AVATARS.map((uri, idx) => (
                <TouchableOpacity
                  key={`avatar-${idx}`}
                  style={[
                    styles.avatarOption,
                    editAvatar === uri && styles.avatarOptionSelected,
                  ]}
                  onPress={() => {
                    triggerLight();
                    setEditAvatar(uri);
                  }}
                  activeOpacity={0.8}
                >
                  <MemberAvatar uri={uri} name="Avatar" size="md" />
                  {editAvatar === uri && (
                    <View style={styles.avatarCheckBadge}>
                      <Check size={12} color={COLORS.white} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Upload Photo from Device Button (replaces manual link input) */}
            <TouchableOpacity
              style={styles.uploadDeviceBtn}
              onPress={handlePickImage}
              disabled={isUploadingPhoto}
              activeOpacity={0.8}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
              ) : (
                <Camera size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.uploadDeviceBtnText}>
                {isUploadingPhoto ? 'Uploading from device…' : 'Upload Photo from Device'}
              </Text>
            </TouchableOpacity>

            {editAvatar ? (
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => {
                  triggerLight();
                  setEditAvatar('');
                }}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                <Text style={styles.removePhotoText}>Remove photo</Text>
              </TouchableOpacity>
            ) : null}

            {/* Full Name Input */}
            <Text style={styles.fieldLabel}>FULL NAME *</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. John Doe"
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Contact / Phone Number */}
            <Text style={styles.fieldLabel}>CONTACT NUMBER (FOR CALLING) *</Text>
            <TextInput
              style={styles.editInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
            <View style={styles.phoneNoticeBox}>
              <Text style={styles.phoneNoticeText}>
                📞 Your contact number allows fellow crew members and trip hosts to call you directly during emergencies.
              </Text>
            </View>

            {/* Save & Cancel */}
            <PrimaryButton
              title={isSavingProfile ? 'Saving Changes…' : 'Save Profile Details'}
              onPress={handleSaveProfile}
              size="lg"
              disabled={isSavingProfile}
              style={{ marginTop: 24, marginBottom: 12 }}
            />

            <SecondaryButton
              title="Cancel"
              onPress={() => setShowEditModal(false)}
              size="md"
              variant="outline"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  screenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  screenTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
  },
  profileHero: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 18,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
    textAlign: 'center',
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 13,
    textAlign: 'center',
  },
  heroPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  contactPillWarning: {
    backgroundColor: '#FEF3C7',
  },
  contactPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  contactPillWarningText: {
    color: '#D97706',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginTop: 10,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    color: '#64748B',
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  menuBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  menuItemSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontSize: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 64,
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
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  editProfilePillText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  contactText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  contactTextEmpty: {
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  editModalHeader: {
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
  editModalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  editModalSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  editModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editModalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarPreviewCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPickerLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginTop: 10,
  },
  avatarScrollRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginBottom: 16,
  },
  avatarOption: {
    marginRight: 12,
    borderRadius: 30,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: COLORS.primary,
  },
  avatarCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  phoneNoticeBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 4,
    marginBottom: 12,
  },
  phoneNoticeText: {
    ...TYPOGRAPHY.caption,
    color: '#1E40AF',
    lineHeight: 18,
    fontSize: 12,
  },
  uploadDeviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  uploadDeviceBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  removePhotoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  phoneAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  phoneAlertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  phoneAlertTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  phoneAlertTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    fontSize: 14,
    color: '#92400E',
  },
  phoneAlertSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  phoneAlertActionBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  phoneAlertActionBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
