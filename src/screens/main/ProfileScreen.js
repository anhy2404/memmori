// src/screens/main/ProfileScreen.js - Trang cá nhân với thống kê và grid memories
const _moduleRev = 0x1B0; // 432
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Dimensions, Alert, Modal, TextInput,
  ActivityIndicator, Linking, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';
import { useNotification } from '../../context/NotificationContext';
import { ADMIN_EMAIL } from '../../constants';
import { userAPI } from '../../services/apiService';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3;

// Component thống kê
function StatItem({ value, label, emoji, theme }) {
  return (
    <View style={statStyles.item}>
      <Text style={[statStyles.value, { color: theme.colors.primary }]}>{value}</Text>
      <Text style={[statStyles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// Grid item
function GridItem({ memory, size, theme, onPress }) {
  const firstPhoto = memory.photos && memory.photos.length > 0 ? memory.photos[0] : null;
  return (
    <TouchableOpacity
      style={[gridStyles.item, { width: size, height: size }]}
      onPress={() => onPress(memory)}
      activeOpacity={0.8}
    >
      {firstPhoto ? (
        <Image source={{ uri: firstPhoto }} style={gridStyles.image} resizeMode="cover" />
      ) : (
        <View style={[gridStyles.placeholder, { backgroundColor: theme.colors.highlight }]}>
          <Text style={{ fontSize: 24 }}>📝</Text>
        </View>
      )}
      {memory.video ? (
        <View style={gridStyles.videoBadge}>
          <Text style={{ fontSize: 10 }}>🎥</Text>
        </View>
      ) : null}
      {memory.photos && memory.photos.length > 1 ? (
        <View style={[gridStyles.countBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Text style={gridStyles.countBadgeText}>+{memory.photos.length}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// Modal chỉnh sửa hồ sơ
function EditProfileModal({ user, visible, onClose, onSave, theme, t }) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phonenumber, setPhonenumber] = useState(user?.phonenumber || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [isSaving, setIsSaving] = useState(false);

  const GENDER_OPTIONS = [
    { value: 'male', label: t('auth.genderMale') },
    { value: 'female', label: t('auth.genderFemale') },
    { value: 'other', label: t('auth.genderOther') },
    { value: '', label: t('auth.genderPreferNotSay') },
  ];

  // Đồng bộ giá trị khi modal mở
  React.useEffect(() => {
    if (visible) {
      setFullName(user?.fullName || '');
      setBio(user?.bio || '');
      setPhonenumber(user?.phonenumber || '');
      setGender(user?.gender || '');
    }
  }, [visible, user]);

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('auth.errorNameRequired'));
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ fullName: fullName.trim(), bio: bio.trim(), phonenumber: phonenumber.trim(), gender });
      onClose();
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={[editStyles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[editStyles.cancelText, { color: theme.colors.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={[editStyles.title, { color: theme.colors.text }]}>{t('profile.editProfile')}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={theme.colors.primary} /> : (
              <Text style={[editStyles.saveText, { color: theme.colors.primary }]}>{t('common.save')}</Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View>
            <Text style={[editStyles.label, { color: theme.colors.text }]}>{t('auth.fullName')}</Text>
            <TextInput
              style={[editStyles.input, { color: theme.colors.text, borderColor: theme.colors.inputBorder, backgroundColor: theme.colors.inputBackground }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('auth.fullName')}
              placeholderTextColor={theme.colors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
          <View>
            <Text style={[editStyles.label, { color: theme.colors.text }]}>{t('auth.phonenumber')}</Text>
            <TextInput
              style={[editStyles.input, { color: theme.colors.text, borderColor: theme.colors.inputBorder, backgroundColor: theme.colors.inputBackground }]}
              value={phonenumber}
              onChangeText={setPhonenumber}
              placeholder={t('auth.phonenumber')}
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>
          <View>
            <Text style={[editStyles.label, { color: theme.colors.text }]}>{t('profile.bio')}</Text>
            <TextInput
              style={[editStyles.input, { color: theme.colors.text, borderColor: theme.colors.inputBorder, backgroundColor: theme.colors.inputBackground, minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              value={bio}
              onChangeText={setBio}
              placeholder={t('profile.bioPlaceholder')}
              placeholderTextColor={theme.colors.placeholder}
              multiline
              maxLength={200}
              autoCapitalize="sentences"
              autoCorrect={false}
            />
          </View>
          {/* Giới tính - tùy chọn, không bắt buộc */}
          <View>
            <Text style={[editStyles.label, { color: theme.colors.text }]}>{t('profile.genderLabel')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GENDER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    editStyles.genderBtn,
                    { borderColor: theme.colors.inputBorder, backgroundColor: theme.colors.inputBackground },
                    gender === opt.value && { borderColor: theme.colors.primary, backgroundColor: theme.colors.highlight },
                  ]}
                  onPress={() => setGender(opt.value)}
                >
                  <Text style={[
                    editStyles.genderBtnText,
                    { color: theme.colors.textSecondary },
                    gender === opt.value && { color: theme.colors.primary, fontWeight: '700' },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ===== STAT DETAIL MODAL =====
function StatModal({ visible, type, memories, onClose, onPressMemory, theme, t }) {
  const isLocations = type === 'locations';
  const title = isLocations ? '📍 Địa điểm đã đến' : '📅 Kỷ niệm tháng này';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Header */}
        <View style={[smStyles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[smStyles.title, { color: theme.colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={smStyles.closeBtn}>
            <Text style={[smStyles.closeText, { color: theme.colors.primary }]}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        {memories.length === 0 ? (
          <View style={smStyles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>{isLocations ? '🗺️' : '📅'}</Text>
            <Text style={[smStyles.emptyText, { color: theme.colors.textSecondary }]}>
              {isLocations ? 'Chưa có địa điểm nào' : 'Chưa có kỷ niệm nào tháng này'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={memories}
            keyExtractor={m => m.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const photo = item.photos?.[0];
              const date = new Date(item.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              });
              const time = new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit', minute: '2-digit',
              });
              return (
                <TouchableOpacity
                  style={[smStyles.row, {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    ...theme.shadows.sm,
                  }]}
                  onPress={() => { onClose(); onPressMemory(item); }}
                  activeOpacity={0.85}
                >
                  {/* Thumb */}
                  {photo ? (
                    <Image source={{ uri: photo }} style={smStyles.thumb} />
                  ) : (
                    <View style={[smStyles.thumb, { backgroundColor: theme.colors.highlight, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 22 }}>📝</Text>
                    </View>
                  )}
                  {/* Info */}
                  <View style={smStyles.info}>
                    <Text style={[smStyles.memTitle, { color: theme.colors.text }]} numberOfLines={1}>
                      {item.title || t('home.untitledMemory')}
                    </Text>
                    {isLocations && item.location?.address ? (
                      <Text style={[smStyles.location, { color: theme.colors.primary }]} numberOfLines={1}>
                        📍 {item.location.address}
                      </Text>
                    ) : null}
                    <Text style={[smStyles.date, { color: theme.colors.textTertiary }]}>
                      🗓️ {date}  ·  {time}
                    </Text>
                  </View>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const smStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  title:     { fontSize: 17, fontWeight: '800' },
  closeBtn:  { paddingHorizontal: 4, paddingVertical: 4 },
  closeText: { fontSize: 15, fontWeight: '700' },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
  },
  thumb:    { width: 68, height: 68 },
  info:     { flex: 1, paddingVertical: 10, gap: 3 },
  memTitle: { fontSize: 14, fontWeight: '700' },
  location: { fontSize: 12, fontWeight: '600' },
  date:     { fontSize: 11 },
});

export default function ProfileScreen({ navigation }) {
  const { theme, t } = useApp();
  const { user, logout, updateProfile } = useAuth();
  const { getMyMemories, getStats } = useMemory();
  const { getUnreadCount } = useNotification();

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const unreadCount = getUnreadCount(user?.id);

  const [showEdit, setShowEdit] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [statModal, setStatModal] = useState(null); // null | 'locations' | 'thisMonth'

  const myMemories = useMemo(() => getMyMemories(user?.id), [user?.id, getMyMemories]);
  const stats = useMemo(() => getStats(user?.id), [user?.id, getStats]);

  // Danh sách địa điểm duy nhất kèm memories
  const locationMemories = useMemo(() => {
    const seen = new Set();
    return myMemories
      .filter(m => m.location?.name)
      .filter(m => {
        if (seen.has(m.location.name)) return false;
        seen.add(m.location.name);
        return true;
      })
      .map(m => ({ ...m }));
  }, [myMemories]);

  // Memories tháng này
  const thisMonthMemories = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    return myMemories.filter(m => new Date(m.createdAt) >= monthStart);
  }, [myMemories]);

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    : '';

  // Đăng xuất
  function handleLogout() {
    Alert.alert(
      t('profile.logout'),
      t('profile.confirmLogout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: async () => {
          try { await logout(); } catch { Alert.alert(t('common.error'), t('auth.errorLogoutFailed')); }
        }},
      ]
    );
  }

  // Đổi avatar
  async function handleChangeAvatar() {
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
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        // Upload avatar lên server
        const data = await userAPI.uploadAvatar(uri);
        if (data.success) {
          // updateProfile để refresh user state với avatar URL từ server
          await updateProfile({ avatar: data.avatarUrl || uri });
        } else {
          // fallback: lưu URI tạm
          await updateProfile({ avatar: uri });
        }
        Alert.alert('✅', t('profile.updateSuccess'));
      }
    } catch (err) {
      console.error('[ProfileScreen] Lỗi đổi avatar:', err);
      Alert.alert(t('common.error'), t('errors.unknownError'));
    }
  }

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarContainer} onPress={handleChangeAvatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={[styles.editAvatarBadge, { backgroundColor: theme.colors.surface }]}>
              <Text style={{ fontSize: 14 }}>📷</Text>
            </View>
          </TouchableOpacity>

          {/* Info */}
          <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.fullName}</Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
          {user?.bio ? (
            <Text style={[styles.userBio, { color: theme.colors.textSecondary }]}>{user.bio}</Text>
          ) : null}
          {joinedDate ? (
            <Text style={[styles.joinedText, { color: theme.colors.textTertiary }]}>
              📅 {t('profile.joinedDate')}: {joinedDate}
            </Text>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowEdit(true)}
            >
              <Text style={styles.editBtnText}>✏️ {t('profile.editProfile')}</Text>
            </TouchableOpacity>

            {/* Thông báo với badge */}
            <TouchableOpacity
              style={[styles.settingsBtn, { backgroundColor: theme.colors.inputBackground }]}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View>
                <Text style={{ fontSize: 18 }}>🔔</Text>
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute', top: -4, right: -4,
                    backgroundColor: '#ef4444', borderRadius: 8,
                    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsBtn, { backgroundColor: theme.colors.inputBackground }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>

            {/* Admin button - chỉ hiện với admin */}
            {isAdmin && (
              <TouchableOpacity
                style={[styles.settingsBtn, { backgroundColor: '#7c3aed20' }]}
                onPress={() => navigation.navigate('Admin')}
              >
                <Text style={{ fontSize: 18 }}>👑</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.logoutBtn, { backgroundColor: theme.colors.error + '20' }]}
              onPress={handleLogout}
            >
              <Text style={[styles.logoutBtnText, { color: theme.colors.error }]}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Thống kê */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
          <StatItem value={stats.total} label={t('profile.memories')} emoji="🗺️" theme={theme} />
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <TouchableOpacity style={statStyles.item} onPress={() => setStatModal('locations')} activeOpacity={0.7}>
            <Text style={[statStyles.value, { color: theme.colors.primary }]}>{stats.locations}</Text>
            <Text style={[statStyles.label, { color: theme.colors.secondary }]}>
              {t('profile.locations')} ›
            </Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <TouchableOpacity style={statStyles.item} onPress={() => setStatModal('thisMonth')} activeOpacity={0.7}>
            <Text style={[statStyles.value, { color: theme.colors.primary }]}>{stats.thisMonth}</Text>
            <Text style={[statStyles.label, { color: theme.colors.secondary }]}>
              {t('profile.thisMonth')} ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Memories grid/list */}
        <View style={styles.memoriesSection}>
          <View style={styles.memoriesHeader}>
            <Text style={[styles.memoriesTitle, { color: theme.colors.text }]}>
              {t('profile.myMemories')}
            </Text>
            <View style={styles.viewToggle}>
              <TouchableOpacity onPress={() => setViewMode('grid')}>
                <Text style={[styles.viewToggleBtn, viewMode === 'grid' && { color: theme.colors.primary }]}>⊞</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewMode('list')}>
                <Text style={[styles.viewToggleBtn, viewMode === 'list' && { color: theme.colors.primary }]}>☰</Text>
              </TouchableOpacity>
            </View>
          </View>

          {myMemories.length === 0 ? (
            <View style={styles.emptyGrid}>
              <Text style={{ fontSize: 48 }}>📷</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('profile.noMemoriesYet')}</Text>
            </View>
          ) : viewMode === 'grid' ? (
            <View style={styles.grid}>
              {myMemories.map(memory => (
                <GridItem
                  key={memory.id}
                  memory={memory}
                  size={GRID_ITEM_SIZE}
                  theme={theme}
                  onPress={() => navigation.navigate('MemoryDetail', { memory })}
                />
              ))}
            </View>
          ) : (
            myMemories.map(memory => {
              const firstPhoto = memory.photos?.[0];
              return (
                <TouchableOpacity
                  key={memory.id}
                  style={[styles.listItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  onPress={() => navigation.navigate('MemoryDetail', { memory })}
                >
                  {firstPhoto ? (
                    <Image source={{ uri: firstPhoto }} style={styles.listThumb} />
                  ) : (
                    <View style={[styles.listThumb, { backgroundColor: theme.colors.highlight, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text>📝</Text>
                    </View>
                  )}
                  <View style={styles.listInfo}>
                    <Text style={[styles.listTitle, { color: theme.colors.text }]} numberOfLines={1}>{memory.title}</Text>
                    <Text style={[styles.listDate, { color: theme.colors.textTertiary }]}>
                      {new Date(memory.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                    {memory.location?.address ? (
                      <Text style={[styles.listLocation, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                        📍 {memory.location.address}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal thống kê chi tiết */}
      <StatModal
        visible={statModal !== null}
        type={statModal}
        memories={statModal === 'locations' ? locationMemories : thisMonthMemories}
        onClose={() => setStatModal(null)}
        onPressMemory={(m) => navigation.navigate('MemoryDetail', { memory: m })}
        theme={theme}
        t={t}
      />

      {/* Modal chỉnh sửa */}
      <EditProfileModal
        user={user}
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        onSave={updateProfile}
        theme={theme}
        t={t}
      />
    </SafeAreaView>
  );
}

const statStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 11, textAlign: 'center' },
});

const gridStyles = StyleSheet.create({
  item: { margin: 2, borderRadius: 8, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  videoBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: 2,
  },
  countBadge: {
    position: 'absolute', bottom: 4, right: 4, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2,
  },
  countBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

const editStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '700' },
  cancelText: { fontSize: 16 },
  saveText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  genderBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  genderBtnText: { fontSize: 13 },
});

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    profileHeader: {
      alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, marginBottom: 12,
      borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    avatarContainer: { position: 'relative', marginBottom: 14 },
    avatar: {
      width: 96, height: 96, borderRadius: 48,
      borderWidth: 3.5, borderColor: theme.colors.primary,
    },
    avatarPlaceholder: {
      width: 96, height: 96, borderRadius: 48,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 38, color: '#fff', fontWeight: '800' },
    editAvatarBadge: {
      position: 'absolute', bottom: 0, right: 0,
      width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: theme.colors.border,
    },
    userName:   { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    userEmail:  { fontSize: 13, marginBottom: 6 },
    userBio:    { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 6, paddingHorizontal: 16 },
    joinedText: { fontSize: 12, marginBottom: 18 },
    actionRow:  { flexDirection: 'row', gap: 10, alignItems: 'center' },
    editBtn:    { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24 },
    editBtnText:{ color: '#fff', fontSize: 13, fontWeight: '700' },
    settingsBtn:{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    logoutBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    logoutBtnText: { fontSize: 17 },
    statsCard: {
      flexDirection: 'row', marginHorizontal: 16, marginBottom: 14,
      borderRadius: 20, paddingVertical: 16,
    },
    statDivider: { width: 1, marginVertical: 4 },
    memoriesSection: { paddingHorizontal: 16, paddingBottom: 32 },
    memoriesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    memoriesTitle: { fontSize: 17, fontWeight: '800' },
    viewToggle: { flexDirection: 'row', gap: 12 },
    viewToggleBtn: { fontSize: 22, color: '#999' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    emptyGrid: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyText: { fontSize: 14 },
    listItem: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
    listThumb: { width: 72, height: 72 },
    listInfo: { flex: 1, padding: 10, justifyContent: 'center', gap: 3 },
    listTitle: { fontSize: 14, fontWeight: '700' },
    listDate: { fontSize: 11 },
    listLocation: { fontSize: 11 },
  });
}
