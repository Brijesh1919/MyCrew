// ==========================================================
// MyCrew - Trip Service (Supabase Backed)
// Authoritative source of truth for Trips and Trip Members
// ==========================================================

import { supabase } from './supabase';
import { INITIAL_TRIP } from '../data/mockData';
import { generateTripCode } from '../utils/helpers';
import { getTripTypeConfig } from '../constants/tripTypes';
import { getTripStatus } from '../utils/tripStatus';
import { calculateDistanceMeters } from '../utils/distance';

// Predefined demo/testing codes that activate the Goa Music Festival mock trip
export const DEMO_TRIP_CODES = ['GOA7K2', 'GOA2026'];

class TripService {
  constructor() {
    this.activeTrip = null;
    this.lastLocationWriteTime = 0;
    this.lastSentLocation = null;
    this.locationChannel = null;
  }

  getActiveTrip() {
    return this.activeTrip;
  }

  setActiveTrip(trip) {
    this.activeTrip = trip;
  }

  clearTrip() {
    this.activeTrip = null;
  }

  getDemoTrip() {
    return {
      ...INITIAL_TRIP,
      code: 'GOA7K2',
      trip_code: 'GOA7K2',
      isExpired: false,
      userRole: 'organizer',
      memberCount: 20,
    };
  }

  /**
   * Normalizes a database row into standard app Trip model
   */
  formatTrip(row, userRole = 'participant', memberCount = 1) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji || '🎪',
      type: row.trip_type || 'event',
      code: row.trip_code,
      trip_code: row.trip_code,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=mycrew://join?code=${row.trip_code}`,
      owner_id: row.owner_id,
      organizer: {
        id: row.owner_id,
        name: row.owner_name || (userRole === 'organizer' ? 'You' : 'Organizer'),
      },
      locationName: row.location_name || `${row.name} Area`,
      centerCoordinate: (row.latitude && row.longitude)
        ? {
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
          }
        : null,
      startTime: row.starts_at,
      endTime: row.ends_at,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      ended_at: row.ended_at,
      visibility: row.visibility || 'everyone',
      totalCapacity: row.total_capacity || 25,
      memberCount: memberCount || 1,
      userRole: userRole,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Creates a persistent trip in Supabase
   */
  async createTrip({
    name,
    type = 'event',
    startTime,
    endTime,
    visibility = 'everyone',
    organizerName = 'You',
    ownerId,
    centerCoordinate,
    locationName,
  }) {
    if (!ownerId) {
      return { success: false, error: 'User is not authenticated.' };
    }

    try {
      const typeConfig = getTripTypeConfig(type);
      const code = generateTripCode(name.slice(0, 3));

      const startsAt = startTime || new Date().toISOString();
      const endsAt =
        endTime || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

      const tripPayload = {
        name: name.trim(),
        emoji: typeConfig.emoji || '🎪',
        trip_code: code,
        trip_type: type,
        owner_id: ownerId,
        starts_at: startsAt,
        ends_at: endsAt,
        location_name: locationName || `${name.trim()} Area`,
        latitude: centerCoordinate?.latitude ? Number(centerCoordinate.latitude) : null,
        longitude: centerCoordinate?.longitude ? Number(centerCoordinate.longitude) : null,
        visibility: visibility || 'everyone',
      };

      // 1. Insert into public.trips
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert(tripPayload)
        .select()
        .single();

      if (tripError || !tripData) {
        console.error('Supabase createTrip error:', tripError);
        return {
          success: false,
          error: "Couldn't create your trip. Check your connection and try again.",
        };
      }

      // 2. Insert owner as organizer in public.trip_members
      const { error: memberError } = await supabase
        .from('trip_members')
        .insert({
          trip_id: tripData.id,
          user_id: ownerId,
          role: 'organizer',
          user_name: organizerName || 'You (Host)',
        });

      if (memberError) {
        console.warn('Supabase trip_members insert warning:', memberError);
      }

      const formattedTrip = this.formatTrip(tripData, 'organizer', 1);
      this.activeTrip = formattedTrip;

      return {
        success: true,
        trip: formattedTrip,
      };
    } catch (err) {
      console.error('createTrip exception:', err);
      return {
        success: false,
        error: "Couldn't create your trip. Check your connection and try again.",
      };
    }
  }

  /**
   * Finds a trip by code (supports demo code or Supabase RPC lookup)
   */
  async findTripByCode(code) {
    if (!code || typeof code !== 'string') {
      return {
        success: false,
        error: 'Please enter a valid trip code.',
      };
    }

    const cleanCode = code.trim().toUpperCase();

    // Check predefined demo trip codes
    if (DEMO_TRIP_CODES.includes(cleanCode)) {
      const demoTrip = this.getDemoTrip();
      return {
        success: true,
        trip: demoTrip,
        isDemo: true,
      };
    }

    try {
      // Call Supabase RPC find_trip_by_code
      const { data, error } = await supabase.rpc('find_trip_by_code', {
        p_code: cleanCode,
      });

      if (error) {
        console.error('find_trip_by_code RPC error:', error);
        return {
          success: false,
          error: 'Error checking trip code. Please try again.',
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Trip not found. Check the code with your organizer and try again.',
        };
      }

      const rawTrip = data[0];

      // Fetch member count
      const { count } = await supabase
        .from('trip_members')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', rawTrip.id)
        .is('left_at', null);

      const formattedTrip = this.formatTrip(rawTrip, 'participant', count || 1);
      return {
        success: true,
        trip: formattedTrip,
      };
    } catch (err) {
      console.error('findTripByCode exception:', err);
      return {
        success: false,
        error: 'Could not connect to MyCrew. Check your internet connection.',
      };
    }
  }

  /**
   * Retrieves structured preview details for the confirmation screen
   */
  async getTripPreview(code) {
    const res = await this.findTripByCode(code);
    if (!res.success) return null;

    const t = res.trip;
    return {
      id: t.id,
      name: t.name,
      emoji: t.emoji || '🎪',
      code: t.code,
      organizerName: t.organizer?.name || 'Organizer',
      memberCount: t.memberCount || 1,
      locationName: t.locationName || 'Meeting Area',
      endTimeFormatted: 'Ends in trip timeframe',
      trip: t,
      isDemo: res.isDemo,
    };
  }

  /**
   * Participant joins a trip by code and records membership in Supabase
   */
  async joinTrip({ code, userId, userName, avatarUrl }) {
    const res = await this.findTripByCode(code);
    if (!res.success) {
      return res;
    }

    const trip = res.trip;

    // If demo trip, return immediately
    if (res.isDemo) {
      this.activeTrip = trip;
      return { success: true, trip, role: 'participant' };
    }

    // Authoritative check: retrieve active authenticated user ID from Supabase session
    let effectiveUserId = userId;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        effectiveUserId = authData.user.id;
      }
    } catch (e) {
      // fallback to passed userId
    }

    if (!effectiveUserId) {
      return { success: false, error: 'User is not authenticated. Please log in first.' };
    }

    try {
      // Upsert membership in public.trip_members
      const { data: memberData, error: memberError } = await supabase
        .from('trip_members')
        .upsert(
          {
            trip_id: trip.id,
            user_id: effectiveUserId,
            role: 'participant',
            user_name: userName || 'You',
            avatar_url: avatarUrl || null,
            left_at: null, // Clear left_at if rejoining
          },
          { onConflict: 'trip_id, user_id' }
        )
        .select()
        .single();

      if (memberError) {
        console.error('joinTrip membership error:', memberError);
        return {
          success: false,
          error: memberError.message || "Couldn't join trip. Check your connection and try again.",
        };
      }

      const formattedTrip = {
        ...trip,
        userRole: memberData.role || 'participant',
      };
      this.activeTrip = formattedTrip;

      return {
        success: true,
        trip: formattedTrip,
        role: memberData.role || 'participant',
      };
    } catch (err) {
      console.error('joinTrip exception:', err);
      return {
        success: false,
        error: "Couldn't join trip. Please try again.",
      };
    }
  }

  /**
   * Participant leaves the crew in Supabase
   */
  async leaveTrip({ tripId, userId }) {
    this.clearTrip();

    if (!tripId || !userId) {
      return { success: true };
    }

    // If demo trip ID
    if (String(tripId).startsWith('trip_goa') || tripId === 'demo') {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('trip_members')
        .update({ left_at: new Date().toISOString() })
        .match({ trip_id: tripId, user_id: userId });

      if (error) {
        console.warn('leaveTrip Supabase error:', error);
      }
      return { success: true };
    } catch (err) {
      console.warn('leaveTrip exception:', err);
      return { success: true };
    }
  }

  /**
   * Organizer ends the trip in Supabase (marks ended_at, does NOT delete)
   */
  async endTrip({ tripId, ownerId }) {
    this.clearTrip();

    if (!tripId || !ownerId) {
      return { success: true };
    }

    if (String(tripId).startsWith('trip_goa') || tripId === 'demo') {
      return { success: true };
    }

    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('trips')
        .update({ ended_at: nowIso, updated_at: nowIso })
        .match({ id: tripId, owner_id: ownerId });

      if (error) {
        console.error('endTrip Supabase error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      console.error('endTrip exception:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches all user's trips from Supabase (both created and joined)
   * Separates into activeTrips, upcomingTrips, and expiredTrips (Trip History)
   */
  async getUserTrips(userId) {
    if (!userId) {
      return {
        success: false,
        allTrips: [],
        activeTrips: [],
        upcomingTrips: [],
        expiredTrips: [],
        activeTrip: null,
      };
    }

    try {
      // 1. Fetch trips owned by the user
      const { data: ownedTrips, error: ownedError } = await supabase
        .from('trips')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (ownedError) {
        console.error('getUserTrips ownedTrips error:', ownedError);
      }

      // 2. Fetch memberships joined by the user
      const { data: memberships, error: memberError } = await supabase
        .from('trip_members')
        .select('trip_id, role, joined_at, left_at, trips(*)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (memberError) {
        console.error('getUserTrips memberships error:', memberError);
      }

      // Combine and deduplicate
      const tripsMap = new Map();

      // Add owned trips (role = organizer)
      (ownedTrips || []).forEach((t) => {
        tripsMap.set(t.id, {
          tripData: t,
          role: 'organizer',
          hasLeft: false,
        });
      });

      // Add joined trips from memberships
      (memberships || []).forEach((m) => {
        if (m.trips && !tripsMap.has(m.trips.id)) {
          tripsMap.set(m.trips.id, {
            tripData: m.trips,
            role: m.role || 'participant',
            hasLeft: Boolean(m.left_at),
          });
        }
      });

      const allTrips = [];
      const activeTrips = [];
      const upcomingTrips = [];
      const expiredTrips = [];

      for (const [id, entry] of tripsMap.entries()) {
        const formatted = this.formatTrip(entry.tripData, entry.role);
        allTrips.push(formatted);

        const status = getTripStatus(formatted);

        if (status === 'active' && !entry.hasLeft) {
          activeTrips.push(formatted);
        } else if (status === 'upcoming' && !entry.hasLeft) {
          upcomingTrips.push(formatted);
        } else {
          // Expired, ended, or user left
          expiredTrips.push(formatted);
        }
      }

      // Sort expired trips newest first by ends_at or created_at
      expiredTrips.sort((a, b) => {
        const timeA = new Date(a.ends_at || a.created_at || 0).getTime();
        const timeB = new Date(b.ends_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });

      // Active trip is the first active trip if any
      const currentActive = activeTrips.length > 0 ? activeTrips[0] : null;
      if (currentActive) {
        this.activeTrip = currentActive;
      }

      return {
        success: true,
        allTrips,
        activeTrips,
        upcomingTrips,
        expiredTrips,
        activeTrip: currentActive,
      };
    } catch (err) {
      console.error('getUserTrips exception:', err);
      return {
        success: false,
        allTrips: [],
        activeTrips: [],
        upcomingTrips: [],
        expiredTrips,
        activeTrip: null,
      };
    }
  }

  /**
   * Fetches active members of a trip from Supabase
   */
  async getTripMembers(tripId) {
    if (!tripId || String(tripId).startsWith('trip_goa') || tripId === 'demo') {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId)
        .is('left_at', null);

      if (error || !data) return [];
      return data;
    } catch (e) {
      return [];
    }
  }

  /**
   * Updates user's real device location in Supabase public.trip_members
   * Applies rate limiting to save battery and avoid write spam
   */
  async updateMemberLocation({
    tripId,
    userId,
    latitude,
    longitude,
    accuracy = null,
    heading = null,
    speed = null,
    force = false,
  }) {
    if (!tripId || !userId) return;
    if (isNaN(latitude) || isNaN(longitude)) return;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return;
    if (String(tripId).startsWith('trip_goa') || tripId === 'demo') return;

    const now = Date.now();
    const timeSinceLast = now - this.lastLocationWriteTime;

    if (!force) {
      // Minimum 3 seconds between writes
      if (timeSinceLast < 3000) {
        return;
      }

      // If less than 6 seconds, check if movement is meaningful (> 5 meters)
      if (timeSinceLast < 6000 && this.lastSentLocation) {
        const movedMeters = calculateDistanceMeters(
          this.lastSentLocation,
          { latitude, longitude }
        );
        if (movedMeters < 5) {
          return; // Skip write: user hasn't moved meaningfully
        }
      }
    }

    this.lastLocationWriteTime = now;
    this.lastSentLocation = { latitude, longitude };

    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('trip_members')
        .update({
          latitude: Number(latitude),
          longitude: Number(longitude),
          location_accuracy: accuracy !== null ? Number(accuracy) : null,
          location_heading: heading !== null ? Number(heading) : null,
          location_speed: speed !== null ? Number(speed) : null,
          location_updated_at: nowIso,
        })
        .match({ trip_id: tripId, user_id: userId });

      if (error) {
        console.warn('updateMemberLocation error:', error.message);
      }
    } catch (err) {
      console.warn('updateMemberLocation exception:', err);
    }
  }

  /**
   * Pauses location sharing in Supabase by setting coordinates and location_updated_at to null
   * This immediately hides the user's live pin from other crew members
   */
  async pauseLocationSharing({ tripId, userId }) {
    if (!tripId || !userId) return;
    if (String(tripId).startsWith('trip_goa') || tripId === 'demo') return;

    try {
      const { error } = await supabase
        .from('trip_members')
        .update({
          latitude: null,
          longitude: null,
          location_updated_at: null,
        })
        .match({ trip_id: tripId, user_id: userId });

      if (error) {
        console.warn('pauseLocationSharing Supabase error:', error.message);
      }
    } catch (err) {
      console.warn('pauseLocationSharing exception:', err);
    }
  }

  /**
   * Subscribes to Supabase Realtime changes for trip member locations
   */
  subscribeToTripLocations(tripId, callback) {
    if (!tripId || String(tripId).startsWith('trip_goa') || tripId === 'demo') {
      return null;
    }

    this.unsubscribeFromTripLocations();

    const channelName = `trip-members-${tripId}`;
    this.locationChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_members',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (callback) {
            callback(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Trip Realtime (${channelName}) status:`, status);
      });

    return this.locationChannel;
  }

  /**
   * Cleans up Supabase Realtime subscription
   */
  unsubscribeFromTripLocations() {
    if (this.locationChannel) {
      supabase.removeChannel(this.locationChannel);
      this.locationChannel = null;
    }
  }
}

export const tripService = new TripService();
