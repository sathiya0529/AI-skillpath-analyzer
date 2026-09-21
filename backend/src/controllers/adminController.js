const { User, JobRole, Skill, Course, Project, Certification, Resource, Analysis, Roadmap } = require('../models');
const { broadcast } = require('../services/notify');

async function stats(req, res, next) {
  try {
    const [users, roles, skills, courses, projects, certs, resources, analyses] = await Promise.all([
      User.find(), JobRole.find(), Skill.find(), Course.find(), Project.find(), Certification.find(), Resource.find(), Analysis.find(),
    ]);
    const allUsers = users.filter((u) => u.role !== 'admin');
    const last7 = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), users: allUsers.filter((u) => String(u.createdAt || '').slice(0, 10) === key).length, analyses: analyses.filter((a) => String(a.createdAt || '').slice(0, 10) === key).length };
    });
    const roleDist = {};
    for (const u of allUsers) if (u.targetRole) roleDist[u.targetRole] = (roleDist[u.targetRole] || 0) + 1;
    const skillFreq = {};
    for (const u of allUsers) for (const s of (u.skills || [])) skillFreq[s.name] = (skillFreq[s.name] || 0) + 1;
    const topSkills = Object.entries(skillFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
    const avgReadiness = analyses.length ? Math.round(analyses.reduce((s, a) => s + (a.readinessScore || 0), 0) / analyses.length) : 0;
    res.json({
      totals: { users: allUsers.length, admins: users.length - allUsers.length, roles: roles.length, skills: skills.length, courses: courses.length, projects: projects.length, certifications: certs.length, resources: resources.length, analyses: analyses.length },
      last7, roleDist, topSkills, avgReadiness,
    });
  } catch (e) { next(e); }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.find();
    res.json({ users: users.map(({ passwordHash, ...u }) => u).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  } catch (e) { next(e); }
}

async function updateUser(req, res, next) {
  try {
    const { role, name, targetRole } = req.body;
    const patch = {};
    if (role) patch.role = role;
    if (name) patch.name = name;
    if (targetRole !== undefined) patch.targetRole = targetRole;
    const u = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!u) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safe } = u;
    res.json({ user: safe });
  } catch (e) { next(e); }
}

async function deleteUser(req, res, next) {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: 'User not found' });
    if (u.email === req.user.email) return res.status(400).json({ error: 'You cannot delete your own admin account' });
    await User.findByIdAndDelete(req.params.id);
    await Analysis.deleteMany({ userEmail: u.email });
    await Roadmap.deleteMany({ userEmail: u.email });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function announce(req, res, next) {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Title and message required' });
    const n = await broadcast({ title, message, type: 'info', link: '/dashboard' });
    res.status(201).json({ notification: n });
  } catch (e) { next(e); }
}

module.exports = { stats, listUsers, updateUser, deleteUser, announce };
