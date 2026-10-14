import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import ChatScreen from '../features/chat';
import { useChatStore } from '../../src/store/useChatStore';

export default function ChatTab() {
  useFocusEffect(
    useCallback(() => {
      useChatStore.getState().setChatScreenOpen(true);
      return () => {
        useChatStore.getState().setChatScreenOpen(false);
      };
    }, [])
  );

  return <ChatScreen isTab={true} />;
}

