const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * GET /api/health
 * Liveness/readiness probe. Reports process uptime and MongoDB connection state.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'studysync-backend',
    timestamp: new Date().toISOString(),
    uptime: Number(process.uptime().toFixed(2)),
    db: DB_STATES[mongoose.connection.readyState] || 'unknown',
  });
});

module.exports = router;
