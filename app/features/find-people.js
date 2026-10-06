import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Navigation, MapPin } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { MapView } from '../../src/components/MapView';
import { MemberCard } from '../../src/components/MemberCard';
import { BottomSheet } from '../../src/components/BottomSheet';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useMeetingPointStore } from '../../src/store/useMeetingPointStore';
import { locationService } from '../../src/services/locationService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FindPeopleScreen() {
  const router = useRouter();

  // Stores
  const members = useCrewStore((state) => state.members);
  const getClusters = useCrewStore((state) => state.getClusters);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const meetingPoints = useMeetingPointStore((state) => state.meetingPoints);

  const [selectedPerson, setSelectedPerson] = useState(null);

  // Sorted nearest members
  const nearestMembers = locationService.getNearestMembers(userLocation, members);
  const clusters = getClusters();

  const handleSelectMember = (member) => {
    setSelectedPerson(member);
  };

  const handleNavigateTo = (member) => {
    setSelectedMember(member);
    setSelectedPerson(null);
    router.push({
      pathname: '/features/navigation',
      params: { memberId: member.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Find My People"
        subtitle="Here's where your crew is."
        showBack={true}
      />

      <View style={styles.container}>
        {/* Top Interactive Map */}
        <View style={styles.mapContainer}>
          <MapView
            userLocation={userLocation}
            members={members}
            clusters={clusters}
            meetingPoints={meetingPoints}
            onSelectMember={(m) => handleSelectMember(m)}
            height={SCREEN_HEIGHT * 0.38}
            interactive={true}
            showClusters={true}
          />
        </View>

        {/* Bottom Sheet List: NEAREST TO YOU */}
        <View style={styles.sheetSection}>
          <View style={styles.sheetHeader}>
            <View style={styles.handle} />
            <View style={styles.titleRow}>
              <Text style={styles.sheetTitle}>NEAREST TO YOU</Text>
              <Text style={styles.countText}>{nearestMembers.length} nearby</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {nearestMembers.length > 0 ? (
              nearestMembers.map((member, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  distanceMeters={member.distanceMeters}
                  isHighlighted={index === 0}
                  onPress={handleSelectMember}
                />
              ))
            ) : (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ ...TYPOGRAPHY.bodySecondary, color: COLORS.textSecondary, textAlign: 'center' }}>
                  {!userLocation
                    ? 'Acquiring GPS coordinates for your device…'
                    : 'No crew members with location shared yet.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* PERSON DETAIL BOTTOM SHEET */}
      <BottomSheet
        visible={Boolean(selectedPerson)}
        onClose={() => setSelectedPerson(null)}
        title={selectedPerson?.name?.toUpperCase()}
        subtitle={selectedPerson ? `${selectedPerson.distanceMeters} m away` : ''}
      >
        {selectedPerson && (
          <View>
            <Text style={styles.personSub}>
              Last updated {selectedPerson.freshness?.timeText || 'recently'}
            </Text>

            <PrimaryButton
              title={`Walk to ${selectedPerson.name}`}
              onPress={() => handleNavigateTo(selectedPerson)}
              icon={Navigation}
              size="lg"
              style={{ marginTop: 12 }}
            />
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  mapContainer: {
    backgroundColor: '#0F172A',
  },
  sheetSection: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    marginTop: -16,
    ...SHADOWS.lg,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 10,
  },
  titleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    fontSize: 12,
  },
  countText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  personSub: {
    ...TYPOGRAPHY.bodySecondary,
    marginBottom: 8,
  },
});
