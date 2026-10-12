// backend/src/utils/otp.js
const nodemailer = require('nodemailer');

// Tạo mã OTP 6 số
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gửi email OTP qua Gmail
async function sendOTPEmail(email, fullName, otp, purpose = 'login') {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password Gmail
    },
  });

  const purposeText = purpose === 'register' ? 'đăng ký' : 'đăng nhập';

  const mailOptions = {
    from: `"Memmori App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `[Memmori] Mã OTP ${purposeText} của bạn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Memmori 📸</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Ứng dụng lưu trữ kỷ niệm</p>
        </div>
        <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <p style="color: #333; font-size: 16px;">Xin chào <strong>${fullName || email}</strong>,</p>
          <p style="color: #555;">Mã OTP ${purposeText} của bạn là:</p>
          <div style="background: #f0f4ff; border: 2px dashed #667eea; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #667eea;">${otp}</span>
          </div>
          <p style="color: #e74c3c; font-size: 13px;">⏰ Mã này có hiệu lực trong <strong>5 phút</strong>.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { generateOTP, sendOTPEmail };
