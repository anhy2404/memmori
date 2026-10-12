// backend/src/routes/auth.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  sendRegisterOTP, verifyRegisterOTP,
  sendLoginOTP, verifyLoginOTP,
  loginDirect, getMe, refreshToken,
} = require('../controllers/authController');

router.post('/register/send-otp', sendRegisterOTP);
router.post('/register/verify-otp', verifyRegisterOTP);
router.post('/login/send-otp', sendLoginOTP);
router.post('/login/verify-otp', verifyLoginOTP);
router.post('/login/direct', loginDirect);       // seed accounts
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);

module.exports = router;
