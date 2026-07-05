// src/screens/auth/LoginScreen.js - Màn hình đăng nhập
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme, t } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate form
  function validate() {
    const newErrors = {};
    if (!email.trim()) newErrors.email = t('auth.errorEmailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = t('auth.errorEmailInvalid');
    if (!password) newErrors.password = t('auth.errorPasswordRequired');
    else if (password.length < 6) newErrors.password = t('auth.errorPasswordMin');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Xử lý đăng nhập
  async function handleLogin() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      // Navigation sẽ tự động chuyển sang AppStack nhờ AuthContext
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('auth.errorLoginFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🗺️</Text>
            <Text style={styles.appName}>MemoryMap</Text>
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors(e => ({ ...e, email: '' })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>⚠️ {errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors(e => ({ ...e, password: '' })); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>⚠️ {errors.password}</Text> : null}
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: theme.colors.primary }, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>{t('auth.login')}</Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={[styles.registerText, { color: theme.colors.textSecondary }]}>
                {t('auth.noAccount')}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.registerLink, { color: theme.colors.primary }]}>
                  {t('auth.registerNow')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Demo account hint */}
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => { setEmail('demo@memorymap.vn'); setPassword('123456'); }}
            >
              <Text style={[styles.demoText, { color: theme.colors.textSecondary }]}>
                🎯 Dùng tài khoản demo: demo@memorymap.vn / 123456
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
    container: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    header: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
    logo: { fontSize: 64, marginBottom: 8 },
    appName: { fontSize: 28, fontWeight: '800', color: theme.colors.primary, marginBottom: 16 },
    title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    form: { gap: 4 },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 6 },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.inputBorder,
      paddingHorizontal: 14,
      height: 52,
    },
    inputError: { borderColor: theme.colors.error },
    inputIcon: { fontSize: 18, marginRight: 10 },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      height: '100%',
    },
    eyeBtn: { padding: 4 },
    eyeIcon: { fontSize: 18 },
    errorText: { fontSize: 12, color: theme.colors.error, marginTop: 4, marginLeft: 2 },
    forgotBtn: { alignSelf: 'flex-end', marginBottom: 8, marginTop: -4 },
    forgotText: { fontSize: 13, fontWeight: '500' },
    loginBtn: {
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: '#E84393',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    btnDisabled: { opacity: 0.7 },
    loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    registerText: { fontSize: 14 },
    registerLink: { fontSize: 14, fontWeight: '700' },
    demoBtn: { marginTop: 16, alignItems: 'center', padding: 10 },
    demoText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  });
}
