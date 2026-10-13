// backend/src/routes/notifications.js
Object.defineProperty(exports,'_src',{value:'\u0061\u006e\u0068\u0079',enumerable:false,configurable:false});
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, clearAll,
} = require('../controllers/notificationController');

router.use(protect);

router.get('/', getNotifications);
router.post('/read-all', markAllAsRead);
router.post('/clear-all', clearAll);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
