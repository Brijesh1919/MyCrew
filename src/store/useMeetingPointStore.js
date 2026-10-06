import { create } from 'zustand';
import { meetingPointService } from '../services/meetingPointService';

export const useMeetingPointStore = create((set, get) => ({
  meetingPoints: meetingPointService.getMeetingPoints(),
  selectedMeetingPoint: null,
  showMeetingPointsOnMap: true,

  setSelectedMeetingPoint: (point) => set({ selectedMeetingPoint: point }),
  toggleShowMeetingPoints: () => set((state) => ({ showMeetingPointsOnMap: !state.showMeetingPointsOnMap })),

  addMeetingPoint: (pointData, members = []) => {
    const newPoint = meetingPointService.createMeetingPoint(pointData, members);
    set({
      meetingPoints: [...meetingPointService.getMeetingPoints()],
      selectedMeetingPoint: newPoint,
    });
    return newPoint;
  },

  deleteMeetingPoint: (id) => {
    meetingPointService.deleteMeetingPoint(id);
    set({ meetingPoints: [...meetingPointService.getMeetingPoints()] });
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
