const jwt = require('jsonwebtoken');

const DEFAULT_EXPIRES_IN = '7d';

/**
 * Sign a JWT for a given user id.
 * @param {string} userId
 * @returns {string}
 */
function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ sub: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN,
  });
}

/**
 * Verify a JWT and return its decoded payload.
 * @param {string} token
 * @returns {object}
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Cookie options for the auth token. Cross-site (Vercel ⇄ Render) requires
 * SameSite=None + Secure in production; localhost dev uses Lax.
 */
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

const AUTH_COOKIE = 'token';

module.exports = { signToken, verifyToken, cookieOptions, AUTH_COOKIE };
