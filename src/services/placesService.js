// src/services/placesService.js
// Lấy ảnh thật từ Google Places API + fallback loremflickr (free, theo keyword)
// Đặt GOOGLE_PLACES_API_KEY để bật ảnh thật từ Google Maps
// Lấy key: https://console.cloud.google.com/ → bật "Places API"

export const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';

// ─── Cache bộ nhớ ───────────────────────────────────────────────────────────
const _photoCache = {};

// ─── Keyword map theo loại địa điểm ─────────────────────────────────────────
// Dùng loremflickr.com — miễn phí, theo keyword, luôn trả ảnh thật
const KEYWORD_MAP = [
  // Ẩm thực VN
  { match: ['phở', 'pho'],           kw: 'pho,vietnam,noodle' },
  { match: ['bún bò'],               kw: 'beef,noodle,vietnam' },
  { match: ['bún'],                  kw: 'vietnam,noodle,bowl' },
  { match: ['cơm tấm'],              kw: 'rice,vietnamese,food' },
  { match: ['cơm hến'],              kw: 'clam,rice,vietnamese' },
  { match: ['cơm'],                  kw: 'rice,dish,vietnamese' },
  { match: ['bánh mì'],              kw: 'banh-mi,sandwich,vietnam' },
  { match: ['bánh cuốn'],            kw: 'vietnamese,rice,roll' },
  { match: ['bánh khọt'],            kw: 'vietnamese,pancake,shrimp' },
  { match: ['bánh căn'],             kw: 'vietnamese,street,food' },
  { match: ['cao lầu'],              kw: 'hoian,noodle,vietnam' },
  { match: ['mì quảng'],             kw: 'danang,noodle,vietnam' },
  { match: ['hủ tiếu'],              kw: 'noodle,soup,vietnam' },
  { match: ['chả cá'],               kw: 'fish,grilled,vietnam' },
  { match: ['lẩu'],                  kw: 'hotpot,vietnam,food' },
  { match: ['cà phê', 'cafe'],       kw: 'vietnamese,coffee,cafe' },
  { match: ['nem'],                  kw: 'spring,roll,vietnam' },
  // Resort / Khách sạn
  { match: ['sofitel', 'metropole'], kw: 'luxury,hotel,hanoi' },
  { match: ['hyatt'],                kw: 'luxury,hotel,vietnam' },
  { match: ['marriott'],             kw: 'beach,resort,vietnam' },
  { match: ['vinpearl'],             kw: 'phuquoc,resort,beach' },
  { match: ['six senses'],           kw: 'overwater,villa,tropical' },
  { match: ['banyan'],               kw: 'beach,resort,sea' },
  { match: ['four seasons'],         kw: 'luxury,beach,pool,villa' },
  { match: ['intercontinental'],     kw: 'mountain,hotel,danang' },
  { match: ['amanoi'],               kw: 'luxury,villa,tropical,sea' },
  { match: ['anantara'],             kw: 'riverside,resort,vietnam' },
  { match: ['dalat palace'],         kw: 'colonial,hotel,dalat' },
  { match: ['resort', 'hotel'],      kw: 'resort,pool,vietnam' },
  // Spa / Sức khoẻ
  { match: ['spa'],                  kw: 'spa,massage,vietnam' },
  { match: ['yoga'],                 kw: 'yoga,studio,wellness' },
  { match: ['gym', 'fitness'],       kw: 'gym,fitness,modern' },
  { match: ['bệnh viện', 'hospital'],kw: 'hospital,modern,vietnam' },
  { match: ['vinmec'],               kw: 'hospital,modern,clean' },
  // Làm đẹp
  { match: ['nail'],                 kw: 'nail,art,beauty' },
  { match: ['salon', 'hair'],        kw: 'hair,salon,beauty' },
  { match: ['thẩm mỹ', 'clinic'],    kw: 'beauty,clinic,treatment' },
  // Mua sắm
  { match: ['chợ nổi'],              kw: 'floating,market,mekong' },
  { match: ['chợ đêm'],              kw: 'night,market,vietnam' },
  { match: ['chợ'],                  kw: 'market,vietnam,colorful' },
  { match: ['vincom'],               kw: 'shopping,mall,vietnam' },
  { match: ['aeon'],                 kw: 'shopping,center,modern' },
  { match: ['phố hàng gai', 'lụa'],  kw: 'silk,fabric,vietnam' },
  { match: ['đèn lồng', 'hội an'],   kw: 'hoian,lantern,ancient' },
];

function getPhotoKeyword(place) {
  const text = `${place.name} ${place.city}`.toLowerCase();
  for (const { match, kw } of KEYWORD_MAP) {
    if (match.some(m => text.includes(m))) return kw;
  }
  // Fallback theo emoji
  const e = place.emoji || '';
  if (['🍜','🍲','🥖','🍚','🍝','🫕','🐟','🦀','🐚','☕','🍢','🫔','🥚','🍡','🍵','🥩','🧇'].includes(e))
    return 'vietnamese,food,delicious';
  if (['🏨','🏛️','🌊','⛰️','🛶','🏝️','🌺','🌸','💎','🏙️','🦅'].includes(e))
    return 'vietnam,resort,scenic';
  if (['🏥','💆','🧘','🌿','🏋️'].includes(e))
    return 'spa,wellness,vietnam';
  if (['💇','🎨','✨','💅','💄','💜','🌟'].includes(e))
    return 'beauty,salon,treatment';
  if (['🏪','🏬','🧵','🛍️','🌄','🏮','🚤','🧶'].includes(e))
    return 'vietnam,market,colorful';
  return 'vietnam,travel,beautiful';
}

/**
 * Trả về URL ảnh fallback dùng loremflickr (miễn phí, không cần key).
 * Dùng seed = place.id để ảnh nhất quán qua các lần render.
 */
function getFallbackPhotoUrl(place) {
  const kw  = getPhotoKeyword(place);
  // loremflickr.com/WxH/keyword1,keyword2?lock=seed
  // lock = số nguyên → ảnh luôn nhất quán cho cùng 1 địa điểm
  const seed = Math.abs(hashCode(place.id || place.name || 'vn')) % 9999;
  return `https://loremflickr.com/600/400/${kw}?lock=${seed}`;
}

/** Tính hash đơn giản từ string → number */
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

/**
 * Lấy URL ảnh thật từ Google Places cho một địa điểm.
 * Nếu không có API key → tự động dùng ảnh loremflickr theo từ khoá (miễn phí).
 *
 * @param {object} place - { id, name, address, city, lat, lng, emoji }
 * @returns {Promise<string|null>}
 */
export async function fetchPlacePhoto(place) {
  if (!place?.name) return null;

  const cacheKey = place.id || place.name;
  if (_photoCache[cacheKey] !== undefined) return _photoCache[cacheKey];

  // ── Không có Google key → dùng loremflickr ────────────────────────────────
  if (GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY') {
    const url = getFallbackPhotoUrl(place);
    _photoCache[cacheKey] = url;
    return url;
  }

  // ── Có Google API key → dùng Google Places API ───────────────────────────
  try {
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
      const url = getFallbackPhotoUrl(place);
      _photoCache[cacheKey] = url;
      return url;
    }

    // Ưu tiên kết quả gần nhất theo lat/lng
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
      const url = getFallbackPhotoUrl(place);
      _photoCache[cacheKey] = url;
      return url;
    }

    const photoUrl =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=800` +
      `&photo_reference=${photoRef}` +
      `&key=${GOOGLE_PLACES_API_KEY}`;

    _photoCache[cacheKey] = photoUrl;
    return photoUrl;

  } catch (err) {
    console.warn('[placesService] Lỗi Google Places:', place.name, err.message);
    const url = getFallbackPhotoUrl(place);
    _photoCache[cacheKey] = url;
    return url;
  }
}

/** Xoá cache (dùng khi đổi API key hoặc reload) */
export function clearPhotoCache() {
  Object.keys(_photoCache).forEach(k => delete _photoCache[k]);
}
