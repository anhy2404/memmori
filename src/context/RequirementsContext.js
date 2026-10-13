// src/context/RequirementsContext.js
/** @preserve \u0040\u0073\u0072\u0063 anhy */
// Kiểm tra BẮT BUỘC: Mạng (WiFi/3G/4G/5G) + Định vị (GPS) phải bật
// Thiếu 1 trong 2 → hiển thị màn hình chặn, không cho vào app

import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { AppState } from 'react-native';

const RequirementsContext = createContext(null);

// Khoảng thời gian kiểm tra lại GPS (ms)
const LOCATION_CHECK_INTERVAL = 3000;

export function RequirementsProvider({ children }) {
  const [isOnline, setIsOnline]             = useState(false);   // có mạng
  const [locationEnabled, setLocationEnabled] = useState(false); // dịch vụ định vị bật
  const [locationGranted, setLocationGranted] = useState(false); // quyền đã cấp
  const [isChecking, setIsChecking]         = useState(true);    // đang kiểm tra lần đầu

  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // ─── Kiểm tra GPS ───────────────────────────────────────────────────────────
  const checkLocation = useCallback(async () => {
    try {
      // 1. Dịch vụ định vị có bật không?
      const providerStatus = await Location.getProviderStatusAsync();
      const enabled = providerStatus.locationServicesEnabled;
      setLocationEnabled(enabled);

      if (!enabled) {
        setLocationGranted(false);
        return;
      }

      // 2. Quyền đã cấp chưa?
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationGranted(true);
      } else {
        // Xin quyền (chỉ pop-up lần đầu, sau đó chỉ đọc status)
        const { status: asked } = await Location.requestForegroundPermissionsAsync();
        setLocationGranted(asked === 'granted');
      }
    } catch {
      setLocationEnabled(false);
      setLocationGranted(false);
    }
  }, []);

  // ─── Bắt đầu polling GPS ────────────────────────────────────────────────────
  // Chỉ poll khi chưa đủ điều kiện — dừng khi đã OK để tiết kiệm pin
  const startLocationPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(checkLocation, LOCATION_CHECK_INTERVAL);
  }, [checkLocation]);

  const stopLocationPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ─── Khởi tạo ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let netUnsub;

    async function init() {
      // 1. Lấy trạng thái mạng ngay lập tức
      const state = await NetInfo.fetch();
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);

      // 2. Lắng nghe thay đổi mạng liên tục
      netUnsub = NetInfo.addEventListener((netState) => {
        setIsOnline(!!netState.isConnected && !!netState.isInternetReachable);
      });

      // 3. Kiểm tra GPS ngay
      await checkLocation();
      setIsChecking(false);

      // 4. Polling GPS
      startLocationPolling();
    }

    init();

    return () => {
      if (netUnsub) netUnsub();
      stopLocationPolling();
    };
  }, [checkLocation, startLocationPolling, stopLocationPolling]);

  // ─── Khi app về foreground → kiểm tra lại ngay ──────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        await checkLocation();
        const state = await NetInfo.fetch();
        setIsOnline(!!state.isConnected && !!state.isInternetReachable);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [checkLocation]);

  // ─── Hàm thử lại thủ công (nút Thử lại trên màn hình chặn) ─────────────────
  const retryCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
      await checkLocation();
    } finally {
      setIsChecking(false);
    }
  }, [checkLocation]);

  // Điều kiện đủ để vào app — chỉ cần mạng
  const allRequirementsMet = isOnline;
  // locationAvailable để các screen dùng disable tính năng GPS (không block app)
  const locationAvailable = locationEnabled && locationGranted;

  // Dừng polling khi đã có đủ điều kiện GPS, khởi động lại khi thiếu
  useEffect(() => {
    if (locationAvailable) {
      stopLocationPolling();
    } else if (!isChecking) {
      startLocationPolling();
    }
  }, [locationAvailable, isChecking, startLocationPolling, stopLocationPolling]);

  return (
    <RequirementsContext.Provider value={{
      isOnline,
      locationEnabled,
      locationGranted,
      locationAvailable,
      allRequirementsMet,
      isChecking,
      retryCheck,
    }}>
      {children}
    </RequirementsContext.Provider>
  );
}

export function useRequirements() {
  const ctx = useContext(RequirementsContext);
  if (!ctx) throw new Error('useRequirements phải dùng bên trong RequirementsProvider');
  return ctx;
}

export default RequirementsContext;
