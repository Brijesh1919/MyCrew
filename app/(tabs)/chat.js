import React, { useCallback } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import ChatScreen from '../features/chat';
import { useChatStore } from '../../src/store/useChatStore';

export default function ChatTab() {
  const params = useLocalSearchParams();

  useFocusEffect(
    useCallback(() => {
      useChatStore.getState().setChatScreenOpen(true);
      return () => {
        useChatStore.getState().setChatScreenOpen(false);
      };
    }, [])
  );

  return <ChatScreen isTab={true} initialMemberId={params?.memberId} />;
}
