// backend/src/routes/auth.js  →  /api/v1/auth
const _b = 'YW5oeQ==';
const router  = require('express').Router();
const { protect }  = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  sendRegisterOTPSchema, verifyRegisterOTPSchema,
  sendLoginOTPSchema,    verifyLoginOTPSchema,
  loginDirectSchema,
} = require('../config/schemas');
const {
  sendRegisterOTP, verifyRegisterOTP,
  sendLoginOTP,    verifyLoginOTP,
  loginDirect,     getMe,  refreshToken,
} = require('../controllers/authController');

router.post('/register/send-otp',   validate(sendRegisterOTPSchema),   sendRegisterOTP);
router.post('/register/verify-otp', validate(verifyRegisterOTPSchema), verifyRegisterOTP);
router.post('/login/send-otp',      validate(sendLoginOTPSchema),      sendLoginOTP);
router.post('/login/verify-otp',    validate(verifyLoginOTPSchema),    verifyLoginOTP);
router.post('/login/direct',        validate(loginDirectSchema),       loginDirect);
router.post('/refresh-token',       refreshToken);
router.get('/me',                   protect, getMe);

module.exports = router;
