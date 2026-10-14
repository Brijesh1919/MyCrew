import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  Send,
  Users,
  Search,
  X,
  Compass,
  Navigation,
  Sparkles,
  MapPin,
  AlertTriangle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { MapView } from '../../src/components/MapView';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { useTripStore } from '../../src/store/useTripStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useChatStore } from '../../src/store/useChatStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';
import { calculateDistanceMeters, formatDistance } from '../../src/utils/distance';

const QUICK_PINGS = [
  { label: '📍 Where are you?', text: 'Where are you right now?' },
  { label: '🏃 On my way', text: 'On my way to you!' },
  { label: '⏸️ Wait for me', text: 'Wait for me, heading over now.' },
  { label: '☕ Taking a break', text: 'Taking a quick break here.' },
  { label: '👍 Got it', text: 'Got it!' },
  { label: '🚨 Need help!', text: 'Need quick help here!', type: 'sos' },
];

export default function ChatScreen({ isTab = false }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { triggerLight, triggerSuccess } = useHapticFeedback();

  // Stores
  const activeTrip = useTripStore((state) => state.activeTrip);
  const currentUser = useUserStore((state) => state.currentUser);
  const members = useCrewStore((state) => state.members);
  const userLocation = useLocationStore((state) => state.userLocation);

  const messages = useChatStore((state) => state.messages);
  const activeChannel = useChatStore((state) => state.activeChannel);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const setActiveChannel = useChatStore((state) => state.setActiveChannel);
  const fetchTripMessages = useChatStore((state) => state.fetchTripMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const initRealtime = useChatStore((state) => state.initRealtime);
  const cleanupRealtime = useChatStore((state) => state.cleanupRealtime);

  // Local state
  const [inputText, setInputText] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef(null);

  // Initialize active channel if memberId was provided in route params
  useEffect(() => {
    if (params?.memberId) {
      setActiveChannel(String(params.memberId));
    }
  }, [params?.memberId]);

  // Manage chat screen active status so unread count accurately reflects foreground/background
  useFocusEffect(
    useCallback(() => {
      useChatStore.getState().setChatScreenOpen(true);
      return () => {
        useChatStore.getState().setChatScreenOpen(false);
      };
    }, [])
  );

  // Active target member if in 1:1 chat
  const activeTargetMember = useMemo(() => {
    if (activeChannel === 'group') return null;
    return members.find((m) => String(m.id) === String(activeChannel)) || null;
  }, [activeChannel, members]);

  // Filter messages for current channel
  const filteredMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    if (activeChannel === 'group') {
      return messages
        .filter((m) => !m.recipient_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const targetId = String(activeChannel);
    const myId = String(currentUser?.id || '');

    return messages
      .filter((m) => {
        const s = String(m.sender_id);
        const r = String(m.recipient_id);
        return (s === targetId && r === myId) || (s === myId && r === targetId);
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [messages, activeChannel, currentUser?.id]);

  // Handle Send Text
  const handleSend = async (customContent = null, messageType = 'text') => {
    const textToSend = customContent || inputText;
    if (!textToSend?.trim() || !activeTrip?.id || !currentUser?.id) return;

    triggerLight();
    if (!customContent) {
      setInputText('');
    }

    const recipientId = activeChannel === 'group' ? null : activeChannel;

    await sendMessage({
      tripId: activeTrip.id,
      senderId: currentUser.id,
      senderName: currentUser.name || 'Me',
      senderAvatar: currentUser.avatar || null,
      recipientId,
      content: textToSend.trim(),
      messageType,
    });
  };

  // Quick Ping Tap
  const handleQuickPing = (ping) => {
    triggerSuccess();
    handleSend(ping.text, 'text');
  };

  // Distance to active target member
  const targetDistanceInfo = useMemo(() => {
    if (!activeTargetMember) return null;
    const isOffline =
      activeTargetMember.status === 'offline' ||
      activeTargetMember.status === 'inactive' ||
      activeTargetMember.isLocationSharingActive === false;

    if (isOffline || !userLocation || !activeTargetMember.coordinates) {
      return { isPaused: true, text: 'Location Paused' };
    }

    const distMeters = calculateDistanceMeters(userLocation, activeTargetMember.coordinates);
    return {
      isPaused: false,
      text: `${formatDistance(distMeters)} away`,
      meters: distMeters,
    };
  }, [activeTargetMember, userLocation]);

  // Map center calculation
  const mapCenter = useMemo(() => {
    if (activeTargetMember?.coordinates && userLocation && !targetDistanceInfo?.isPaused) {
      return {
        latitude: (userLocation.latitude + activeTargetMember.coordinates.latitude) / 2,
        longitude: (userLocation.longitude + activeTargetMember.coordinates.longitude) / 2,
      };
    }
    return userLocation || null;
  }, [activeTargetMember, userLocation, targetDistanceInfo]);

  // Filtered members list for Search modal
  const filteredSearchMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const otherMembers = members.filter((m) => String(m.id) !== String(currentUser?.id));
    if (!query) return otherMembers;
    return otherMembers.filter((m) => (m.name || '').toLowerCase().includes(query));
  }, [members, currentUser?.id, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. APP HEADER */}
      <AppHeader
        title={activeChannel === 'group' ? 'CREW CHAT' : (activeTargetMember?.name || 'MEMBER CHAT').toUpperCase()}
        subtitle={
          activeChannel === 'group'
            ? `${activeTrip?.name || 'Active Trip'} • ${members.length} Members`
            : targetDistanceInfo
            ? targetDistanceInfo.isPaused
              ? 'Location Paused'
              : `Direct Chat • ${targetDistanceInfo.text}`
            : 'Direct 1:1 Chat'
        }
        showBack={!isTab && Boolean(router.canGoBack())}
        rightComponent={
          activeTargetMember && !targetDistanceInfo?.isPaused ? (
            <TouchableOpacity
              style={styles.headerWalkBtn}
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: '/features/navigation',
                  params: { memberId: activeTargetMember.id },
                });
              }}
            >
              <Navigation size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.headerWalkText}>Navigate</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.headerMapBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/map')}
            >
              <Compass size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 2. TOP LIVE MINI-MAP */}
        <View style={styles.mapContainer}>
          <MapView
            userLocation={userLocation}
            members={activeChannel === 'group' ? members : activeTargetMember ? [activeTargetMember] : []}
            center={mapCenter}
            showRoute={Boolean(activeTargetMember && !targetDistanceInfo?.isPaused && activeTargetMember.coordinates)}
            routeDestination={activeTargetMember?.coordinates}
            height={220}
            interactive={true}
          />

          {/* Top Overlay Badge on Map */}
          <View style={styles.mapOverlayChip}>
            {activeChannel === 'group' ? (
              <View style={styles.mapStatusPill}>
                <View style={styles.pulseDot} />
                <Text style={styles.mapStatusText}>
                  {members.filter((m) => m.status === 'active' || m.status === 'online').length} Crew Online
                </Text>
              </View>
            ) : targetDistanceInfo?.isPaused ? (
              <View style={[styles.mapStatusPill, styles.mapStatusPillPaused]}>
                <AlertTriangle size={12} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={[styles.mapStatusText, { color: '#B45309' }]}>
                  {activeTargetMember?.name || 'Member'} has paused location
                </Text>
              </View>
            ) : (
              <View style={[styles.mapStatusPill, styles.mapStatusPillConnected]}>
                <Navigation size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.mapStatusText, { color: COLORS.primary }]}>
                  Connected to {activeTargetMember?.name} • {targetDistanceInfo?.text}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. HORIZONTAL CHANNEL / PERSON SELECTOR CHIPS */}
        <View style={styles.channelsBar}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: 'group', name: 'Entire Crew', isGroup: true },
              ...members.filter((m) => String(m.id) !== String(currentUser?.id)),
            ]}
            keyExtractor={(item) => String(item.id)}
            style={styles.channelsFlatList}
            contentContainerStyle={styles.channelsScrollContent}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = activeChannel === String(item.id);
              const unread = unreadCounts[item.id] || 0;

              let badgeText = '';
              if (!item.isGroup) {
                const isOff =
                  item.status === 'offline' ||
                  item.status === 'inactive' ||
                  item.isLocationSharingActive === false;
                if (isOff || !userLocation || !item.coordinates) {
                  badgeText = 'Paused';
                } else {
                  const d = calculateDistanceMeters(userLocation, item.coordinates);
                  badgeText = formatDistance(d);
                }
              }

              return (
                <TouchableOpacity
                  style={[
                    styles.channelChip,
                    isSelected ? styles.channelChipActive : styles.channelChipInactive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    triggerLight();
                    setActiveChannel(String(item.id));
                  }}
                >
                  {item.isGroup ? (
                    <View
                      style={[
                        styles.chipIconBubble,
                        isSelected && styles.chipIconBubbleActive,
                      ]}
                    >
                      <Users
                        size={13}
                        color={isSelected ? COLORS.primary : COLORS.textSecondary}
                      />
                    </View>
                  ) : (
                    <MemberAvatar
                      uri={item.avatar}
                      name={item.name}
                      size="xs"
                      status={item.status}
                      style={{ marginRight: 6 }}
                    />
                  )}

                  <Text
                    style={[
                      styles.channelChipText,
                      isSelected && styles.channelChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.isGroup ? 'Entire Crew' : item.name?.split(' ')[0]}
                  </Text>

                  {!item.isGroup && badgeText ? (
                    <View
                      style={[
                        styles.chipDistanceBadge,
                        isSelected && styles.chipDistanceBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipDistanceText,
                          isSelected && styles.chipDistanceTextActive,
                        ]}
                      >
                        {badgeText}
                      </Text>
                    </View>
                  ) : null}

                  {unread > 0 && (
                    <View
                      style={[
                        styles.chipUnreadBadge,
                        isSelected && styles.chipUnreadBadgeActive,
                      ]}
                    >
                      <Text style={styles.chipUnreadText}>{unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {/* PINNED SEARCH BUTTON - Always visible on right, never pushed off */}
          <View style={styles.searchPinnedContainer}>
            <TouchableOpacity
              style={styles.searchPinnedBtn}
              activeOpacity={0.75}
              onPress={() => {
                triggerLight();
                setShowSearchModal(true);
              }}
              accessibilityLabel="Search crew members"
            >
              <Search size={16} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. CHAT MESSAGE STREAM */}
        <View style={styles.messagesContainer}>
          {filteredMessages.length === 0 ? (
            <View style={styles.emptyMessagesBox}>
              <View style={styles.emptyIconCircle}>
                <Sparkles size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeChannel === 'group'
                  ? 'No crew messages yet'
                  : `Start a conversation with ${activeTargetMember?.name || 'them'}`}
              </Text>
              <Text style={styles.emptySub}>
                Send a quick ping or message to coordinate during your trip.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={filteredMessages}
              keyExtractor={(item) => String(item.id)}
              inverted
              contentContainerStyle={styles.messagesScrollContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isMe = String(item.sender_id) === String(currentUser?.id);
                const timeStr = item.created_at
                  ? new Date(item.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <View
                    style={[
                      styles.messageRow,
                      isMe ? styles.messageRowMe : styles.messageRowOther,
                    ]}
                  >
                    {!isMe && (
                      <MemberAvatar
                        uri={item.sender_avatar}
                        name={item.sender_name}
                        size="sm"
                        style={styles.messageSenderAvatar}
                      />
                    )}

                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.bubbleMe : styles.bubbleOther,
                      ]}
                    >
                      {!isMe && activeChannel === 'group' && (
                        <Text style={styles.bubbleSenderName}>
                          {item.sender_name}
                        </Text>
                      )}

                      <Text
                        style={[
                          styles.bubbleContent,
                          isMe ? styles.bubbleContentMe : styles.bubbleContentOther,
                        ]}
                      >
                        {item.content}
                      </Text>

                      <Text
                        style={[
                          styles.bubbleTime,
                          isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther,
                        ]}
                      >
                        {timeStr}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* 5. QUICK PING CHIPS (ONE-TAP PRESETS) */}
        <View style={styles.quickPingsSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={QUICK_PINGS}
            keyExtractor={(item) => item.label}
            contentContainerStyle={styles.quickPingsScrollContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.quickPingPill,
                  item.type === 'sos' && styles.quickPingPillSos,
                ]}
                activeOpacity={0.7}
                onPress={() => handleQuickPing(item)}
              >
                <Text
                  style={[
                    styles.quickPingText,
                    item.type === 'sos' && styles.quickPingTextSos,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* 6. INPUT BAR (Safe Area Padded for Android 3-Button & iOS home bar) */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: isTab ? 8 : Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder={
              activeChannel === 'group'
                ? 'Message Entire Crew...'
                : `Message ${activeTargetMember?.name?.split(' ')[0] || 'member'}...`
            }
            placeholderTextColor={COLORS.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Send
              size={18}
              color={inputText.trim() ? COLORS.white : COLORS.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 7. SEARCH & SELECT MEMBER MODAL */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setShowSearchModal(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Crew Member</Text>
              <TouchableOpacity
                onPress={() => setShowSearchModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Search size={18} color={COLORS.textTertiary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search member by name..."
                placeholderTextColor={COLORS.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredSearchMembers}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalMemberRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setActiveChannel(String(item.id));
                    setShowSearchModal(false);
                    setSearchQuery('');
                  }}
                >
                  <MemberAvatar
                    uri={item.avatar}
                    name={item.name}
                    size="md"
                    status={item.status}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalMemberName}>{item.name}</Text>
                    <Text style={styles.modalMemberSub}>
                      {item.role === 'admin' ? 'Trip Leader' : 'Crew Member'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  headerWalkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  headerWalkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerMapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Map
  mapContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  mapOverlayChip: {
    position: 'absolute',
    top: 12,
    left: 14,
    zIndex: 10,
  },
  mapStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  mapStatusPillConnected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
  },
  mapStatusPillPaused: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  mapStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Channels bar
  channelsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  channelsFlatList: {
    flex: 1,
  },
  channelsScrollContent: {
    paddingLeft: 14,
    paddingRight: 8,
    alignItems: 'center',
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
  },
  channelChipInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  channelChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  chipIconBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  chipIconBubbleActive: {
    backgroundColor: COLORS.white,
  },
  channelChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  channelChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  chipDistanceBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  chipDistanceBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  chipDistanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipDistanceTextActive: {
    color: COLORS.white,
  },
  chipUnreadBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  chipUnreadBadgeActive: {
    borderColor: COLORS.primary,
  },
  chipUnreadText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Pinned search button
  searchPinnedContainer: {
    paddingLeft: 8,
    paddingRight: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
    backgroundColor: COLORS.surface,
  },
  searchPinnedBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },

  // Message area
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyMessagesBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageSenderAvatar: {
    marginRight: 8,
    marginBottom: 2,
  },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    ...SHADOWS.sm,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleSos: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
    backgroundColor: '#FEF2F2',
  },
  bubbleSenderName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 3,
  },
  bubbleContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleContentMe: {
    color: COLORS.white,
  },
  bubbleContentOther: {
    color: COLORS.textPrimary,
  },
  bubbleContentSos: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bubbleTimeOther: {
    color: COLORS.textTertiary,
  },
  bubbleTimeSos: {
    color: '#EF4444',
  },

  pingTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  pingTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sosTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  sosTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },

  // Quick pings
  quickPingsSection: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
  },
  quickPingsScrollContent: {
    paddingHorizontal: 14,
  },
  quickPingPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickPingPillSos: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  quickPingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quickPingTextSos: {
    color: '#DC2626',
    fontWeight: '700',
  },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 44,
    maxHeight: 96,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    ...SHADOWS.sm,
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingTop: 12,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    ...SHADOWS.lg,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  modalMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalMemberName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalMemberSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
