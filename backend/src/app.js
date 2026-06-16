const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const healthRoutes = require('./routes/health.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust the platform proxy (Render) so secure cookies + client IPs work.
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — allow the configured frontend origin, with credentials for
// the httpOnly cookie auth added in Phase 2.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// gzip compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Loose global rate limiter. Tighter, auth-specific limits are added in Phase 2.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Routes
app.use('/api/health', healthRoutes);

// 404 + centralized error handling (keep last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
