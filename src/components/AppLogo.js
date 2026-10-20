// src/components/AppLogo.js - Logo Memmori: Camera + Polaroid (Trà Vinh) + Location Pin
const _0x616e6879 = '\x61\x6e\x68\x79';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Defs, LinearGradient, RadialGradient, Stop, Filter,
  FeDropShadow, Rect, Path, Circle, Line, Ellipse, G, Polygon, Text as SvgText,
} from 'react-native-svg';

export default function AppLogo({ size = 80, showName = false, nameColor = '#1E88E5' }) {
  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          {/* Icon background */}
          <RadialGradient id="bg" cx="45%" cy="40%" r="65%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#EEF3FF" />
          </RadialGradient>

          {/* Camera body */}
          <LinearGradient id="camTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#4A8FD4" />
            <Stop offset="100%" stopColor="#1A5DA8" />
          </LinearGradient>
          <LinearGradient id="camFace" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#3A7FC4" />
            <Stop offset="100%" stopColor="#1652A0" />
          </LinearGradient>
          <LinearGradient id="camSide" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#2060A8" />
            <Stop offset="100%" stopColor="#1A5098" />
          </LinearGradient>

          {/* Lens rings */}
          <RadialGradient id="lensOuter" cx="40%" cy="38%" r="60%">
            <Stop offset="0%" stopColor="#5BA3D8" />
            <Stop offset="100%" stopColor="#1A4E90" />
          </RadialGradient>
          <RadialGradient id="lensMid" cx="38%" cy="36%" r="60%">
            <Stop offset="0%" stopColor="#3A80C0" />
            <Stop offset="100%" stopColor="#0D2F6A" />
          </RadialGradient>
          <RadialGradient id="lensInner" cx="36%" cy="34%" r="55%">
            <Stop offset="0%" stopColor="#1A4A88" />
            <Stop offset="100%" stopColor="#071830" />
          </RadialGradient>

          {/* Polaroid photo — Trà Vinh sunset sky */}
          <LinearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#6CB8E8" />
            <Stop offset="45%" stopColor="#A8C8E8" />
            <Stop offset="75%" stopColor="#E8B87A" />
            <Stop offset="100%" stopColor="#C8855A" />
          </LinearGradient>
          <LinearGradient id="water" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#5AAAD0" />
            <Stop offset="100%" stopColor="#2D7AA8" />
          </LinearGradient>

          {/* Location pin */}
          <LinearGradient id="pin" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF5252" />
            <Stop offset="100%" stopColor="#FF7043" />
          </LinearGradient>
        </Defs>

        {/* ── Rounded square background ── */}
        <Rect x="4" y="4" width="192" height="192" rx="44" ry="44" fill="url(#bg)" />
        <Rect x="4" y="4" width="192" height="192" rx="44" ry="44"
          fill="none" stroke="#DDE6F5" strokeWidth="1.5" />

        {/* ════════════════════
            CAMERA BODY
            ════════════════════ */}
        {/* Camera shadow */}
        <Ellipse cx="100" cy="170" rx="62" ry="7" fill="rgba(20,60,130,0.18)" />

        {/* Camera top strip (hump area) */}
        <Rect x="44" y="95" width="112" height="18" rx="8" fill="url(#camTop)" />

        {/* Camera main body */}
        <Rect x="36" y="108" width="128" height="58" rx="10" fill="url(#camFace)" />

        {/* Camera body left edge highlight */}
        <Rect x="36" y="108" width="14" height="58" rx="10" fill="url(#camSide)" />

        {/* Camera top highlight stripe */}
        <Rect x="44" y="109" width="120" height="5" rx="3" fill="rgba(255,255,255,0.12)" />

        {/* Viewfinder hump */}
        <Rect x="52" y="88" width="38" height="18" rx="7" fill="url(#camTop)" />
        {/* Viewfinder window */}
        <Rect x="56" y="91" width="30" height="11" rx="4" fill="#5EB2E8" opacity="0.55" />
        <Rect x="57" y="92" width="10" height="4" rx="2" fill="rgba(255,255,255,0.35)" />

        {/* Flash / LCD panel top-right of hump */}
        <Rect x="126" y="91" width="20" height="12" rx="4" fill="#E8C060" opacity="0.9" />
        <Rect x="128" y="93" width="8" height="4" rx="2" fill="rgba(255,255,255,0.5)" />

        {/* Shutter button */}
        <Circle cx="142" cy="99" r="7" fill="#2D6EAD" />
        <Circle cx="142" cy="99" r="5" fill="#4A90D4" />
        <Circle cx="140" cy="97" r="1.8" fill="rgba(255,255,255,0.35)" />

        {/* ── Lens assembly ── */}
        {/* Lens mount ring */}
        <Circle cx="96" cy="139" r="30" fill="#12366B" />
        {/* Outer glass ring */}
        <Circle cx="96" cy="139" r="27" fill="url(#lensOuter)" />
        {/* Middle ring */}
        <Circle cx="96" cy="139" r="21" fill="url(#lensMid)" />
        {/* Inner glass */}
        <Circle cx="96" cy="139" r="15" fill="url(#lensInner)" />
        {/* Lens shine top-left */}
        <Circle cx="89" cy="131" r="5" fill="rgba(255,255,255,0.18)" />
        <Circle cx="87" cy="129" r="2.5" fill="rgba(255,255,255,0.28)" />
        {/* Tiny bottom reflection */}
        <Circle cx="103" cy="148" r="2" fill="rgba(255,255,255,0.10)" />

        {/* ════════════════════
            POLAROID PHOTO (tilted +12°)
            Trà Vinh: river, coconut palms, Khmer pagoda
            ════════════════════ */}
        <G transform="translate(116, 102) rotate(12) translate(-38,-46)">
          {/* Drop shadow */}
          <Rect x="4" y="4" width="76" height="88" rx="6" fill="rgba(0,0,0,0.15)" />
          {/* White polaroid frame */}
          <Rect x="0" y="0" width="76" height="88" rx="6"
            fill="white" stroke="#1E6FC8" strokeWidth="2" />

          {/* ── Photo area ── */}
          <Rect x="6" y="6" width="64" height="56" rx="3" fill="url(#sky)" />

          {/* River / water bottom third */}
          <Rect x="6" y="42" width="64" height="20" rx="0" fill="url(#water)" opacity="0.9" />
          {/* Water shimmer */}
          <Line x1="12" y1="48" x2="28" y2="48" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
          <Line x1="40" y1="50" x2="62" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" />
          <Line x1="14" y1="55" x2="36" y2="55" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />

          {/* Green riverbank */}
          <Rect x="6" y="39" width="64" height="6" fill="#3D8B40" opacity="0.85" />
          {/* Water lily patches */}
          <Ellipse cx="20" cy="52" rx="6" ry="3" fill="#2D6E2D" opacity="0.5" />
          <Ellipse cx="54" cy="55" rx="5" ry="2.5" fill="#2D6E2D" opacity="0.45" />

          {/* Coconut palm LEFT */}
          <Line x1="20" y1="39" x2="15" y2="14" stroke="#5D3A1A" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M15 14 Q7 10 5 5" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
          <Path d="M15 14 Q11 8 13 4" fill="none" stroke="#388E3C" strokeWidth="2" strokeLinecap="round" />
          <Path d="M15 14 Q17 7 22 5" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
          <Path d="M15 14 Q22 11 26 9" fill="none" stroke="#388E3C" strokeWidth="1.8" strokeLinecap="round" />
          <Circle cx="14" cy="16" r="2.5" fill="#6D4C1F" />

          {/* Coconut palm RIGHT */}
          <Line x1="58" y1="39" x2="63" y2="14" stroke="#5D3A1A" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M63 14 Q71 10 73 5" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
          <Path d="M63 14 Q67 8 65 4" fill="none" stroke="#388E3C" strokeWidth="2" strokeLinecap="round" />
          <Path d="M63 14 Q61 7 56 5" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
          <Path d="M63 14 Q56 11 52 9" fill="none" stroke="#388E3C" strokeWidth="1.8" strokeLinecap="round" />
          <Circle cx="64" cy="16" r="2.5" fill="#6D4C1F" />

          {/* Khmer pagoda silhouette (centre) */}
          {/* Base platform */}
          <Rect x="31" y="36" width="16" height="5" rx="1" fill="#C8956C" opacity="0.95" />
          {/* Main body */}
          <Rect x="34" y="25" width="10" height="14" rx="1" fill="#C8956C" opacity="0.95" />
          {/* First spire tier */}
          <Polygon points="39,24 35,20 43,20" fill="#B07850" opacity="0.95" />
          {/* Second spire tier */}
          <Polygon points="39,19 36,16 42,16" fill="#A06840" opacity="0.9" />
          {/* Top spire */}
          <Polygon points="39,15 37,12 41,12" fill="#8A5830" opacity="0.9" />
          {/* Lotus tip */}
          <Circle cx="39" cy="11" r="1.8" fill="#FFD54F" opacity="0.85" />
          {/* Naga decorative on base */}
          <Path d="M29 39 Q33 37 37 38 Q41 39 45 38 Q49 37 51 39"
            fill="none" stroke="#9A6030" strokeWidth="0.9" strokeLinecap="round" />

          {/* Clouds in sky */}
          <Ellipse cx="14" cy="12" rx="6" ry="3" fill="rgba(255,255,255,0.5)" />
          <Ellipse cx="19" cy="11" rx="5" ry="2.5" fill="rgba(255,255,255,0.5)" />
          <Ellipse cx="60" cy="12" rx="5" ry="2.5" fill="rgba(255,255,255,0.45)" />
          <Ellipse cx="65" cy="11" rx="4" ry="2" fill="rgba(255,255,255,0.45)" />

          {/* Golden sun haze */}
          <Circle cx="39" cy="32" r="6" fill="#FFD54F" opacity="0.22" />

          {/* Polaroid label */}
          <SvgText
            x="38" y="80"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="6"
            fill="#90A4AE"
            letterSpacing="1.2"
          >TRÀ VINH</SvgText>
        </G>

        {/* ════════════════════
            LOCATION PIN
            ════════════════════ */}
        {/* Pin drop shadow */}
        <Ellipse cx="118" cy="66" rx="8" ry="3.5" fill="rgba(0,0,0,0.15)" />
        {/* Pin tear-drop body */}
        <Path
          d="M118 32 C106 32 97 42 97 53 C97 67 118 84 118 84 C118 84 139 67 139 53 C139 42 130 32 118 32 Z"
          fill="url(#pin)" stroke="white" strokeWidth="2.5"
        />
        {/* Pin inner white ring */}
        <Circle cx="118" cy="52" r="10" fill="rgba(255,255,255,0.92)" />
        {/* Pin inner cyan dot */}
        <Circle cx="118" cy="52" r="6.5" fill="#29B6F6" />
        {/* Dot shine */}
        <Circle cx="115" cy="49" r="2.2" fill="rgba(255,255,255,0.65)" />

        {/* ════════
            SPARKLES
            ════════ */}
        {/* Gold 4-point sparkle top-right */}
        <G transform="translate(152, 56)">
          <Line x1="0" y1="-10" x2="0" y2="10" stroke="#FFC107" strokeWidth="3" strokeLinecap="round" />
          <Line x1="-10" y1="0" x2="10" y2="0" stroke="#FFC107" strokeWidth="3" strokeLinecap="round" />
          <Line x1="-6" y1="-6" x2="6" y2="6" stroke="#FFC107" strokeWidth="1.6" strokeLinecap="round" />
          <Line x1="6" y1="-6" x2="-6" y2="6" stroke="#FFC107" strokeWidth="1.6" strokeLinecap="round" />
        </G>
        {/* Small blue sparkle left */}
        <G transform="translate(48, 72)">
          <Line x1="0" y1="-5" x2="0" y2="5" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round" />
          <Line x1="-5" y1="0" x2="5" y2="0" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round" />
        </G>
        {/* Tiny accent dots */}
        <Circle cx="163" cy="76" r="2.2" fill="#FFD54F" />
        <Circle cx="40" cy="88" r="1.6" fill="#90CAF9" />
      </Svg>

      {showName && (
        <Text style={[styles.appName, { color: nameColor, fontSize: size * 0.26 }]}>
          Memmori
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 8 },
  appName: { fontWeight: '800', letterSpacing: 1.5 },
});
