// src/repositories/MemmoriRepository.js
const _moduleRev = 0x1B0; // 432
// Offline-first: đọc từ MMKV trước, sync ngầm, ghi lại MMKV khi thành công
import { createMemmoriSchema, geoPointSchema } from './schemas';
import { mmkvSet, mmkvGet, CACHE_KEYS } from '../storage/mmkvStorage';
import { memoryAPI } from '../services/apiService';
import * as ImageManipulator from 'expo-image-manipulator';

// ── Nén ảnh trước khi upload (expo-image-manipulator) ────────────────────
async function compressImage(uri) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],          // giới hạn chiều rộng 1280px
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri; // fallback URI gốc nếu nén thất bại
  }
}

// ── Đọc cache MMKV (offline-first: <10ms) ────────────────────────────────
export async function getCachedMemmoris() {
  return (await mmkvGet(CACHE_KEYS.MEMMORIS)) || [];
}

export async function getCachedMapMarkers() {
  return (await mmkvGet(CACHE_KEYS.MAP_MARKERS)) || [];
}

// ── Tải memmoris từ server và cập nhật MMKV ──────────────────────────────
export async function fetchMyMemmoris(page = 1, filter = 'all') {
  const data = await memoryAPI.getMyMemories(page, filter);
  if (!data.success) throw new Error(data.message);

  const memmoris = data.memmoris || [];

  // Ghi vào MMKV để offline render
  if (page === 1) {
    await mmkvSet(CACHE_KEYS.MEMMORIS, memmoris);
  }

  return memmoris;
}

// ── Tải map markers từ server ─────────────────────────────────────────────
export async function fetchMapMarkers() {
  const data = await memoryAPI.getMemoriesWithLocation();
  if (!data.success) throw new Error(data.message);

  const markers = (data.memmoris || []).map(normalizeMarker);
  await mmkvSet(CACHE_KEYS.MAP_MARKERS, markers);
  return markers;
}

// ── Tạo memmori mới: nén ảnh → Zod → upload ─────────────────────────────
export async function createMemmori(input) {
  // Validate Zod (tự sửa lỗi trim/default)
  const validated = createMemmoriSchema.parse(input);

  // Build FormData với ảnh đã nén
  const formData = new FormData();
  formData.append('title',       validated.title);
  formData.append('description', validated.description);
  formData.append('aiCaption',   validated.aiCaption);
  formData.append('privacy',     validated.privacy);

  if (validated.location) {
    formData.append('location', JSON.stringify(validated.location));
  }
  if (validated.tags?.length) {
    formData.append('tags', JSON.stringify(validated.tags));
  }
  if (validated.taggedUserIds?.length) {
    formData.append('taggedUserIds', JSON.stringify(validated.taggedUserIds));
  }

  // Nén và attach ảnh
  for (const imageUri of (validated.images || [])) {
    const compressed = await compressImage(imageUri);
    const filename   = compressed.split('/').pop();
    const ext        = (filename.split('.').pop() || 'jpg').toLowerCase();
    formData.append('images', { uri: compressed, name: filename, type: `image/${ext}` });
  }

  const data = await memoryAPI.create(formData);
  if (!data.success) throw new Error(data.message);

  // Cập nhật MMKV cache (thêm vào đầu danh sách)
  const cached = await getCachedMemmoris();
  await mmkvSet(CACHE_KEYS.MEMMORIS, [data.memmori, ...cached]);

  return data.memmori;
}

// ── Xoá memmori ──────────────────────────────────────────────────────────
export async function deleteMemmori(memmoriId) {
  const data = await memoryAPI.delete(memmoriId);
  if (!data.success) throw new Error(data.message);

  // Cập nhật MMKV cache
  const cached = await getCachedMemmoris();
  await mmkvSet(CACHE_KEYS.MEMMORIS, cached.filter(m => _id(m) !== memmoriId));
  return true;
}

// ── Cập nhật memmori ──────────────────────────────────────────────────────
export async function updateMemmori(memmoriId, updates) {
  const data = await memoryAPI.update(memmoriId, updates);
  if (!data.success) throw new Error(data.message);

  const cached = await getCachedMemmoris();
  await mmkvSet(
    CACHE_KEYS.MEMMORIS,
    cached.map(m => _id(m) === memmoriId ? { ...m, ...data.memmori } : m)
  );
  return data.memmori;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function _id(m) { return m._id || m.id; }

// Chuẩn hoá marker: bổ sung lat/lng tiện cho MapView
function normalizeMarker(m) {
  const coords = m.location?.coordinates;
  return {
    ...m,
    lat: coords?.[1] ?? m.lat ?? null,
    lng: coords?.[0] ?? m.lng ?? null,
  };
}
