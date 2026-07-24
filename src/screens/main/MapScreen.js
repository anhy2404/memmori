// src/screens/main/MapScreen.js - Bản đồ Việt Nam với markers kỷ niệm
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform,
  Modal, ScrollView, Image, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';

// Vùng ban đầu - trung tâm Việt Nam
const VIETNAM_REGION = {
  latitude: 16.0,
  longitude: 107.8,
  latitudeDelta: 15.0,
  longitudeDelta: 8.0,
};

const SPECIAL_MARKERS = [
  { id: 'hoangsa', lat: 16.5, lng: 112.0, name: 'Quần đảo Hoàng Sa', emoji: '🏝️', color: '#1A6FD4' },
  { id: 'truongsa', lat: 10.0, lng: 114.0, name: 'Quần đảo Trường Sa', emoji: '🏝️', color: '#0EA5C9' },
];

// Modal chi tiết memory
function MemoryDetailModal({ memory, visible, onClose, theme, t }) {
  // Giữ memory ref để tránh flash khi đóng modal
  const memoryRef = useRef(memory);
  if (memory) memoryRef.current = memory;
  const displayMemory = memoryRef.current;

  if (!displayMemory) return null;

  const firstPhoto = displayMemory.photos?.[0] || null;
  const dateStr = new Date(displayMemory.createdAt).toLocaleDateString('vi-VN');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[modalStyles.content, { backgroundColor: theme.colors.card }]}>
          {firstPhoto ? (
            <Image source={{ uri: firstPhoto }} style={modalStyles.image} resizeMode="cover" />
          ) : (
            <View style={[modalStyles.imagePlaceholder, { backgroundColor: theme.colors.highlight }]}>
              <Text style={{ fontSize: 40 }}>📝</Text>
            </View>
          )}
          <View style={modalStyles.body}>
            <Text style={[modalStyles.title, { color: theme.colors.text }]}>{displayMemory.title}</Text>
            {displayMemory.description ? (
              <Text style={[modalStyles.desc, { color: theme.colors.textSecondary }]} numberOfLines={3}>
                {displayMemory.description}
              </Text>
            ) : null}
            <View style={modalStyles.meta}>
              {displayMemory.location?.address ? (
                <Text style={[modalStyles.metaText, { color: theme.colors.textTertiary }]}>
                  📍 {displayMemory.location.address}
                </Text>
              ) : null}
              <Text style={[modalStyles.metaText, { color: theme.colors.textTertiary }]}>
                🗓️ {dateStr}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[modalStyles.closeBtn, { backgroundColor: theme.colors.primary }]}
            onPress={onClose}
          >
            <Text style={modalStyles.closeBtnText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function MapScreen({ navigation }) {
  const { theme, t } = useApp();
  const { user } = useAuth();
  const { getMemoriesWithLocation } = useMemory();

  const mapRef = useRef(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // useMemo để tránh tính lại mỗi render
  const memoriesWithLocation = useMemo(
    () => getMemoriesWithLocation(user?.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, getMemoriesWithLocation]
  );

  // Xin quyền khi mount (không block UI, không show alert)
  useEffect(() => {
    Location.getForegroundPermissionsAsync().catch(() => {});
  }, []);

  const goToMyLocation = useCallback(async () => {
    if (isLocating) return;
    setIsLocating(true);
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

      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          mayShowUserSettingsDialog: true,
        });
      } catch {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const { latitude, longitude } = location.coords;
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800);
    } catch (error) {
      console.error('[MapScreen] Lỗi lấy vị trí:', error);
      Alert.alert(t('common.error'), t('map.locationError'));
    } finally {
      setIsLocating(false);
    }
  }, [isLocating, t]);

  const handleMarkerPress = useCallback((memory) => {
    setSelectedMemory(memory);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  function getMarkerEmoji(memory) {
    if (memory.photos?.length > 0) return '📸';
    if (memory.video) return '🎥';
    return '📍';
  }

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.header }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>
          {t('map.title')}
        </Text>
        <Text style={[styles.headerCount, { color: theme.colors.primary }]}>
          {memoriesWithLocation.length} {t('map.memories')}
        </Text>
      </View>

      {/* Bản đồ */}
      <MapView
        ref={mapRef}
        style={styles.map}
        // Dùng default provider để tương thích Expo Go (không cần Google Maps API key)
        provider={undefined}
        initialRegion={VIETNAM_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsScale
        loadingEnabled
        loadingIndicatorColor={theme.colors.primary}
        loadingBackgroundColor={theme.colors.background}
      >
        {/* Markers memories */}
        {memoriesWithLocation.map(memory => (
          <Marker
            key={memory.id}
            coordinate={{ latitude: memory.location.lat, longitude: memory.location.lng }}
            onPress={() => handleMarkerPress(memory)}
            tracksViewChanges={false}
          >
            <View style={[styles.markerContainer, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.markerEmoji}>{getMarkerEmoji(memory)}</Text>
            </View>
            <View style={[styles.markerArrow, { borderTopColor: theme.colors.primary }]} />
          </Marker>
        ))}

        {/* Markers đặc biệt: Hoàng Sa, Trường Sa */}
        {SPECIAL_MARKERS.map(marker => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.lat, longitude: marker.lng }}
            title={marker.name}
            tracksViewChanges={false}
          >
            <View style={[styles.specialMarker, { backgroundColor: marker.color }]}>
              <Text style={styles.specialMarkerEmoji}>{marker.emoji}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Nút vị trí */}
      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: theme.colors.card, ...theme.shadows.md, opacity: isLocating ? 0.7 : 1 }]}
        onPress={goToMyLocation}
        disabled={isLocating}
        activeOpacity={0.8}
      >
        {isLocating
          ? <ActivityIndicator color={theme.colors.primary} size="small" />
          : <Text style={styles.locationBtnEmoji}>📍</Text>
        }
        <Text style={[styles.locationBtnText, { color: theme.colors.primary }]}>
          {t('map.myLocation')}
        </Text>
      </TouchableOpacity>

      {/* Empty state */}
      {memoriesWithLocation.length === 0 && (
        <View style={[styles.emptyOverlay, { backgroundColor: theme.colors.card + 'EE' }]}>
          <Text style={{ fontSize: 32 }}>🗺️</Text>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {t('map.noMemoriesOnMap')}
          </Text>
          <TouchableOpacity
            style={[styles.createMemoryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Create')}
          >
            <Text style={styles.createMemoryBtnText}>+ {t('create.title')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <MemoryDetailModal
        memory={selectedMemory}
        visible={modalVisible}
        onClose={handleCloseModal}
        theme={theme}
        t={t}
      />
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  image: { width: '100%', height: 200 },
  imagePlaceholder: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  meta: { gap: 4 },
  metaText: { fontSize: 12 },
  closeBtn: { margin: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    headerCount: { fontSize: 14, fontWeight: '600' },
    map: { flex: 1 },
    markerContainer: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: '#fff',
    },
    markerEmoji: { fontSize: 18 },
    markerArrow: {
      width: 0, height: 0,
      borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
      borderLeftColor: 'transparent', borderRightColor: 'transparent',
      alignSelf: 'center', marginTop: -1,
    },
    specialMarker: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: '#fff', opacity: 0.85,
    },
    specialMarkerEmoji: { fontSize: 14 },
    locationBtn: {
      position: 'absolute', bottom: 100, right: 16,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, minWidth: 44,
    },
    locationBtnEmoji: { fontSize: 16 },
    locationBtnText: { fontSize: 13, fontWeight: '600' },
    emptyOverlay: {
      position: 'absolute', bottom: 160, alignSelf: 'center',
      width: 240, padding: 16, borderRadius: 16,
      alignItems: 'center', gap: 8,
    },
    emptyText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
    createMemoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
    createMemoryBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  });
}
