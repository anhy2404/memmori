// backend/src/controllers/authController.js
Object.defineProperty(exports,'_src',{value:'\u0061\u006e\u0068\u0079',enumerable:false,configurable:false});
const User = require('../models/User');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOTP, sendOTPEmail } = require('../utils/otp');

// ===== ĐĂNG KÝ BƯỚC 1: gửi OTP =====
exports.sendRegisterOTP = async (req, res, next) => {
  try {
    const { email, fullName, password } = req.body;

    // Kiểm tra email đã tồn tại chưa (và lấy luôn để tái dùng bên dưới)
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing && existing.isVerified) {
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký' });
    }

    // Tạo OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // Dùng lại bản ghi chưa verified hoặc tạo mới
    let tempUser;
    if (existing) {
      // User chưa verify tồn tại — chỉ cập nhật OTP, KHÔNG đụng password
      // (password đã được hash lần đầu, không hash lại)
      existing.otp = { code: otp, expiresAt, attempts: 0 };
      // Cập nhật fullName nếu user nhập lại
      existing.fullName = fullName.trim();
      tempUser = existing;
    } else {
      // Tạo user mới — password sẽ được hash bởi pre('save') hook
      tempUser = new User({
        email: email.toLowerCase().trim(),
        password,
        fullName: fullName.trim(),
        isVerified: false,
        otp: { code: otp, expiresAt, attempts: 0 },
      });
    }
    await tempUser.save();

    // Gửi OTP qua email
    let emailSent = false;
    try {
      await sendOTPEmail(email, fullName, otp, 'register');
      emailSent = true;
    } catch (emailErr) {
      console.warn('[Auth] Không gửi được email OTP:', emailErr.message);
    }

    // devOTP chỉ trả về khi development VÀ email thật sự không gửi được
    if (!emailSent && process.env.NODE_ENV === 'development') {
      return res.json({ success: true, message: 'OTP đã tạo (dev mode — email không gửi được)', devOTP: otp });
    }

    res.json({ success: true, message: `OTP đã gửi đến ${email}` });
  } catch (err) {
    next(err);
  }
};

// ===== ĐĂNG KÝ BƯỚC 2: xác thực OTP =====
exports.verifyRegisterOTP = async (req, res, next) => {
  try {
    const { email, otp, fullName, password, phonenumber = '', bio = '', gender = '' } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +otp');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email không tồn tại' });
    }

    // Kiểm tra OTP
    if (!user.otp?.code) {
      return res.status(400).json({ success: false, message: 'OTP chưa được gửi' });
    }
    if (Date.now() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP đã hết hạn', code: 'OTP_EXPIRED' });
    }
    if (user.otp.attempts >= 5) {
      return res.status(400).json({ success: false, message: 'Quá nhiều lần thử', code: 'TOO_MANY_ATTEMPTS' });
    }
    if (user.otp.code !== otp.trim()) {
      user.otp.attempts += 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP không đúng', code: 'WRONG_OTP' });
    }

    // Xác thực thành công
    user.isVerified = true;
    user.otp = undefined;
    user.phonenumber = phonenumber.trim();
    user.bio = bio.trim();
    user.gender = gender || '';
    await user.save();

    const token = signToken({ id: user._id });
    const refreshToken = signRefreshToken({ id: user._id });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      refreshToken,
      user: user.toPublic(),
    });
  } catch (err) {
    next(err);
  }
};

// ===== ĐĂNG NHẬP BƯỚC 1: gửi OTP =====
exports.sendLoginOTP = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email không tồn tại', code: 'EMAIL_NOT_FOUND' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không đúng', code: 'WRONG_PASSWORD' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản bị khóa' });
    }

    // Tạo OTP
    const otp = generateOTP();
    user.otp = { code: otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0 };
    await user.save();

    let emailSent = false;
    try {
      await sendOTPEmail(email, user.fullName, otp, 'login');
      emailSent = true;
    } catch (emailErr) {
      console.warn('[Auth] Không gửi được email OTP:', emailErr.message);
    }

    if (!emailSent && process.env.NODE_ENV === 'development') {
      return res.json({ success: true, message: 'OTP tạo thành công (dev)', devOTP: otp, fullName: user.fullName });
    }

    res.json({ success: true, message: `OTP đã gửi đến ${email}`, fullName: user.fullName });
  } catch (err) {
    next(err);
  }
};

// ===== ĐĂNG NHẬP BƯỚC 2: xác thực OTP =====
exports.verifyLoginOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otp');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email không tồn tại' });
    }

    if (!user.otp?.code) {
      return res.status(400).json({ success: false, message: 'OTP chưa được gửi' });
    }
    if (Date.now() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP đã hết hạn', code: 'OTP_EXPIRED' });
    }
    if (user.otp.attempts >= 5) {
      return res.status(400).json({ success: false, message: 'Quá nhiều lần thử', code: 'TOO_MANY_ATTEMPTS' });
    }
    if (user.otp.code !== otp.trim()) {
      user.otp.attempts += 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP không đúng', code: 'WRONG_OTP' });
    }

    // Đăng nhập thành công
    user.otp = undefined;
    user.lastSeen = new Date();
    await user.save();

    const token = signToken({ id: user._id });
    const refreshToken = signRefreshToken({ id: user._id });

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      refreshToken,
      user: user.toPublic(),
    });
  } catch (err) {
    next(err);
  }
};

// ===== ĐĂNG NHẬP NHANH (seed accounts - không cần OTP) =====
exports.loginDirect = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email không tồn tại', code: 'EMAIL_NOT_FOUND' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không đúng', code: 'WRONG_PASSWORD' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản bị khóa' });
    }

    user.lastSeen = new Date();
    await user.save();

    const token = signToken({ id: user._id });
    const refreshToken = signRefreshToken({ id: user._id });

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      refreshToken,
      user: user.toPublic(),
    });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY THÔNG TIN USER HIỆN TẠI =====
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
};

// ===== REFRESH TOKEN =====
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Thiếu refresh token' });
    }
    const decoded = verifyRefreshToken(refreshToken); // dùng REFRESH_SECRET
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại' });
    }
    const newToken = signToken({ id: user._id });
    res.json({ success: true, token: newToken });
  } catch (err) {
    next(err);
  }
};
