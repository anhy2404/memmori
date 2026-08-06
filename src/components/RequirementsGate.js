// src/components/RequirementsGate.js
// Màn hình chặn khi thiếu Mạng hoặc GPS - full i18n

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRequirements } from '../context/RequirementsContext';
import { useApp } from '../context/AppContext';
import AppLogo from './AppLogo';

function StatusRow({ ok, label, hint }) {
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.icon, ok ? rowStyles.iconOk : rowStyles.iconBad]}>
        <Text style={rowStyles.iconText}>{ok ? '✓' : '✗'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[rowStyles.label, ok ? rowStyles.labelOk : rowStyles.labelBad]}>
          {label}
        </Text>
        {!ok && hint ? (
          <Text style={rowStyles.hint}>{hint}</Text>
        ) : null}
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  icon:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconOk:   { backgroundColor: '#22c55e' },
  iconBad:  { backgroundColor: '#ef4444' },
  iconText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  label:    { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  labelOk:  { color: '#16a34a' },
  labelBad: { color: '#dc2626' },
  hint:     { fontSize: 12, color: '#6b7280', lineHeight: 18 },
});

export default function RequirementsGate({ children }) {
  const {
    isOnline,
    locationEnabled,
    locationGranted,
    allRequirementsMet,
    isChecking,
    retryCheck,
  } = useRequirements();

  const { t } = useApp();

  if (allRequirementsMet) return children;

  function openSettings() {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoArea}>
        <AppLogo size={80} showName />
      </View>

      <Text style={styles.title}>{t('requirements.title')}</Text>
      <Text style={styles.subtitle}>
        {t('requirements.subtitle')}{'\n'}
        <Text style={styles.bold}>{t('requirements.subtitleNetwork')}</Text>
        {' '}{t('requirements.subtitleAnd')}{' '}
        <Text style={styles.bold}>{t('requirements.subtitleLocation')}</Text>
        {' '}{t('requirements.subtitleSuffix')}
      </Text>

      <View style={styles.statusCard}>
        <StatusRow
          ok={isOnline}
          label={isOnline ? t('requirements.networkOk') : t('requirements.networkFail')}
          hint={t('requirements.networkHint')}
        />
        <StatusRow
          ok={locationEnabled}
          label={locationEnabled ? t('requirements.locationServiceOk') : t('requirements.locationServiceFail')}
          hint={t('requirements.locationServiceHint')}
        />
        <StatusRow
          ok={locationGranted}
          label={locationGranted ? t('requirements.locationPermOk') : t('requirements.locationPermFail')}
          hint={t('requirements.locationPermHint')}
        />
      </View>

      <TouchableOpacity
        style={[styles.retryBtn, isChecking && styles.retryBtnDisabled]}
        onPress={retryCheck}
        disabled={isChecking}
        activeOpacity={0.8}
      >
        {isChecking ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.retryBtnText}>{t('requirements.retryBtn')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={openSettings}
        activeOpacity={0.8}
      >
        <Text style={styles.settingsBtnText}>{t('requirements.openSettings')}</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>{t('requirements.footer')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoArea: { marginBottom: 28 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F1E3D',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5C7A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  bold: { fontWeight: '700', color: '#1A6FD4' },
  statusCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#1A6FD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  retryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#1A6FD4',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  retryBtnDisabled: { opacity: 0.6 },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  settingsBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#1A6FD4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  settingsBtnText: { color: '#1A6FD4', fontSize: 16, fontWeight: '700' },
  footer: {
    fontSize: 12,
    color: '#8FA3C0',
    textAlign: 'center',
    lineHeight: 18,
  },
});
