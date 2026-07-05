// src/screens/main/CreateScreen.js - Tạo kỷ niệm mới (ảnh/video/text + GPS + AI caption)
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, ActivityIndicator,
  Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';
import { generateCaption } from '../../services/geminiService';

const { width } = Dimensions.get('window');

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

  // ===== CHỤP ẢNH =====
  async function handleTakePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('create.errorCameraPermission'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        if (photos.length >= 10) {
          Alert.alert(t('common.warning'), t('create.photoLimit'));
          return;
        }
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.cameraError'));
    }
  }

  // ===== CHỌN TỪ THƯ VIỆN =====
  async function handlePickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('create.errorMediaPermission'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - photos.length,
      });
      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(a => a.uri);
        setPhotos(prev => [...prev, ...newPhotos].slice(0, 10));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.unknownError'));
    }
  }

  // ===== XÓA ẢNH =====
  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  // ===== LẤY GPS =====
  async function handleGetLocation() {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('map.locationPermissionDenied'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });
      const { latitude, longitude } = loc.coords;

      // Reverse geocoding để lấy địa chỉ
      let address = '';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const g = geocode[0];
          const parts = [g.name, g.street, g.district, g.city, g.country].filter(Boolean);
          address = parts.slice(0, 3).join(', ');
        }
      } catch {
        address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      setLocation({ lat: latitude, lng: longitude, address, name: address });
    } catch (error) {
      Alert.alert(t('common.error'), t('create.errorLocationFailed'));
    } finally {
      setIsLoadingLocation(false);
    }
  }

  // ===== AI GỢI Ý CAPTION =====
  async function handleAICaption() {
    if (photos.length === 0 && !description.trim()) {
      Alert.alert(t('common.warning'), 'Vui lòng thêm ảnh hoặc mô tả để AI gợi ý caption');
      return;
    }
    setIsLoadingAI(true);
    try {
      const caption = await generateCaption({
        imageUri: photos[0] || null,
        description: description,
        location: location?.address || '',
      });
      setAiCaption(caption);
      if (!description.trim()) setDescription(caption);
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.aiServiceError'));
    } finally {
      setIsLoadingAI(false);
    }
  }

  // ===== THÊM TAG =====
  function handleAddTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!tags.includes(formattedTag) && tags.length < 10) {
      setTags(prev => [...prev, formattedTag]);
    }
    setTagInput('');
  }

  // ===== LƯU MEMORY =====
  async function handleSave() {
    // Validate
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
        { text: t('common.ok'), onPress: () => {
          // Reset form
          setTitle(''); setDescription(''); setPhotos([]);
          setLocation(null); setTags([]); setAiCaption('');
          navigation.navigate('Home');
        }},
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), t('create.errorSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('create.title')}</Text>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, { backgroundColor: theme.colors.primary }, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveHeaderText}>{t('common.save')}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ===== ẢNH ===== */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>📷 {t('create.addPhoto')}</Text>
          <View style={styles.photoRow}>
            {/* Nút chụp */}
            <TouchableOpacity
              style={[styles.photoAddBtn, { borderColor: theme.colors.primary, backgroundColor: theme.colors.highlight }]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.photoAddEmoji}>📷</Text>
              <Text style={[styles.photoAddText, { color: theme.colors.primary }]}>{t('create.takePhoto')}</Text>
            </TouchableOpacity>
            {/* Nút chọn từ thư viện */}
            <TouchableOpacity
              style={[styles.photoAddBtn, { borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondaryLight + '20' }]}
              onPress={handlePickImage}
            >
              <Text style={styles.photoAddEmoji}>🖼️</Text>
              <Text style={[styles.photoAddText, { color: theme.colors.secondary }]}>{t('create.chooseFromLibrary')}</Text>
            </TouchableOpacity>
          </View>

          {/* Ảnh đã chọn */}
          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoThumbContainer}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={[styles.removePhotoBtn, { backgroundColor: theme.colors.error }]}
                    onPress={() => removePhoto(idx)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* ===== TIÊU ĐỀ ===== */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>✏️ {t('create.titlePlaceholder')}</Text>
          <TextInput
            style={[styles.titleInput, { color: theme.colors.text, borderColor: theme.colors.inputBorder, backgroundColor: theme.colors.inputBackground }]}
            placeholder={t('create.titlePlaceholder')}
            placeholderTextColor={theme.colors.placeholder}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* ===== MÔ TẢ ===== */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>📝 {t('create.addText')}</Text>
            <TouchableOpacity
              style={[styles.aiBtn, { backgroundColor: theme.colors.secondary + '20' }]}
              onPress={handleAICaption}
              disabled={isLoadingAI}
            >
              {isLoadingAI ? (
                <ActivityIndicator color={theme.colors.secondary} size="small" />
              ) : (
                <Text style={[styles.aiBtnText, { color: theme.colors.secondary }]}>✨ AI</Text>
              )}
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
          />
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
            }]}
            onPress={handleGetLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <>
                <Text style={styles.locationBtnEmoji}>{location ? '✅' : '📍'}</Text>
                <Text style={[styles.locationBtnText, { color: location ? theme.colors.success : theme.colors.textSecondary }]}>
                  {location ? location.address : t('create.getLocation')}
                </Text>
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
            />
            <TouchableOpacity
              style={[styles.addTagBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddTag}
            >
              <Text style={styles.addTagBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 ? (
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
          ) : null}
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
    saveHeaderBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 70, alignItems: 'center',
    },
    saveHeaderText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    section: { marginBottom: 4, paddingTop: 16 },
    sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10, paddingHorizontal: 16 },
    sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
    // Photo
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
      width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    },
    removePhotoText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    // Inputs
    titleInput: {
      height: 48, borderRadius: 12, borderWidth: 1.5,
      paddingHorizontal: 14, fontSize: 15,
    },
    descInput: {
      minHeight: 100, borderRadius: 12, borderWidth: 1.5,
      paddingHorizontal: 14, paddingTop: 12, fontSize: 14, lineHeight: 20,
    },
    aiBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, minWidth: 50, alignItems: 'center' },
    aiBtnText: { fontSize: 13, fontWeight: '700' },
    aiCaptionBox: { marginTop: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
    aiCaptionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    aiCaptionText: { fontSize: 13, lineHeight: 19 },
    // Location
    locationBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14,
    },
    locationBtnEmoji: { fontSize: 18 },
    locationBtnText: { fontSize: 14, flex: 1 },
    // Tags
    tagInputRow: { flexDirection: 'row', gap: 8 },
    tagInput: {
      flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, fontSize: 14,
    },
    addTagBtn: {
      width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    },
    addTagBtnText: { color: '#fff', fontSize: 22, fontWeight: '300' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
    tagChipText: { fontSize: 12, fontWeight: '500' },
  });
}
