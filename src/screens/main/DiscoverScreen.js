// src/screens/main/DiscoverScreen.js - Khám phá địa điểm nổi tiếng VN (4 tab)
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Linking, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';

// ===== DỮ LIỆU ĐỊA ĐIỂM =====

const FOOD_PLACES = [
  { id: 'f1', name: 'Bún bò Huế O Xuân', city: 'Huế', address: '22 Nguyễn Bỉnh Khiêm, Huế', rating: 4.8, price: '30-50k', emoji: '🍜', lat: 16.4637, lng: 107.5909, description: 'Bún bò Huế cay đậm đà, trứ danh nhất Cố Đô' },
  { id: 'f2', name: 'Phở Thìn Bờ Hồ', city: 'Hà Nội', address: '61 Đinh Tiên Hoàng, Hoàn Kiếm, HN', rating: 4.7, price: '50-80k', emoji: '🍲', lat: 21.0285, lng: 105.8542, description: 'Phở bò truyền thống Hà Nội từ 1955' },
  { id: 'f3', name: 'Bánh mì Phượng', city: 'Hội An', address: '2B Phan Châu Trinh, Hội An', rating: 4.9, price: '20-35k', emoji: '🥖', lat: 15.8801, lng: 108.3380, description: 'Bánh mì nổi tiếng thế giới, Anthony Bourdain đã ăn' },
  { id: 'f4', name: 'Cơm tấm Sài Gòn', city: 'TP.HCM', address: '15 Đặng Văn Ngữ, Phú Nhuận', rating: 4.6, price: '40-70k', emoji: '🍚', lat: 10.8231, lng: 106.6297, description: 'Cơm tấm sườn bì chả đặc trưng Sài Gòn' },
  { id: 'f5', name: 'Cao lầu Trung Hoa', city: 'Hội An', address: '26 Trần Phú, Hội An', rating: 4.7, price: '40-60k', emoji: '🍝', lat: 15.8787, lng: 108.3372, description: 'Đặc sản độc đáo chỉ có ở Hội An' },
  { id: 'f6', name: 'Cà phê Trứng Giảng', city: 'Hà Nội', address: '39 Nguyễn Hữu Huân, Hoàn Kiếm', rating: 4.8, price: '25-45k', emoji: '☕', lat: 21.0337, lng: 105.8481, description: 'Cà phê trứng kiểu Hà Nội, ngọt béo thơm' },
  { id: 'f7', name: 'Mì Quảng Ếch', city: 'Đà Nẵng', address: '4 Hoàng Diệu, Hải Châu, ĐN', rating: 4.5, price: '35-55k', emoji: '🍜', lat: 16.0544, lng: 108.2022, description: 'Mì Quảng truyền thống đậm đà xứ Quảng' },
  { id: 'f8', name: 'Chả cá Lã Vọng', city: 'Hà Nội', address: '14 Chả Cá, Hoàn Kiếm, HN', rating: 4.7, price: '150-200k', emoji: '🐟', lat: 21.0334, lng: 105.8489, description: 'Món chả cá trứ danh 150 năm tuổi' },
];

const RESORT_PLACES = [
  { id: 'r1', name: 'Vinpearl Resort & Spa Phú Quốc', city: 'Phú Quốc', address: 'Bãi Dài, Gành Dầu, Phú Quốc', rating: 4.8, price: '3-8 triệu/đêm', emoji: '🏖️', lat: 10.3579, lng: 103.9876, description: 'Resort sang trọng 5 sao bên biển xanh Phú Quốc' },
  { id: 'r2', name: 'Furama Resort Đà Nẵng', city: 'Đà Nẵng', address: '68 Hồ Xuân Hương, Mỹ An, ĐN', rating: 4.7, price: '2-5 triệu/đêm', emoji: '🌊', lat: 16.0471, lng: 108.2446, description: 'Resort ven biển Mỹ Khê danh tiếng quốc tế' },
  { id: 'r3', name: 'InterContinental Đà Nẵng', city: 'Đà Nẵng', address: 'Bán đảo Sơn Trà, Đà Nẵng', rating: 4.9, price: '5-15 triệu/đêm', emoji: '🏝️', lat: 16.1144, lng: 108.2757, description: 'Khách sạn đẹp nhất châu Á trên bán đảo Sơn Trà' },
  { id: 'r4', name: 'Amanoi Resort Ninh Thuận', city: 'Ninh Thuận', address: 'Vĩnh Hy, Ninh Hải, Ninh Thuận', rating: 4.9, price: '10-30 triệu/đêm', emoji: '🌅', lat: 11.6835, lng: 109.2177, description: 'Resort đẳng cấp thế giới nhìn ra vịnh Vĩnh Hy' },
  { id: 'r5', name: 'Six Senses Ninh Van Bay', city: 'Nha Trang', address: 'Vịnh Ninh Vân, Nha Trang', rating: 4.8, price: '8-20 triệu/đêm', emoji: '🐚', lat: 12.2388, lng: 109.2297, description: 'Biệt thự trên vịnh hoang sơ, chỉ đến bằng thuyền' },
  { id: 'r6', name: 'Anantara Hội An Resort', city: 'Hội An', address: '1 Phạm Hồng Thái, Hội An', rating: 4.7, price: '3-7 triệu/đêm', emoji: '🌺', lat: 15.8782, lng: 108.3292, description: 'Resort bên sông Thu Bồn lãng mạn' },
];

const HEALTH_PLACES = [
  { id: 'h1', name: 'QT International Hospital', city: 'Hà Nội', address: '1 Phương Mai, Đống Đa, HN', rating: 4.6, price: 'Theo dịch vụ', emoji: '🏥', lat: 21.0142, lng: 105.8426, description: 'Bệnh viện quốc tế hàng đầu Hà Nội' },
  { id: 'h2', name: 'Mandara Spa - Sofitel', city: 'Hà Nội', address: '15 Ngô Quyền, Hoàn Kiếm, HN', rating: 4.8, price: '500k-2 triệu', emoji: '💆', lat: 21.0245, lng: 105.8564, description: 'Spa cao cấp chuẩn quốc tế 5 sao' },
  { id: 'h3', name: 'California Fitness & Yoga', city: 'TP.HCM', address: '28 Phạm Ngọc Thạch, Q3, HCM', rating: 4.5, price: '500k-1.2 triệu/tháng', emoji: '🏋️', lat: 10.7829, lng: 106.6993, description: 'Chuỗi phòng gym & yoga hàng đầu Việt Nam' },
  { id: 'h4', name: 'Zen Spa & Massage Đà Lạt', city: 'Đà Lạt', address: '3 Hoàng Văn Thụ, Đà Lạt', rating: 4.7, price: '200-600k', emoji: '🧘', lat: 11.9403, lng: 108.4579, description: 'Spa thư giãn giữa cao nguyên mát mẻ Đà Lạt' },
  { id: 'h5', name: 'FV Hospital TP.HCM', city: 'TP.HCM', address: '6 Nguyễn Lương Bằng, Q7, HCM', rating: 4.7, price: 'Theo dịch vụ', emoji: '🏥', lat: 10.7307, lng: 106.7000, description: 'Bệnh viện Pháp Việt chuẩn quốc tế' },
  { id: 'h6', name: 'Yolo Yoga Studio', city: 'Hà Nội', address: '47 Xuân Diệu, Tây Hồ, HN', rating: 4.6, price: '200-400k/buổi', emoji: '🧘', lat: 21.0544, lng: 105.8282, description: 'Studio yoga view hồ Tây, giảng viên nước ngoài' },
];

const BEAUTY_PLACES = [
  { id: 'b1', name: 'Toni & Guy Hair Salon', city: 'Hà Nội', address: 'Tầng 2, Vincom Royal City, HN', rating: 4.7, price: '300k-1.5 triệu', emoji: '💇', lat: 20.9943, lng: 105.8200, description: 'Salon tóc quốc tế nổi tiếng thế giới' },
  { id: 'b2', name: 'Iris Nail & Beauty', city: 'TP.HCM', address: '45 Đinh Tiên Hoàng, Bình Thạnh', rating: 4.8, price: '150-500k', emoji: '💅', lat: 10.8000, lng: 106.7092, description: 'Nail art cao cấp, đội ngũ chuyên nghiệp' },
  { id: 'b3', name: 'Thu Cúc Clinics', city: 'Hà Nội', address: '216 Trần Duy Hưng, Cầu Giấy', rating: 4.6, price: 'Theo liệu trình', emoji: '✨', lat: 21.0077, lng: 105.7989, description: 'Thẩm mỹ viện uy tín hàng đầu miền Bắc' },
  { id: 'b4', name: 'Wax & Beauty Salon', city: 'Đà Nẵng', address: '18 Bạch Đằng, Hải Châu, ĐN', rating: 4.5, price: '100-350k', emoji: '💄', lat: 16.0678, lng: 108.2204, description: 'Làm đẹp toàn diện trung tâm Đà Nẵng' },
  { id: 'b5', name: 'Joli Beauty Clinic', city: 'TP.HCM', address: '186 Điện Biên Phủ, Bình Thạnh', rating: 4.7, price: 'Theo liệu trình', emoji: '🌟', lat: 10.7947, lng: 106.7174, description: 'Phòng khám thẩm mỹ công nghệ Hàn Quốc' },
  { id: 'b6', name: 'Color Me Salon', city: 'Hà Nội', address: '52 Hàng Gai, Hoàn Kiếm, HN', rating: 4.8, price: '300k-2 triệu', emoji: '🎨', lat: 21.0336, lng: 105.8472, description: 'Nhuộm & chăm sóc tóc cao cấp phố cổ HN' },
];

const TABS = [
  { key: 'food', emoji: '🍜', data: FOOD_PLACES },
  { key: 'resort', emoji: '🏖️', data: RESORT_PLACES },
  { key: 'health', emoji: '💆', data: HEALTH_PLACES },
  { key: 'beauty', emoji: '💄', data: BEAUTY_PLACES },
];

// Component 1 địa điểm
function PlaceCard({ place, theme, t }) {
  function openMaps() {
    const url = `https://maps.google.com/?q=${place.lat},${place.lng}`;
    Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể mở Google Maps'));
  }

  return (
    <View style={[cardStyles.card, { backgroundColor: theme.colors.card, ...theme.shadows.md }]}>
      <View style={cardStyles.cardHeader}>
        <Text style={cardStyles.cardEmoji}>{place.emoji}</Text>
        <View style={cardStyles.cardHeaderInfo}>
          <Text style={[cardStyles.cardName, { color: theme.colors.text }]} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={[cardStyles.cardCity, { color: theme.colors.primary }]}>{place.city}</Text>
        </View>
        <View style={[cardStyles.ratingBadge, { backgroundColor: theme.colors.warning + '30' }]}>
          <Text style={cardStyles.ratingText}>⭐ {place.rating}</Text>
        </View>
      </View>
      <Text style={[cardStyles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {place.description}
      </Text>
      <View style={cardStyles.cardFooter}>
        <View style={cardStyles.priceTag}>
          <Text style={cardStyles.priceEmoji}>💰</Text>
          <Text style={[cardStyles.priceText, { color: theme.colors.textSecondary }]}>{place.price}</Text>
        </View>
        <TouchableOpacity
          style={[cardStyles.mapsBtn, { backgroundColor: theme.colors.primary }]}
          onPress={openMaps}
        >
          <Text style={cardStyles.mapsBtnText}>🗺️ {t('discover.openMaps')}</Text>
        </TouchableOpacity>
      </View>
      <View style={cardStyles.addressRow}>
        <Text style={cardStyles.addressEmoji}>📍</Text>
        <Text style={[cardStyles.addressText, { color: theme.colors.textTertiary }]} numberOfLines={1}>
          {place.address}
        </Text>
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const { theme, t } = useApp();
  const [activeTab, setActiveTab] = useState('food');
  const currentData = TABS.find(tab => tab.key === activeTab)?.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={[headerStyles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[headerStyles.title, { color: theme.colors.text }]}>{t('discover.title')}</Text>
        <Text style={[headerStyles.subtitle, { color: theme.colors.textSecondary }]}>{t('discover.subtitle')}</Text>
      </View>

      {/* Tabs */}
      <View style={[tabStyles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[tabStyles.tabBtn, isActive && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2.5 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={tabStyles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[tabStyles.tabLabel, { color: isActive ? theme.colors.primary : theme.colors.textSecondary }, isActive && { fontWeight: '700' }]}>
                {t(`discover.tab${tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Danh sách địa điểm */}
      <FlatList
        data={currentData}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PlaceCard place={item} theme={theme} t={t} />}
      />
    </SafeAreaView>
  );
}

const headerStyles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  subtitle: { fontSize: 13 },
});

const tabStyles = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingBottom: 8 },
  tabEmoji: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 11, fontWeight: '500' },
});

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, marginBottom: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardEmoji: { fontSize: 28, marginRight: 10 },
  cardHeaderInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardCity: { fontSize: 12, fontWeight: '500' },
  ratingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  ratingText: { fontSize: 12, fontWeight: '600' },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceEmoji: { fontSize: 14 },
  priceText: { fontSize: 12 },
  mapsBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  mapsBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressEmoji: { fontSize: 12 },
  addressText: { fontSize: 11, flex: 1 },
});
