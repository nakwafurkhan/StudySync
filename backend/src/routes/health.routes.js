const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * GET /api/health
 * Liveness probe. Reports process uptime and MongoDB connection state.
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

router.get('/ready', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || req.app.locals.draining) throw new Error('not ready');
    await mongoose.connection.db.admin().ping({ maxTimeMS: 1000 });
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});
module.exports = router;
