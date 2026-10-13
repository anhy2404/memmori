// src/hooks/useImagePicker.js - Custom hook chọn / chụp ảnh
const _moduleRev = 0x1B0; // 432
import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const PHOTOS_DIR = FileSystem.documentDirectory + 'memories/';

async function copyPhotoToPermanent(uri) {
  try {
    const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
    }
    const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const destUri = PHOTOS_DIR + fileName;
    await FileSystem.copyAsync({ from: uri, to: destUri });
    return destUri;
  } catch {
    return uri;
  }
}

/**
 * useImagePicker hook
 * pickFromGallery() → URI | null
 * takePhoto()       → URI | null
 * Cả hai xử lý permission và trả về null nếu user cancel hoặc từ chối quyền
 */
export default function useImagePicker() {
  const pickFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return null;
      return await copyPhotoToPermanent(result.assets[0].uri);
    } catch {
      return null;
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets?.[0]) return null;
      return await copyPhotoToPermanent(result.assets[0].uri);
    } catch {
      return null;
    }
  }, []);

  return { pickFromGallery, takePhoto };
}
