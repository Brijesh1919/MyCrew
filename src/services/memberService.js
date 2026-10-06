// Member Service Abstraction
// Manages crew members, presence, status filters, and cluster assignments

import { INITIAL_MEMBERS, CLUSTERS_DEFINITIONS } from '../data/mockData';
import { getLocationFreshness } from '../utils/freshness';
import { calculateDistanceMeters } from '../utils/distance';

class MemberService {
  constructor() {
    this.members = [];
    this.clusters = [...CLUSTERS_DEFINITIONS];
  }

  getTripMembers() {
    return this.members;
  }

  getDemoMembers() {
    return [...INITIAL_MEMBERS];
  }

  getMemberById(id) {
    return this.members.find((m) => m.id === id) || null;
  }

  /**
   * Filter members by tab (all, active, delayed, offline) and search query
   */
  filterMembers(members, filterType = 'all', searchQuery = '') {
    return members.filter((member) => {
      // Search matching
      const matchesSearch =
        !searchQuery ||
        member.name.toLowerCase().includes(searchQuery.trim().toLowerCase());

      if (!matchesSearch) return false;

      // Status tab matching
      if (filterType === 'all') return true;
      if (filterType === 'active') return member.status === 'live';
      if (filterType === 'delayed') return member.status === 'delayed';
      if (filterType === 'offline') return member.status === 'offline';
      return true;
    });
  }

  /**
   * Returns counts of members by status
   */
  getStatusCounts(members) {
    let active = 0;
    let delayed = 0;
    let offline = 0;

    members.forEach((m) => {
      if (m.status === 'live') active++;
      else if (m.status === 'delayed') delayed++;
      else if (m.status === 'offline') offline++;
    });

    return {
      active,
      delayed,
      offline,
      total: members.length,
      online: active + delayed,
    };
  }

  /**
   * Returns clusters with their member objects
   */
  getClustersWithMembers(members) {
    return this.clusters.map((c) => {
      const clusterMembers = members.filter((m) => c.memberIds.includes(m.id));
      return {
        ...c,
        count: clusterMembers.length,
        members: clusterMembers,
      };
    });
  }

  /**
   * Updates a member's safe check-in state
   */
  toggleMemberSafety(memberId, isSafe) {
    this.members = this.members.map((m) =>
      m.id === memberId ? { ...m, isSafe } : m
    );
    return this.members;
  }

  /**
   * Adds a new participant
   */
  addMember(memberData) {
    const newMember = {
      id: `m_${Date.now()}`,
      name: memberData.name,
      avatar: memberData.avatar || null,
      phone: memberData.phone || '',
      status: 'live',
      lastSeenSecondsAgo: 2,
      battery: 95,
      isSafe: true,
      cluster: 'Main Stage',
      coordinates: memberData.coordinates || {
        latitude: 15.5899 + (Math.random() - 0.5) * 0.001,
        longitude: 73.7439 + (Math.random() - 0.5) * 0.001,
        heading: 0,
      },
    };
    this.members = [newMember, ...this.members];
    return newMember;
  }
}

export const memberService = new MemberService();
