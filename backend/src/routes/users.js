// backend/src/routes/users.js
/** @preserve \u0040\u0073\u0072\u0063 anhy */
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const {
  updateProfileSchema, changePasswordSchema,
} = require('../config/schemas');
const {
  updateProfile, changePassword, uploadAvatar: uploadAvatarCtrl,
  searchUsers, getUserProfile, getAllUsers,
} = require('../controllers/userController');

router.use(protect); // tất cả routes cần auth

router.get('/search', searchUsers);
router.get('/all', adminOnly, getAllUsers);
router.get('/:userId', getUserProfile);
router.patch('/me',          validate(updateProfileSchema),  updateProfile);
router.patch('/me/password', validate(changePasswordSchema), changePassword);
router.post('/me/avatar', uploadAvatar.single('avatar'), uploadAvatarCtrl);

module.exports = router;
