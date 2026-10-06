import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Map, Users, Compass, User } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useLocationEngine } from '../../src/hooks/useLocationEngine';

export default function TabLayout() {
  // Start GPS watch and Supabase Realtime synchronization across all tabs during active trip
  useLocationEngine();

  const insets = useSafeAreaInsets();
  const activeTrip = useTripStore((state) => state.activeTrip);
  const getStatusCounts = useCrewStore((state) => state.getStatusCounts);
  const counts = getStatusCounts();

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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: [
          styles.tabBar,
          {
            height: barHeight,
            paddingBottom: bottomInset,
          },
        ],
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Map size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          tabBarBadge: Boolean(activeTrip && counts.active > 0) ? counts.active : undefined,
          tabBarBadgeStyle: styles.badgeStyle,
          tabBarIcon: ({ color, focused }) => (
            <Users size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="trip"
        options={{
          title: 'Trip',
          tabBarIcon: ({ color, focused }) => (
            <Compass size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    paddingTop: 4,
    ...Platform.select({
      web: {
        boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.05)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
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
    fontWeight: '600',
    lineHeight: 13,
    marginTop: 1,
    marginBottom: 0,
    paddingBottom: 0,
  },
  badgeStyle: {
    backgroundColor: COLORS.success,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    lineHeight: 15,
  },
});

