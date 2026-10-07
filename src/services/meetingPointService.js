// Meeting Point Service Abstraction
// Handles creating, listing, and calculating nearby members for meeting points
// Synchronized with Supabase public.meeting_points table

import { supabase } from './supabase';
import { INITIAL_MEETING_POINTS } from '../data/mockData';
import { calculateDistanceMeters } from '../utils/distance';

class MeetingPointService {
  constructor() {
    this.meetingPoints = [];
  }

  getMeetingPoints() {
    return this.meetingPoints;
  }

  loadDemoMeetingPoints() {
    this.meetingPoints = [...INITIAL_MEETING_POINTS];
    return this.meetingPoints;
  }

  clearMeetingPoints() {
    this.meetingPoints = [];
    return this.meetingPoints;
  }

  getMeetingPointById(id) {
    return this.meetingPoints.find((mp) => mp.id === id) || null;
  }

  formatDbRow(row, members = []) {
    if (!row) return null;
    const coords = {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    };

    const nearbyCount = (members || []).filter((m) => {
      if (!m.coordinates) return false;
      const d = calculateDistanceMeters(coords, m.coordinates);
      return d <= (row.radius_meters || 500);
    }).length;

    return {
      id: row.id,
      tripId: row.trip_id,
      name: row.name,
      description: row.description || '',
      createdBy: row.created_by_name || 'Crew Member',
      createdById: row.created_by || null,
      createdAt: row.created_at,
      coordinates: coords,
      radiusMeters: row.radius_meters || 500,
      nearbyCount: Math.max(1, nearbyCount),
    };
  }

  /**
   * Fetches meeting points for a trip from Supabase
   */
  async fetchMeetingPoints(tripId, members = []) {
    if (!tripId || String(tripId).startsWith('trip_goa') || tripId === 'demo') {
      return this.meetingPoints.length > 0 ? this.meetingPoints : this.loadDemoMeetingPoints();
    }

    try {
      const { data, error } = await supabase
        .from('meeting_points')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('fetchMeetingPoints Supabase error:', error.message);
        return this.meetingPoints;
      }

      const formatted = (data || []).map((row) => this.formatDbRow(row, members));
      this.meetingPoints = formatted;
      return formatted;
    } catch (err) {
      console.warn('fetchMeetingPoints exception:', err);
      return this.meetingPoints;
    }
  }

  /**
   * Creates a meeting point in Supabase and local store
   */
  async createMeetingPoint(
    { tripId, name, description, createdBy, createdById, coordinates, radiusMeters = 500 },
    members = []
  ) {
    const nearbyCount = members.filter((m) => {
      if (!m.coordinates) return false;
      const d = calculateDistanceMeters(coordinates, m.coordinates);
      return d <= radiusMeters;
    }).length;

    // Fallback/local point
    const localPoint = {
      id: `mp_${Date.now()}`,
      tripId: tripId || null,
      name: name.trim() || 'Regroup Point',
      description: description?.trim() || '',
      createdBy: createdBy || 'You',
      createdById: createdById || 'me',
      createdAt: new Date().toISOString(),
      coordinates,
      radiusMeters,
      nearbyCount: Math.max(1, nearbyCount),
    };

    if (tripId && !String(tripId).startsWith('trip_goa') && tripId !== 'demo') {
      try {
        const payload = {
          trip_id: tripId,
          name: name.trim() || 'Regroup Point',
          description: description?.trim() || null,
          created_by: createdById && createdById !== 'me' ? createdById : null,
          created_by_name: createdBy || 'You',
          latitude: Number(coordinates.latitude),
          longitude: Number(coordinates.longitude),
          radius_meters: radiusMeters,
        };

        const { data, error } = await supabase
          .from('meeting_points')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          const dbPoint = this.formatDbRow(data, members);
          this.meetingPoints = [dbPoint, ...this.meetingPoints.filter((p) => p.id !== localPoint.id)];
          return dbPoint;
        } else {
          console.warn('createMeetingPoint Supabase insert error:', error?.message);
        }
      } catch (err) {
        console.warn('createMeetingPoint exception:', err);
      }
    }

    this.meetingPoints = [localPoint, ...this.meetingPoints];
    return localPoint;
  }

  /**
   * Deletes a meeting point from Supabase and local store
   */
  async deleteMeetingPoint(id) {
    if (!id) return;

    // Optimistically update local array
    this.meetingPoints = this.meetingPoints.filter((mp) => mp.id !== id);

    // If it's a UUID, delete from Supabase
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      try {
        const { error } = await supabase
          .from('meeting_points')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('deleteMeetingPoint Supabase error:', error.message);
        }
      } catch (err) {
        console.warn('deleteMeetingPoint exception:', err);
      }
    }

    return this.meetingPoints;
  }
}

export const meetingPointService = new MeetingPointService();
