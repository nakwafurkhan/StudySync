const express = require('express');
const { generate, getCurrent } = require('../controllers/schedule.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/generate', generate);
router.get('/current', getCurrent);

module.exports = router;
