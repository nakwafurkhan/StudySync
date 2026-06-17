const express = require('express');
const {
  exportSessionsCsv,
  exportCalendarCsv,
  exportReportPdf,
} = require('../controllers/export.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/sessions.csv', exportSessionsCsv);
router.get('/calendar.csv', exportCalendarCsv);
router.get('/report.pdf', exportReportPdf);

module.exports = router;
