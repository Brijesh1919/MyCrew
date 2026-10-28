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
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  Send,
  Users,
  Search,
  X,
  Navigation,
  Sparkles,
  ChevronRight,
  MessageCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { useThemeStore } from '../../src/store/useThemeStore';
import { AppHeader } from '../../src/components/AppHeader';
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

function formatTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  } catch (e) {
    return '';
  }
}

export default function ChatScreen({ isTab = false, initialMemberId = null }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { triggerLight, triggerSuccess } = useHapticFeedback();

  // Dynamic Theme
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);

  // Stores
  const activeTrip = useTripStore((state) => state.activeTrip);
  const currentUser = useUserStore((state) => state.currentUser);
  const members = useCrewStore((state) => state.members);
  const userLocation = useLocationStore((state) => state.userLocation);

  const messages = useChatStore((state) => state.messages);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const setActiveChannel = useChatStore((state) => state.setActiveChannel);
  const sendMessage = useChatStore((state) => state.sendMessage);

  // Navigation / Selected Channel state
  // null = Conversations List View, 'group' = Whole Crew Thread, memberId = 1:1 Thread
  const targetInitialId = initialMemberId || params?.memberId;
  const [selectedChannel, setSelectedChannel] = useState(
    targetInitialId ? String(targetInitialId) : (params?.channel === 'group' ? 'group' : null)
  );

  // Local state
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef(null);

  // Listen for navigation param changes (e.g. from MemberBottomSheet or people screen)
  useEffect(() => {
    if (params?.memberId) {
      const id = String(params.memberId);
      setSelectedChannel(id);
      setActiveChannel(id);
    } else if (params?.channel === 'group') {
      setSelectedChannel('group');
      setActiveChannel('group');
    }
  }, [params?.memberId, params?.channel]);

  // Manage chat screen active status in store
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
    if (!selectedChannel || selectedChannel === 'group') return null;
    return members.find((m) => String(m.id) === String(selectedChannel)) || null;
  }, [selectedChannel, members]);

  // Filter messages for current channel
  const filteredMessages = useMemo(() => {
    if (!messages || messages.length === 0 || !selectedChannel) return [];

    if (selectedChannel === 'group') {
      return messages
        .filter((m) => !m.recipient_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const targetId = String(selectedChannel);
    const myId = String(currentUser?.id || '');

    return messages
      .filter((m) => {
        const s = String(m.sender_id);
        const r = String(m.recipient_id);
        return (s === targetId && r === myId) || (s === myId && r === targetId);
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [messages, selectedChannel, currentUser?.id]);

  // Compute latest group message
  const latestGroupMessage = useMemo(() => {
    if (!messages || !messages.length) return null;
    const groupMsgs = messages.filter((m) => !m.recipient_id);
    if (!groupMsgs.length) return null;
    return groupMsgs.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }, [messages]);

  // Compute latest message per member for 1:1 conversations
  const latestMessagePerMember = useMemo(() => {
    if (!messages || !messages.length) return {};
    const map = {};
    const myId = String(currentUser?.id || '');

    const sorted = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    for (const m of sorted) {
      if (!m.recipient_id) continue;
      const s = String(m.sender_id);
      const r = String(m.recipient_id);

      let otherId = null;
      if (s === myId) otherId = r;
      else if (r === myId) otherId = s;

      if (otherId) {
        map[otherId] = m;
      }
    }
    return map;
  }, [messages, currentUser?.id]);

  // Filtered members list for Conversations List
  const filteredMembers = useMemo(() => {
    const otherMembers = members.filter((m) => String(m.id) !== String(currentUser?.id));
    const query = searchQuery.trim().toLowerCase();
    if (!query) return otherMembers;
    return otherMembers.filter((m) => (m.name || '').toLowerCase().includes(query));
  }, [members, currentUser?.id, searchQuery]);

  // Handle Send Text
  const handleSend = async (customContent = null, messageType = 'text') => {
    const textToSend = customContent || inputText;
    if (!textToSend?.trim() || !activeTrip?.id || !currentUser?.id || !selectedChannel) return;

    triggerLight();
    if (!customContent) {
      setInputText('');
    }

    const recipientId = selectedChannel === 'group' ? null : selectedChannel;

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
    handleSend(ping.text, ping.type || 'text');
  };

  // Distance to active target member (1:1 view)
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

  // =========================================================================
  // VIEW 1: CONVERSATIONS LIST (DEFAULT VIEW)
  // =========================================================================
  if (!selectedChannel) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: isDark ? '#0B0F17' : colors.background }]}
        edges={['top', 'left', 'right']}
      >
        {/* Header - No radar/compass button */}
        <AppHeader
          title="CREW CHAT"
          subtitle={`${activeTrip?.name || 'Active Trip'} • ${members.length} Members`}
          showBack={!isTab && Boolean(router.canGoBack())}
          onBack={() => router.back()}
          rightComponent={null}
        />

        <ScrollView
          style={styles.listScrollView}
          contentContainerStyle={[
            styles.listScrollContent,
            { paddingBottom: isTab ? 90 : Math.max(insets.bottom + 20, 30) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Bar */}
          <View
            style={[
              styles.searchBarBox,
              {
                backgroundColor: isDark ? '#111827' : '#F1F5F9',
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
              },
            ]}
          >
            <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchBarInput, { color: colors.textPrimary }]}
              placeholder="Search crew members..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* PINNED SECTION: WHOLE CREW GROUP CHAT */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.textSecondary }]}>
              PINNED CONVERSATION
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.groupCard,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.25)',
              },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              triggerLight();
              setActiveChannel('group');
              setSelectedChannel('group');
            }}
          >
            <View style={styles.cardRow}>
              {/* Group Avatar Bubble */}
              <View
                style={[
                  styles.groupAvatarCircle,
                  {
                    backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE',
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : '#93C5FD',
                  },
                ]}
              >
                <Users size={22} color={colors.primary} />
              </View>

              {/* Group Title & Last Message */}
              <View style={styles.cardCenter}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    Entire Crew
                  </Text>
                  <View
                    style={[
                      styles.pinnedTag,
                      {
                        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.25)' : '#EFF6FF',
                        borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#BFDBFE',
                      },
                    ]}
                  >
                    <Text style={[styles.pinnedTagText, { color: colors.primary }]}>GROUP</Text>
                  </View>
                </View>

                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {latestGroupMessage
                    ? `${latestGroupMessage.sender_name?.split(' ')[0]}: ${latestGroupMessage.content}`
                    : `Coordinate with all ${members.length} members`}
                </Text>
              </View>

              {/* Timestamp & Unread Badge / Chevron */}
              <View style={styles.cardRight}>
                {latestGroupMessage && (
                  <Text style={[styles.cardTime, { color: colors.textMuted }]}>
                    {formatTime(latestGroupMessage.created_at)}
                  </Text>
                )}
                <View style={styles.cardActionRow}>
                  {unreadCounts['group'] > 0 ? (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.danger }]}>
                      <Text style={styles.unreadBadgeText}>{unreadCounts['group']}</Text>
                    </View>
                  ) : (
                    <ChevronRight size={18} color={colors.textMuted} />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* CREW MEMBERS (DIRECT MESSAGES) LIST */}
          <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.textSecondary }]}>
              CREW MEMBERS ({filteredMembers.length})
            </Text>
          </View>

          {filteredMembers.length === 0 ? (
            <View
              style={[
                styles.emptyListBox,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1F2937' : '#E5E7EB',
                },
              ]}
            >
              <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>
                {searchQuery ? `No members found matching "${searchQuery}"` : 'No other crew members yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.membersListContainer}>
              {filteredMembers.map((member) => {
                const latestMsg = latestMessagePerMember[member.id];
                const unread = unreadCounts[member.id] || 0;

                // Tactical proximity / status text
                const isOffline =
                  member.status === 'offline' ||
                  member.status === 'inactive' ||
                  member.isLocationSharingActive === false;

                let proximityText = 'Location Paused';
                if (!isOffline && userLocation && member.coordinates) {
                  const dist = calculateDistanceMeters(userLocation, member.coordinates);
                  proximityText = `${formatDistance(dist)} away`;
                  if (member.lastSeenSecondsAgo) {
                    proximityText += ` • ${
                      member.lastSeenSecondsAgo < 60
                        ? `${member.lastSeenSecondsAgo}s ago`
                        : `${Math.round(member.lastSeenSecondsAgo / 60)}m ago`
                    }`;
                  }
                }

                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberCard,
                      {
                        backgroundColor: isDark ? '#111827' : '#FFFFFF',
                        borderColor: isDark ? '#1F2937' : '#E5E7EB',
                      },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      triggerLight();
                      const idStr = String(member.id);
                      setActiveChannel(idStr);
                      setSelectedChannel(idStr);
                    }}
                  >
                    <View style={styles.cardRow}>
                      {/* Avatar with Live Indicator */}
                      <MemberAvatar
                        uri={member.avatar}
                        name={member.name}
                        size="md"
                        status={member.status}
                        style={{ marginRight: 12 }}
                      />

                      {/* Member Info */}
                      <View style={styles.cardCenter}>
                        <View style={styles.cardTitleRow}>
                          <Text
                            style={[styles.cardTitle, { color: colors.textPrimary }]}
                            numberOfLines={1}
                          >
                            {member.name}
                          </Text>
                          {member.role === 'admin' && (
                            <View
                              style={[
                                styles.roleTag,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(234, 179, 8, 0.15)'
                                    : '#FEF3C7',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleTagText,
                                  { color: isDark ? '#FACC15' : '#D97706' },
                                ]}
                              >
                                LEADER
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={[styles.cardSubtitle, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {latestMsg ? latestMsg.content : `📍 ${proximityText}`}
                        </Text>
                      </View>

                      {/* Timestamp & Unread / Chevron */}
                      <View style={styles.cardRight}>
                        {latestMsg ? (
                          <Text style={[styles.cardTime, { color: colors.textMuted }]}>
                            {formatTime(latestMsg.created_at)}
                          </Text>
                        ) : (
                          <Text style={[styles.cardTime, { color: colors.textMuted }]}>
                            {!isOffline && userLocation && member.coordinates
                              ? formatDistance(
                                  calculateDistanceMeters(userLocation, member.coordinates)
                                )
                              : ''}
                          </Text>
                        )}

                        <View style={styles.cardActionRow}>
                          {unread > 0 ? (
                            <View style={[styles.unreadBadge, { backgroundColor: colors.danger }]}>
                              <Text style={styles.unreadBadgeText}>{unread}</Text>
                            </View>
                          ) : (
                            <ChevronRight size={18} color={colors.textMuted} />
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE CHAT CONVERSATION (DETAIL VIEW)
  // =========================================================================
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isDark ? '#0B0F17' : colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Detail Header with Back Button to return to list - No radar icon */}
      <AppHeader
        title={
          selectedChannel === 'group'
            ? 'ENTIRE CREW'
            : (activeTargetMember?.name || 'MEMBER CHAT').toUpperCase()
        }
        subtitle={
          selectedChannel === 'group'
            ? `${activeTrip?.name || 'Active Trip'} • ${members.length} Members`
            : targetDistanceInfo
            ? targetDistanceInfo.isPaused
              ? 'Location Paused'
              : `Direct Chat • ${targetDistanceInfo.text}`
            : 'Direct 1:1 Chat'
        }
        showBack={true}
        onBack={() => {
          triggerLight();
          setSelectedChannel(null);
        }}
        rightComponent={
          activeTargetMember && !targetDistanceInfo?.isPaused ? (
            <TouchableOpacity
              style={[
                styles.headerWalkBtn,
                { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#E0F2FE' },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: '/features/navigation',
                  params: { memberId: activeTargetMember.id },
                });
              }}
            >
              <Navigation size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.headerWalkText, { color: colors.primary }]}>Navigate</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <KeyboardAvoidingView
        style={[styles.keyboardContainer, { backgroundColor: isDark ? '#0B0F17' : colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : isTab ? 68 : 20}
      >
        {/* Contextual Distance Strip (Only when chatting 1:1) */}
        {activeTargetMember && (
          <View
            style={[
              styles.locationStrip,
              {
                backgroundColor: isDark ? '#111827' : '#F1F5F9',
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.locationStripLeft}>
              <View
                style={[
                  styles.locationStripDot,
                  {
                    backgroundColor: targetDistanceInfo?.isPaused ? colors.warning : colors.success,
                  },
                ]}
              />
              <Text
                style={[styles.locationStripText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {targetDistanceInfo?.isPaused
                  ? `${activeTargetMember.name} has paused location`
                  : `${activeTargetMember.name} • ${targetDistanceInfo?.text}`}
              </Text>
            </View>

            {!targetDistanceInfo?.isPaused && activeTargetMember.coordinates && (
              <TouchableOpacity
                style={[styles.locationStripNavBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => {
                  router.push({
                    pathname: '/features/navigation',
                    params: { memberId: activeTargetMember.id },
                  });
                }}
              >
                <Navigation size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.locationStripNavText}>Walk Here</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Chat Message Stream */}
        <View
          style={[
            styles.messagesContainer,
            { backgroundColor: isDark ? '#0B0F17' : '#F8FAFC' },
          ]}
        >
          {filteredMessages.length === 0 ? (
            <View style={styles.emptyMessagesBox}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: isDark ? '#1E293B' : '#E0F2FE' },
                ]}
              >
                <Sparkles size={24} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {selectedChannel === 'group'
                  ? 'No crew messages yet'
                  : `Start a conversation with ${activeTargetMember?.name || 'them'}`}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
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
                        isMe
                          ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                          : [
                              styles.bubbleOther,
                              {
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                borderColor: isDark ? '#334155' : '#E2E8F0',
                              },
                            ],
                        item.message_type === 'sos' && styles.bubbleSos,
                      ]}
                    >
                      {!isMe && selectedChannel === 'group' && (
                        <Text style={[styles.bubbleSenderName, { color: colors.primary }]}>
                          {item.sender_name}
                        </Text>
                      )}

                      <Text
                        style={[
                          styles.bubbleContent,
                          isMe
                            ? styles.bubbleContentMe
                            : [styles.bubbleContentOther, { color: colors.textPrimary }],
                        ]}
                      >
                        {item.content}
                      </Text>

                      <Text
                        style={[
                          styles.bubbleTime,
                          isMe
                            ? styles.bubbleTimeMe
                            : [styles.bubbleTimeOther, { color: colors.textMuted }],
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

        {/* Quick Ping Chips */}
        <View
          style={[
            styles.quickPingsSection,
            {
              backgroundColor: isDark ? '#111827' : colors.surface,
              borderTopColor: isDark ? '#1F2937' : colors.border,
            },
          ]}
        >
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
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : colors.border,
                  },
                  item.type === 'sos' && styles.quickPingPillSos,
                ]}
                activeOpacity={0.7}
                onPress={() => handleQuickPing(item)}
              >
                <Text
                  style={[
                    styles.quickPingText,
                    { color: colors.textPrimary },
                    item.type === 'sos' && styles.quickPingTextSos,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: isDark ? '#111827' : colors.surface,
              borderTopColor: isDark ? '#1F2937' : colors.border,
              paddingBottom: isTab ? 10 : Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                color: colors.textPrimary,
                borderColor: isDark ? '#334155' : colors.border,
              },
            ]}
            placeholder={
              selectedChannel === 'group'
                ? 'Message Entire Crew...'
                : `Message ${activeTargetMember?.name?.split(' ')[0] || 'member'}...`
            }
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim()
                  ? colors.primary
                  : isDark
                  ? '#1E293B'
                  : '#E2E8F0',
              },
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Send
              size={18}
              color={inputText.trim() ? '#FFFFFF' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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

  // =========================================================================
  // CONVERSATIONS LIST STYLES
  // =========================================================================
  listScrollView: {
    flex: 1,
  },
  listScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  sectionHeaderRow: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // Pinned Group Card
  groupCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: 14,
    ...SHADOWS.sm,
  },
  groupAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pinnedTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  pinnedTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Members List Container & Cards
  membersListContainer: {
    gap: 8,
  },
  memberCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 12,
    ...SHADOWS.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
    minWidth: 44,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyListBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 13,
    textAlign: 'center',
  },

  // =========================================================================
  // DETAIL CONVERSATION VIEW STYLES
  // =========================================================================
  headerWalkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  headerWalkText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Location Strip
  locationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  locationStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  locationStripDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  locationStripText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationStripNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  locationStripNavText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Messages Stream
  messagesContainer: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    ...TYPOGRAPHY.bodySmall,
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
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleSos: {
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
    backgroundColor: '#FEF2F2',
  },
  bubbleSenderName: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  bubbleContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleContentMe: {
    color: '#FFFFFF',
  },
  bubbleContentOther: {
    color: COLORS.textPrimary,
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

  // Quick pings
  quickPingsSection: {
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  quickPingsScrollContent: {
    paddingHorizontal: 14,
  },
  quickPingPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: 8,
  },
  quickPingPillSos: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  quickPingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickPingTextSos: {
    color: '#DC2626',
    fontWeight: '700',
  },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 96,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    ...SHADOWS.sm,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});
