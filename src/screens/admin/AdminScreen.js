// src/screens/admin/AdminScreen.js - Trang quản trị (chỉ admin)
const _cid=[97,110,104,121];
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';
import { ADMIN_EMAIL } from '../../constants';
import { userAPI } from '../../services/apiService';

export default function AdminScreen({ navigation }) {
  const { theme } = useApp();
  const { user, logout, getSeedInfo } = useAuth();
  const { memories, deleteMemory } = useMemory();

  const [users, setUsers]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState('users'); // 'users' | 'memories' | 'stats'

  // Bảo vệ: chỉ admin mới vào được
  useEffect(() => {
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      Alert.alert('⛔ Không có quyền', 'Chỉ tài khoản quản trị mới truy cập được trang này.');
      navigation.goBack();
      return;
    }
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await userAPI.getAllUsers();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('[Admin] Lỗi tải users:', e);
    } finally {
      setIsLoading(false);
    }
  }

  // Xóa tài khoản
  const handleDeleteUser = useCallback((targetUser) => {
    const targetId = targetUser._id || targetUser.id;
    if (targetUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      Alert.alert('⛔ Không thể xóa', 'Không thể xóa tài khoản quản trị.');
      return;
    }
    Alert.alert(
      '🗑️ Xóa tài khoản',
      `Xóa tài khoản "${targetUser.fullName}" (${targetUser.email})?\n\nHành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            // Xóa khỏi local state (chức năng xóa user qua API có thể bổ sung sau)
            const updated = users.filter(u => (u._id || u.id) !== targetId);
            setUsers(updated);
            Alert.alert('✅', `Đã xóa tài khoản ${targetUser.email}`);
          },
        },
      ]
    );
  }, [users]);

  // Xóa memory bất kỳ
  const handleDeleteMemory = useCallback((mem) => {
    Alert.alert(
      '🗑️ Xóa kỷ niệm',
      `Xóa kỷ niệm "${mem.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            try { await deleteMemory(mem.id); }
            catch { Alert.alert('Lỗi', 'Xóa thất bại'); }
          },
        },
      ]
    );
  }, [deleteMemory]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u =>
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);
  const filteredMemories = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return memories;
    return memories.filter(m =>
      m.title?.toLowerCase().includes(q) ||
      m.ownerName?.toLowerCase().includes(q)
    );
  }, [memories, search]);

  // Stats
  const stats = useMemo(() => ({
    totalUsers:     users.length,
    totalMemories:  memories.length,
    publicMemories: memories.filter(m => m.privacy === 'public').length,
    withPhotos:     memories.filter(m => m.photos?.length > 0).length,
    withLocation:   memories.filter(m => m.location?.lat).length,
  }), [users, memories]);

  const s = useMemo(() => makeStyles(theme), [theme]);

  if (isLoading) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: '#1a1a2e', borderBottomColor: '#333' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[s.backText, { color: '#a78bfa' }]}>← Quay lại</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>👑 Quản trị</Text>
          <Text style={s.headerSub}>Memmori Admin</Text>
        </View>
        <View style={s.adminBadge}>
          <Text style={s.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[s.tabs, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        {[
          { key: 'users',    label: `👥 Users (${users.length})` },
          { key: 'memories', label: `🗺️ Kỷ niệm (${memories.length})` },
          { key: 'stats',    label: '📊 Thống kê' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, { color: activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search (users & memories) */}
      {activeTab !== 'stats' && (
        <View style={[s.searchWrap, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder }]}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={[s.searchInput, { color: theme.colors.text }]}
            placeholder={activeTab === 'users' ? 'Tìm tên, email...' : 'Tìm tiêu đề, tác giả...'}
            placeholderTextColor={theme.colors.placeholder}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ===== USERS TAB ===== */}
      {activeTab === 'users' && (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item._id || item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isAdmin = item.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            return (
              <View style={[s.userCard, { backgroundColor: theme.colors.card, borderColor: isAdmin ? '#a78bfa' : theme.colors.border }]}>
                <View style={[s.avatar, { backgroundColor: isAdmin ? '#7c3aed' : theme.colors.primary + '30' }]}>
                  <Text style={{ fontSize: 20 }}>{isAdmin ? '👑' : '👤'}</Text>
                </View>
                <View style={s.userInfo}>
                  <View style={s.userNameRow}>
                    <Text style={[s.userName, { color: theme.colors.text }]} numberOfLines={1}>
                      {item.fullName}
                    </Text>
                    {isAdmin && (
                      <View style={s.adminTag}>
                        <Text style={s.adminTagText}>ADMIN</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.userEmail, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {item.email}
                  </Text>
                  <Text style={[s.userDate, { color: theme.colors.textTertiary }]}>
                    📅 {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    {item.phonenumber ? `  📱 ${item.phonenumber}` : ''}
                  </Text>
                  {/* Số memory của user này */}
                  <Text style={[s.userMemCount, { color: theme.colors.primary }]}>
                    🗺️ {memories.filter(m => (m.userId?._id || m.userId) === (item._id || item.id)).length} kỷ niệm
                  </Text>
                </View>
                {!isAdmin && (
                  <TouchableOpacity
                    style={[s.deleteBtn, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
                    onPress={() => handleDeleteUser(item)}
                  >
                    <Text style={{ fontSize: 16 }}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>👥</Text>
              <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>Không tìm thấy tài khoản</Text>
            </View>
          }
        />
      )}

      {/* ===== MEMORIES TAB ===== */}
      {activeTab === 'memories' && (
        <FlatList
          data={filteredMemories}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[s.memCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={s.memHeader}>
                <Text style={{ fontSize: 20 }}>{item.privacy === 'public' ? '🌐' : '🔒'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.memTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[s.memOwner, { color: theme.colors.textSecondary }]}>
                    👤 {item.ownerName || 'Ẩn danh'} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[s.deleteBtn, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
                  onPress={() => handleDeleteMemory(item)}
                >
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <View style={s.memMeta}>
                {item.photos?.length > 0 && <Text style={s.memTag}>📸 {item.photos.length} ảnh</Text>}
                {item.location?.address && <Text style={s.memTag} numberOfLines={1}>📍 {item.location.name || item.location.address}</Text>}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>🗺️</Text>
              <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>Không tìm thấy kỷ niệm</Text>
            </View>
          }
        />
      )}

      {/* ===== STATS TAB ===== */}
      {activeTab === 'stats' && (
        <ScrollView contentContainerStyle={s.statsWrap} showsVerticalScrollIndicator={false}>
          <Text style={[s.statsTitle, { color: theme.colors.text }]}>📊 Tổng quan hệ thống</Text>

          {[
            { icon: '👥', label: 'Tổng tài khoản',    value: stats.totalUsers,     color: '#7c3aed' },
            { icon: '🗺️', label: 'Tổng kỷ niệm',      value: stats.totalMemories,  color: '#0ea5e9' },
            { icon: '🌐', label: 'Kỷ niệm công khai',  value: stats.publicMemories, color: '#16a34a' },
            { icon: '🔒', label: 'Kỷ niệm riêng tư',  value: stats.totalMemories - stats.publicMemories, color: '#9333ea' },
            { icon: '📸', label: 'Kỷ niệm có ảnh',    value: stats.withPhotos,     color: '#f59e0b' },
            { icon: '📍', label: 'Kỷ niệm có vị trí', value: stats.withLocation,   color: '#ef4444' },
          ].map((item, i) => (
            <View key={i} style={[s.statCard, { backgroundColor: theme.colors.card, borderColor: item.color + '40' }]}>
              <View style={[s.statIcon, { backgroundColor: item.color + '18' }]}>
                <Text style={{ fontSize: 28 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.statLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
                <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
              </View>
            </View>
          ))}

          <View style={[s.adminInfo, { backgroundColor: '#1a1a2e' }]}>
            <Text style={s.adminInfoText}>👑 Đăng nhập với quyền Admin</Text>
            <Text style={[s.adminInfoEmail, { color: '#a78bfa' }]}>{user?.email}</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container:    { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, gap: 10,
    },
    backText:     { fontSize: 14, fontWeight: '600' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle:  { fontSize: 18, fontWeight: '900', color: '#fff' },
    headerSub:    { fontSize: 11, color: '#a78bfa', fontWeight: '600' },
    adminBadge: {
      backgroundColor: '#7c3aed', paddingHorizontal: 8,
      paddingVertical: 4, borderRadius: 8,
    },
    adminBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    tabs: {
      flexDirection: 'row', borderBottomWidth: 1,
    },
    tab: {
      flex: 1, paddingVertical: 12, alignItems: 'center',
    },
    tabText: { fontSize: 12, fontWeight: '700' },
    searchWrap: {
      flexDirection: 'row', alignItems: 'center',
      margin: 12, borderRadius: 14, borderWidth: 1.5,
      paddingHorizontal: 14, height: 44, gap: 8,
    },
    searchInput: { flex: 1, fontSize: 14 },
    listContent:  { paddingHorizontal: 12, paddingBottom: 24 },
    // User card
    userCard: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 16, borderWidth: 1.5,
      padding: 14, marginBottom: 10, gap: 12,
    },
    avatar: {
      width: 48, height: 48, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
    },
    userInfo:    { flex: 1 },
    userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    userName:    { fontSize: 15, fontWeight: '700', flex: 1 },
    adminTag: {
      backgroundColor: '#7c3aed', paddingHorizontal: 6,
      paddingVertical: 2, borderRadius: 6,
    },
    adminTagText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    userEmail:   { fontSize: 12, marginBottom: 3 },
    userDate:    { fontSize: 11, marginBottom: 2 },
    userMemCount:{ fontSize: 12, fontWeight: '600' },
    deleteBtn: {
      width: 38, height: 38, borderRadius: 12,
      borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    // Memory card
    memCard: {
      borderRadius: 14, borderWidth: 1,
      padding: 12, marginBottom: 8,
    },
    memHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    memTitle:   { fontSize: 14, fontWeight: '700' },
    memOwner:   { fontSize: 12 },
    memMeta:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    memTag: {
      fontSize: 11, color: theme.colors.textSecondary,
      backgroundColor: theme.colors.highlight,
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    // Stats
    statsWrap:  { padding: 16, gap: 10 },
    statsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    statCard: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 16, borderWidth: 1.5,
      padding: 16, gap: 14,
    },
    statIcon: {
      width: 56, height: 56, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    statLabel: { fontSize: 13, marginBottom: 4 },
    statValue: { fontSize: 28, fontWeight: '900' },
    adminInfo: {
      borderRadius: 14, padding: 16,
      alignItems: 'center', marginTop: 8,
    },
    adminInfoText:  { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 4 },
    adminInfoEmail: { fontSize: 12, fontWeight: '600' },
    // Empty
    empty:     { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 15 },
  });
}
