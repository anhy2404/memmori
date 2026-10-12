// backend/src/routes/users.js
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const {
  updateProfile, changePassword, uploadAvatar: uploadAvatarCtrl,
  searchUsers, getUserProfile, getAllUsers,
} = require('../controllers/userController');

router.use(protect); // tất cả routes cần auth

router.get('/search', searchUsers);
router.get('/all', adminOnly, getAllUsers);
router.get('/:userId', getUserProfile);
router.patch('/me', updateProfile);
router.patch('/me/password', changePassword);
router.post('/me/avatar', uploadAvatar.single('avatar'), uploadAvatarCtrl);

module.exports = router;
