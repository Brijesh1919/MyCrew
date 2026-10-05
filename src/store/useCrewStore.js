import { create } from 'zustand';
import { memberService } from '../services/memberService';
import { locationService } from '../services/locationService';

export const useCrewStore = create((set, get) => ({
  members: [], // Initial state is empty for a fresh app session with no active trip
  selectedMember: null,
  selectedCluster: null,
  searchQuery: '',
  activeFilter: 'all', // all | active | delayed | offline

  setMembers: (members) => set({ members }),
  loadDemoMembers: () => set({ members: memberService.getTripMembers() }),
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

  // Micro-jitter simulation (only if members exist)
  tickLocations: () => {
    const current = get().members;
    if (!current || current.length === 0) return;
    const drifted = locationService.simulateMemberDrift(current);
    set({ members: drifted });
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

  getStatusCounts: () => {
    const current = get().members || [];
    return memberService.getStatusCounts(current);
  },

  getClusters: () => {
    const current = get().members || [];
    if (current.length === 0) return [];
    return memberService.getClustersWithMembers(current);
  },
}));

