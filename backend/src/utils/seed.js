require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const { connectDB, isDbReady } = require('../config/db');
const M = require('../models');

const SKILLS = [
  ['JavaScript', 'technical', 5, 'The language of the web.'], ['TypeScript', 'technical', 5, 'Typed JS for large apps.'],
  ['Python', 'technical', 5, 'Scripting, data, AI.'], ['SQL', 'technical', 5, 'Query relational data.'],
  ['React', 'technical', 5, 'UI library.'], ['Next.js', 'technical', 4, 'React framework.'],
  ['HTML & CSS', 'technical', 5, 'Web fundamentals.'], ['Tailwind CSS', 'technical', 4, 'Utility CSS.'],
  ['Node.js', 'technical', 5, 'JS runtime.'], ['Express.js', 'technical', 4, 'Node framework.'],
  ['REST APIs', 'technical', 5, 'API design.'], ['GraphQL', 'technical', 3, 'Query language.'],
  ['MongoDB', 'technical', 4, 'NoSQL DB.'], ['PostgreSQL', 'technical', 5, 'Relational DB.'],
  ['Redis', 'technical', 3, 'Caching.'], ['Firebase', 'technical', 3, 'BaaS platform.'],
  ['Git & GitHub', 'technical', 5, 'Version control.'], ['Docker', 'technical', 4, 'Containers.'],
  ['Kubernetes', 'technical', 3, 'Orchestration.'], ['AWS', 'technical', 5, 'Cloud platform.'],
  ['CI/CD', 'technical', 4, 'Automation pipelines.'], ['System Design', 'technical', 4, 'Architecture.'],
  ['DSA', 'technical', 5, 'Algorithms.'], ['Testing', 'technical', 4, 'Jest, Cypress.'],
  ['Machine Learning', 'technical', 5, 'ML fundamentals.'], ['Deep Learning', 'technical', 4, 'Neural nets.'],
  ['Pandas', 'technical', 4, 'Data wrangling.'], ['Power BI', 'technical', 4, 'BI dashboards.'],
  ['Figma', 'technical', 4, 'Design tool.'], ['Flutter', 'technical', 3, 'Cross-platform apps.'],
  ['Communication', 'soft', 5, 'Clear articulation.'], ['Teamwork', 'soft', 5, 'Collaboration.'],
  ['Problem Solving', 'soft', 5, 'Analytical thinking.'], ['Leadership', 'soft', 4, 'Ownership.'], ['Agile', 'soft', 4, 'Scrum practices.'],
];

const req = (...skills) => skills.map(([name, weight = 3, minLevel = 3]) => ({ name, weight, minLevel }));
const ROLES = [
  { title: 'Full-Stack Developer (MERN)', track: 'fullstack', icon: 'layers', salaryRange: '₹6–18 LPA', demand: 5, description: 'Build complete web apps with MongoDB, Express, React and Node.', requiredSkills: req(['JavaScript', 5, 4], ['React', 5, 4], ['Node.js', 5, 4], ['Express.js', 4, 3], ['MongoDB', 4, 3], ['REST APIs', 4, 4], ['Git & GitHub', 4, 3], ['HTML & CSS', 3, 3], ['SQL', 3, 2], ['Docker', 2, 2], ['Testing', 3, 2], ['Communication', 2, 3]) },
  { title: 'Frontend Developer', track: 'frontend', icon: 'monitor', salaryRange: '₹5–15 LPA', demand: 5, description: 'Craft fast, accessible user interfaces with React.', requiredSkills: req(['JavaScript', 5, 4], ['React', 5, 4], ['HTML & CSS', 5, 4], ['Tailwind CSS', 3, 3], ['TypeScript', 4, 3], ['REST APIs', 3, 3], ['Git & GitHub', 4, 3], ['Testing', 2, 2], ['Figma', 2, 2], ['Communication', 2, 3]) },
  { title: 'Backend Developer', track: 'backend', icon: 'server', salaryRange: '₹6–18 LPA', demand: 5, description: 'Design scalable APIs and data layers with Node.js.', requiredSkills: req(['Node.js', 5, 4], ['Express.js', 5, 4], ['REST APIs', 5, 4], ['MongoDB', 4, 3], ['SQL', 4, 3], ['PostgreSQL', 3, 3], ['Docker', 3, 2], ['System Design', 4, 3], ['Git & GitHub', 4, 3], ['Testing', 3, 3], ['DSA', 3, 3]) },
  { title: 'Data Analyst', track: 'data', icon: 'chart', salaryRange: '₹5–14 LPA', demand: 4, description: 'Turn raw data into decisions with SQL and BI tools.', requiredSkills: req(['SQL', 5, 4], ['Python', 4, 3], ['Pandas', 4, 3], ['Excel', 4, 3], ['Power BI', 4, 3], ['Communication', 4, 4], ['Problem Solving', 4, 3], ['Git & GitHub', 2, 2]) },
  { title: 'AI / ML Engineer', track: 'ai', icon: 'brain', salaryRange: '₹8–25 LPA', demand: 5, description: 'Build and deploy machine-learning systems in Python.', requiredSkills: req(['Python', 5, 4], ['Machine Learning', 5, 4], ['Deep Learning', 4, 3], ['Pandas', 4, 3], ['SQL', 3, 3], ['DSA', 3, 3], ['Docker', 2, 2], ['Git & GitHub', 3, 3], ['Communication', 2, 3]) },
  { title: 'DevOps Engineer', track: 'devops', icon: 'cloud', salaryRange: '₹7–20 LPA', demand: 4, description: 'Automate delivery with CI/CD, Docker and AWS.', requiredSkills: req(['Linux', 4, 3], ['Git & GitHub', 4, 4], ['Docker', 5, 4], ['CI/CD', 5, 4], ['AWS', 5, 3], ['Kubernetes', 3, 2], ['Python', 3, 2], ['System Design', 3, 3]) },
  { title: 'Mobile Developer (Flutter)', track: 'mobile', icon: 'phone', salaryRange: '₹5–15 LPA', demand: 3, description: 'Ship cross-platform apps with Flutter and Firebase.', requiredSkills: req(['Flutter', 5, 4], ['REST APIs', 4, 3], ['Firebase', 4, 3], ['Git & GitHub', 3, 3], ['Testing', 2, 2], ['UI Design', 2, 2], ['Communication', 2, 3]) },
  { title: 'UI/UX Designer', track: 'uiux', icon: 'pen', salaryRange: '₹4–14 LPA', demand: 4, description: 'Research, prototype and design delightful products.', requiredSkills: req(['Figma', 5, 4], ['UI Design', 5, 4], ['UX Research', 4, 3], ['HTML & CSS', 3, 2], ['Communication', 4, 4], ['Problem Solving', 3, 3]) },
];

const COURSES = [
  ['The Complete JavaScript Course', 'Udemy', 'JavaScript', 'Beginner', '28h', 4.7, false, '₹499', 'https://www.udemy.com', 'Modern JS from zero to advanced with projects.'],
  ['React – The Complete Guide', 'Udemy', 'React', 'Intermediate', '42h', 4.8, false, '₹549', 'https://www.udemy.com', 'Hooks, router, Next.js intro + capstone.'],
  ['Node.js API Masterclass', 'Udemy', 'Node.js', 'Intermediate', '18h', 4.7, false, '₹499', 'https://www.udemy.com', 'REST APIs, auth, testing, deployment.'],
  ['MongoDB University M001', 'MongoDB', 'MongoDB', 'Beginner', '10h', 4.8, true, 'Free', 'https://university.mongodb.com', 'Official MongoDB basics.'],
  ['Full-Stack Open', 'University of Helsinki', 'React', 'Intermediate', '60h', 4.9, true, 'Free', 'https://fullstackopen.com', 'Deep React + Node + testing, free.'],
  ['CS50 Web Programming', 'Harvard (edX)', 'Python', 'Intermediate', '36h', 4.9, true, 'Free', 'https://cs50.harvard.edu/web', 'Django, JS, SQL, CI/CD.'],
  ['SQL for Data Science', 'Coursera', 'SQL', 'Beginner', '14h', 4.6, true, 'Free audit', 'https://www.coursera.org', 'Queries to window functions.'],
  ['Machine Learning Specialization', 'Coursera / DeepLearning.AI', 'Machine Learning', 'Intermediate', '60h', 4.9, false, '₹3,999/mo', 'https://www.coursera.org', 'Andrew Ng-flagship ML path.'],
  ['Docker & Kubernetes Guide', 'Udemy', 'Docker', 'Intermediate', '22h', 4.7, false, '₹549', 'https://www.udemy.com', 'Containers to production.'],
  ['AWS Certified Cloud Practitioner', 'A Cloud Guru', 'AWS', 'Beginner', '16h', 4.6, false, '₹1,999', 'https://acloudguru.com', 'Cloud foundations + exam prep.'],
  ['TypeScript Handbook Path', 'freeCodeCamp', 'TypeScript', 'Beginner', '8h', 4.7, true, 'Free', 'https://www.freecodecamp.org', 'Types through generics.'],
  ['System Design Primer Course', 'ByteByteGo', 'System Design', 'Advanced', '20h', 4.8, false, '₹2,499', 'https://bytebytego.com', 'Interviews + real architecture.'],
  ['Power BI Complete', 'Udemy', 'Power BI', 'Beginner', '12h', 4.6, false, '₹499', 'https://www.udemy.com', 'Dashboards end to end.'],
  ['Figma UI Design', 'Coursera', 'Figma', 'Beginner', '10h', 4.5, true, 'Free audit', 'https://www.coursera.org', 'Auto-layout to handoff.'],
  ['Flutter & Dart Bootcamp', 'Udemy', 'Flutter', 'Intermediate', '30h', 4.7, false, '₹549', 'https://www.udemy.com', 'Ship apps to both stores.'],
  ['Testing JavaScript', 'TestingJS', 'Testing', 'Intermediate', '9h', 4.7, false, '$99', 'https://testingjavascript.com', 'Jest + Testing Library.'],
];

const PROJECTS = [
  ['MERN Job Board', 'Post jobs, apply, track applications with auth + roles.', ['MongoDB', 'Express.js', 'React', 'Node.js'], 'Advanced', '3 weeks', 'Seed roles, add filters, deploy to Render + Vercel.'],
  ['Realtime Chat App', 'Socket.io chat with rooms, typing indicators, history.', ['Node.js', 'React', 'Socket.io'], 'Intermediate', '1 week', 'Persist messages, add read receipts.'],
  ['E-commerce Store', 'Cart, checkout, payments (test mode), admin panel.', ['React', 'Node.js', 'MongoDB'], 'Advanced', '3 weeks', 'Add coupons, order emails, analytics.'],
  ['Portfolio + Blog (Next.js)', 'MDX blog, dark mode, SEO, contact API.', ['Next.js', 'React'], 'Beginner', '4 days', 'Deploy on Vercel with analytics.'],
  ['DevOps Pipeline Demo', 'Dockerized API + GitHub Actions → AWS.', ['Docker', 'CI/CD', 'AWS'], 'Advanced', '1 week', 'Add staging env + rollback.'],
  ['Sales Dashboard (Power BI)', 'Clean messy CSVs, model, publish dashboard.', ['SQL', 'Power BI', 'Excel'], 'Intermediate', '5 days', 'Write a 1-page insight report.'],
  ['ML Price Predictor', 'Feature engineering + model + FastAPI serving.', ['Python', 'Machine Learning', 'Pandas'], 'Advanced', '2 weeks', 'Track experiments, add UI.'],
  ['Flutter Expense Tracker', 'Offline-first app with charts + Firebase sync.', ['Flutter', 'Firebase'], 'Intermediate', '1 week', 'Add auth + export CSV.'],
  ['Design System in Figma', 'Tokens, components, docs + coded React mirror.', ['Figma', 'UI Design', 'React'], 'Intermediate', '1 week', 'Publish as a portfolio case study.'],
  ['URL Shortener + Analytics', 'Short links with click stats + rate limiting.', ['Node.js', 'Redis', 'PostgreSQL'], 'Intermediate', '5 days', 'Add QR codes + dashboard.'],
];

const CERTS = [
  ['AWS Certified Cloud Practitioner', 'Amazon', 'AWS', '$100', '1–2 months', 'https://aws.amazon.com/certification', 'Entry cloud cert, great first badge.'],
  ['Meta Front-End Developer', 'Meta / Coursera', 'React', '$49/mo', '3 months', 'https://www.coursera.org', 'React-focused professional cert.'],
  ['MongoDB Associate Developer', 'MongoDB', 'MongoDB', '$150', '1 month', 'https://university.mongodb.com', 'Official Node + MongoDB cert.'],
  ['Google Data Analytics', 'Google / Coursera', 'SQL', '$49/mo', '3 months', 'https://www.coursera.org', 'SQL, sheets, Tableau, R intro.'],
  ['TensorFlow Developer', 'Google', 'Deep Learning', '$100', '2 months', 'https://www.tensorflow.org/certificate', 'Prove applied DL skills.'],
  ['CKA: Kubernetes Admin', 'CNCF', 'Kubernetes', '$395', '3 months', 'https://www.cncf.io', 'Hands-on gold standard.'],
  ['AZ-900 Azure Fundamentals', 'Microsoft', 'AWS', '$99', '1 month', 'https://learn.microsoft.com', 'Cloud concepts + Azure.'],
  ['PSM I (Scrum)', 'Scrum.org', 'Agile', '$200', '2 weeks', 'https://www.scrum.org', 'Agile ways of working.'],
];

const RESOURCES = [
  ['MDN Web Docs', 'docs', 'JavaScript', 'https://developer.mozilla.org', true, 'The definitive web reference.', 5],
  ['freeCodeCamp', 'course', 'JavaScript', 'https://www.freecodecamp.org', true, 'Free full curriculum + certs.', 4.9],
  ['Full Stack Open', 'course', 'React', 'https://fullstackopen.com', true, 'Free Helsinki full-stack depth.', 4.9],
  ['JavaScript.info', 'docs', 'JavaScript', 'https://javascript.info', true, 'Modern JS tutorial, superb.', 4.9],
  ['React Docs', 'docs', 'React', 'https://react.dev', true, 'Official React learning path.', 4.9],
  ['Node.js Best Practices', 'article', 'Node.js', 'https://github.com/goldbergyoni/nodebestpractices', true, 'Production Node patterns.', 4.8],
  ['MongoDB University', 'course', 'MongoDB', 'https://university.mongodb.com', true, 'Free official courses.', 4.8],
  ['LeetCode', 'tool', 'DSA', 'https://leetcode.com', true, 'DSA interview practice.', 4.7],
  ['NeetCode 150', 'course', 'DSA', 'https://neetcode.io', true, 'Curated DSA roadmap.', 4.9],
  ['Kaggle Learn', 'course', 'Python', 'https://www.kaggle.com/learn', true, 'Micro-courses: Python → ML.', 4.7],
  ['ByteByteGo Newsletter', 'article', 'System Design', 'https://bytebytego.com', true, 'Visual system design.', 4.8],
  ['Fireship.io', 'video', 'Firebase', 'https://fireship.io', true, 'Fast, dense dev videos.', 4.8],
  ['Scrimba React', 'video', 'React', 'https://scrimba.com', true, 'Interactive screencasts.', 4.7],
  ['Exercism', 'tool', 'Python', 'https://exercism.org', true, 'Mentored code practice.', 4.7],
  ['Roadmap.sh', 'tool', 'Git & GitHub', 'https://roadmap.sh', true, 'Visual career roadmaps.', 4.8],
  ['Refactoring UI', 'article', 'UI Design', 'https://www.refactoringui.com', false, 'Design tactics for devs.', 4.9],
];

async function seed() {
  await connectDB();
  console.log('🌱 Seeding…  (db:', isDbReady() ? 'mongo' : 'memory', ')');

  if ((await M.Skill.countDocuments()) === 0) {
    for (const [name, category, demand, description] of SKILLS) await M.Skill.create({ name, category, demand, description });
    console.log('  + skills', SKILLS.length);
  }
  if ((await M.JobRole.countDocuments()) === 0) {
    for (const r of ROLES) await M.JobRole.create({ ...r, slug: r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
    console.log('  + roles', ROLES.length);
  }
  if ((await M.Course.countDocuments()) === 0) {
    for (const [title, provider, skill, level, duration, rating, free, price, url, description] of COURSES)
      await M.Course.create({ title, provider, skill, level, duration, rating, free, price, url, description, tags: [skill, level] });
    console.log('  + courses', COURSES.length);
  }
  if ((await M.Project.countDocuments()) === 0) {
    for (const [title, description, skills, difficulty, duration, guide] of PROJECTS)
      await M.Project.create({ title, description, skills, difficulty, duration, guide });
    console.log('  + projects', PROJECTS.length);
  }
  if ((await M.Certification.countDocuments()) === 0) {
    for (const [title, issuer, skill, cost, duration, url, description] of CERTS)
      await M.Certification.create({ title, issuer, skill, cost, duration, url, description });
    console.log('  + certifications', CERTS.length);
  }
  if ((await M.Resource.countDocuments()) === 0) {
    for (const [title, type, skill, url, free, description, rating] of RESOURCES)
      await M.Resource.create({ title, type, skill, url, free, description, rating });
    console.log('  + resources', RESOURCES.length);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'sathiyagokul9529@gmail.com';
  if (!(await M.User.findOne({ email: adminEmail }))) {
    await M.User.create({
      name: 'SkillPath Admin', email: adminEmail, role: 'admin',
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10),
      headline: 'Platform Administrator', targetRole: 'Full-Stack Developer (MERN)',
      skills: [{ name: 'JavaScript', category: 'technical', level: 5, years: 5 }],
    });
    console.log('  + admin', adminEmail);
  }
  console.log('✅ Seed complete');
}

if (require.main === module) seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
module.exports = { seed };
