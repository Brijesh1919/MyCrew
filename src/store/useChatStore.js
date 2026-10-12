// ==========================================================
// MyCrew - Chat Zustand Store
// Manages active channel (Group vs. 1:1 Member), messages, and unread counts
// ==========================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { chatService } from '../services/chatService';
import { useUserStore } from './useUserStore';

const LAST_READ_STORAGE_PREFIX = '@mycrew_chat_last_read_';

const getLastReadTimestamps = async (tripId, userId) => {
  if (!tripId || !userId) return {};
  try {
    const raw = await AsyncStorage.getItem(`${LAST_READ_STORAGE_PREFIX}${tripId}_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveLastReadTimestamp = async (tripId, userId, channelId) => {
  if (!tripId || !userId || !channelId) return;
  try {
    const current = await getLastReadTimestamps(tripId, userId);
    current[channelId] = new Date().toISOString();
    await AsyncStorage.setItem(
      `${LAST_READ_STORAGE_PREFIX}${tripId}_${userId}`,
      JSON.stringify(current)
    );
  } catch (e) {
    // ignore
  }
};

export const useChatStore = create((set, get) => ({
  messages: [],
  activeChannel: 'group', // 'group' or memberId
  unreadCounts: { group: 0 },
  currentTripId: null,
  currentUserId: null,
  isChatScreenOpen: false,
  isLoading: false,

  setChatScreenOpen: (isOpen) => {
    set((state) => {
      const updates = { isChatScreenOpen: isOpen };
      if (isOpen) {
        if (state.currentTripId && state.currentUserId) {
          saveLastReadTimestamp(state.currentTripId, state.currentUserId, state.activeChannel);
        }
        updates.unreadCounts = {
          ...state.unreadCounts,
          [state.activeChannel]: 0,
        };
      }
      return updates;
    });
  },

  setActiveChannel: (channelId) => {
    const { currentTripId, currentUserId } = get();
    if (currentTripId && currentUserId) {
      saveLastReadTimestamp(currentTripId, currentUserId, channelId);
    }
    set((state) => ({
      activeChannel: channelId,
      unreadCounts: {
        ...state.unreadCounts,
        [channelId]: 0,
      },
    }));
  },

  fetchTripMessages: async (tripId, currentUserId) => {
    if (!tripId) return [];
    const myId = String(
      currentUserId || useUserStore.getState().currentUser?.id || ''
    );
    set({ isLoading: true, currentTripId: tripId, currentUserId: myId });

    try {
      const allMessages = await chatService.fetchMessages(tripId);

      // Keep group messages OR direct messages where current user is sender or recipient
      const relevantMessages = (allMessages || []).filter((m) => {
        if (!m.recipient_id) return true; // Group message for all crew
        return String(m.sender_id) === myId || String(m.recipient_id) === myId;
      });

      // Calculate unread counts by comparing with persisted lastRead timestamps
      const lastReadMap = await getLastReadTimestamps(tripId, myId);
      const unreads = { group: 0 };

      for (const m of relevantMessages) {
        // Own messages are never unread
        if (String(m.sender_id) === myId) continue;

        const channel = m.recipient_id ? String(m.sender_id) : 'group';

        // If the channel is currently actively open on screen, skip counting as unread
        if (get().isChatScreenOpen && get().activeChannel === channel) {
          continue;
        }

        const lastRead = lastReadMap[channel];
        // If message was created after the last time this channel was viewed, or never opened:
        if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
          unreads[channel] = (unreads[channel] || 0) + 1;
        }
      }

      set({ messages: relevantMessages, unreadCounts: unreads, isLoading: false });
      return relevantMessages;
    } catch (e) {
      set({ isLoading: false });
      return get().messages;
    }
  },

  sendMessage: async ({
    tripId,
    senderId,
    senderName,
    senderAvatar,
    recipientId = null,
    content,
    messageType = 'text',
  }) => {
    if (!content?.trim()) return null;

    // Optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      trip_id: tripId,
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      recipient_id: recipientId,
      content: content.trim(),
      message_type: messageType,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticMsg],
    }));

    try {
      const savedMsg = await chatService.sendMessage({
        tripId,
        senderId,
        senderName,
        senderAvatar,
        recipientId,
        content,
        messageType,
      });

      if (savedMsg && savedMsg.id !== tempId) {
        set((state) => ({
          messages: state.messages.map((m) => (m.id === tempId ? savedMsg : m)),
        }));
      }
      return savedMsg;
    } catch (err) {
      console.warn('[useChatStore] Send message failed:', err);
      return optimisticMsg;
    }
  },

  addIncomingMessage: (msg, currentUserId) => {
    if (!msg || !msg.id) return;

    const myId = String(
      currentUserId || useUserStore.getState().currentUser?.id || ''
    );

    // CRITICAL: If this is a direct 1:1 message, it is ONLY meant for the sender and recipient!
    if (msg.recipient_id) {
      const isSender = String(msg.sender_id) === myId;
      const isRecipient = String(msg.recipient_id) === myId;

      // Uninvolved crew members must ignore completely
      if (!isSender && !isRecipient) {
        return;
      }
    }

    set((state) => {
      // Prevent duplicates
      const exists = state.messages.some((m) => m.id === msg.id);
      if (exists) return state;

      const isMyMessage = String(msg.sender_id) === myId;
      const targetChannel = msg.recipient_id
        ? (isMyMessage ? String(msg.recipient_id) : String(msg.sender_id))
        : 'group';
      const isCurrentlyOpen = state.isChatScreenOpen && (state.activeChannel === targetChannel);

      const newUnreads = { ...state.unreadCounts };
      if (!isMyMessage) {
        if (isCurrentlyOpen) {
          if (state.currentTripId && myId) {
            saveLastReadTimestamp(state.currentTripId, myId, targetChannel);
          }
        } else {
          newUnreads[targetChannel] = (newUnreads[targetChannel] || 0) + 1;
        }
      }

      return {
        messages: [...state.messages, msg],
        unreadCounts: newUnreads,
      };
    });
  },

  initRealtime: (tripId, currentUserId) => {
    if (!tripId) return;
    const myId = currentUserId || useUserStore.getState().currentUser?.id;
    set({ currentTripId: tripId, currentUserId: myId });
    chatService.subscribeToTrip(tripId, (newMsg) => {
      get().addIncomingMessage(newMsg, myId);
    });
  },

  cleanupRealtime: () => {
    chatService.unsubscribe();
  },

  clearChat: () => {
    chatService.unsubscribe();
    set({ messages: [], activeChannel: 'group', unreadCounts: { group: 0 } });
  },

  getUnreadTotal: () => {
    const unreads = get().unreadCounts;
    return Object.values(unreads || {}).reduce((sum, count) => sum + (count || 0), 0);
  },
}));
