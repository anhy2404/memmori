// src/screens/main/HomeScreen.js - Feed memories (giao diện mới)
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Image, Dimensions, Alert, ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';
import EmptyIllustration from '../../components/EmptyIllustration';

const { width } = Dimensions.get('window');
const FILTERS = ['all', 'today', 'week', 'month'];
const FILTER_ICONS = { all: '🌟', today: '☀️', week: '📅', month: '🗓️' };

// ─── Privacy Badge ────────────────────────────────────────────────────────────
function PrivacyBadge({ isPublic }) {
  return (
    <View style={[
      badgeStyles.wrap,
      isPublic ? badgeStyles.publicWrap : badgeStyles.privateWrap,
    ]}>
      <Text style={badgeStyles.icon}>{isPublic ? '🌐' : '🔒'}</Text>
      <Text style={[badgeStyles.text, isPublic ? badgeStyles.publicText : badgeStyles.privateText]}>
        {isPublic ? 'Công khai' : 'Riêng tư'}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1,
  },
  publicWrap:   { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  privateWrap:  { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
  icon:         { fontSize: 10 },
  text:         { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  publicText:   { color: '#16a34a' },
  privateText:  { color: '#475569' },
});

// ─── Author Row ───────────────────────────────────────────────────────────────
function AuthorRow({ memory, isOwn, theme }) {
  const initial = (memory.ownerName || '?').charAt(0).toUpperCase();
  const name    = isOwn ? 'Bạn' : (memory.ownerName || 'Người dùng khác');

  return (
    <View style={authorStyles.row}>
      {/* Avatar chữ cái */}
      <View style={[authorStyles.avatar, { backgroundColor: theme.colors.primary }]}>
        <Text style={authorStyles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[authorStyles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {name}
          {isOwn && <Text style={{ color: theme.colors.primary }}> (bạn)</Text>}
        </Text>
      </View>
    </View>
  );
}

const authorStyles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  avatar:     { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  name:       { fontSize: 13, fontWeight: '600' },
});

// ─── Memory Card ──────────────────────────────────────────────────────────────
const MemoryCard = React.memo(function MemoryCard({
  memory, onPress, onDelete, theme, t, isNewest, currentUserId,
}) {
  const firstPhoto = memory.photos?.[0] || null;
  const isOwn      = memory.userId === currentUserId;
  const isPublic   = memory.privacy === 'public';

  const dateStr = new Date(memory.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const timeStr = new Date(memory.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        { backgroundColor: theme.colors.card },
        theme.shadows.md,
        isNewest && { borderWidth: 2, borderColor: theme.colors.primary },
      ]}
      onPress={() => onPress(memory)}
      activeOpacity={0.92}
    >
      {/* ── Ảnh bìa ── */}
      {firstPhoto ? (
        <View>
          <Image source={{ uri: firstPhoto }} style={cardStyles.image} resizeMode="cover" />
          {/* Gradient mờ phía dưới ảnh */}
          <View style={cardStyles.imageOverlay} />
          {/* Photo count */}
          {memory.photos.length > 1 && (
            <View style={cardStyles.photoCount}>
              <Text style={cardStyles.photoCountText}>📸 {memory.photos.length}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[cardStyles.imagePlaceholder, { backgroundColor: theme.colors.primary + '18' }]}>
          <Text style={cardStyles.placeholderEmoji}>✍️</Text>
        </View>
      )}

      {/* Badges nổi trên ảnh */}
      {isNewest && (
        <View style={[cardStyles.newBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={cardStyles.newBadgeText}>⭐ Mới nhất</Text>
        </View>
      )}
      <View style={cardStyles.privacyBadgePos}>
        <PrivacyBadge isPublic={isPublic} />
      </View>

      {/* ── Nội dung ── */}
      <View style={cardStyles.body}>
        {/* Tác giả */}
        <AuthorRow memory={memory} isOwn={isOwn} theme={theme} />

        {/* Tiêu đề */}
        <Text style={[cardStyles.title, { color: theme.colors.text }]} numberOfLines={2}>
          {memory.title || t('home.untitledMemory')}
        </Text>

        {/* Mô tả */}
        {memory.description ? (
          <Text style={[cardStyles.desc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {memory.description}
          </Text>
        ) : null}

        {/* ── Divider ── */}
        <View style={[cardStyles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Meta: vị trí + ngày */}
        <View style={cardStyles.metaRow}>
          {memory.location?.address ? (
            <View style={[cardStyles.locationChip, { backgroundColor: '#FFF7ED', borderColor: '#fed7aa' }]}>
              <Text style={{ fontSize: 11 }}>⭐</Text>
              <Text style={[cardStyles.locationText, { color: '#c2410c' }]} numberOfLines={1}>
                {memory.location.address}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <View style={cardStyles.dateChip}>
            <Text style={[cardStyles.dateText, { color: theme.colors.textTertiary }]}>
              {dateStr} · {timeStr}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {memory.tags?.length > 0 && (
          <View style={cardStyles.tagsRow}>
            {memory.tags.slice(0, 4).map((tag, idx) => (
              <View key={idx} style={[cardStyles.tag, { backgroundColor: theme.colors.primarySoft }]}>
                <Text style={[cardStyles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
              </View>
            ))}
            {memory.tags.length > 4 && (
              <View style={[cardStyles.tag, { backgroundColor: theme.colors.highlight }]}>
                <Text style={[cardStyles.tagText, { color: theme.colors.textTertiary }]}>
                  +{memory.tags.length - 4}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tagged users */}
        {memory.taggedUsers?.length > 0 && (
          <View style={cardStyles.taggedRow}>
            <Text style={{ fontSize: 12, marginRight: 2 }}>👥</Text>
            {memory.taggedUsers.slice(0, 3).map((u, idx) => (
              <Text key={u.id} style={[cardStyles.taggedName, { color: theme.colors.secondary }]}>
                @{u.fullName?.split(' ').pop()}{idx < Math.min(memory.taggedUsers.length, 3) - 1 ? ', ' : ''}
              </Text>
            ))}
            {memory.taggedUsers.length > 3 && (
              <Text style={{ fontSize: 11, color: theme.colors.textTertiary }}>
                +{memory.taggedUsers.length - 3}
              </Text>
            )}
          </View>
        )}

        {/* Nút xóa - chỉ owner */}
        {isOwn && (
          <TouchableOpacity
            style={[cardStyles.deleteBtn, { backgroundColor: '#FEF2F2', borderColor: '#fecaca' }]}
            onPress={() => onDelete(memory)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={cardStyles.deleteBtnText}>🗑️ Xóa</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreatePress, theme, t, styles }) {
  return (
    <View style={styles.emptyContainer}>
      <EmptyIllustration size={140} color={theme.colors.primary} />
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { theme, t } = useApp();
  const { user } = useAuth();
  const { getFilteredMemories, deleteMemory, refreshMemories, isLoading } = useMemory();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId]     = useState(null);

  const memories = useMemo(
    () => getFilteredMemories(user?.id, activeFilter),
    [user?.id, activeFilter, getFilteredMemories],
  );

  const styles = useMemo(() => makeStyles(theme), [theme]);

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return t('home.greetingMorning');
    if (h < 18) return t('home.greetingAfternoon');
    return t('home.greetingEvening');
  }

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
    if (deletingId) return;
    if (memory.userId !== user?.id) return;
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
            try { await deleteMemory(memory.id); }
            catch { Alert.alert(t('common.error'), t('memoryDetail.deleteFailed')); }
            finally { setDeletingId(null); }
          },
        },
      ],
    );
  }, [deletingId, t, deleteMemory, user?.id]);

  const newestMemoryId = useMemo(() => {
    if (!memories.length) return null;
    return [...memories].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )[0]?.id ?? null;
  }, [memories]);

  const renderItem = useCallback(({ item }) => (
    <MemoryCard
      memory={item}
      onPress={handleMemoryPress}
      onDelete={handleDeleteMemory}
      theme={theme}
      t={t}
      isNewest={item.id === newestMemoryId}
      currentUserId={user?.id}
    />
  ), [handleMemoryPress, handleDeleteMemory, theme, t, newestMemoryId, user?.id]);

  const keyExtractor = useCallback((item) => item.id, []);

  // ── Loading ──
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
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

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            {getGreeting()}, {getDisplayName()}! 👋
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('home.title')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: theme.colors.background }]}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter bar ── */}
      <View style={[styles.filterWrap, { backgroundColor: theme.colors.background }]}>
        {FILTERS.map(f => {
          const active = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                { borderColor: active ? theme.colors.primary : theme.colors.border },
                active && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterIcon]}>{FILTER_ICONS[f]}</Text>
              <Text style={[
                styles.filterText,
                { color: active ? '#fff' : theme.colors.textSecondary },
                active && { fontWeight: '700' },
              ]}>
                {t(`home.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Count ── */}
      {memories.length > 0 && (
        <Text style={[styles.countText, { color: theme.colors.textTertiary }]}>
          🗺️ {t('home.memoriesCount', { count: memories.length })}
        </Text>
      )}

      {/* ── List ── */}
      <FlatList
        data={memories}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={6}
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

// ─── Card Styles ──────────────────────────────────────────────────────────────
const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 210,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 60,
    // giả lập gradient bằng màu nửa trong suốt
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  photoCount: {
    position: 'absolute',
    bottom: 10, right: 12,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  photoCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  imagePlaceholder: {
    width: '100%', height: 100,
    alignItems: 'center', justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 44 },
  // Badges nổi
  newBadge: {
    position: 'absolute', top: 12, left: 12, zIndex: 10,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  newBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  privacyBadgePos: {
    position: 'absolute', top: 12, right: 12, zIndex: 10,
  },
  // Body
  body: { padding: 14, gap: 6 },
  title: { fontSize: 17, fontWeight: '800', lineHeight: 23 },
  desc:  { fontSize: 13, lineHeight: 19, marginTop: 2 },
  divider: { height: 1, marginVertical: 8 },
  // Meta row
  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, flexWrap: 'wrap',
  },
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, flex: 1,
    maxWidth: width * 0.52,
  },
  locationText: { fontSize: 11, fontWeight: '600', flex: 1 },
  dateChip: { alignItems: 'flex-end' },
  dateText: { fontSize: 11 },
  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '600' },
  // Tagged users
  taggedRow: {
    flexDirection: 'row', alignItems: 'center',
    flexWrap: 'wrap', gap: 2, marginTop: 2,
  },
  taggedName: { fontSize: 11, fontWeight: '600' },
  // Delete
  deleteBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  deleteBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    greeting:    { fontSize: 12, marginBottom: 2 },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    settingsBtn: {
      width: 42, height: 42, borderRadius: 21,
      alignItems: 'center', justifyContent: 'center',
    },
    filterWrap: {
      flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    },
    filterBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1.5, flex: 1,
      justifyContent: 'center',
    },
    filterIcon: { fontSize: 13 },
    filterText: { fontSize: 11 },
    countText: { fontSize: 12, marginHorizontal: 20, marginBottom: 4 },
    listContent: { paddingHorizontal: 14, paddingBottom: 24, paddingTop: 6, flexGrow: 1 },
    emptyContainer: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingVertical: 60, gap: 8,
    },
    emptyTitle:    { fontSize: 18, fontWeight: '700', marginTop: 8 },
    emptySubtitle: {
      fontSize: 14, textAlign: 'center', marginBottom: 16,
      lineHeight: 20, paddingHorizontal: 32,
    },
    createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}
