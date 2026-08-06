// src/screens/main/MemoryDetailScreen.js - Chi tiết kỷ niệm
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Dimensions, Alert, Share,
  TextInput, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useMemory } from '../../context/MemoryContext';

const { width } = Dimensions.get('window');

export default function MemoryDetailScreen({ route, navigation }) {
  const { memory: initialMemory } = route.params || {};
  const { theme, t } = useApp();
  const { user } = useAuth();
  const { deleteMemory, updateMemory, getMemoryById } = useMemory();

  const memory = initialMemory
    ? (getMemoryById(initialMemory.id) || initialMemory)
    : null;

  const isOwner = memory?.userId === user?.id;

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  // ===== Not found =====
  if (!memory) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 16, marginBottom: 16 }}>
          {t('memoryDetail.notFound')}
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>← {t('common.back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const dateStr = new Date(memory.createdAt).toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ===== Xóa =====
  const handleDelete = useCallback(() => {
    if (isDeleting || !isOwner) return;
    Alert.alert(
      t('memoryDetail.deleteMemory'),
      t('memoryDetail.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteMemory(memory.id);
              navigation.goBack();
            } catch {
              Alert.alert(t('common.error'), t('memoryDetail.deleteFailed'));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [isDeleting, memory.id, t, deleteMemory, navigation]);

  // ===== Bắt đầu chỉnh sửa =====
  function startEdit() {
    setEditTitle(memory.title);
    setEditDesc(memory.description || '');
    setIsEditing(true);
  }

  // ===== Lưu chỉnh sửa =====
  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) {
      Alert.alert(t('common.error'), t('create.errorTitleRequired'));
      return;
    }
    setIsSaving(true);
    try {
      await updateMemory(memory.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
      setIsEditing(false);
    } catch {
      Alert.alert(t('common.error'), t('memoryDetail.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [editTitle, editDesc, memory.id, updateMemory, t]);

  // ===== Đổi quyền riêng tư =====
  const handleTogglePrivacy = useCallback(async () => {
    if (!isOwner) return;
    const newPrivacy = memory.privacy === 'public' ? 'private' : 'public';
    try {
      await updateMemory(memory.id, { privacy: newPrivacy });
    } catch {
      Alert.alert(t('common.error'), t('memoryDetail.updateFailed'));
    }
  }, [isOwner, memory, updateMemory, t]);

  // ===== Chia sẻ =====
  const handleShare = useCallback(async () => {
    try {
      const parts = [`📍 ${memory.title}`];
      if (memory.location?.address) parts.push(`🗺️ ${memory.location.address}`);
      if (memory.description) parts.push(`\n${memory.description}`);
      parts.push(`\n${t('memoryDetail.shareMessage')}`);
      await Share.share({ message: parts.join('\n') });
    } catch (err) {
      if (err.message !== 'User did not share') {
        Alert.alert(t('common.error'), t('memoryDetail.shareFailed'));
      }
    }
  }, [memory, t]);

  // ===== Xem bản đồ =====
  const handleViewOnMap = useCallback(() => {
    if (!memory.location?.lat) {
      Alert.alert('📍', t('memoryDetail.noLocation'));
      return;
    }
    const { lat, lng } = memory.location;
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url).catch(() =>
      Alert.alert(t('common.error'), t('memoryDetail.mapsOpenFailed'))
    );
  }, [memory.location, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ===== ẢNH GALLERY ===== */}
        {memory.photos?.length > 0 ? (
          <View>
            <Image
              source={{ uri: memory.photos[currentPhotoIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {memory.photos.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={styles.thumbRow}
                contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
                {memory.photos.map((uri, idx) => (
                  <TouchableOpacity key={idx} onPress={() => setCurrentPhotoIndex(idx)}>
                    <Image
                      source={{ uri }}
                      style={[styles.thumb, idx === currentPhotoIndex && {
                        borderColor: theme.colors.primary, borderWidth: 2.5,
                      }]}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {/* Photo counter */}
            {memory.photos.length > 1 && (
              <View style={[styles.photoCounter, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  {currentPhotoIndex + 1} / {memory.photos.length}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.noImagePlaceholder, { backgroundColor: theme.colors.highlight }]}>
            <Text style={{ fontSize: 64 }}>📝</Text>
          </View>
        )}

        {/* ===== NỘI DUNG ===== */}
        <View style={styles.content}>

          {/* Tiêu đề + action buttons */}
          <View style={styles.titleRow}>
            {isEditing ? (
              <TextInput
                style={[styles.editTitleInput, { color: theme.colors.text, borderColor: theme.colors.primary, backgroundColor: theme.colors.inputBackground }]}
                value={editTitle}
                onChangeText={setEditTitle}
                maxLength={100}
                autoCapitalize="sentences"
                autoFocus
              />
            ) : (
              <Text style={[styles.title, { color: theme.colors.text }]}>{memory.title}</Text>
            )}
          </View>

          {/* Action bar */}
          <View style={[styles.actionBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {/* Chỉnh sửa - chỉ owner */}
            {isOwner && (!isEditing ? (
              <TouchableOpacity style={styles.actionBarBtn} onPress={startEdit}>
                <Text style={styles.actionBarEmoji}>✏️</Text>
                <Text style={[styles.actionBarLabel, { color: theme.colors.primary }]}>{t('common.edit')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBarBtn, { opacity: isSaving ? 0.6 : 1 }]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator size="small" color={theme.colors.success} />
                  : <Text style={styles.actionBarEmoji}>💾</Text>
                }
                <Text style={[styles.actionBarLabel, { color: theme.colors.success }]}>{t('common.save')}</Text>
              </TouchableOpacity>
            ))}

            {isOwner && <View style={[styles.actionBarDivider, { backgroundColor: theme.colors.border }]} />}

            {/* Chia sẻ */}
            <TouchableOpacity style={styles.actionBarBtn} onPress={handleShare}>
              <Text style={styles.actionBarEmoji}>🔗</Text>
              <Text style={[styles.actionBarLabel, { color: theme.colors.secondary }]}>{t('common.share')}</Text>
            </TouchableOpacity>

            <View style={[styles.actionBarDivider, { backgroundColor: theme.colors.border }]} />

            {/* Xem bản đồ */}
            <TouchableOpacity style={styles.actionBarBtn} onPress={handleViewOnMap}>
              <Text style={styles.actionBarEmoji}>🗺️</Text>
              <Text style={[styles.actionBarLabel, { color: theme.colors.info }]}>{t('memoryDetail.viewOnMap')}</Text>
            </TouchableOpacity>

            {/* Xóa - chỉ owner */}
            {isOwner && (
              <>
                <View style={[styles.actionBarDivider, { backgroundColor: theme.colors.border }]} />
                <TouchableOpacity
                  style={[styles.actionBarBtn, { opacity: isDeleting ? 0.5 : 1 }]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? <ActivityIndicator size="small" color={theme.colors.error} />
                    : <Text style={styles.actionBarEmoji}>🗑️</Text>
                  }
                  <Text style={[styles.actionBarLabel, { color: theme.colors.error }]}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Hủy chỉnh sửa */}
          {isEditing && (
            <TouchableOpacity
              style={[styles.cancelEditBtn, { borderColor: theme.colors.border }]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}

          {/* Ngày */}
          <View style={styles.metaRow}>
            <Text style={styles.metaEmoji}>🗓️</Text>
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{dateStr}</Text>
          </View>

          {/* Địa điểm */}
          {memory.location?.address ? (
            <TouchableOpacity style={styles.metaRow} onPress={handleViewOnMap} activeOpacity={0.7}>
              <Text style={styles.metaEmoji}>📍</Text>
              <Text style={[styles.metaText, { color: theme.colors.primary }]}>
                {memory.location.address}
              </Text>
              <Text style={{ color: theme.colors.primary, fontSize: 12 }}>›</Text>
            </TouchableOpacity>
          ) : null}

          {/* Mô tả */}
          {isEditing ? (
            <View style={[styles.descSection, { borderColor: theme.colors.primary, backgroundColor: theme.colors.inputBackground }]}>
              <TextInput
                style={[styles.editDescInput, { color: theme.colors.text }]}
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
                maxLength={1000}
                textAlignVertical="top"
                autoCapitalize="sentences"
                placeholder={t('create.descriptionPlaceholder')}
                placeholderTextColor={theme.colors.placeholder}
              />
              <Text style={{ fontSize: 11, color: theme.colors.textTertiary, textAlign: 'right', marginTop: 4 }}>
                {editDesc.length}/1000
              </Text>
            </View>
          ) : memory.description ? (
            <View style={[styles.descSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.descText, { color: theme.colors.text }]}>{memory.description}</Text>
            </View>
          ) : null}

          {/* AI Caption */}
          {memory.aiCaption && memory.aiCaption !== memory.description ? (
            <View style={[styles.aiSection, { backgroundColor: theme.colors.highlight, borderColor: theme.colors.primary }]}>
              <Text style={[styles.aiLabel, { color: theme.colors.primary }]}>{t('memoryDetail.aiCaptionLabel')}</Text>
              <Text style={[styles.aiText, { color: theme.colors.text }]}>{memory.aiCaption}</Text>
            </View>
          ) : null}

          {/* Tags */}
          {memory.tags?.length > 0 ? (
            <View style={styles.tagsSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                🏷️ {t('memoryDetail.tags')}
              </Text>
              <View style={styles.tagsRow}>
                {memory.tags.map((tag, idx) => (
                  <View key={idx} style={[styles.tag, { backgroundColor: theme.colors.highlight }]}>
                    <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Tagged users */}
          {memory.taggedUsers?.length > 0 ? (
            <View style={styles.tagsSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                {t('memoryDetail.taggedUsersLabel')}
              </Text>
              <View style={styles.tagsRow}>
                {memory.taggedUsers.map((u) => (
                  <View key={u.id} style={[styles.tag, { backgroundColor: theme.colors.highlight, flexDirection: 'row', gap: 4 }]}>
                    <Text style={{ fontSize: 11 }}>👤</Text>
                    <Text style={[styles.tagText, { color: theme.colors.secondary }]}>@{u.fullName}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Privacy */}
          <View style={[styles.privacyRow, {
            backgroundColor: memory.privacy === 'public' ? '#f0fdf4' : theme.colors.surface,
            borderColor: memory.privacy === 'public' ? '#86efac' : theme.colors.border,
          }]}>
            {/* Icon + label */}
            <View style={[styles.privacyIconWrap, {
              backgroundColor: memory.privacy === 'public' ? '#dcfce7' : '#f1f5f9',
            }]}>
              <Text style={{ fontSize: 18 }}>
                {memory.privacy === 'public' ? '🌐' : '🔒'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.privacyLabel, {
                color: memory.privacy === 'public' ? '#16a34a' : '#334155',
              }]}>
                {memory.privacy === 'public' ? t('privacy.public') : t('privacy.onlyMe')}
              </Text>
              <Text style={[styles.privacyDesc, { color: theme.colors.textTertiary }]}>
                {memory.privacy === 'public' ? t('privacy.publicDesc') : t('privacy.privateDesc')}
              </Text>
            </View>
            {isOwner && (
              <TouchableOpacity
                style={[styles.togglePrivacyBtn, {
                  backgroundColor: memory.privacy === 'public' ? '#fef2f2' : '#f0fdf4',
                  borderColor: memory.privacy === 'public' ? '#fca5a5' : '#86efac',
                }]}
                onPress={handleTogglePrivacy}
              >
                <Text style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: memory.privacy === 'public' ? '#dc2626' : '#16a34a',
                }}>
                  {memory.privacy === 'public' ? t('privacy.switchToPrivate') : t('privacy.switchToPublic')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Padding bottom */}
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    mainImage: { width, height: width * 0.72 },
    noImagePlaceholder: { width, height: 200, alignItems: 'center', justifyContent: 'center' },
    thumbRow: { paddingVertical: 10 },
    thumb: { width: 62, height: 62, borderRadius: 10 },
    photoCounter: {
      position: 'absolute', top: 12, right: 14,
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    content: { padding: 18, gap: 12 },
    titleRow: { marginBottom: 2 },
    title: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
    editTitleInput: {
      fontSize: 20, fontWeight: '700', borderRadius: 10,
      borderWidth: 2, paddingHorizontal: 12, paddingVertical: 8,
    },
    // Action bar
    actionBar: {
      flexDirection: 'row', borderRadius: 14, borderWidth: 1,
      overflow: 'hidden',
    },
    actionBarBtn: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingVertical: 10, gap: 3,
    },
    actionBarEmoji: { fontSize: 18 },
    actionBarLabel: { fontSize: 10, fontWeight: '600' },
    actionBarDivider: { width: 1, marginVertical: 8 },
    cancelEditBtn: {
      alignItems: 'center', paddingVertical: 8,
      borderRadius: 10, borderWidth: 1,
    },
    // Meta
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaEmoji: { fontSize: 16 },
    metaText: { fontSize: 14, flex: 1, lineHeight: 19 },
    // Desc
    descSection: { borderRadius: 12, borderWidth: 1, padding: 14 },
    descText: { fontSize: 15, lineHeight: 22 },
    editDescInput: { fontSize: 14, lineHeight: 21, minHeight: 80 },
    // AI
    aiSection: { borderRadius: 12, borderWidth: 1, padding: 12 },
    aiLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
    aiText: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
    // Tags
    tagsSection: { gap: 8 },
    sectionLabel: { fontSize: 12, fontWeight: '600' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    tagText: { fontSize: 13, fontWeight: '500' },
    // Privacy
    privacyRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderRadius: 14, borderWidth: 1.5, padding: 14,
    },
    privacyIconWrap: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
    },
    privacyLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    privacyDesc: { fontSize: 12 },
    togglePrivacyBtn: {
      paddingHorizontal: 10, paddingVertical: 7,
      borderRadius: 10, borderWidth: 1.5,
    },
  });
}
