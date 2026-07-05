// src/services/geminiService.js - Google Gemini AI service
// Lưu ý: Thay GEMINI_API_KEY bằng API key thực của bạn từ https://aistudio.google.com/

import { GoogleGenerativeAI } from '@google/generative-ai';

// ===== CẤU HÌNH =====
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Thay bằng API key thực

// Khởi tạo client (chỉ tạo một lần)
let genAI = null;
function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

// Model mặc định
const DEFAULT_MODEL = 'gemini-1.5-flash';

// ===== SYSTEM PROMPT giới hạn chủ đề VN =====
const VIETNAM_SYSTEM_PROMPT = `Bạn là AI trợ lý của ứng dụng MemoryMap - ứng dụng lưu giữ kỷ niệm tại Việt Nam.

NHIỆM VỤ của bạn:
- Tư vấn về địa điểm du lịch, ăn uống, nghỉ dưỡng tại Việt Nam
- Gợi ý caption/mô tả cho ảnh chụp tại Việt Nam  
- Chia sẻ thông tin văn hóa, ẩm thực Việt Nam
- Tư vấn lịch trình du lịch trong nước
- Trả lời các câu hỏi về kỷ niệm và checkin địa điểm

GIỚI HẠN:
- CHỈ trả lời về chủ đề Việt Nam (du lịch, ăn uống, địa điểm, văn hóa)
- Nếu câu hỏi không liên quan đến Việt Nam, lịch sự từ chối và gợi ý câu hỏi phù hợp
- KHÔNG tư vấn về tài chính, luật pháp, y tế, hoặc chủ đề nhạy cảm
- Trả lời bằng ngôn ngữ người dùng đang dùng (Việt/Anh/Trung)

Trả lời ngắn gọn, thực tế, hữu ích. Dùng emoji để sinh động hơn.`;

// ===== CHAT VỚI AI =====
/**
 * Gửi tin nhắn đến AI và nhận phản hồi
 * @param {string} message - Tin nhắn của người dùng
 * @param {string} language - Ngôn ngữ hiện tại (vi/en/zh)
 * @param {Array} history - Lịch sử chat trước đó
 * @returns {Promise<string>} - Phản hồi từ AI
 */
export async function chatWithAI(message, language = 'vi', history = []) {
  try {
    if (!message || message.trim() === '') {
      throw new Error('Tin nhắn không được trống');
    }

    // Kiểm tra API key
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      // Trả về response demo khi chưa có API key
      return getDemoResponse(message, language);
    }

    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    // Chuẩn bị lịch sử chat (chỉ lấy 10 tin nhắn gần nhất để tránh quá dài)
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Thêm ngôn ngữ vào prompt
    const langInstruction = language === 'en'
      ? 'Please respond in English.'
      : language === 'zh'
      ? '请用中文回答。'
      : 'Vui lòng trả lời bằng Tiếng Việt.';

    // Khởi tạo chat session
    const chat = model.startChat({
      history: recentHistory,
      systemInstruction: VIETNAM_SYSTEM_PROMPT + '\n\n' + langInstruction,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim() === '') {
      throw new Error('AI không trả lời được');
    }

    return text.trim();
  } catch (error) {
    console.error('[geminiService] Lỗi chatWithAI:', error);

    // Xử lý các lỗi phổ biến
    if (error.message?.includes('API_KEY') || error.message?.includes('apiKey')) {
      return getDemoResponse(message, language);
    }
    if (error.message?.includes('quota') || error.message?.includes('rate')) {
      const errMsgs = {
        vi: '⚠️ AI đang bận, vui lòng thử lại sau ít phút.',
        en: '⚠️ AI is busy, please try again in a moment.',
        zh: '⚠️ AI正忙，请稍后重试。',
      };
      return errMsgs[language] || errMsgs.vi;
    }

    throw new Error('Dịch vụ AI gặp sự cố: ' + (error.message || 'Lỗi không xác định'));
  }
}

// ===== TẠO CAPTION =====
/**
 * Gợi ý caption cho ảnh/kỷ niệm
 * @param {Object} params - { imageUri, description, location }
 * @returns {Promise<string>} - Caption được đề xuất
 */
export async function generateCaption({ imageUri = null, description = '', location = '' }) {
  try {
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      return getDemoCaption(location || description);
    }

    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    let prompt = 'Hãy tạo một caption đẹp, cảm xúc bằng tiếng Việt cho kỷ niệm này. ';
    if (location) prompt += `Địa điểm: ${location}. `;
    if (description) prompt += `Mô tả: ${description}. `;
    prompt += 'Caption ngắn gọn (2-3 câu), có cảm xúc, dùng emoji phù hợp. Chỉ trả về caption, không giải thích thêm.';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('[geminiService] Lỗi generateCaption:', error);
    return getDemoCaption(location || description);
  }
}

// ===== PHÂN TÍCH ẢNH =====
/**
 * Phân tích ảnh địa điểm và trả về thông tin
 * @param {string} imageUri - URI của ảnh
 * @returns {Promise<string>} - Mô tả về địa điểm trong ảnh
 */
export async function analyzeImage(imageUri) {
  try {
    if (!imageUri) throw new Error('Không có ảnh để phân tích');
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      return 'Hình ảnh đẹp! Đây có vẻ là một địa điểm thú vị tại Việt Nam. 📸';
    }

    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Đọc ảnh và chuyển thành base64
    const imageData = await fetchImageAsBase64(imageUri);

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageData,
          mimeType: 'image/jpeg',
        },
      },
      'Đây là ảnh địa điểm tại Việt Nam. Hãy mô tả ngắn gọn (1-2 câu) về địa điểm này bằng tiếng Việt. Nếu nhận ra tên địa điểm cụ thể, hãy đề cập. Chỉ trả về mô tả, không giải thích thêm.',
    ]);

    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('[geminiService] Lỗi analyzeImage:', error);
    return 'Không thể phân tích ảnh lúc này.';
  }
}

// ===== TÓM TẮT KỶ NIỆM =====
/**
 * Tóm tắt các kỷ niệm của người dùng
 * @param {Array} memories - Danh sách memories
 * @returns {Promise<string>} - Tóm tắt
 */
export async function summarizeMemories(memories) {
  try {
    if (!memories || memories.length === 0) {
      return 'Chưa có kỷ niệm nào để tóm tắt.';
    }
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      return getDemoSummary(memories);
    }

    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const memorySummary = memories.slice(0, 10).map(m => (
      `- ${m.title} tại ${m.location?.address || 'không rõ địa điểm'} (${new Date(m.createdAt).toLocaleDateString('vi-VN')})`
    )).join('\n');

    const prompt = `Đây là ${memories.length} kỷ niệm gần đây của một người dùng:\n${memorySummary}\n\nHãy tạo một đoạn tóm tắt ngắn gọn, cảm xúc (3-4 câu) bằng tiếng Việt về hành trình kỷ niệm của họ.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('[geminiService] Lỗi summarizeMemories:', error);
    return getDemoSummary(memories);
  }
}

// ===== HELPER: ĐỌC ẢNH BASE64 =====
async function fetchImageAsBase64(uri) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Không thể đọc ảnh: ' + error.message);
  }
}

// ===== DEMO RESPONSES (khi không có API key) =====
function getDemoResponse(message, language) {
  const lowerMsg = message.toLowerCase();

  const responses = {
    vi: [
      '🗺️ Việt Nam có rất nhiều địa điểm đẹp! Từ vịnh Hạ Long hùng vĩ ở miền Bắc, phố cổ Hội An thơ mộng ở miền Trung, đến Phú Quốc xinh đẹp ở miền Nam.',
      '🍜 Ẩm thực Việt Nam rất phong phú! Phở Hà Nội, Bún bò Huế, Bánh mì Sài Gòn - mỗi vùng có một đặc sản riêng không thể nhầm lẫn.',
      '🏖️ Biển Việt Nam tuyệt đẹp! Bãi biển Mỹ Khê (Đà Nẵng), Nha Trang, Phú Quốc đều nằm trong top đẹp nhất châu Á.',
      '🌺 Đà Lạt - thành phố ngàn hoa, khí hậu mát mẻ quanh năm, rất thích hợp để nghỉ dưỡng và chụp ảnh kỷ niệm.',
      '⛺ Vịnh Hạ Long - Di sản thiên nhiên thế giới, với hàng nghìn đảo đá vôi kỳ vĩ. Một trong những cảnh đẹp nhất Việt Nam!',
    ],
    en: [
      '🗺️ Vietnam has countless beautiful destinations! From the majestic Ha Long Bay in the North, to the romantic ancient town of Hoi An in the Central, to the stunning Phu Quoc island in the South.',
      '🍜 Vietnamese cuisine is incredibly diverse! Hanoi Pho, Hue Beef Noodle, Saigon Banh Mi - each region has its unique culinary identity.',
      '🏖️ Vietnamese beaches are stunning! My Khe Beach (Da Nang), Nha Trang, and Phu Quoc are among the most beautiful in Asia.',
    ],
    zh: [
      '🗺️ 越南有许多美丽的地方！从北部壮观的下龙湾，到中部浪漫的古镇会安，再到南部美丽的富国岛。',
      '🍜 越南美食非常丰富！河内河粉、顺化牛肉粉、西贡法棍——每个地区都有其独特的饮食文化。',
    ],
  };

  const langResponses = responses[language] || responses.vi;

  // Thử khớp chủ đề
  if (lowerMsg.includes('hà nội') || lowerMsg.includes('hanoi')) {
    return language === 'vi'
      ? '🏙️ Hà Nội - Thủ đô nghìn năm văn hiến! Bạn nên thăm Hồ Hoàn Kiếm, Văn Miếu Quốc Tử Giám, phố cổ 36 phố phường, và thưởng thức phở, bún chả, cà phê trứng đặc trưng.'
      : langResponses[0];
  }
  if (lowerMsg.includes('hội an') || lowerMsg.includes('hoi an')) {
    return language === 'vi'
      ? '🏮 Hội An - phố cổ thơ mộng với đèn lồng đỏ rực! Đừng bỏ lỡ: Chùa Cầu, phố đi bộ, làng gốm Thanh Hà, và bánh mì Phượng nổi tiếng thế giới.'
      : langResponses[0];
  }
  if (lowerMsg.includes('đà lạt') || lowerMsg.includes('da lat')) {
    return language === 'vi'
      ? '🌸 Đà Lạt - Thành phố ngàn hoa mát mẻ quanh năm! Khí hậu như châu Âu, trái dâu tây tươi ngon, và những vườn hoa rực rỡ. Rất thích hợp để nghỉ dưỡng!'
      : langResponses[Math.floor(Math.random() * langResponses.length)];
  }

  // Trả về random response
  return langResponses[Math.floor(Math.random() * langResponses.length)] +
    '\n\n💡 _Lưu ý: Đây là phản hồi demo. Để sử dụng AI thực, vui lòng cài đặt Gemini API Key trong src/services/geminiService.js_';
}

function getDemoCaption(context) {
  const captions = [
    `✨ Những khoảnh khắc đẹp nhất không phải là những khoảnh khắc hoàn hảo nhất, mà là những khoảnh khắc chạm đến trái tim ta. 💕 ${context ? '#' + context.split(',')[0].trim().replace(/\s+/g, '') : '#memories'} #MemoryMap`,
    `🌸 Mỗi nơi ta đến đều để lại dấu ấn trong ký ức. Đây là một trong những khoảnh khắc tôi sẽ mãi nhớ... 🗺️ #Vietnam #DuLich`,
    `📸 Cuộc sống là tập hợp của những kỷ niệm đẹp. Trân trọng từng khoảnh khắc! 💫 #MemoryMap #KyNiem`,
  ];
  return captions[Math.floor(Math.random() * captions.length)];
}

function getDemoSummary(memories) {
  const count = memories.length;
  const locations = [...new Set(memories.filter(m => m.location?.address).map(m => m.location.address.split(',')[0]))];
  return `🗺️ Bạn đã lưu giữ ${count} kỷ niệm tuyệt đẹp trong hành trình của mình. ${locations.length > 0 ? `Những địa điểm bạn đã khám phá: ${locations.slice(0, 3).join(', ')}.` : ''} Mỗi kỷ niệm là một mảnh ghép quý giá trong cuốn album cuộc đời của bạn. Tiếp tục ghi lại những khoảnh khắc đáng nhớ nhé! ✨`;
}
