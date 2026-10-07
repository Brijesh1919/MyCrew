import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { COLORS, TYPOGRAPHY } from '../../src/constants/theme';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    let isMounted = true;

    const completeAuth = async () => {
      try {
        if (params?.code) {
          await supabase.auth.exchangeCodeForSession(String(params.code));
        } else if (params?.access_token && params?.refresh_token) {
          await supabase.auth.setSession({
            access_token: String(params.access_token),
            refresh_token: String(params.refresh_token),
          });
        } else {
          // Wait briefly for Supabase auth listener to finalize session
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        if (!isMounted) return;

        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)');
        }
      } catch (e) {
        if (isMounted) {
          router.replace('/(auth)');
        }
      }
    };

    completeAuth();

    return () => {
      isMounted = false;
    };
  }, [params?.code, params?.access_token, params?.refresh_token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.title}>Signing you in...</Text>
      <Text style={styles.subtitle}>Connecting with Google</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    marginTop: 20,
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
