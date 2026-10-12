// ==========================================================
// MyCrew - Chat & Direct Messaging Service
// Realtime sync via Supabase trip_messages table with offline cache
// ==========================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CHAT_STORAGE_PREFIX = '@mycrew_chat_v1_';

class ChatService {
  constructor() {
    this.activeChannel = null;
  }

  /**
   * Retrieves cached messages from local storage
   */
  async getCachedMessages(tripId) {
    if (!tripId) return [];
    try {
      const raw = await AsyncStorage.getItem(`${CHAT_STORAGE_PREFIX}${tripId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('[ChatService] Error reading local chat cache:', e);
      return [];
    }
  }

  /**
   * Persists message array to local storage
   */
  async persistMessages(tripId, messages) {
    if (!tripId || !Array.isArray(messages)) return;
    try {
      await AsyncStorage.setItem(
        `${CHAT_STORAGE_PREFIX}${tripId}`,
        JSON.stringify(messages.slice(-200)) // Keep latest 200 messages locally
      );
    } catch (e) {
      console.warn('[ChatService] Error persisting chat messages:', e);
    }
  }

  /**
   * Fetches messages from Supabase for a trip
   */
  async fetchMessages(tripId) {
    if (!tripId) return [];

    try {
      const { data, error } = await supabase
        .from('trip_messages')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) {
        console.warn('[ChatService] Supabase fetch error, fallback to cache:', error);
        return await this.getCachedMessages(tripId);
      }

      if (data) {
        await this.persistMessages(tripId, data);
        return data;
      }
      return [];
    } catch (err) {
      console.warn('[ChatService] fetchMessages exception:', err);
      return await this.getCachedMessages(tripId);
    }
  }

  /**
   * Sends a new message (Group or Direct 1:1)
   */
  async sendMessage({
    tripId,
    senderId,
    senderName,
    senderAvatar,
    recipientId = null,
    content,
    messageType = 'text',
  }) {
    if (!tripId || !senderId || !content?.trim()) {
      throw new Error('Missing required message parameters');
    }

    const payload = {
      trip_id: tripId,
      sender_id: senderId,
      sender_name: senderName || 'Crew Member',
      sender_avatar: senderAvatar || null,
      recipient_id: recipientId || null,
      content: content.trim(),
      message_type: messageType,
    };

    try {
      const { data, error } = await supabase
        .from('trip_messages')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('[ChatService] Send error in Supabase:', error);
        // Fallback optimistic message
        const optimistic = {
          id: `local_${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
        };
        return optimistic;
      }

      return data;
    } catch (err) {
      console.warn('[ChatService] Send exception:', err);
      const optimistic = {
        id: `local_${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
      };
      return optimistic;
    }
  }

  /**
   * Subscribes to realtime inserts for this trip's messages
   */
  subscribeToTrip(tripId, onNewMessage) {
    if (!tripId) return null;

    if (this.activeChannel) {
      try {
        supabase.removeChannel(this.activeChannel);
      } catch (e) {
        // ignore
      }
      this.activeChannel = null;
    }

    const channelName = `trip-chat-${tripId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload?.new && typeof onNewMessage === 'function') {
            onNewMessage(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected
        }
      });

    this.activeChannel = channel;
    return channel;
  }

  /**
   * Unsubscribes from active realtime channel
   */
  unsubscribe() {
    if (this.activeChannel) {
      try {
        supabase.removeChannel(this.activeChannel);
      } catch (e) {
        // ignore
      }
      this.activeChannel = null;
    }
  }
}

export const chatService = new ChatService();
