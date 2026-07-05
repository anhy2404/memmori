// src/screens/settings/SettingsScreen.js - Cài đặt ngôn ngữ, theme, HDSD, bảo mật
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { LANGUAGES, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '../../i18n';

// Component một dòng cài đặt
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
      {rightComponent || (showArrow && onPress ? (
        <Text style={[rowStyles.arrow, { color: theme.colors.textTertiary }]}>›</Text>
      ) : null)}
    </TouchableOpacity>
  );
}

// Component nhóm cài đặt
function SettingGroup({ title, children, theme }) {
  return (
    <View style={[groupStyles.group, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
      {title ? <Text style={[groupStyles.title, { color: theme.colors.textSecondary }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

// Modal hướng dẫn sử dụng
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
        <View style={[tutStyles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[tutStyles.title, { color: theme.colors.text }]}>📖 {t('settings.tutorial')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[tutStyles.closeBtn, { color: theme.colors.primary }]}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {steps.map(step => (
            <View key={step.key} style={[tutStyles.step, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
              <View style={[tutStyles.stepEmoji, { backgroundColor: theme.colors.highlight }]}>
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

// Modal chọn ngôn ngữ
function LanguageModal({ visible, onClose, currentLang, onSelect, theme, t }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={[langStyles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[langStyles.title, { color: theme.colors.text }]}>🌐 {t('settings.language')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[langStyles.closeBtn, { color: theme.colors.primary }]}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
        {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
          <TouchableOpacity
            key={code}
            style={[langStyles.langItem, { borderBottomColor: theme.colors.divider }]}
            onPress={() => onSelect(code)}
          >
            <Text style={langStyles.flagText}>{LANGUAGE_FLAGS[code]}</Text>
            <Text style={[langStyles.langName, { color: theme.colors.text }]}>{name}</Text>
            {currentLang === code ? (
              <Text style={[langStyles.checkmark, { color: theme.colors.primary }]}>✓</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    </Modal>
  );
}

export default function SettingsScreen({ navigation }) {
  const { theme, isDark, toggleTheme, language, changeLanguage, t } = useApp();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);

  // Thay đổi ngôn ngữ
  async function handleChangeLanguage(code) {
    try {
      await changeLanguage(code);
      setShowLanguage(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.unknownError'));
    }
  }

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Giao diện & Ngôn ngữ */}
        <SettingGroup title="🎨 Hiển thị" theme={theme}>
          <SettingRow
            icon="🌐"
            label={t('settings.language')}
            value={`${LANGUAGE_FLAGS[language]} ${LANGUAGE_NAMES[language]}`}
            onPress={() => setShowLanguage(true)}
            theme={theme}
          />
          <SettingRow
            icon="🌙"
            label={t('settings.theme')}
            value={isDark ? t('settings.themeDark') : t('settings.themeLight')}
            theme={theme}
            showArrow={false}
            rightComponent={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                thumbColor={isDark ? theme.colors.primary : theme.colors.white}
              />
            }
          />
        </SettingGroup>

        {/* Trợ giúp */}
        <SettingGroup title="❓ Trợ giúp" theme={theme}>
          <SettingRow
            icon="📖"
            label={t('settings.tutorial')}
            onPress={() => setShowTutorial(true)}
            theme={theme}
          />
          <SettingRow
            icon="💬"
            label={t('settings.feedback')}
            onPress={() => Alert.alert('Góp ý', 'Tính năng đang phát triển')}
            theme={theme}
          />
          <SettingRow
            icon="⭐"
            label={t('settings.rateApp')}
            onPress={() => Alert.alert('Đánh giá', 'Cảm ơn bạn đã sử dụng MemoryMap!')}
            theme={theme}
          />
        </SettingGroup>

        {/* Bảo mật */}
        <SettingGroup title="🔒 Bảo mật" theme={theme}>
          <SettingRow
            icon="🔑"
            label={t('settings.changePassword')}
            onPress={() => Alert.alert('Đổi mật khẩu', 'Tính năng đang phát triển')}
            theme={theme}
          />
          <SettingRow
            icon="🛡️"
            label={t('settings.twoFactor')}
            onPress={() => Alert.alert('Xác thực 2 bước', 'Tính năng đang phát triển')}
            theme={theme}
          />
          <SettingRow
            icon="🔒"
            label={t('settings.privacy')}
            onPress={() => Alert.alert('Quyền riêng tư', 'Tính năng đang phát triển')}
            theme={theme}
          />
        </SettingGroup>

        {/* Thông tin ứng dụng */}
        <SettingGroup title="ℹ️ Thông tin" theme={theme}>
          <SettingRow
            icon="📱"
            label={t('settings.about')}
            value={t('settings.appVersion')}
            onPress={() => Alert.alert('MemoryMap', t('settings.appDescription') + '\n\n' + t('settings.appVersion'))}
            theme={theme}
          />
          <SettingRow
            icon="👨‍💻"
            label={t('settings.developer')}
            value="MemoryMap Team"
            theme={theme}
            showArrow={false}
          />
        </SettingGroup>

        {/* Xóa tài khoản - nguy hiểm */}
        <SettingGroup theme={theme}>
          <SettingRow
            icon="🗑️"
            label={t('settings.deleteAccount')}
            onPress={() => Alert.alert(
              t('settings.deleteAccount'),
              t('settings.deleteAccountWarning'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển') },
              ]
            )}
            theme={theme}
          />
        </SettingGroup>

      </ScrollView>

      {/* Modals */}
      <TutorialModal visible={showTutorial} onClose={() => setShowTutorial(false)} theme={theme} t={t} />
      <LanguageModal
        visible={showLanguage}
        onClose={() => setShowLanguage(false)}
        currentLang={language}
        onSelect={handleChangeLanguage}
        theme={theme}
        t={t}
      />
    </SafeAreaView>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
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

const tutStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { fontSize: 16, fontWeight: '600' },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: 14 },
  stepEmoji: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  stepDesc: { fontSize: 13, lineHeight: 19 },
});

const langStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { fontSize: 16, fontWeight: '600' },
  langItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  flagText: { fontSize: 24, marginRight: 12 },
  langName: { flex: 1, fontSize: 16, fontWeight: '500' },
  checkmark: { fontSize: 20, fontWeight: '700' },
});

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
  });
}
