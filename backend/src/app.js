const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { globalLimiter } = require('./middleware/rateLimiters');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const subjectRoutes = require('./routes/subject.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const sessionRoutes = require('./routes/session.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const calendarRoutes = require('./routes/calendar.routes');
const syllabusRoutes = require('./routes/syllabus.routes');
const exportRoutes = require('./routes/export.routes');
const assistantRoutes = require('./routes/assistant.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust the platform proxy (Render) so secure cookies + client IPs work.
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — allow the configured frontend origin, with credentials so the
// httpOnly auth cookie is sent on cross-origin requests.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// gzip compression
app.use(compression());

// Body + cookie parsing
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Loose global rate limiter. Tighter, auth-specific limits live on /api/auth.
app.use(globalLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/assistant', assistantRoutes);

// 404 + centralized error handling (keep last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
