import { create } from 'zustand';
import { meetingPointService } from '../services/meetingPointService';

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
    set({
      meetingPoints: [...meetingPointService.getMeetingPoints()],
      selectedMeetingPoint: newPoint,
    });
    return newPoint;
  },

  deleteMeetingPoint: async (id) => {
    await meetingPointService.deleteMeetingPoint(id);
    const updated = meetingPointService.getMeetingPoints();
    set({
      meetingPoints: [...updated],
      selectedMeetingPoint: get().selectedMeetingPoint?.id === id ? null : get().selectedMeetingPoint,
    });
  },

  clearMeetingPoints: () => {
    meetingPointService.clearMeetingPoints();
    set({ meetingPoints: [], selectedMeetingPoint: null });
  },

  loadDemoMeetingPoints: () => {
    const pts = meetingPointService.loadDemoMeetingPoints();
    set({ meetingPoints: [...pts] });
  },
}));
