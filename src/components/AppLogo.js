// src/components/AppLogo.js - Logo Memmori: Camera icon 📷
const _0x616e6879 = '\x61\x6e\x68\x79';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppLogo({ size = 80, showName = false, nameColor = '#7C5CBF' }) {
  const r = size / 2;
  const bodyH = size * 0.58;
  const bodyW = size * 0.92;
  const bodyY = size * 0.28;
  const lensR = size * 0.22;
  const humpW = size * 0.32;
  const humpH = size * 0.18;

  return (
    <View style={styles.wrapper}>
      {/* Vầng sáng ngoài */}
      <View style={{
        width: size + size * 0.22,
        height: size + size * 0.22,
        borderRadius: (size + size * 0.22) / 2,
        backgroundColor: 'rgba(240,98,146,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Vầng sáng giữa */}
        <View style={{
          width: size + size * 0.08,
          height: size + size * 0.08,
          borderRadius: (size + size * 0.08) / 2,
          backgroundColor: 'rgba(124,92,191,0.14)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>

          {/* Quả cầu chính */}
          <View style={{
            width: size,
            height: size,
            borderRadius: r,
            backgroundColor: '#7C5CBF',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            shadowColor: '#5A3D9A',
            shadowOffset: { width: 0, height: size * 0.07 },
            shadowOpacity: 0.55,
            shadowRadius: size * 0.14,
            elevation: 14,
          }}>

            {/* Gradient overlay nửa dưới hồng */}
            <View style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: size * 0.5,
              backgroundColor: '#F06292',
              borderTopLeftRadius: size * 0.8,
              borderTopRightRadius: size * 0.5,
              opacity: 0.35,
            }} />

            {/* Highlight sáng góc trên trái */}
            <View style={{
              position: 'absolute',
              top: size * 0.06,
              left: size * 0.08,
              width: size * 0.35,
              height: size * 0.14,
              borderRadius: size * 0.1,
              backgroundColor: 'rgba(255,255,255,0.22)',
              transform: [{ rotate: '-20deg' }],
            }} />

            {/* ===== CAMERA BODY ===== */}
            {/* Bướu nhỏ trên thân máy (viewfinder hump) */}
            <View style={{
              position: 'absolute',
              top: bodyY - humpH * 0.75,
              left: r - humpW / 2,
              width: humpW,
              height: humpH,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderTopLeftRadius: humpH * 0.6,
              borderTopRightRadius: humpH * 0.6,
            }} />

            {/* Thân máy ảnh */}
            <View style={{
              position: 'absolute',
              top: bodyY,
              left: (size - bodyW) / 2,
              width: bodyW,
              height: bodyH,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: size * 0.1,
            }}>

              {/* Ống kính ngoài */}
              <View style={{
                position: 'absolute',
                top: bodyH / 2 - lensR,
                left: bodyW / 2 - lensR,
                width: lensR * 2,
                height: lensR * 2,
                borderRadius: lensR,
                backgroundColor: '#7C5CBF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3,
                elevation: 4,
              }}>
                {/* Ống kính giữa */}
                <View style={{
                  width: lensR * 1.3,
                  height: lensR * 1.3,
                  borderRadius: lensR * 0.65,
                  backgroundColor: '#3D2080',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* Phản chiếu sáng */}
                  <View style={{
                    position: 'absolute',
                    top: lensR * 0.18,
                    left: lensR * 0.18,
                    width: lensR * 0.42,
                    height: lensR * 0.42,
                    borderRadius: lensR * 0.21,
                    backgroundColor: 'rgba(255,255,255,0.45)',
                  }} />
                </View>
              </View>

              {/* Flash dot góc trên phải thân máy */}
              <View style={{
                position: 'absolute',
                top: bodyH * 0.12,
                right: bodyW * 0.12,
                width: size * 0.07,
                height: size * 0.07,
                borderRadius: size * 0.035,
                backgroundColor: '#FFD700',
              }} />
            </View>

            {/* Ngôi sao sparkle góc trên phải vòng cầu */}
            <View style={{ position: 'absolute', top: size * 0.06, right: size * 0.08 }}>
              <Text style={{ fontSize: size * 0.15, color: '#FFD700' }}>✦</Text>
            </View>

            {/* Trái tim nhỏ góc dưới trái */}
            <View style={{ position: 'absolute', bottom: size * 0.06, left: size * 0.09 }}>
              <Text style={{ fontSize: size * 0.13, color: 'rgba(255,255,255,0.65)' }}>♡</Text>
            </View>

          </View>
        </View>
      </View>

      {/* Tên app */}
      {showName && (
        <Text style={[styles.appName, { color: nameColor, fontSize: size * 0.28 }]}>
          Memmori
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 8 },
  appName: { fontWeight: '800', letterSpacing: 1 },
});
