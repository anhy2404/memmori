// src/services/placesService.js
// Lấy ảnh thật từ Google Places API (Places API New)
// Đặt GOOGLE_PLACES_API_KEY để bật tính năng này
// Lấy key tại: https://console.cloud.google.com/ → bật "Places API"

export const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';

// Cache trong bộ nhớ: placeId/tên → photoUrl
const _photoCache = {};

/**
 * Lấy URL ảnh thật từ Google Places cho một địa điểm.
 * Trả về null nếu không có API key hoặc lỗi.
 *
 * @param {object} place - { name, address, city, lat, lng }
 * @returns {Promise<string|null>}
 */
export async function fetchPlacePhoto(place) {
  if (!place?.name) return null;
  if (GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY') return null;

  const cacheKey = place.id || place.name;
  if (_photoCache[cacheKey] !== undefined) return _photoCache[cacheKey];

  try {
    // Bước 1: Text Search để lấy place_id và photo_reference
    const query = encodeURIComponent(`${place.name} ${place.city} Việt Nam`);
    const searchUrl =
      `https://maps.googleapis.com/maps/api/place/textsearch/json` +
      `?query=${query}` +
      `&language=vi` +
      `&key=${GOOGLE_PLACES_API_KEY}`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`);

    const searchData = await searchRes.json();

    if (searchData.status !== 'OK' || !searchData.results?.length) {
      _photoCache[cacheKey] = null;
      return null;
    }

    // Ưu tiên kết quả gần nhất theo lat/lng nếu có
    let best = searchData.results[0];
    if (place.lat && place.lng) {
      let minDist = Infinity;
      for (const r of searchData.results) {
        const loc = r.geometry?.location;
        if (!loc) continue;
        const d = Math.abs(loc.lat - place.lat) + Math.abs(loc.lng - place.lng);
        if (d < minDist) { minDist = d; best = r; }
      }
    }

    const photoRef = best?.photos?.[0]?.photo_reference;
    if (!photoRef) {
      _photoCache[cacheKey] = null;
      return null;
    }

    // Bước 2: Tạo URL ảnh từ photo_reference
    const photoUrl =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=600` +
      `&photo_reference=${photoRef}` +
      `&key=${GOOGLE_PLACES_API_KEY}`;

    _photoCache[cacheKey] = photoUrl;
    return photoUrl;

  } catch (err) {
    console.warn('[placesService] Lỗi fetch ảnh:', place.name, err.message);
    _photoCache[cacheKey] = null;
    return null;
  }
}

/**
 * Xoá cache (dùng khi đổi API key)
 */
export function clearPhotoCache() {
  Object.keys(_photoCache).forEach(k => delete _photoCache[k]);
}
