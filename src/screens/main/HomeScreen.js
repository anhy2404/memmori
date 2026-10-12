// src/screens/main/HomeScreen.js
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
const FILTER_ICONS = { all: '✨', today: '☀️', week: '📅', month: '🗓️' };
const FILTER_COLORS = {
  all:   { bg: '#7C5CBF', text: '#fff', inactBg: '#F0EBFF', inactText: '#7C5CBF' },
  today: { bg: '#F06292', text: '#fff', inactBg: '#FFF0F6', inactText: '#F06292' },
  week:  { bg: '#FF8A65', text: '#fff', inactBg: '#FFF3EE', inactText: '#FF8A65' },
  month: { bg: '#26C485', text: '#fff', inactBg: '#EDFAF4', inactText: '#26C485' },
};

// ─── Privacy Badge ────────────────────────────────────────────────────────────
function PrivacyBadge({ isPublic, isOwn, t }) {
  if (!isOwn) return null;
  return (
    <View style={[bdgS.wrap, isPublic ? bdgS.pubWrap : bdgS.prvWrap]}>
      <Text style={bdgS.icon}>{isPublic ? '🌐' : '🔒'}</Text>
      <Text style={[bdgS.text, isPublic ? bdgS.pubText : bdgS.prvText]}>
        {isPublic ? t('privacy.public') : t('privacy.private')}
      </Text>
    </View>
  );
}
const bdgS = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  pubWrap: { backgroundColor: 'rgba(38,196,133,0.13)' },
  prvWrap: { backgroundColor: 'rgba(124,92,191,0.10)' },
  icon:    { fontSize: 10 },
  text:    { fontSize: 10, fontWeight: '700' },
  pubText: { color: '#26C485' },
  prvText: { color: '#9E7FBB' },
});

// ─── Author Row ───────────────────────────────────────────────────────────────
function AuthorRow({ memory, isOwn, theme, currentUser, t }) {
  const avatarUri   = isOwn ? currentUser?.avatar : null;
  const displayName = isOwn
    ? (currentUser?.fullName || t('home.you'))
    : (memory.ownerName || t('home.otherUser'));
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <View style={authS.row}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={[authS.avatar, authS.img]} />
      ) : (
        <View style={[authS.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={authS.initial}>{initial}</Text>
        </View>
      )}
      <Text style={[authS.name, { color: theme.colors.text }]} numberOfLines={1}>
        {displayName}
        {isOwn ? <Text style={{ color: theme.colors.primary }}>{t('home.youSuffix')}</Text> : null}
      </Text>
    </View>
  );
}
const authS = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar:  { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  img:     { resizeMode: 'cover' },
  initial: { color: '#fff', fontSize: 13, fontWeight: '800' },
  name:    { fontSize: 13, fontWeight: '600' },
});

// ─── Memory Card ──────────────────────────────────────────────────────────────
const MemoryCard = React.memo(function MemoryCard({
  memory, onPress, onDelete, theme, t, isNewest, currentUserId, currentUser, language,
}) {
  const firstPhoto = memory.photos?.[0] || null;
  const isOwn    = memory.userId === currentUserId;
  const isPublic = memory.privacy === 'public';
  const dateStr  = new Date(memory.createdAt).toLocaleDateString(language || undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr  = new Date(memory.createdAt).toLocaleTimeString(language || undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={[
        cardS.card,
        { backgroundColor: theme.colors.card, ...theme.shadows.md },
        isNewest && { borderWidth: 2, borderColor: theme.colors.primary },
      ]}
      onPress={() => onPress(memory)}
      activeOpacity={0.93}
    >
      {/* Cover image */}
      {firstPhoto ? (
        <View>
          <Image source={{ uri: firstPhoto }} style={cardS.image} resizeMode="cover" />
          <View style={cardS.imgOverlay} />
          {memory.photos.length > 1 && (
            <View style={cardS.photoCnt}>
              <Text style={cardS.photoCntTxt}>📸 {memory.photos.length}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[cardS.imgPh, { backgroundColor: theme.colors.primary + '18' }]}>
          <Text style={cardS.imgPhEmoji}>✍️</Text>
        </View>
      )}

      {/* NEW badge */}
      {isNewest && (
        <View style={[cardS.newBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={cardS.newBadgeTxt}>{t('home.newest')}</Text>
        </View>
      )}

      {/* Body */}
      <View style={cardS.body}>
        {/* Author + privacy */}
        <View style={cardS.authorRow}>
          <AuthorRow memory={memory} isOwn={isOwn} theme={theme} currentUser={currentUser} t={t} />
          <PrivacyBadge isPublic={isPublic} isOwn={isOwn} t={t} />
        </View>

        {/* Title */}
        <Text style={[cardS.title, { color: theme.colors.text }]} numberOfLines={2}>
          {memory.title || t('home.untitledMemory')}
        </Text>

        {/* Desc */}
        {memory.description ? (
          <Text style={[cardS.desc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {memory.description}
          </Text>
        ) : null}

        {/* Divider */}
        <View style={[cardS.divider, { backgroundColor: theme.colors.divider }]} />

        {/* Meta */}
        <View style={cardS.meta}>
          {memory.location?.address ? (
            <View style={[cardS.locChip, { backgroundColor: '#FFF0E6', borderColor: '#FFBB96' }]}>
              <Text style={{ fontSize: 11 }}>📍</Text>
              <Text style={[cardS.locTxt, { color: '#BF6030' }]} numberOfLines={1}>
                {memory.location.address}
              </Text>
            </View>
          ) : <View style={{ flex: 1 }} />}
          <Text style={[cardS.dateTxt, { color: theme.colors.textTertiary }]}>
            {dateStr} · {timeStr}
          </Text>
        </View>

        {/* Tags */}
        {memory.tags?.length > 0 && (
          <View style={cardS.tagsRow}>
            {memory.tags.slice(0, 4).map((tag, i) => (
              <View key={i} style={[cardS.tag, { backgroundColor: theme.colors.primarySoft }]}>
                <Text style={[cardS.tagTxt, { color: theme.colors.primary }]}>{tag}</Text>
              </View>
            ))}
            {memory.tags.length > 4 && (
              <View style={[cardS.tag, { backgroundColor: theme.colors.highlight }]}>
                <Text style={[cardS.tagTxt, { color: theme.colors.textTertiary }]}>+{memory.tags.length - 4}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tagged users */}
        {memory.taggedUsers?.length > 0 && (
          <View style={cardS.taggedRow}>
            <Text style={{ fontSize: 12, marginRight: 2 }}>👥</Text>
            {memory.taggedUsers.slice(0, 3).map((u, i) => (
              <Text key={u.id} style={[cardS.taggedName, { color: theme.colors.secondary }]}>
                @{u.fullName?.split(' ').pop()}{i < Math.min(memory.taggedUsers.length, 3) - 1 ? ', ' : ''}
              </Text>
            ))}
            {memory.taggedUsers.length > 3 && (
              <Text style={{ fontSize: 11, color: theme.colors.textTertiary }}>+{memory.taggedUsers.length - 3}</Text>
            )}
          </View>
        )}

        {/* Delete button */}
        {isOwn && (
          <TouchableOpacity
            style={[cardS.delBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
            onPress={() => onDelete(memory)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={cardS.delTxt}>🗑️ Xóa</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

const cardS = StyleSheet.create({
  card:       { borderRadius: 22, marginBottom: 16, overflow: 'hidden' },
  image:      { width: '100%', height: 200 },
  imgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, backgroundColor: 'rgba(45,27,78,0.15)' },
  photoCnt:   { position: 'absolute', bottom: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.42)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  photoCntTxt:{ color: '#fff', fontSize: 11, fontWeight: '700' },
  imgPh:      { width: '100%', height: 90, alignItems: 'center', justifyContent: 'center' },
  imgPhEmoji: { fontSize: 40 },
  newBadge:   { position: 'absolute', top: 12, left: 12, zIndex: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, elevation: 4 },
  newBadgeTxt:{ color: '#fff', fontSize: 11, fontWeight: '800' },
  body:       { padding: 14, gap: 6 },
  authorRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  title:      { fontSize: 17, fontWeight: '800', lineHeight: 23 },
  desc:       { fontSize: 13, lineHeight: 19 },
  divider:    { height: 1, marginVertical: 6 },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, flex: 1, maxWidth: width * 0.52 },
  locTxt:     { fontSize: 11, fontWeight: '600', flex: 1 },
  dateTxt:    { fontSize: 11 },
  tagsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:        { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  tagTxt:     { fontSize: 11, fontWeight: '600' },
  taggedRow:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 2 },
  taggedName: { fontSize: 11, fontWeight: '600' },
  delBtn:     { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  delTxt:     { fontSize: 12, color: '#EF4444', fontWeight: '600' },
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreatePress, theme, t, styles }) {
  return (
    <View style={styles.emptyContainer}>
      <EmptyIllustration size={130} color={theme.colors.primary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('home.noMemories')}</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{t('home.noMemoriesSubtitle')}</Text>
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
        onPress={onCreatePress}
      >
        <Text style={styles.createBtnText}>{t('home.createFirst')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { theme, t, language } = useApp();
  const { user } = useAuth();
  const { getFilteredMemories, deleteMemory, refreshMemories, isLoading } = useMemory();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing]   = useState(false);
  const [deletingId, setDeletingId]       = useState(null);

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

  const handleMemoryPress  = useCallback((m) => navigation.navigate('MemoryDetail', { memory: m }), [navigation]);

  const handleDeleteMemory = useCallback((memory) => {
    if (deletingId || memory.userId !== user?.id) return;
    Alert.alert(
      t('memoryDetail.deleteMemory'), t('memoryDetail.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: async () => {
          setDeletingId(memory.id);
          try { await deleteMemory(memory.id); }
          catch { Alert.alert(t('common.error'), t('memoryDetail.deleteFailed')); }
          finally { setDeletingId(null); }
        }},
      ],
    );
  }, [deletingId, t, deleteMemory, user?.id]);

  const newestId = useMemo(() => {
    if (!memories.length) return null;
    return [...memories].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.id ?? null;
  }, [memories]);

  const renderItem = useCallback(({ item }) => (
    <MemoryCard
      memory={item} onPress={handleMemoryPress} onDelete={handleDeleteMemory}
      theme={theme} t={t} isNewest={item.id === newestId}
      currentUserId={user?.id} currentUser={user} language={language}
    />
  ), [handleMemoryPress, handleDeleteMemory, theme, t, newestId, user]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>{getGreeting()}, {getDisplayName()}! 👋</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('home.title')}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 12, fontSize: 14 }}>{t('common.loading')}</Text>
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.colors.primarySoft }]}
            onPress={() => navigation.navigate('Discover')}
          >
            <Text style={{ fontSize: 20 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.colors.primarySoft }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter chips ── */}
      <View style={[styles.filterWrap, { backgroundColor: theme.colors.background }]}>
        {FILTERS.map(f => {
          const active = activeFilter === f;
          const col = FILTER_COLORS[f];
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                active
                  ? { backgroundColor: col.bg }
                  : { backgroundColor: col.inactBg },
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={styles.filterIcon}>{FILTER_ICONS[f]}</Text>
              <Text style={[styles.filterTxt, { color: active ? col.text : col.inactText, fontWeight: active ? '700' : '500' }]}>
                {t(`home.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Count ── */}
      {memories.length > 0 && (
        <Text style={[styles.countTxt, { color: theme.colors.textTertiary }]}>
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
            refreshing={isRefreshing} onRefresh={onRefresh}
            tintColor={theme.colors.primary} colors={[theme.colors.primary]}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState onCreatePress={() => navigation.navigate('Create')} theme={theme} t={t} styles={styles} />
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container:    { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    greeting:    { fontSize: 12, marginBottom: 2 },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    iconBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
    },
    filterWrap: {
      flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    },
    filterChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 7,
      borderRadius: 22, flex: 1, justifyContent: 'center',
    },
    filterIcon: { fontSize: 13 },
    filterTxt:  { fontSize: 11 },
    countTxt:   { fontSize: 12, marginHorizontal: 20, marginBottom: 4 },
    listContent:{ paddingHorizontal: 14, paddingBottom: 24, paddingTop: 6, flexGrow: 1 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
    emptyTitle:     { fontSize: 18, fontWeight: '700', marginTop: 8 },
    emptySubtitle:  { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20, paddingHorizontal: 32 },
    createBtn:      { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 28 },
    createBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}
