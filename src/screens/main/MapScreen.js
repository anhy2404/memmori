// src/screens/main/MapScreen.js - Bản đồ Việt Nam với markers kỷ niệm
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform,
  Modal, ScrollView, Image, Linking, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polygon, Circle } from 'react-native-maps';
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

// ===== QUẦN ĐẢO HOÀNG SA (Paracel Islands) =====
// Tọa độ & kích thước từ: Wikipedia, CIA, geo-ref.net
//
// 1° lat ≈ 111,320 m | 1° lng @ 16.8°N ≈ 106,600 m | @ 16.3°N ≈ 106,820 m

// ─── Đảo Phú Lâm / Woody Island ──────────────────────────────────────────
// Tâm: 16°50'3"N 112°20'15"E  |  1850m × 1160m  |  hướng WSW-ENE ~15°
// dlat = 1160/(2×111320) = 0.00521°  |  dlng = 1850/(2×106600) = 0.00868°
const PHU_LAM_POLYGON = [
  // xấp xỉ hình chữ nhật hơi nghiêng, theo chiều dài WSW–ENE
  { latitude: 16.8337 - 0.00521 + 0.0008, longitude: 112.3443 - 0.00868 }, // SW
  { latitude: 16.8337 - 0.00521,          longitude: 112.3443 + 0.00868 }, // SE
  { latitude: 16.8337 + 0.00521 - 0.0008, longitude: 112.3443 + 0.00868 }, // NE
  { latitude: 16.8337 + 0.00521,          longitude: 112.3443 - 0.00868 }, // NW
];
// Atoll / reef ring xung quanh Phú Lâm (~4km × 3.5km)
const PHU_LAM_REEF = [
  { latitude: 16.8337 - 0.0175, longitude: 112.3443 - 0.0210 },
  { latitude: 16.8337 - 0.0175, longitude: 112.3443 + 0.0210 },
  { latitude: 16.8337 + 0.0175, longitude: 112.3443 + 0.0210 },
  { latitude: 16.8337 + 0.0175, longitude: 112.3443 - 0.0210 },
];

// ─── Đảo Hoàng Sa / Pattle Island ────────────────────────────────────────
// Tâm: 16°32'5"N 111°36'30"E  |  820m × 420m  |  hình oval N-S
// dlat = 420/(2×111320) = 0.00189°  |  dlng = 820/(2×106820) = 0.00384°
const PATTLE_POLYGON = [
  // Oval 8 điểm
  { latitude: 16.3347 + 0.00189,          longitude: 111.6083              }, // N
  { latitude: 16.3347 + 0.00134,          longitude: 111.6083 + 0.00272    }, // NE
  { latitude: 16.3347,                    longitude: 111.6083 + 0.00384    }, // E
  { latitude: 16.3347 - 0.00134,          longitude: 111.6083 + 0.00272    }, // SE
  { latitude: 16.3347 - 0.00189,          longitude: 111.6083              }, // S
  { latitude: 16.3347 - 0.00134,          longitude: 111.6083 - 0.00272    }, // SW
  { latitude: 16.3347,                    longitude: 111.6083 - 0.00384    }, // W
  { latitude: 16.3347 + 0.00134,          longitude: 111.6083 - 0.00272    }, // NW
];
// Reef/atoll ring Pattle (~2.5km × 2km)
const PATTLE_REEF = [
  { latitude: 16.3347 - 0.0095, longitude: 111.6083 - 0.0120 },
  { latitude: 16.3347 + 0.0095, longitude: 111.6083 - 0.0100 },
  { latitude: 16.3347 + 0.0095, longitude: 111.6083 + 0.0120 },
  { latitude: 16.3347 - 0.0095, longitude: 111.6083 + 0.0100 },
];

// ─── Các đảo nhóm Lưỡi Liềm còn lại (dùng Circle) ───────────────────────
const CRESCENT_OTHERS = [
  { id: 'hs_money',    vn: 'Đảo Quang Ảnh', lat: 16.4437, lng: 111.4633, r: 300 },
  { id: 'hs_robert',   vn: 'Đảo Hữu Nhật',  lat: 16.4972, lng: 111.5556, r: 250 },
  { id: 'hs_drummond', vn: 'Đảo Duy Mộng',  lat: 16.4833, lng: 111.7333, r: 230 },
  { id: 'hs_duncan',   vn: 'Đảo Quang Hoà', lat: 16.4530, lng: 111.7200, r: 270 },
  { id: 'hs_triton',   vn: 'Đảo Tri Tôn',   lat: 15.7833, lng: 111.2000, r: 450 },
  { id: 'hs_passu',    vn: 'Bãi Bạch Quy',  lat: 16.0556, lng: 111.7619, r: 150 },
];

// ─── Nhóm An Vĩnh / Amphitrite: Đảo Linh Côn và các đảo nhỏ ─────────────
// Đảo Linh Côn (Lincoln): ~600m × 350m
const LINCOLN_POLYGON = [
  { latitude: 16.6653 - 0.00157, longitude: 112.7267 - 0.00329 },
  { latitude: 16.6653 + 0.00157, longitude: 112.7267 - 0.00329 },
  { latitude: 16.6653 + 0.00157, longitude: 112.7267 + 0.00329 },
  { latitude: 16.6653 - 0.00157, longitude: 112.7267 + 0.00329 },
];
const AMPHITRITE_OTHERS = [
  { id: 'hs_tree',   vn: 'Đảo Cây',  lat: 16.9833, lng: 112.2667, r: 200 },
  { id: 'hs_north',  vn: 'Đảo Bắc',  lat: 17.0853, lng: 112.3006, r: 170 },
  { id: 'hs_middle', vn: 'Đảo Giữa', lat: 17.0672, lng: 112.3186, r: 150 },
  { id: 'hs_south',  vn: 'Đảo Nam',  lat: 17.0503, lng: 112.3338, r: 150 },
  { id: 'hs_rocky',  vn: 'Đảo Đá',   lat: 16.8440, lng: 112.3564, r: 160 }, // Rocky Island sát Phú Lâm
];

// Polygon vùng Crescent Group (đường bao)
const CRESCENT_ZONE = [
  { latitude: 16.60, longitude: 111.10 },
  { latitude: 16.60, longitude: 111.90 },
  { latitude: 15.72, longitude: 111.28 },
  { latitude: 15.72, longitude: 111.10 },
];
// Polygon vùng Amphitrite Group
const AMPHITRITE_ZONE = [
  { latitude: 17.15, longitude: 112.20 },
  { latitude: 17.15, longitude: 112.82 },
  { latitude: 16.58, longitude: 112.82 },
  { latitude: 16.58, longitude: 112.20 },
];

// ===== QUẦN ĐẢO TRƯỜNG SA (Spratly Islands) =====
// Tọa độ: Wikipedia, AMTI/CSIS, UN legal maps

// ─── Đảo Ba Bình / Itu Aba ── lớn nhất Trường Sa: ~1400m × 400m ──────────
// Tâm: 10°22'37"N 114°21'56"E  |  dlat=0.00180°  dlng=0.00648°
const ITU_ABA_POLYGON = [
  // Hình dài theo hướng E-W
  { latitude: 10.3770 - 0.00180, longitude: 114.3656 - 0.00648 }, // SW
  { latitude: 10.3770 + 0.00180, longitude: 114.3656 - 0.00648 }, // NW
  { latitude: 10.3770 + 0.00180, longitude: 114.3656 + 0.00648 }, // NE
  { latitude: 10.3770 - 0.00180, longitude: 114.3656 + 0.00648 }, // SE
];

// ─── Đảo Trường Sa Lớn / Spratly Island ── ~400m × 350m oval ────────────
// Tâm: 8°38'41"N 111°55'12"E  |  dlat=0.00157°  dlng=0.00185°
const SPRATLY_I_POLYGON = [
  { latitude: 8.6447 + 0.00157,       longitude: 111.9200               }, // N
  { latitude: 8.6447 + 0.00111,       longitude: 111.9200 + 0.00131     }, // NE
  { latitude: 8.6447,                 longitude: 111.9200 + 0.00185     }, // E
  { latitude: 8.6447 - 0.00111,       longitude: 111.9200 + 0.00131     }, // SE
  { latitude: 8.6447 - 0.00157,       longitude: 111.9200               }, // S
  { latitude: 8.6447 - 0.00111,       longitude: 111.9200 - 0.00131     }, // SW
  { latitude: 8.6447,                 longitude: 111.9200 - 0.00185     }, // W
  { latitude: 8.6447 + 0.00111,       longitude: 111.9200 - 0.00131     }, // NW
];

// ─── Đảo Song Tử Tây / Southwest Cay ── ~700m × 250m ─────────────────────
// Tâm: 11°27'39"N 114°19'49"E
const SW_CAY_POLYGON = [
  { latitude: 11.4608 - 0.00112, longitude: 114.3303 - 0.00321 },
  { latitude: 11.4608 + 0.00112, longitude: 114.3303 - 0.00321 },
  { latitude: 11.4608 + 0.00112, longitude: 114.3303 + 0.00321 },
  { latitude: 11.4608 - 0.00112, longitude: 114.3303 + 0.00321 },
];

// ─── Đảo Nam Yết / Namyit ── ~500m × 150m ────────────────────────────────
const NAMYIT_POLYGON = [
  { latitude: 10.1792 - 0.00067, longitude: 114.3575 - 0.00230 },
  { latitude: 10.1792 + 0.00067, longitude: 114.3575 - 0.00230 },
  { latitude: 10.1792 + 0.00067, longitude: 114.3575 + 0.00230 },
  { latitude: 10.1792 - 0.00067, longitude: 114.3575 + 0.00230 },
];

// ─── Các đảo/đá khác (dùng Circle) ──────────────────────────────────────
const SPRATLY_OTHERS = [
  { id: 'ts_sincowe',   vn: 'Đảo Sinh Tồn',    lat: 9.8833,  lng: 114.3292, r: 280 },
  { id: 'ts_sincowe_e', vn: 'Sinh Tồn Đông',   lat: 9.9000,  lng: 114.4833, r: 200 },
  { id: 'ts_necay',     vn: 'Song Tử Đông',    lat: 11.5333, lng: 114.3667, r: 250 },
  { id: 'ts_thitu',     vn: 'Đảo Thị Tứ',      lat: 11.0500, lng: 114.2833, r: 400 },
  { id: 'ts_loaita',    vn: 'Đảo Loại Ta',     lat: 10.6667, lng: 114.4167, r: 200 },
  { id: 'ts_amboyna',   vn: 'Đảo An Bang',     lat: 7.8667,  lng: 112.9167, r: 200 },
  { id: 'ts_pearson',   vn: 'Đảo Phan Vinh',   lat: 8.9667,  lng: 113.6500, r: 300 },
  { id: 'ts_barque',    vn: 'Đảo Thuyền Chài', lat: 8.1667,  lng: 113.2833, r: 400 },
  { id: 'ts_ladd',      vn: 'Đá Lát',          lat: 8.6833,  lng: 111.6833, r: 350 },
  { id: 'ts_west',      vn: 'Đá Tây',          lat: 8.8500,  lng: 111.5833, r: 400 },
  { id: 'ts_swallow',   vn: 'Đá Hoa Lau',      lat: 7.3833,  lng: 113.8333, r: 500 },
];

// Polygon toàn vùng Trường Sa (đường bao chính xác hơn)
const SPRATLY_ZONE = [
  { latitude: 11.70, longitude: 114.10 },
  { latitude: 11.70, longitude: 114.60 },
  { latitude: 10.50, longitude: 116.20 },
  { latitude: 8.00,  longitude: 116.00 },
  { latitude: 7.20,  longitude: 114.60 },
  { latitude: 7.20,  longitude: 112.50 },
  { latitude: 8.30,  longitude: 111.30 },
  { latitude: 9.80,  longitude: 111.30 },
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

export default function MapScreen({ navigation, embedded = false }) {
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

  // Marker luôn là ngôi sao vàng ⭐ (yêu cầu thiết kế)
  function getMarkerEmoji() {
    return '⭐';
  }

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header - ẩn khi embedded vì MapDiscoverScreen đã có header riêng */}
      {!embedded && (
        <View style={[styles.header, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t('map.title')}
            </Text>
            {memoriesWithLocation.length > 0 && (
              <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>
                ⭐ {memoriesWithLocation.length} {t('map.memories')}
              </Text>
            )}
          </View>
          <View style={[styles.headerBadge, { backgroundColor: theme.colors.primarySoft }]}>
            <Text style={{ fontSize: 18 }}>🗺️</Text>
          </View>
        </View>
      )}

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
        {/* Markers memories - ngôi sao vàng ⭐ */}
        {memoriesWithLocation.map(memory => (
          <Marker
            key={memory.id}
            coordinate={{ latitude: memory.location.lat, longitude: memory.location.lng }}
            onPress={() => handleMarkerPress(memory)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1.0 }}
          >
            <View style={styles.starMarkerWrap}>
              <Text style={styles.starMarkerStar}>⭐</Text>
              <View style={[styles.starMarkerTail, { borderTopColor: '#FFD700' }]} />
            </View>
          </Marker>
        ))}

        {/* ══════════════════════════════════════════
            QUẦN ĐẢO HOÀNG SA
        ══════════════════════════════════════════ */}

        {/* Đường bao vùng Lưỡi Liềm (Crescent) */}
        <Polygon coordinates={CRESCENT_ZONE}
          strokeColor="rgba(26,111,212,0.4)" fillColor="rgba(26,111,212,0.04)"
          strokeWidth={1.2} lineDashPattern={[8, 5]} />
        {/* Đường bao vùng An Vĩnh (Amphitrite) */}
        <Polygon coordinates={AMPHITRITE_ZONE}
          strokeColor="rgba(26,111,212,0.4)" fillColor="rgba(26,111,212,0.04)"
          strokeWidth={1.2} lineDashPattern={[8, 5]} />

        {/* ── Đảo Phú Lâm (Woody) — Atoll ring + thân đảo ── */}
        <Polygon coordinates={PHU_LAM_REEF}
          strokeColor="rgba(26,111,212,0.35)" fillColor="rgba(56,189,248,0.12)"
          strokeWidth={1} />
        <Polygon coordinates={PHU_LAM_POLYGON}
          strokeColor="rgba(26,111,212,1)" fillColor="rgba(56,189,248,0.75)"
          strokeWidth={1.5} />
        <Marker coordinate={{ latitude: 16.8337, longitude: 112.3443 }}
          tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.islandNameTag}>
            <Text style={[styles.islandNameText, { color: '#0D4FA0' }]}>Đảo Phú Lâm</Text>
          </View>
        </Marker>

        {/* ── Đảo Hoàng Sa (Pattle) — Atoll ring + thân đảo oval ── */}
        <Polygon coordinates={PATTLE_REEF}
          strokeColor="rgba(26,111,212,0.35)" fillColor="rgba(56,189,248,0.12)"
          strokeWidth={1} />
        <Polygon coordinates={PATTLE_POLYGON}
          strokeColor="rgba(26,111,212,1)" fillColor="rgba(56,189,248,0.75)"
          strokeWidth={1.5} />
        <Marker coordinate={{ latitude: 16.3347, longitude: 111.6083 }}
          tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.islandNameTag}>
            <Text style={[styles.islandNameText, { color: '#0D4FA0' }]}>Đảo Hoàng Sa</Text>
          </View>
        </Marker>

        {/* ── Đảo Linh Côn (Lincoln) ── */}
        <Polygon coordinates={LINCOLN_POLYGON}
          strokeColor="rgba(26,111,212,0.9)" fillColor="rgba(56,189,248,0.6)"
          strokeWidth={1.2} />

        {/* ── Các đảo nhỏ Lưỡi Liềm & An Vĩnh ── */}
        {CRESCENT_OTHERS.map(isl => (
          <React.Fragment key={isl.id}>
            <Circle center={{ latitude: isl.lat, longitude: isl.lng }}
              radius={isl.r} strokeColor="rgba(26,111,212,0.9)"
              fillColor="rgba(56,189,248,0.65)" strokeWidth={1.2} />
            <Marker coordinate={{ latitude: isl.lat, longitude: isl.lng + 0.012 }}
              tracksViewChanges={false} anchor={{ x: 0, y: 0.5 }}>
              <View style={styles.islandMiniTag}>
                <Text style={[styles.islandMiniText, { color: '#0D4FA0' }]}>{isl.vn}</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}
        {AMPHITRITE_OTHERS.map(isl => (
          <React.Fragment key={isl.id}>
            <Circle center={{ latitude: isl.lat, longitude: isl.lng }}
              radius={isl.r} strokeColor="rgba(26,111,212,0.9)"
              fillColor="rgba(56,189,248,0.65)" strokeWidth={1.2} />
          </React.Fragment>
        ))}

        {/* Nhãn quần đảo Hoàng Sa */}
        <Marker coordinate={{ latitude: 16.45, longitude: 112.00 }}
          tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.archipeLabel}>
            <Text style={[styles.archipelNameText, { color: '#1A6FD4' }]}>🇻🇳 Quần đảo Hoàng Sa</Text>
          </View>
        </Marker>

        {/* ══════════════════════════════════════════
            QUẦN ĐẢO TRƯỜNG SA
        ══════════════════════════════════════════ */}

        {/* Đường bao toàn vùng */}
        <Polygon coordinates={SPRATLY_ZONE}
          strokeColor="rgba(14,165,201,0.4)" fillColor="rgba(14,165,201,0.03)"
          strokeWidth={1.2} lineDashPattern={[8, 5]} />

        {/* ── Đảo Ba Bình (Itu Aba) — lớn nhất Trường Sa ── */}
        <Polygon coordinates={ITU_ABA_POLYGON}
          strokeColor="rgba(14,165,201,1)" fillColor="rgba(103,215,239,0.75)"
          strokeWidth={1.5} />
        <Marker coordinate={{ latitude: 10.3770, longitude: 114.3656 }}
          tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.islandNameTag, { borderColor: 'rgba(14,165,201,0.5)' }]}>
            <Text style={[styles.islandNameText, { color: '#0A7A97' }]}>Đảo Ba Bình</Text>
          </View>
        </Marker>

        {/* ── Đảo Trường Sa Lớn (Spratly I.) ── */}
        <Polygon coordinates={SPRATLY_I_POLYGON}
          strokeColor="rgba(14,165,201,1)" fillColor="rgba(103,215,239,0.75)"
          strokeWidth={1.5} />
        <Marker coordinate={{ latitude: 8.6447, longitude: 111.9200 }}
          tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.islandNameTag, { borderColor: 'rgba(14,165,201,0.5)' }]}>
            <Text style={[styles.islandNameText, { color: '#0A7A97' }]}>Đảo Trường Sa Lớn</Text>
          </View>
        </Marker>

        {/* ── Đảo Song Tử Tây (SW Cay) ── */}
        <Polygon coordinates={SW_CAY_POLYGON}
          strokeColor="rgba(14,165,201,1)" fillColor="rgba(103,215,239,0.75)"
          strokeWidth={1.5} />
        <Marker coordinate={{ latitude: 11.4608, longitude: 114.3303 }}
          tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.islandNameTag, { borderColor: 'rgba(14,165,201,0.5)' }]}>
            <Text style={[styles.islandNameText, { color: '#0A7A97' }]}>Song Tử Tây</Text>
          </View>
        </Marker>

        {/* ── Đảo Nam Yết (Namyit) ── */}
        <Polygon coordinates={NAMYIT_POLYGON}
          strokeColor="rgba(14,165,201,1)" fillColor="rgba(103,215,239,0.75)"
          strokeWidth={1.5} />
        <Marker coordinate={{ latitude: 10.1792, longitude: 114.3575 }}
          tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.islandNameTag, { borderColor: 'rgba(14,165,201,0.5)' }]}>
            <Text style={[styles.islandNameText, { color: '#0A7A97' }]}>Đảo Nam Yết</Text>
          </View>
        </Marker>

        {/* ── Các đảo/đá nhỏ Trường Sa ── */}
        {SPRATLY_OTHERS.map(isl => (
          <React.Fragment key={isl.id}>
            <Circle center={{ latitude: isl.lat, longitude: isl.lng }}
              radius={isl.r} strokeColor="rgba(14,165,201,0.9)"
              fillColor="rgba(103,215,239,0.6)" strokeWidth={1.2} />
            <Marker coordinate={{ latitude: isl.lat, longitude: isl.lng + 0.018 }}
              tracksViewChanges={false} anchor={{ x: 0, y: 0.5 }}>
              <View style={[styles.islandMiniTag, { borderColor: 'rgba(14,165,201,0.35)' }]}>
                <Text style={[styles.islandMiniText, { color: '#0A7A97' }]}>{isl.vn}</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* Nhãn quần đảo Trường Sa */}
        <Marker coordinate={{ latitude: 9.5, longitude: 113.8 }}
          tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.archipeLabel, { borderColor: 'rgba(14,165,201,0.4)' }]}>
            <Text style={[styles.archipelNameText, { color: '#0A7A97' }]}>🇻🇳 Quần đảo Trường Sa</Text>
          </View>
        </Marker>
      </MapView>

      {/* Nút vị trí */}
      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: theme.colors.primary, opacity: isLocating ? 0.7 : 1 }]}
        onPress={goToMyLocation}
        disabled={isLocating}
        activeOpacity={0.8}
      >
        {isLocating
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={{ fontSize: 18 }}>📍</Text>
        }
        <Text style={styles.locationBtnText}>{t('map.myLocation')}</Text>
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
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(45,27,78,0.55)', justifyContent: 'flex-end' },
  content: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  image: { width: '100%', height: 200 },
  imagePlaceholder: { width: '100%', height: 110, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  meta: { gap: 4 },
  metaText: { fontSize: 12 },
  closeBtn: { margin: 16, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
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
    // ── Ngôi sao vàng marker ──
    starMarkerWrap: {
      alignItems: 'center',
    },
    starMarkerStar: {
      fontSize: 28,
      // bóng đổ giúp nổi bật trên map
      textShadowColor: 'rgba(0,0,0,0.4)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    },
    starMarkerTail: {
      width: 0, height: 0,
      borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7,
      borderLeftColor: 'transparent', borderRightColor: 'transparent',
      alignSelf: 'center', marginTop: -2,
    },
    // kept for compat (không dùng nữa nhưng tránh lỗi tham chiếu)
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
    // Nhãn tên quần đảo lớn
    archipeLabel: {
      backgroundColor: 'rgba(255,255,255,0.92)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(26,111,212,0.3)',
    },
    archipelNameText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    // Chấm tròn đánh dấu tâm đảo
    islandDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#1A6FD4',
      borderWidth: 1,
      borderColor: '#fff',
    },
    // Nhãn tên đảo lớn (hiển thị nổi trên Polygon)
    islandNameTag: {
      backgroundColor: 'rgba(255,255,255,0.90)',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(26,111,212,0.4)',
    },
    islandNameText: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.1,
    },
    // Nhãn đảo nhỏ bên cạnh
    islandMiniTag: {
      backgroundColor: 'rgba(255,255,255,0.82)',
      paddingHorizontal: 3,
      paddingVertical: 1,
      borderRadius: 4,
      borderWidth: 0.7,
      borderColor: 'rgba(26,111,212,0.3)',
      maxWidth: 100,
    },
    islandMiniText: {
      fontSize: 7,
      fontWeight: '600',
    },
    // compat cũ
    islandLabel: {
      backgroundColor: 'rgba(255,255,255,0.88)',
      paddingHorizontal: 4, paddingVertical: 2,
      borderRadius: 5, borderWidth: 0.8, maxWidth: 110,
    },
    islandLabelVN: { fontSize: 8, fontWeight: '700', lineHeight: 11 },
    islandLabelText: { fontSize: 8, fontWeight: '600', textAlign: 'center', lineHeight: 11 },
    locationBtn: {
      position: 'absolute', bottom: 110, right: 16,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 16, paddingVertical: 11, borderRadius: 28,
      elevation: 6,
      shadowColor: '#7C5CBF', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 10,
    },
    locationBtnEmoji: { fontSize: 18 },
    locationBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    emptyOverlay: {
      position: 'absolute', bottom: 170, alignSelf: 'center',
      width: 240, padding: 16, borderRadius: 20,
      alignItems: 'center', gap: 8,
    },
    emptyText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
    createMemoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    createMemoryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    // header additions
    headerBadge: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    headerSub: { fontSize: 12, marginTop: 2 },
  });
}
