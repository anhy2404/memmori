// src/screens/main/MemoryDetailScreen.js - Màn hình chi tiết kỷ niệm
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useMemory } from '../../context/MemoryContext';

const { width } = Dimensions.get('window');

export default function MemoryDetailScreen({ route, navigation }) {
  const { memory: initialMemory } = route.params || {};
  const { theme, t } = useApp();
  const { deleteMemory, getMemoryById } = useMemory();

  // Lấy memory mới nhất từ context (để cập nhật nếu có thay đổi)
  const memory = initialMemory ? (getMemoryById(initialMemory.id) || initialMemory) : null;
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!memory) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.textSecondary }}>Không tìm thấy kỷ niệm</Text>
      </SafeAreaView>
    );
  }

  const dateStr = new Date(memory.createdAt).toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Xóa memory
  function handleDelete() {
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
              navigation.goBack();
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Ảnh gallery */}
        {memory.photos && memory.photos.length > 0 ? (
          <View>
            <Image
              source={{ uri: memory.photos[currentPhotoIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {memory.photos.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
                {memory.photos.map((uri, idx) => (
                  <TouchableOpacity key={idx} onPress={() => setCurrentPhotoIndex(idx)}>
                    <Image
                      source={{ uri }}
                      style={[styles.thumb, idx === currentPhotoIndex && { borderColor: theme.colors.primary, borderWidth: 2 }]}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : (
          <View style={[styles.noImagePlaceholder, { backgroundColor: theme.colors.highlight }]}>
            <Text style={{ fontSize: 64 }}>📝</Text>
          </View>
        )}

        {/* Nội dung */}
        <View style={styles.content}>
          {/* Tiêu đề */}
          <Text style={[styles.title, { color: theme.colors.text }]}>{memory.title}</Text>

          {/* Ngày */}
          <View style={styles.metaRow}>
            <Text style={styles.metaEmoji}>🗓️</Text>
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{dateStr}</Text>
          </View>

          {/* Địa điểm */}
          {memory.location?.address ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaEmoji}>📍</Text>
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {memory.location.address}
              </Text>
            </View>
          ) : null}

          {/* Mô tả */}
          {memory.description ? (
            <View style={[styles.descSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.descText, { color: theme.colors.text }]}>{memory.description}</Text>
            </View>
          ) : null}

          {/* AI Caption */}
          {memory.aiCaption && memory.aiCaption !== memory.description ? (
            <View style={[styles.aiSection, { backgroundColor: theme.colors.highlight, borderColor: theme.colors.primary }]}>
              <Text style={[styles.aiLabel, { color: theme.colors.primary }]}>✨ AI Caption</Text>
              <Text style={[styles.aiText, { color: theme.colors.text }]}>{memory.aiCaption}</Text>
            </View>
          ) : null}

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 ? (
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

          {/* Nút hành động */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: theme.colors.error + '15', borderColor: theme.colors.error }]}
              onPress={handleDelete}
            >
              <Text style={[styles.deleteBtnText, { color: theme.colors.error }]}>
                🗑️ {t('memoryDetail.deleteMemory')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    mainImage: { width: width, height: width * 0.75 },
    noImagePlaceholder: { width: width, height: 200, alignItems: 'center', justifyContent: 'center' },
    thumbRow: { paddingVertical: 10 },
    thumb: { width: 60, height: 60, borderRadius: 8 },
    content: { padding: 20, gap: 12 },
    title: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaEmoji: { fontSize: 16 },
    metaText: { fontSize: 14, flex: 1, lineHeight: 19 },
    descSection: { borderRadius: 12, borderWidth: 1, padding: 14 },
    descText: { fontSize: 15, lineHeight: 22 },
    aiSection: { borderRadius: 12, borderWidth: 1, padding: 12 },
    aiLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
    aiText: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
    tagsSection: { gap: 8 },
    sectionLabel: { fontSize: 12, fontWeight: '600' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    tagText: { fontSize: 13, fontWeight: '500' },
    actionRow: { marginTop: 8 },
    deleteBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 6,
    },
    deleteBtnText: { fontSize: 15, fontWeight: '600' },
  });
}
