const express = require('express');
const { createEvent, listEvents, removeEvent } = require('../controllers/calendar.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createEvent);
router.get('/', listEvents);
router.delete('/:id', removeEvent);

module.exports = router;
