const { User, JobRole, Course, Project, Certification, Resource, Analysis, Roadmap, Progress } = require('../models');
const { analyzeSkills, generateRoadmap, pickMatches, llmInsights, canon } = require('../services/aiService');
const { notifyUser } = require('../services/notify');

// ── User skills ──
async function addSkill(req, res, next) {
  try {
    const { name, category = 'technical', level = 3, years = 1 } = req.body;
    if (!name) return res.status(400).json({ error: 'Skill name required' });
    const skills = req.user.skills || [];
    const i = skills.findIndex((s) => canon(s.name) === canon(name));
    if (i >= 0) skills[i] = { ...skills[i], category, level: Number(level), years: Number(years) };
    else skills.push({ name: name.trim(), category, level: Number(level), years: Number(years) });
    const user = await User.findByIdAndUpdate(req.user._id, { skills }, { new: true });
    const { passwordHash, ...safe } = user;
    res.json({ user: safe });
  } catch (e) { next(e); }
}

async function removeSkill(req, res, next) {
  try {
    const name = decodeURIComponent(req.params.name).toLowerCase();
    const skills = (req.user.skills || []).filter((s) => s.name.toLowerCase() !== name);
    const user = await User.findByIdAndUpdate(req.user._id, { skills }, { new: true });
    const { passwordHash, ...safe } = user;
    res.json({ user: safe });
  } catch (e) { next(e); }
}

// ── AI Analysis ──
async function runAnalysis(req, res, next) {
  try {
    const targetRole = req.body.targetRole || req.user.targetRole;
    if (!targetRole) return res.status(400).json({ error: 'Select a target job role first' });
    const role = (await JobRole.findOne({ title: targetRole })) || (await JobRole.find());
    const jobRole = role?.title ? role : (Array.isArray(role) ? role[0] : null);
    if (!jobRole) return res.status(404).json({ error: 'Job role not found' });

    // refresh user
    const user = await User.findById(req.user._id);
    if (user.targetRole !== jobRole.title) await User.findByIdAndUpdate(user._id, { targetRole: jobRole.title });

    const gap = analyzeSkills(user.skills || [], jobRole);
    const needNames = [...gap.missing, ...gap.weak].map((s) => s.name);
    const [courses, projects, certifications, resources] = await Promise.all([
      Course.find(), Project.find(), Certification.find(), Resource.find(),
    ]);
    const recommendations = {
      courses: pickMatches(courses, needNames, 6),
      projects: pickMatches(projects.map((p) => ({ ...p, skill: (p.skills || []).join(' ') })), needNames, 4),
      certifications: pickMatches(certifications, needNames, 3),
      resources: pickMatches(resources, needNames, 6),
    };
    // Optional LLM boost (stays on backend)
    const extra = await llmInsights(`Career coach: user targets "${jobRole.title}", readiness ${gap.readinessScore}%. Missing: ${gap.missing.map((s) => s.name).join(', ') || 'none'}. Weak: ${gap.weak.map((s) => s.name).join(', ') || 'none'}. Give 4 crisp actionable tips, one per line.`);
    const insights = extra.length ? [...gap.insights, ...extra.map((t) => t.replace(/^[-*\d.\s]+/, '').slice(0, 220))] : gap.insights;

    const prev = await Analysis.find({ userEmail: user.email }, null, { sort: { createdAt: -1 }, limit: 1 });
    const improved = prev.length ? gap.readinessScore - (prev[0].readinessScore || 0) : 0;

    const doc = await Analysis.create({
      userId: String(user._id), userEmail: user.email, targetRole: jobRole.title,
      currentSkills: user.skills || [], required: gap.required,
      missing: gap.missing, weak: gap.weak, strong: gap.strong,
      readinessScore: gap.readinessScore, gapPercent: gap.gapPercent,
      insights, recommendations,
    });
    await notifyUser(user.email, {
      title: 'AI analysis complete ✨',
      message: `Readiness for ${jobRole.title}: ${gap.readinessScore}%${improved > 0 ? ` (▲ ${improved} improved!)` : ''}`,
      type: improved > 0 ? 'achievement' : 'success', link: '/gap-analysis',
    });
    res.status(201).json({ analysis: doc, improved });
  } catch (e) { next(e); }
}

async function latestAnalysis(req, res, next) {
  try {
    const list = await Analysis.find({ userEmail: req.user.email }, null, { sort: { createdAt: -1 }, limit: 1 });
    res.json({ analysis: list[0] || null });
  } catch (e) { next(e); }
}

async function analysisHistory(req, res, next) {
  try {
    const list = await Analysis.find({ userEmail: req.user.email }, null, { sort: { createdAt: -1 }, limit: 20 });
    res.json({ history: list });
  } catch (e) { next(e); }
}

// ── Roadmap ──
async function getRoadmap(req, res, next) {
  try {
    const list = await Roadmap.find({ userEmail: req.user.email }, null, { sort: { createdAt: -1 }, limit: 1 });
    res.json({ roadmap: list[0] || null });
  } catch (e) { next(e); }
}

async function buildRoadmap(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    const role = (await JobRole.findOne({ title: user.targetRole })) || (await JobRole.find())[0];
    if (!role) return res.status(400).json({ error: 'Set a target job role first' });
    const gap = analyzeSkills(user.skills || [], role);
    const stages = generateRoadmap(role, gap);
    // attach a relevant resource url per task
    const resources = await Resource.find();
    for (const st of stages) for (const t of st.tasks) {
      const hit = resources.find((r) => canon(r.skill || '') === canon(t.skill));
      if (hit) t.resourceUrl = hit.url;
    }
    await Roadmap.deleteMany({ userEmail: user.email });
    const doc = await Roadmap.create({ userId: String(user._id), userEmail: user.email, targetRole: role.title, stages, progress: 0 });
    await notifyUser(user.email, { title: 'Roadmap generated 🗺️', message: `${stages.length} stages created for ${role.title}. Start with Foundation.`, type: 'success', link: '/roadmap' });
    res.status(201).json({ roadmap: doc });
  } catch (e) { next(e); }
}

async function toggleTask(req, res, next) {
  try {
    const { stageIdx, taskIdx } = req.body;
    const list = await Roadmap.find({ userEmail: req.user.email }, null, { sort: { createdAt: -1 }, limit: 1 });
    const rm = list[0];
    if (!rm) return res.status(404).json({ error: 'No roadmap yet' });
    const task = rm.stages?.[stageIdx]?.tasks?.[taskIdx];
    if (!task) return res.status(400).json({ error: 'Task not found' });
    task.status = task.status === 'done' ? 'todo' : 'done';
    const all = rm.stages.flatMap((s) => s.tasks);
    const done = all.filter((t) => t.status === 'done').length;
    rm.progress = all.length ? Math.round((done / all.length) * 100) : 0;
    // persist whole doc
    await Roadmap.findByIdAndUpdate(rm._id, { stages: rm.stages, progress: rm.progress });
    // progress log + auto skill bump
    let prog = await Progress.findOne({ userEmail: req.user.email });
    if (!prog) prog = await Progress.create({ userId: String(req.user._id), userEmail: req.user.email });
    const key = `${stageIdx}:${taskIdx}`;
    if (task.status === 'done') {
      if (!prog.completedTasks.includes(key)) prog.completedTasks.push(key);
      prog.xp += 20;
      prog.history.push({ action: 'task', detail: `Completed "${task.skill}" (${rm.stages[stageIdx].name})`, at: new Date(), xp: 20 });
      // nudge the related skill level up on the profile
      const user = await User.findById(req.user._id);
      const skills = user.skills || [];
      const i = skills.findIndex((s) => canon(s.name) === canon(task.skill));
      if (i >= 0) skills[i].level = Math.min(5, (skills[i].level || 1) + (done % 2 === 0 ? 1 : 0));
      else skills.push({ name: task.skill, category: 'technical', level: 2, years: 1 });
      await User.findByIdAndUpdate(user._id, { skills });
      await Progress.findByIdAndUpdate(prog._id, { completedTasks: prog.completedTasks, xp: prog.xp, history: prog.history.slice(-60), lastActive: new Date() });
      await notifyUser(req.user.email, { title: '+20 XP earned ⚡', message: `Task complete: ${task.skill}. Roadmap ${rm.progress}% done.`, type: 'achievement', link: '/roadmap' });
    } else {
      prog.completedTasks = prog.completedTasks.filter((k) => k !== key);
      await Progress.findByIdAndUpdate(prog._id, { completedTasks: prog.completedTasks });
    }
    const updated = await Roadmap.findById(rm._id);
    res.json({ roadmap: updated });
  } catch (e) { next(e); }
}

// ── Progress ──
async function getProgress(req, res, next) {
  try {
    let prog = await Progress.findOne({ userEmail: req.user.email });
    if (!prog) prog = await Progress.create({ userId: String(req.user._id), userEmail: req.user.email });
    const analyses = await Analysis.find({ userEmail: req.user.email }, null, { sort: { createdAt: -1 }, limit: 10 });
    res.json({ progress: prog, analyses });
  } catch (e) { next(e); }
}

async function completeItem(req, res, next) {
  try {
    const { kind, id, title } = req.body; // kind: course|project
    let prog = await Progress.findOne({ userEmail: req.user.email });
    if (!prog) prog = await Progress.create({ userId: String(req.user._id), userEmail: req.user.email });
    const field = kind === 'project' ? 'completedProjects' : 'completedCourses';
    const arr = prog[field] || [];
    if (!arr.find((c) => String(c.id || c.courseId) === String(id))) {
      arr.push({ id, title, at: new Date() });
      prog.xp += kind === 'project' ? 50 : 30;
      prog.history.push({ action: kind, detail: `Completed ${kind}: ${title}`, at: new Date(), xp: kind === 'project' ? 50 : 30 });
      await Progress.findByIdAndUpdate(prog._id, { [field]: arr, xp: prog.xp, history: prog.history.slice(-60), lastActive: new Date() });
      await notifyUser(req.user.email, { title: `+${kind === 'project' ? 50 : 30} XP earned ⚡`, message: `${kind === 'project' ? 'Project' : 'Course'} completed: ${title}`, type: 'achievement', link: '/progress' });
    }
    const updated = await Progress.findOne({ userEmail: req.user.email });
    res.json({ progress: updated });
  } catch (e) { next(e); }
}

// ── Dashboard aggregate ──
async function dashboard(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    const [analyses, roadmaps, prog, courses] = await Promise.all([
      Analysis.find({ userEmail: user.email }, null, { sort: { createdAt: -1 }, limit: 1 }),
      Roadmap.find({ userEmail: user.email }, null, { sort: { createdAt: -1 }, limit: 1 }),
      Progress.findOne({ userEmail: user.email }),
      Course.find(),
    ]);
    const latest = analyses[0] || null;
    const rm = roadmaps[0] || null;
    const resources = latest?.recommendations?.resources || [];
    res.json({
      user: (({ passwordHash, ...u }) => u)(user),
      readiness: latest?.readinessScore ?? 0,
      gapPercent: latest?.gapPercent ?? 100,
      totalSkills: (user.skills || []).length,
      gaps: (latest?.missing?.length || 0) + (latest?.weak?.length || 0),
      learningProgress: rm?.progress ?? 0,
      completedCourses: prog?.completedCourses?.length || 0,
      xp: prog?.xp || 0,
      targetRole: user.targetRole || '',
      recommendedResources: resources.slice(0, 4),
      suggestedCourses: (latest?.recommendations?.courses || courses.slice(0, 3)).slice(0, 3),
      analysis: latest,
    });
  } catch (e) { next(e); }
}

module.exports = { addSkill, removeSkill, runAnalysis, latestAnalysis, analysisHistory, getRoadmap, buildRoadmap, toggleTask, getProgress, completeItem, dashboard };
