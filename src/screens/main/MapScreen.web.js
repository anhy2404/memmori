// src/screens/main/MapScreen.web.js - Fallback cho web (react-native-maps không hỗ trợ web)
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';

export default function MapScreen({ navigation }) {
  const { theme, t } = useApp();
  const { user } = useAuth();
  const { getMemoriesWithLocation } = useMemory();

  const memoriesWithLocation = useMemo(
    () => getMemoriesWithLocation(user?.id),
    [user?.id, getMemoriesWithLocation]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.header, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>
          {t('map.title')}
        </Text>
        <Text style={[styles.headerCount, { color: theme.colors.primary }]}>
          {memoriesWithLocation.length} {t('map.memories')}
        </Text>
      </View>

      {/* Web không hỗ trợ bản đồ thật, hiển thị danh sách thay thế */}
      <View style={[styles.banner, { backgroundColor: theme.colors.highlight }]}>
        <Text style={[styles.bannerText, { color: theme.colors.textSecondary }]}>
          🗺️ Bản đồ chỉ khả dụng trên thiết bị di động. Dưới đây là danh sách kỷ niệm có vị trí.
        </Text>
      </View>

      {memoriesWithLocation.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🗺️</Text>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {t('map.noMemoriesOnMap')}
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Create')}
          >
            <Text style={styles.createBtnText}>+ {t('create.title')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {memoriesWithLocation.map(memory => (
            <TouchableOpacity
              key={memory.id}
              style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('MemoryDetail', { memory })}
              activeOpacity={0.8}
            >
              <Text style={styles.cardEmoji}>
                {memory.photos?.length > 0 ? '📸' : memory.video ? '🎥' : '📍'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {memory.title}
                </Text>
                {memory.location?.address ? (
                  <Text style={[styles.cardAddress, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    📍 {memory.location.address}
                  </Text>
                ) : (
                  <Text style={[styles.cardAddress, { color: theme.colors.textTertiary }]}>
                    {memory.location?.lat?.toFixed(4)}, {memory.location?.lng?.toFixed(4)}
                  </Text>
                )}
              </View>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerCount: { fontSize: 14, fontWeight: '600' },
  banner: {
    marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10,
  },
  bannerText: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, fontWeight: '500', textAlign: 'center', marginBottom: 16 },
  createBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  cardEmoji: { fontSize: 24 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cardAddress: { fontSize: 12 },
});
