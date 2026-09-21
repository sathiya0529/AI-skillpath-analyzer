import { Link } from 'react-router-dom';
import {
  Sparkles, GitCompareArrows, Map, BarChart3, Bell, BookOpen, FolderKanban,
  Award, ArrowRight, CheckCircle2, Upload, Target, Brain, Rocket, ShieldCheck, Zap,
} from 'lucide-react';
import { PublicLayout } from '../components/layout';
import { Donut, HBars } from '../components/ui';

/* ---------------- HOME ---------------- */
export function Home() {
  return (
    <PublicLayout>
      <section className="hero">
        <div className="container">
          <div className="hero-copy">
            <div className="eyebrow">AI CAREER READINESS</div>
            <h1>See your skill gaps.<br />Close them <span className="grad-text">on purpose</span>.</h1>
            <p>SkillPath reads your resume and profile, scores you against the role you want, and turns the gap into a roadmap you can actually follow.</p>
            <div className="hero-cta">
              <Link to="/signup" className="btn btn-primary btn-lg">Analyze My Skills Free <ArrowRight size={18} /></Link>
              <Link to="/how-it-works" className="btn btn-ghost btn-lg">See How It Works</Link>
            </div>
          </div>

          <div className="shell">
            <div className="shell-side">
              {['Dashboard', 'Roadmap', 'Skills', 'Progress', 'Settings'].map((s, i) => (
                <div key={s} className={`s-item${i === 0 ? ' active' : ''}`}><span className="dot" />{s}</div>
              ))}
            </div>
            <div className="shell-main">
              <div className="shell-head">
                <div><h3>Full-Stack Developer</h3><p>Job readiness — updated 2 minutes ago</p></div>
              </div>
              <div className="shell-kpis">
                <div className="shell-kpi"><div className="n">78</div><div className="l">Readiness score</div></div>
                <div className="shell-kpi"><div className="n">12</div><div className="l">Skills tracked</div></div>
                <div className="shell-kpi"><div className="n">4</div><div className="l">Strong skills</div></div>
                <div className="shell-kpi"><div className="n">3</div><div className="l">Gaps left</div></div>
              </div>
              <div className="shell-grid">
                <div className="shell-panel">
                  <h4>Skill reading</h4>
                  <HBars data={[
                    { label: 'JavaScript', value: 90 }, { label: 'React', value: 72 },
                    { label: 'Node.js', value: 64 }, { label: 'System Design', value: 28 },
                  ]} />
                </div>
                <div className="shell-panel">
                  <h4>Roadmap</h4>
                  {[['Foundation', true], ['Frontend', true], ['Backend', 'now'], ['Database', false], ['Deployment', false]].map(([label, state]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, padding: '6px 0', fontWeight: state === 'now' ? 700 : 500, color: state === false ? 'var(--muted)' : 'var(--text)' }}>
                      <span style={{ width: 14, height: 14, borderRadius: 99, flexShrink: 0, border: `2px solid ${state === true ? 'var(--primary)' : state === 'now' ? 'var(--primary-2)' : 'var(--border)'}`, background: state === true ? 'var(--primary)' : 'transparent' }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="logos"><span>MERN STACK</span><span>•</span><span>GOOGLE OAUTH</span><span>•</span><span>REALTIME AI</span><span>•</span><span>8 CAREER TRACKS</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Everything you need to <span className="grad-text">close the gap</span></h2>
          <p className="lead">One platform for the full journey: Profile → Resume → Skills → Target Job → AI Analysis → Roadmap → Job Ready.</p>
          <div className="grid grid-3">
            {[
              [GitCompareArrows, 'AI Skill Gap Analysis', 'Compare your current skills with any of 8 curated job roles. See missing, weak & strong skills with weighted scores.'],
              [Target, 'Job Readiness Score', 'A single 0–100 score that updates every time you learn. Track improvement across every re-analysis.'],
              [Map, 'Personalized Roadmap', 'Foundation → Frontend → Backend → Database → Advanced → Deployment, prioritized by YOUR gaps.'],
              [Upload, 'Resume Skill Extraction', 'Upload your resume (PDF/TXT) and SkillPath auto-detects skills and adds them to your profile.'],
              [Bell, 'Realtime Notifications', 'Instant Socket.io alerts for analysis results, XP milestones, roadmap updates & admin announcements.'],
              [BarChart3, 'Progress Analytics', 'XP, streaks, completion charts and a full learning timeline keep you motivated and accountable.'],
            ].map(([Icon, t, d], i) => (
              <div key={i} className="card hover feature-card">
                <div className="f-icon"><Icon size={22} /></div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{t}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span className="pill"><Sparkles size={14} /> What you get</span>
            <h2 style={{ marginTop: 12 }}>A complete career-growth workspace</h2>
            <p className="lead">Everything shown here is available from the user workspace after signup: profile, target role, analysis, roadmap, learning resources and progress.</p>
          </div>
          <div className="grid grid-3">
            {[
              [GitCompareArrows, 'Skill Gap Analysis', 'Compare your current skills with the requirements of your selected job role. Missing and weak skills are clearly separated so you know what to work on next.', '/gap-analysis'],
              [Target, 'Job Readiness', 'Run an analysis after selecting a target role and see a readiness score, required skills, strengths and gaps.', '/dashboard'],
              [Map, 'Role-Based Roadmap', 'Your roadmap is generated from the selected role and its required skills, with high-priority gaps surfaced first.', '/roadmap'],
              [BookOpen, 'Learning Resources', 'Courses, projects, certifications and resources are matched against the skills you need for the target role.', '/courses'],
              [Upload, 'Resume Skill Extraction', 'Upload your resume and use the extracted skills as another input for your profile and analysis.', '/profile'],
              [BarChart3, 'Progress Tracking', 'Track completed learning tasks, XP and progress over time while you work toward your selected role.', '/progress'],
            ].map(([Icon, t, d, to], i) => (
              <Link key={i} to={to} className="card hover feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="f-icon"><Icon size={22} /></div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{t}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{d}</div>
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>Open this section <ArrowRight size={13} style={{ verticalAlign: -2 }} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2>How it works</h2>
          <p className="lead">From signup to job-ready in four simple steps.</p>
          <div className="steps">
            {[
              ['Create your profile', 'Add skills manually or upload a resume for instant AI extraction.'],
              ['Pick a target role', 'Choose from Full-Stack, Frontend, Backend, Data, AI/ML, DevOps, Mobile or UI/UX.'],
              ['Run AI analysis', 'Get readiness score, gap breakdown, insights & tailored recommendations.'],
              ['Follow the roadmap', 'Complete staged tasks, courses & projects. Re-analyze and watch your score climb.'],
            ].map(([t, d], i) => (
              <div key={i} className="card hover"><div className="step-num">{i + 1}</div>
                <div style={{ fontWeight: 800 }}>{t}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>{d}</div>
              </div>
            ))}
          </div>
          <div className="card" id="about" style={{ marginTop: 28 }}>
            <div className="card-title"><Rocket size={18} /> About SkillPath</div>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12 }}>SkillPath is a MERN-based AI skill gap analyzer designed to connect a learner's current profile with the requirements of a chosen technology job role.</p>
            <div className="grid grid-3">
              <div><strong>1. Choose a role</strong><div className="card-sub">Select the job you want to prepare for.</div></div>
              <div><strong>2. Measure the gap</strong><div className="card-sub">Compare your profile with that role's required skills.</div></div>
              <div><strong>3. Follow the plan</strong><div className="card-sub">Learn the highest-priority skills and track your progress.</div></div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/features" className="btn btn-soft">Explore Features <ArrowRight size={15} /></Link>
              <Link to="/how-it-works" className="btn btn-soft">How It Works <ArrowRight size={15} /></Link>
              <Link to="/about" className="btn btn-soft">About SkillPath <ArrowRight size={15} /></Link>
            </div>
          </div>

          <div className="cta-band">
            <h2>Your dream role is a roadmap away</h2>
            <p>Join SkillPath free — analyze your first skill gap in under 2 minutes.</p>
            <Link to="/signup" className="btn btn-white btn-lg">Start Free Analysis <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

/* ---------------- FEATURES ---------------- */
export function Features() {
  const groups = [
    ['For Learners', [
      [Brain, 'Weighted AI scoring engine', 'Every required skill carries interview weight — critical gaps hurt more than nice-to-haves.'],
      [Upload, 'Resume parsing', 'PDF & text resumes parsed for 40+ skills with experience-level inference.'],
      [Map, 'Adaptive roadmaps', '6-stage tracks per career path, auto-prioritized by your missing & weak skills.'],
      [BookOpen, 'Curated resources', 'Courses, projects, certifications & free resources matched to YOUR gaps.'],
      [Zap, 'Gamified progress', 'XP, completion tracking, history timeline and score-over-time charts.'],
      [Bell, 'Realtime everything', 'Socket.io notifications, live toasts and an unread badge in the navbar.'],
    ]],
    ['Platform & Security', [
      [ShieldCheck, 'Secure Authentication', 'Email/password with 2FA, real Google Sign-In, OTP-based password reset & secure logout.'],
      [ShieldCheck, 'Role-based admin panel', 'Admins manage users, roles, skills, courses, projects, certs & resources.'],
      [Rocket, 'Modern MERN stack', 'React 18, Express, MongoDB/Mongoose, clean routes → controllers → services layering.'],
    ]],
  ];
  return (
    <PublicLayout>
      <div className="page"><div className="container">
        <div className="page-head"><div><h1>Features</h1><p>Built like a real career-tech SaaS, not a demo project.</p></div>
          <Link to="/signup" className="btn btn-primary">Try It Free <ArrowRight size={16} /></Link></div>
        {groups.map(([title, feats]) => (
          <div key={title} style={{ marginBottom: 34 }}>
            <h3 style={{ marginBottom: 16 }}>{title}</h3>
            <div className="grid grid-3">
              {feats.map(([Icon, t, d], i) => (
                <div key={i} className="card hover feature-card">
                  <div className="f-icon"><Icon size={22} /></div>
                  <div style={{ fontWeight: 800 }}>{t}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 7, lineHeight: 1.6 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <FolderKanban size={26} color="#C9974B" />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 800 }}>Includes a full admin dashboard</div>
            <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>User analytics, CRUD for every entity, and broadcast announcements.</div>
          </div>
          <Link to="/about" className="btn btn-ghost">Learn More</Link>
        </div>
      </div></div>
    </PublicLayout>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
export function HowItWorks() {
  const steps = [
    [Upload, 'Step 1 — Build your profile', 'Sign up with email or Google. Add your technical & soft skills with proficiency levels, upload a profile picture, and drop in your resume — SkillPath extracts skills automatically.'],
    [Target, 'Step 2 — Choose a target job role', 'Pick from 8 deeply-researched roles (MERN, Frontend, Backend, Data Analyst, AI/ML, DevOps, Flutter, UI/UX), each with weighted required skills.'],
    [Brain, 'Step 3 — Run the AI analysis', 'The engine matches your skills against the role, computes a Job Readiness Score + gap %, and classifies every skill as strong, weak or missing — with tailored course, project, cert & resource picks.'],
    [Map, 'Step 4 — Follow your roadmap', 'Get a 6-stage roadmap (Foundation → … → Deployment) prioritized by your gaps. Check off tasks, earn XP, complete courses & projects.'],
    [BarChart3, 'Step 5 — Track & re-analyze', 'Watch readiness climb on every re-analysis. Your history chart proves growth — perfect for interviews and portfolios.'],
  ];
  return (
    <PublicLayout>
      <div className="page"><div className="container" style={{ maxWidth: 820 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}><h1 style={{ marginBottom: 8 }}>How It Works</h1>
          <p style={{ color: 'var(--muted)' }}>The SkillPath loop: measure → learn → prove.</p></div>
        <div className="grid">
          {steps.map(([Icon, t, d], i) => (
            <div key={i} className="card hover" style={{ display: 'flex', gap: 16 }}>
              <div className="f-icon feature-card" style={{ width: 50, height: 50, borderRadius: 15, background: 'var(--grad)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon size={23} /></div>
              <div><div style={{ fontWeight: 800, fontSize: 16 }}>{t}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6, lineHeight: 1.65 }}>{d}</div></div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/signup" className="btn btn-primary btn-lg">Start Step 1 Now <ArrowRight size={18} /></Link>
        </div>
      </div></div>
    </PublicLayout>
  );
}

/* ---------------- ABOUT ---------------- */
export function About() {
  return (
    <PublicLayout>
      <div className="page"><div className="container" style={{ maxWidth: 860 }}>
        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <span className="pill"><Rocket size={14} color="#C9974B" /> Our Mission</span>
          <h1 style={{ margin: '16px 0 10px' }}>Guided, measurable career growth</h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7 }}>Job postings list 20 skills. Tutorials teach 200. Nobody tells <em>you</em> which 5 to learn next. SkillPath closes that loop with data-driven gap analysis and a roadmap that adapts to your actual profile.</p>
        </div>
        <div className="grid grid-3">
          {[
            ['🎯', 'Precision', 'Weighted scoring mirrors real hiring priorities — not all skills are equal.'],
            ['📈', 'Proof of growth', 'Every re-analysis is saved. Show recruiters a readiness curve, not just claims.'],
            ['🧭', 'Guidance', 'Roadmaps, courses, projects and certs — sequenced so you always know the next step.'],
          ].map(([e, t, d], i) => (
            <div key={i} className="card hover" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 34 }}>{e}</div>
              <div style={{ fontWeight: 800, marginTop: 8 }}>{t}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>{d}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 22 }}>
          <div className="card-title"><CheckCircle2 size={18} color="#10b981" /> What makes SkillPath different</div>
          <div className="grid grid-2" style={{ marginTop: 14 }}>
            {['Resume parsing built-in', '8 researched career tracks', 'Realtime Socket.io notifications', 'Full admin & analytics panel', 'Google OAuth + JWT sessions', 'Gamified XP progress system'].map((x) => (
              <div key={x} style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 14, fontWeight: 600 }}><CheckCircle2 size={16} color="#C9974B" /> {x}</div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link to="/signup" className="btn btn-primary btn-lg">Join SkillPath Free <ArrowRight size={18} /></Link>
        </div>
        <div className="card" style={{ marginTop: 22, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <Award size={26} color="#5E9C86" />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 800 }}>Built as a real-world MERN portfolio project</div>
            <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>React 18 • Express • MongoDB • Mongoose • Google OAuth • Socket.io</div>
          </div>
        </div>
      </div></div>
    </PublicLayout>
  );
}

export function NotFound() {
  return (
    <PublicLayout>
      <div className="page"><div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 84, fontWeight: 800, fontFamily: 'Space Grotesk' }} className="grad-text">404</div>
        <h2>Path not found</h2>
        <p style={{ color: 'var(--muted)' }}>This route doesn't exist. Let's get you back on track.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 10 }}>Back Home</Link>
      </div></div>
    </PublicLayout>
  );
}
