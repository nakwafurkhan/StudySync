const express = require('express');
const { chat } = require('../controllers/assistant.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/chat', chat);

module.exports = router;
