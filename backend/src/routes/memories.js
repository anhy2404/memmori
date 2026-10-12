// backend/src/routes/memories.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { uploadMemoryPhotos } = require('../middleware/upload');
const {
  createMemory, getMyMemories, getMemoriesWithLocation,
  getPublicMemories, getMemoryById, updateMemory, deleteMemory, getStats,
} = require('../controllers/memoryController');

router.use(protect);

router.post('/', uploadMemoryPhotos.array('photos', 10), createMemory);
router.get('/my', getMyMemories);
router.get('/map', getMemoriesWithLocation);
router.get('/feed', getPublicMemories);
router.get('/stats', getStats);
router.get('/:id', getMemoryById);
router.patch('/:id', updateMemory);
router.delete('/:id', deleteMemory);

module.exports = router;
