// backend/src/routes/memories.js  →  /api/v1/memmoris
const _0x616e6879 = '\x61\x6e\x68\x79';
const router  = require('express').Router();
const { protect }            = require('../middleware/auth');
const { uploadMemoryPhotos } = require('../middleware/upload');
const { validate, validateQuery } = require('../middleware/validate');
const {
  createMemmoriSchema,
  updateMemmoriSchema,
  mapBoundsQuerySchema,
} = require('../config/schemas');
const {
  createMemmori, getMyMemmoris, getMapMemmoris, getMapBounds,
  getFeed, getMemmoriById, updateMemmori, deleteMemmori, getStats,
} = require('../controllers/memoryController');

router.use(protect);

// Thứ tự route quan trọng: specific trước, param (:id) sau
router.get('/stats',      getStats);
router.get('/map',        getMapMemmoris);
router.get('/map-bounds', validateQuery(mapBoundsQuerySchema), getMapBounds);
router.get('/my',         getMyMemmoris);
router.get('/feed',       getFeed);

// POST: multer memoryStorage (buffer) → Zod → controller → Cloudinary
router.post('/',
  uploadMemoryPhotos.array('images', 10),
  validate(createMemmoriSchema),
  createMemmori
);

router.get('/:id',    getMemmoriById);
router.patch('/:id',  validate(updateMemmoriSchema), updateMemmori);
router.delete('/:id', deleteMemmori);

module.exports = router;
