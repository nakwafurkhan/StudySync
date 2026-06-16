const { rateLimit } = require('express-rate-limit');

// Loose, app-wide limiter (mounted in app.js).
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tight limiter for auth endpoints to slow brute-force attempts.
// Disabled under NODE_ENV=test so the suite isn't throttled.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts, please try again later.' },
});

module.exports = { globalLimiter, authLimiter };
