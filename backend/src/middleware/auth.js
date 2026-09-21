const jwt = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (user) => jwt.sign(
  { sub: String(user._id), email: user.email, role: user.role || 'user' },
  process.env.APP_JWT_SECRET || 'skillpath_dev_secret',
  { expiresIn: process.env.APP_JWT_EXPIRES || '7d' },
);

// Verifies our own app JWT (issued after login/2FA, signup, or Google sign-in).
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.APP_JWT_SECRET || 'skillpath_dev_secret');
    const user = (await User.findById(decoded.sub)) || (await User.findOne({ email: decoded.email }));
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    req.user = user;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

const errorHandler = (err, _req, res, _next) => {
  console.error('API error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
};

module.exports = { auth, adminOnly, signToken, errorHandler };
