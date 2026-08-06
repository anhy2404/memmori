// src/screens/main/CreateScreen.js - Tạo kỷ niệm mới
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, ActivityIndicator,
  Dimensions, Linking, BackHandler, FlatList, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';
import { generateCaption } from '../../services/geminiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// ===== PRIVACY OPTIONS =====
// PRIVACY_OPTIONS được tạo động theo ngôn ngữ (xem bên trong component)

// Helper: xin quyền với fallback mở Settings
async function requestPermission(requestFn, openSettingsMsg, cancelText, openSettingsText) {
  try {
    const { status: existing } = await requestFn(false);
    if (existing === 'granted') return true;

    const { status, canAskAgain } = await requestFn(true);
    if (status === 'granted') return true;

    if (!canAskAgain) {
      Alert.alert(
        '⚙️',
        openSettingsMsg,
        [
          { text: cancelText, style: 'cancel' },
          { text: openSettingsText, onPress: () => Linking.openSettings() },
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

  // Privacy options - i18n
  const PRIVACY_OPTIONS = useMemo(() => [
    { value: 'private', label: `🔒 ${t('privacy.onlyMe')}`,  desc: t('privacy.privateDesc') },
    { value: 'public',  label: `🌐 ${t('privacy.public')}`,   desc: t('privacy.publicDesc') },
  ], [t]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [location, setLocation] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [aiCaption, setAiCaption] = useState('');
  const [privacy, setPrivacy] = useState('private'); // 'private' | 'public'
  const [taggedUsers, setTaggedUsers] = useState([]); // [{ id, fullName, email }]
  const [tagUserInput, setTagUserInput] = useState('');
  const [tagUserResults, setTagUserResults] = useState([]);
  const [showTagUserModal, setShowTagUserModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Tự động lấy vị trí khi mở màn hình
  useEffect(() => {
    autoGetLocation();
  }, []);

  // Hàm lấy GPS dùng chung (auto + manual)
  const fetchLocation = useCallback(async () => {
    setIsLoadingLocation(true);
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

      // Reverse geocoding - loại bỏ trùng lặp, lấy địa chỉ sạch
      let address = '';
      let locationName = '';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const g = geocode[0];

          // Tập hợp các phần địa chỉ duy nhất (không trùng)
          const seen = new Set();
          const uniquePart = (val) => {
            if (!val) return null;
            const v = val.trim();
            if (!v || seen.has(v.toLowerCase())) return null;
            seen.add(v.toLowerCase());
            return v;
          };

          const parts = [];

          // Tên địa điểm cụ thể (quán, đường, tòa nhà...)
          const namePart = uniquePart(g.name);
          // Chỉ thêm name nếu khác street (tránh "Nguyễn Huệ, Nguyễn Huệ")
          if (namePart && namePart !== g.street?.trim()) parts.push(namePart);

          // Đường / phường / xã
          if (uniquePart(g.street)) parts.push(g.street.trim());
          if (uniquePart(g.district)) parts.push(g.district.trim());
          // Thành phố / tỉnh
          if (uniquePart(g.city)) parts.push(g.city.trim());
          // Quốc gia (chỉ hiện nếu không phải VN hoặc chưa rõ)
          const isVN = [g.country, g.region].some(p =>
            p?.toLowerCase().includes('việt nam') ||
            p?.toLowerCase().includes('vietnam')
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
    } catch (error) {
      console.error('[CreateScreen] Lỗi lấy vị trí:', error);
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  // Tự động lấy vị trí khi mount (silent - không alert nếu từ chối)
  const autoGetLocation = useCallback(async () => {
    const result = await fetchLocation();
    if (result) setLocation(result);
  }, [fetchLocation]);

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

  // ===== TÌM KIẾM NGƯỜI DÙNG ĐỂ GẮN THẺ =====
  const searchUsers = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setTagUserResults([]);
      return;
    }
    try {
      const db = await AsyncStorage.getItem('@memorymap_users_db');
      const users = db ? JSON.parse(db) : [];
      const q = query.toLowerCase().trim();
      const results = users
        .filter(u =>
          u.id !== user?.id && // Không tự tag mình
          (u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
        )
        .slice(0, 6)
        .map(u => ({ id: u.id, fullName: u.fullName, email: u.email }));
      setTagUserResults(results);
    } catch {
      setTagUserResults([]);
    }
  }, [user?.id]);

  const handleTagUserInput = useCallback((text) => {
    setTagUserInput(text);
    searchUsers(text);
  }, [searchUsers]);

  const addTaggedUser = useCallback((u) => {
    if (!taggedUsers.find(t => t.id === u.id) && taggedUsers.length < 10) {
      setTaggedUsers(prev => [...prev, u]);
    }
    setTagUserInput('');
    setTagUserResults([]);
    setShowTagUserModal(false);
  }, [taggedUsers]);

  const removeTaggedUser = useCallback((userId) => {
    setTaggedUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

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
        privacy,
        taggedUsers,
        ownerName: user?.fullName || '',
        userId: user?.id,
      });
      Alert.alert('✅', t('create.saveSuccess'), [
        {
          text: t('common.ok'),
          onPress: () => {
            setTitle(''); setDescription(''); setPhotos([]);
            setLocation(null); setTags([]); setAiCaption('');
            setPrivacy('private'); setTaggedUsers([]);
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
      {/* Header gọn */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('create.title')}</Text>
        {isSaving && <ActivityIndicator color={theme.colors.primary} size="small" />}
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
              <Text style={[styles.aiCaptionLabel, { color: theme.colors.primary }]}>{t('create.aiSuggested')}</Text>
              <Text style={[styles.aiCaptionText, { color: theme.colors.text }]}>{aiCaption}</Text>
            </View>
          ) : null}
        </View>

        {/* ===== VỊ TRÍ ===== */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>📍 {t('create.locationLabel')}</Text>
          <View style={[styles.locationDisplay, {
            backgroundColor: location ? theme.colors.success + '15' : theme.colors.highlight,
            borderColor: location ? theme.colors.success : theme.colors.border,
          }]}>
            {isLoadingLocation ? (
              <>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <Text style={[styles.locationDisplayText, { color: theme.colors.textSecondary }]}>
                  {t('create.locating')}
                </Text>
              </>
            ) : location ? (
              <>
                <Text style={styles.locationDisplayEmoji}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locationDisplayName, { color: theme.colors.success }]} numberOfLines={1}>
                    {location.name}
                  </Text>
                  <Text style={[styles.locationDisplayAddress, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {location.address}
                  </Text>
                </View>
                <Text style={[styles.locationBadge, { backgroundColor: theme.colors.success + '20', color: theme.colors.success }]}>
                  {t('create.locationGpsOk')}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.locationDisplayEmoji}>🔍</Text>
                <Text style={[styles.locationDisplayText, { color: theme.colors.textTertiary }]}>
                  {t('create.locationUnknown')}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* ===== TAGS ===== */}
        <View style={[styles.section, { paddingHorizontal: 16, paddingBottom: 8 }]}>
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

        {/* ===== GẮN THẺ NGƯỜI DÙNG ===== */}
        <View style={[styles.section, { paddingHorizontal: 16, paddingBottom: 8 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>{t('create.taggedUsersLabel')}</Text>
          <TouchableOpacity
            style={[styles.tagUserBtn, { borderColor: theme.colors.primary, backgroundColor: theme.colors.highlight }]}
            onPress={() => { setTagUserInput(''); setTagUserResults([]); setShowTagUserModal(true); }}
          >
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <Text style={[{ fontSize: 13, color: theme.colors.primary, fontWeight: '600' }]}>
              {t('create.taggedUsersSearch')}
            </Text>
          </TouchableOpacity>
          {taggedUsers.length > 0 && (
            <View style={styles.taggedUsersRow}>
              {taggedUsers.map((u) => (
                <View key={u.id} style={[styles.taggedUserChip, { backgroundColor: theme.colors.primarySoft || theme.colors.highlight, borderColor: theme.colors.primary }]}>
                  <Text style={{ fontSize: 14 }}>👤</Text>
                  <Text style={[{ fontSize: 12, color: theme.colors.primary, fontWeight: '600', maxWidth: 90 }]} numberOfLines={1}>
                    {u.fullName}
                  </Text>
                  <TouchableOpacity onPress={() => removeTaggedUser(u.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ===== QUYỀN RIÊNG TƯ ===== */}
        <View style={[styles.section, { paddingHorizontal: 16, paddingBottom: 32 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>{t('privacy.sectionLabel')}</Text>

          {/* Compact pill toggle */}
          <View style={[styles.privacyPill, {
            backgroundColor: theme.colors.highlight,
            borderColor: theme.colors.inputBorder,
          }]}>
            {PRIVACY_OPTIONS.map((opt) => {
              const isActive = privacy === opt.value;
              const isPublicOpt = opt.value === 'public';
              const activeColor = isPublicOpt ? '#16a34a' : theme.colors.primary;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.privacyPillBtn,
                    isActive && { backgroundColor: activeColor },
                  ]}
                  onPress={() => setPrivacy(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14 }}>{isPublicOpt ? '🌐' : '🔒'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.privacyPillLabel,
                      { color: isActive ? '#fff' : theme.colors.text },
                    ]}>
                      {isPublicOpt ? t('privacy.public') : t('privacy.onlyMe')}
                    </Text>
                    <Text style={[
                      styles.privacyPillDesc,
                      { color: isActive ? 'rgba(255,255,255,0.7)' : theme.colors.textTertiary },
                    ]}>
                      {opt.desc}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={styles.privacyCheck}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ===== MODAL TÌM NGƯỜI DÙNG ===== */}
      <Modal
        visible={showTagUserModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTagUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>👥 Gắn thẻ người dùng</Text>
              <TouchableOpacity onPress={() => setShowTagUserModal(false)}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 22 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, { color: theme.colors.text, borderColor: theme.colors.primary, backgroundColor: theme.colors.inputBackground }]}
              placeholder={t('create.taggedUsersPlaceholder')}
              placeholderTextColor={theme.colors.placeholder}
              value={tagUserInput}
              onChangeText={handleTagUserInput}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {tagUserResults.length > 0 ? (
              <FlatList
                data={tagUserResults}
                keyExtractor={item => item.id}
                style={{ maxHeight: 240 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.userResultItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => addTaggedUser(item)}
                  >
                    <View style={[styles.userAvatar, { backgroundColor: theme.colors.primary + '30' }]}>
                      <Text style={{ fontSize: 18 }}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }]}>
                        {item.fullName}
                      </Text>
                      <Text style={[{ color: theme.colors.textSecondary, fontSize: 12 }]}>
                        {item.email}
                      </Text>
                    </View>
                    <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>{t('create.taggedUsersAdd')}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : tagUserInput.length >= 2 ? (
              <View style={{ alignItems: 'center', padding: 24 }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{t('create.taggedUsersNotFound')}</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', padding: 24 }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{t('create.taggedUsersMinChars')}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ===== NÚT LƯU KỶ NIỆM (bottom sticky) ===== */}
      <View style={[styles.saveFooter, {
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.border,
        shadowColor: theme.colors.primary,
      }]}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: theme.colors.primary },
            isSaving && styles.btnDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.saveBtnEmoji}>📷</Text>
              <Text style={styles.saveBtnText}>{t('create.saveMemory')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    locationDisplay: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      minHeight: 56, borderRadius: 12, borderWidth: 1.5,
      paddingHorizontal: 14, paddingVertical: 12,
    },
    locationDisplayEmoji: { fontSize: 20 },
    locationDisplayName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    locationDisplayAddress: { fontSize: 12, lineHeight: 17 },
    locationDisplayText: { fontSize: 13, flex: 1 },
    locationBadge: {
      fontSize: 11, fontWeight: '700', paddingHorizontal: 8,
      paddingVertical: 3, borderRadius: 8, overflow: 'hidden',
    },
    tagInputRow: { flexDirection: 'row', gap: 8 },
    tagInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, fontSize: 14 },
    addTagBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    addTagBtnText: { color: '#fff', fontSize: 22, fontWeight: '300' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
    tagChipText: { fontSize: 12, fontWeight: '500' },
    // Tag người dùng
    tagUserBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
    },
    taggedUsersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    taggedUserChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 14, borderWidth: 1.5,
    },
    // Privacy pill (compact)
    privacyPill: {
      borderRadius: 14, borderWidth: 1.5,
      overflow: 'hidden', padding: 4, gap: 4,
    },
    privacyPillBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    },
    privacyPillLabel: { fontSize: 13, fontWeight: '700' },
    privacyPillDesc:  { fontSize: 10, lineHeight: 14 },
    privacyCheck: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
    },
    // Modal
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalBox: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, minHeight: 320,
    },
    modalHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 16,
    },
    modalTitle: { fontSize: 17, fontWeight: '800' },
    modalInput: {
      height: 46, borderRadius: 12, borderWidth: 1.5,
      paddingHorizontal: 14, fontSize: 14, marginBottom: 8,
    },
    userResultItem: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, borderBottomWidth: 1,
    },
    userAvatar: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
    },
    // Nút lưu bottom
    saveFooter: {
      paddingHorizontal: 16, paddingVertical: 12,
      borderTopWidth: 1,
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 8,
    },
    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, height: 54, borderRadius: 27,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    saveBtnEmoji: { fontSize: 20 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  });
}
