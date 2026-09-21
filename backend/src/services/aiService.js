// ── SkillPath AI service ─────────────────────────────────────────────
// Works fully offline with a weighted skill-matching engine.
// If GEMINI_API_KEY / OPENAI_API_KEY is set, `llmInsights()` enhances
// the analysis with model-generated career advice (keys stay on backend).
// ─────────────────────────────────────────────────────────────────────

const norm = (s) => String(s || '').trim().toLowerCase();

const ALIASES = {
  js: 'javascript', ts: 'typescript', reactjs: 'react', 'react.js': 'react',
  'node.js': 'node.js', node: 'node.js', expressjs: 'express.js',
  mongo: 'mongodb', postgres: 'postgresql', k8s: 'kubernetes',
  gh: 'git & github', github: 'git & github', git: 'git & github',
  tailwindcss: 'tailwind css', nextjs: 'next.js', 'nextjs': 'next.js',
  py: 'python', ml: 'machine learning',
};
const canon = (s) => ALIASES[norm(s)] || norm(s);

const LEVEL_LABEL = { 1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' };

// ---- Resume text → skill extraction --------------------------------
function extractSkillsFromText(text, knownSkills = []) {
  const t = ` ${norm(text).replace(/[^a-z0-9#+.\s-]/g, ' ')} `;
  const found = new Map();
  const vocab = knownSkills.length ? knownSkills : DEFAULT_VOCAB;
  for (const raw of vocab) {
    const name = norm(raw.name || raw);
    const pattern = new RegExp(`(^|[^a-z0-9+#])${name.replace(/[.+]/g, (m) => '\\' + m)}([^a-z0-9+#]|$)`);
    if (pattern.test(t)) {
      const key = canon(name);
      if (!found.has(key)) found.set(key, { name: raw.name || raw, level: 3, inferred: true });
    }
  }
  // years-of-experience hints: "3 years ... python"
  const yearRe = /(\d)\s*\+?\s*years?.{0,40}?([a-z][a-z0-9#+. ]{1,20})/g;
  let m;
  while ((m = yearRe.exec(t))) {
    const yrs = Math.min(5, parseInt(m[1], 10));
    const key = canon(m[2].trim());
    if (found.has(key)) found.get(key).level = Math.max(2, Math.min(5, yrs + 1));
  }
  return [...found.values()].slice(0, 40);
}

const DEFAULT_VOCAB = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'SQL',
  'React', 'Next.js', 'Angular', 'Vue.js', 'HTML & CSS', 'Tailwind CSS', 'Redux',
  'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', '.NET',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase',
  'Git & GitHub', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Nginx',
  'REST APIs', 'GraphQL', 'System Design', 'DSA', 'OOP',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  'Data Analysis', 'Excel', 'Power BI', 'Tableau',
  'Figma', 'UI Design', 'UX Research', 'Flutter', 'React Native',
  'Testing', 'Jest', 'Communication', 'Teamwork', 'Problem Solving', 'Leadership', 'Agile',
].map((name) => ({ name }));

// ---- Core gap analysis ----------------------------------------------
function analyzeSkills(userSkills = [], jobRole) {
  const required = (jobRole?.requiredSkills || []).map((r) => ({
    name: r.name, weight: r.weight || 3, minLevel: r.minLevel || 3,
  }));
  const byCanon = new Map(userSkills.map((s) => [canon(s.name), s]));
  const missing = [], weak = [], strong = [];
  let earned = 0, total = 0;

  for (const req of required) {
    const have = byCanon.get(canon(req.name));
    total += req.weight * 100;
    if (!have) {
      missing.push(req);
    } else if ((have.level || 1) >= req.minLevel) {
      strong.push({ ...req, level: have.level });
      earned += req.weight * 100;
    } else {
      weak.push({ ...req, level: have.level || 1 });
      earned += req.weight * (55 + ((have.level || 1) / req.minLevel) * 30); // partial credit
    }
  }
  // Bonus for extra relevant skills (cap +4)
  const reqSet = new Set(required.map((r) => canon(r.name)));
  const extras = userSkills.filter((s) => !reqSet.has(canon(s.name))).length;
  let readiness = total ? Math.round((earned / total) * 100) : 0;
  readiness = Math.min(99, readiness + Math.min(4, extras));
  if (!required.length) readiness = 0;
  const gapPercent = 100 - readiness;

  const insights = buildInsights({ required, missing, weak, strong, readiness, role: jobRole?.title });
  return { required, missing, weak, strong, readinessScore: readiness, gapPercent, insights };
}

function buildInsights({ missing, weak, strong, readiness, role }) {
  const out = [];
  const top = [...missing].sort((a, b) => b.weight - a.weight).slice(0, 3).map((s) => s.name);
  if (readiness >= 80) out.push(`Excellent — you're nearly job-ready for ${role}. Polish the last few gaps and start interviewing.`);
  else if (readiness >= 55) out.push(`Good momentum for ${role}. Closing ${missing.length + weak.length} gap(s) will push you past 80% readiness.`);
  else out.push(`You're at the start of your ${role} journey. Focus on fundamentals first — consistency beats speed.`);
  if (top.length) out.push(`Highest-priority missing skills: ${top.join(', ')}. These carry the most interview weight.`);
  if (weak.length) out.push(`Level-up targets: ${weak.slice(0, 3).map((s) => `${s.name} (Lv ${s.level} → ${s.minLevel})`).join(', ')}.`);
  if (strong.length) out.push(`Showcase strengths on your resume: ${strong.slice(0, 4).map((s) => s.name).join(', ')}.`);
  out.push('Tip: completing roadmap tasks and projects raises this score on every re-analysis.');
  return out;
}

// ---- Roadmap generator -----------------------------------------------
const STAGE_SETS = {
  frontend: ['Foundation', 'Frontend', 'Backend Basics', 'Database', 'Advanced', 'Deployment'],
  backend: ['Foundation', 'Backend', 'Database', 'Advanced', 'DevOps', 'Deployment'],
  data: ['Foundation', 'Python & SQL', 'Analysis', 'Visualization', 'Advanced', 'Portfolio'],
  ai: ['Foundation', 'Python & Math', 'Machine Learning', 'Deep Learning', 'Advanced', 'Deployment'],
  devops: ['Foundation', 'Linux & Git', 'CI/CD', 'Cloud', 'Advanced', 'Deployment'],
  mobile: ['Foundation', 'UI Basics', 'Mobile', 'Backend Integration', 'Advanced', 'Deployment'],
  uiux: ['Foundation', 'Design Basics', 'UX Research', 'UI Systems', 'Advanced', 'Portfolio'],
  fullstack: ['Foundation', 'Frontend', 'Backend', 'Database', 'Advanced', 'Deployment'],
};

const TASK_BANK = {
  'Foundation': [
    ['Git & GitHub', 'Version control: repos, branching, PRs; push daily.', 'Beginner', 6],
    ['HTML & CSS', 'Semantic HTML, Flexbox/Grid, responsive layouts.', 'Beginner', 10],
    ['DSA', 'Arrays, strings, sorting + 25 practice problems.', 'Beginner', 12],
  ],
  'Frontend': [
    ['JavaScript', 'ES6+, DOM, fetch, async patterns.', 'Intermediate', 14],
    ['React', 'Components, hooks, router, state management.', 'Intermediate', 16],
    ['Tailwind CSS', 'Utility-first styling + responsive design.', 'Beginner', 6],
    ['TypeScript', 'Types, interfaces, generics in a React app.', 'Intermediate', 8],
  ],
  'Backend': [
    ['Node.js', 'Event loop, modules, file system, npm.', 'Intermediate', 10],
    ['Express.js', 'Routing, middleware, validation, error handling.', 'Intermediate', 10],
    ['REST APIs', 'Design clean REST endpoints + Postman testing.', 'Intermediate', 8],
    ['Testing', 'Unit + integration tests with Jest/Supertest.', 'Advanced', 8],
  ],
  'Backend Basics': [
    ['Node.js', 'JS runtime basics + build a tiny CLI.', 'Beginner', 6],
    ['REST APIs', 'Consume and design simple REST endpoints.', 'Beginner', 6],
  ],
  'Database': [
    ['MongoDB', 'CRUD, indexes, aggregation, Mongoose ODM.', 'Intermediate', 10],
    ['SQL', 'Joins, subqueries, constraints with PostgreSQL.', 'Intermediate', 8],
    ['Redis', 'Caching + sessions to speed up APIs.', 'Advanced', 5],
  ],
  'Advanced': [
    ['System Design', 'Caching, queues, scaling, load balancing basics.', 'Advanced', 10],
    ['CI/CD', 'GitHub Actions pipeline with tests + deploy.', 'Advanced', 6],
    ['Docker', 'Containerize the MERN app with compose.', 'Advanced', 8],
  ],
  'Deployment': [
    ['AWS', 'Deploy API + DB: EC2/RDS or Render + Atlas.', 'Advanced', 8],
    ['Nginx', 'Reverse proxy, SSL, custom domain.', 'Advanced', 4],
    ['Communication', 'Resume polish, mock interviews, STAR stories.', 'Intermediate', 5],
  ],
  'Python & SQL': [['Python', 'Syntax, OOP, file handling + 3 scripts.', 'Beginner', 10], ['SQL', 'SELECT → window functions on a sample DB.', 'Intermediate', 10]],
  'Analysis': [['Pandas', 'Cleaning, groupby, merges on real datasets.', 'Intermediate', 10], ['Excel', 'Pivot tables, lookups, dashboards.', 'Beginner', 6]],
  'Visualization': [['Power BI', 'Build 2 interactive dashboards.', 'Intermediate', 8], ['Tableau', 'Publish a story to Tableau Public.', 'Intermediate', 6]],
  'Portfolio': [['Communication', 'Portfolio site + resume + LinkedIn polish.', 'Intermediate', 6], ['Problem Solving', '2 end-to-end case studies with writeups.', 'Advanced', 10]],
  'Python & Math': [['Python', 'NumPy, OOP + stats refresher.', 'Intermediate', 12], ['DSA', 'Core patterns for ML interviews.', 'Intermediate', 8]],
  'Machine Learning': [['Machine Learning', 'Regression→ensembles with scikit-learn.', 'Advanced', 16], ['Pandas', 'Feature engineering pipelines.', 'Intermediate', 8]],
  'Deep Learning': [['Deep Learning', 'PyTorch: CNNs + transfer learning project.', 'Advanced', 18], ['TensorFlow', 'Keras quickstart + model serving.', 'Advanced', 8]],
  'Linux & Git': [['Linux', 'Shell, permissions, SSH, scripting.', 'Beginner', 8], ['Git & GitHub', 'Branching strategies + Actions intro.', 'Intermediate', 6]],
  'CI/CD': [['CI/CD', 'Pipelines with caching, secrets, previews.', 'Advanced', 8], ['Testing', 'Automated test gates in pipeline.', 'Intermediate', 6]],
  'Cloud': [['AWS', 'EC2, S3, IAM, RDS fundamentals.', 'Advanced', 12], ['Docker', 'Images, registries, compose.', 'Intermediate', 8]],
  'UI Basics': [['HTML & CSS', 'Layout, typography, accessibility.', 'Beginner', 10], ['Figma', 'Auto-layout, components, variants.', 'Beginner', 8]],
  'Mobile': [['Flutter', 'Widgets, navigation, state; ship 1 app.', 'Intermediate', 16], ['REST APIs', 'API integration + offline caching.', 'Intermediate', 8]],
  'Backend Integration': [['Firebase', 'Auth, Firestore, push notifications.', 'Intermediate', 8], ['Node.js', 'Build the backend your app consumes.', 'Intermediate', 8]],
  'Design Basics': [['Figma', 'Frames, grids, prototyping.', 'Beginner', 8], ['UI Design', 'Color, type scale, spacing systems.', 'Beginner', 8]],
  'UX Research': [['UX Research', 'Interviews, personas, journey maps.', 'Intermediate', 8], ['Communication', 'Present findings like a designer.', 'Intermediate', 4]],
  'UI Systems': [['UI Design', 'Design system + 3 responsive screens.', 'Advanced', 12], ['Tailwind CSS', 'Hand off specs devs love.', 'Beginner', 4]],
};

function generateRoadmap(jobRole, gap) {
  const track = jobRole?.track || 'fullstack';
  const stages = STAGE_SETS[track] || STAGE_SETS.fullstack;
  const required = (jobRole?.requiredSkills || []).map((s) => ({
    name: s.name,
    weight: Number(s.weight || 3),
    minLevel: Number(s.minLevel || 3),
  })).filter((s) => s.name);
  const need = new Set([...(gap?.missing || []), ...(gap?.weak || [])].map((s) => canon(s.name)));

  // Base tasks for the selected career track.
  const baseByStage = stages.map((stage) => ({ name: stage, tasks: (TASK_BANK[stage] || []).map(([skill, description, difficulty, estHours]) => ({
    skill, description, difficulty, estHours, status: 'todo', priority: need.has(canon(skill)) ? 'high' : 'normal', resourceUrl: '',
  })) }));

  // Add every skill explicitly required by this job role. This makes custom/admin-created
  // roles produce a roadmap that follows their actual requirements instead of one generic track.
  const existing = new Set(baseByStage.flatMap((s) => s.tasks.map((t) => canon(t.skill))));
  const gapNames = new Set([...(gap?.missing || []), ...(gap?.weak || [])].map((s) => canon(s.name)));
  const targetStageFor = (skill) => {
    const c = canon(skill);
    if (['html & css', 'javascript', 'typescript', 'react', 'next.js', 'angular', 'vue.js', 'tailwind css', 'redux'].includes(c)) return Math.min(1, stages.length - 1);
    if (['node.js', 'express.js', 'django', 'flask', 'spring boot', '.net', 'rest apis', 'graphql'].includes(c)) return Math.min(2, stages.length - 1);
    if (['mongodb', 'postgresql', 'mysql', 'sql', 'redis', 'firebase', 'supabase'].includes(c)) return Math.min(3, stages.length - 1);
    if (['aws', 'docker', 'kubernetes', 'ci/cd', 'linux', 'nginx'].includes(c)) return stages.length - 1;
    if (['python', 'pandas', 'numpy', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'data analysis', 'excel', 'power bi', 'tableau'].includes(c)) return Math.min(2, stages.length - 1);
    return Math.min(1, stages.length - 1);
  };

  required.forEach((req) => {
    if (existing.has(canon(req.name))) {
      for (const stage of baseByStage) for (const task of stage.tasks) {
        if (canon(task.skill) === canon(req.name)) {
          task.priority = need.has(canon(req.name)) || req.weight >= 4 ? 'high' : task.priority;
          task.description = `${task.description} Required for ${jobRole.title} (minimum level ${req.minLevel}/5).`;
        }
      }
      return;
    }
    const idx = targetStageFor(req.name);
    baseByStage[idx].tasks.push({
      skill: req.name,
      description: `Learn ${req.name} to at least level ${req.minLevel}/5 for the ${jobRole.title} role. Practice with a small role-relevant project and review interview questions.`,
      difficulty: req.minLevel >= 4 ? 'Advanced' : req.minLevel >= 3 ? 'Intermediate' : 'Beginner',
      estHours: Math.max(4, req.minLevel * 2),
      status: 'todo',
      priority: gapNames.has(canon(req.name)) || req.weight >= 4 ? 'high' : 'normal',
      resourceUrl: '',
    });
  });

  return baseByStage.map((stage) => {
    stage.tasks.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1));
    return stage;
  });
}

// ---- Recommendations --------------------------------------------------
function pickMatches(items, names, limit) {
  const set = new Set(names.map(canon));
  const scored = (items || []).map((it) => {
    const hay = canon(`${it.skill || ''} ${(it.tags || []).join(' ')} ${it.title || ''}`);
    let score = 0;
    for (const n of set) if (n && hay.includes(n)) score += 3;
    return { it, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 0).map((s) => s.it);
  const rest = scored.filter((s) => s.score === 0).map((s) => s.it);
  return [...matched, ...rest].slice(0, limit);
}

// ---- Optional LLM enhancement (keys never leave backend) --------------
async function llmInsights(prompt) {
  try {
    if (process.env.GEMINI_API_KEY) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt.slice(0, 4000) }] }] }),
      });
      const j = await r.json();
      const t = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) return t.split('\n').filter(Boolean).slice(0, 6);
    }
    if (process.env.OPENAI_API_KEY) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt.slice(0, 4000) }], max_tokens: 400 }),
      });
      const j = await r.json();
      const t = j?.choices?.[0]?.message?.content;
      if (t) return t.split('\n').filter(Boolean).slice(0, 6);
    }
  } catch (e) { console.warn('LLM insights skipped:', e.message); }
  return [];
}

module.exports = {
  analyzeSkills, generateRoadmap, extractSkillsFromText,
  pickMatches, canon, llmInsights, LEVEL_LABEL, DEFAULT_VOCAB,
};
