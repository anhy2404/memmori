// src/components/EmptyIllustration.js
// Minh hoạ dễ thương khi chưa có kỷ niệm: chiếc máy ảnh + ghim + ngôi sao
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmptyIllustration({ size = 120, color = '#1A6FD4' }) {
  const soft = color + '18';   // nền nhạt
  const mid  = color + '35';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>

      {/* ── Vòng tròn nền ── */}
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: soft,
      }} />
      <View style={{
        position: 'absolute',
        width: size * 0.78,
        height: size * 0.78,
        borderRadius: size * 0.39,
        backgroundColor: mid,
      }} />

      {/* ── Máy ảnh (body) ── */}
      <View style={{
        width: size * 0.52,
        height: size * 0.38,
        borderRadius: size * 0.07,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: size * 0.05,
      }}>
        {/* Ống kính */}
        <View style={{
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: size * 0.11,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            width: size * 0.12,
            height: size * 0.12,
            borderRadius: size * 0.06,
            backgroundColor: color,
          }} />
        </View>
        {/* Nút chụp nhỏ góc trên phải */}
        <View style={{
          position: 'absolute',
          top: -size * 0.05,
          right: size * 0.08,
          width: size * 0.12,
          height: size * 0.08,
          borderRadius: size * 0.03,
          backgroundColor: color,
        }} />
      </View>

      {/* ── Ngôi sao trên phải ── */}
      <View style={{ position: 'absolute', top: size * 0.07, right: size * 0.1 }}>
        <Text style={{ fontSize: size * 0.18, color: '#FFD700' }}>★</Text>
      </View>

      {/* ── Ghim nhỏ dưới trái ── */}
      <View style={{
        position: 'absolute',
        bottom: size * 0.12,
        left: size * 0.1,
        alignItems: 'center',
      }}>
        {/* Đầu ghim */}
        <View style={{
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: '#FFFFFF',
          borderWidth: 2,
          borderColor: color,
        }} />
        {/* Đuôi ghim */}
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.05,
          borderRightWidth: size * 0.05,
          borderTopWidth: size * 0.09,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          marginTop: -1,
        }} />
      </View>

      {/* ── Chấm nhỏ dưới phải ── */}
      <View style={{
        position: 'absolute',
        bottom: size * 0.14,
        right: size * 0.12,
        width: size * 0.08,
        height: size * 0.08,
        borderRadius: size * 0.04,
        backgroundColor: color,
        opacity: 0.5,
      }} />
    </View>
  );
}
