// src/screens/main/HomeScreen.js - Feed memories
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Image, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';
import EmptyIllustration from '../../components/EmptyIllustration';

const { width } = Dimensions.get('window');
const FILTERS = ['all', 'today', 'week', 'month'];

// MemoryCard - memo để tránh re-render khi filter thay đổi
const MemoryCard = React.memo(function MemoryCard({ memory, onPress, onDelete, theme, t }) {
  const firstPhoto = memory.photos?.[0] || null;
  const dateStr = new Date(memory.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[cardStyles.card, { backgroundColor: theme.colors.card, ...theme.shadows.md }]}
      onPress={() => onPress(memory)}
      activeOpacity={0.9}
    >
      {firstPhoto ? (
        <Image source={{ uri: firstPhoto }} style={cardStyles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[cardStyles.cardImagePlaceholder, { backgroundColor: theme.colors.highlight }]}>
          <Text style={cardStyles.cardImageEmoji}>📝</Text>
        </View>
      )}
      <View style={cardStyles.cardContent}>
        <Text style={[cardStyles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {memory.title || t('home.untitledMemory')}
        </Text>
        {memory.description ? (
          <Text style={[cardStyles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {memory.description}
          </Text>
        ) : null}
        <View style={cardStyles.cardMeta}>
          {memory.location?.address ? (
            <View style={cardStyles.metaItem}>
              <Text style={cardStyles.metaIcon}>📍</Text>
              <Text style={[cardStyles.metaText, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                {memory.location.address}
              </Text>
            </View>
          ) : null}
          <View style={cardStyles.metaItem}>
            <Text style={cardStyles.metaIcon}>🗓️</Text>
            <Text style={[cardStyles.metaText, { color: theme.colors.textTertiary }]}>{dateStr}</Text>
          </View>
        </View>
        {memory.tags?.length > 0 && (
          <View style={cardStyles.tagsRow}>
            {memory.tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={[cardStyles.tag, { backgroundColor: theme.colors.highlight }]}>
                <Text style={[cardStyles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={[cardStyles.deleteBtn, { backgroundColor: theme.colors.error + '20' }]}
          onPress={() => onDelete(memory)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[cardStyles.deleteBtnText, { color: theme.colors.error }]}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

function EmptyState({ onCreatePress, theme, t, styles }) {
  return (
    <View style={styles.emptyContainer}>
      <EmptyIllustration size={130} color={theme.colors.primary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('home.noMemories')}</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {t('home.noMemoriesSubtitle')}
      </Text>
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
        onPress={onCreatePress}
      >
        <Text style={styles.createBtnText}>{t('home.createFirst')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { theme, t } = useApp();
  const { user } = useAuth();
  const { getFilteredMemories, deleteMemory, refreshMemories, isLoading } = useMemory();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // useMemo - tránh tính lại mỗi render
  const memories = useMemo(
    () => getFilteredMemories(user?.id, activeFilter),
    [user?.id, activeFilter, getFilteredMemories]
  );

  const styles = useMemo(() => makeStyles(theme), [theme]);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greetingMorning');
    if (hour < 18) return t('home.greetingAfternoon');
    return t('home.greetingEvening');
  }

  // Lấy tên gọi: tên cuối cùng (tên riêng trong tiếng Việt)
  function getDisplayName() {
    if (!user?.fullName) return '';
    const parts = user.fullName.trim().split(/\s+/);
    return parts[parts.length - 1] || '';
  }

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshMemories();
    setIsRefreshing(false);
  }, [refreshMemories]);

  const handleMemoryPress = useCallback((memory) => {
    navigation.navigate('MemoryDetail', { memory });
  }, [navigation]);

  const handleDeleteMemory = useCallback((memory) => {
    if (deletingId) return; // Ngăn double-tap
    Alert.alert(
      t('memoryDetail.deleteMemory'),
      t('memoryDetail.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeletingId(memory.id);
            try {
              await deleteMemory(memory.id);
            } catch {
              Alert.alert(t('common.error'), t('memoryDetail.deleteFailed'));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }, [deletingId, t, deleteMemory]);

  const renderItem = useCallback(({ item }) => (
    <MemoryCard
      memory={item}
      onPress={handleMemoryPress}
      onDelete={handleDeleteMemory}
      theme={theme}
      t={t}
    />
  ), [handleMemoryPress, handleDeleteMemory, theme, t]);

  const keyExtractor = useCallback((item) => item.id, []);

  // Loading skeleton khi lần đầu tải
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header]}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
              {getGreeting()}, {getDisplayName()}! 👋
            </Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('home.title')}</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 12, fontSize: 14 }}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            {getGreeting()}, {getDisplayName()}! 👋
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('home.title')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

      {memories.length > 0 && (
        <Text style={[styles.countText, { color: theme.colors.textTertiary }]}>
          {t('home.memoriesCount', { count: memories.length })}
        </Text>
      )}

      <FlatList
        data={memories}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        renderItem={renderItem}
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

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  cardImage: { width: '100%', height: 200 },
  cardImagePlaceholder: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center' },
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
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 14 },
});

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    },
    greeting: { fontSize: 13, marginBottom: 2 },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    settingsBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    filterContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
    filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
    filterText: { fontSize: 13 },
    countText: { fontSize: 12, marginHorizontal: 20, marginBottom: 8 },
    listContent: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20, paddingHorizontal: 32 },
    createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}
