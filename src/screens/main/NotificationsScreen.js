// src/screens/main/NotificationsScreen.js - Màn hình thông báo
import React, { useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification, NOTIF_TYPES } from '../../context/NotificationContext';

// Icon theo loại thông báo
function notifIcon(type) {
  switch (type) {
    case NOTIF_TYPES.FRIEND_REQUEST:  return '🤝';
    case NOTIF_TYPES.FRIEND_ACCEPTED: return '✅';
    case NOTIF_TYPES.MEMORY_TAGGED:   return '🏷️';
    case NOTIF_TYPES.PROFILE_VIEWED:  return '👀';
    case NOTIF_TYPES.MEMORY_SHARED:   return '🔗';
    case NOTIF_TYPES.SYSTEM:          return '📢';
    default:                           return '🔔';
  }
}

function timeAgo(dateStr, t) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return t('notifications.justNow');
  if (mins < 60)  return t('notifications.minutesAgo', { n: mins });
  if (hours < 24) return t('notifications.hoursAgo', { n: hours });
  if (days < 7)   return t('notifications.daysAgo', { n: days });
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen({ navigation }) {
  const { theme, t } = useApp();
  const { user } = useAuth();
  const {
    getNotificationsForUser, markAsRead, markAllAsRead,
    deleteNotification, clearAllNotifications, isLoading,
  } = useNotification();

  const notifs = useMemo(
    () => getNotificationsForUser(user?.id),
    [getNotificationsForUser, user?.id]
  );

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const handlePress = useCallback(async (notif) => {
    if (!notif.isRead) await markAsRead(notif.id);
    // Điều hướng theo loại
    if (notif.data?.memoryId && notif.type === NOTIF_TYPES.MEMORY_TAGGED) {
      // navigation.navigate('MemoryDetail', { memory: ... })
    }
  }, [markAsRead]);

  const handleDelete = useCallback((notifId) => {
    Alert.alert(t('notifications.deleteOne'), t('notifications.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteNotification(notifId) },
    ]);
  }, [deleteNotification, t]);

  const handleClearAll = useCallback(() => {
    if (notifs.length === 0) return;
    Alert.alert(t('notifications.clearAll'), t('notifications.confirmClearAll'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('notifications.confirmClearBtn'), style: 'destructive', onPress: () => clearAllNotifications(user?.id) },
    ]);
  }, [notifs.length, clearAllNotifications, user?.id, t]);

  const s = useMemo(() => makeStyles(theme), [theme]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[
        s.item,
        !item.isRead && { backgroundColor: theme.colors.primary + '12', borderLeftColor: theme.colors.primary, borderLeftWidth: 3 },
      ]}
      onPress={() => handlePress(item)}
      activeOpacity={0.85}
    >
      <View style={[s.iconWrap, { backgroundColor: theme.colors.highlight }]}>
        <Text style={{ fontSize: 22 }}>{notifIcon(item.type)}</Text>
      </View>
      <View style={s.content}>
        <Text style={[s.title, { color: theme.colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[s.body, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[s.time, { color: theme.colors.textTertiary }]}>
          {timeAgo(item.createdAt, t)}
        </Text>
      </View>
      {!item.isRead && (
        <View style={[s.dot, { backgroundColor: theme.colors.primary }]} />
      )}
      <TouchableOpacity
        style={s.deleteBtn}
        onPress={() => handleDelete(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={{ fontSize: 14, color: theme.colors.textTertiary }}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  ), [handlePress, handleDelete, theme, s]);

  if (isLoading) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={[s.backText, { color: theme.colors.primary }]}>{t('notifications.back')}</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.colors.text }]}>
          {t('notifications.title')} {unreadCount > 0 ? t('notifications.unreadBadge', { n: unreadCount }) : ''}
        </Text>
        <View style={s.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={() => markAllAsRead(user?.id)}>
              <Text style={[s.actionText, { color: theme.colors.primary }]}>{t('notifications.markAllRead')}</Text>
            </TouchableOpacity>
          )}
          {notifs.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={{ marginLeft: 12 }}>
              <Text style={[s.actionText, { color: theme.colors.error }]}>{t('notifications.clearAll')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={notifs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifs.length === 0 ? s.emptyWrap : s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 56, marginBottom: 12 }}>🔕</Text>
            <Text style={[s.emptyTitle, { color: theme.colors.text }]}>{t('notifications.empty')}</Text>
            <Text style={[s.emptyBody, { color: theme.colors.textSecondary }]}>
              {t('notifications.emptySubtitle')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container:   { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, gap: 8,
    },
    backBtn:      { marginRight: 4 },
    backText:     { fontSize: 14, fontWeight: '600' },
    headerTitle:  { flex: 1, fontSize: 17, fontWeight: '800' },
    headerActions:{ flexDirection: 'row', alignItems: 'center' },
    actionText:   { fontSize: 13, fontWeight: '700' },
    listContent:  { paddingVertical: 8, paddingHorizontal: 12 },
    emptyWrap:    { flex: 1 },
    item: {
      flexDirection: 'row', alignItems: 'flex-start',
      backgroundColor: theme.colors.card,
      borderRadius: 16, padding: 14, marginVertical: 4,
      gap: 12, ...theme.shadows?.sm,
    },
    iconWrap: {
      width: 46, height: 46, borderRadius: 23,
      alignItems: 'center', justifyContent: 'center',
    },
    content: { flex: 1 },
    title:   { fontSize: 14, fontWeight: '700', marginBottom: 3 },
    body:    { fontSize: 13, lineHeight: 18, marginBottom: 4 },
    time:    { fontSize: 11 },
    dot: {
      width: 8, height: 8, borderRadius: 4,
      alignSelf: 'center', marginLeft: 4,
    },
    deleteBtn: { alignSelf: 'flex-start', padding: 4 },
    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingTop: 100,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyBody:  { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  });
}
