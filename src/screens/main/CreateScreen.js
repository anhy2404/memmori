// src/screens/main/CreateScreen.js - Tạo kỷ niệm mới
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, ActivityIndicator,
  Dimensions, Linking, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';
import { generateCaption } from '../../services/geminiService';

const { width } = Dimensions.get('window');

// Helper: xin quyền với fallback mở Settings
async function requestPermission(requestFn, openSettingsMsg) {
  try {
    const { status: existing } = await requestFn(false); // canAskAgain check
    if (existing === 'granted') return true;

    const { status, canAskAgain } = await requestFn(true);
    if (status === 'granted') return true;

    if (!canAskAgain) {
      // Đã từ chối vĩnh viễn - mở Settings
      Alert.alert(
        '⚙️ Cần cấp quyền',
        openSettingsMsg,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
        ]
      );
    }
    return false;
  } catch {
    return false;
  }
}

export default function CreateScreen({ navigation }) {
  const { theme, t } = useApp();
  const { user } = useAuth();
  const { addMemory } = useMemory();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [location, setLocation] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [aiCaption, setAiCaption] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Cảnh báo khi có nội dung chưa lưu mà back
  const hasUnsaved = title.trim() || description.trim() || photos.length > 0;
  useEffect(() => {
    const onBack = () => {
      if (hasUnsaved) {
        Alert.alert(
          t('create.unsavedTitle'),
          t('create.unsavedMessage'),
          [
            { text: t('create.continueEditing'), style: 'cancel' },
            { text: t('create.discardChanges'), style: 'destructive', onPress: () => navigation.goBack() },
          ]
        );
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [hasUnsaved, navigation, t]);

  // ===== CHỤP ẢNH =====
  const handleTakePhoto = useCallback(async () => {
    if (photos.length >= 10) {
      Alert.alert(t('common.warning'), t('create.photoLimit'));
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('create.errorCameraPermission'),
          t('common.openSettingsHint'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], // API mới expo-image-picker v16+
        allowsEditing: true,
        quality: 0.8,
        exif: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('[CreateScreen] Lỗi camera:', error);
      Alert.alert(t('common.error'), t('errors.cameraError'));
    }
  }, [photos.length, t]);

  // ===== CHỌN TỪ THƯ VIỆN =====
  const handlePickImage = useCallback(async () => {
    const remaining = 10 - photos.length;
    if (remaining <= 0) {
      Alert.alert(t('common.warning'), t('create.photoLimit'));
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('create.errorMediaPermission'),
          t('common.openSettingsHint'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // API mới
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remaining,
        orderedSelection: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const newUris = result.assets.map(a => a.uri);
        setPhotos(prev => [...prev, ...newUris].slice(0, 10));
      }
    } catch (error) {
      console.error('[CreateScreen] Lỗi chọn ảnh:', error);
      Alert.alert(t('common.error'), t('errors.unknownError'));
    }
  }, [photos.length, t]);

  // ===== XÓA ẢNH =====
  const removePhoto = useCallback((index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ===== LẤY GPS =====
  const handleGetLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          t('map.locationPermissionDenied'),
          t('common.openSettingsHint'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // Thử High accuracy trước, fallback Balanced
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

      // Reverse geocoding - địa chỉ tiếng Việt
      let address = '';
      let locationName = '';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const g = geocode[0];
          const parts = [];
          if (g.name && g.name !== g.street) parts.push(g.name);
          if (g.street) parts.push(g.street);
          if (g.subregion || g.district) parts.push(g.subregion || g.district);
          if (g.city) parts.push(g.city);
          const isVN = parts.some(p =>
            p?.toLowerCase().includes('việt nam') ||
            p?.toLowerCase().includes('vietnam')
          );
          if (!isVN && g.country) parts.push(g.country);
          address = parts.filter(Boolean).slice(0, 4).join(', ');
          locationName = g.name || g.street || g.city || address;
        }
      } catch {
        // fallback tọa độ
      }

      if (!address) {
        address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        locationName = address;
      }

      setLocation({ lat: latitude, lng: longitude, address, name: locationName });
    } catch (error) {
      console.error('[CreateScreen] Lỗi lấy vị trí:', error);
      Alert.alert(t('common.error'), t('create.errorLocationFailed'));
    } finally {
      setIsLoadingLocation(false);
    }
  }, [t]);

  // ===== AI GỢI Ý CAPTION =====
  const handleAICaption = useCallback(async () => {
    if (photos.length === 0 && !description.trim()) {
      Alert.alert(t('common.warning'), t('create.aiCaptionNoContent'));
      return;
    }
    setIsLoadingAI(true);
    try {
      const caption = await generateCaption({
        imageUri: photos[0] || null,
        description,
        location: location?.address || '',
      });
      setAiCaption(caption);
      if (!description.trim()) setDescription(caption);
    } catch (error) {
      console.error('[CreateScreen] Lỗi AI caption:', error);
      Alert.alert(t('common.error'), t('errors.aiServiceError'));
    } finally {
      setIsLoadingAI(false);
    }
  }, [photos, description, location, t]);

  // ===== THÊM TAG =====
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (!tag) return;
    const formatted = tag.startsWith('#') ? tag : `#${tag}`;
    if (!tags.includes(formatted) && tags.length < 10) {
      setTags(prev => [...prev, formatted]);
    }
    setTagInput('');
  }, [tagInput, tags]);

  // ===== LƯU MEMORY =====
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('create.errorTitleRequired'));
      return;
    }
    if (photos.length === 0 && !description.trim()) {
      Alert.alert(t('common.error'), t('create.errorNoContent'));
      return;
    }

    setIsSaving(true);
    try {
      await addMemory({
        title: title.trim(),
        description: description.trim(),
        photos,
        location,
        tags,
        aiCaption,
        userId: user?.id,
      });
      Alert.alert('✅', t('create.saveSuccess'), [
        {
          text: t('common.ok'),
          onPress: () => {
            setTitle(''); setDescription(''); setPhotos([]);
            setLocation(null); setTags([]); setAiCaption('');
            navigation.navigate('Home');
          },
        },
      ]);
    } catch (error) {
      console.error('[CreateScreen] Lỗi lưu:', error);
      Alert.alert(t('common.error'), error.message || t('create.errorSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [title, description, photos, location, tags, aiCaption, user, t, addMemory, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('create.title')}</Text>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, { backgroundColor: theme.colors.primary }, isSaving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveHeaderText}>{t('common.save')}</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ===== ẢNH ===== */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            📷 {t('create.addPhoto')} ({photos.length}/10)
          </Text>
          <View style={styles.photoRow}>
            <TouchableOpacity
              style={[styles.photoAddBtn, { borderColor: theme.colors.primary, backgroundColor: theme.colors.highlight }]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.photoAddEmoji}>📷</Text>
              <Text style={[styles.photoAddText, { color: theme.colors.primary }]}>{t('create.takePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoAddBtn, { borderColor: theme.colors.secondary, backgroundColor: theme.colors.primarySoft }]}
              onPress={handlePickImage}
            >
              <Text style={styles.photoAddEmoji}>🖼️</Text>
              <Text style={[styles.photoAddText, { color: theme.colors.secondary }]}>{t('create.chooseFromLibrary')}</Text>
            </TouchableOpacity>
          </View>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoThumbContainer}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={[styles.removePhotoBtn, { backgroundColor: theme.colors.error }]}
                    onPress={() => removePhoto(idx)}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ===== TIÊU ĐỀ ===== */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text, marginBottom: 0, paddingHorizontal: 0 }]}>✏️ {t('create.titlePlaceholder')}</Text>
            <Text style={{ fontSize: 11, color: title.length > 80 ? theme.colors.warning : theme.colors.textTertiary }}>
              {title.length}/100
            </Text>
          </View>
          <TextInput
            style={[styles.titleInput, { color: theme.colors.text, borderColor: theme.colors.inputBorder, backgroundColor: theme.colors.inputBackground }]}
            placeholder={t('create.titlePlaceholder')}
            placeholderTextColor={theme.colors.placeholder}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoCapitalize="sentences"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        {/* ===== MÔ TẢ ===== */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>📝 {t('create.addText')}</Text>
            <TouchableOpacity
              style={[styles.aiBtn, { backgroundColor: theme.colors.secondary + '20', opacity: isLoadingAI ? 0.5 : 1 }]}
              onPress={handleAICaption}
              disabled={isLoadingAI}
            >
              {isLoadingAI
                ? <ActivityIndicator color={theme.colors.secondary} size="small" />
                : <Text style={[styles.aiBtnText, { color: theme.colors.secondary }]}>✨ AI</Text>
              }
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.descInput, { color: theme.colors.text, borderColor: theme.colors.inputBorder, backgroundColor: theme.colors.inputBackground }]}
            placeholder={t('create.descriptionPlaceholder')}
            placeholderTextColor={theme.colors.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={false}
          />
          <Text style={{ fontSize: 11, color: description.length > 900 ? theme.colors.warning : theme.colors.textTertiary, textAlign: 'right', marginTop: 4 }}>
            {description.length}/1000
          </Text>
          {aiCaption ? (
            <View style={[styles.aiCaptionBox, { backgroundColor: theme.colors.highlight, borderColor: theme.colors.primary }]}>
              <Text style={[styles.aiCaptionLabel, { color: theme.colors.primary }]}>✨ AI gợi ý:</Text>
              <Text style={[styles.aiCaptionText, { color: theme.colors.text }]}>{aiCaption}</Text>
            </View>
          ) : null}
        </View>

        {/* ===== VỊ TRÍ ===== */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>📍 {t('create.locationLabel')}</Text>
          <TouchableOpacity
            style={[styles.locationBtn, {
              backgroundColor: location ? theme.colors.success + '20' : theme.colors.inputBackground,
              borderColor: location ? theme.colors.success : theme.colors.inputBorder,
              opacity: isLoadingLocation ? 0.7 : 1,
            }]}
            onPress={handleGetLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <>
                <Text style={styles.locationBtnEmoji}>{location ? '✅' : '📍'}</Text>
                <Text style={[styles.locationBtnText, { color: location ? theme.colors.success : theme.colors.textSecondary }]} numberOfLines={1}>
                  {location ? location.address : t('create.getLocation')}
                </Text>
                {location && (
                  <TouchableOpacity onPress={() => setLocation(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={{ color: theme.colors.error, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ===== TAGS ===== */}
        <View style={[styles.section, { paddingHorizontal: 16, paddingBottom: 32 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>🏷️ {t('create.tagsLabel')}</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.tagInput, { color: theme.colors.text, borderColor: theme.colors.inputBorder, backgroundColor: theme.colors.inputBackground }]}
              placeholder={t('create.tagsPlaceholder')}
              placeholderTextColor={theme.colors.placeholder}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.addTagBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddTag}
            >
              <Text style={styles.addTagBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.tagChip, { backgroundColor: theme.colors.highlight }]}
                  onPress={() => setTags(prev => prev.filter((_, i) => i !== idx))}
                >
                  <Text style={[styles.tagChipText, { color: theme.colors.primary }]}>{tag} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    saveHeaderBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 70, alignItems: 'center' },
    saveHeaderText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    btnDisabled: { opacity: 0.6 },
    section: { marginBottom: 4, paddingTop: 16 },
    sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10, paddingHorizontal: 16 },
    sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
    photoRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
    photoAddBtn: {
      flex: 1, height: 80, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    photoAddEmoji: { fontSize: 24 },
    photoAddText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
    photoList: { marginTop: 10, paddingLeft: 16 },
    photoThumbContainer: { marginRight: 8, position: 'relative' },
    photoThumb: { width: 80, height: 80, borderRadius: 10 },
    removePhotoBtn: {
      position: 'absolute', top: -6, right: -6,
      width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    },
    removePhotoText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    titleInput: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15 },
    descInput: { minHeight: 100, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingTop: 12, fontSize: 14, lineHeight: 20 },
    aiBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, minWidth: 50, alignItems: 'center' },
    aiBtnText: { fontSize: 13, fontWeight: '700' },
    aiCaptionBox: { marginTop: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
    aiCaptionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    aiCaptionText: { fontSize: 13, lineHeight: 19 },
    locationBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      minHeight: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12,
    },
    locationBtnEmoji: { fontSize: 18 },
    locationBtnText: { fontSize: 14, flex: 1 },
    tagInputRow: { flexDirection: 'row', gap: 8 },
    tagInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, fontSize: 14 },
    addTagBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    addTagBtnText: { color: '#fff', fontSize: 22, fontWeight: '300' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
    tagChipText: { fontSize: 12, fontWeight: '500' },
  });
}
