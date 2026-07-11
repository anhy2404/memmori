// src/screens/auth/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import AppLogo from '../../components/AppLogo';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme, t } = useApp();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPwd]  = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [errors, setErrors]         = useState({});

  // Reset form khi màn hình focus lại (sau logout)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setEmail('');
      setPassword('');
      setErrors({});
      setShowPwd(false);
    });
    return unsubscribe;
  }, [navigation]);

  function validate() {
    const e = {};
    if (!email.trim())                              e.email    = t('auth.errorEmailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t('auth.errorEmailInvalid');
    if (!password)                                  e.password = t('auth.errorPasswordRequired');
    else if (password.length < 6)                   e.password = t('auth.errorPasswordMin');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('auth.errorLoginFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <AppLogo size={88} showName={false} />
            <Text style={s.appName}>MemoryMap</Text>
            <Text style={s.title}>{t('auth.welcomeBack')}</Text>
            <Text style={s.subtitle}>{t('auth.welcomeSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={s.form}>

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

            {/* Quên mật khẩu */}
            <TouchableOpacity
              style={s.forgotBtn}
              onPress={() => Alert.alert(
                t('auth.forgotPassword'),
                `${t('auth.forgotPasswordHint')}\n\nDemo: demo@memorymap.vn / 123456`
              )}
            >
              <Text style={[s.forgotText, { color: theme.colors.primary }]}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

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
              onPress={() => { setEmail('demo@memorymap.vn'); setPassword('123456'); }}
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
    header:       { alignItems: 'center', paddingTop: 40, paddingBottom: 28 },
    appName:      { fontSize: 26, fontWeight: '800', color: theme.colors.primary, marginTop: 10, marginBottom: 14, letterSpacing: 0.5 },
    title:        { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
    subtitle:     { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    form:         { gap: 4 },
    fieldGroup:   { marginBottom: 16 },
    label:        { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 14, borderWidth: 1.5,
      borderColor: theme.colors.inputBorder,
      paddingHorizontal: 14, height: 52,
    },
    inputError:   { borderColor: theme.colors.error },
    inputIcon:    { fontSize: 18, marginRight: 10 },
    input:        { flex: 1, fontSize: 15, color: theme.colors.text, height: '100%' },
    eyeBtn:       { padding: 6 },
    eyeIcon:      { fontSize: 18 },
    errorText:    { fontSize: 12, color: theme.colors.error, marginTop: 5 },
    forgotBtn:    { alignSelf: 'flex-end', marginBottom: 8, marginTop: -4, padding: 4 },
    forgotText:   { fontSize: 13, fontWeight: '600' },
    loginBtn: {
      height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8,
      shadowColor: '#1A6FD4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
    },
    btnDisabled:  { opacity: 0.7 },
    loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    registerRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    registerText: { fontSize: 14 },
    registerLink: { fontSize: 14, fontWeight: '700' },
    demoBtn:      { marginTop: 16, alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
    demoText:     { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  });
}
