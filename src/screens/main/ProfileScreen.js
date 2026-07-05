// src/screens/main/ProfileScreen.js - Trang cá nhân với thống kê và grid memories
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, FlatList, Dimensions, Alert, Modal, TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';

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
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('auth.errorNameRequired'));
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ fullName: fullName.trim(), bio: bio.trim(), phonenumber: phonenumber.trim() });
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
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ProfileScreen({ navigation }) {
  const { theme, t } = useApp();
  const { user, logout, updateProfile } = useAuth();
  const { getMyMemories, getStats } = useMemory();

  const [showEdit, setShowEdit] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const myMemories = getMyMemories(user?.id);
  const stats = getStats(user?.id);

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
      if (status !== 'granted') { Alert.alert(t('common.error'), t('create.errorMediaPermission')); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        await updateProfile({ avatar: result.assets[0].uri });
      }
    } catch { Alert.alert(t('common.error'), t('errors.unknownError')); }
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
            <TouchableOpacity
              style={[styles.settingsBtn, { backgroundColor: theme.colors.inputBackground }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
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
          <StatItem value={stats.locations} label={t('profile.locations')} emoji="📍" theme={theme} />
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <StatItem value={stats.thisMonth} label={t('profile.thisMonth')} emoji="📅" theme={theme} />
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
});

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    profileHeader: {
      alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, marginBottom: 12,
    },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: theme.colors.primary },
    avatarPlaceholder: {
      width: 90, height: 90, borderRadius: 45,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 36, color: '#fff', fontWeight: '700' },
    editAvatarBadge: {
      position: 'absolute', bottom: 0, right: 0,
      width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: theme.colors.border,
    },
    userName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    userEmail: { fontSize: 13, marginBottom: 6 },
    userBio: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 6 },
    joinedText: { fontSize: 12, marginBottom: 16 },
    actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    editBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
    editBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    settingsBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    logoutBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    logoutBtnText: { fontSize: 16 },
    statsCard: {
      flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
      borderRadius: 16, paddingVertical: 16,
    },
    statDivider: { width: 1, marginVertical: 4 },
    memoriesSection: { paddingHorizontal: 16, paddingBottom: 32 },
    memoriesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    memoriesTitle: { fontSize: 17, fontWeight: '700' },
    viewToggle: { flexDirection: 'row', gap: 12 },
    viewToggleBtn: { fontSize: 22, color: '#999' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    emptyGrid: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyText: { fontSize: 14 },
    listItem: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
    listThumb: { width: 72, height: 72 },
    listInfo: { flex: 1, padding: 10, justifyContent: 'center', gap: 3 },
    listTitle: { fontSize: 14, fontWeight: '600' },
    listDate: { fontSize: 11 },
    listLocation: { fontSize: 11 },
  });
}
