import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, HelpCircle, Check, RotateCcw } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { useUserStore } from '../../src/store/useUserStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function CheckInScreen() {
  const { triggerSuccess, triggerLight } = useHapticFeedback();

  const currentUser = useUserStore((state) => state.currentUser);
  const toggleSafeCheckIn = useUserStore((state) => state.toggleSafeCheckIn);
  const members = useCrewStore((state) => state.members);

  const handleToggle = () => {
    triggerSuccess();
    toggleSafeCheckIn();
  };

  const isSafe = currentUser?.isSafe ?? true;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Safety Check-In"
        subtitle="Let your crew know you're alright"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CURRENT USER STATUS CARD */}
        <View style={[styles.heroCard, isSafe ? styles.heroCardSafe : styles.heroCardUnchecked]}>
          <View style={[styles.heroIconBubble, isSafe ? styles.bubbleSafe : styles.bubbleUnchecked]}>
            {isSafe ? (
              <ShieldCheck size={36} color={COLORS.white} />
            ) : (
              <HelpCircle size={36} color={COLORS.warning} />
            )}
          </View>

          <Text style={styles.heroTitle}>
            {isSafe ? "You're checked in as Safe" : 'Safety status not updated'}
          </Text>
          <Text style={styles.heroSub}>
            {isSafe
              ? 'Your whole crew can see that you are safe and sound.'
              : 'Tap below to broadcast to your group that you are okay.'}
          </Text>

          <PrimaryButton
            title={isSafe ? 'Change Status to "Need Help"' : "I'm Safe"}
            onPress={handleToggle}
            variant={isSafe ? 'dark' : 'success'}
            size="lg"
            style={{ marginTop: 14 }}
          />
        </View>

        {/* CREW MEMBERS SAFETY LIST */}
        <Text style={styles.sectionHeading}>CREW SAFETY STATUS</Text>

        {members.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 }}>
            <Text style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary }}>No other members in this trip yet</Text>
          </View>
        ) : (
          members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <MemberAvatar
                uri={member.avatar}
                name={member.name}
                size="md"
                status={member.status}
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberSub}>
                  {member.status === 'live' ? 'Live on map' : 'Location delayed'}
                </Text>
              </View>

              {member.isSafe ? (
                <View style={styles.safeTag}>
                  <Check size={14} color={COLORS.success} />
                  <Text style={styles.safeTagText}>Safe</Text>
                </View>
              ) : (
                <View style={styles.pendingTag}>
                  <Text style={styles.pendingTagText}>No response</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 24,
    ...SHADOWS.md,
  },
  heroCardSafe: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  heroCardUnchecked: {
    borderColor: '#CBD5E1',
  },
  heroIconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  bubbleSafe: {
    backgroundColor: COLORS.success,
  },
  bubbleUnchecked: {
    backgroundColor: COLORS.warningBg,
  },
  heroTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSub: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  sectionHeading: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  memberSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  safeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  safeTagText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  pendingTag: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  pendingTagText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
});
