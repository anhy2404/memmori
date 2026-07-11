// src/components/AppLogo.js - Logo MemoryMap: Quả địa cầu + Ghim + Ngôi sao
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Logo MemoryMap:
 *  - Quả địa cầu xanh dương (vòng tròn + đường kinh tuyến/vĩ tuyến)
 *  - Ghim vị trí trắng ở tâm
 *  - Ngôi sao vàng nhỏ = kỷ niệm
 *  - Chấm sóng biển trang trí
 */
export default function AppLogo({ size = 80, showName = false, nameColor = '#1A6FD4' }) {
  const r = size / 2;  // bán kính

  return (
    <View style={styles.wrapper}>
      {/* ===== VỎ NGOÀI - hiệu ứng shadow vòng ===== */}
      <View style={{
        width: size + size * 0.1,
        height: size + size * 0.1,
        borderRadius: (size + size * 0.1) / 2,
        backgroundColor: 'rgba(26,111,212,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>

        {/* ===== QUẢ ĐỊA CẦU CHÍNH ===== */}
        <View style={{
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: '#1A6FD4',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          shadowColor: '#0D4FA0',
          shadowOffset: { width: 0, height: size * 0.06 },
          shadowOpacity: 0.5,
          shadowRadius: size * 0.12,
          elevation: 12,
        }}>

          {/* ── Phần biển (nền) ── đã là màu nền */}

          {/* ── Mảng đất liền trái ── */}
          <View style={{
            position: 'absolute',
            top: size * 0.18,
            left: size * 0.06,
            width: size * 0.28,
            height: size * 0.32,
            borderRadius: size * 0.09,
            backgroundColor: '#4B96F3',
            transform: [{ rotate: '15deg' }],
          }} />

          {/* ── Mảng đất liền phải ── */}
          <View style={{
            position: 'absolute',
            top: size * 0.22,
            right: size * 0.08,
            width: size * 0.24,
            height: size * 0.28,
            borderRadius: size * 0.08,
            backgroundColor: '#4B96F3',
            transform: [{ rotate: '-10deg' }],
          }} />

          {/* ── Mảng đất liền dưới ── */}
          <View style={{
            position: 'absolute',
            bottom: size * 0.14,
            left: size * 0.28,
            width: size * 0.36,
            height: size * 0.2,
            borderRadius: size * 0.07,
            backgroundColor: '#4B96F3',
          }} />

          {/* ── Đường xích đạo ngang ── */}
          <View style={{
            position: 'absolute',
            top: r - size * 0.015,
            left: size * 0.04,
            right: size * 0.04,
            height: size * 0.03,
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: 2,
          }} />

          {/* ── Đường kinh tuyến đứng ── */}
          <View style={{
            position: 'absolute',
            left: r - size * 0.015,
            top: size * 0.04,
            bottom: size * 0.04,
            width: size * 0.03,
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: 2,
          }} />

          {/* ── Viền ngoài sáng (highlight) ── */}
          <View style={{
            position: 'absolute',
            top: size * 0.05,
            left: size * 0.1,
            width: size * 0.35,
            height: size * 0.18,
            borderRadius: size * 0.09,
            backgroundColor: 'rgba(255,255,255,0.2)',
            transform: [{ rotate: '-20deg' }],
          }} />

          {/* ===== GHIM VỊ TRÍ Ở TRUNG TÂM ===== */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {/* Đầu ghim */}
            <View style={{
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
            }}>
              {/* Lỗ tâm ghim */}
              <View style={{
                width: size * 0.12,
                height: size * 0.12,
                borderRadius: size * 0.06,
                backgroundColor: '#1A6FD4',
              }} />
            </View>
            {/* Đuôi ghim tam giác */}
            <View style={{
              width: 0,
              height: 0,
              borderLeftWidth: size * 0.09,
              borderRightWidth: size * 0.09,
              borderTopWidth: size * 0.14,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#FFFFFF',
              marginTop: -1,
            }} />
          </View>

          {/* ── Ngôi sao vàng góc trên phải ── */}
          <View style={{
            position: 'absolute',
            top: size * 0.07,
            right: size * 0.09,
          }}>
            <Text style={{ fontSize: size * 0.17, color: '#FFD700' }}>★</Text>
          </View>

          {/* ── Chấm trang trí góc dưới trái ── */}
          <View style={{
            position: 'absolute',
            bottom: size * 0.12,
            left: size * 0.1,
            width: size * 0.06,
            height: size * 0.06,
            borderRadius: size * 0.03,
            backgroundColor: 'rgba(255,255,255,0.45)',
          }} />

          {/* ── Chấm nhỏ hơn ── */}
          <View style={{
            position: 'absolute',
            bottom: size * 0.22,
            left: size * 0.07,
            width: size * 0.04,
            height: size * 0.04,
            borderRadius: size * 0.02,
            backgroundColor: 'rgba(255,255,255,0.3)',
          }} />
        </View>
      </View>

      {/* Tên app */}
      {showName && (
        <Text style={[styles.appName, { color: nameColor, fontSize: size * 0.28 }]}>
          MemoryMap
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:  { alignItems: 'center', gap: 8 },
  appName:  { fontWeight: '800', letterSpacing: 0.8 },
});
