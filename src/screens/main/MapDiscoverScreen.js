// src/screens/main/MapDiscoverScreen.js
// Màn hình gộp: Bản đồ + Khám phá địa điểm
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import MapScreen from './MapScreen';
import DiscoverScreen from './DiscoverScreen';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'map',      label: 'Bản đồ',   emoji: '🗺️' },
  { key: 'discover', label: 'Địa điểm', emoji: '✨' },
];

export default function MapDiscoverScreen({ navigation }) {
  const { theme } = useApp();
  const [activeTab, setActiveTab] = useState('map');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchTab = useCallback((key) => {
    const toValue = key === 'map' ? 0 : 1;
    Animated.spring(slideAnim, {
      toValue, useNativeDriver: true,
      tension: 68, friction: 11,
    }).start();
    setActiveTab(key);
  }, [slideAnim]);

  const indicatorX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, width / 2 - 4],
  });

  const s = styles(theme);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Segmented Control Header ── */}
      <View style={[s.header, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}>
        <View style={[s.segmentWrap, { backgroundColor: theme.colors.primarySoft }]}>
          {/* Indicator trượt */}
          <Animated.View
            style={[
              s.segmentIndicator,
              { backgroundColor: theme.colors.primary, transform: [{ translateX: indicatorX }] },
            ]}
          />
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={s.segmentBtn}
                onPress={() => switchTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.segmentEmoji, { fontSize: active ? 18 : 16 }]}>{tab.emoji}</Text>
                <Text style={[
                  s.segmentLabel,
                  { color: active ? '#fff' : theme.colors.textSecondary },
                  active && { fontWeight: '800' },
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Nội dung ── */}
      {activeTab === 'map' ? (
        <MapScreen navigation={navigation} embedded />
      ) : (
        <DiscoverScreen navigation={navigation} embedded />
      )}
    </SafeAreaView>
  );
}

const styles = (theme) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  segmentWrap: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    borderRadius: 20,
    marginRight: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 20,
    zIndex: 1,
  },
  segmentEmoji: {},
  segmentLabel: { fontSize: 14, fontWeight: '600' },
});
