// src/screens/main/FriendsScreen.js - Kết bạn & Mạng lưới
const _sym = typeof Symbol!=='undefined'?Symbol('\u0061\u006e\u0068\u0079'):null;
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Image, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';
import { useNotification, NOTIF_TYPES } from '../../context/NotificationContext';
import { friendsAPI, userAPI } from '../../services/apiService';

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ uri, name, size = 44, theme }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: theme.colors.primary,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '800' }}>{initial}</Text>
    </View>
  );
}

// ─── Friend Card ──────────────────────────────────────────────────────────────
function FriendCard({ person, onViewPhotos, onUnfriend, theme, currentUserId }) {
  return (
    <View style={[fcStyles.card, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
      <UserAvatar uri={person.avatar} name={person.fullName} size={50} theme={theme} />
      <View style={fcStyles.info}>
        <Text style={[fcStyles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {person.fullName}
        </Text>
        <Text style={[fcStyles.email, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {person.email}
        </Text>
      </View>
      <View style={fcStyles.actions}>
        <TouchableOpacity
          style={[fcStyles.btn, { backgroundColor: theme.colors.primary }]}
          onPress={() => onViewPhotos(person)}
        >
          <Text style={fcStyles.btnText}>📷 Ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[fcStyles.btn, { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#fecaca' }]}
          onPress={() => onUnfriend(person)}
        >
          <Text style={[fcStyles.btnText, { color: '#ef4444' }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const fcStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 16, marginBottom: 10,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700' },
  email: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  btnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ person, onAccept, onDecline, theme }) {
  return (
    <View style={[reqStyles.card, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
      <UserAvatar uri={person.avatar} name={person.fullName} size={46} theme={theme} />
      <View style={reqStyles.info}>
        <Text style={[reqStyles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {person.fullName}
        </Text>
        <Text style={[reqStyles.sub, { color: theme.colors.textSecondary }]}>
          Muốn kết bạn với bạn
        </Text>
      </View>
      <View style={reqStyles.actions}>
        <TouchableOpacity
          style={[reqStyles.acceptBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => onAccept(person)}
        >
          <Text style={reqStyles.acceptText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[reqStyles.declineBtn, { backgroundColor: theme.colors.highlight }]}
          onPress={() => onDecline(person)}
        >
          <Text style={[reqStyles.declineText, { color: theme.colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 16, marginBottom: 10,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  declineBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  declineText: { fontSize: 16, fontWeight: '700' },
});

// ─── Photos Modal ─────────────────────────────────────────────────────────────
function PhotosModal({ visible, person, photos, onClose, theme, navigation }) {
  if (!person) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Header */}
        <View style={[pmStyles.header, { borderBottomColor: theme.colors.border }]}>
          <UserAvatar uri={person.avatar} name={person.fullName} size={36} theme={theme} />
          <View style={{ flex: 1 }}>
            <Text style={[pmStyles.title, { color: theme.colors.text }]}>{person.fullName}</Text>
            <Text style={[pmStyles.sub, { color: theme.colors.textSecondary }]}>
              {photos.length} ảnh công khai
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 22, color: theme.colors.textSecondary }}>✕</Text>
          </TouchableOpacity>
        </View>
        {/* Grid ảnh */}
        {photos.length === 0 ? (
          <View style={pmStyles.empty}>
            <Text style={{ fontSize: 48 }}>📷</Text>
            <Text style={[pmStyles.emptyText, { color: theme.colors.textSecondary }]}>
              Chưa có ảnh công khai
            </Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            numColumns={3}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 4 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={pmStyles.photoItem}
                onPress={() => { onClose(); navigation.navigate('MemoryDetail', { memory: item }); }}
              >
                {item.photos?.[0] ? (
                  <Image source={{ uri: item.photos[0] }} style={pmStyles.photo} resizeMode="cover" />
                ) : (
                  <View style={[pmStyles.photo, { backgroundColor: theme.colors.highlight, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 24 }}>📝</Text>
                  </View>
                )}
                {item.photos?.length > 1 && (
                  <View style={pmStyles.countBadge}>
                    <Text style={pmStyles.countText}>+{item.photos.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const pmStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 14 },
  photoItem: { width: '33.33%', aspectRatio: 1, padding: 2 },
  photo: { width: '100%', height: '100%', borderRadius: 8 },
  countBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  countText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FriendsScreen({ navigation }) {
  const { theme } = useApp();
  const { user } = useAuth();
  const { memories } = useMemory();
  const { addNotification } = useNotification();

  const [tab, setTab] = useState('friends'); // 'friends' | 'requests' | 'find'
  const [friends, setFriends] = useState([]);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [sentReqs, setSentReqs] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [photosModal, setPhotosModal] = useState({ visible: false, person: null });

  // Load data from backend API
  const reload = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [friendsData, pendingData, sentData] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getPendingRequests(),
        friendsAPI.getSentRequests(),
      ]);

      if (friendsData.success) {
        setFriends(friendsData.friends || []);
      }
      if (pendingData.success) {
        setPendingReqs(pendingData.requests || []);
      }
      if (sentData.success) {
        const sentIds = (sentData.requests || []).map(r => r.recipient?._id || r.recipient);
        setSentReqs(sentIds);
      }
    } catch (err) {
      console.error('[FriendsScreen] reload error:', err.message);
    }
  }, [user?.id]);

  useEffect(() => { reload(); }, [reload]);

  // Search users via API
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    userAPI.searchUsers(searchQ.trim())
      .then(data => {
        if (!cancelled) {
          const results = (data.users || []).filter(u => u._id !== user?.id && u.id !== user?.id);
          setSearchResults(results);
        }
      })
      .catch(() => { if (!cancelled) setSearchResults([]); })
      .finally(() => { if (!cancelled) setIsSearching(false); });
    return () => { cancelled = true; };
  }, [searchQ, user?.id]);

  // Photos của 1 người bạn (memories public)
  const getFriendPhotos = useCallback((friendId) => {
    return memories.filter(m => (m.userId === friendId || m.userId?._id === friendId) && m.privacy === 'public');
  }, [memories]);

  const handleSendRequest = useCallback(async (person) => {
    const recipientId = person._id || person.id;
    try {
      const data = await friendsAPI.sendRequest(recipientId);
      if (!data.success) throw new Error(data.message);
      await addNotification({
        type: NOTIF_TYPES.FRIEND_REQUEST,
        title: 'Lời mời kết bạn mới 🤝',
        body: `${user.fullName} đã gửi lời mời kết bạn cho bạn`,
        fromUser: { id: user.id, fullName: user.fullName, avatar: user.avatar },
        targetUserId: recipientId,
      });
      await reload();
      Alert.alert('✅', `Đã gửi lời mời kết bạn đến ${person.fullName}`);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Gửi lời mời thất bại');
    }
  }, [user, reload, addNotification]);

  const handleAccept = useCallback(async (person) => {
    const requesterId = person._id || person.id;
    try {
      const data = await friendsAPI.acceptRequest(requesterId);
      if (!data.success) throw new Error(data.message);
      await addNotification({
        type: NOTIF_TYPES.FRIEND_ACCEPTED,
        title: 'Lời mời kết bạn được chấp nhận ✅',
        body: `${user.fullName} đã chấp nhận lời mời kết bạn của bạn`,
        fromUser: { id: user.id, fullName: user.fullName, avatar: user.avatar },
        targetUserId: requesterId,
      });
      await reload();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Chấp nhận lời mời thất bại');
    }
  }, [user, reload, addNotification]);

  const handleDecline = useCallback(async (person) => {
    const requesterId = person._id || person.id;
    try {
      const data = await friendsAPI.declineRequest(requesterId);
      if (!data.success) throw new Error(data.message);
      await reload();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Từ chối thất bại');
    }
  }, [reload]);

  const handleUnfriend = useCallback((person) => {
    const friendId = person._id || person.id;
    Alert.alert('Huỷ kết bạn', `Bỏ kết bạn với ${person.fullName}?`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đồng ý', style: 'destructive', onPress: async () => {
        try {
          const data = await friendsAPI.unfriend(friendId);
          if (!data.success) throw new Error(data.message);
          await reload();
        } catch (err) {
          Alert.alert('Lỗi', err.message || 'Hủy kết bạn thất bại');
        }
      }},
    ]);
  }, [reload]);

  // ── Render người dùng trong tìm kiếm ─────────────────────────────────────
  const isFriend = useCallback((id) => friends.some(f => (f._id || f.id) === id), [friends]);
  const isRequested = useCallback((id) => sentReqs.includes(id), [sentReqs]);
  const isIncoming = useCallback((id) => pendingReqs.some(p => (p._id || p.id) === id || p.sender?._id === id || p.sender?.id === id), [pendingReqs]);

  function renderSearchUser({ item }) {
    const itemId = item._id || item.id;
    const alreadyFriend = isFriend(itemId);
    const alreadySent   = isRequested(itemId);
    const incoming      = isIncoming(itemId);
    return (
      <View style={[fcStyles.card, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
        <UserAvatar uri={item.avatar} name={item.fullName} size={46} theme={theme} />
        <View style={fcStyles.info}>
          <Text style={[fcStyles.name, { color: theme.colors.text }]} numberOfLines={1}>{item.fullName}</Text>
          <Text style={[fcStyles.email, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.email}</Text>
        </View>
        {alreadyFriend ? (
          <View style={[srStyles.statusBadge, { backgroundColor: theme.colors.primarySoft || '#e0f2fe' }]}>
            <Text style={[srStyles.statusText, { color: theme.colors.primary }]}>👥 Bạn bè</Text>
          </View>
        ) : incoming ? (
          <TouchableOpacity
            style={[srStyles.addBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleAccept(item)}
          >
            <Text style={srStyles.addBtnText}>✓ Chấp nhận</Text>
          </TouchableOpacity>
        ) : alreadySent ? (
          <View style={[srStyles.statusBadge, { backgroundColor: theme.colors.highlight }]}>
            <Text style={[srStyles.statusText, { color: theme.colors.textSecondary }]}>⏳ Đã gửi</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[srStyles.addBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleSendRequest(item)}
          >
            <Text style={srStyles.addBtnText}>+ Kết bạn</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const TABS = [
    { key: 'friends', label: `👥 Bạn bè${friends.length ? ` (${friends.length})` : ''}` },
    { key: 'requests', label: `🔔 Lời mời${pendingReqs.length ? ` (${pendingReqs.length})` : ''}` },
    { key: 'find', label: '🔍 Tìm bạn' },
  ];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[s.headerTitle, { color: theme.colors.text }]}>Kết bạn</Text>
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2.5 }]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabLabel, { color: tab === t.key ? theme.colors.primary : theme.colors.textSecondary },
              tab === t.key && { fontWeight: '700' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Tab: Bạn bè ── */}
        {tab === 'friends' && (
          friends.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 54 }}>👥</Text>
              <Text style={[s.emptyTitle, { color: theme.colors.text }]}>Chưa có bạn bè</Text>
              <Text style={[s.emptySub, { color: theme.colors.textSecondary }]}>
                Hãy tìm và kết bạn với mọi người
              </Text>
              <TouchableOpacity
                style={[s.findBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => setTab('find')}
              >
                <Text style={s.findBtnText}>🔍 Tìm bạn ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            friends.map(person => (
              <FriendCard
                key={person.id}
                person={person}
                onViewPhotos={(p) => setPhotosModal({ visible: true, person: p })}
                onUnfriend={handleUnfriend}
                theme={theme}
                currentUserId={user?.id}
              />
            ))
          )
        )}

        {/* ── Tab: Lời mời ── */}
        {tab === 'requests' && (
          pendingReqs.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 54 }}>🔔</Text>
              <Text style={[s.emptyTitle, { color: theme.colors.text }]}>Không có lời mời mới</Text>
            </View>
          ) : (
            pendingReqs.map(person => (
              <RequestCard
                key={person.id}
                person={person}
                onAccept={handleAccept}
                onDecline={handleDecline}
                theme={theme}
              />
            ))
          )
        )}

        {/* ── Tab: Tìm bạn ── */}
        {tab === 'find' && (
          <>
            <View style={[s.searchBox, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder }]}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
              <TextInput
                style={[s.searchInput, { color: theme.colors.text }]}
                placeholder="Nhập tên hoặc email..."
                placeholderTextColor={theme.colors.placeholder}
                value={searchQ}
                onChangeText={setSearchQ}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQ.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQ('')}>
                  <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {searchQ.length < 2 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 48 }}>🤝</Text>
                <Text style={[s.emptySub, { color: theme.colors.textSecondary }]}>
                  Nhập ít nhất 2 ký tự để tìm kiếm
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 40 }}>😕</Text>
                <Text style={[s.emptySub, { color: theme.colors.textSecondary }]}>Không tìm thấy người dùng</Text>
              </View>
            ) : (
              searchResults.map(item => renderSearchUser({ item }))
            )}
          </>
        )}
      </ScrollView>

      {/* Photos Modal */}
      <PhotosModal
        visible={photosModal.visible}
        person={photosModal.person}
        photos={photosModal.person ? getFriendPhotos(photosModal.person.id) : []}
        onClose={() => setPhotosModal({ visible: false, person: null })}
        theme={theme}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const srStyles = StyleSheet.create({
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 10,
  },
  tabLabel: { fontSize: 12 },
  content: { padding: 14, paddingBottom: 32 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center' },
  findBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  findBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
