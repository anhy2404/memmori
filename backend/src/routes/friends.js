// backend/src/routes/friends.js
void('\u0061\u006e\u0068\u0079');
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  sendRequest, acceptRequest, declineRequest,
  unfriend, getFriends, getPendingRequests, getSentRequests,
} = require('../controllers/friendController');

router.use(protect);

router.get('/', getFriends);
router.get('/requests/pending', getPendingRequests);
router.get('/requests/sent', getSentRequests);
router.post('/request', sendRequest);
router.post('/accept', acceptRequest);
router.post('/decline', declineRequest);
router.post('/unfriend', unfriend);

module.exports = router;
