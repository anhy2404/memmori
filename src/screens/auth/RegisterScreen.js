// src/screens/auth/RegisterScreen.js - Màn hình đăng ký
const _0x616e6879 = '\x61\x6e\x68\x79';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import AppLogo from '../../components/AppLogo';
import { authAPI } from '../../services/apiService';
import { ACCENT_PRESETS } from '../../theme';

// ===== COLOR PICKER inline =====
function AccentColorPicker({ accentColor, setAccentColor, theme }) {
  const active = ACCENT_PRESETS.find(p => p.id === accentColor);
  return (
    <View style={cpStyles.wrap}>
      {/* Header */}
      <View style={cpStyles.header}>
        <Text style={[cpStyles.title, { color: theme.colors.text }]}>🎨 Chọn màu giao diện</Text>
        <View style={[cpStyles.preview, { backgroundColor: active?.primary }]}>
          <Text style={cpStyles.previewText}>{active?.label}</Text>
        </View>
      </View>

      {/* Palette grid */}
      <View style={cpStyles.grid}>
        {ACCENT_PRESETS.map(preset => {
          const isActive = accentColor === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              onPress={() => setAccentColor(preset.id)}
              activeOpacity={0.82}
              style={[
                cpStyles.swatch,
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
                <View style={cpStyles.checkCircle}>
                  <Text style={cpStyles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cpStyles = StyleSheet.create({
  wrap:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:  { fontSize: 14, fontWeight: '800' },
  preview:{
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { theme, t, accentColor, setAccentColor } = useApp();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phonenumber: '', gender: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Các tùy chọn giới tính
  const GENDER_OPTIONS = [
    { value: 'male',   label: '👨 ' + t('auth.genderMale') },
    { value: 'female', label: '👩 ' + t('auth.genderFemale') },
    { value: 'other',  label: '🧑 ' + t('auth.genderOther') },
    { value: '',       label: '🤐 ' + t('auth.genderPreferNotSay') },
  ];

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = t('auth.errorNameRequired');
    else if (form.fullName.trim().length < 2) newErrors.fullName = t('auth.errorNameMin');
    if (!form.email.trim()) newErrors.email = t('auth.errorEmailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = t('auth.errorEmailInvalid');
    if (!form.password) newErrors.password = t('auth.errorPasswordRequired');
    else if (form.password.length < 6) newErrors.password = t('auth.errorPasswordMin');
    if (!form.confirmPassword) newErrors.confirmPassword = t('auth.errorPasswordRequired');
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = t('auth.errorPasswordMatch');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      // Backend tự kiểm tra email trùng và trả lỗi nếu đã tồn tại
      const result = await authAPI.sendRegisterOTP(form.email.trim(), form.fullName.trim(), form.password);

      // Bước 3: Chuyển sang màn hình OTP
      navigation.navigate('OTP', {
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        purpose: 'register',
        formData: { ...form, email: form.email.trim(), fullName: form.fullName.trim() },
        devOTP: result.devOTP || '',
      });
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('đã được đăng ký') || msg.includes('EMAIL_EXISTS')) {
        Alert.alert(
          '📬 Email đã tồn tại',
          `Email "${form.email.trim()}" đã có tài khoản.\n\nBạn có muốn đăng nhập không?`,
          [
            { text: 'Để sau', style: 'cancel' },
            {
              text: '🔐 Đăng nhập ngay',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else if (msg.includes('Họ') || msg.includes('tên') || msg.includes('fullName')) {
        setErrors(e => ({ ...e, fullName: msg }));
      } else if (msg.includes('email') || msg.includes('Email')) {
        setErrors(e => ({ ...e, email: msg }));
      } else if (msg.includes('mật khẩu') || msg.includes('password')) {
        setErrors(e => ({ ...e, password: msg }));
      } else {
        Alert.alert('❌ Lỗi đăng ký', msg || t('auth.errorRegisterFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <AppLogo size={72} showName={false} />
            <Text style={styles.appName}>Memmori</Text>
            <Text style={styles.tagline}>🌸 Bắt đầu hành trình kỷ niệm</Text>
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('auth.createSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Họ tên */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.fullName')}</Text>
              <View style={[styles.inputWrapper, errors.fullName && styles.inputError]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.fullName')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={form.fullName}
                  onChangeText={v => setField('fullName', v)}
                  returnKeyType="next"
                />
              </View>
              {errors.fullName ? <Text style={styles.errorText}>⚠️ {errors.fullName}</Text> : null}
            </View>

            {/* Màu chủ đạo */}
            <View style={[styles.fieldGroup, { backgroundColor: theme.colors.highlight, borderRadius: 16 }]}>
              <AccentColorPicker
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                theme={theme}
              />
              {/* Nút Cập nhật */}
              <TouchableOpacity
                style={[styles.updateColorBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() =>
                  Alert.alert(
                    '🎨 Cập nhật giao diện',
                    `Màu "${ACCENT_PRESETS.find(p => p.id === accentColor)?.label}" đã được áp dụng cho toàn bộ ứng dụng!`,
                    [{ text: 'Tuyệt 👍' }]
                  )
                }
                activeOpacity={0.85}
              >
                <Text style={styles.updateColorBtnText}>✓ Cập nhật màu giao diện</Text>
              </TouchableOpacity>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={form.email}
                  onChangeText={v => setField('email', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>⚠️ {errors.email}</Text> : null}
            </View>

            {/* Số điện thoại */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.phonenumber')}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.phonenumber')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={form.phonenumber}
                  onChangeText={v => setField('phonenumber', v)}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Giới tính - tùy chọn */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('auth.gender')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {GENDER_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.genderBtn,
                      { borderColor: theme.colors.inputBorder, backgroundColor: theme.colors.inputBackground },
                      form.gender === opt.value && { borderColor: theme.colors.primary, backgroundColor: theme.colors.highlight },
                    ]}
                    onPress={() => setField('gender', opt.value)}
                  >
                    <Text style={[
                      styles.genderBtnText,
                      { color: theme.colors.textSecondary },
                      form.gender === opt.value && { color: theme.colors.primary, fontWeight: '700' },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Mật khẩu */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={form.password}
                  onChangeText={v => setField('password', v)}
                  secureTextEntry={!showPwd}
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                  <Text>{showPwd ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>⚠️ {errors.password}</Text> : null}
            </View>

            {/* Xác nhận mật khẩu */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.confirmPassword')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={form.confirmPassword}
                  onChangeText={v => setField('confirmPassword', v)}
                  secureTextEntry={!showConfirmPwd}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity onPress={() => setShowConfirmPwd(!showConfirmPwd)} style={styles.eyeBtn}>
                  <Text>{showConfirmPwd ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>⚠️ {errors.confirmPassword}</Text> : null}
            </View>

            {/* Nút đăng ký */}
            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: theme.colors.primary }, isLoading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.registerBtnText}>{t('auth.register')}</Text>
              )}            </TouchableOpacity>

            {/* Link đăng nhập */}
            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
                {t('auth.hasAccount')}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
                  {t('auth.loginNow')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    header: { alignItems: 'center', paddingTop: 26, paddingBottom: 18 },
    appName: { fontSize: 24, fontWeight: '800', color: theme.colors.primary, marginTop: 8, marginBottom: 4, letterSpacing: 1 },
    tagline: { fontSize: 12, color: theme.colors.secondary, fontWeight: '600', marginBottom: 10 },
    title: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 19 },
    form: { gap: 2 },
    fieldGroup: { marginBottom: 14 },
    label: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 16, borderWidth: 1.5,
      borderColor: theme.colors.inputBorder,
      paddingHorizontal: 14, height: 52,
    },
    inputError: { borderColor: theme.colors.error },
    inputIcon: { fontSize: 18, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: theme.colors.text, height: '100%' },
    eyeBtn: { padding: 4 },
    errorText: { fontSize: 12, color: theme.colors.error, marginTop: 4, marginLeft: 2 },
    registerBtn: {
      height: 54, borderRadius: 27, alignItems: 'center',
      justifyContent: 'center', marginTop: 8,
      shadowColor: '#7C5CBF', shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    },
    btnDisabled: { opacity: 0.65 },
    registerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    loginText: { fontSize: 14 },
    loginLink: { fontSize: 14, fontWeight: '800' },
    genderBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1.5 },
    genderBtnText: { fontSize: 13 },
    updateColorBtn: {
      marginHorizontal: 14, marginBottom: 14, marginTop: 4,
      height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
    },
    updateColorBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  });
}
