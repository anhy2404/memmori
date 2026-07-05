// src/screens/main/MapScreen.js - Bản đồ Việt Nam với markers kỷ niệm
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform,
  Modal, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
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

// Tọa độ đặc biệt
const SPECIAL_MARKERS = [
  { id: 'hoangsa', lat: 16.5, lng: 112.0, name: 'Quần đảo Hoàng Sa', emoji: '🏝️', color: '#E84393' },
  { id: 'truongsa', lat: 10.0, lng: 114.0, name: 'Quần đảo Trường Sa', emoji: '🏝️', color: '#E84393' },
];

// Component chi tiết memory popup
function MemoryDetailModal({ memory, visible, onClose, theme, t }) {
  if (!memory) return null;
  const firstPhoto = memory.photos && memory.photos.length > 0 ? memory.photos[0] : null;
  const dateStr = new Date(memory.createdAt).toLocaleDateString('vi-VN');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
        >
          {firstPhoto ? (
            <Image source={{ uri: firstPhoto }} style={styles.modalImage} resizeMode="cover" />
          ) : (
            <View style={[styles.modalImagePlaceholder, { backgroundColor: theme.colors.highlight }]}>
              <Text style={{ fontSize: 40 }}>📝</Text>
            </View>
          )}
          <View style={styles.modalBody}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{memory.title}</Text>
            {memory.description ? (
              <Text style={[styles.modalDesc, { color: theme.colors.textSecondary }]} numberOfLines={3}>
                {memory.description}
              </Text>
            ) : null}
            <View style={styles.modalMeta}>
              {memory.location?.address ? (
                <Text style={[styles.modalMetaText, { color: theme.colors.textTertiary }]}>
                  📍 {memory.location.address}
                </Text>
              ) : null}
              <Text style={[styles.modalMetaText, { color: theme.colors.textTertiary }]}>
                🗓️ {dateStr}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.modalCloseBtn, { backgroundColor: theme.colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
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
  const [userLocation, setUserLocation] = useState(null);

  // Lấy memories có vị trí
  const memoriesWithLocation = getMemoriesWithLocation(user?.id);

  // Xin quyền vị trí khi mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  async function requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Không show alert - user có thể không cần GPS
        return;
      }
    } catch (error) {
      console.error('[MapScreen] Lỗi xin quyền vị trí:', error);
    }
  }

  // Lấy vị trí hiện tại
  async function goToMyLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('map.locationPermissionDenied'));
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    } catch (error) {
      Alert.alert(t('common.error'), t('map.locationError'));
    }
  }

  // Nhấn vào marker memory
  function handleMarkerPress(memory) {
    setSelectedMemory(memory);
    setModalVisible(true);
  }

  // Màu marker theo số ảnh
  function getMarkerEmoji(memory) {
    if (memory.photos && memory.photos.length > 0) return '📸';
    if (memory.video) return '🎥';
    return '📍';
  }

  const styles = makeStyles(theme);

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
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={VIETNAM_REGION}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass
        showsScale
      >
        {/* Markers cho memories */}
        {memoriesWithLocation.map(memory => (
          <Marker
            key={memory.id}
            coordinate={{
              latitude: memory.location.lat,
              longitude: memory.location.lng,
            }}
            onPress={() => handleMarkerPress(memory)}
          >
            {/* Custom marker */}
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
          >
            <View style={[styles.specialMarker, { backgroundColor: marker.color }]}>
              <Text style={styles.specialMarkerEmoji}>{marker.emoji}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Nút vị trí của tôi */}
      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: theme.colors.card, ...theme.shadows.md }]}
        onPress={goToMyLocation}
        activeOpacity={0.8}
      >
        <Text style={styles.locationBtnEmoji}>📍</Text>
        <Text style={[styles.locationBtnText, { color: theme.colors.primary }]}>
          {t('map.myLocation')}
        </Text>
      </TouchableOpacity>

      {/* Thông tin về bản đồ */}
      {memoriesWithLocation.length === 0 ? (
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
      ) : null}

      {/* Modal chi tiết */}
      <MemoryDetailModal
        memory={selectedMemory}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        theme={theme}
        t={t}
      />
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors?.border || '#E0E3EB',
    },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    headerCount: { fontSize: 14, fontWeight: '600' },
    map: { flex: 1 },
    // Custom marker
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
    // Special marker
    specialMarker: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: '#fff', opacity: 0.85,
    },
    specialMarkerEmoji: { fontSize: 14 },
    // Location button
    locationBtn: {
      position: 'absolute', bottom: 100, right: 16,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24,
    },
    locationBtnEmoji: { fontSize: 16 },
    locationBtnText: { fontSize: 13, fontWeight: '600' },
    // Empty overlay
    emptyOverlay: {
      position: 'absolute', bottom: 160, left: '50%',
      transform: [{ translateX: -120 }],
      width: 240, padding: 16, borderRadius: 16,
      alignItems: 'center', gap: 8,
    },
    emptyText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
    createMemoryBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
    },
    createMemoryBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    // Modal
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
    },
    modalImage: { width: '100%', height: 200 },
    modalImagePlaceholder: {
      width: '100%', height: 120, alignItems: 'center', justifyContent: 'center',
    },
    modalBody: { padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
    modalDesc: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
    modalMeta: { gap: 4 },
    modalMetaText: { fontSize: 12 },
    modalCloseBtn: {
      margin: 16, paddingVertical: 14, borderRadius: 12,
      alignItems: 'center',
    },
    modalCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}
