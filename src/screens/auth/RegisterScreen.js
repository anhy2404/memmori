// src/screens/auth/RegisterScreen.js - Màn hình đăng ký
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { theme, t } = useApp();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phonenumber: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      await register({ ...form, email: form.email.trim(), fullName: form.fullName.trim() });
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('auth.errorRegisterFailed'));
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
            <Text style={styles.logo}>🗺️</Text>
            <Text style={styles.appName}>MemoryMap</Text>
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
              )}
            </TouchableOpacity>

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
    header: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
    logo: { fontSize: 52, marginBottom: 6 },
    appName: { fontSize: 24, fontWeight: '800', color: theme.colors.primary, marginBottom: 12 },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
    subtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 19 },
    form: { gap: 2 },
    fieldGroup: { marginBottom: 14 },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 6 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 12, borderWidth: 1.5,
      borderColor: theme.colors.inputBorder,
      paddingHorizontal: 14, height: 52,
    },
    inputError: { borderColor: theme.colors.error },
    inputIcon: { fontSize: 18, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: theme.colors.text, height: '100%' },
    eyeBtn: { padding: 4 },
    errorText: { fontSize: 12, color: theme.colors.error, marginTop: 4, marginLeft: 2 },
    registerBtn: {
      height: 52, borderRadius: 12, alignItems: 'center',
      justifyContent: 'center', marginTop: 8,
      shadowColor: '#E84393', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    btnDisabled: { opacity: 0.7 },
    registerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
    loginText: { fontSize: 14 },
    loginLink: { fontSize: 14, fontWeight: '700' },
  });
}
