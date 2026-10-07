import { create } from 'zustand';
import { memberService } from '../services/memberService';
import { locationService } from '../services/locationService';
import { getLocationFreshness } from '../utils/freshness';

export const useCrewStore = create((set, get) => ({
  members: [], // Initial state is empty for a fresh app session with no active trip
  selectedMember: null,
  selectedCluster: null,
  searchQuery: '',
  activeFilter: 'all', // all | active | delayed | offline

  setMembers: (members) => {
    // Ensure each member has properly evaluated freshness
    const withFreshness = (members || []).map((m) => {
      const freshness = m.location_updated_at
        ? getLocationFreshness(m.location_updated_at)
        : getLocationFreshness(m.lastSeenSecondsAgo || 0);
      return {
        ...m,
        status: freshness.state,
        freshness,
      };
    });
    set({ members: withFreshness });
  },

  loadDemoMembers: () => set({ members: memberService.getDemoMembers() }),

  clearMembers: () =>
    set({
      members: [],
      selectedMember: null,
      selectedCluster: null,
      searchQuery: '',
      activeFilter: 'all',
    }),

  setSelectedMember: (member) => set({ selectedMember: member }),
  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  /**
   * Updates or inserts a member's location from a Supabase Realtime event
   */
  updateMemberLocationFromRemote: (row) => {
    if (!row || !row.user_id) return;
    const current = get().members;

    // If member left, remove from list
    if (row.left_at) {
      set({ members: current.filter((m) => m.id !== row.user_id) });
      return;
    }

    const existingIndex = current.findIndex((m) => m.id === row.user_id);
    const freshness = getLocationFreshness(row.location_updated_at);

    const hasValidCoords =
      row.latitude !== null &&
      row.longitude !== null &&
      !isNaN(Number(row.latitude)) &&
      !isNaN(Number(row.longitude)) &&
      Number(row.latitude) >= -90 &&
      Number(row.latitude) <= 90 &&
      Number(row.longitude) >= -180 &&
      Number(row.longitude) <= 180;

    const coordinates = hasValidCoords
      ? {
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          accuracy: row.location_accuracy ? Number(row.location_accuracy) : null,
          heading: row.location_heading ? Number(row.location_heading) : null,
          speed: row.location_speed ? Number(row.location_speed) : null,
        }
      : existingIndex >= 0
      ? current[existingIndex].coordinates
      : null;

    const updatedMember = {
      id: row.user_id,
      name: row.user_name || (existingIndex >= 0 ? current[existingIndex].name : 'Crew Member'),
      avatar: row.avatar_url || (existingIndex >= 0 ? current[existingIndex].avatar : null),
      role: row.role || 'participant',
      status: freshness.state,
      freshness,
      lastSeenSecondsAgo: row.location_updated_at
        ? Math.max(0, Math.round((Date.now() - new Date(row.location_updated_at).getTime()) / 1000))
        : 0,
      location_updated_at: row.location_updated_at,
      coordinates,
      isSafe: true,
      cluster: 'Active Crew',
    };

    if (existingIndex >= 0) {
      const nextMembers = [...current];
      nextMembers[existingIndex] = {
        ...nextMembers[existingIndex],
        ...updatedMember,
      };
      set({ members: nextMembers });
    } else {
      set({ members: [...current, updatedMember] });
    }
  },

  /**
   * Recalculates freshness state for all members (called periodically)
   */
  refreshFreshness: () => {
    const current = get().members;
    if (!current || current.length === 0) return;

    let changed = false;
    const updated = current.map((m) => {
      if (!m.location_updated_at) return m;
      const freshness = getLocationFreshness(m.location_updated_at);
      if (freshness.state !== m.status) {
        changed = true;
        return {
          ...m,
          status: freshness.state,
          freshness,
          lastSeenSecondsAgo: Math.max(
            0,
            Math.round((Date.now() - new Date(m.location_updated_at).getTime()) / 1000)
          ),
        };
      }
      return m;
    });

    if (changed) {
      set({ members: updated });
    }
  },

  toggleMemberSafety: (memberId, isSafe) => {
    const updated = memberService.toggleMemberSafety(memberId, isSafe);
    set({ members: [...updated] });
  },

  addMember: (memberData) => {
    const newMember = memberService.addMember(memberData);
    set({ members: [newMember, ...get().members] });
    return newMember;
  },

  updateCurrentUserLocation: (userId, loc) => {
    if (!userId || !loc) return;
    const current = get().members;
    const existingIndex = current.findIndex((m) => m.id === userId || m.id === 'user');
    if (existingIndex < 0) return;
    const nowIso = new Date().toISOString();
    const freshness = getLocationFreshness(nowIso);
    const nextMembers = [...current];
    nextMembers[existingIndex] = {
      ...nextMembers[existingIndex],
      coordinates: {
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
        accuracy: loc.accuracy ? Number(loc.accuracy) : null,
        heading: loc.heading ? Number(loc.heading) : null,
        speed: loc.speed ? Number(loc.speed) : null,
      },
      location_updated_at: nowIso,
      status: 'live',
      freshness,
      lastSeenSecondsAgo: 0,
    };
    set({ members: nextMembers });
  },

  setUserLocationSharingState: (userId, isSharing) => {
    if (!userId) return;
    const current = get().members;
    const existingIndex = current.findIndex((m) => m.id === userId || m.id === 'user');
    if (existingIndex < 0) return;
    const nextMembers = [...current];
    nextMembers[existingIndex] = {
      ...nextMembers[existingIndex],
      status: isSharing ? 'live' : 'offline',
      freshness: isSharing
        ? getLocationFreshness(new Date().toISOString())
        : {
            state: 'offline',
            label: 'Offline • Sharing Paused',
            shortLabel: 'Offline',
            timeText: 'Sharing off',
            color: '#94A3B8',
            bgColor: '#F1F5F9',
            dot: '⚪',
          },
      coordinates: isSharing ? nextMembers[existingIndex].coordinates : null,
      location_updated_at: isSharing ? new Date().toISOString() : null,
    };
    set({ members: nextMembers });
  },

  getStatusCounts: () => {
    const current = get().members || [];
    let active = 0;
    let delayed = 0;
    let offline = 0;

    current.forEach((m) => {
      const freshness = m.location_updated_at
        ? getLocationFreshness(m.location_updated_at)
        : m.freshness || { state: m.status || 'live' };

      if (freshness.state === 'live') active++;
      else if (freshness.state === 'delayed') delayed++;
      else offline++;
    });

    return {
      active,
      delayed,
      offline,
      total: current.length,
      online: active + delayed,
    };
  },

  getClusters: (excludeUserId = null) => {
    const current = get().members || [];
    if (current.length === 0) return [];
    const targetMembers = excludeUserId
      ? current.filter((m) => m.id !== excludeUserId && m.id !== 'user')
      : current;
    // Dynamic clustering based on real distance between member coordinates
    return locationService.getClusters(targetMembers, 80);
  },
}));

