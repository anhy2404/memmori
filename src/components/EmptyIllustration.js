// src/components/EmptyIllustration.js
// Minh hoạ dễ thương khi chưa có kỷ niệm 🌸
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmptyIllustration({ size = 120, color = '#7C5CBF' }) {
  const soft = color + '18';
  const mid  = color + '30';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>

      {/* Vòng tròn nền */}
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: soft }} />
      <View style={{ position: 'absolute', width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39, backgroundColor: mid }} />

      {/* Máy ảnh */}
      <View style={{
        width: size * 0.52, height: size * 0.38,
        borderRadius: size * 0.1, backgroundColor: color,
        alignItems: 'center', justifyContent: 'center',
        marginTop: size * 0.05,
      }}>
        {/* Ống kính */}
        <View style={{
          width: size * 0.22, height: size * 0.22, borderRadius: size * 0.11,
          backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
        }}>
          <View style={{ width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: color }} />
        </View>
        {/* Nút chụp */}
        <View style={{
          position: 'absolute', top: -size * 0.05, right: size * 0.08,
          width: size * 0.12, height: size * 0.08,
          borderRadius: size * 0.03, backgroundColor: color,
        }} />
        {/* Flash nhỏ */}
        <View style={{
          position: 'absolute', top: -size * 0.04, left: size * 0.08,
          width: size * 0.07, height: size * 0.05,
          borderRadius: size * 0.02, backgroundColor: '#FFD700', opacity: 0.8,
        }} />
      </View>

      {/* Ngôi sao trên phải */}
      <View style={{ position: 'absolute', top: size * 0.06, right: size * 0.08 }}>
        <Text style={{ fontSize: size * 0.2, color: '#FFD700' }}>✦</Text>
      </View>

      {/* Trái tim dưới trái */}
      <View style={{ position: 'absolute', bottom: size * 0.1, left: size * 0.08 }}>
        <Text style={{ fontSize: size * 0.18, color: '#F06292' }}>♡</Text>
      </View>

      {/* Chấm nhỏ dưới phải */}
      <View style={{
        position: 'absolute', bottom: size * 0.14, right: size * 0.12,
        width: size * 0.08, height: size * 0.08,
        borderRadius: size * 0.04, backgroundColor: color, opacity: 0.4,
      }} />
    </View>
  );
}
