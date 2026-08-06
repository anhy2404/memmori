// src/screens/settings/SettingsScreen.js
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Alert, Modal, TextInput, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LANGUAGES, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '../../i18n';
import { ACCENT_PRESETS } from '../../theme';

// ===== AccentColorRow (inline trong Settings) =====
function AccentColorRow({ accentColor, onSelect, theme }) {
  const active = ACCENT_PRESETS.find(p => p.id === accentColor);
  return (
    <View style={accentStyles.wrap}>
      {/* Header */}
      <View style={accentStyles.header}>
        <Text style={[accentStyles.title, { color: theme.colors.textSecondary }]}>
          🎨 MÀU CHỦ ĐẠO
        </Text>
        <View style={[accentStyles.preview, { backgroundColor: active?.primary }]}>
          <Text style={accentStyles.previewText}>{active?.label}</Text>
        </View>
      </View>

      {/* Palette grid */}
      <View style={accentStyles.grid}>
        {ACCENT_PRESETS.map(preset => {
          const isActive = accentColor === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              onPress={() => onSelect(preset.id)}
              activeOpacity={0.82}
              style={[
                accentStyles.swatch,
                { backgroundColor: preset.primary },
                isActive && {
                  shadowColor: preset.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.55,
                  shadowRadius: 8,
                  elevation: 10,
                  transform: [{ scale: 1.13 }],
                },
              ]}
            >
              {isActive && (
                <View style={accentStyles.checkCircle}>
                  <Text style={accentStyles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const accentStyles = StyleSheet.create({
  wrap:        { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:       { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  preview:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  previewText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  swatch: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});

// ===== SettingRow =====
function SettingRow({ icon, label, value, onPress, rightComponent, theme, showArrow = true }) {
  return (
    <TouchableOpacity
      style={[rowStyles.row, { borderBottomColor: theme.colors.divider }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={rowStyles.icon}>{icon}</Text>
      <View style={rowStyles.content}>
        <Text style={[rowStyles.label, { color: theme.colors.text }]}>{label}</Text>
        {value ? <Text style={[rowStyles.value, { color: theme.colors.textSecondary }]}>{value}</Text> : null}
      </View>
      {rightComponent || (showArrow && onPress
        ? <Text style={[rowStyles.arrow, { color: theme.colors.textTertiary }]}>›</Text>
        : null)}
    </TouchableOpacity>
  );
}

// ===== SettingGroup =====
function SettingGroup({ title, children, theme }) {
  return (
    <View style={[groupStyles.group, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
      {title ? <Text style={[groupStyles.title, { color: theme.colors.textSecondary }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

// ===== Tutorial Modal =====
function TutorialModal({ visible, onClose, theme, t }) {
  const steps = [
    { key: 1, title: t('settings.tutorialStep1Title'), desc: t('settings.tutorialStep1Desc'), emoji: '👤' },
    { key: 2, title: t('settings.tutorialStep2Title'), desc: t('settings.tutorialStep2Desc'), emoji: '📷' },
    { key: 3, title: t('settings.tutorialStep3Title'), desc: t('settings.tutorialStep3Desc'), emoji: '📍' },
    { key: 4, title: t('settings.tutorialStep4Title'), desc: t('settings.tutorialStep4Desc'), emoji: '🗺️' },
    { key: 5, title: t('settings.tutorialStep5Title'), desc: t('settings.tutorialStep5Desc'), emoji: '🔍' },
    { key: 6, title: t('settings.tutorialStep6Title'), desc: t('settings.tutorialStep6Desc'), emoji: '🤖' },
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={[modalHeader.row, { borderBottomColor: theme.colors.border }]}>
          <Text style={[modalHeader.title, { color: theme.colors.text }]}>📖 {t('settings.tutorial')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[modalHeader.close, { color: theme.colors.primary }]}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {steps.map(step => (
            <View key={step.key} style={[tutStyles.step, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
              <View style={[tutStyles.emoji, { backgroundColor: theme.colors.highlight }]}>
                <Text style={{ fontSize: 24 }}>{step.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[tutStyles.stepTitle, { color: theme.colors.text }]}>{step.title}</Text>
                <Text style={[tutStyles.stepDesc, { color: theme.colors.textSecondary }]}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ===== Language Modal =====
function LanguageModal({ visible, onClose, currentLang, onSelect, theme, t }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={[modalHeader.row, { borderBottomColor: theme.colors.border }]}>
          <Text style={[modalHeader.title, { color: theme.colors.text }]}>🌐 {t('settings.language')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[modalHeader.close, { color: theme.colors.primary }]}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
        {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
          <TouchableOpacity
            key={code}
            style={[langStyles.item, { borderBottomColor: theme.colors.divider }]}
            onPress={() => onSelect(code)}
          >
            <Text style={langStyles.flag}>{LANGUAGE_FLAGS[code]}</Text>
            <Text style={[langStyles.name, { color: theme.colors.text }]}>{name}</Text>
            {currentLang === code
              ? <Text style={[langStyles.check, { color: theme.colors.primary }]}>✓</Text>
              : null}
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    </Modal>
  );
}

// ===== Change Password Modal =====
function ChangePasswordModal({ visible, onClose, theme, t, onSave }) {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  function reset() {
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    setShowCurrent(false); setShowNew(false);
  }

  async function handleSave() {
    if (!currentPwd) { Alert.alert(t('common.error'), t('auth.errorPasswordRequired')); return; }
    if (newPwd.length < 6) { Alert.alert(t('common.error'), t('auth.errorPasswordMin')); return; }
    if (newPwd !== confirmPwd) { Alert.alert(t('common.error'), t('auth.errorPasswordMatch')); return; }
    setLoading(true);
    try {
      await onSave(currentPwd, newPwd);
      reset();
      onClose();
      Alert.alert('✅', t('settings.passwordChanged'));
    } catch (err) {
      Alert.alert(t('common.error'), err.message || t('settings.passwordWrong'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet"
      onRequestClose={() => { reset(); onClose(); }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={[modalHeader.row, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Text style={[modalHeader.close, { color: theme.colors.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={[modalHeader.title, { color: theme.colors.text }]}>🔑 {t('settings.changePassword')}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading
              ? <ActivityIndicator color={theme.colors.primary} size="small" />
              : <Text style={[modalHeader.close, { color: theme.colors.primary, fontWeight: '700' }]}>{t('common.save')}</Text>
            }
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {[
            { label: t('settings.currentPassword'), value: currentPwd, set: setCurrentPwd, show: showCurrent, toggleShow: () => setShowCurrent(v => !v) },
            { label: t('settings.newPassword'), value: newPwd, set: setNewPwd, show: showNew, toggleShow: () => setShowNew(v => !v) },
            { label: t('settings.confirmNewPassword'), value: confirmPwd, set: setConfirmPwd, show: showNew, toggleShow: null },
          ].map((field, idx) => (
            <View key={idx}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 6 }}>{field.label}</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: theme.colors.inputBackground,
                borderRadius: 12, borderWidth: 1.5, borderColor: theme.colors.inputBorder,
                paddingHorizontal: 14, height: 50,
              }}>
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: theme.colors.text }}
                  value={field.value}
                  onChangeText={field.set}
                  secureTextEntry={!field.show}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={theme.colors.placeholder}
                  placeholder="••••••"
                />
                {field.toggleShow && (
                  <TouchableOpacity onPress={field.toggleShow}>
                    <Text style={{ fontSize: 18 }}>{field.show ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ===== About Modal =====
function AboutModal({ visible, onClose, theme, t }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 }}
        activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 28, width: '100%', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 36 }}>🗺️</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.text }}>MemoryMap</Text>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
            {t('settings.appDescription')}
          </Text>
          <View style={{ backgroundColor: theme.colors.highlight, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 6 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{t('settings.appVersion')}</Text>
          </View>
          <Text style={{ fontSize: 12, color: theme.colors.textTertiary }}>Made with ❤️ in Vietnam</Text>
          <TouchableOpacity
            style={{ backgroundColor: theme.colors.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12, marginTop: 4 }}
            onPress={onClose}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t('common.close')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ===== MAIN =====
export default function SettingsScreen({ navigation }) {
  const { theme, isDark, toggleTheme, language, changeLanguage, t, accentColor, setAccentColor } = useApp();
  const { user, updateProfile, logout } = useAuth();

  const [showTutorial, setShowTutorial] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  async function handleChangeLanguage(code) {
    try {
      await changeLanguage(code);
      setShowLanguage(false);
    } catch {
      Alert.alert(t('common.error'), t('errors.unknownError'));
    }
  }

  async function handleChangePassword(currentPwd, newPwd) {
    // Lấy users từ AsyncStorage và verify password
    const db = await AsyncStorage.getItem('@memorymap_users_db');
    const users = db ? JSON.parse(db) : [];
    const found = users.find(u => u.id === user?.id);
    if (!found || found.password !== currentPwd) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }
    // Cập nhật password mới trong users DB
    const updated = users.map(u => u.id === user?.id ? { ...u, password: newPwd } : u);
    await AsyncStorage.setItem('@memorymap_users_db', JSON.stringify(updated));
    // Cập nhật credentials đã lưu nếu có
    try {
      const savedCreds = await AsyncStorage.getItem('@memorymap_saved_credentials');
      if (savedCreds) {
        const creds = JSON.parse(savedCreds);
        if (creds.email === user?.email) {
          await AsyncStorage.setItem('@memorymap_saved_credentials', JSON.stringify({ ...creds, password: newPwd }));
        }
      }
    } catch { /* bỏ qua nếu không có credentials đã lưu */ }
  }

  function handleFeedback() {
    Alert.alert(
      '💬 Góp ý & Phản hồi',
      'Cảm ơn bạn muốn góp ý!\n\nLiên hệ: support@memorymap.vn\n\nHoặc để lại đánh giá trên App Store/Google Play.',
      [
        { text: 'Đóng', style: 'cancel' },
        { text: '📧 Gửi Email', onPress: () => Linking.openURL('mailto:support@memorymap.vn?subject=Góp ý MemoryMap') },
      ]
    );
  }

  function handleRateApp() {
    Alert.alert(
      '⭐ Đánh giá ứng dụng',
      'Bạn có muốn đánh giá MemoryMap trên cửa hàng ứng dụng không?',
      [
        { text: 'Để sau', style: 'cancel' },
        { text: '⭐ Đánh giá ngay', onPress: () => {
          // Link đến Play Store / App Store (dùng expo-linking)
          Linking.openURL('https://play.google.com/store/apps').catch(() => {
            Alert.alert('Thông báo', 'Cảm ơn bạn đã sử dụng MemoryMap! ❤️');
          });
        }},
      ]
    );
  }

  function handlePrivacy() {
    Alert.alert(
      '🔒 Quyền riêng tư',
      'MemoryMap cam kết bảo vệ quyền riêng tư của bạn:\n\n• Dữ liệu lưu trữ cục bộ trên thiết bị\n• Không chia sẻ thông tin cá nhân với bên thứ ba\n• Ảnh và kỷ niệm thuộc quyền sở hữu của bạn\n• Bạn có thể xóa tài khoản bất kỳ lúc nào',
      [{ text: 'Đã hiểu', style: 'default' }]
    );
  }

  function handle2FA() {
    Alert.alert(
      '🛡️ Xác thực 2 bước',
      'Tính năng xác thực 2 bước sẽ được ra mắt trong phiên bản tiếp theo.\n\nHiện tại hãy đảm bảo mật khẩu của bạn đủ mạnh (ít nhất 8 ký tự, có chữ hoa và số).',
      [{ text: 'Đã hiểu' }]
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      '⚠️ ' + t('settings.deleteAccount'),
      t('settings.deleteAccountWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Xác nhận lần cuối',
              'Nhập "XÓA" để xác nhận xóa tài khoản vĩnh viễn.',
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: 'Xóa vĩnh viễn',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Xóa toàn bộ data của user và đăng xuất
                      await AsyncStorage.multiRemove([
                        '@memorymap_user',
                        '@memorymap_memories',
                        '@memorymap_saved_credentials',
                        '@memorymap_language',
                        '@memorymap_theme',
                        '@memorymap_accent',
                        '@memorymap_settings',
                        '@memorymap_session',
                      ]);
                      // Xóa user khỏi users_db
                      try {
                        const db = await AsyncStorage.getItem('@memorymap_users_db');
                        if (db) {
                          const users = JSON.parse(db);
                          const filtered = users.filter(u => u.id !== user?.id);
                          await AsyncStorage.setItem('@memorymap_users_db', JSON.stringify(filtered));
                        }
                      } catch { /* bỏ qua */ }
                      await logout();
                    } catch {
                      Alert.alert(t('common.error'), t('errors.unknownError'));
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hiển thị */}
        <SettingGroup title="🎨 Hiển thị" theme={theme}>
          <SettingRow
            icon="🌐" label={t('settings.language')}
            value={`${LANGUAGE_FLAGS[language]} ${LANGUAGE_NAMES[language]}`}
            onPress={() => setShowLanguage(true)} theme={theme}
          />
          <SettingRow
            icon="🌙" label={t('settings.theme')}
            value={isDark ? t('settings.themeDark') : t('settings.themeLight')}
            theme={theme} showArrow={false}
            rightComponent={
              <Switch
                value={isDark} onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                thumbColor={isDark ? theme.colors.primary : theme.colors.white}
              />
            }
          />
          {/* Màu chủ đạo */}
          <AccentColorRow
            accentColor={accentColor}
            onSelect={setAccentColor}
            theme={theme}
          />
        </SettingGroup>

        {/* AI Chat - điều hướng thẳng */}
        <SettingGroup title="🤖 Trợ lý AI" theme={theme}>
          <SettingRow
            icon="🤖" label="Trợ lý MemoryMap AI"
            value="Hỏi về du lịch Việt Nam"
            onPress={() => navigation.navigate('AIChat')} theme={theme}
          />
        </SettingGroup>

        {/* Trợ giúp */}
        <SettingGroup title="❓ Trợ giúp" theme={theme}>
          <SettingRow icon="📖" label={t('settings.tutorial')} onPress={() => setShowTutorial(true)} theme={theme} />
          <SettingRow icon="💬" label={t('settings.feedback')} onPress={handleFeedback} theme={theme} />
          <SettingRow icon="⭐" label={t('settings.rateApp')} onPress={handleRateApp} theme={theme} />
        </SettingGroup>

        {/* Bảo mật */}
        <SettingGroup title="🔒 Bảo mật" theme={theme}>
          <SettingRow icon="🔑" label={t('settings.changePassword')} onPress={() => setShowChangePwd(true)} theme={theme} />
          <SettingRow icon="🛡️" label={t('settings.twoFactor')} onPress={handle2FA} theme={theme} />
          <SettingRow icon="🔒" label={t('settings.privacy')} onPress={handlePrivacy} theme={theme} />
        </SettingGroup>

        {/* Thông tin ứng dụng */}
        <SettingGroup title="ℹ️ Thông tin" theme={theme}>
          <SettingRow
            icon="📱" label={t('settings.about')}
            value={t('settings.appVersion')}
            onPress={() => setShowAbout(true)} theme={theme}
          />
          <SettingRow icon="👨‍💻" label={t('settings.developer')} value="MemoryMap Team" theme={theme} showArrow={false} />
        </SettingGroup>

        {/* Xóa tài khoản */}
        <SettingGroup theme={theme}>
          <SettingRow
            icon="🗑️" label={t('settings.deleteAccount')}
            onPress={handleDeleteAccount} theme={theme}
          />
        </SettingGroup>

        {/* Đăng xuất */}
        <SettingGroup theme={theme}>
          <SettingRow
            icon="🚪"
            label={t('auth.logout')}
            onPress={() => {
              Alert.alert(
                t('profile.logout'),
                t('profile.confirmLogout'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('auth.logout'),
                    style: 'destructive',
                    onPress: async () => {
                      try { await logout(); }
                      catch { Alert.alert(t('common.error'), t('auth.errorLogoutFailed')); }
                    },
                  },
                ]
              );
            }}
            theme={theme}
            showArrow={false}
            rightComponent={
              <View style={{
                backgroundColor: theme.colors.error + '18',
                paddingHorizontal: 14, paddingVertical: 6,
                borderRadius: 20,
              }}>
                <Text style={{ color: theme.colors.error, fontSize: 13, fontWeight: '700' }}>
                  🚪 {t('auth.logout')}
                </Text>
              </View>
            }
          />
        </SettingGroup>

      </ScrollView>

      <TutorialModal visible={showTutorial} onClose={() => setShowTutorial(false)} theme={theme} t={t} />
      <LanguageModal visible={showLanguage} onClose={() => setShowLanguage(false)}
        currentLang={language} onSelect={handleChangeLanguage} theme={theme} t={t} />
      <ChangePasswordModal visible={showChangePwd} onClose={() => setShowChangePwd(false)}
        theme={theme} t={t} onSave={handleChangePassword} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} theme={theme} t={t} />
    </SafeAreaView>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  icon: { fontSize: 20, marginRight: 12, width: 28, textAlign: 'center' },
  content: { flex: 1 },
  label: { fontSize: 15, fontWeight: '500' },
  value: { fontSize: 12, marginTop: 2 },
  arrow: { fontSize: 20, fontWeight: '300' },
});
const groupStyles = StyleSheet.create({
  group: { borderRadius: 16, marginHorizontal: 16, marginTop: 16, overflow: 'hidden' },
  title: { fontSize: 12, fontWeight: '600', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
});
const modalHeader = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '700' },
  close: { fontSize: 16 },
});
const tutStyles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: 14 },
  emoji: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  stepDesc: { fontSize: 13, lineHeight: 19 },
});
const langStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  flag: { fontSize: 24, marginRight: 12 },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  check: { fontSize: 20, fontWeight: '700' },
});
