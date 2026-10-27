import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Map, Users, MapPin, Menu, Home, MessageSquare, Compass } from 'lucide-react-native';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useMeetingPointStore } from '../../src/store/useMeetingPointStore';
import { useChatStore } from '../../src/store/useChatStore';
import { useLocationEngine } from '../../src/hooks/useLocationEngine';
import { useThemeStore } from '../../src/store/useThemeStore';

export default function TabLayout() {
  // Start GPS watch and Supabase Realtime synchronization across all tabs during active trip
  useLocationEngine();

  const insets = useSafeAreaInsets();
  const activeTrip = useTripStore((state) => state.activeTrip);
  const getStatusCounts = useCrewStore((state) => state.getStatusCounts);
  const counts = getStatusCounts();
  const meetingPoints = useMeetingPointStore((state) => state.meetingPoints);

  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  // Responsive safe-area bottom height
  const bottomInset = Platform.OS === 'ios'
    ? Math.max(insets.bottom, 12)
    : Platform.OS === 'web'
      ? 6
      : Math.max(insets.bottom, 6);

  const barHeight = Platform.select({
    ios: 60 + bottomInset,
    android: 68 + (insets.bottom > 0 ? insets.bottom : 0),
    web: 70,
    default: 70,
  });

  const unreadCounts = useChatStore((state) => state.unreadCounts) || {};
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + (typeof n === 'number' ? n : 0), 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: barHeight,
            paddingBottom: bottomInset,
          },
        ],
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* 1. Map Canvas (Home / Active Radar) */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Map size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />

      {/* 2. People (Proximity-sorted crew list) */}
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          tabBarBadge: Boolean(activeTrip && counts.active > 0) ? counts.active : undefined,
          tabBarBadgeStyle: [styles.badgeStyle, { backgroundColor: colors.primary }],
          tabBarIcon: ({ color, focused }) => (
            <Users size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />

      {/* 3. Meet (Dedicated Rendezvous & Rally Points) */}
      <Tabs.Screen
        name="meet"
        options={{
          title: 'Meet',
          tabBarBadge: Boolean(activeTrip && meetingPoints?.length > 0) ? meetingPoints.length : undefined,
          tabBarBadgeStyle: [styles.badgeStyle, { backgroundColor: colors.primary }],
          tabBarIcon: ({ color, focused }) => (
            <MapPin size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />

      {/* 4. Chat (Crew Real-time Group & 1:1 Messages) */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: [styles.badgeStyle, { backgroundColor: colors.danger }],
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />

      {/* 5. Menu (Settings, Profile, Theme Toggle & Trip Controls) */}
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <Menu size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />

      {/* Hidden routable tabs */}
      <Tabs.Screen
        name="map"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="trip"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 4,
    ...Platform.select({
      web: {
        boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },
  tabItem: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  tabIcon: {
    marginTop: 2,
    marginBottom: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
    marginTop: 1,
    marginBottom: 0,
    paddingBottom: 0,
  },
  badgeStyle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    lineHeight: 15,
  },
});
