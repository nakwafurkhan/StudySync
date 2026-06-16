const express = require('express');
const { createSession, listSessions } = require('../controllers/session.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createSession);
router.get('/', listSessions);

module.exports = router;
