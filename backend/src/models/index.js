// ── SkillPath Mongoose models (with automatic in-memory fallback) ──
// When MongoDB is connected these delegate to Mongoose, otherwise to memstore.
const mongoose = require('mongoose');
const { isDbReady } = require('../config/db');
const { memCollection } = require('../utils/memstore');

const mems = {};
function defineModel(name, definition) {
  const schema = new mongoose.Schema(definition, { timestamps: true });
  const Mg = mongoose.models[name] || mongoose.model(name, schema);
  if (!mems[name]) mems[name] = memCollection(name);
  const Mem = mems[name];
  const pick = () => (isDbReady() ? Mg : Mem);

  // Normalize mongoose docs → plain objects so controllers work identically.
  const norm = async (p) => {
    const v = await p;
    if (Array.isArray(v)) return v.map((d) => (d && d.toObject ? d.toObject() : d));
    return v && v.toObject ? v.toObject() : v;
  };

  return {
    _name: name,
    find: (f, proj, opts) => (isDbReady()
      ? norm(Mg.find(f || {}, proj, opts).lean())
      : Mem.find(f, proj, opts)),
    findOne: (f) => (isDbReady() ? norm(Mg.findOne(f || {}).lean()) : Mem.findOne(f)),
    findById: (id) => {
      if (!isDbReady()) return Mem.findById(id);
      if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
      return norm(Mg.findById(id).lean());
    },
    create: (d) => (isDbReady() ? norm(Mg.create(d)) : Mem.create(d)),
    findByIdAndUpdate: (id, u, o) => {
      if (!isDbReady()) return Mem.findByIdAndUpdate(id, u, o);
      if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
      return norm(Mg.findByIdAndUpdate(id, u, o || { new: true }).lean());
    },
    findOneAndUpdate: (f, u, o) => (isDbReady()
      ? norm(Mg.findOneAndUpdate(f, u, o || { new: true, upsert: false }).lean())
      : Mem.findOneAndUpdate(f, u, o)),
    findByIdAndDelete: (id) => {
      if (!isDbReady()) return Mem.findByIdAndDelete(id);
      if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
      return norm(Mg.findByIdAndDelete(id).lean());
    },
    deleteMany: (f) => pick().deleteMany(f || {}),
    countDocuments: (f) => pick().countDocuments(f || {}),
  };
}

const SkillM = { name: String, category: { type: String, default: 'technical' }, level: { type: Number, default: 3 }, years: { type: Number, default: 1 } };

const User = defineModel('User', {
  googleId: String,
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  passwordHash: String,
  photoURL: String,
  role: { type: String, default: 'user' }, // user | admin
  headline: String, bio: String, location: String, phone: String,
  website: String, github: String, linkedin: String,
  targetRole: String,
  skills: { type: [SkillM], default: [] },
  resume: { filename: String, url: String, text: String, uploadedAt: Date },
  preferences: { theme: { type: String, default: 'system' }, emailNotifs: { type: Boolean, default: true } },
  // Login 2FA (email OTP)
  loginOtpHash: String,
  loginOtpExpires: Date,
  // Forgot-password OTP
  resetOtpHash: String,
  resetOtpExpires: Date,
});

const Skill = defineModel('Skill', {
  name: { type: String, required: true },
  category: { type: String, default: 'technical' }, // technical | soft
  demand: { type: Number, default: 3 }, // 1-5
  description: String,
  icon: String,
});

const JobRole = defineModel('JobRole', {
  title: { type: String, required: true },
  slug: String,
  description: String,
  icon: String,
  track: { type: String, default: 'fullstack' }, // fullstack|frontend|backend|data|ai|devops|mobile|uiux
  salaryRange: String,
  demand: { type: Number, default: 4 },
  requiredSkills: { type: [{ name: String, weight: { type: Number, default: 3 }, minLevel: { type: Number, default: 3 } }], default: [] },
});

const Course = defineModel('Course', {
  title: { type: String, required: true }, provider: String, skill: String,
  level: { type: String, default: 'Beginner' }, duration: String,
  rating: { type: Number, default: 4.5 }, free: { type: Boolean, default: true },
  price: String, url: String, description: String, tags: [String],
});

const Project = defineModel('Project', {
  title: { type: String, required: true }, description: String,
  skills: [String], difficulty: { type: String, default: 'Intermediate' },
  duration: String, guide: String, repoUrl: String,
});

const Certification = defineModel('Certification', {
  title: { type: String, required: true }, issuer: String, skill: String,
  cost: String, duration: String, url: String, description: String,
});

const Resource = defineModel('Resource', {
  title: { type: String, required: true }, type: { type: String, default: 'article' },
  skill: String, url: String, free: { type: Boolean, default: true },
  description: String, rating: { type: Number, default: 4.5 },
});

const Analysis = defineModel('Analysis', {
  userId: String, userEmail: String, targetRole: String,
  currentSkills: [SkillM],
  required: [{ name: String, weight: Number, minLevel: Number }],
  missing: [{ name: String, weight: Number, minLevel: Number }],
  weak: [{ name: String, level: Number, minLevel: Number, weight: Number }],
  strong: [{ name: String, level: Number, minLevel: Number, weight: Number }],
  readinessScore: Number, gapPercent: Number,
  insights: [String],
  recommendations: { courses: [Object], projects: [Object], certifications: [Object], resources: [Object] },
});

const Roadmap = defineModel('Roadmap', {
  userId: String, userEmail: String, targetRole: String,
  stages: [{
    name: String,
    tasks: [{
      skill: String, description: String,
      difficulty: { type: String, default: 'Beginner' },
      estHours: { type: Number, default: 4 },
      status: { type: String, default: 'todo' }, // todo|done
      resourceUrl: String,
    }],
  }],
  progress: { type: Number, default: 0 },
});

const Progress = defineModel('Progress', {
  userId: String, userEmail: String,
  completedTasks: { type: [String], default: [] },   // "stageIdx:taskIdx"
  completedCourses: { type: [Object], default: [] }, // {courseId,title,at}
  completedProjects: { type: [Object], default: [] },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActive: Date,
  history: { type: [{ action: String, detail: String, at: Date, xp: Number }], default: [] },
});

const Notification = defineModel('Notification', {
  userEmail: String, // specific email or 'all'
  title: String, message: String,
  type: { type: String, default: 'info' }, // info|success|warning|achievement
  link: String,
  read: { type: Boolean, default: false },
});

module.exports = { User, Skill, JobRole, Course, Project, Certification, Resource, Analysis, Roadmap, Progress, Notification };
