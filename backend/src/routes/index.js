const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { avatarUpload, resumeUpload } = require('../middleware/upload');
const A = require('../controllers/authController');
const C = require('../controllers/catalogController');
const L = require('../controllers/learningController');
const AD = require('../controllers/adminController');

const r = express.Router();

// ── Auth ──
r.post('/auth/register', A.register);
r.post('/auth/login', A.login);
r.post('/auth/verify-login-otp', A.verifyLoginOtp);
r.post('/auth/resend-login-otp', A.resendLoginOtp);
r.post('/auth/google', A.google);
r.post('/auth/forgot', A.forgot);
r.post('/auth/reset', A.reset);
r.get('/auth/me', auth, A.me);
r.put('/auth/profile', auth, A.updateProfile);
r.post('/auth/avatar', auth, avatarUpload.single('avatar'), A.uploadAvatar);
r.post('/auth/resume', auth, resumeUpload.single('resume'), A.uploadResume);
r.get('/auth/notifications', auth, A.listNotifications);
r.post('/auth/notifications/read-all', auth, A.readAllNotifications);
r.post('/auth/notifications/:id/read', auth, A.readNotification);

// ── User skills ──
r.post('/skills', auth, L.addSkill);
r.delete('/skills/:name', auth, L.removeSkill);

// ── AI analysis / roadmap / progress / dashboard ──
r.post('/analysis', auth, L.runAnalysis);
r.get('/analysis/latest', auth, L.latestAnalysis);
r.get('/analysis/history', auth, L.analysisHistory);
r.get('/roadmap', auth, L.getRoadmap);
r.post('/roadmap', auth, L.buildRoadmap);
r.patch('/roadmap/task', auth, L.toggleTask);
r.get('/progress', auth, L.getProgress);
r.post('/progress/complete', auth, L.completeItem);
r.get('/dashboard', auth, L.dashboard);

// ── Public catalog ──
for (const e of ['skills', 'job-roles', 'courses', 'projects', 'certifications', 'resources']) {
  r.get(`/${e}`, C.list(e));
  r.get(`/${e}/:id`, C.getOne(e));
}

// ── Admin ──
r.get('/admin/stats', auth, adminOnly, AD.stats);
r.get('/admin/users', auth, adminOnly, AD.listUsers);
r.patch('/admin/users/:id', auth, adminOnly, AD.updateUser);
r.delete('/admin/users/:id', auth, adminOnly, AD.deleteUser);
r.post('/admin/announce', auth, adminOnly, AD.announce);
for (const e of ['skills', 'job-roles', 'courses', 'projects', 'certifications', 'resources']) {
  r.post(`/admin/${e}`, auth, adminOnly, C.createOne(e));
  r.put(`/admin/${e}/:id`, auth, adminOnly, C.updateOne(e));
  r.delete(`/admin/${e}/:id`, auth, adminOnly, C.deleteOne(e));
}

module.exports = r;
