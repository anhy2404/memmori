// src/components/RequirementsGate.js
// Màn hình chặn khi thiếu Mạng hoặc GPS
// Hiển thị trạng thái từng điều kiện + nút Thử lại + mở Cài đặt

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRequirements } from '../context/RequirementsContext';
import AppLogo from './AppLogo';

// ─── Hàng trạng thái từng điều kiện ─────────────────────────────────────────
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

// ─── Màn hình chính ──────────────────────────────────────────────────────────
export default function RequirementsGate({ children }) {
  const {
    isOnline,
    locationEnabled,
    locationGranted,
    allRequirementsMet,
    isChecking,
    retryCheck,
  } = useRequirements();

  // Nếu đã đủ điều kiện → render app bình thường
  if (allRequirementsMet) return children;

  // Mở cài đặt hệ thống
  function openSettings() {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <AppLogo size={80} showName />
      </View>

      {/* Tiêu đề */}
      <Text style={styles.title}>Cần kết nối để tiếp tục</Text>
      <Text style={styles.subtitle}>
        MemoryMap yêu cầu{'\n'}
        <Text style={styles.bold}>mạng</Text> và <Text style={styles.bold}>định vị</Text>{' '}
        để hoạt động đúng
      </Text>

      {/* Trạng thái */}
      <View style={styles.statusCard}>
        {/* Mạng */}
        <StatusRow
          ok={isOnline}
          label={isOnline ? '📶  Đã kết nối mạng' : '📵  Chưa có mạng'}
          hint="Bật WiFi hoặc dữ liệu di động (3G/4G/5G)"
        />

        {/* Dịch vụ định vị */}
        <StatusRow
          ok={locationEnabled}
          label={locationEnabled ? '📍  Dịch vụ định vị đang bật' : '📍  Dịch vụ định vị tắt'}
          hint="Vào Cài đặt → Quyền riêng tư → Dịch vụ định vị và bật lên"
        />

        {/* Quyền định vị */}
        <StatusRow
          ok={locationGranted}
          label={locationGranted ? '✅  Quyền định vị đã cấp' : '🔒  Chưa cấp quyền định vị'}
          hint="Vào Cài đặt → Ứng dụng → MemoryMap → Quyền → Vị trí → Cho phép"
        />
      </View>

      {/* Nút hành động */}
      <TouchableOpacity
        style={[styles.retryBtn, isChecking && styles.retryBtnDisabled]}
        onPress={retryCheck}
        disabled={isChecking}
        activeOpacity={0.8}
      >
        {isChecking ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.retryBtnText}>🔄  Thử lại</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={openSettings}
        activeOpacity={0.8}
      >
        <Text style={styles.settingsBtnText}>⚙️  Mở Cài đặt</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Cả Mạng và Định vị phải sẵn sàng trước khi vào MemoryMap
      </Text>
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
