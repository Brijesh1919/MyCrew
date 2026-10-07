// Map Service Abstraction
// Centralizes Mapbox token, tile providers, map styles, and camera projections

import { APP_CONFIG } from '../constants/config';

export const MAP_STYLES = [
  { id: 'streets-v12', name: 'Streets', icon: 'map' },
  { id: 'outdoors-v12', name: 'Outdoors', icon: 'compass' },
  { id: 'dark-v11', name: 'Dark', icon: 'moon' },
  { id: 'satellite-streets-v12', name: 'Satellite', icon: 'layers' },
];

class MapService {
  constructor() {
    this.token = APP_CONFIG.mapbox.accessToken || '';
    this.currentStyle = APP_CONFIG.mapbox.defaultStyle || 'streets-v12';
  }

  isMapboxConfigured() {
    return Boolean(this.token && this.token.startsWith('pk.'));
  }

  getAccessToken() {
    return this.token;
  }

  setAccessToken(token) {
    this.token = token;
  }

  getStyles() {
    return MAP_STYLES;
  }

  getStyle() {
    return this.currentStyle;
  }

  setStyle(styleId) {
    this.currentStyle = styleId;
  }

  /**
   * Generates a high-resolution Mapbox Static Image URL
   */
  getStaticMapUrl({
    latitude = APP_CONFIG.defaultRegion.latitude,
    longitude = APP_CONFIG.defaultRegion.longitude,
    zoom = 16,
    width = 400,
    height = 360,
    style = this.currentStyle || 'streets-v12',
  }) {
    if (!this.isMapboxConfigured()) {
      return null;
    }

    const safeWidth = Math.min(1280, Math.max(120, Math.round(Number(width) || 400)));
    const safeHeight = Math.min(1280, Math.max(120, Math.round(Number(height) || 360)));
    const safeZoom = Math.min(20, Math.max(1, Number((Number(zoom) || 16).toFixed(2))));
    
    // Ensure coordinates are valid numbers
    const validLat = typeof latitude === 'number' && !isNaN(latitude) && latitude >= -90 && latitude <= 90
      ? latitude
      : 22.2698;
    const validLon = typeof longitude === 'number' && !isNaN(longitude) && longitude >= -180 && longitude <= 180
      ? longitude
      : 73.1627;
      
    const safeLon = Number(validLon.toFixed(5));
    const safeLat = Number(validLat.toFixed(5));

    // Mapbox Static Images API limits total dimension to 1280x1280.
    // Use @2x only when both dimensions fit within 640px to prevent Mapbox 400 errors.
    const retinaSuffix = safeWidth <= 640 && safeHeight <= 640 ? '@2x' : '';

    return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${safeLon},${safeLat},${safeZoom},0,0/${safeWidth}x${safeHeight}${retinaSuffix}?access_token=${this.token}`;
  }

  /**
   * Web Mercator Projection helpers to align custom SVG overlays with Mapbox static tiles (512px tile scale)
   */
  lon2x(lon, zoom) {
    return ((lon + 180) / 360) * 512 * Math.pow(2, zoom);
  }

  lat2y(lat, zoom) {
    const clampedLat = Math.min(85.05112878, Math.max(-85.05112878, lat));
    const rad = (clampedLat * Math.PI) / 180;
    return (1 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / Math.PI) * 256 * Math.pow(2, zoom);
  }

  x2lon(x, zoom) {
    return (x / (512 * Math.pow(2, zoom))) * 360 - 180;
  }

  y2lat(y, zoom) {
    const n = Math.PI - (2 * Math.PI * y) / (512 * Math.pow(2, zoom));
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  project(coord, centerCoord, zoom, width, height) {
    if (!coord || isNaN(coord.latitude) || isNaN(coord.longitude)) {
      return { x: width / 2, y: height / 2 };
    }
    const cx = this.lon2x(centerCoord.longitude, zoom);
    const cy = this.lat2y(centerCoord.latitude, zoom);
    const px = this.lon2x(coord.longitude, zoom);
    const py = this.lat2y(coord.latitude, zoom);

    return {
      x: width / 2 + (px - cx),
      y: height / 2 + (py - cy),
    };
  }

  unproject(point, centerCoord, zoom, width, height) {
    const cx = this.lon2x(centerCoord.longitude, zoom);
    const cy = this.lat2y(centerCoord.latitude, zoom);
    const px = cx + (point.x - width / 2);
    const py = cy + (point.y - height / 2);

    return {
      longitude: this.x2lon(px, zoom),
      latitude: this.y2lat(py, zoom),
    };
  }

  /**
   * Generates a realistic walking route geometry between two coordinates
   * Useful for navigation screen route polyline
   */
  generateRoutePolyline(startCoord, endCoord, waypointsCount = 4) {
    if (!startCoord || !endCoord) return [];
    const points = [startCoord];

    for (let i = 1; i <= waypointsCount; i++) {
      const progress = i / (waypointsCount + 1);
      // Add slight organic wandering to simulate walking paths/alleys
      const jitterLat = (Math.sin(progress * Math.PI) * 0.00008) * (i % 2 === 0 ? 1 : -1);
      const jitterLon = (Math.cos(progress * Math.PI) * 0.00008) * (i % 2 === 0 ? -1 : 1);

      points.push({
        latitude: startCoord.latitude + (endCoord.latitude - startCoord.latitude) * progress + jitterLat,
        longitude: startCoord.longitude + (endCoord.longitude - startCoord.longitude) * progress + jitterLon,
      });
    }

    points.push(endCoord);
    return points;
  }
}

export const mapService = new MapService();

