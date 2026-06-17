const express = require('express');
const multer = require('multer');
const { parse, importItems } = require('../controllers/syllabus.controller');
const { protect } = require('../middleware/auth');

// PDFs are held in memory and parsed on the fly (max 8 MB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = express.Router();

router.use(protect);

router.post('/parse', upload.single('file'), parse);
router.post('/import', importItems);

module.exports = router;
