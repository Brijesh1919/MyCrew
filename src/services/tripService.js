// Trip Service Abstraction
// Handles trip lifecycle, creation, joining, code validation, and expiration

import { INITIAL_TRIP } from '../data/mockData';
import { generateTripCode } from '../utils/helpers';
import { getTripTypeConfig } from '../constants/tripTypes';

// Predefined demo/testing codes that activate the Goa Music Festival mock trip
export const DEMO_TRIP_CODES = ['GOA7K2', 'GOA2026'];

class TripService {
  constructor() {
    // Default is NULL for fresh/unjoined users
    this.activeTrip = null;
  }

  getActiveTrip() {
    return this.activeTrip;
  }

  setActiveTrip(trip) {
    this.activeTrip = trip;
  }

  getDemoTrip() {
    return {
      ...INITIAL_TRIP,
      code: 'GOA7K2',
      isExpired: false,
    };
  }

  /**
   * Validates a trip code. Supports predefined demo codes (GOA7K2)
   * or a newly created local trip code.
   */
  findTripByCode(code) {
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
        trip: {
          ...demoTrip,
          code: cleanCode,
        },
      };
    }

    // Check if matching currently active locally created trip
    if (this.activeTrip && this.activeTrip.code && this.activeTrip.code.toUpperCase() === cleanCode) {
      return {
        success: true,
        trip: this.activeTrip,
      };
    }

    // Invalid code
    return {
      success: false,
      error: 'Trip not found. Check the code with your organizer and try again.',
    };
  }

  /**
   * Retrieves structured preview details for the confirmation screen
   */
  getTripPreview(code) {
    const res = this.findTripByCode(code);
    if (!res.success) return null;

    const t = res.trip;
    return {
      id: t.id,
      name: t.name,
      emoji: t.emoji || '🎪',
      code: t.code,
      organizerName: t.organizer?.name || 'Rahul',
      memberCount: t.code === 'GOA7K2' || t.code === 'GOA2026' ? 20 : 1,
      locationName: t.locationName || 'Vagator Grounds, Goa',
      endTimeFormatted: 'Today · 10:18 PM',
      trip: t,
    };
  }

  createTrip({ name, type = 'event', startTime, endTime, visibility = 'everyone', organizerName = 'You' }) {
    const typeConfig = getTripTypeConfig(type);
    const code = generateTripCode(name.slice(0, 3));

    const newTrip = {
      id: `trip_${Date.now()}`,
      name: name.trim(),
      emoji: typeConfig.emoji,
      type: type,
      code: code,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=mycrew://join?code=${code}`,
      organizer: {
        id: 'me',
        name: organizerName,
        phone: '+91 98765 43210',
      },
      locationName: name.trim() + ' Area',
      centerCoordinate: {
        latitude: 15.58980,
        longitude: 73.74380,
      },
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      visibility: visibility,
      isExpired: false,
      totalCapacity: 25,
    };

    this.activeTrip = newTrip;
    return newTrip;
  }

  joinTripByCode(code, userName = 'You') {
    const res = this.findTripByCode(code);
    if (res.success) {
      this.activeTrip = res.trip;
    }
    return res;
  }

  endTrip() {
    if (this.activeTrip) {
      this.activeTrip = {
        ...this.activeTrip,
        isExpired: true,
      };
    }
    return this.activeTrip;
  }

  clearTrip() {
    this.activeTrip = null;
  }

  resetToDemo() {
    this.activeTrip = this.getDemoTrip();
    return this.activeTrip;
  }
}

export const tripService = new TripService();

