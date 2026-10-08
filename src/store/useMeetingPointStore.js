import { create } from 'zustand';
import { meetingPointService } from '../services/meetingPointService';
import { analytics } from '../services/analyticsService';

export const useMeetingPointStore = create((set, get) => ({
  meetingPoints: meetingPointService.getMeetingPoints(),
  selectedMeetingPoint: null,
  showMeetingPointsOnMap: true,
  isLoading: false,

  setSelectedMeetingPoint: (point) => set({ selectedMeetingPoint: point }),
  toggleShowMeetingPoints: () => set((state) => ({ showMeetingPointsOnMap: !state.showMeetingPointsOnMap })),

  fetchTripMeetingPoints: async (tripId, members = []) => {
    set({ isLoading: true });
    try {
      const points = await meetingPointService.fetchMeetingPoints(tripId, members);
      set({ meetingPoints: [...points], isLoading: false });
      return points;
    } catch (e) {
      set({ isLoading: false });
      return get().meetingPoints;
    }
  },

  addMeetingPoint: async (pointData, members = []) => {
    const newPoint = await meetingPointService.createMeetingPoint(pointData, members);
    analytics.logMeetingPointSet(newPoint?.title || newPoint?.name || 'Meeting Point');
    set({
      meetingPoints: [...meetingPointService.getMeetingPoints()],
      selectedMeetingPoint: newPoint,
    });
    return newPoint;
  },

  deleteMeetingPoint: async (id) => {
    if (!id) return;
    // 1. Immediately remove from active state
    set((state) => ({
      meetingPoints: state.meetingPoints.filter((mp) => String(mp.id) !== String(id)),
      selectedMeetingPoint:
        String(state.selectedMeetingPoint?.id) === String(id) ? null : state.selectedMeetingPoint,
    }));
    // 2. Perform background delete
    await meetingPointService.deleteMeetingPoint(id);
    // 3. Sync state with service
    const updated = meetingPointService.getMeetingPoints();
    set({
      meetingPoints: [...updated],
    });
  },

  clearMeetingPoints: () => {
    meetingPointService.clearMeetingPoints();
    set({ meetingPoints: [], selectedMeetingPoint: null });
  },
}));
