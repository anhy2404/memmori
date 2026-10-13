// src/screens/auth/LoginScreen.js
const _b = 'YW5oeQ==';
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import AppLogo from '../../components/AppLogo';
import { SEED_EMAILS } from '../../constants';

const { width } = Dimensions.get('window');
const SAVED_CREDENTIALS_KEY = '@memmori_saved_credentials';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme, t } = useApp();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPwd]  = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [errors, setErrors]         = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [hasSaved, setHasSaved]     = useState(false);

  // Load thông tin đã lưu khi màn hình focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setErrors({});
      setShowPwd(false);
      try {
        const saved = await AsyncStorage.getItem(SAVED_CREDENTIALS_KEY);
        if (saved) {
          const { email: savedEmail, password: savedPwd } = JSON.parse(saved);
          setEmail(savedEmail || '');
          setPassword(savedPwd || '');
          setRememberMe(true);
          setHasSaved(true);
        } else {
          setEmail('');
          setPassword('');
          setRememberMe(false);
          setHasSaved(false);
        }
      } catch {
        setEmail('');
        setPassword('');
      }
    });
    return unsubscribe;
  }, [navigation]);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = t('auth.errorEmailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t('auth.errorEmailInvalid');
    if (!password) e.password = t('auth.errorPasswordRequired');
    else if (password.length < 6) e.password = t('auth.errorPasswordMin');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const result = await login({ email: email.trim(), password });

      // Seed account → đăng nhập thẳng xong
      if (result.success && !result.requireOTP) {
        if (rememberMe) {
          await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({
            email: email.trim(), password,
          }));
        }
        return; // AuthContext đã set isAuthenticated = true
      }

      // Tài khoản thường → cần OTP
      if (result.requireOTP) {
        if (rememberMe) {
          await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({
            email: email.trim(), password,
          }));
        } else if (!hasSaved) {
          Alert.alert(
            '🔐 Nhớ tài khoản',
            'Bạn có muốn lưu email và mật khẩu để đăng nhập nhanh lần sau không?',
            [
              { text: 'Không', style: 'cancel', onPress: () => AsyncStorage.removeItem(SAVED_CREDENTIALS_KEY) },
              {
                text: 'Lưu lại ✓',
                onPress: async () => {
                  await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({ email: email.trim(), password }));
                  setRememberMe(true);
                  setHasSaved(true);
                },
              },
            ]
          );
        }

        navigation.navigate('OTP', {
          email: email.trim(),
          fullName: result.fullName || '',
          purpose: 'login',
          formData: { email: email.trim(), password },
          devOTP: result.devOTP || '',
        });
      }
    } catch (error) {
      const msg = error.message || '';
      if (msg === 'EMAIL_NOT_FOUND' || msg.includes('không tồn tại')) {
        Alert.alert(
          '📭 Chưa có tài khoản',
          `Email "${email.trim()}" chưa được đăng ký.\n\nBạn có muốn tạo tài khoản mới không?`,
          [
            { text: 'Để sau', style: 'cancel' },
            { text: '✨ Đăng ký ngay', onPress: () => navigation.navigate('Register') },
          ]
        );
      } else if (msg === 'WRONG_PASSWORD' || msg.includes('Mật khẩu')) {
        Alert.alert('🔒 Sai mật khẩu', 'Mật khẩu không đúng. Vui lòng thử lại.');
      } else if (msg.includes('kết nối') || msg.includes('server')) {
        Alert.alert('🌐 Lỗi kết nối', 'Không kết nối được server. Kiểm tra backend đang chạy và cùng WiFi.');
      } else {
        Alert.alert('❌ Lỗi', msg || t('auth.errorLoginFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgetSaved() {
    await AsyncStorage.removeItem(SAVED_CREDENTIALS_KEY);
    setEmail(''); setPassword('');
    setRememberMe(false); setHasSaved(false);
  }

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <AppLogo size={88} showName={false} />
            <Text style={s.appName}>Memmori</Text>
            <Text style={s.tagline}>✨ Lưu giữ kỷ niệm đẹp mỗi ngày</Text>
            <Text style={s.title}>{t('auth.welcomeBack')}</Text>
            <Text style={s.subtitle}>{t('auth.welcomeSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={s.form}>

            {/* Banner thông tin đã lưu */}
            {hasSaved && (
              <View style={[s.savedBanner, { backgroundColor: theme.colors.primary + '12', borderColor: theme.colors.primary + '30' }]}>
                <Text style={{ fontSize: 16 }}>🔐</Text>
                <Text style={[s.savedBannerText, { color: theme.colors.primary }]}>Đã điền thông tin đã lưu</Text>
                <TouchableOpacity onPress={handleForgetSaved}>
                  <Text style={[s.savedBannerClear, { color: theme.colors.error }]}>Xoá</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Email */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>{t('auth.email')}</Text>
              <View style={[s.inputWrapper, errors.email && s.inputError]}>
                <Text style={s.inputIcon}>📧</Text>
                <TextInput
                  style={s.input}
                  placeholder={t('auth.email')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={email}
                  onChangeText={v => { setEmail(v); setErrors(e => ({ ...e, email: '' })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.email ? <Text style={s.errorText}>⚠️ {errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>{t('auth.password')}</Text>
              <View style={[s.inputWrapper, errors.password && s.inputError]}>
                <Text style={s.inputIcon}>🔒</Text>
                <TextInput
                  style={s.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={password}
                  onChangeText={v => { setPassword(v); setErrors(e => ({ ...e, password: '' })); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn}>
                  <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={s.errorText}>⚠️ {errors.password}</Text> : null}
            </View>

            {/* Nhớ tài khoản + Quên mật khẩu */}
            <View style={s.rememberRow}>
              <TouchableOpacity style={s.rememberWrap} onPress={() => setRememberMe(v => !v)} activeOpacity={0.7}>
                <View style={[s.checkbox, {
                  backgroundColor: rememberMe ? theme.colors.primary : 'transparent',
                  borderColor: rememberMe ? theme.colors.primary : theme.colors.inputBorder,
                }]}>
                  {rememberMe && <Text style={s.checkboxTick}>✓</Text>}
                </View>
                <Text style={[s.rememberText, { color: theme.colors.textSecondary }]}>Nhớ tài khoản</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.forgotBtn}
                onPress={() => Alert.alert(t('auth.forgotPassword'), `${t('auth.forgotPasswordHint')}\n\nDemo: demo@memmori.vn / 123456`)}
              >
                <Text style={[s.forgotText, { color: theme.colors.primary }]}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
            </View>

            {/* Nút đăng nhập */}
            <TouchableOpacity
              style={[s.loginBtn, { backgroundColor: theme.colors.primary }, isLoading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.loginBtnText}>{t('auth.login')}</Text>
              }
            </TouchableOpacity>

            {/* Link đăng ký */}
            <View style={s.registerRow}>
              <Text style={[s.registerText, { color: theme.colors.textSecondary }]}>{t('auth.noAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[s.registerLink, { color: theme.colors.primary }]}>{t('auth.registerNow')}</Text>
              </TouchableOpacity>
            </View>

            {/* Demo hint */}
            <TouchableOpacity
              style={s.demoBtn}
              onPress={() => { setEmail('demo@memmori.vn'); setPassword('123456'); }}
            >
              <Text style={[s.demoText, { color: theme.colors.textSecondary }]}>
                🎯 {t('auth.demoHint')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: theme.colors.background },
    flex:         { flex: 1 },
    scrollContent:{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    header:       { alignItems: 'center', paddingTop: 36, paddingBottom: 24 },
    appName: { fontSize: 28, fontWeight: '800', color: theme.colors.primary, marginTop: 10, marginBottom: 6, letterSpacing: 1 },
    tagline: { fontSize: 13, color: theme.colors.secondary, fontWeight: '600', marginBottom: 14 },
    title:   { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
    subtitle:{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    form:    { gap: 4 },
    fieldGroup: { marginBottom: 16 },
    label:   { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 16, borderWidth: 1.5,
      borderColor: theme.colors.inputBorder,
      paddingHorizontal: 14, height: 54,
    },
    inputError: { borderColor: theme.colors.error },
    inputIcon:  { fontSize: 18, marginRight: 10 },
    input:      { flex: 1, fontSize: 15, color: theme.colors.text, height: '100%' },
    eyeBtn:     { padding: 6 },
    eyeIcon:    { fontSize: 18 },
    errorText:  { fontSize: 12, color: theme.colors.error, marginTop: 5 },
    savedBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 12, borderWidth: 1.5, marginBottom: 8,
    },
    savedBannerText:  { flex: 1, fontSize: 13, fontWeight: '600' },
    savedBannerClear: { fontSize: 13, fontWeight: '700' },
    rememberRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: -4 },
    rememberWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    checkboxTick: { color: '#fff', fontSize: 12, fontWeight: '900', lineHeight: 14 },
    rememberText: { fontSize: 13, fontWeight: '500' },
    forgotBtn:  { padding: 4 },
    forgotText: { fontSize: 13, fontWeight: '700' },
    loginBtn: {
      height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginTop: 8,
      shadowColor: '#7C5CBF', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    },
    btnDisabled:  { opacity: 0.65 },
    loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    registerRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
    registerText: { fontSize: 14 },
    registerLink: { fontSize: 14, fontWeight: '800' },
    demoBtn: {
      marginTop: 16, alignItems: 'center', padding: 12,
      borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border, borderStyle: 'dashed',
    },
    demoText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  });
}
