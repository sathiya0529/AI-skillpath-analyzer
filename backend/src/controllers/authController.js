const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const { User, Skill, Progress, Notification } = require('../models');
const { signToken } = require('../middleware/auth');
const { notifyUser } = require('../services/notify');
const { extractSkillsFromText } = require('../services/aiService');
const { sendOtpEmail, isMailerReady } = require('../services/mailer');
const { verifyGoogleIdToken } = require('../config/google');

const JWT_SECRET = process.env.APP_JWT_SECRET || 'skillpath_dev_secret';
const OTP_TTL_MIN = 10;

const safe = (u) => {
  if (!u) return null;
  const { passwordHash, loginOtpHash, resetOtpHash, ...rest } = u;
  return rest;
};

const genOtp = () => String(crypto.randomInt(100000, 999999));

// Creates + emails a 6-digit login-verification OTP for `user`, and returns a
// short-lived tempToken that must be presented (with the OTP) to finish login.
async function issueLoginOtp(user) {
  const otp = genOtp();
  const loginOtpHash = await bcrypt.hash(otp, 10);
  const loginOtpExpires = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
  await User.findByIdAndUpdate(user._id, { loginOtpHash, loginOtpExpires });
  const mailResult = await sendOtpEmail(user.email, otp, { purpose: 'login', minutes: OTP_TTL_MIN });
  const tempToken = jwt.sign({ sub: String(user._id), purpose: 'login-2fa' }, JWT_SECRET, { expiresIn: '10m' });
  // Only surfaced when no real mailer is configured, so local/dev setups keep working end-to-end.
  const devOtp = mailResult?.devMode && process.env.EXPOSE_OTP_IN_RESPONSE !== 'false' ? otp : undefined;
  return { tempToken, devOtp };
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered. Please log in.' });
    const user = await User.create({
      name, email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10), role: 'user',
    });
    await Progress.create({ userId: String(user._id), userEmail: user.email });
    await notifyUser(user.email, { title: 'Welcome to SkillPath 🎉', message: 'Complete your profile and run your first AI skill analysis.', type: 'success', link: '/profile' });
    res.status(201).json({ token: signToken(user), user: safe(user) });
  } catch (e) { next(e); }
}

// POST /api/auth/login  (step 1 of manual login: password check → emails a 2FA code)
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid email or password' });
    if (!(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
    const { tempToken, devOtp } = await issueLoginOtp(user);
    res.json({ twoFactorRequired: true, tempToken, email: user.email, devOtp });
  } catch (e) { next(e); }
}

// POST /api/auth/google  (real Google Sign-In — verifies the ID token from
// Google Identity Services directly with Google. Single step, no 2FA, since
// Google has already authenticated the person.)
async function google(req, res, next) {
  try {
    const { idToken } = req.body;
    const payload = await verifyGoogleIdToken(idToken);
    const { sub: googleId, email, name, picture } = payload;
    let user = (await User.findOne({ googleId })) || (await User.findOne({ email: email.toLowerCase() }));
    if (!user) {
      user = await User.create({ name: name || email.split('@')[0], email: email.toLowerCase(), photoURL: picture || '', googleId, role: 'user' });
      await Progress.create({ userId: String(user._id), userEmail: user.email });
      await notifyUser(user.email, { title: 'Welcome to SkillPath 🎉', message: 'Signed in with Google. Set a target role to begin.', type: 'success', link: '/gap-analysis' });
    } else if (!user.googleId) {
      user = await User.findByIdAndUpdate(user._id, { googleId, photoURL: user.photoURL || picture || '' }, { new: true });
    }
    res.json({ token: signToken(user), user: safe(user) });
  } catch (e) { next(e); }
}

// POST /api/auth/verify-login-otp  (step 2 of manual login: check the emailed code, issue session)
async function verifyLoginOtp(req, res, next) {
  try {
    const { tempToken, otp } = req.body;
    if (!tempToken || !otp) return res.status(400).json({ error: 'Enter the 6-digit code' });
    let decoded;
    try { decoded = jwt.verify(tempToken, JWT_SECRET); }
    catch { return res.status(400).json({ error: 'Verification session expired. Please log in again.' }); }
    if (decoded.purpose !== 'login-2fa') return res.status(400).json({ error: 'Invalid verification session' });
    const user = await User.findById(decoded.sub);
    if (!user || !user.loginOtpHash || !user.loginOtpExpires) return res.status(400).json({ error: 'No pending verification. Please log in again.' });
    if (new Date(user.loginOtpExpires) < new Date()) return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    const ok = await bcrypt.compare(String(otp), user.loginOtpHash);
    if (!ok) return res.status(400).json({ error: 'Incorrect code. Please try again.' });
    const cleared = await User.findByIdAndUpdate(user._id, { loginOtpHash: null, loginOtpExpires: null }, { new: true });
    res.json({ token: signToken(cleared), user: safe(cleared) });
  } catch (e) { next(e); }
}

// POST /api/auth/resend-login-otp
async function resendLoginOtp(req, res, next) {
  try {
    const { tempToken } = req.body;
    if (!tempToken) return res.status(400).json({ error: 'Missing verification session' });
    let decoded;
    try { decoded = jwt.verify(tempToken, JWT_SECRET); }
    catch { return res.status(400).json({ error: 'Verification session expired. Please log in again.' }); }
    if (decoded.purpose !== 'login-2fa') return res.status(400).json({ error: 'Invalid verification session' });
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(400).json({ error: 'User not found' });
    const { tempToken: newTempToken, devOtp } = await issueLoginOtp(user);
    res.json({ tempToken: newTempToken, devOtp });
  } catch (e) { next(e); }
}

// GET /api/auth/me
async function me(req, res) { res.json({ user: safe(req.user) }); }

// POST /api/auth/forgot  (emails a 6-digit OTP to reset the password)
async function forgot(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    // Always respond the same way whether or not the account exists, to avoid leaking which emails are registered.
    const genericMsg = 'If that email is registered, a 6-digit verification code was sent to it.';
    if (!user) return res.json({ message: genericMsg });
    const otp = genOtp();
    const resetOtpHash = await bcrypt.hash(otp, 10);
    const resetOtpExpires = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
    await User.findByIdAndUpdate(user._id, { resetOtpHash, resetOtpExpires });
    const mailResult = await sendOtpEmail(user.email, otp, { purpose: 'reset', minutes: OTP_TTL_MIN });
    await notifyUser(user.email, { title: 'Password reset requested', message: 'Use the 6-digit code sent to your email (valid 10 min).', type: 'warning', link: '/forgot-password' });
    const devOtp = mailResult?.devMode && process.env.EXPOSE_OTP_IN_RESPONSE !== 'false' ? otp : undefined;
    res.json({ message: genericMsg, devOtp });
  } catch (e) { next(e); }
}

// POST /api/auth/reset  ({ email, otp, password })
async function reset(req, res, next) {
  try {
    const { email, otp, password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (!otp) return res.status(400).json({ error: 'Enter the 6-digit code' });
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user || !user.resetOtpHash || !user.resetOtpExpires) return res.status(400).json({ error: 'Invalid or expired code. Please request a new one.' });
    if (new Date(user.resetOtpExpires) < new Date()) return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    const ok = await bcrypt.compare(String(otp), user.resetOtpHash);
    if (!ok) return res.status(400).json({ error: 'Incorrect code' });
    const passwordHash = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(user._id, { passwordHash, resetOtpHash: null, resetOtpExpires: null });
    res.json({ message: 'Password updated. Please log in.' });
  } catch (e) { next(e); }
}

// PUT /api/auth/profile
async function updateProfile(req, res, next) {
  try {
    const allowed = ['name', 'headline', 'bio', 'location', 'phone', 'website', 'github', 'linkedin', 'targetRole', 'photoURL', 'preferences'];
    const patch = {};
    for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];
    const user = await User.findByIdAndUpdate(req.user._id, patch, { new: true });
    res.json({ user: safe(user) });
  } catch (e) { next(e); }
}

// POST /api/auth/avatar (multipart)
async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const url = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { photoURL: url }, { new: true });
    res.json({ url, user: safe(user) });
  } catch (e) { next(e); }
}

// POST /api/auth/resume (multipart) + skill extraction
async function uploadResume(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume uploaded' });
    let text = '';
    const ext = (req.file.originalname || '').toLowerCase();
    if (/\.(txt|md)$/.test(ext) || /text/.test(req.file.mimetype)) {
      text = fs.readFileSync(req.file.path, 'utf8').slice(0, 20000);
    } else if (/pdf/.test(req.file.mimetype) || /\.pdf$/.test(ext)) {
      try {
        const pdf = require('pdf-parse');
        const data = await pdf(fs.readFileSync(req.file.path));
        text = (data.text || '').slice(0, 20000);
      } catch (e) { text = ''; }
    }
    const known = await Skill.find();
    const extracted = extractSkillsFromText(text, known);
    // merge into profile skills (don't duplicate)
    const current = req.user.skills || [];
    const have = new Set(current.map((s) => s.name.toLowerCase()));
    const merged = [...current];
    for (const s of extracted) {
      if (!have.has(s.name.toLowerCase())) {
        merged.push({ name: s.name, category: 'technical', level: s.level || 2, years: 1 });
      }
    }
    const url = `/uploads/resumes/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, {
      skills: merged,
      resume: { filename: req.file.originalname, url, text: text.slice(0, 8000), uploadedAt: new Date() },
    }, { new: true });
    await notifyUser(req.user.email, { title: 'Resume analyzed 📄', message: `${extracted.length} skill(s) extracted and added to your profile.`, type: 'success', link: '/skills' });
    res.json({ user: safe(user), extracted, chars: text.length });
  } catch (e) { next(e); }
}

// GET /api/auth/notifications
async function listNotifications(req, res, next) {
  try {
    const mine = await Notification.find({ userEmail: req.user.email }, null, { sort: { createdAt: -1 }, limit: 30 });
    const all = await Notification.find({ userEmail: 'all' }, null, { sort: { createdAt: -1 }, limit: 30 });
    const list = [...mine, ...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30);
    res.json({ notifications: list, unread: list.filter((n) => !n.read).length });
  } catch (e) { next(e); }
}

async function readNotification(req, res, next) {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function readAllNotifications(req, res, next) {
  try {
    const list = await Notification.find({ userEmail: req.user.email });
    for (const n of list) await Notification.findByIdAndUpdate(n._id, { read: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = {
  register, login, google, verifyLoginOtp, resendLoginOtp,
  me, forgot, reset, updateProfile, uploadAvatar, uploadResume,
  listNotifications, readNotification, readAllNotifications,
};
