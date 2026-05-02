import { Geolocation } from '@capacitor/geolocation';

export const locationService = {
  /**
   * Request location permissions
   */
  async requestPermissions() {
    try {
      const permissionStatus = await Geolocation.requestPermissions();
      return permissionStatus.location === 'granted';
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    }
  },

  /**
   * Get current location coordinates
   */
  async getCurrentPosition() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });
      return {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
      };
    } catch (error) {
      console.error("Error fetching location:", error);
      return null;
    }
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
