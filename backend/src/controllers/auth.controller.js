const User = require('../models/User');
const { signToken, cookieOptions, AUTH_COOKIE } = require('../utils/token');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister({ name, email, password }) {
  const errors = [];
  if (!name || !name.trim()) errors.push('Name is required');
  if (!email || !EMAIL_RE.test(email)) errors.push('A valid email is required');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  return errors;
}

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    const errors = validateRegister({ name, email, password });
    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name: name.trim(), email, passwordHash });

    const token = signToken(user.id);
    res.cookie(AUTH_COOKIE, token, cookieOptions());
    return res.status(201).json({ user });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // passwordHash is select:false, so request it explicitly.
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user.id);
    res.cookie(AUTH_COOKIE, token, cookieOptions());
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/auth/me  (protected)
 */
async function getMe(req, res) {
  return res.json({ user: req.user });
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions(), maxAge: undefined });
  return res.json({ message: 'Logged out' });
}

module.exports = { register, login, getMe, logout };
