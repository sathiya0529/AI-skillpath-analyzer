import { useEffect, useState } from 'react';
import { Search, ExternalLink, CheckCircle2, Star, Clock, Signal, Award, BookOpen, FolderKanban } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Loader, Badge, Empty } from '../components/ui';
import api, { errMsg } from '../services/api';

function useCatalog(entity) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [progress, setProgress] = useState(null);

  const load = async (query = '') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/${entity}${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      const key = entity.replace('-', '');
      setItems(data[key] || data[entity] || []);
      const p = await api.get('/progress').catch(() => null);
      if (p) setProgress(p.data.progress);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return { items, loading, q, setQ, load, progress, setProgress };
}

const complete = async (kind, id, title, setProgress) => {
  try {
    const { data } = await api.post('/progress/complete', { kind, id, title });
    setProgress(data.progress);
  } catch {}
};

function SearchBar({ q, setQ, load, placeholder }) {
  return (
    <form className="searchbar" onSubmit={(e) => { e.preventDefault(); load(q); }}>
      <input className="input" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn btn-primary"><Search size={16} /> Search</button>
    </form>
  );
}

/* ---------- COURSES ---------- */
export function Courses() {
  const { items, loading, q, setQ, load, progress, setProgress } = useCatalog('courses');
  const done = new Set((progress?.completedCourses || []).map((c) => String(c.id)));
  return (
    <DashboardLayout>
      <div className="page-head"><div><h1>Courses</h1><p>{items.length} curated courses · {done.size} completed</p></div></div>
      <SearchBar q={q} setQ={setQ} load={load} placeholder="Search courses, skills, providers…" />
      {loading ? <Loader /> : items.length === 0 ? <div className="card"><Empty title="No courses found" sub="Try a different search." /></div> : (
        <div className="grid grid-3">
          {items.map((c) => (
            <div key={c._id} className="card hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                <Badge tone="blue">{c.skill}</Badge><Badge tone="gray">{c.level}</Badge>
                {c.free ? <Badge tone="green">Free</Badge> : <Badge tone="amber">{c.price}</Badge>}
              </div>
              <div style={{ fontWeight: 800 }}>{c.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>{c.provider}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, flex: 1 }}>{c.description}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12.5, color: 'var(--muted)', marginTop: 10 }}>
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Star size={13} /> {c.rating}</span>
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Clock size={13} /> {c.duration}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <a href={c.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ flex: 1 }}><ExternalLink size={14} /> Open</a>
                <button className={`btn btn-sm ${done.has(String(c._id)) ? 'btn-ghost' : 'btn-soft'}`} style={{ flex: 1 }} onClick={() => complete('course', c._id, c.title, setProgress)}>
                  <CheckCircle2 size={14} /> {done.has(String(c._id)) ? 'Done ✓' : 'Mark Done'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

/* ---------- PROJECTS ---------- */
export function Projects() {
  const { items, loading, q, setQ, load, progress, setProgress } = useCatalog('projects');
  const done = new Set((progress?.completedProjects || []).map((c) => String(c.id)));
  return (
    <DashboardLayout>
      <div className="page-head"><div><h1>Projects</h1><p>{items.length} portfolio-grade builds · {done.size} completed</p></div></div>
      <SearchBar q={q} setQ={setQ} load={load} placeholder="Search projects, skills…" />
      {loading ? <Loader /> : items.length === 0 ? <div className="card"><Empty icon={FolderKanban} title="No projects found" /></div> : (
        <div className="grid grid-2">
          {items.map((p) => (
            <div key={p._id} className="card hover">
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                <Badge tone="amber"><Signal size={11} /> {p.difficulty}</Badge>
                <Badge tone="gray"><Clock size={11} /> {p.duration}</Badge>
                {(p.skills || []).slice(0, 3).map((s) => <Badge key={s} tone="blue">{s}</Badge>)}
              </div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{p.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6 }}>{p.description}</div>
              {p.guide && <div style={{ fontSize: 13, marginTop: 10, padding: 10, background: 'var(--primary-soft)', borderRadius: 10 }}><strong>Build guide:</strong> {p.guide}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><ExternalLink size={14} /> Repo</a>}
                <button className={`btn btn-sm ${done.has(String(p._id)) ? 'btn-ghost' : 'btn-soft'}`} onClick={() => complete('project', p._id, p.title, setProgress)}>
                  <CheckCircle2 size={14} /> {done.has(String(p._id)) ? 'Completed ✓ (+50 XP)' : 'Mark Complete (+50 XP)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

/* ---------- CERTIFICATIONS ---------- */
export function Certifications() {
  const { items, loading, q, setQ, load } = useCatalog('certifications');
  return (
    <DashboardLayout>
      <div className="page-head"><div><h1>Certifications</h1><p>{items.length} credentials to boost your resume</p></div></div>
      <SearchBar q={q} setQ={setQ} load={load} placeholder="Search certifications…" />
      {loading ? <Loader /> : items.length === 0 ? <div className="card"><Empty icon={Award} title="No certifications found" /></div> : (
        <div className="grid grid-2">
          {items.map((c) => (
            <div key={c._id} className="card hover" style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: 'var(--grad)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Award size={24} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{c.issuer} · {c.skill}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{c.description}</div>
                <div style={{ display: 'flex', gap: 7, marginTop: 9, flexWrap: 'wrap' }}>
                  <Badge tone="blue">{c.cost}</Badge><Badge tone="gray">{c.duration}</Badge>
                  <a href={c.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}><ExternalLink size={13} /> Details</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="card" style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <BookOpen size={22} color="#C9974B" />
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>Tip: certifications aligned with your <strong>missing skills</strong> appear first in Gap Analysis recommendations.</div>
      </div>
    </DashboardLayout>
  );
}
