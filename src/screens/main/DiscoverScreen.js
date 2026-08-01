// src/screens/main/DiscoverScreen.js - Khám phá địa điểm nổi tiếng VN (5 tab)
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Linking, Alert, ScrollView, TextInput, Modal, Pressable,
  Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { fetchPlacePhoto, GOOGLE_PLACES_API_KEY } from '../../services/placesService';

// ===== DỮ LIỆU ĂN UỐNG - Bắc → Nam =====
const FOOD_PLACES = [
  // ── MIỀN BẮC ──
  { id: 'f1',  name: 'Phở Thìn Bờ Hồ',           city: 'Hà Nội',    address: '61 Đinh Tiên Hoàng, Hoàn Kiếm',       rating: 4.7, price: '50-80k',    emoji: '🍲', lat: 21.0285, lng: 105.8542, description: 'Phở bò truyền thống Hà Nội từ năm 1955, nước dùng trong veo ngọt xương' },
  { id: 'f2',  name: 'Bún chả Hương Liên',        city: 'Hà Nội',    address: '24 Lê Văn Hưu, Hai Bà Trưng',         rating: 4.8, price: '55-75k',    emoji: '🍢', lat: 21.0168, lng: 105.8490, description: 'Quán bún chả Obama - nơi Tổng thống Mỹ Obama đã dùng bữa cùng Anthony Bourdain 2016' },
  { id: 'f3',  name: 'Cà phê Trứng Giảng',        city: 'Hà Nội',    address: '39 Nguyễn Hữu Huân, Hoàn Kiếm',       rating: 4.8, price: '25-45k',    emoji: '☕', lat: 21.0337, lng: 105.8481, description: 'Cà phê trứng sáng tạo từ 1946, kem trứng béo ngậy tan trong miệng' },
  { id: 'f4',  name: 'Chả cá Lã Vọng',            city: 'Hà Nội',    address: '14 Chả Cá, Hoàn Kiếm',                rating: 4.7, price: '150-200k', emoji: '🐟', lat: 21.0334, lng: 105.8489, description: 'Chả cá chảo than hơn 150 năm tuổi, mắm tôm ăn cùng bún và rau thì là' },
  { id: 'f5',  name: 'Bánh cuốn Gia An',          city: 'Hà Nội',    address: '14 Hàng Gà, Hoàn Kiếm',               rating: 4.6, price: '35-55k',    emoji: '🫔', lat: 21.0356, lng: 105.8456, description: 'Bánh cuốn nóng tráng tay, nhân thịt mộc nhĩ, chấm nước mắm pha chua ngọt' },
  { id: 'f6',  name: 'Bún ốc Phủ Tây Hồ',         city: 'Hà Nội',    address: '1 Đặng Thai Mai, Tây Hồ',              rating: 4.7, price: '50-70k',    emoji: '🐚', lat: 21.0558, lng: 105.8232, description: 'Bún ốc chua cay đặc sản Hồ Tây, ốc mập giòn, nước dùng đậm vị cà chua me' },
  { id: 'f7',  name: 'Nem cua bể Hải Phòng',      city: 'Hải Phòng', address: '100 Minh Khai, Lê Chân, Hải Phòng',   rating: 4.7, price: '60-90k',    emoji: '🦀', lat: 20.8568, lng: 106.6839, description: 'Nem cua bể nhân cua biển tươi nguyên con, chiên giòn vàng ruộm đặc sản Hải Phòng' },
  { id: 'f8',  name: 'Bánh đa cua Hai Phòng',     city: 'Hải Phòng', address: '25 Lạch Tray, Ngô Quyền, Hải Phòng',  rating: 4.8, price: '40-60k',    emoji: '🦀', lat: 20.8605, lng: 106.6935, description: 'Bánh đa đỏ nước dùng cua biển đậm đà, rau muống luộc, chả cá thác lác thơm' },
  { id: 'f9',  name: 'Lợn quay Lạng Sơn',         city: 'Lạng Sơn',  address: 'Chợ Đông Kinh, Lạng Sơn',             rating: 4.8, price: '80-150k',   emoji: '🐷', lat: 21.8534, lng: 106.7597, description: 'Lợn quay mắc mật - đặc sản Lạng Sơn, da giòn tan, thịt thơm mùi lá mắc mật rừng' },
  { id: 'f10', name: 'Cháo ấu tẩu Hà Giang',      city: 'Hà Giang',  address: 'Thị trấn Đồng Văn, Hà Giang',         rating: 4.7, price: '30-50k',    emoji: '🍵', lat: 23.2750, lng: 105.3593, description: 'Cháo ấu tẩu trắng nõn nấu cùng chân giò, vừa ấm vừa bổ dưỡng vùng núi cao' },
  { id: 'f11', name: 'Thịt trâu gác bếp Sơn La',  city: 'Sơn La',    address: 'Chợ Sơn La, TP Sơn La',               rating: 4.6, price: '200-400k',  emoji: '🥩', lat: 21.3270, lng: 103.9144, description: 'Thịt trâu hun khói gác bếp khô mềm, chấm chẩm chéo hạt dổi - đặc sản núi rừng Tây Bắc' },
  // ── MIỀN TRUNG ──
  { id: 'f12', name: 'Bún bò Huế O Xuân',          city: 'Huế',       address: '22 Nguyễn Bỉnh Khiêm, TP Huế',        rating: 4.8, price: '30-50k',    emoji: '🍜', lat: 16.4637, lng: 107.5909, description: 'Bún bò Huế cay đậm đà nổi tiếng nhất Cố Đô, chả cua giò heo thơm ngon' },
  { id: 'f13', name: 'Cơm hến Hà Nội của Huế',     city: 'Huế',       address: '11A Trần Cao Vân, TP Huế',             rating: 4.7, price: '20-35k',    emoji: '🐚', lat: 16.4640, lng: 107.5950, description: 'Cơm hến đặc sản Huế - cơm nguội trộn hến xào, đậu phộng rang, bánh tráng nướng vụn' },
  { id: 'f14', name: 'Bánh mì Phượng',             city: 'Hội An',    address: '2B Phan Châu Trinh, Hội An',           rating: 4.9, price: '20-35k',    emoji: '🥖', lat: 15.8801, lng: 108.3380, description: 'Bánh mì Hội An nổi tiếng thế giới, vỏ giòn nhân đầy, Anthony Bourdain gọi là "Bánh mì thần thánh"' },
  { id: 'f15', name: 'Cao lầu Bà Lý',              city: 'Hội An',    address: '22 Thái Phiên, Hội An',                rating: 4.8, price: '40-60k',    emoji: '🍝', lat: 15.8787, lng: 108.3372, description: 'Cao lầu đặc sản độc nhất Hội An, mì gạo tro giếng Bá Lễ, thịt xá xíu, tép mỡ' },
  { id: 'f16', name: 'Mì Quảng Ếch 1A',            city: 'Đà Nẵng',   address: '1A Hải Phòng, Hải Châu',               rating: 4.6, price: '35-55k',    emoji: '🍜', lat: 16.0680, lng: 108.2200, description: 'Mì Quảng tôm thịt truyền thống, nước nhĩ ít, rau sống bánh tráng mè thơm giòn' },
  { id: 'f17', name: 'Bún mắm nêm Đà Nẵng',        city: 'Đà Nẵng',   address: '47 Bạch Đằng, Hải Châu',               rating: 4.6, price: '30-50k',    emoji: '🍜', lat: 16.0678, lng: 108.2204, description: 'Bún mắm nêm chấm đặc sệt thơm cay, thịt heo ba chỉ, chả cuốn rau sống Đà Nẵng' },
  { id: 'f18', name: 'Nem lụi Bà Nga Quy Nhơn',    city: 'Quy Nhơn',  address: '47 Xuân Diệu, TP Quy Nhơn',            rating: 4.7, price: '40-70k',    emoji: '🍡', lat: 13.7700, lng: 109.2200, description: 'Nem lụi nướng chả ram cuốn bánh tráng mỏng, chấm nước mắm me chua ngọt đặc trưng Bình Định' },
  { id: 'f19', name: 'Bánh căn Phan Rang',          city: 'Ninh Thuận', address: 'Chợ Phan Rang, TP Phan Rang',          rating: 4.7, price: '20-40k',    emoji: '🥚', lat: 11.5640, lng: 108.9880, description: 'Bánh căn khuôn đất nung đổ mực tôm trứng cút, chấm mắm nêm cay đặc sản Ninh Thuận' },
  { id: 'f20', name: 'Bún cá Nha Trang',            city: 'Nha Trang',  address: '10 Phan Chu Trinh, Nha Trang',          rating: 4.7, price: '40-65k',    emoji: '🐠', lat: 12.2485, lng: 109.1930, description: 'Bún cá nước dùng trong ngọt từ xương cá, chả cá chiên vàng, rau muống cần tàu' },
  // ── TÂY NGUYÊN ──
  { id: 'f21', name: 'Bánh mì xíu mại Đà Lạt',     city: 'Đà Lạt',    address: '53 Phan Đình Phùng, Đà Lạt',           rating: 4.7, price: '25-45k',    emoji: '🥖', lat: 11.9416, lng: 108.4429, description: 'Bánh mì chấm xíu mại nóng hổi buổi sáng, đặc sản sương mù Đà Lạt từ hàng chục năm' },
  { id: 'f22', name: 'Lẩu bò Buôn Ma Thuột',        city: 'Buôn Ma Thuột', address: '120 Lê Duẩn, TP Buôn Ma Thuột',    rating: 4.6, price: '80-150k',   emoji: '🫕', lat: 12.6802, lng: 108.0500, description: 'Lẩu bò Tây Nguyên tảng lớn ăn với bún, rau rừng, giò bò sốt cà chua me đặc sắc' },
  // ── MIỀN NAM ──
  { id: 'f23', name: 'Cơm tấm Thuận Kiều',          city: 'TP.HCM',    address: '1 Võ Văn Tần, Quận 3',                 rating: 4.7, price: '50-80k',    emoji: '🍚', lat: 10.7772, lng: 106.6907, description: 'Cơm tấm sườn nướng bì chả trứng hấp đặc trưng Sài Gòn, mỡ hành xanh thơm lừng' },
  { id: 'f24', name: 'Hủ tiếu Nam Vang Mỹ Tiên',    city: 'TP.HCM',    address: '288 An Dương Vương, Quận 5',            rating: 4.7, price: '50-80k',    emoji: '🍜', lat: 10.7536, lng: 106.6652, description: 'Hủ tiếu Nam Vang tô đầy xương, gan heo, tôm, thịt băm - đậm chất người Hoa Chợ Lớn' },
  { id: 'f25', name: 'Bánh mì Huỳnh Hoa',            city: 'TP.HCM',    address: '26 Lê Thị Riêng, Quận 1',              rating: 4.9, price: '30-50k',    emoji: '🥖', lat: 10.7872, lng: 106.6966, description: 'Bánh mì nhân chả lụa giò thủ pate bơ phủ đầy, nổi tiếng nhất Sài Gòn xếp hàng mỗi ngày' },
  { id: 'f26', name: 'Bún riêu cua Thanh Xuân',      city: 'TP.HCM',    address: '12 Đinh Tiên Hoàng, Bình Thạnh',       rating: 4.7, price: '45-70k',    emoji: '🦀', lat: 10.8034, lng: 106.7137, description: 'Bún riêu gạch cua đồng nguyên chất, đậu chiên giòn cà chua, mắm tôm pha chuẩn vị' },
  { id: 'f27', name: 'Lẩu mắm miền Tây Út Dzách',   city: 'Cần Thơ',   address: '73 Hai Bà Trưng, Ninh Kiều, Cần Thơ',  rating: 4.8, price: '80-150k',   emoji: '🫕', lat: 10.0341, lng: 105.7808, description: 'Lẩu mắm cá linh bông điên điển mùa nước nổi, rau đồng tươi ngon đặc sản miền Tây' },
  { id: 'f28', name: 'Bún quậy Phú Quốc Ông Già',   city: 'Phú Quốc',  address: '97 Trần Hưng Đạo, Dương Đông, Phú Quốc', rating: 4.7, price: '40-70k', emoji: '🍲', lat: 10.2167, lng: 103.9667, description: 'Bún quậy độc lạ Phú Quốc chan nước lèo hải sản tươi, dùng đũa khuấy mới không bị dính' },
  { id: 'f29', name: 'Bánh khọt Vũng Tàu Ánh Hồng', city: 'Vũng Tàu',  address: '14 Nguyễn Trường Tộ, TP Vũng Tàu',     rating: 4.7, price: '30-55k',    emoji: '🧇', lat: 10.3460, lng: 107.0843, description: 'Bánh khọt tôm dừa giòn tan nóng hổi, chấm nước mắm tỏi ớt chua ngọt chuẩn Vũng Tàu' },
  { id: 'f30', name: 'Hủ tiếu Mỹ Tho',              city: 'Tiền Giang', address: '11 Lê Lợi, TP Mỹ Tho, Tiền Giang',    rating: 4.7, price: '35-60k',    emoji: '🍜', lat: 10.3600, lng: 106.3600, description: 'Hủ tiếu Mỹ Tho sợi khô nước ngọt từ xương heo tôm khô, ăn khô hay nước đều tuyệt' },
];

// ===== DỮ LIỆU NGHỈ DƯỠNG - Bắc → Nam =====
const RESORT_PLACES = [
  // ── MIỀN BẮC ──
  { id: 'r1',  name: 'Mường Thanh Luxury Hà Nội',  city: 'Hà Nội',     address: '14 Phan Đình Giót, Thanh Xuân',          rating: 4.6, price: '1.5-4 triệu/đêm', emoji: '🏨', lat: 20.9973, lng: 105.8219, description: 'Khách sạn 5 sao chuỗi Mường Thanh lớn nhất Đông Nam Á, trung tâm Hà Nội' },
  { id: 'r2',  name: 'Sofitel Legend Metropole',    city: 'Hà Nội',     address: '15 Ngô Quyền, Hoàn Kiếm',                rating: 4.9, price: '5-20 triệu/đêm',  emoji: '🏛️', lat: 21.0245, lng: 105.8564, description: 'Khách sạn di sản 5 sao trăm năm tuổi giữa lòng Hà Nội, hồ Hoàn Kiếm 5 phút đi bộ' },
  { id: 'r3',  name: 'Sun World Hạ Long Park',      city: 'Hạ Long',    address: 'Bãi Cháy, TP Hạ Long, Quảng Ninh',       rating: 4.7, price: '2-6 triệu/đêm',   emoji: '🌊', lat: 20.9525, lng: 107.0471, description: 'Resort ven vịnh Hạ Long, cáp treo đến đỉnh Bà Đèo ngắm toàn cảnh kỳ quan thiên nhiên' },
  { id: 'r4',  name: 'Sapa Jade Hill Resort',       city: 'Sapa',       address: 'Đường Thác Bạc, TP Sapa, Lào Cai',        rating: 4.7, price: '2-5 triệu/đêm',   emoji: '⛰️', lat: 22.3364, lng: 103.8438, description: 'Resort giữa ruộng bậc thang Sapa, phòng gỗ ấm cúng view núi Fansipan hùng vĩ' },
  { id: 'r5',  name: 'Ninh Bình Hidden Charm',      city: 'Ninh Bình',  address: 'Ninh Hải, Hoa Lư, Ninh Bình',             rating: 4.8, price: '1.5-4 triệu/đêm', emoji: '🛶', lat: 20.2506, lng: 105.9741, description: 'Boutique resort ẩn mình giữa rừng cây xanh Tràng An, bơi thuyền kayak ngay trước cửa phòng' },
  // ── MIỀN TRUNG ──
  { id: 'r6',  name: 'Banyan Tree Lăng Cô',         city: 'Lăng Cô',    address: 'Lăng Cô, Phú Lộc, Thừa Thiên Huế',       rating: 4.9, price: '6-18 triệu/đêm',  emoji: '🏝️', lat: 16.2128, lng: 108.0767, description: 'Resort đẳng cấp thế giới bên đầm Lăng Cô, 5 sao biệt lập núi Hải Vân - biển xanh' },
  { id: 'r7',  name: 'Furama Resort Đà Nẵng',       city: 'Đà Nẵng',    address: '68 Hồ Xuân Hương, Mỹ An',                 rating: 4.7, price: '2-5 triệu/đêm',   emoji: '🌊', lat: 16.0471, lng: 108.2446, description: 'Resort 5 sao ven biển Mỹ Khê danh tiếng quốc tế, bãi biển riêng dài 200m cát trắng' },
  { id: 'r8',  name: 'InterContinental Đà Nẵng',    city: 'Đà Nẵng',    address: 'Bán đảo Sơn Trà, Đà Nẵng',                rating: 4.9, price: '5-15 triệu/đêm',  emoji: '🦅', lat: 16.1144, lng: 108.2757, description: 'Từng bình chọn khách sạn đẹp nhất châu Á, nằm sườn núi Sơn Trà nhìn ra biển Đông' },
  { id: 'r9',  name: 'Nam Hải Hội An Four Seasons', city: 'Hội An',     address: 'Điện Dương, Điện Bàn, Quảng Nam',         rating: 4.9, price: '8-25 triệu/đêm',  emoji: '🌺', lat: 15.9196, lng: 108.3302, description: 'Four Seasons Resort biệt thự hồ bơi riêng bãi biển cách phố cổ 4km, dịch vụ hạng nhất' },
  { id: 'r10', name: 'Anantara Hội An Resort',      city: 'Hội An',     address: '1 Phạm Hồng Thái, Hội An',                rating: 4.7, price: '3-7 triệu/đêm',   emoji: '🌸', lat: 15.8782, lng: 108.3292, description: 'Resort lãng mạn bên sông Thu Bồn, đạp xe vào phố cổ 10 phút, kiến trúc Việt truyền thống' },
  { id: 'r11', name: 'Amanoi Ninh Thuận',           city: 'Ninh Thuận', address: 'Vĩnh Hy, Ninh Hải, Ninh Thuận',           rating: 4.9, price: '10-30 triệu/đêm', emoji: '🌅', lat: 11.6835, lng: 109.2177, description: 'Resort siêu sang biệt lập giữa rừng quốc gia Núi Chúa, tầm nhìn vịnh Vĩnh Hy hoang sơ' },
  { id: 'r12', name: 'Six Senses Ninh Van Bay',     city: 'Nha Trang',  address: 'Vịnh Ninh Vân, Nha Trang, Khánh Hòa',    rating: 4.8, price: '8-20 triệu/đêm',  emoji: '🐚', lat: 12.2388, lng: 109.2297, description: 'Biệt thự bungalow trên vịnh biển hoang sơ chỉ đến bằng thuyền riêng 15 phút từ TP' },
  // ── TÂY NGUYÊN ──
  { id: 'r13', name: 'Dalat Palace Heritage Hotel', city: 'Đà Lạt',     address: '12 Trần Phú, TP Đà Lạt, Lâm Đồng',       rating: 4.8, price: '3-8 triệu/đêm',   emoji: '🌷', lat: 11.9400, lng: 108.4380, description: 'Khách sạn cổ điển 5 sao từ 1922 thời Pháp thuộc, nhìn ra hồ Xuân Hương thơ mộng' },
  // ── MIỀN NAM ──
  { id: 'r14', name: 'Park Hyatt Sài Gòn',          city: 'TP.HCM',     address: '2 Công Trường Lam Sơn, Quận 1',           rating: 4.8, price: '6-20 triệu/đêm',  emoji: '🏙️', lat: 10.7756, lng: 106.7025, description: 'Khách sạn 5 sao sang trọng ngay trung tâm Quận 1, đối diện Nhà hát Thành phố' },
  { id: 'r15', name: 'The Reverie Sài Gòn',         city: 'TP.HCM',     address: '22-36 Nguyễn Huệ, Quận 1',                rating: 4.9, price: '8-30 triệu/đêm',  emoji: '💎', lat: 10.7742, lng: 106.7031, description: 'Khách sạn 5 sao xa xỉ nhất Việt Nam, thiết kế nội thất pha lê dát vàng tráng lệ' },
  { id: 'r16', name: 'Vinpearl Resort Phú Quốc',    city: 'Phú Quốc',   address: 'Bãi Dài, Gành Dầu, Phú Quốc, Kiên Giang', rating: 4.8, price: '3-8 triệu/đêm',   emoji: '🏖️', lat: 10.3579, lng: 103.9876, description: 'Quần thể resort 5 sao bao gồm vườn thú, công viên nước, casino - đảo ngọc Phú Quốc' },
  { id: 'r17', name: 'JW Marriott Phú Quốc',        city: 'Phú Quốc',   address: 'Khu Emerald Bay, Bãi Khem, Phú Quốc',     rating: 4.9, price: '5-15 triệu/đêm',  emoji: '🏝️', lat: 10.0100, lng: 104.0100, description: 'Resort chủ đề đại học giả tưởng độc đáo nhất Đông Nam Á, bãi biển Bãi Khem tuyệt đẹp' },
];

// ===== DỮ LIỆU SỨC KHOẺ - Bắc → Nam =====
const HEALTH_PLACES = [
  // ── MIỀN BẮC ──
  { id: 'h1',  name: 'Vinmec Times City',           city: 'Hà Nội',     address: '458 Minh Khai, Hai Bà Trưng',              rating: 4.7, price: 'Theo dịch vụ', emoji: '🏥', lat: 20.9961, lng: 105.8679, description: 'Bệnh viện quốc tế Vinmec chuẩn JCI Mỹ, trang thiết bị hiện đại bậc nhất Việt Nam' },
  { id: 'h2',  name: 'BV Bạch Mai',                 city: 'Hà Nội',     address: '78 Giải Phóng, Đống Đa',                   rating: 4.5, price: 'Theo dịch vụ', emoji: '🏥', lat: 21.0053, lng: 105.8440, description: 'Bệnh viện tuyến Trung ương lớn nhất miền Bắc, chuyên sâu nhiều chuyên khoa khó' },
  { id: 'h3',  name: 'Mandara Spa Sofitel HN',       city: 'Hà Nội',     address: '15 Ngô Quyền, Hoàn Kiếm',                  rating: 4.8, price: '500k-2 triệu', emoji: '💆', lat: 21.0245, lng: 105.8564, description: 'Spa 5 sao chuẩn quốc tế trong khách sạn Sofitel Metropole, phục hồi toàn thân' },
  { id: 'h4',  name: 'Yolo Yoga Studio Hồ Tây',     city: 'Hà Nội',     address: '47 Xuân Diệu, Tây Hồ',                     rating: 4.6, price: '200-400k/buổi', emoji: '🧘', lat: 21.0544, lng: 105.8282, description: 'Studio yoga view hồ Tây, giảng viên nước ngoài, lớp nhỏ tối đa 12 người' },
  { id: 'h5',  name: 'Sense Spa Hà Nội',            city: 'Hà Nội',     address: '25A Lý Thường Kiệt, Hoàn Kiếm',            rating: 4.7, price: '350k-1.2 triệu', emoji: '💆', lat: 21.0261, lng: 105.8475, description: 'Spa massage trị liệu nổi tiếng Hà Nội, liệu trình đá nóng thảo dược truyền thống' },
  { id: 'h6',  name: 'Quảng Ninh Gate International', city: 'Hạ Long',  address: '291 Lê Thánh Tông, Hạ Long',               rating: 4.5, price: 'Theo dịch vụ', emoji: '🏥', lat: 20.9594, lng: 107.0697, description: 'Bệnh viện quốc tế Hạ Long, phục vụ khách du lịch và cư dân Quảng Ninh 24/7' },
  // ── MIỀN TRUNG ──
  { id: 'h7',  name: 'BV Đà Nẵng',                  city: 'Đà Nẵng',    address: '124 Hải Phòng, Hải Châu',                  rating: 4.5, price: 'Theo dịch vụ', emoji: '🏥', lat: 16.0680, lng: 108.2194, description: 'Bệnh viện tuyến Trung ương vùng miền Trung, cấp cứu 24h chuyên khoa đầy đủ' },
  { id: 'h8',  name: 'Danang Riverside Spa',         city: 'Đà Nẵng',    address: '68 Hồ Xuân Hương, Ngũ Hành Sơn',          rating: 4.7, price: '400k-1.5 triệu', emoji: '💆', lat: 16.0471, lng: 108.2446, description: 'Spa view sông Hàn, massage bấm huyệt đá núi Ngũ Hành Sơn trị liệu đặc biệt' },
  { id: 'h9',  name: 'Zen Spa Đà Lạt',              city: 'Đà Lạt',     address: '3 Hoàng Văn Thụ, TP Đà Lạt',               rating: 4.7, price: '200-600k', emoji: '🧘', lat: 11.9403, lng: 108.4579, description: 'Spa thư giãn giữa cao nguyên mát lạnh, tinh dầu hoa Đà Lạt, âm nhạc tự nhiên' },
  { id: 'h10', name: 'Nha Trang Herbal Spa',         city: 'Nha Trang',  address: '64 Trần Phú, Lộc Thọ, Nha Trang',         rating: 4.6, price: '250-800k', emoji: '🌿', lat: 12.2441, lng: 109.1946, description: 'Spa thảo dược biển, tắm muối khoáng, massage bùn tảo biển đặc trị da sau nắng' },
  // ── MIỀN NAM ──
  { id: 'h11', name: 'Vinmec Central Park HCM',      city: 'TP.HCM',     address: '208 Nguyễn Hữu Cảnh, Bình Thạnh',         rating: 4.7, price: 'Theo dịch vụ', emoji: '🏥', lat: 10.7944, lng: 106.7213, description: 'Bệnh viện Vinmec 5 sao TP.HCM, phòng bệnh như khách sạn, toàn bộ bác sĩ đào tạo quốc tế' },
  { id: 'h12', name: 'FV Hospital TP.HCM',           city: 'TP.HCM',     address: '6 Nguyễn Lương Bằng, Quận 7',             rating: 4.7, price: 'Theo dịch vụ', emoji: '🏥', lat: 10.7307, lng: 106.7000, description: 'Bệnh viện Pháp Việt 150 bác sĩ quốc tế, chuẩn JCI, đa khoa tổng hợp uy tín nhất HCM' },
  { id: 'h13', name: 'California Fitness Yoga HCM',  city: 'TP.HCM',     address: '28 Phạm Ngọc Thạch, Quận 3',              rating: 4.5, price: '500k-1.2 triệu/tháng', emoji: '🏋️', lat: 10.7829, lng: 106.6993, description: 'Chuỗi gym yoga lớn nhất VN, thiết bị nhập khẩu, PT chuyên nghiệp, hồ bơi trong nhà' },
  { id: 'h14', name: 'KAIA Spa Saigon',              city: 'TP.HCM',     address: '51 Hai Bà Trưng, Quận 1',                 rating: 4.8, price: '500k-2 triệu', emoji: '💆', lat: 10.7811, lng: 106.6997, description: 'Spa cao cấp trung tâm Quận 1, liệu trình massage Thái Việt Nhật, phòng VIP riêng biệt' },
  { id: 'h15', name: 'BV Chợ Rẫy',                  city: 'TP.HCM',     address: '201B Nguyễn Chí Thanh, Quận 5',           rating: 4.5, price: 'Theo dịch vụ', emoji: '🏥', lat: 10.7527, lng: 106.6601, description: 'Bệnh viện lớn nhất miền Nam, chuyên khoa ghép tạng gan thận nổi tiếng toàn quốc' },
];

// ===== DỮ LIỆU LÀM ĐẸP - Bắc → Nam =====
const BEAUTY_PLACES = [
  // ── MIỀN BẮC ──
  { id: 'b1',  name: 'Toni & Guy Hà Nội',           city: 'Hà Nội',     address: 'Tầng 2, Vincom Royal City, Thanh Xuân',   rating: 4.7, price: '300k-1.5 triệu', emoji: '💇', lat: 20.9943, lng: 105.8200, description: 'Salon tóc quốc tế Anh Quốc tại Việt Nam, stylist được đào tạo London & Hồng Kông' },
  { id: 'b2',  name: 'Color Me Salon phố cổ',       city: 'Hà Nội',     address: '52 Hàng Gai, Hoàn Kiếm',                   rating: 4.8, price: '300k-2 triệu', emoji: '🎨', lat: 21.0336, lng: 105.8472, description: 'Salon chuyên nhuộm tóc màu sáng tạo tại phố cổ HN, tư vấn màu miễn phí' },
  { id: 'b3',  name: 'Thu Cúc Clinics Hà Nội',      city: 'Hà Nội',     address: '216 Trần Duy Hưng, Cầu Giấy',              rating: 4.6, price: 'Theo liệu trình', emoji: '✨', lat: 21.0077, lng: 105.7989, description: 'Thẩm mỹ viện công nghệ cao uy tín miền Bắc, trẻ hóa da laser không xâm lấn' },
  { id: 'b4',  name: 'Jiin Nail & Spa Hà Nội',      city: 'Hà Nội',     address: '60 Láng Hạ, Đống Đa',                      rating: 4.7, price: '150-500k',     emoji: '💅', lat: 21.0181, lng: 105.8208, description: 'Tiệm nail cao cấp Hà Nội, nail art 3D, ombre tinh tế, phòng VIP riêng tư' },
  { id: 'b5',  name: 'Anh Tuấn Hair Salon',         city: 'Hà Nội',     address: '21B Điện Biên Phủ, Ba Đình',                rating: 4.8, price: '200k-800k',    emoji: '💇', lat: 21.0350, lng: 105.8363, description: 'Salon tóc hàng đầu Hà Nội 20 năm, stylist vô địch VN nhiều năm, đặt lịch trước 1 tuần' },
  // ── MIỀN TRUNG ──
  { id: 'b6',  name: 'Wax & Beauty Đà Nẵng',        city: 'Đà Nẵng',    address: '18 Bạch Đằng, Hải Châu',                   rating: 4.5, price: '100-350k',     emoji: '💄', lat: 16.0678, lng: 108.2204, description: 'Làm đẹp toàn diện trung tâm Đà Nẵng, facial Hàn Quốc, wax toàn thân' },
  { id: 'b7',  name: 'White Gloves Hội An',         city: 'Hội An',     address: '8 Nguyễn Thái Học, Hội An',                 rating: 4.7, price: '200k-700k',    emoji: '💅', lat: 15.8773, lng: 108.3263, description: 'Tiệm nail boutique đẹp phố cổ Hội An, thiết kế nail họa tiết dân tộc Việt độc đáo' },
  { id: 'b8',  name: 'Khanh Huong Spa Hội An',      city: 'Hội An',     address: '86 Bà Triệu, Hội An',                       rating: 4.8, price: '250k-900k',    emoji: '🌿', lat: 15.8793, lng: 108.3355, description: 'Spa trị liệu dầu thảo dược bản địa Quảng Nam, kết hợp massage Việt Thái truyền thống' },
  { id: 'b9',  name: 'Hue Beauty Center',           city: 'Huế',        address: '31 Lý Thường Kiệt, TP Huế',                 rating: 4.6, price: 'Theo liệu trình', emoji: '🌸', lat: 16.4637, lng: 107.5909, description: 'Spa thẩm mỹ viện uy tín nhất Huế, công nghệ Hàn trẻ hóa da không dao kéo' },
  // ── TÂY NGUYÊN ──
  { id: 'b10', name: 'Lavender Beauty Đà Lạt',      city: 'Đà Lạt',     address: '8 Khu Hòa Bình, TP Đà Lạt',                rating: 4.7, price: '150-500k',     emoji: '💜', lat: 11.9415, lng: 108.4426, description: 'Spa hoa oải hương Đà Lạt tươi trồng trực tiếp, mặt nạ lavender tự làm tại chỗ' },
  // ── MIỀN NAM ──
  { id: 'b11', name: 'Joli Beauty Clinic HCM',      city: 'TP.HCM',     address: '186 Điện Biên Phủ, Bình Thạnh',             rating: 4.7, price: 'Theo liệu trình', emoji: '🌟', lat: 10.7947, lng: 106.7174, description: 'Phòng khám thẩm mỹ công nghệ Hàn Quốc, nâng mũi sửa mắt không phẫu thuật' },
  { id: 'b12', name: 'Iris Nail & Beauty HCM',      city: 'TP.HCM',     address: '45 Đinh Tiên Hoàng, Bình Thạnh',            rating: 4.8, price: '150-500k',     emoji: '💅', lat: 10.8000, lng: 106.7092, description: 'Nail art phong cách Hàn Quốc, đội ngũ 20 kỹ thuật viên, hệ thống tiệt trùng chuẩn y tế' },
  { id: 'b13', name: 'Nhu Hoa Hair Salon Sài Gòn',  city: 'TP.HCM',     address: '178 Nam Kỳ Khởi Nghĩa, Quận 3',            rating: 4.7, price: '250k-1.5 triệu', emoji: '💇', lat: 10.7780, lng: 106.6919, description: 'Salon tóc Sài Gòn 15 năm kinh nghiệm, chuyên nhuộm highlight balayage chuẩn châu Âu' },
  { id: 'b14', name: 'Ohui Spa Quận 1',             city: 'TP.HCM',     address: '39 Ngô Đức Kế, Quận 1',                    rating: 4.8, price: '400k-1.8 triệu', emoji: '✨', lat: 10.7748, lng: 106.7013, description: 'Spa Hàn Quốc cao cấp trung tâm Sài Gòn, chăm sóc da mặt bằng mỹ phẩm OHUI nhập Hàn' },
  { id: 'b15', name: 'Queen Nail Phú Quốc',         city: 'Phú Quốc',   address: '58 Trần Hưng Đạo, Dương Đông, Phú Quốc',  rating: 4.6, price: '150-450k',     emoji: '💅', lat: 10.2200, lng: 103.9630, description: 'Tiệm nail đảo ngọc Phú Quốc, gel nail acrylic, phong cách nhiệt đới mùa hè' },
];

// ===== DỮ LIỆU MUA SẮM - Bắc → Nam =====
const SHOPPING_PLACES = [
  // ── MIỀN BẮC ──
  { id: 's1',  name: 'Chợ Đồng Xuân',               city: 'Hà Nội',    address: 'Đồng Xuân, Hoàn Kiếm, Hà Nội',              rating: 4.5, price: 'Đa dạng',        emoji: '🏪', lat: 21.0378, lng: 105.8494, description: 'Chợ truyền thống lớn nhất HN, vải vóc thủ công mỹ nghệ quà lưu niệm giá sỉ lẻ', province: 'Hà Nội', region: 'Bắc', specialty: 'Thủ công mỹ nghệ, vải lụa, đồ cổ' },
  { id: 's2',  name: 'Vincom Bà Triệu',              city: 'Hà Nội',    address: '191 Bà Triệu, Hai Bà Trưng, Hà Nội',         rating: 4.6, price: '200k-vài triệu',  emoji: '🏬', lat: 21.0132, lng: 105.8487, description: 'TTTM hàng đầu HN, thời trang H&M Zara, ẩm thực, rạp CGV lớn nhất Bắc bộ', province: 'Hà Nội', region: 'Bắc', specialty: 'Thời trang quốc tế, F&B cao cấp' },
  { id: 's3',  name: 'Phố Hàng Gai - Lụa tơ tằm',  city: 'Hà Nội',    address: 'Hàng Gai, Hoàn Kiếm, Hà Nội',               rating: 4.7, price: '200k-2 triệu',    emoji: '🧵', lat: 21.0336, lng: 105.8472, description: 'Phố chuyên lụa tơ tằm, áo dài thêu tay, tranh thư pháp đặc sản Hà Nội', province: 'Hà Nội', region: 'Bắc', specialty: 'Lụa tơ tằm, áo dài, tranh thêu' },
  { id: 's4',  name: 'Aeon Mall Hà Đông',            city: 'Hà Nội',    address: 'Dương Nội, Hà Đông, Hà Nội',                 rating: 4.5, price: '100k-vài triệu',  emoji: '🛍️', lat: 20.9790, lng: 105.7598, description: 'TTTM Nhật Bản lớn nhất miền Bắc, siêu thị thực phẩm sạch, hàng gia dụng Nhật', province: 'Hà Nội', region: 'Bắc', specialty: 'Hàng Nhật, thực phẩm sạch, gia dụng' },
  { id: 's5',  name: 'Chợ Bắc Hà phiên vùng cao',   city: 'Lào Cai',   address: 'Thị trấn Bắc Hà, Bắc Hà, Lào Cai',          rating: 4.8, price: '50k-300k',        emoji: '🌄', lat: 22.5297, lng: 104.2879, description: 'Chợ phiên Chủ nhật lớn nhất Tây Bắc, thổ cẩm H\'Mông sặc sỡ, mận Tam Hoa', province: 'Lào Cai', region: 'Bắc', specialty: 'Thổ cẩm, mận Tam Hoa, rượu táo mèo' },
  { id: 's6',  name: 'Phố cổ Đồng Văn Hà Giang',    city: 'Hà Giang',  address: 'Thị trấn Đồng Văn, Đồng Văn, Hà Giang',     rating: 4.6, price: '50k-500k',        emoji: '🏮', lat: 23.2750, lng: 105.3593, description: 'Phố cổ đá trên cao nguyên đá, thổ cẩm dân tộc, đồng bạc H\'Mông, rượu ngô hoa', province: 'Hà Giang', region: 'Bắc', specialty: 'Thổ cẩm H\'Mông, đồ bạc, rượu ngô' },
  { id: 's7',  name: 'Chợ Đồng Xuân Hải Phòng',     city: 'Hải Phòng', address: 'Lê Lợi, Hồng Bàng, Hải Phòng',              rating: 4.4, price: 'Đa dạng',        emoji: '🦞', lat: 20.8643, lng: 106.6784, description: 'Chợ lớn nhất Hải Phòng, hải sản cua ghẹ tôm biển tươi, bánh đa cua nem cua bể', province: 'Hải Phòng', region: 'Bắc', specialty: 'Hải sản tươi, nem cua bể, bánh đa cua' },
  // ── MIỀN TRUNG ──
  { id: 's8',  name: 'Chợ Hàn Đà Nẵng',             city: 'Đà Nẵng',   address: '119 Trần Phú, Hải Châu, Đà Nẵng',           rating: 4.5, price: '20k-500k',        emoji: '🐟', lat: 16.0678, lng: 108.2204, description: 'Chợ biểu tượng ĐN, hải sản khô tươi, mắm nêm Nam Ô, đặc sản miền Trung giá tốt', province: 'Đà Nẵng', region: 'Trung', specialty: 'Hải sản khô, mắm, nước mắm Nam Ô' },
  { id: 's9',  name: 'Vincom Đà Nẵng',               city: 'Đà Nẵng',   address: '910A Ngô Quyền, Sơn Trà, Đà Nẵng',          rating: 4.5, price: '100k-vài triệu',  emoji: '🏬', lat: 16.0605, lng: 108.2389, description: 'TTTM hiện đại ĐN, thời trang quốc tế, siêu thị Big C, rạp CGV vui chơi giải trí', province: 'Đà Nẵng', region: 'Trung', specialty: 'Thời trang, siêu thị, giải trí' },
  { id: 's10', name: 'Phố Hội An đèn lồng thủ công', city: 'Hội An',    address: 'Phố cổ Hội An, Hội An, Quảng Nam',          rating: 4.9, price: '50k-1 triệu',     emoji: '🏮', lat: 15.8787, lng: 108.3372, description: 'Phố nghề đèn lồng thêu tay, may áo dài 1 ngày, gốm Thanh Hà, tranh lụa truyền thống', province: 'Quảng Nam', region: 'Trung', specialty: 'Đèn lồng, áo dài may đo, gốm Thanh Hà' },
  { id: 's11', name: 'Chợ Đông Ba Huế',              city: 'Huế',       address: '1 Trần Hưng Đạo, Phú Hòa, TP Huế',         rating: 4.5, price: '20k-500k',        emoji: '👘', lat: 16.4722, lng: 107.5819, description: 'Chợ trung tâm Cố Đô, nón lá bài thơ, áo dài Huế, mè xửng mứt gừng sen Tịnh Tâm', province: 'Thừa Thiên Huế', region: 'Trung', specialty: 'Nón lá, áo dài Huế, mè xửng, tôm chua' },
  { id: 's12', name: 'Chợ Đầm Nha Trang',            city: 'Nha Trang', address: 'Trần Phú, Lộc Thọ, Nha Trang',              rating: 4.3, price: '20k-500k',        emoji: '🦑', lat: 12.2438, lng: 109.1938, description: 'Chợ trung tâm NT, hải sản tươi sống, mực khô bạch tuộc tôm sú, yến sào Khánh Hòa', province: 'Khánh Hòa', region: 'Trung', specialty: 'Yến sào, mực khô, nước mắm, hải sản' },
  { id: 's13', name: 'Chợ đêm Đà Lạt',               city: 'Đà Lạt',    address: 'Nguyễn Thị Minh Khai, TP Đà Lạt',           rating: 4.7, price: '30k-300k',        emoji: '🌺', lat: 11.9415, lng: 108.4426, description: 'Chợ đêm lãng mạn Đà Lạt, hoa tươi atisô dâu tây, rượu vang Đà Lạt, len dạ thủ công', province: 'Lâm Đồng', region: 'Trung', specialty: 'Hoa tươi, atisô, dâu tây, rượu vang' },
  // ── MIỀN NAM ──
  { id: 's14', name: 'Chợ Bến Thành',                city: 'TP.HCM',    address: 'Lê Lợi, Bến Thành, Quận 1, HCM',            rating: 4.4, price: '50k-2 triệu',     emoji: '🛒', lat: 10.7724, lng: 106.6980, description: 'Biểu tượng 100 năm Sài Gòn, thực phẩm đặc sản Nam Bộ, quà lưu niệm, thời trang thủ công', province: 'TP.HCM', region: 'Nam', specialty: 'Quà lưu niệm, thời trang, đặc sản Nam Bộ' },
  { id: 's15', name: 'Vincom Đồng Khởi Sài Gòn',     city: 'TP.HCM',    address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1',         rating: 4.7, price: '300k-chục triệu',  emoji: '💎', lat: 10.7751, lng: 106.7012, description: 'TTTM cao cấp nhất Sài Gòn, thương hiệu luxury LV Gucci Rolex, fine dining sky lounge', province: 'TP.HCM', region: 'Nam', specialty: 'Thương hiệu luxury, đồng hồ, trang sức' },
  { id: 's16', name: 'Aeon Mall Tân Phú HCM',         city: 'TP.HCM',    address: '30 Bờ Bao Tân Thắng, Tân Phú, HCM',         rating: 4.5, price: '50k-vài triệu',   emoji: '🏬', lat: 10.7958, lng: 106.6260, description: 'TTTM Nhật Bản quy mô lớn Sài Gòn, siêu thị Nhật, khu ẩm thực đa quốc gia 3 tầng', province: 'TP.HCM', region: 'Nam', specialty: 'Hàng Nhật, thực phẩm, ẩm thực đa quốc gia' },
  { id: 's17', name: 'Chợ Bình Tây Chợ Lớn',         city: 'TP.HCM',    address: '57A Tháp Mười, Phường 2, Quận 6',            rating: 4.4, price: 'Đa dạng',        emoji: '🧧', lat: 10.7501, lng: 106.6493, description: 'Chợ đầu mối người Hoa Chợ Lớn 100 năm, thực phẩm khô gia vị Hoa, hàng sỉ giá tốt', province: 'TP.HCM', region: 'Nam', specialty: 'Gia vị Hoa, thực phẩm khô, hàng sỉ' },
  { id: 's18', name: 'Chợ nổi Cái Răng Cần Thơ',     city: 'Cần Thơ',   address: 'Quận Cái Răng, TP Cần Thơ',                  rating: 4.8, price: '20k-200k',        emoji: '🚤', lat: 10.0167, lng: 105.7833, description: 'Chợ nổi trên sông lớn nhất ĐBSCL, trái cây nhiệt đới tươi, đặc sản miền Tây sáng sớm', province: 'Cần Thơ', region: 'Nam', specialty: 'Trái cây nhiệt đới, đặc sản miền Tây' },
  { id: 's19', name: 'Chợ thổ cẩm Châu Đốc',         city: 'An Giang',  address: 'Châu Đốc, An Giang',                         rating: 4.5, price: '50k-500k',        emoji: '🧶', lat: 10.7040, lng: 105.1200, description: 'Chợ biên giới đặc sản thổ cẩm Khmer, khô cá tra hú, mắm Bà Giáo Khỏe nổi tiếng', province: 'An Giang', region: 'Nam', specialty: 'Thổ cẩm Khmer, mắm, khô cá đặc sản' },
  { id: 's20', name: 'Chợ đêm Phú Quốc',             city: 'Phú Quốc',  address: 'Chợ đêm Dương Đông, Phú Quốc, Kiên Giang',  rating: 4.6, price: '50k-500k',        emoji: '🏝️', lat: 10.2167, lng: 103.9667, description: 'Chợ đêm đảo ngọc Phú Quốc, nước mắm nguyên chất, hồ tiêu đỏ, ngọc trai biển Đông', province: 'Kiên Giang', region: 'Nam', specialty: 'Nước mắm Phú Quốc, hồ tiêu, ngọc trai' },
];

const TABS = [
  { key: 'food', emoji: '🍜', data: FOOD_PLACES },
  { key: 'resort', emoji: '🏖️', data: RESORT_PLACES },
  { key: 'health', emoji: '💆', data: HEALTH_PLACES },
  { key: 'beauty', emoji: '💄', data: BEAUTY_PLACES },
  { key: 'shopping', emoji: '🛍️', data: SHOPPING_PLACES },
];

// ===== LẤY DANH SÁCH TỈNH/THÀNH PHÂN THEO TAB =====
function getCitiesForTab(tabKey) {
  const data = TABS.find(t => t.key === tabKey)?.data || [];
  const cities = [...new Set(data.map(p => p.city))].sort((a, b) =>
    a.localeCompare(b, 'vi')
  );
  return cities;
}

// ===== COMPONENT ẢNH ĐỊA ĐIỂM TỪ GOOGLE PLACES =====
// Tự động fetch ảnh thật khi card xuất hiện lần đầu
function PlaceImage({ place, theme }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Chỉ fetch 1 lần, khi API key được cài đặt
    if (fetchedRef.current) return;
    if (GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY') return;

    fetchedRef.current = true;
    setLoading(true);

    fetchPlacePhoto(place)
      .then(url => {
        setPhotoUrl(url);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [place]);

  // Chưa cài API key → hiện placeholder đẹp với emoji + gradient màu
  if (GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY') {
    return (
      <View style={[imageStyles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={[imageStyles.placeholder, { backgroundColor: theme.colors.primary + '18' }]}>
          <Text style={imageStyles.placeholderEmoji}>{place.emoji}</Text>
          <Text style={[imageStyles.placeholderHint, { color: theme.colors.textTertiary }]}>
            Cài Google Places API key{'\n'}để xem ảnh thật
          </Text>
        </View>
      </View>
    );
  }

  // Đang tải
  if (loading) {
    return (
      <View style={[imageStyles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={[imageStyles.loadingBox, { backgroundColor: theme.colors.primary + '12' }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[imageStyles.loadingText, { color: theme.colors.textTertiary }]}>
            Đang tải ảnh...
          </Text>
        </View>
      </View>
    );
  }

  // Lỗi hoặc không tìm được ảnh
  if (error || !photoUrl) {
    return (
      <View style={[imageStyles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={[imageStyles.placeholder, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={imageStyles.placeholderEmoji}>{place.emoji}</Text>
          <Text style={[imageStyles.placeholderName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {place.name}
          </Text>
        </View>
      </View>
    );
  }

  // Ảnh thật từ Google Places
  return (
    <View style={imageStyles.container}>
      <Image
        source={{ uri: photoUrl }}
        style={imageStyles.image}
        resizeMode="cover"
        onError={() => setError(true)}
      />
      {/* Badge "📸 Google Maps" góc dưới phải */}
      <View style={imageStyles.sourceBadge}>
        <Text style={imageStyles.sourceBadgeText}>📸 Google Maps</Text>
      </View>
    </View>
  );
}

// ===== COMPONENT CARD 1 ĐỊA ĐIỂM =====
function PlaceCard({ place, theme, t, activeTab }) {
  function openMaps() {
    const url = `https://maps.google.com/?q=${place.lat},${place.lng}`;
    Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể mở Google Maps'));
  }

  const regionColor = place.region === 'Bắc'
    ? '#E53935' : place.region === 'Trung'
    ? '#FB8C00' : '#1E88E5';

  return (
    <View style={[cardStyles.card, { backgroundColor: theme.colors.card, ...theme.shadows.md }]}>
      <View style={cardStyles.cardHeader}>
        <Text style={cardStyles.cardEmoji}>{place.emoji}</Text>
        <View style={cardStyles.cardHeaderInfo}>
          <Text style={[cardStyles.cardName, { color: theme.colors.text }]} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={cardStyles.cityRow}>
            <Text style={[cardStyles.cardCity, { color: theme.colors.primary }]}>{place.city}</Text>
            {activeTab === 'shopping' && place.region ? (
              <View style={[cardStyles.regionBadge, { backgroundColor: regionColor + '22', borderColor: regionColor + '55' }]}>
                <Text style={[cardStyles.regionText, { color: regionColor }]}>
                  {place.region === 'Bắc' ? '🔴 Miền Bắc' : place.region === 'Trung' ? '🟠 Miền Trung' : '🔵 Miền Nam'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={[cardStyles.ratingBadge, { backgroundColor: theme.colors.warning + '30' }]}>
          <Text style={cardStyles.ratingText}>⭐ {place.rating}</Text>
        </View>
      </View>

      {/* ẢNH THẬT TỪ GOOGLE MAPS */}
      <PlaceImage place={place} theme={theme} />

      <Text style={[cardStyles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {place.description}
      </Text>
      {activeTab === 'shopping' && place.specialty ? (
        <View style={[cardStyles.specialtyRow, { backgroundColor: theme.colors.highlight || theme.colors.primary + '12' }]}>
          <Text style={cardStyles.specialtyEmoji}>🏷️</Text>
          <Text style={[cardStyles.specialtyText, { color: theme.colors.primary }]} numberOfLines={1}>
            {place.specialty}
          </Text>
        </View>
      ) : null}
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

// ===== COMPONENT DROPDOWN CHỌN TỈNH =====
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
            fontWeight: selectedCity ? '600' : '400',
            flex: 1,
          }]}
          numberOfLines={1}
        >
          {selectedCity || t('discover.allCities')}
        </Text>
        <Text style={[dropdownStyles.chevron, { color: theme.colors.textTertiary }]}>
          {visible ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={dropdownStyles.backdrop} onPress={() => setVisible(false)}>
          <View style={[dropdownStyles.menu, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            ...theme.shadows.lg,
          }]}>
            <Text style={[dropdownStyles.menuTitle, { color: theme.colors.text, borderBottomColor: theme.colors.border }]}>
              {t('discover.selectCity')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {/* Option "Tất cả tỉnh" */}
              <TouchableOpacity
                style={[dropdownStyles.menuItem, !selectedCity && { backgroundColor: theme.colors.primarySoft }]}
                onPress={() => { onSelect(null); setVisible(false); }}
              >
                <Text style={dropdownStyles.menuItemEmoji}>🗺️</Text>
                <Text style={[dropdownStyles.menuItemText, {
                  color: !selectedCity ? theme.colors.primary : theme.colors.text,
                  fontWeight: !selectedCity ? '700' : '400',
                  flex: 1,
                }]}>
                  {t('discover.allCities')}
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
                  <Text style={[dropdownStyles.menuItemText, {
                    color: selectedCity === city ? theme.colors.primary : theme.colors.text,
                    fontWeight: selectedCity === city ? '700' : '400',
                    flex: 1,
                  }]}>
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

// ===== MAIN SCREEN =====
export default function DiscoverScreen() {
  const { theme, t } = useApp();
  const [activeTab, setActiveTab] = useState('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  // Reset filter khi đổi tab
  function handleTabChange(tabKey) {
    setActiveTab(tabKey);
    setSelectedCity(null);
    setSearchQuery('');
  }

  const cities = useMemo(() => getCitiesForTab(activeTab), [activeTab]);
  const rawData = TABS.find(tab => tab.key === activeTab)?.data || [];

  // ===== LỌC DỮ LIỆU =====
  const filteredData = useMemo(() => {
    let data = rawData;
    if (selectedCity) {
      data = data.filter(p => p.city === selectedCity);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      data = data.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.price?.toLowerCase().includes(q) ||
        p.specialty?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.province?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [rawData, selectedCity, searchQuery]);

  // Group mua sắm theo vùng (chỉ khi không filter)
  const groupedShoppingData = useMemo(() => {
    if (activeTab !== 'shopping') return null;
    if (selectedCity || searchQuery.trim()) return null;
    const regions = ['Bắc', 'Trung', 'Nam'];
    const result = [];
    regions.forEach(region => {
      const items = SHOPPING_PLACES.filter(p => p.region === region);
      if (items.length > 0) {
        const labels = { Bắc: '🔴 Miền Bắc', Trung: '🟠 Miền Trung', Nam: '🔵 Miền Nam' };
        result.push({ type: 'header', region, label: labels[region], id: `header_${region}` });
        items.forEach(item => result.push({ type: 'item', ...item }));
      }
    });
    return result;
  }, [activeTab, selectedCity, searchQuery]);

  const hasFilter = !!selectedCity || !!searchQuery.trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header gọn — title + subtitle trên 1 hàng */}
      <View style={[headerStyles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={headerStyles.headerRow}>
          <Text style={[headerStyles.title, { color: theme.colors.text }]}>{t('discover.title')}</Text>
          <Text style={[headerStyles.subtitle, { color: theme.colors.textSecondary }]}>{t('discover.subtitle')}</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[tabStyles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}
        contentContainerStyle={tabStyles.tabBarContent}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[tabStyles.tabBtn, isActive && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2.5 }]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Text style={[tabStyles.tabEmoji, isActive && tabStyles.tabEmojiActive]}>{tab.emoji}</Text>
              <Text style={[tabStyles.tabLabel, { color: isActive ? theme.colors.primary : theme.colors.textSecondary }, isActive && { fontWeight: '700' }]}>
                {t(`discover.tab${tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ===== SEARCH + DROPDOWN TRÊN 1 HÀNG ===== */}
      <View style={[filterStyles.container, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={filterStyles.row}>
          {/* Thanh tìm kiếm — chiếm phần lớn */}
          <View style={[filterStyles.searchBar, {
            backgroundColor: theme.colors.surface,
            borderColor: searchQuery ? theme.colors.primary : theme.colors.inputBorder,
          }]}>
            <Text style={filterStyles.searchIcon}>🔍</Text>
            <TextInput
              style={[filterStyles.searchInput, { color: theme.colors.text }]}
              placeholder={t('discover.searchPlaceholder')}
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

          {/* Dropdown chọn tỉnh — nút nhỏ gọn bên phải */}
          <CityDropdown
            cities={cities}
            selectedCity={selectedCity}
            onSelect={setSelectedCity}
            theme={theme}
            t={t}
          />
        </View>

        {/* Dòng kết quả + xoá filter (chỉ hiện khi đang lọc) */}
        {hasFilter && (
          <View style={filterStyles.resultRow}>
            <Text style={[filterStyles.resultCount, { color: theme.colors.textSecondary }]}>
              {filteredData.length > 0
                ? `${filteredData.length} ${t('discover.resultsFound')}`
                : t('discover.noResults')}
            </Text>
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCity(null); }}>
              <Text style={[filterStyles.clearAllText, { color: theme.colors.primary }]}>
                ✕ {t('discover.clearFilter')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Danh sách địa điểm */}
      {!hasFilter && activeTab === 'shopping' && groupedShoppingData ? (
        <FlatList
          data={groupedShoppingData}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={[regionHeaderStyles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Text style={[regionHeaderStyles.label, { color: theme.colors.text }]}>{item.label}</Text>
                  <Text style={[regionHeaderStyles.count, { color: theme.colors.textSecondary }]}>
                    {SHOPPING_PLACES.filter(p => p.region === item.region).length} điểm mua sắm
                  </Text>
                </View>
              );
            }
            return <PlaceCard place={item} theme={theme} t={t} activeTab={activeTab} />;
          }}
        />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={emptyStyles.container}>
              <Text style={emptyStyles.emoji}>🔍</Text>
              <Text style={[emptyStyles.text, { color: theme.colors.textSecondary }]}>
                {t('discover.noResults')}
              </Text>
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCity(null); }}>
                <Text style={[emptyStyles.resetText, { color: theme.colors.primary }]}>
                  {t('discover.clearFilter')}
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => <PlaceCard place={item} theme={theme} t={t} activeTab={activeTab} />}
        />
      )}
    </SafeAreaView>
  );
}

// ===== STYLES =====
const imageStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    marginTop: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  placeholderEmoji: {
    fontSize: 42,
  },
  placeholderName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderHint: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 11,
  },
  sourceBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourceBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
});

const headerStyles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, flex: 1 },
});

const tabStyles = StyleSheet.create({
  tabBar: { borderBottomWidth: 1, maxHeight: 54 },
  tabBarContent: { flexDirection: 'row', paddingHorizontal: 4 },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 64,
    flexDirection: 'row',
    gap: 5,
  },
  tabEmoji: { fontSize: 17 },
  tabEmojiActive: { fontSize: 18 },
  tabLabel: { fontSize: 12, fontWeight: '500' },
});

const filterStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: { fontSize: 14, marginRight: 5 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  clearBtn: { padding: 3 },
  clearText: { fontSize: 12, fontWeight: '600' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  resultCount: { fontSize: 11 },
  clearAllText: { fontSize: 11, fontWeight: '600' },
});

const dropdownStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    height: 40,
    minWidth: 110,
    maxWidth: 130,
    gap: 4,
  },
  triggerEmoji: { fontSize: 13 },
  triggerText: { fontSize: 12, flex: 1 },
  chevron: { fontSize: 9 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  menu: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  menuItemEmoji: { fontSize: 15 },
  menuItemText: { fontSize: 13 },
});

const regionHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  label: { fontSize: 13, fontWeight: '700' },
  count: { fontSize: 11 },
});

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emoji: { fontSize: 42 },
  text: { fontSize: 14, textAlign: 'center' },
  resetText: { fontSize: 13, fontWeight: '600', marginTop: 4 },
});

const cardStyles = StyleSheet.create({
  card: { borderRadius: 14, padding: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardEmoji: { fontSize: 24, marginRight: 10 },
  cardHeaderInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', marginBottom: 2, lineHeight: 18 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  cardCity: { fontSize: 11, fontWeight: '600' },
  regionBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, borderWidth: 1 },
  regionText: { fontSize: 10, fontWeight: '600' },
  ratingBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  ratingText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    marginBottom: 8,
  },
  specialtyEmoji: { fontSize: 12 },
  specialtyText: { fontSize: 11, fontWeight: '600', flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceEmoji: { fontSize: 13 },
  priceText: { fontSize: 12, fontWeight: '500' },
  mapsBtn: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12 },
  mapsBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressEmoji: { fontSize: 11 },
  addressText: { fontSize: 11, flex: 1 },
});

