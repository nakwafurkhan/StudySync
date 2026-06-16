const User = require('../models/User');
const { verifyToken, AUTH_COOKIE } = require('../utils/token');

/**
 * Auth guard. Reads the JWT from the httpOnly cookie (preferred) or a
 * `Bearer` Authorization header (fallback), verifies it, and attaches the
 * user document to `req.user`. Responds 401 when missing/invalid.
 */
async function protect(req, res, next) {
  try {
    let token = req.cookies && req.cookies[AUTH_COOKIE];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { protect };
