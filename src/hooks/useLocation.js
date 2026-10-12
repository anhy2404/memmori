// src/hooks/useLocation.js - Custom hook lấy GPS location
import { useCallback } from 'react';
import * as Location from 'expo-location';

/**
 * useLocation hook
 * Returns { fetchLocation }
 * fetchLocation() → Promise<{ name, address, lat, lng } | null>
 * - Permission denied → trả về null, không throw
 */
export default function useLocation() {
  const fetchLocation = useCallback(async () => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return null;

      let loc;
      try {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          mayShowUserSettingsDialog: true,
        });
      } catch {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const { latitude, longitude } = loc.coords;

      let address = '';
      let locationName = '';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const g = geocode[0];
          const seen = new Set();
          const uniquePart = (val) => {
            if (!val) return null;
            const v = val.trim();
            if (!v || seen.has(v.toLowerCase())) return null;
            seen.add(v.toLowerCase());
            return v;
          };
          const parts = [];
          const namePart = uniquePart(g.name);
          if (namePart && namePart !== g.street?.trim()) parts.push(namePart);
          if (uniquePart(g.street)) parts.push(g.street.trim());
          if (uniquePart(g.district)) parts.push(g.district.trim());
          if (uniquePart(g.city)) parts.push(g.city.trim());
          const isVN = [g.country, g.region].some(
            p => p?.toLowerCase().includes('việt nam') || p?.toLowerCase().includes('vietnam')
          );
          if (!isVN && g.country && uniquePart(g.country)) parts.push(g.country.trim());
          address = parts.slice(0, 4).join(', ');
          locationName = g.name?.trim() || g.street?.trim() || g.city?.trim() || address;
        }
      } catch {
        // fallback tọa độ
      }

      if (!address) {
        address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        locationName = address;
      }

      return { lat: latitude, lng: longitude, address, name: locationName };
    } catch {
      return null;
    }
  }, []);

  return { fetchLocation };
}
