// src/screens/main/DiscoverScreen.js - Khám phá địa điểm nổi tiếng VN
const _moduleRev = 0x1B0; // 432
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Linking, Alert, ScrollView, TextInput, Modal, Pressable,
  Image, ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { fetchPlacePhoto, GOOGLE_PLACES_API_KEY } from '../../services/placesService';
import MapScreen from './MapScreen';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;

// ===== HELPER: bỏ dấu tiếng Việt để so khớp không phân biệt dấu =====
function removeAccents(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

// ===== ALIAS tỉnh thành: gõ tắt / tên thông dụng → tên chính xác =====
const CITY_ALIASES = {
  // Hà Nội
  'ha noi': ['ha noi', 'hn'], 'hn': ['ha noi'],
  'hanoi': ['ha noi'],
  // TP.HCM
  'sai gon': ['tp.hcm', 'tphcm', 'ho chi minh'],
  'saigon': ['tp.hcm', 'tphcm', 'ho chi minh'],
  'tphcm': ['tp.hcm', 'sai gon', 'ho chi minh'],
  'hcm': ['tp.hcm', 'sai gon', 'ho chi minh'],
  'ho chi minh': ['tp.hcm', 'sai gon'],
  // Đà Nẵng
  'da nang': ['da nang'], 'dn': ['da nang'],
  // Hội An
  'hoi an': ['hoi an'],
  // Huế
  'hue': ['hue'],
  // Nha Trang
  'nha trang': ['nha trang'], 'nt': ['nha trang'],
  // Đà Lạt
  'da lat': ['da lat'], 'dalat': ['da lat'],
  // Phú Quốc
  'phu quoc': ['phu quoc'], 'pq': ['phu quoc'],
  // Hải Phòng
  'hai phong': ['hai phong'], 'hp': ['hai phong'],
  // Cần Thơ
  'can tho': ['can tho'],
  // Vũng Tàu
  'vung tau': ['vung tau'], 'vt': ['vung tau'],
  // Quy Nhơn
  'quy nhon': ['quy nhon'],
  // Sapa
  'sapa': ['sapa'], 'sa pa': ['sapa'],
  // Hà Giang
  'ha giang': ['ha giang'],
  // Buôn Ma Thuột
  'buon ma thuot': ['buon ma thuot'], 'bmt': ['buon ma thuot'],
  // Ninh Thuận
  'ninh thuan': ['ninh thuan'],
  // Tiền Giang
  'tien giang': ['tien giang'], 'my tho': ['tien giang'],
  // Lào Cai
  'lao cai': ['lao cai'],
  // Lạng Sơn
  'lang son': ['lang son'],
  // Sơn La
  'son la': ['son la'],
  // An Giang
  'an giang': ['an giang'], 'chau doc': ['an giang'],
  // Lăng Cô
  'lang co': ['lang co'],
};

// ===== SYNONYM map: gõ từ liên quan → tìm theo loại =====
// Không cần dùng trực tiếp vì đã search trong description/specialty rồi

// ===== DỮ LIỆU ĂN UỐNG =====
const FOOD_PLACES = [
  { id: 'f1',  name: 'Phở Thìn Bờ Hồ',           city: 'Hà Nội',    address: '61 Đinh Tiên Hoàng, Hoàn Kiếm',       rating: 4.7, price: '50-80k',    emoji: '🍲', lat: 21.0285, lng: 105.8542, description: 'Phở bò truyền thống Hà Nội từ năm 1955, nước dùng trong veo ngọt xương' },
  { id: 'f2',  name: 'Bún chả Hương Liên',        city: 'Hà Nội',    address: '24 Lê Văn Hưu, Hai Bà Trưng',         rating: 4.8, price: '55-75k',    emoji: '🍢', lat: 21.0168, lng: 105.8490, description: 'Quán bún chả Obama - nơi Tổng thống Mỹ Obama đã dùng bữa cùng Anthony Bourdain 2016' },
  { id: 'f3',  name: 'Cà phê Trứng Giảng',        city: 'Hà Nội',    address: '39 Nguyễn Hữu Huân, Hoàn Kiếm',       rating: 4.8, price: '25-45k',    emoji: '☕', lat: 21.0337, lng: 105.8481, description: 'Cà phê trứng sáng tạo từ 1946, kem trứng béo ngậy tan trong miệng' },
  { id: 'f4',  name: 'Chả cá Lã Vọng',            city: 'Hà Nội',    address: '14 Chả Cá, Hoàn Kiếm',                rating: 4.7, price: '150-200k', emoji: '🐟', lat: 21.0334, lng: 105.8489, description: 'Chả cá chảo than hơn 150 năm tuổi, mắm tôm ăn cùng bún và rau thì là' },
  { id: 'f5',  name: 'Bánh cuốn Gia An',          city: 'Hà Nội',    address: '14 Hàng Gà, Hoàn Kiếm',               rating: 4.6, price: '35-55k',    emoji: '🫔', lat: 21.0356, lng: 105.8456, description: 'Bánh cuốn nóng tráng tay, nhân thịt mộc nhĩ, chấm nước mắm pha chua ngọt' },
  { id: 'f6',  name: 'Bún ốc Phủ Tây Hồ',         city: 'Hà Nội',    address: '1 Đặng Thai Mai, Tây Hồ',              rating: 4.7, price: '50-70k',    emoji: '🐚', lat: 21.0558, lng: 105.8232, description: 'Bún ốc chua cay đặc sản Hồ Tây, ốc mập giòn, nước dùng đậm vị cà chua me' },
  { id: 'f7',  name: 'Nem cua bể Hải Phòng',      city: 'Hải Phòng', address: '100 Minh Khai, Lê Chân',               rating: 4.7, price: '60-90k',    emoji: '🦀', lat: 20.8568, lng: 106.6839, description: 'Nem cua bể nhân cua biển tươi nguyên con, chiên giòn vàng ruộm đặc sản Hải Phòng' },
  { id: 'f8',  name: 'Bánh đa cua Hải Phòng',     city: 'Hải Phòng', address: '25 Lạch Tray, Ngô Quyền',              rating: 4.8, price: '40-60k',    emoji: '🦀', lat: 20.8605, lng: 106.6935, description: 'Bánh đa đỏ nước dùng cua biển đậm đà, rau muống luộc, chả cá thác lác thơm' },
  { id: 'f9',  name: 'Lợn quay Lạng Sơn',         city: 'Lạng Sơn',  address: 'Chợ Đông Kinh, Lạng Sơn',             rating: 4.8, price: '80-150k',   emoji: '🐷', lat: 21.8534, lng: 106.7597, description: 'Lợn quay mắc mật - đặc sản Lạng Sơn, da giòn tan, thịt thơm mùi lá mắc mật rừng' },
  { id: 'f10', name: 'Cháo ấu tẩu Hà Giang',      city: 'Hà Giang',  address: 'Thị trấn Đồng Văn',                   rating: 4.7, price: '30-50k',    emoji: '🍵', lat: 23.2750, lng: 105.3593, description: 'Cháo ấu tẩu trắng nõn nấu cùng chân giò, vừa ấm vừa bổ dưỡng vùng núi cao' },
  { id: 'f11', name: 'Thịt trâu gác bếp Sơn La',  city: 'Sơn La',    address: 'Chợ Sơn La, TP Sơn La',               rating: 4.6, price: '200-400k',  emoji: '🥩', lat: 21.3270, lng: 103.9144, description: 'Thịt trâu hun khói gác bếp khô mềm, chấm chẩm chéo hạt dổi - đặc sản núi rừng Tây Bắc' },
  { id: 'f12', name: 'Bún bò Huế O Xuân',          city: 'Huế',       address: '22 Nguyễn Bỉnh Khiêm, TP Huế',        rating: 4.8, price: '30-50k',    emoji: '🍜', lat: 16.4637, lng: 107.5909, description: 'Bún bò Huế cay đậm đà nổi tiếng nhất Cố Đô, chả cua giò heo thơm ngon' },
  { id: 'f13', name: 'Cơm hến Huế',                city: 'Huế',       address: '11A Trần Cao Vân, TP Huế',             rating: 4.7, price: '20-35k',    emoji: '🐚', lat: 16.4640, lng: 107.5950, description: 'Cơm hến đặc sản Huế - cơm nguội trộn hến xào, đậu phộng rang, bánh tráng nướng vụn' },
  { id: 'f14', name: 'Bánh mì Phượng',             city: 'Hội An',    address: '2B Phan Châu Trinh, Hội An',           rating: 4.9, price: '20-35k',    emoji: '🥖', lat: 15.8801, lng: 108.3380, description: 'Bánh mì Hội An nổi tiếng thế giới, vỏ giòn nhân đầy, Anthony Bourdain gọi là "thần thánh"' },
  { id: 'f15', name: 'Cao lầu Bà Lý',              city: 'Hội An',    address: '22 Thái Phiên, Hội An',                rating: 4.8, price: '40-60k',    emoji: '🍝', lat: 15.8787, lng: 108.3372, description: 'Cao lầu đặc sản độc nhất Hội An, mì gạo tro giếng Bá Lễ, thịt xá xíu, tép mỡ' },
  { id: 'f16', name: 'Mì Quảng Ếch 1A',            city: 'Đà Nẵng',   address: '1A Hải Phòng, Hải Châu',               rating: 4.6, price: '35-55k',    emoji: '🍜', lat: 16.0680, lng: 108.2200, description: 'Mì Quảng tôm thịt truyền thống, nước nhĩ ít, rau sống bánh tráng mè thơm giòn' },
  { id: 'f17', name: 'Bún mắm nêm Đà Nẵng',        city: 'Đà Nẵng',   address: '47 Bạch Đằng, Hải Châu',               rating: 4.6, price: '30-50k',    emoji: '🍜', lat: 16.0678, lng: 108.2204, description: 'Bún mắm nêm chấm đặc sệt thơm cay, thịt heo ba chỉ, chả cuốn rau sống Đà Nẵng' },
  { id: 'f18', name: 'Nem lụi Bà Nga Quy Nhơn',    city: 'Quy Nhơn',  address: '47 Xuân Diệu, TP Quy Nhơn',            rating: 4.7, price: '40-70k',    emoji: '🍡', lat: 13.7700, lng: 109.2200, description: 'Nem lụi nướng chả ram cuốn bánh tráng mỏng, chấm nước mắm me chua ngọt đặc trưng Bình Định' },
  { id: 'f19', name: 'Bánh căn Phan Rang',          city: 'Ninh Thuận',address: 'Chợ Phan Rang, TP Phan Rang',          rating: 4.7, price: '20-40k',    emoji: '🥚', lat: 11.5640, lng: 108.9880, description: 'Bánh căn khuôn đất nung đổ mực tôm trứng cút, chấm mắm nêm cay đặc sản Ninh Thuận' },
  { id: 'f20', name: 'Bún cá Nha Trang',            city: 'Nha Trang', address: '10 Phan Chu Trinh, Nha Trang',          rating: 4.7, price: '40-65k',    emoji: '🐠', lat: 12.2485, lng: 109.1930, description: 'Bún cá nước dùng trong ngọt từ xương cá, chả cá chiên vàng, rau muống cần tàu' },
  { id: 'f21', name: 'Bánh mì xíu mại Đà Lạt',     city: 'Đà Lạt',   address: '53 Phan Đình Phùng, Đà Lạt',           rating: 4.7, price: '25-45k',    emoji: '🥖', lat: 11.9416, lng: 108.4429, description: 'Bánh mì chấm xíu mại nóng hổi buổi sáng, đặc sản sương mù Đà Lạt từ hàng chục năm' },
  { id: 'f22', name: 'Lẩu bò Buôn Ma Thuột',        city: 'Buôn Ma Thuột',address:'120 Lê Duẩn, TP Buôn Ma Thuột',     rating: 4.6, price: '80-150k',   emoji: '🫕', lat: 12.6802, lng: 108.0500, description: 'Lẩu bò Tây Nguyên tảng lớn ăn với bún, rau rừng, giò bò sốt cà chua me đặc sắc' },
  { id: 'f23', name: 'Cơm tấm Thuận Kiều',          city: 'TP.HCM',   address: '1 Võ Văn Tần, Quận 3',                 rating: 4.7, price: '50-80k',    emoji: '🍚', lat: 10.7772, lng: 106.6907, description: 'Cơm tấm sườn nướng bì chả trứng hấp đặc trưng Sài Gòn, mỡ hành xanh thơm lừng' },
  { id: 'f24', name: 'Hủ tiếu Nam Vang Mỹ Tiên',    city: 'TP.HCM',   address: '288 An Dương Vương, Quận 5',            rating: 4.7, price: '50-80k',    emoji: '🍜', lat: 10.7536, lng: 106.6652, description: 'Hủ tiếu Nam Vang tô đầy xương, gan heo, tôm, thịt băm - đậm chất người Hoa Chợ Lớn' },
  { id: 'f25', name: 'Bánh mì Huỳnh Hoa',           city: 'TP.HCM',   address: '26 Lê Thị Riêng, Quận 1',              rating: 4.9, price: '30-50k',    emoji: '🥖', lat: 10.7872, lng: 106.6966, description: 'Bánh mì nhân chả lụa giò thủ pate bơ phủ đầy, nổi tiếng nhất Sài Gòn xếp hàng mỗi ngày' },
  { id: 'f26', name: 'Bún riêu cua Thanh Xuân',     city: 'TP.HCM',   address: '12 Đinh Tiên Hoàng, Bình Thạnh',       rating: 4.7, price: '45-70k',    emoji: '🦀', lat: 10.8034, lng: 106.7137, description: 'Bún riêu gạch cua đồng nguyên chất, đậu chiên giòn cà chua, mắm tôm pha chuẩn vị' },
  { id: 'f27', name: 'Lẩu mắm miền Tây Út Dzách',  city: 'Cần Thơ',  address: '73 Hai Bà Trưng, Ninh Kiều',           rating: 4.8, price: '80-150k',   emoji: '🫕', lat: 10.0341, lng: 105.7808, description: 'Lẩu mắm cá linh bông điên điển mùa nước nổi, rau đồng tươi ngon đặc sản miền Tây' },
  { id: 'f28', name: 'Bún quậy Phú Quốc Ông Già',  city: 'Phú Quốc', address: '97 Trần Hưng Đạo, Dương Đông',         rating: 4.7, price: '40-70k',    emoji: '🍲', lat: 10.2167, lng: 103.9667, description: 'Bún quậy độc lạ Phú Quốc chan nước lèo hải sản tươi, dùng đũa khuấy mới không bị dính' },
  { id: 'f29', name: 'Bánh khọt Vũng Tàu Ánh Hồng',city: 'Vũng Tàu', address: '14 Nguyễn Trường Tộ, TP Vũng Tàu',     rating: 4.7, price: '30-55k',    emoji: '🧇', lat: 10.3460, lng: 107.0843, description: 'Bánh khọt tôm dừa giòn tan nóng hổi, chấm nước mắm tỏi ớt chua ngọt chuẩn Vũng Tàu' },
  { id: 'f30', name: 'Hủ tiếu Mỹ Tho',             city: 'Tiền Giang',address: '11 Lê Lợi, TP Mỹ Tho',               rating: 4.7, price: '35-60k',    emoji: '🍜', lat: 10.3600, lng: 106.3600, description: 'Hủ tiếu Mỹ Tho sợi khô nước ngọt từ xương heo tôm khô, ăn khô hay nước đều tuyệt' },
];

// ===== DỮ LIỆU NGHỈ DƯỠNG =====
const RESORT_PLACES = [
  { id: 'r1',  name: 'Mường Thanh Luxury Hà Nội',  city: 'Hà Nội',    address: '14 Phan Đình Giót, Thanh Xuân',         rating: 4.6, price: '1.5-4tr/đêm',  emoji: '🏨', lat: 20.9973, lng: 105.8219, description: 'Khách sạn 5 sao chuỗi Mường Thanh lớn nhất Đông Nam Á, trung tâm Hà Nội' },
  { id: 'r2',  name: 'Sofitel Legend Metropole',   city: 'Hà Nội',    address: '15 Ngô Quyền, Hoàn Kiếm',              rating: 4.9, price: '5-20tr/đêm',   emoji: '🏛️', lat: 21.0245, lng: 105.8564, description: 'Khách sạn di sản 5 sao trăm năm tuổi giữa lòng Hà Nội, hồ Hoàn Kiếm 5 phút đi bộ' },
  { id: 'r3',  name: 'Sun World Hạ Long Park',     city: 'Hạ Long',   address: 'Bãi Cháy, TP Hạ Long',                 rating: 4.7, price: '2-6tr/đêm',    emoji: '🌊', lat: 20.9525, lng: 107.0471, description: 'Resort ven vịnh Hạ Long, cáp treo đến đỉnh Bà Đèo ngắm toàn cảnh kỳ quan thiên nhiên' },
  { id: 'r4',  name: 'Sapa Jade Hill Resort',      city: 'Sapa',      address: 'Đường Thác Bạc, TP Sapa',              rating: 4.7, price: '2-5tr/đêm',    emoji: '⛰️', lat: 22.3364, lng: 103.8438, description: 'Resort giữa ruộng bậc thang Sapa, phòng gỗ ấm cúng view núi Fansipan hùng vĩ' },
  { id: 'r5',  name: 'Ninh Bình Hidden Charm',     city: 'Ninh Bình', address: 'Ninh Hải, Hoa Lư, Ninh Bình',          rating: 4.8, price: '1.5-4tr/đêm',  emoji: '🛶', lat: 20.2506, lng: 105.9741, description: 'Boutique resort ẩn mình giữa rừng cây xanh Tràng An, bơi thuyền kayak ngay trước cửa phòng' },
  { id: 'r6',  name: 'Banyan Tree Lăng Cô',        city: 'Lăng Cô',   address: 'Lăng Cô, Phú Lộc, Thừa Thiên Huế',    rating: 4.9, price: '6-18tr/đêm',   emoji: '🏝️', lat: 16.2128, lng: 108.0767, description: 'Resort đẳng cấp thế giới bên đầm Lăng Cô, 5 sao biệt lập núi Hải Vân - biển xanh' },
  { id: 'r7',  name: 'Furama Resort Đà Nẵng',      city: 'Đà Nẵng',   address: '68 Hồ Xuân Hương, Mỹ An',              rating: 4.7, price: '2-5tr/đêm',    emoji: '🌊', lat: 16.0471, lng: 108.2446, description: 'Resort 5 sao ven biển Mỹ Khê danh tiếng quốc tế, bãi biển riêng dài 200m cát trắng' },
  { id: 'r8',  name: 'InterContinental Đà Nẵng',   city: 'Đà Nẵng',   address: 'Bán đảo Sơn Trà, Đà Nẵng',             rating: 4.9, price: '5-15tr/đêm',   emoji: '🦅', lat: 16.1144, lng: 108.2757, description: 'Từng bình chọn khách sạn đẹp nhất châu Á, nằm sườn núi Sơn Trà nhìn ra biển Đông' },
  { id: 'r9',  name: 'Nam Hải Hội An Four Seasons',city: 'Hội An',    address: 'Điện Dương, Điện Bàn, Quảng Nam',      rating: 4.9, price: '8-25tr/đêm',   emoji: '🌺', lat: 15.9196, lng: 108.3302, description: 'Four Seasons Resort biệt thự hồ bơi riêng bãi biển cách phố cổ 4km, dịch vụ hạng nhất' },
  { id: 'r10', name: 'Anantara Hội An Resort',     city: 'Hội An',    address: '1 Phạm Hồng Thái, Hội An',             rating: 4.7, price: '3-7tr/đêm',    emoji: '🌸', lat: 15.8782, lng: 108.3292, description: 'Resort lãng mạn bên sông Thu Bồn, đạp xe vào phố cổ 10 phút, kiến trúc Việt truyền thống' },
  { id: 'r11', name: 'Amanoi Ninh Thuận',          city: 'Ninh Thuận',address: 'Vĩnh Hy, Ninh Hải, Ninh Thuận',       rating: 4.9, price: '10-30tr/đêm',  emoji: '🌅', lat: 11.6835, lng: 109.2177, description: 'Resort siêu sang biệt lập giữa rừng quốc gia Núi Chúa, tầm nhìn vịnh Vĩnh Hy hoang sơ' },
  { id: 'r12', name: 'Six Senses Ninh Van Bay',    city: 'Nha Trang', address: 'Vịnh Ninh Vân, Nha Trang',             rating: 4.8, price: '8-20tr/đêm',   emoji: '🐚', lat: 12.2388, lng: 109.2297, description: 'Biệt thự bungalow trên vịnh biển hoang sơ chỉ đến bằng thuyền riêng 15 phút từ TP' },
  { id: 'r13', name: 'Dalat Palace Heritage Hotel',city: 'Đà Lạt',    address: '12 Trần Phú, TP Đà Lạt',              rating: 4.8, price: '3-8tr/đêm',    emoji: '🌷', lat: 11.9400, lng: 108.4380, description: 'Khách sạn cổ điển 5 sao từ 1922 thời Pháp thuộc, nhìn ra hồ Xuân Hương thơ mộng' },
  { id: 'r14', name: 'Park Hyatt Sài Gòn',         city: 'TP.HCM',    address: '2 Công Trường Lam Sơn, Quận 1',        rating: 4.8, price: '6-20tr/đêm',   emoji: '🏙️', lat: 10.7756, lng: 106.7025, description: 'Khách sạn 5 sao sang trọng ngay trung tâm Quận 1, đối diện Nhà hát Thành phố' },
  { id: 'r15', name: 'The Reverie Sài Gòn',        city: 'TP.HCM',    address: '22-36 Nguyễn Huệ, Quận 1',             rating: 4.9, price: '8-30tr/đêm',   emoji: '💎', lat: 10.7742, lng: 106.7031, description: 'Khách sạn 5 sao xa xỉ nhất Việt Nam, thiết kế nội thất pha lê dát vàng tráng lệ' },
  { id: 'r16', name: 'Vinpearl Resort Phú Quốc',   city: 'Phú Quốc',  address: 'Bãi Dài, Gành Dầu, Phú Quốc',         rating: 4.8, price: '3-8tr/đêm',    emoji: '🏖️', lat: 10.3579, lng: 103.9876, description: 'Quần thể resort 5 sao bao gồm vườn thú, công viên nước, casino - đảo ngọc Phú Quốc' },
  { id: 'r17', name: 'JW Marriott Phú Quốc',       city: 'Phú Quốc',  address: 'Khu Emerald Bay, Bãi Khem, Phú Quốc',  rating: 4.9, price: '5-15tr/đêm',   emoji: '🏝️', lat: 10.0100, lng: 104.0100, description: 'Resort chủ đề đại học giả tưởng độc đáo nhất Đông Nam Á, bãi biển Bãi Khem tuyệt đẹp' },
];

// ===== DỮ LIỆU SỨC KHOẺ =====
const HEALTH_PLACES = [
  { id: 'h1',  name: 'Vinmec Times City',          city: 'Hà Nội',    address: '458 Minh Khai, Hai Bà Trưng',           rating: 4.7, price: 'Theo dịch vụ',     emoji: '🏥', lat: 20.9961, lng: 105.8679, description: 'Bệnh viện quốc tế Vinmec chuẩn JCI Mỹ, trang thiết bị hiện đại bậc nhất Việt Nam' },
  { id: 'h2',  name: 'BV Bạch Mai',                city: 'Hà Nội',    address: '78 Giải Phóng, Đống Đa',                rating: 4.5, price: 'Theo dịch vụ',     emoji: '🏥', lat: 21.0053, lng: 105.8440, description: 'Bệnh viện tuyến Trung ương lớn nhất miền Bắc, chuyên sâu nhiều chuyên khoa khó' },
  { id: 'h3',  name: 'Mandara Spa Sofitel HN',      city: 'Hà Nội',    address: '15 Ngô Quyền, Hoàn Kiếm',               rating: 4.8, price: '500k-2tr',          emoji: '💆', lat: 21.0245, lng: 105.8564, description: 'Spa 5 sao chuẩn quốc tế trong khách sạn Sofitel Metropole, phục hồi toàn thân' },
  { id: 'h4',  name: 'Yolo Yoga Studio Hồ Tây',    city: 'Hà Nội',    address: '47 Xuân Diệu, Tây Hồ',                  rating: 4.6, price: '200-400k/buổi',    emoji: '🧘', lat: 21.0544, lng: 105.8282, description: 'Studio yoga view hồ Tây, giảng viên nước ngoài, lớp nhỏ tối đa 12 người' },
  { id: 'h5',  name: 'Sense Spa Hà Nội',           city: 'Hà Nội',    address: '25A Lý Thường Kiệt, Hoàn Kiếm',         rating: 4.7, price: '350k-1.2tr',        emoji: '💆', lat: 21.0261, lng: 105.8475, description: 'Spa massage trị liệu nổi tiếng Hà Nội, liệu trình đá nóng thảo dược truyền thống' },
  { id: 'h7',  name: 'BV Đà Nẵng',                 city: 'Đà Nẵng',   address: '124 Hải Phòng, Hải Châu',               rating: 4.5, price: 'Theo dịch vụ',     emoji: '🏥', lat: 16.0680, lng: 108.2194, description: 'Bệnh viện tuyến Trung ương vùng miền Trung, cấp cứu 24h chuyên khoa đầy đủ' },
  { id: 'h8',  name: 'Danang Riverside Spa',        city: 'Đà Nẵng',   address: '68 Hồ Xuân Hương, Ngũ Hành Sơn',       rating: 4.7, price: '400k-1.5tr',        emoji: '💆', lat: 16.0471, lng: 108.2446, description: 'Spa view sông Hàn, massage bấm huyệt đá núi Ngũ Hành Sơn trị liệu đặc biệt' },
  { id: 'h9',  name: 'Zen Spa Đà Lạt',             city: 'Đà Lạt',    address: '3 Hoàng Văn Thụ, TP Đà Lạt',           rating: 4.7, price: '200-600k',          emoji: '🧘', lat: 11.9403, lng: 108.4579, description: 'Spa thư giãn giữa cao nguyên mát lạnh, tinh dầu hoa Đà Lạt, âm nhạc tự nhiên' },
  { id: 'h10', name: 'Nha Trang Herbal Spa',        city: 'Nha Trang', address: '64 Trần Phú, Lộc Thọ, Nha Trang',      rating: 4.6, price: '250-800k',          emoji: '🌿', lat: 12.2441, lng: 109.1946, description: 'Spa thảo dược biển, tắm muối khoáng, massage bùn tảo biển đặc trị da sau nắng' },
  { id: 'h11', name: 'Vinmec Central Park HCM',     city: 'TP.HCM',    address: '208 Nguyễn Hữu Cảnh, Bình Thạnh',      rating: 4.7, price: 'Theo dịch vụ',     emoji: '🏥', lat: 10.7944, lng: 106.7213, description: 'Bệnh viện Vinmec 5 sao TP.HCM, phòng bệnh như khách sạn, toàn bộ bác sĩ đào tạo quốc tế' },
  { id: 'h12', name: 'FV Hospital TP.HCM',          city: 'TP.HCM',    address: '6 Nguyễn Lương Bằng, Quận 7',          rating: 4.7, price: 'Theo dịch vụ',     emoji: '🏥', lat: 10.7307, lng: 106.7000, description: 'Bệnh viện Pháp Việt 150 bác sĩ quốc tế, chuẩn JCI, đa khoa tổng hợp uy tín nhất HCM' },
  { id: 'h13', name: 'California Fitness Yoga HCM', city: 'TP.HCM',    address: '28 Phạm Ngọc Thạch, Quận 3',           rating: 4.5, price: '500k-1.2tr/tháng',  emoji: '🏋️', lat: 10.7829, lng: 106.6993, description: 'Chuỗi gym yoga lớn nhất VN, thiết bị nhập khẩu, PT chuyên nghiệp, hồ bơi trong nhà' },
  { id: 'h14', name: 'KAIA Spa Saigon',             city: 'TP.HCM',    address: '51 Hai Bà Trưng, Quận 1',               rating: 4.8, price: '500k-2tr',          emoji: '💆', lat: 10.7811, lng: 106.6997, description: 'Spa cao cấp trung tâm Quận 1, liệu trình massage Thái Việt Nhật, phòng VIP riêng biệt' },
  { id: 'h15', name: 'BV Chợ Rẫy',                 city: 'TP.HCM',    address: '201B Nguyễn Chí Thanh, Quận 5',         rating: 4.5, price: 'Theo dịch vụ',     emoji: '🏥', lat: 10.7527, lng: 106.6601, description: 'Bệnh viện lớn nhất miền Nam, chuyên khoa ghép tạng gan thận nổi tiếng toàn quốc' },
];

// ===== DỮ LIỆU LÀM ĐẸP =====
const BEAUTY_PLACES = [
  { id: 'b1',  name: 'Toni & Guy Hà Nội',          city: 'Hà Nội',    address: 'Tầng 2, Vincom Royal City, Thanh Xuân',  rating: 4.7, price: '300k-1.5tr',    emoji: '💇', lat: 20.9943, lng: 105.8200, description: 'Salon tóc quốc tế Anh Quốc tại Việt Nam, stylist được đào tạo London & Hồng Kông' },
  { id: 'b2',  name: 'Color Me Salon phố cổ',      city: 'Hà Nội',    address: '52 Hàng Gai, Hoàn Kiếm',                 rating: 4.8, price: '300k-2tr',      emoji: '🎨', lat: 21.0336, lng: 105.8472, description: 'Salon chuyên nhuộm tóc màu sáng tạo tại phố cổ HN, tư vấn màu miễn phí' },
  { id: 'b3',  name: 'Thu Cúc Clinics Hà Nội',     city: 'Hà Nội',    address: '216 Trần Duy Hưng, Cầu Giấy',            rating: 4.6, price: 'Theo liệu trình',emoji: '✨', lat: 21.0077, lng: 105.7989, description: 'Thẩm mỹ viện công nghệ cao uy tín miền Bắc, trẻ hóa da laser không xâm lấn' },
  { id: 'b4',  name: 'Jiin Nail & Spa Hà Nội',     city: 'Hà Nội',    address: '60 Láng Hạ, Đống Đa',                    rating: 4.7, price: '150-500k',      emoji: '💅', lat: 21.0181, lng: 105.8208, description: 'Tiệm nail cao cấp Hà Nội, nail art 3D, ombre tinh tế, phòng VIP riêng tư' },
  { id: 'b5',  name: 'Anh Tuấn Hair Salon',        city: 'Hà Nội',    address: '21B Điện Biên Phủ, Ba Đình',             rating: 4.8, price: '200k-800k',     emoji: '💇', lat: 21.0350, lng: 105.8363, description: 'Salon tóc hàng đầu Hà Nội 20 năm, stylist vô địch VN nhiều năm, đặt lịch trước 1 tuần' },
  { id: 'b6',  name: 'Wax & Beauty Đà Nẵng',       city: 'Đà Nẵng',   address: '18 Bạch Đằng, Hải Châu',                 rating: 4.5, price: '100-350k',      emoji: '💄', lat: 16.0678, lng: 108.2204, description: 'Làm đẹp toàn diện trung tâm Đà Nẵng, facial Hàn Quốc, wax toàn thân' },
  { id: 'b7',  name: 'White Gloves Hội An',        city: 'Hội An',    address: '8 Nguyễn Thái Học, Hội An',              rating: 4.7, price: '200k-700k',     emoji: '💅', lat: 15.8773, lng: 108.3263, description: 'Tiệm nail boutique đẹp phố cổ Hội An, thiết kế nail họa tiết dân tộc Việt độc đáo' },
  { id: 'b8',  name: 'Khanh Huong Spa Hội An',     city: 'Hội An',    address: '86 Bà Triệu, Hội An',                    rating: 4.8, price: '250k-900k',     emoji: '🌿', lat: 15.8793, lng: 108.3355, description: 'Spa trị liệu dầu thảo dược bản địa Quảng Nam, kết hợp massage Việt Thái truyền thống' },
  { id: 'b9',  name: 'Hue Beauty Center',          city: 'Huế',       address: '31 Lý Thường Kiệt, TP Huế',              rating: 4.6, price: 'Theo liệu trình',emoji: '🌸', lat: 16.4637, lng: 107.5909, description: 'Spa thẩm mỹ viện uy tín nhất Huế, công nghệ Hàn trẻ hóa da không dao kéo' },
  { id: 'b10', name: 'Lavender Beauty Đà Lạt',     city: 'Đà Lạt',    address: '8 Khu Hòa Bình, TP Đà Lạt',             rating: 4.7, price: '150-500k',      emoji: '💜', lat: 11.9415, lng: 108.4426, description: 'Spa hoa oải hương Đà Lạt tươi trồng trực tiếp, mặt nạ lavender tự làm tại chỗ' },
  { id: 'b11', name: 'Joli Beauty Clinic HCM',     city: 'TP.HCM',    address: '186 Điện Biên Phủ, Bình Thạnh',          rating: 4.7, price: 'Theo liệu trình',emoji: '🌟', lat: 10.7947, lng: 106.7174, description: 'Phòng khám thẩm mỹ công nghệ Hàn Quốc, nâng mũi sửa mắt không phẫu thuật' },
  { id: 'b12', name: 'Iris Nail & Beauty HCM',     city: 'TP.HCM',    address: '45 Đinh Tiên Hoàng, Bình Thạnh',         rating: 4.8, price: '150-500k',      emoji: '💅', lat: 10.8000, lng: 106.7092, description: 'Nail art phong cách Hàn Quốc, đội ngũ 20 kỹ thuật viên, hệ thống tiệt trùng chuẩn y tế' },
  { id: 'b13', name: 'Nhu Hoa Hair Salon Sài Gòn', city: 'TP.HCM',    address: '178 Nam Kỳ Khởi Nghĩa, Quận 3',          rating: 4.7, price: '250k-1.5tr',    emoji: '💇', lat: 10.7780, lng: 106.6919, description: 'Salon tóc Sài Gòn 15 năm kinh nghiệm, chuyên nhuộm highlight balayage chuẩn châu Âu' },
  { id: 'b14', name: 'Ohui Spa Quận 1',            city: 'TP.HCM',    address: '39 Ngô Đức Kế, Quận 1',                  rating: 4.8, price: '400k-1.8tr',    emoji: '✨', lat: 10.7748, lng: 106.7013, description: 'Spa Hàn Quốc cao cấp trung tâm Sài Gòn, chăm sóc da mặt bằng mỹ phẩm OHUI nhập Hàn' },
  { id: 'b15', name: 'Queen Nail Phú Quốc',        city: 'Phú Quốc',  address: '58 Trần Hưng Đạo, Dương Đông, Phú Quốc', rating: 4.6, price: '150-450k',      emoji: '💅', lat: 10.2200, lng: 103.9630, description: 'Tiệm nail đảo ngọc Phú Quốc, gel nail acrylic, phong cách nhiệt đới mùa hè' },
];

// ===== DỮ LIỆU MUA SẮM =====
const SHOPPING_PLACES = [
  { id: 's1',  name: 'Chợ Đồng Xuân',              city: 'Hà Nội',    address: 'Đồng Xuân, Hoàn Kiếm',                  rating: 4.5, price: 'Đa dạng',        emoji: '🏪', region:'Bắc', specialty:'Thủ công mỹ nghệ, vải lụa', lat: 21.0378, lng: 105.8494, description: 'Chợ truyền thống lớn nhất HN, vải vóc thủ công mỹ nghệ quà lưu niệm giá sỉ lẻ' },
  { id: 's2',  name: 'Vincom Bà Triệu',             city: 'Hà Nội',    address: '191 Bà Triệu, Hai Bà Trưng',             rating: 4.6, price: '200k-vài tr',    emoji: '🏬', region:'Bắc', specialty:'Thời trang quốc tế, F&B', lat: 21.0132, lng: 105.8487, description: 'TTTM hàng đầu HN, thời trang H&M Zara, ẩm thực, rạp CGV lớn nhất Bắc bộ' },
  { id: 's3',  name: 'Phố Hàng Gai - Lụa tơ tằm', city: 'Hà Nội',    address: 'Hàng Gai, Hoàn Kiếm',                    rating: 4.7, price: '200k-2tr',       emoji: '🧵', region:'Bắc', specialty:'Lụa tơ tằm, áo dài', lat: 21.0336, lng: 105.8472, description: 'Phố chuyên lụa tơ tằm, áo dài thêu tay, tranh thư pháp đặc sản Hà Nội' },
  { id: 's4',  name: 'Aeon Mall Hà Đông',           city: 'Hà Nội',    address: 'Dương Nội, Hà Đông',                     rating: 4.5, price: '100k-vài tr',    emoji: '🛍️', region:'Bắc', specialty:'Hàng Nhật, thực phẩm sạch', lat: 20.9790, lng: 105.7598, description: 'TTTM Nhật Bản lớn nhất miền Bắc, siêu thị thực phẩm sạch, hàng gia dụng Nhật' },
  { id: 's5',  name: 'Chợ Bắc Hà phiên vùng cao',  city: 'Lào Cai',   address: 'Thị trấn Bắc Hà, Bắc Hà',               rating: 4.8, price: '50k-300k',       emoji: '🌄', region:'Bắc', specialty:"Thổ cẩm H'Mông, mận Tam Hoa", lat: 22.5297, lng: 104.2879, description: "Chợ phiên Chủ nhật lớn nhất Tây Bắc, thổ cẩm H'Mông sặc sỡ, mận Tam Hoa" },
  { id: 's6',  name: 'Phố cổ Đồng Văn Hà Giang',   city: 'Hà Giang',  address: 'Thị trấn Đồng Văn',                      rating: 4.6, price: '50k-500k',       emoji: '🏮', region:'Bắc', specialty:"Thổ cẩm, đồ bạc H'Mông", lat: 23.2750, lng: 105.3593, description: "Phố cổ đá trên cao nguyên đá, thổ cẩm dân tộc, đồng bạc H'Mông, rượu ngô hoa" },
  { id: 's7',  name: 'Chợ Đồng Xuân Hải Phòng',    city: 'Hải Phòng', address: 'Lê Lợi, Hồng Bàng',                     rating: 4.4, price: 'Đa dạng',        emoji: '🦞', region:'Bắc', specialty:'Hải sản tươi, nem cua bể', lat: 20.8643, lng: 106.6784, description: 'Chợ lớn nhất Hải Phòng, hải sản cua ghẹ tôm biển tươi, bánh đa cua nem cua bể' },
  { id: 's8',  name: 'Chợ Hàn Đà Nẵng',            city: 'Đà Nẵng',   address: '119 Trần Phú, Hải Châu',                 rating: 4.5, price: '20k-500k',       emoji: '🐟', region:'Trung', specialty:'Hải sản khô, mắm, nước mắm', lat: 16.0678, lng: 108.2204, description: 'Chợ biểu tượng ĐN, hải sản khô tươi, mắm nêm Nam Ô, đặc sản miền Trung giá tốt' },
  { id: 's9',  name: 'Vincom Đà Nẵng',              city: 'Đà Nẵng',   address: '910A Ngô Quyền, Sơn Trà',                rating: 4.5, price: '100k-vài tr',    emoji: '🏬', region:'Trung', specialty:'Thời trang, siêu thị, giải trí', lat: 16.0605, lng: 108.2389, description: 'TTTM hiện đại ĐN, thời trang quốc tế, siêu thị Big C, rạp CGV vui chơi giải trí' },
  { id: 's10', name: 'Phố đèn lồng Hội An',        city: 'Hội An',    address: 'Phố cổ Hội An, Quảng Nam',               rating: 4.9, price: '50k-1tr',        emoji: '🏮', region:'Trung', specialty:'Đèn lồng, áo dài, gốm', lat: 15.8787, lng: 108.3372, description: 'Phố nghề đèn lồng thêu tay, may áo dài 1 ngày, gốm Thanh Hà, tranh lụa truyền thống' },
  { id: 's11', name: 'Chợ Đông Ba Huế',             city: 'Huế',       address: '1 Trần Hưng Đạo, Phú Hòa',              rating: 4.5, price: '20k-500k',       emoji: '👘', region:'Trung', specialty:'Nón lá, áo dài Huế, mè xửng', lat: 16.4722, lng: 107.5819, description: 'Chợ trung tâm Cố Đô, nón lá bài thơ, áo dài Huế, mè xửng mứt gừng sen Tịnh Tâm' },
  { id: 's12', name: 'Chợ Đầm Nha Trang',           city: 'Nha Trang', address: 'Trần Phú, Lộc Thọ',                     rating: 4.3, price: '20k-500k',       emoji: '🦑', region:'Trung', specialty:'Yến sào, mực khô, hải sản', lat: 12.2438, lng: 109.1938, description: 'Chợ trung tâm NT, hải sản tươi sống, mực khô bạch tuộc tôm sú, yến sào Khánh Hòa' },
  { id: 's13', name: 'Chợ đêm Đà Lạt',              city: 'Đà Lạt',    address: 'Nguyễn Thị Minh Khai, TP Đà Lạt',       rating: 4.7, price: '30k-300k',       emoji: '🌺', region:'Trung', specialty:'Hoa tươi, atisô, rượu vang', lat: 11.9415, lng: 108.4426, description: 'Chợ đêm lãng mạn Đà Lạt, hoa tươi atisô dâu tây, rượu vang Đà Lạt, len dạ thủ công' },
  { id: 's14', name: 'Chợ Bến Thành',               city: 'TP.HCM',    address: 'Lê Lợi, Bến Thành, Quận 1',             rating: 4.4, price: '50k-2tr',        emoji: '🛒', region:'Nam', specialty:'Quà lưu niệm, đặc sản Nam Bộ', lat: 10.7724, lng: 106.6980, description: 'Biểu tượng 100 năm Sài Gòn, thực phẩm đặc sản Nam Bộ, quà lưu niệm, thời trang thủ công' },
  { id: 's15', name: 'Vincom Đồng Khởi',            city: 'TP.HCM',    address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1',    rating: 4.7, price: '300k-chục tr',   emoji: '💎', region:'Nam', specialty:'Thời trang luxury, đồ hiệu', lat: 10.7751, lng: 106.7010, description: 'TTTM luxury Quận 1 Sài Gòn, hàng hiệu quốc tế, ẩm thực cao cấp, view đường Nguyễn Huệ' },
  { id: 's16', name: 'Aeon Mall Tân Phú HCM',       city: 'TP.HCM',    address: '30 Bờ Bao Tân Thắng, Tân Phú',          rating: 4.5, price: '50k-vài tr',     emoji: '🏬', region:'Nam', specialty:'Hàng Nhật, thực phẩm, ẩm thực', lat: 10.7958, lng: 106.6260, description: 'TTTM Nhật Bản quy mô lớn Sài Gòn, siêu thị Nhật, khu ẩm thực đa quốc gia 3 tầng' },
  { id: 's17', name: 'Chợ Bình Tây Chợ Lớn',        city: 'TP.HCM',    address: '57A Tháp Mười, Phường 2, Quận 6',       rating: 4.4, price: 'Đa dạng',        emoji: '🧧', region:'Nam', specialty:'Gia vị Hoa, thực phẩm khô', lat: 10.7501, lng: 106.6493, description: 'Chợ đầu mối người Hoa Chợ Lớn 100 năm, thực phẩm khô gia vị Hoa, hàng sỉ giá tốt' },
  { id: 's18', name: 'Chợ nổi Cái Răng Cần Thơ',    city: 'Cần Thơ',   address: 'Quận Cái Răng, TP Cần Thơ',             rating: 4.8, price: '20k-200k',       emoji: '🚤', region:'Nam', specialty:'Trái cây nhiệt đới, đặc sản', lat: 10.0167, lng: 105.7833, description: 'Chợ nổi trên sông lớn nhất ĐBSCL, trái cây nhiệt đới tươi, đặc sản miền Tây sáng sớm' },
  { id: 's19', name: 'Chợ thổ cẩm Châu Đốc',        city: 'An Giang',  address: 'Châu Đốc, An Giang',                    rating: 4.5, price: '50k-500k',       emoji: '🧶', region:'Nam', specialty:'Thổ cẩm Khmer, mắm Châu Đốc', lat: 10.7040, lng: 105.1200, description: 'Chợ biên giới đặc sản thổ cẩm Khmer, khô cá tra hú, mắm Bà Giáo Khỏe nổi tiếng' },
  { id: 's20', name: 'Chợ đêm Phú Quốc',            city: 'Phú Quốc',  address: 'Chợ đêm Dương Đông, Phú Quốc',          rating: 4.6, price: '50k-500k',       emoji: '🏝️', region:'Nam', specialty:'Nước mắm, hồ tiêu, ngọc trai', lat: 10.2167, lng: 103.9667, description: 'Chợ đêm đảo ngọc Phú Quốc, nước mắm nguyên chất, hồ tiêu đỏ, ngọc trai biển Đông' },
];

const TABS = [
  { key: 'food',     emoji: '🍜', labelKey: 'food',     data: FOOD_PLACES     },
  { key: 'resort',   emoji: '🏖️', labelKey: 'resort',   data: RESORT_PLACES   },
  { key: 'health',   emoji: '💆', labelKey: 'health',   data: HEALTH_PLACES   },
  { key: 'beauty',   emoji: '💄', labelKey: 'beauty',   data: BEAUTY_PLACES   },
  { key: 'shopping', emoji: '🛍️', labelKey: 'shopping', data: SHOPPING_PLACES },
];

function getCitiesForTab(tabKey) {
  const data = TABS.find(t => t.key === tabKey)?.data || [];
  return [...new Set(data.map(p => p.city))].sort((a, b) => a.localeCompare(b, 'vi'));
}

// ===== SKELETON LOADING ANIMATION =====
function SkeletonBox({ width: w, height, borderRadius = 8, style }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View
      style={[
        { height, borderRadius, backgroundColor: '#D0DFEF', opacity: anim },
        // w có thể là number hoặc '100%' — đều ok với style thông thường
        w === '100%' ? { alignSelf: 'stretch' } : { width: w },
        style,
      ]}
    />
  );
}

// ===== ẢNH ĐỊA ĐIỂM - HERO STYLE =====
function PlaceHeroImage({ place, height = 210 }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const fetched = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Dùng place.id làm dependency thay vì object để tránh re-trigger
  const placeId = place?.id;

  useEffect(() => {
    if (!placeId || fetched.current) return;
    fetched.current = true;

    fetchPlacePhoto(place)
      .then(url => {
        setPhotoUrl(url || null);
        setLoading(false);
        if (url) {
          Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  if (loading) {
    return (
      <View style={{ width: '100%', height, borderRadius: 16, overflow: 'hidden' }}>
        <SkeletonBox width="100%" height={height} borderRadius={0} />
      </View>
    );
  }

  // Lỗi fetch hoặc url null/rỗng → fallback placeholder
  if (error || !photoUrl) {
    return (
      <View style={[heroImgStyles.fallback, { height }]}>
        <Text style={heroImgStyles.fallbackEmoji}>{place.emoji}</Text>
        <Text style={heroImgStyles.fallbackName} numberOfLines={1}>{place.name}</Text>
      </View>
    );
  }

  return (
    <View style={{ width: '100%', height, borderRadius: 16, overflow: 'hidden' }}>
      <Animated.Image
        source={{ uri: photoUrl }}
        style={{ width: '100%', height, opacity: fadeAnim }}
        resizeMode="cover"
        onError={() => { setError(true); setPhotoUrl(null); }}
      />
      {/* Overlay mờ phía dưới */}
      <View style={heroImgStyles.gradient}>
        <View style={heroImgStyles.gradientContent}>
          <View style={heroImgStyles.ratingPill}>
            <Text style={heroImgStyles.ratingText}>⭐ {place.rating}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const heroImgStyles = StyleSheet.create({
  fallback: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#E8F1FD',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fallbackEmoji: { fontSize: 52 },
  fallbackName: { fontSize: 13, fontWeight: '600', color: '#4A5C7A', paddingHorizontal: 16, textAlign: 'center' },
  gradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: '55%',
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    justifyContent: 'flex-end', paddingHorizontal: 12, paddingBottom: 10,
  },
  gradientContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  ratingText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sourcePill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  sourceText: { color: '#fff', fontSize: 10, fontWeight: '600' },
});

// ===== CARD ĐỊA ĐIỂM - THIẾT KẾ MỚI ĐẸP =====
function PlaceCard({ place, theme, t, activeTab }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function openMaps() {
    const url = `https://maps.google.com/?q=${place.lat},${place.lng}`;
    Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể mở Google Maps'));
  }

  function handlePressIn() {
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 40 }).start();
  }
  function handlePressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  }

  const regionColor = place.region === 'Bắc' ? '#E53935'
    : place.region === 'Trung' ? '#FB8C00' : '#1E88E5';

  return (
    <Animated.View style={[
      cardStyles.card,
      { backgroundColor: theme.colors.card, transform: [{ scale: scaleAnim }] },
      theme.shadows.lg,
    ]}>
      {/* ─── ẢNH HERO ─── */}
      <PlaceHeroImage place={place} height={210} />

      {/* ─── NỘI DUNG ─── */}
      <View style={cardStyles.body}>
        {/* Tên + thành phố */}
        <View style={cardStyles.titleRow}>
          <Text style={cardStyles.emojiIcon}>{place.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[cardStyles.name, { color: theme.colors.text }]} numberOfLines={1}>
              {place.name}
            </Text>
            <View style={cardStyles.metaRow}>
              <View style={[cardStyles.cityBadge, { backgroundColor: theme.colors.primarySoft }]}>
                <Text style={[cardStyles.cityText, { color: theme.colors.primary }]}>📍 {place.city}</Text>
              </View>
              {activeTab === 'shopping' && place.region ? (
                <View style={[cardStyles.regionBadge, { backgroundColor: regionColor + '20', borderColor: regionColor + '50' }]}>
                  <Text style={[cardStyles.regionText, { color: regionColor }]}>
                    {place.region === 'Bắc' ? '🔴 Miền Bắc' : place.region === 'Trung' ? '🟠 Miền Trung' : '🔵 Miền Nam'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Mô tả */}
        <Text style={[cardStyles.desc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {place.description}
        </Text>

        {/* Specialty cho shopping */}
        {activeTab === 'shopping' && place.specialty ? (
          <View style={[cardStyles.specialtyRow, { backgroundColor: theme.colors.primary + '10' }]}>
            <Text style={[cardStyles.specialtyText, { color: theme.colors.primary }]}>
              🏷️ {place.specialty}
            </Text>
          </View>
        ) : null}

        {/* Footer: giá + nút maps */}
        <View style={cardStyles.footer}>
          <View style={[cardStyles.priceBox, { backgroundColor: theme.colors.warning + '18' }]}>
            <Text style={[cardStyles.priceText, { color: theme.colors.warning || '#F59E0B' }]}>
              💰 {place.price}
            </Text>
          </View>
          <TouchableOpacity
            style={[cardStyles.mapsBtn, { backgroundColor: theme.colors.primary }]}
            onPress={openMaps}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.85}
          >
            <Text style={cardStyles.mapsBtnText}>🗺️ {t ? t('discover.openMaps') : 'Google Maps'}</Text>
          </TouchableOpacity>
        </View>

        {/* Địa chỉ */}
        <View style={cardStyles.addressRow}>
          <Text style={[cardStyles.addressText, { color: theme.colors.textTertiary }]} numberOfLines={1}>
            📍 {place.address}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 0,
  },
  body: { padding: 14, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emojiIcon: { fontSize: 26, marginTop: 2 },
  name: { fontSize: 15, fontWeight: '800', lineHeight: 20, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  cityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  cityText: { fontSize: 11, fontWeight: '700' },
  regionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  regionText: { fontSize: 10, fontWeight: '700' },
  desc: { fontSize: 13, lineHeight: 18 },
  specialtyRow: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  specialtyText: { fontSize: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  priceBox: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  priceText: { fontSize: 12, fontWeight: '700' },
  mapsBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  mapsBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  addressText: { fontSize: 11, flex: 1 },
});

// ===== DROPDOWN CHỌN TỈNH =====
function CityDropdown({ cities, selectedCity, onSelect, theme, t }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[dropdownStyles.trigger, {
          backgroundColor: theme.colors.surface,
          borderColor: selectedCity ? theme.colors.primary : theme.colors.inputBorder,
        }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={dropdownStyles.triggerEmoji}>📍</Text>
        <Text
          style={[dropdownStyles.triggerText, {
            color: selectedCity ? theme.colors.primary : theme.colors.placeholder,
            fontWeight: selectedCity ? '700' : '400',
            flex: 1,
          }]}
          numberOfLines={1}
        >
          {selectedCity || (t ? t('discover.allCities') : 'Tất cả')}
        </Text>
        <Text style={[dropdownStyles.chevron, { color: theme.colors.textTertiary }]}>
          {visible ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={dropdownStyles.backdrop} onPress={() => setVisible(false)}>
          <View style={[dropdownStyles.menu, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            ...theme.shadows.xl,
          }]}>
            <Text style={[dropdownStyles.menuTitle, { color: theme.colors.text, borderBottomColor: theme.colors.border }]}>
              {t ? t('discover.selectCity') : 'Chọn tỉnh/thành'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              <TouchableOpacity
                style={[dropdownStyles.menuItem, !selectedCity && { backgroundColor: theme.colors.primarySoft }]}
                onPress={() => { onSelect(null); setVisible(false); }}
              >
                <Text style={dropdownStyles.menuItemEmoji}>🗺️</Text>
                <Text style={[dropdownStyles.menuItemText, { color: !selectedCity ? theme.colors.primary : theme.colors.text, fontWeight: !selectedCity ? '700' : '400', flex: 1 }]}>
                  {t ? t('discover.allCities') : 'Tất cả tỉnh/thành'}
                </Text>
                {!selectedCity && <Text style={{ color: theme.colors.primary, fontSize: 14 }}>✓</Text>}
              </TouchableOpacity>
              {cities.map(city => (
                <TouchableOpacity
                  key={city}
                  style={[dropdownStyles.menuItem, selectedCity === city && { backgroundColor: theme.colors.primarySoft }]}
                  onPress={() => { onSelect(city); setVisible(false); }}
                >
                  <Text style={dropdownStyles.menuItemEmoji}>📍</Text>
                  <Text style={[dropdownStyles.menuItemText, { color: selectedCity === city ? theme.colors.primary : theme.colors.text, fontWeight: selectedCity === city ? '700' : '400', flex: 1 }]}>
                    {city}
                  </Text>
                  {selectedCity === city && <Text style={{ color: theme.colors.primary, fontSize: 14 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const dropdownStyles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 8, height: 44, minWidth: 110, maxWidth: 130, gap: 4 },
  triggerEmoji: { fontSize: 13 },
  triggerText: { fontSize: 12 },
  chevron: { fontSize: 9 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  menu: { width: '100%', borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  menuTitle: { fontSize: 14, fontWeight: '800', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  menuItemEmoji: { fontSize: 15 },
  menuItemText: { fontSize: 13 },
});

// ===== HEADER ĐẸP VỚI GRADIENT =====
function DiscoverHeader({ theme, t, totalCount, activeTab }) {
  const TAB_INFO = {
    food:     { title: 'Ẩm Thực', subtitle: 'Hương vị 3 miền Việt Nam', bg: ['#FF6B35','#F7931E'] },
    resort:   { title: 'Nghỉ Dưỡng', subtitle: 'Resort & khách sạn hạng sang', bg: ['#1A6FD4','#0EA5C9'] },
    health:   { title: 'Sức Khoẻ', subtitle: 'Spa, wellness & y tế', bg: ['#10B981','#059669'] },
    beauty:   { title: 'Làm Đẹp', subtitle: 'Salon, nail & thẩm mỹ viện', bg: ['#EC4899','#DB2777'] },
    shopping: { title: 'Mua Sắm', subtitle: 'Chợ, TTTM & đặc sản', bg: ['#8B5CF6','#6D28D9'] },
  };
  const info = TAB_INFO[activeTab] || TAB_INFO.food;
  return (
      <View
        style={[headerStyles.gradient, { backgroundColor: info.bg[0] }]}
      >
        <View style={headerStyles.row}>
          <View>
            <Text style={headerStyles.title}>{info.title}</Text>
            <Text style={headerStyles.subtitle}>{info.subtitle}</Text>
          </View>
          <View style={headerStyles.countBadge}>
            <Text style={headerStyles.countText}>{totalCount}</Text>
            <Text style={headerStyles.countLabel}>địa điểm</Text>
          </View>
        </View>
      </View>
  );
}

const headerStyles = StyleSheet.create({
  gradient: { paddingHorizontal: 18, paddingVertical: 16, paddingTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  countText: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 22 },
  countLabel: { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
});

// ===== REGION HEADER cho Shopping =====
function RegionHeader({ label, count, theme }) {
  return (
    <View style={[regionHeaderStyles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[regionHeaderStyles.label, { color: theme.colors.text }]}>{label}</Text>
      <View style={[regionHeaderStyles.countBadge, { backgroundColor: theme.colors.primary + '18' }]}>
        <Text style={[regionHeaderStyles.count, { color: theme.colors.primary }]}>{count} điểm</Text>
      </View>
    </View>
  );
}
const regionHeaderStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  label: { fontSize: 14, fontWeight: '800' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  count: { fontSize: 12, fontWeight: '700' },
});

// ===== DISCOVER CONTENT (nội dung khám phá địa điểm) =====
function DiscoverContent({ embedded = false }) {
  const { theme, t } = useApp();
  const [activeTab, setActiveTab]     = useState('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  const TAB_COLORS = {
    food: '#FF6B35', resort: '#7C5CBF', health: '#26C485', beauty: '#F06292', shopping: '#FF8A65',
  };

  function handleTabChange(tabKey) {
    setActiveTab(tabKey);
    setSelectedCity(null);
    setSearchQuery('');
  }

  const cities     = useMemo(() => getCitiesForTab(activeTab), [activeTab]);
  const rawData    = TABS.find(tab => tab.key === activeTab)?.data || [];
  const activeColor = TAB_COLORS[activeTab] || theme.colors.primary;

  const filteredData = useMemo(() => {
    let data = rawData;
    if (selectedCity) data = data.filter(p => p.city === selectedCity);
    if (!searchQuery.trim()) return data;

    const q = searchQuery.trim().toLowerCase();
    const qNorm = removeAccents(q);

    data = data.filter(p => {
      // --- Gộp tất cả text để search ---
      const fields = [
        p.name, p.city, p.description, p.price,
        p.specialty, p.address, p.emoji,
        // Mảng tags nếu có
        ...(Array.isArray(p.tags) ? p.tags : []),
      ].filter(Boolean).map(s => String(s).toLowerCase());

      const fieldsNorm = fields.map(s => removeAccents(s));

      // 1. So khớp trực tiếp (có dấu)
      if (fields.some(f => f.includes(q))) return true;

      // 2. So khớp không dấu
      if (fieldsNorm.some(f => f.includes(qNorm))) return true;

      // 3. Alias tỉnh thành / từ đồng nghĩa
      const aliases = CITY_ALIASES[qNorm] || CITY_ALIASES[q];
      if (aliases) {
        const cityNorm = removeAccents((p.city || '').toLowerCase());
        if (aliases.some(a => cityNorm.includes(a) || a.includes(cityNorm))) return true;
      }

      // 4. Tìm từng từ trong query (multi-word)
      const words = qNorm.split(/\s+/).filter(w => w.length >= 2);
      if (words.length > 1) {
        const allText = fieldsNorm.join(' ');
        if (words.every(w => allText.includes(w))) return true;
      }

      return false;
    });

    return data;
  }, [rawData, selectedCity, searchQuery]);

  // Shopping grouped by region
  const groupedShoppingData = useMemo(() => {
    if (activeTab !== 'shopping') return null;
    if (selectedCity || searchQuery.trim()) return null;
    const regions = ['Bắc', 'Trung', 'Nam'];
    const labels = { Bắc: '🔴 Miền Bắc', Trung: '🟠 Miền Trung', Nam: '🔵 Miền Nam' };
    const result = [];
    regions.forEach(region => {
      const items = SHOPPING_PLACES.filter(p => p.region === region);
      if (items.length) {
        result.push({ type: 'header', region, label: labels[region], id: `header_${region}` });
        items.forEach(item => result.push({ type: 'item', ...item }));
      }
    });
    return result;
  }, [activeTab, selectedCity, searchQuery]);

  const hasFilter = !!selectedCity || !!searchQuery.trim();
  const listData  = groupedShoppingData || filteredData;

  const renderItem = useCallback(({ item }) => {
    if (item.type === 'header') {
      const count = SHOPPING_PLACES.filter(p => p.region === item.region).length;
      return <RegionHeader label={item.label} count={count} theme={theme} />;
    }
    return <PlaceCard place={item} theme={theme} t={t} activeTab={activeTab} />;
  }, [theme, t, activeTab]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>

      {/* ─── GRADIENT HEADER - ẩn khi embedded vì MapDiscoverScreen có header riêng ─── */}
      {!embedded && (
        <DiscoverHeader theme={theme} t={t} totalCount={rawData.length} activeTab={activeTab} />
      )}

      {/* ─── TAB BAR ─── */}
      <View style={[tabStyles.bar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={tabStyles.content}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const tabColor = TAB_COLORS[tab.key];
            return (
              <TouchableOpacity
                key={tab.key}
                style={[tabStyles.btn, isActive && { borderBottomColor: tabColor, borderBottomWidth: 3 }]}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[tabStyles.emoji, isActive && { fontSize: 20 }]}>{tab.emoji}</Text>
                <Text style={[tabStyles.label, { color: isActive ? tabColor : theme.colors.textSecondary }, isActive && { fontWeight: '800' }]}>
                  {t ? t(`discover.tab${tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}`) : tab.key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── SEARCH + FILTER ─── */}
      <View style={[filterStyles.container, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={filterStyles.row}>
          <View style={[filterStyles.searchBar, {
            backgroundColor: theme.colors.surface,
            borderColor: searchQuery ? activeColor : theme.colors.inputBorder,
          }]}>
            <Text style={filterStyles.searchIcon}>🔍</Text>
            <TextInput
              style={[filterStyles.searchInput, { color: theme.colors.text }]}
              placeholder={t ? t('discover.searchPlaceholder') : 'Tìm kiếm...'}
              placeholderTextColor={theme.colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={filterStyles.clearBtn}>
                <Text style={[filterStyles.clearText, { color: theme.colors.textTertiary }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <CityDropdown cities={cities} selectedCity={selectedCity} onSelect={setSelectedCity} theme={theme} t={t} />
        </View>
        {hasFilter && (
          <View style={filterStyles.resultRow}>
            <Text style={[filterStyles.resultCount, { color: theme.colors.textSecondary }]}>
              {filteredData.length > 0
                ? `${filteredData.length} ${t ? t('discover.resultsFound') : 'kết quả'}`
                : (t ? t('discover.noResults') : 'Không có kết quả')}
            </Text>
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCity(null); }}>
              <Text style={[filterStyles.clearAllText, { color: activeColor }]}>✕ Xoá bộ lọc</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── DANH SÁCH ─── */}
      <FlatList
        data={listData}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 36, gap: 14 }}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        removeClippedSubviews
        maxToRenderPerBatch={6}
        initialNumToRender={4}
        ListEmptyComponent={
          <View style={emptyStyles.container}>
            <Text style={emptyStyles.emoji}>🔍</Text>
            <Text style={[emptyStyles.text, { color: theme.colors.textSecondary }]}>
              {t ? t('discover.noResults') : 'Không tìm thấy kết quả'}
            </Text>
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCity(null); }}>
              <Text style={[emptyStyles.resetText, { color: activeColor }]}>Xoá bộ lọc</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// ===== MAIN SCREEN - wrapper với top tab Bản đồ / Khám phá =====
export default function DiscoverScreen(props) {
  const { theme, t } = useApp();
  const [topTab, setTopTab] = useState('map'); // 'map' | 'places'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Top tab switcher */}
      <View style={[topTabS.bar, {
        backgroundColor: theme.colors.card,
        borderBottomColor: theme.colors.border,
        shadowColor: theme.colors.primary,
      }]}>
        <TouchableOpacity
          style={[topTabS.btn, topTab === 'map' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2.5 }]}
          onPress={() => setTopTab('map')}
          activeOpacity={0.8}
        >
          <Text style={[topTabS.icon, topTab === 'map' && topTabS.iconActive]}>🗺️</Text>
          <Text style={[topTabS.label, { color: topTab === 'map' ? theme.colors.primary : theme.colors.textSecondary }, topTab === 'map' && topTabS.labelActive]}>
            Bản đồ
          </Text>
        </TouchableOpacity>

        <View style={[topTabS.divider, { backgroundColor: theme.colors.border }]} />

        <TouchableOpacity
          style={[topTabS.btn, topTab === 'places' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2.5 }]}
          onPress={() => setTopTab('places')}
          activeOpacity={0.8}
        >
          <Text style={[topTabS.icon, topTab === 'places' && topTabS.iconActive]}>🔍</Text>
          <Text style={[topTabS.label, { color: topTab === 'places' ? theme.colors.primary : theme.colors.textSecondary }, topTab === 'places' && topTabS.labelActive]}>
            Địa điểm
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nội dung */}
      <View style={{ flex: 1 }}>
        {topTab === 'map'
          ? <MapScreen {...props} />
          : <DiscoverContent embedded />
        }
      </View>
    </SafeAreaView>
  );
}

const topTabS = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 13,
  },
  divider: { width: 1, height: 24 },
  icon:  { fontSize: 18 },
  iconActive: { fontSize: 20 },
  label: { fontSize: 14, fontWeight: '600' },
  labelActive: { fontWeight: '800' },
});

const tabStyles = StyleSheet.create({
  bar: { borderBottomWidth: 1 },
  content: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, gap: 4 },
  btn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 7, paddingHorizontal: 14,
    flexDirection: 'row', gap: 5, minWidth: 72,
    borderRadius: 20,
  },
  emoji: { fontSize: 16 },
  label: { fontSize: 12, fontWeight: '500' },
});

const filterStyles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 12, height: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 13, fontWeight: '600' },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { fontSize: 12 },
  clearAllText: { fontSize: 12, fontWeight: '700' },
});

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 70, gap: 12 },
  emoji: { fontSize: 48 },
  text: { fontSize: 15, textAlign: 'center' },
  resetText: { fontSize: 14, fontWeight: '700', marginTop: 4 },
});
