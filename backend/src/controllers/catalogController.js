// Generic public-list + admin-CRUD controller for catalog entities.
const { Skill, JobRole, Course, Project, Certification, Resource } = require('../models');

const MAP = { skills: Skill, 'job-roles': JobRole, roles: JobRole, courses: Course, projects: Project, certifications: Certification, resources: Resource };

function list(entity) {
  return async (req, res, next) => {
    try {
      const Model = MAP[entity];
      const q = String(req.query.q || '').toLowerCase();
      let items = await Model.find();
      if (q) {
        items = items.filter((it) => JSON.stringify(it).toLowerCase().includes(q));
      }
      if (req.query.skill) {
        const s = req.query.skill.toLowerCase();
        items = items.filter((it) => JSON.stringify([it.skill, it.skills, it.tags]).toLowerCase().includes(s));
      }
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      res.json({ [entity.replace('-', '')]: items, total: items.length });
    } catch (e) { next(e); }
  };
}

function getOne(entity) {
  return async (req, res, next) => {
    try {
      const item = await MAP[entity].findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (e) { next(e); }
  };
}

function createOne(entity) {
  return async (req, res, next) => {
    try {
      const body = { ...req.body };
      if (entity === 'job-roles') {
        body.title = String(body.title || '').trim();
        if (!body.title) return res.status(400).json({ error: 'Job role title is required' });
        body.slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        body.requiredSkills = Array.isArray(body.requiredSkills) ? body.requiredSkills.filter((s) => s && s.name).map((s) => ({ name: String(s.name).trim(), weight: Number(s.weight) || 3, minLevel: Number(s.minLevel) || 3 })) : [];
      }
      const item = await MAP[entity].create(body);
      res.status(201).json(item);
    } catch (e) { next(e); }
  };
}

function updateOne(entity) {
  return async (req, res, next) => {
    try {
      const body = { ...req.body };
      if (entity === 'job-roles') {
        if (body.title !== undefined) { body.title = String(body.title).trim(); if (!body.title) return res.status(400).json({ error: 'Job role title is required' }); }
        if (body.title && !body.slug) body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (body.requiredSkills !== undefined) body.requiredSkills = Array.isArray(body.requiredSkills) ? body.requiredSkills.filter((s) => s && s.name).map((s) => ({ name: String(s.name).trim(), weight: Number(s.weight) || 3, minLevel: Number(s.minLevel) || 3 })) : [];
      }
      const item = await MAP[entity].findByIdAndUpdate(req.params.id, body, { new: true });
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (e) { next(e); }
  };
}

function deleteOne(entity) {
  return async (req, res, next) => {
    try {
      const item = await MAP[entity].findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true });
    } catch (e) { next(e); }
  };
}

module.exports = { list, getOne, createOne, updateOne, deleteOne };
