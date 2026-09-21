import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp, Menu, X, Sun, Moon, Monitor, Bell, LogOut, LayoutDashboard,
  User, Cpu, GitCompareArrows, Map, BookOpen, FolderKanban, Award, BarChart3,
  Settings as SettingsIcon, ShieldCheck, CheckCheck, Zap, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { Avatar } from './ui';

export const Logo = () => (
  <Link to="/" className="brand">
    <span className="brand-mark"><TrendingUp size={19} strokeWidth={2.6} /></span>
    SkillPath
  </Link>
);

const GithubIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

function ThemeButton() {
  const { theme, cycle } = useTheme();
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return <button className="icon-btn" onClick={cycle} title={`Theme: ${theme} (click to change)`}><Icon size={18} /></button>;
}

function NotifBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unread, markRead, markAllRead } = useSocket();
  const nav = useNavigate();
  return (
    <div style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={() => setOpen(!open)} title="Notifications">
        <Bell size={18} />{unread > 0 && <span className="notif-dot">{unread}</span>}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 80 }} onClick={() => setOpen(false)} />
          <div className="notif-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid var(--border-soft)' }}>
              <strong style={{ fontSize: 14 }}>Notifications {unread > 0 && `(${unread})`}</strong>
              <button className="btn btn-soft btn-sm" onClick={markAllRead}><CheckCheck size={14} /> Read all</button>
            </div>
            {notifications.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>No notifications yet — run an analysis to get AI updates.</div>}
            {notifications.map((n) => (
              <div key={n._id || n.id} className={`notif-item${n.read ? '' : ' unread'}`}
                onClick={() => { markRead(n._id); setOpen(false); if (n.link) nav(n.link); }}>
                <div style={{ fontWeight: 800 }}>{n.title}</div>
                <div style={{ color: 'var(--muted)', marginTop: 2 }}>{n.message}</div>
                <div style={{ color: 'var(--faint)', fontSize: 11.5, marginTop: 4 }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : 'just now'}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const [drop, setDrop] = useState(false);
  const nav = useNavigate();
  const links = [['/', 'Home'], ['/features', 'Features'], ['/how-it-works', 'How It Works'], ['/about', 'About']];

  const doLogout = async () => { await logout(); nav('/'); };

  return (
    <nav className="nav">
      <div className="nav-inner" style={{ position: 'relative' }}>
        <Logo />
        <div className={`nav-links${menu ? ' open' : ''}`}>
          {!user && links.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setMenu(false)} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}
        </div>
        <div className="nav-right">
          <ThemeButton />
          {user ? (
            <>
              <NotifBell />
              <div style={{ position: 'relative' }}>
                <button onClick={() => setDrop(!drop)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>
                  <Avatar src={user.photoURL} name={user.name} size={36} />
                  <ChevronDown size={15} style={{ color: 'var(--muted)' }} />
                </button>
                {drop && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 80 }} onClick={() => setDrop(false)} />
                    <div className="notif-panel" style={{ width: 230 }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{user.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>{user.email}</div>
                      </div>
                      {[
                        [user.role === 'admin' ? '/admin' : '/dashboard', 'Dashboard', LayoutDashboard],
                        ['/profile', 'My Profile', User],
                        ['/settings', 'Settings', SettingsIcon],
                      ].map(([to, label, Icon]) => (
                        <Link key={to} to={to} onClick={() => setDrop(false)} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 16px', fontSize: 14, fontWeight: 600 }}>
                          <Icon size={16} /> {label}
                        </Link>
                      ))}
                      <button onClick={doLogout} style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '11px 16px', fontSize: 14, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ padding: '9px 18px' }}>Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm" style={{ padding: '9px 18px' }}>Get Started</Link>
            </>
          )}
          <button className="icon-btn mobile-toggle" onClick={() => setMenu(!menu)}>{menu ? <X size={19} /> : <Menu size={19} />}</button>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 12, maxWidth: 300, lineHeight: 1.6 }}>
              AI-powered skill gap analysis, personalized roadmaps and job-readiness tracking for modern tech careers.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>Product</div>
            <Link to="/features">Features</Link><Link to="/how-it-works">How It Works</Link><Link to="/about">About</Link><Link to="/signup">Get Started</Link>
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>Learn</div>
            <Link to="/gap-analysis">Skill Gap Analysis</Link><Link to="/roadmap">Learning Roadmap</Link><Link to="/courses">Courses</Link><Link to="/projects">Projects</Link>
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>Account</div>
            <Link to="/login">Login</Link><Link to="/signup">Sign Up</Link><Link to="/forgot-password">Forgot Password</Link><Link to="/dashboard">Dashboard</Link>
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>Legal</div>
            <Link to="/privacy-policy">Privacy Policy</Link><Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SkillPath – AI Skill Gap Analyzer. Built with the MERN stack.</span>
          <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Zap size={13} /> Profile → Resume → Skills → Target Job → AI Analysis → Roadmap → Job Ready
            </span>
            <a
              href="https://github.com/sathiya0529/AI-skillpath-analyzer"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              title="View source on GitHub"
              className="footer-github"
            >
              <GithubIcon size={22} />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

const SIDE = [
  { section: 'Overview' },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: User },
  { section: 'Growth' },
  { to: '/skills', label: 'Skills', icon: Cpu },
  { to: '/gap-analysis', label: 'Skill Gap Analysis', icon: GitCompareArrows },
  { to: '/roadmap', label: 'Learning Roadmap', icon: Map },
  { section: 'Learning' },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/certifications', label: 'Certifications', icon: Award },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { section: 'Other' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ open, close }) {
  const loc = useLocation();
  const { user } = useAuth();
  return (
    <>
      <div className={`side-overlay${open ? ' show' : ''}`} onClick={close} />
      <aside className={`sidebar${open ? ' open' : ''}`}>
        {user?.role === 'admin' && (
          <Link to="/admin" onClick={close} className={`side-link${loc.pathname.startsWith('/admin') ? ' active' : ''}`}>
            <ShieldCheck size={18} /> Admin Panel
          </Link>
        )}
        {SIDE.map((s, i) => s.section
          ? <div key={i} className="side-section">{s.section}</div>
          : <Link key={i} to={s.to} onClick={close} className={`side-link${loc.pathname === s.to ? ' active' : ''}`}><s.icon size={18} /> {s.label}</Link>)}
      </aside>
    </>
  );
}

export function AdminLayout({ children, tab, onTabChange, tabs = [] }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const doLogout = async () => { await logout(); nav('/login', { replace: true }); };
  return (
    <div className="admin-shell">
      <div className="admin-mobilebar">
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}><Menu size={15} /> Admin Menu</button>
      </div>
      <div className={`admin-overlay${open ? ' show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`admin-sidebar${open ? ' open' : ''}`}>
        <div className="admin-brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span>SkillPath Admin</span></div>
        <div className="admin-user">
          <Avatar src={user?.photoURL} name={user?.name} size={34} />
          <div><strong>{user?.name || 'Administrator'}</strong><small>{user?.email}</small></div>
        </div>
        <div className="admin-nav">
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={`admin-nav-item${tab === id ? ' active' : ''}`} onClick={() => { onTabChange(id); setOpen(false); }}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </div>
        <div className="admin-side-bottom">
          <button className="admin-nav-item" onClick={doLogout}><LogOut size={17} /> Logout</button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

export function PublicLayout({ children }) {
  return <><Navbar /><main>{children}</main><Footer /></>;
}

export function DashboardLayout({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Navbar />
      <div className="dash">
        <Sidebar open={open} close={() => setOpen(false)} />
        <div className="dash-main">
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14, display: 'none' }} id="x" />
          <div style={{ marginBottom: 6 }} className="side-fab">
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)} style={{ gap: 6 }}><Menu size={15} /> Menu</button>
          </div>
          {children}
        </div>
      </div>
      <style>{`@media(min-width:961px){.side-fab{display:none}}`}</style>
    </>
  );
}
