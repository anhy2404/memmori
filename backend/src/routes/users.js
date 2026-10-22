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
  searchUsers, getUserProfile, getAllUsers, deleteUser,
} = require('../controllers/userController');

router.use(protect); // tất cả routes cần auth

// Routes tĩnh PHẢI đứng trước /:userId để tránh bị intercept
router.get('/search', searchUsers);
router.get('/all', adminOnly, getAllUsers);
router.get('/me', (req, res) => res.json({ success: true, user: req.user.toPublic() }));
router.patch('/me',          validate(updateProfileSchema),  updateProfile);
router.patch('/me/password', validate(changePasswordSchema), changePassword);
router.post('/me/avatar', uploadAvatar.single('avatar'), uploadAvatarCtrl);

// Route param đứng cuối
router.get('/:userId', getUserProfile);
router.delete('/:userId', adminOnly, deleteUser);

module.exports = router;
