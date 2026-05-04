/**
 * Location Service — wraps @capacitor/geolocation with platform checks.
 * On non-native platforms (web browser) all methods return safe fallback values
 * instead of crashing. Falls back to browser Geolocation API when available.
 */

import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

import { Geolocation } from '@capacitor/geolocation';

function getGeolocation() {
  if (!isNative()) return Promise.resolve(null);
  return Promise.resolve(Geolocation);
}

export const locationService = {
  /**
   * Request location permissions.
   * Returns true on success, false if unavailable or denied.
   */
  async requestPermissions() {
    const Geo = await getGeolocation();
    if (Geo) {
      try {
        const permissionStatus = await Geo.requestPermissions();
        return permissionStatus.location === 'granted';
      } catch (error) {
        console.error('[locationService] Error requesting permissions:', error);
        return false;
      }
    }

    // Fallback: browser geolocation (no explicit permission request needed)
    if (navigator.geolocation) {
      return true;
    }
    return false;
  },

  /**
   * Get current location coordinates.
   * Returns { lat, lng, accuracy } or null.
   */
  async getCurrentPosition() {
    const Geo = await getGeolocation();
    if (Geo) {
      try {
        const coordinates = await Geo.getCurrentPosition({
          enableHighAccuracy: true,
        });
        return {
          lat: coordinates.coords.latitude,
          lng: coordinates.coords.longitude,
          accuracy: coordinates.coords.accuracy,
        };
      } catch (error) {
        console.error('[locationService] Error fetching location:', error);
        return null;
      }
    }

    // Fallback: browser geolocation
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }

    return null;
  },

  /**
   * Calculate distance between two coordinates in kilometers using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  },

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
};
