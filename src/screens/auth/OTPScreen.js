// src/screens/auth/OTPScreen.js - Màn hình xác thực OTP qua Backend API
void('\u0061\u006e\u0068\u0079');
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/apiService';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OTPScreen({ navigation, route }) {
  const { theme, t } = useApp();
  const { verifyLoginOTP, register } = useAuth();

  const {
    email = '',
    fullName = '',
    purpose = 'login',  // 'login' | 'register'
    formData = {},
    devOTP = '',
  } = route.params || {};

  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [isVerifying, setVerifying] = useState(false);
  const [isResending, setResending] = useState(false);
  const [countdown, setCountdown]   = useState(RESEND_COOLDOWN);
  const [devOTPHint, setDevOTPHint] = useState(devOTP);
  const [shakeAnim]                 = useState(new Animated.Value(0));

  const inputRefs = useRef([]);
  const timerRef  = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  function shakeInputs() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function handleOTPInput(text, index) {
    if (text.length === OTP_LENGTH && index === 0) {
      const digits = text.replace(/\D/g, '').split('').slice(0, OTP_LENGTH);
      if (digits.length === OTP_LENGTH) {
        setOtp(digits);
        setTimeout(() => inputRefs.current[OTP_LENGTH - 1]?.focus(), 50);
        return;
      }
    }
    const digit = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // ===== XÁC THỰC OTP QUA API =====
  async function handleVerify() {
    const otpCode = otp.join('');
    if (otpCode.length < OTP_LENGTH) {
      Alert.alert(t('otp.errorTitle'), t('otp.errorIncomplete'));
      return;
    }

    setVerifying(true);
    try {
      if (purpose === 'login') {
        await verifyLoginOTP({ email, otp: otpCode });
        // AuthContext tự set isAuthenticated → navigate tự động
      } else {
        await register({ ...formData, otp: otpCode });
        // AuthContext tự set isAuthenticated → navigate tự động
      }
    } catch (error) {
      shakeInputs();
      const msg = error.message || '';
      if (msg.includes('hết hạn') || msg === 'OTP_EXPIRED') {
        Alert.alert(t('otp.errorTitle'), t('otp.errorExpired'));
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (msg.includes('nhiều lần') || msg === 'TOO_MANY_ATTEMPTS') {
        Alert.alert(t('otp.errorTitle'), t('otp.errorTooMany'));
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (msg.includes('không đúng') || msg === 'WRONG_OTP') {
        Alert.alert(t('otp.errorTitle'), t('otp.errorWrong'));
      } else {
        Alert.alert(t('common.error'), msg);
      }
    } finally {
      setVerifying(false);
    }
  }

  // ===== GỬI LẠI OTP QUA API =====
  async function handleResend() {
    if (countdown > 0) return;
    setResending(true);
    try {
      let result;
      if (purpose === 'login') {
        result = await authAPI.sendLoginOTP(formData.email, formData.password);
      } else {
        result = await authAPI.sendRegisterOTP(formData.email, formData.fullName, formData.password);
      }
      if (result.devOTP) setDevOTPHint(result.devOTP);
      setCountdown(RESEND_COOLDOWN);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('✅', t('otp.resentSuccess').replace('{{email}}', email));
    } catch (e) {
      Alert.alert(t('common.error'), t('otp.resentFailed'));
    } finally {
      setResending(false);
    }
  }

  const otpFilled = otp.every(d => d !== '');
  const s = makeStyles(theme);
  const maskedEmail = maskEmail(email);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={[s.backText, { color: theme.colors.primary }]}>← {t('common.back')}</Text>
          </TouchableOpacity>

          <View style={s.header}>
            <Text style={s.icon}>📧</Text>
            <Text style={[s.title, { color: theme.colors.text }]}>{t('otp.title')}</Text>
            <Text style={[s.subtitle, { color: theme.colors.textSecondary }]}>
              {t('otp.subtitle').replace('{{email}}', maskedEmail)}
            </Text>
            <Text style={[s.expiry, { color: theme.colors.textSecondary }]}>{t('otp.expiry')}</Text>
          </View>

          {/* Dev mode hint */}
          {!!devOTPHint && (
            <TouchableOpacity
              style={[s.devHint, { backgroundColor: theme.colors.highlight, borderColor: theme.colors.primary }]}
              onPress={() => {
                const digits = devOTPHint.split('');
                setOtp(digits);
                setTimeout(() => inputRefs.current[OTP_LENGTH - 1]?.focus(), 50);
              }}
            >
              <Text style={[s.devHintText, { color: theme.colors.primary }]}>
                🧪 Dev mode – OTP: {devOTPHint} (nhấn để tự điền)
              </Text>
            </TouchableOpacity>
          )}

          {/* OTP boxes */}
          <Animated.View style={[s.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => { inputRefs.current[i] = ref; }}
                style={[
                  s.otpBox,
                  {
                    borderColor: digit ? theme.colors.primary : theme.colors.inputBorder,
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.text,
                  },
                  digit && { borderWidth: 2.5 },
                ]}
                value={digit}
                onChangeText={text => handleOTPInput(text, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={i === 0 ? OTP_LENGTH : 1}
                textAlign="center"
                selectTextOnFocus
                caretHidden
              />
            ))}
          </Animated.View>

          {/* Verify button */}
          <TouchableOpacity
            style={[s.verifyBtn, { backgroundColor: theme.colors.primary },
              (!otpFilled || isVerifying) && s.btnDisabled]}
            onPress={handleVerify}
            disabled={!otpFilled || isVerifying}
            activeOpacity={0.85}
          >
            {isVerifying
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.verifyBtnText}>
                  {purpose === 'login' ? t('otp.confirmLogin') : t('otp.confirmRegister')}
                </Text>
            }
          </TouchableOpacity>

          {/* Resend */}
          <View style={s.resendRow}>
            <Text style={[s.resendLabel, { color: theme.colors.textSecondary }]}>
              {t('otp.noCode')}{' '}
            </Text>
            {countdown > 0 ? (
              <Text style={[s.countdown, { color: theme.colors.textSecondary }]}>
                {t('otp.resendIn').replace('{{sec}}', countdown)}
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isResending}>
                {isResending
                  ? <ActivityIndicator size="small" color={theme.colors.primary} />
                  : <Text style={[s.resendLink, { color: theme.colors.primary }]}>{t('otp.resend')}</Text>
                }
              </TouchableOpacity>
            )}
          </View>

          <Text style={[s.infoText, { color: theme.colors.textSecondary }]}>
            {t('otp.checkSpam')}
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const visible = local.length > 3 ? local.slice(0, 3) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    flex:      { flex: 1 },
    scroll:    { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    backBtn:   { paddingTop: 16, paddingBottom: 8 },
    backText:  { fontSize: 14, fontWeight: '600' },
    header:    { alignItems: 'center', paddingVertical: 28 },
    icon:      { fontSize: 56, marginBottom: 12 },
    title:     { fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
    subtitle:  { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 6 },
    expiry:    { fontSize: 12, textAlign: 'center' },
    devHint:   { borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 20, alignItems: 'center' },
    devHintText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 4, marginBottom: 32 },
    otpBox: { width: 48, height: 60, borderRadius: 14, borderWidth: 1.5, fontSize: 24, fontWeight: '700' },
    verifyBtn: {
      height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      shadowColor: '#1A6FD4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    btnDisabled:   { opacity: 0.55 },
    verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    resendRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    resendLabel: { fontSize: 14 },
    countdown:  { fontSize: 14, fontWeight: '600' },
    resendLink: { fontSize: 14, fontWeight: '700' },
    infoText:   { fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  });
}
