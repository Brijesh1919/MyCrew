// Meeting Point Service Abstraction
// Handles creating, listing, and calculating nearby members for meeting points

import { INITIAL_MEETING_POINTS } from '../data/mockData';
import { calculateDistanceMeters } from '../utils/distance';

class MeetingPointService {
  constructor() {
    this.meetingPoints = [...INITIAL_MEETING_POINTS];
  }

  getMeetingPoints() {
    return this.meetingPoints;
  }

  getMeetingPointById(id) {
    return this.meetingPoints.find((mp) => mp.id === id) || null;
  }

  createMeetingPoint({ name, description, createdBy, createdById, coordinates, radiusMeters = 500 }, members = []) {
    const nearbyCount = members.filter((m) => {
      const d = calculateDistanceMeters(coordinates, m.coordinates);
      return d <= radiusMeters;
    }).length;

    const newPoint = {
      id: `mp_${Date.now()}`,
      name: name.trim() || 'Regroup Point',
      description: description?.trim() || '',
      createdBy: createdBy || 'You',
      createdById: createdById || 'me',
      createdAt: new Date().toISOString(),
      coordinates,
      radiusMeters,
      nearbyCount: Math.max(1, nearbyCount),
    };

    this.meetingPoints = [newPoint, ...this.meetingPoints];
    return newPoint;
  }

  deleteMeetingPoint(id) {
    this.meetingPoints = this.meetingPoints.filter((mp) => mp.id !== id);
    return this.meetingPoints;
  }
}

export const meetingPointService = new MeetingPointService();
