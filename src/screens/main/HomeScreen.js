// src/screens/main/HomeScreen.js - Feed memories với filter và pull-to-refresh
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Image, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';

const { width } = Dimensions.get('window');

// Các bộ lọc thời gian
const FILTERS = ['all', 'today', 'week', 'month'];

// Component hiển thị 1 memory card
function MemoryCard({ memory, onPress, onDelete, theme, t }) {
  const firstPhoto = memory.photos && memory.photos.length > 0 ? memory.photos[0] : null;
  const dateStr = new Date(memory.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.card, ...theme.shadows.md }]}
      onPress={() => onPress(memory)}
      activeOpacity={0.9}
    >
      {/* Ảnh */}
      {firstPhoto ? (
        <Image source={{ uri: firstPhoto }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: theme.colors.highlight }]}>
          <Text style={styles.cardImageEmoji}>📝</Text>
        </View>
      )}

      {/* Nội dung */}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {memory.title || 'Kỷ niệm không có tiêu đề'}
        </Text>
        {memory.description ? (
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {memory.description}
          </Text>
        ) : null}

        {/* Địa điểm + ngày */}
        <View style={styles.cardMeta}>
          {memory.location && memory.location.address ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={[styles.metaText, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                {memory.location.address}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>🗓️</Text>
            <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>{dateStr}</Text>
          </View>
        </View>

        {/* Tags */}
        {memory.tags && memory.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {memory.tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={[styles.tag, { backgroundColor: theme.colors.highlight }]}>
                <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Nút xóa */}
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: theme.colors.error + '20' }]}
          onPress={() => onDelete(memory)}
        >
          <Text style={[styles.deleteBtnText, { color: theme.colors.error }]}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// Empty state
function EmptyState({ onCreatePress, theme, t, styles }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🌸</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('home.noMemories')}</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {t('home.noMemoriesSubtitle')}
      </Text>
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
        onPress={onCreatePress}
      >
        <Text style={styles.createBtnText}>✨ {t('home.createFirst')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { theme, t } = useApp();
  const { user } = useAuth();
  const { getFilteredMemories, deleteMemory, refreshMemories } = useMemory();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lấy memories đã lọc
  const memories = getFilteredMemories(user?.id, activeFilter);

  // Lời chào theo giờ
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greetingMorning');
    if (hour < 18) return t('home.greetingAfternoon');
    return t('home.greetingEvening');
  }

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshMemories();
    setIsRefreshing(false);
  }, [refreshMemories]);

  // Nhấn vào memory
  function handleMemoryPress(memory) {
    navigation.navigate('MemoryDetail', { memory });
  }

  // Xóa memory
  function handleDeleteMemory(memory) {
    Alert.alert(
      t('memoryDetail.deleteMemory'),
      t('memoryDetail.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMemory(memory.id);
            } catch {
              Alert.alert(t('common.error'), t('memoryDetail.deleteFailed'));
            }
          },
        },
      ]
    );
  }

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            {getGreeting()}, {user?.fullName?.split(' ')[0] || ''}! 👋
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('home.title')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Bộ lọc */}
      <View style={styles.filterContainer}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterBtn,
              { borderColor: theme.colors.border },
              activeFilter === filter && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              { color: theme.colors.textSecondary },
              activeFilter === filter && { color: '#fff', fontWeight: '600' },
            ]}>
              {t(`home.filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Số lượng */}
      {memories.length > 0 ? (
        <Text style={[styles.countText, { color: theme.colors.textTertiary }]}>
          {t('home.memoriesCount', { count: memories.length })}
        </Text>
      ) : null}

      {/* Feed */}
      <FlatList
        data={memories}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <MemoryCard
            memory={item}
            onPress={handleMemoryPress}
            onDelete={handleDeleteMemory}
            theme={theme}
            t={t}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            onCreatePress={() => navigation.navigate('Create')}
            theme={theme}
            t={t}
            styles={styles}
          />
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    },
    greeting: { fontSize: 13, marginBottom: 2 },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    settingsBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
    },
    filterContainer: {
      flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12,
    },
    filterBtn: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1.5,
    },
    filterText: { fontSize: 13 },
    countText: { fontSize: 12, marginHorizontal: 20, marginBottom: 8 },
    listContent: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
    // Card
    card: {
      borderRadius: 16, marginBottom: 16, overflow: 'hidden',
    },
    cardImage: { width: '100%', height: 200 },
    cardImagePlaceholder: {
      width: '100%', height: 120, alignItems: 'center', justifyContent: 'center',
    },
    cardImageEmoji: { fontSize: 48 },
    cardContent: { padding: 14 },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, lineHeight: 22 },
    cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
    cardMeta: { gap: 4, marginBottom: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaIcon: { fontSize: 12 },
    metaText: { fontSize: 12, flex: 1 },
    tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
    tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    tagText: { fontSize: 11, fontWeight: '500' },
    deleteBtn: {
      position: 'absolute', top: 12, right: 12,
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    deleteBtnText: { fontSize: 14 },
    // Empty state
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyEmoji: { fontSize: 72, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    createBtn: {
      paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
    },
    createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}
