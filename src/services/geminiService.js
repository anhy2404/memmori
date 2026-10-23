// src/services/geminiService.js - Google Gemini AI service
const _b = 'YW5oeQ==';
// Thay GEMINI_API_KEY bằng API key thực từ https://aistudio.google.com/

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';

const GEMINI_API_KEY = 'AIzaSyBsjsvN1QmWy5KwxGvYLbIMAZJJ3uYQfTM';
const DEFAULT_MODEL = 'gemini-1.5-flash';

// Singleton client - khởi tạo một lần
let genAI = null;
function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

const VIETNAM_SYSTEM_PROMPT = `Bạn là Memmori AI - trợ lý thông minh của ứng dụng lưu giữ kỷ niệm và khám phá du lịch Việt Nam.

PHONG CÁCH:
- Thân thiện, nhiệt tình như người bạn đồng hành trong chuyến đi
- Câu trả lời cụ thể, thực tế, có giá trị ngay lập tức
- Dùng "bạn" - trung tính, không phân biệt giới tính
- Emoji vừa phải để sinh động, không lạm dụng

CHUYÊN MÔN:
- Địa điểm check-in, tham quan, nghỉ dưỡng tại Việt Nam
- Ẩm thực: đặc sản vùng miền, quán ngon, giá cả
- Lịch trình du lịch: gợi ý thực tế theo ngày/ngân sách
- Caption và mô tả cho ảnh/kỷ niệm
- Văn hóa, phong tục, mẹo du lịch địa phương

GIỚI HẠN:
- Chỉ tư vấn về Việt Nam và kỷ niệm/du lịch
- Không tư vấn tài chính, pháp lý, y tế
- Từ chối lịch sự và gợi ý chủ đề phù hợp nếu hỏi ngoài phạm vi
- Trả lời bằng ngôn ngữ của người dùng (Việt/Anh/Trung)`;

// ===== CHAT VỚI AI =====
export async function chatWithAI(message, language = 'vi', history = []) {
  try {
    if (!message?.trim()) throw new Error('Tin nhắn không được trống');

    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      return getDemoResponse(message, language);
    }

    const langInstruction = language === 'en'
      ? 'Please respond in English.'
      : language === 'zh'
      ? '请用中文回答。'
      : 'Vui lòng trả lời bằng Tiếng Việt.';

    const ai = getGenAI();
    // systemInstruction đặt ở getGenerativeModel theo đúng Gemini SDK docs
    const model = ai.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: VIETNAM_SYSTEM_PROMPT + '\n\n' + langInstruction,
    });

    // Chỉ lấy 10 tin nhắn gần nhất, bỏ tin nhắn welcome
    const recentHistory = history
      .filter(msg => msg.id !== 'welcome' && msg.id !== 'welcome_new')
      .slice(-10)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content || '' }],
      }));

    const chat = model.startChat({
      history: recentHistory,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message.trim());
    const text = result.response.text();

    if (!text?.trim()) throw new Error('AI không trả lời được');
    return text.trim();

  } catch (error) {
    console.error('[geminiService] Lỗi chatWithAI:', error);

    if (error.message?.includes('API_KEY') || error.message?.includes('apiKey')) {
      return getDemoResponse(message, language);
    }
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      const msgs = {
        vi: '⚠️ AI đang bận, vui lòng thử lại sau ít phút.',
        en: '⚠️ AI is busy, please try again in a moment.',
        zh: '⚠️ AI正忙，请稍后重试。',
      };
      return msgs[language] || msgs.vi;
    }

    throw new Error('Dịch vụ AI gặp sự cố: ' + (error.message || 'Lỗi không xác định'));
  }
}

// ===== TẠO CAPTION =====
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

    const contentParts = [];

    // Thêm ảnh nếu có - dùng expo-file-system thay FileReader (RN không có FileReader)
    if (imageUri) {
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        contentParts.push({
          inlineData: { data: base64, mimeType: 'image/jpeg' },
        });
      } catch (imgErr) {
        console.warn('[geminiService] Không thể đọc ảnh, bỏ qua:', imgErr.message);
      }
    }

    contentParts.push(prompt);

    const result = await model.generateContent(contentParts);
    return result.response.text().trim();

  } catch (error) {
    console.error('[geminiService] Lỗi generateCaption:', error);
    return getDemoCaption(location || description);
  }
}

// ===== PHÂN TÍCH ẢNH =====
export async function analyzeImage(imageUri) {
  try {
    if (!imageUri) throw new Error('Không có ảnh để phân tích');
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      return 'Hình ảnh đẹp! Đây có vẻ là một địa điểm thú vị tại Việt Nam. 📸';
    }

    // Đọc ảnh bằng expo-file-system (không dùng FileReader - không có trong RN)
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: 'image/jpeg' } },
      'Đây là ảnh địa điểm tại Việt Nam. Hãy mô tả ngắn gọn (1-2 câu) về địa điểm này bằng tiếng Việt. Nếu nhận ra tên địa điểm cụ thể, hãy đề cập. Chỉ trả về mô tả, không giải thích thêm.',
    ]);

    return result.response.text().trim();

  } catch (error) {
    console.error('[geminiService] Lỗi analyzeImage:', error);
    return 'Không thể phân tích ảnh lúc này.';
  }
}

// ===== TÓM TẮT KỶ NIỆM =====
export async function summarizeMemories(memories) {
  try {
    if (!memories?.length) return 'Chưa có kỷ niệm nào để tóm tắt.';

    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      return getDemoSummary(memories);
    }

    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const memorySummary = memories.slice(0, 10).map(m =>
      `- ${m.title} tại ${m.location?.address || 'không rõ địa điểm'} (${new Date(m.createdAt).toLocaleDateString('vi-VN')})`
    ).join('\n');

    const prompt = `Đây là ${memories.length} kỷ niệm gần đây:\n${memorySummary}\n\nHãy tạo đoạn tóm tắt ngắn gọn, cảm xúc (3-4 câu) bằng tiếng Việt về hành trình kỷ niệm này.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();

  } catch (error) {
    console.error('[geminiService] Lỗi summarizeMemories:', error);
    return getDemoSummary(memories);
  }
}

// ===== DEMO RESPONSES =====
function getDemoResponse(message, language) {
  const lowerMsg = (message || '').toLowerCase();

  const responses = {
    vi: [
      '🗺️ Việt Nam có rất nhiều địa điểm đẹp! Từ vịnh Hạ Long hùng vĩ ở miền Bắc, phố cổ Hội An thơ mộng ở miền Trung, đến Phú Quốc xinh đẹp ở miền Nam.',
      '🍜 Ẩm thực Việt Nam rất phong phú! Phở Hà Nội, Bún bò Huế, Bánh mì Sài Gòn - mỗi vùng có một đặc sản riêng không thể nhầm lẫn.',
      '🏖️ Biển Việt Nam tuyệt đẹp! Bãi biển Mỹ Khê (Đà Nẵng), Nha Trang, Phú Quốc đều nằm trong top đẹp nhất châu Á.',
      '🌺 Đà Lạt - thành phố ngàn hoa, khí hậu mát mẻ quanh năm, rất thích hợp để nghỉ dưỡng và chụp ảnh kỷ niệm.',
      '⛺ Vịnh Hạ Long - Di sản thiên nhiên thế giới, với hàng nghìn đảo đá vôi kỳ vĩ. Một trong những cảnh đẹp nhất Việt Nam!',
    ],
    en: [
      '🗺️ Vietnam has countless beautiful destinations! Ha Long Bay in the North, romantic Hoi An in the Center, stunning Phu Quoc in the South.',
      '🍜 Vietnamese cuisine is incredibly diverse! Hanoi Pho, Hue Beef Noodle, Saigon Banh Mi - each region has its unique culinary identity.',
      '🏖️ Vietnamese beaches are stunning! My Khe Beach (Da Nang), Nha Trang, and Phu Quoc are among the most beautiful in Asia.',
    ],
    zh: [
      '🗺️ 越南有许多美丽的地方！北部壮观的下龙湾，中部浪漫的古镇会安，南部美丽的富国岛。',
      '🍜 越南美食非常丰富！河内河粉、顺化牛肉粉、西贡法棍——每个地区都有独特的饮食文化。',
    ],
  };

  const langResponses = responses[language] || responses.vi;

  if (lowerMsg.includes('hà nội') || lowerMsg.includes('hanoi')) {
    return language === 'vi'
      ? '🏙️ Hà Nội - Thủ đô nghìn năm văn hiến! Nên thăm Hồ Hoàn Kiếm, Văn Miếu Quốc Tử Giám, phố cổ 36 phố phường, và thưởng thức phở, bún chả, cà phê trứng đặc trưng.'
      : langResponses[0];
  }
  if (lowerMsg.includes('hội an') || lowerMsg.includes('hoi an')) {
    return language === 'vi'
      ? '🏮 Hội An - phố cổ thơ mộng với đèn lồng đỏ rực! Đừng bỏ lỡ: Chùa Cầu, phố đi bộ, làng gốm Thanh Hà, và bánh mì Phượng nổi tiếng thế giới.'
      : langResponses[0];
  }
  if (lowerMsg.includes('đà lạt') || lowerMsg.includes('da lat')) {
    return language === 'vi'
      ? '🌸 Đà Lạt - Thành phố ngàn hoa mát mẻ quanh năm! Khí hậu như châu Âu, trái dâu tây tươi ngon, vườn hoa rực rỡ. Rất thích hợp để nghỉ dưỡng!'
      : langResponses[Math.floor(Math.random() * langResponses.length)];
  }
  if (lowerMsg.includes('hạ long') || lowerMsg.includes('ha long')) {
    return language === 'vi'
      ? '⛺ Vịnh Hạ Long - Di sản thiên nhiên thế giới UNESCO! Hàng nghìn đảo đá vôi hùng vĩ, hang động kỳ ảo. Nên đặt tour thuyền 2 ngày 1 đêm để trải nghiệm đầy đủ.'
      : langResponses[0];
  }
  if (lowerMsg.includes('phú quốc') || lowerMsg.includes('phu quoc')) {
    return language === 'vi'
      ? '🏝️ Phú Quốc - Đảo ngọc của Việt Nam! Biển xanh trong vắt, cát trắng mịn. Đừng bỏ lỡ hoàng hôn ở Bãi Sao và hải sản tươi tại chợ đêm Dinh Cậu.'
      : langResponses[0];
  }

  const note = language === 'vi'
    ? '\n\n💡 _Demo mode - Cài đặt Gemini API Key để dùng AI thực._'
    : '';
  return langResponses[Math.floor(Math.random() * langResponses.length)] + note;
}

function getDemoCaption(context) {
  const tag = context
    ? '#' + context.split(',')[0].trim().replace(/\s+/g, '').substring(0, 20)
    : '#memories';
  const captions = [
    `✨ Những khoảnh khắc đẹp nhất không phải là những khoảnh khắc hoàn hảo nhất, mà là những khoảnh khắc chạm đến trái tim ta. 💕 ${tag} #Memmori`,
    `🌸 Mỗi nơi ta đến đều để lại dấu ấn trong ký ức. Đây là một trong những khoảnh khắc tôi sẽ mãi nhớ... 🗺️ #Vietnam #DuLich`,
    `📸 Cuộc sống là tập hợp của những kỷ niệm đẹp. Trân trọng từng khoảnh khắc! 💫 #Memmori #KyNiem`,
  ];
  return captions[Math.floor(Math.random() * captions.length)];
}

function getDemoSummary(memories) {
  const count = memories?.length || 0;
  const locations = [...new Set(
    (memories || [])
      .filter(m => m.location?.address)
      .map(m => m.location.address.split(',')[0].trim())
  )].slice(0, 3);
  return `🗺️ Bạn đã lưu giữ ${count} kỷ niệm tuyệt đẹp trong hành trình của mình.${locations.length ? ` Những địa điểm bạn đã khám phá: ${locations.join(', ')}.` : ''} Mỗi kỷ niệm là một mảnh ghép quý giá trong cuốn album cuộc đời của bạn. Tiếp tục ghi lại những khoảnh khắc đáng nhớ nhé! ✨`;
}
