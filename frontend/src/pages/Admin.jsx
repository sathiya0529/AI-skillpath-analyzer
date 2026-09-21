import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Briefcase, Cpu, BookOpen, FolderKanban, Award, Link as LinkIcon, Plus, Pencil, Trash2, Megaphone, ShieldCheck, Search, X } from 'lucide-react';
import { AdminLayout } from '../components/layout';
import { Loader, Badge, Empty, Modal } from '../components/ui';
import api, { errMsg } from '../services/api';

const TABS = [
  ['overview', 'Overview', ShieldCheck],
  ['users', 'Users', Users],
  ['job-roles', 'Job Roles', Briefcase],
  ['skills', 'Skills', Cpu],
  ['courses', 'Courses', BookOpen],
  ['projects', 'Projects', FolderKanban],
  ['certifications', 'Certifications', Award],
  ['resources', 'Resources', LinkIcon],
  ['announce', 'Announcements', Megaphone],
];

const SCHEMAS = {
  skills: [['name', 'Name'], ['category', 'Category'], ['demand', 'Demand 1-5', 'number'], ['description', 'Description']],
  courses: [['title', 'Title'], ['provider', 'Provider'], ['skill', 'Skill'], ['level', 'Level'], ['duration', 'Duration'], ['rating', 'Rating', 'number'], ['free', 'Free (true/false)'], ['price', 'Price'], ['url', 'URL'], ['description', 'Description']],
  projects: [['title', 'Title'], ['description', 'Description'], ['difficulty', 'Difficulty'], ['duration', 'Duration'], ['guide', 'Build guide'], ['repoUrl', 'Repo URL']],
  certifications: [['title', 'Title'], ['issuer', 'Issuer'], ['skill', 'Skill'], ['cost', 'Cost'], ['duration', 'Duration'], ['url', 'URL'], ['description', 'Description']],
  resources: [['title', 'Title'], ['type', 'Type'], ['skill', 'Skill'], ['url', 'URL'], ['free', 'Free (true/false)'], ['rating', 'Rating', 'number'], ['description', 'Description']],
};

const coerce = (key, val, type) => {
  if (type === 'number') return Number(val) || 0;
  if (key === 'free') return String(val).toLowerCase() === 'true';
  return val;
};

function AdminPageHead({ title, sub, action }) {
  return <div className="page-head"><div><h1>{title}</h1><p>{sub}</p></div>{action}</div>;
}

function RoleSkillPicker({ value = [], onChange, skills }) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState(3);
  const [weight, setWeight] = useState(3);
  const selected = value || [];
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills.slice(0, 8);
    return skills.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, skills]);

  const add = (skill) => {
    const name = typeof skill === 'string' ? skill : skill.name;
    if (!name || selected.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...selected, { name, weight: Number(weight), minLevel: Number(level) }]);
    setQuery('');
  };
  const remove = (name) => onChange(selected.filter((s) => s.name !== name));

  return <div className="role-skill-picker">
    <div className="field"><label>Required skills</label>
      <div className="skill-search-row">
        <input className="input" list="admin-skill-list" placeholder="Type Python, React, Node.js…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const exact = skills.find((s) => s.name.toLowerCase() === query.trim().toLowerCase()); add(exact || query.trim()); } }} />
        <button type="button" className="btn btn-soft" onClick={() => { const exact = skills.find((s) => s.name.toLowerCase() === query.trim().toLowerCase()); add(exact || query.trim()); }}><Plus size={15} /> Add</button>
      </div>
      <datalist id="admin-skill-list">{skills.map((s) => <option key={s._id} value={s.name} />)}</datalist>
      {query && suggestions.length > 0 && <div className="skill-suggestions">{suggestions.map((s) => <button type="button" key={s._id} onClick={() => add(s)}><span>{s.name}</span><small>{s.category}</small></button>)}</div>}
    </div>
    <div className="grid grid-2" style={{ gap: 10 }}>
      <div className="field"><label>Minimum level: {level}/5</label><input type="range" min="1" max="5" value={level} onChange={(e) => setLevel(e.target.value)} /></div>
      <div className="field"><label>Importance: {weight}/5</label><input type="range" min="1" max="5" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
    </div>
    <div className="skill-chips">{selected.map((s) => <span className="skill-chip" key={s.name}><strong>{s.name}</strong><small>Lv {s.minLevel} · {s.weight}</small><button type="button" onClick={() => remove(s.name)} aria-label={`Remove ${s.name}`}><X size={13} /></button></span>)}</div>
    {!selected.length && <div className="form-hint">Start typing to choose a predefined skill. No JSON is required.</div>}
  </div>;
}

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathTab = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'overview';
  const [tab, setTab] = useState(TABS.some((x) => x[0] === pathTab) ? pathTab : 'overview');
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [announce, setAnnounce] = useState({ title: '', message: '' });
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  const loadStats = async () => { try { const { data } = await api.get('/admin/stats'); setStats(data); } catch (e) { setErr(errMsg(e)); } };
  const loadSkills = async () => { try { const { data } = await api.get('/skills'); setSkills(data.skills || []); } catch {} };
  const loadTab = async (t = tab) => {
    if (['overview', 'announce'].includes(t)) return;
    setLoading(true); setErr('');
    try {
      if (t === 'users') { const { data } = await api.get('/admin/users'); setRows(data.users || []); }
      else { const { data } = await api.get(`/${t}`); setRows(data[t.replace('-', '')] || data[t] || []); }
    } catch (e) { setErr(errMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    const next = TABS.some((x) => x[0] === pathTab) ? pathTab : 'overview';
    setTab(next);
  }, [pathTab]);
  useEffect(() => { loadStats(); loadSkills(); }, []);
  useEffect(() => { setEditing(null); setSearch(''); loadTab(tab); }, [tab]);

  const openNew = () => {
    if (tab === 'job-roles') setForm({ title: '', track: 'fullstack', salaryRange: '', demand: 4, description: '', requiredSkills: [] });
    else setForm({});
    setEditing({ _isNew: true });
  };
  const openEdit = (row) => { setForm({ ...row, requiredSkills: row.requiredSkills || [] }); setEditing(row); };
  const save = async () => {
    setErr('');
    try {
      if (tab === 'users') {
        await api.patch(`/admin/users/${editing._id}`, { role: form.role, name: form.name, targetRole: form.targetRole });
      } else if (tab === 'job-roles') {
        const body = { title: form.title?.trim(), track: form.track, salaryRange: form.salaryRange, demand: Number(form.demand) || 0, description: form.description, requiredSkills: form.requiredSkills || [] };
        if (!body.title) return setErr('Job role title is required.');
        if (editing._isNew) await api.post('/admin/job-roles', body); else await api.put(`/admin/job-roles/${editing._id}`, body);
      } else {
        const schema = SCHEMAS[tab] || []; const body = {};
        for (const [k, , type] of schema) if (form[k] !== undefined && form[k] !== '') body[k] = coerce(k, form[k], type);
        if (tab === 'projects') body.skills = typeof form.skills === 'string' ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : (form.skills || []);
        if (editing._isNew) await api.post(`/admin/${tab}`, body); else await api.put(`/admin/${tab}/${editing._id}`, body);
      }
      setEditing(null); await loadTab(tab); await loadStats(); await loadSkills();
    } catch (e) { setErr(errMsg(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { if (tab === 'users') await api.delete(`/admin/users/${id}`); else await api.delete(`/admin/${tab}/${id}`); await loadTab(tab); await loadStats(); } catch (e) { setErr(errMsg(e)); }
  };
  const sendAnnounce = async () => {
    setErr(''); setMsg('');
    if (!announce.title.trim() || !announce.message.trim()) return setErr('Announcement needs a title and message.');
    try { await api.post('/admin/announce', announce); setMsg('Announcement sent to users.'); setAnnounce({ title: '', message: '' }); } catch (e) { setErr(errMsg(e)); }
  };

  const filtered = rows.filter((r) => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
  const total = stats?.totals || {};
  const isCrud = !['overview', 'announce'].includes(tab);

  const tableCols = filtered.length ? Object.keys(filtered[0]).filter((k) => !['_id', 'passwordHash', 'createdAt', 'updatedAt', '__v', 'resume', 'preferences', 'googleId', 'text', 'requiredSkills'].includes(k)).slice(0, 6) : [];

  return <AdminLayout tab={tab} onTabChange={(next) => { setTab(next); navigate(next === 'overview' ? '/admin' : `/admin/${next}`); }} tabs={TABS}>
    {tab === 'overview' && <>
      <AdminPageHead title="Admin Panel" sub="Manage SkillPath users, job roles, skills and learning content." action={<Badge tone="amber">ADMIN ONLY</Badge>} />
      <div className="grid grid-4">
        {[['Users', total.users, Users], ['Job Roles', total.roles, Briefcase], ['Skills', total.skills, Cpu], ['Courses', total.courses, BookOpen], ['Projects', total.projects, FolderKanban], ['Certifications', total.certifications, Award], ['Resources', total.resources, LinkIcon], ['AI Analyses', total.analyses, ShieldCheck]].map(([label, value, Icon]) => <div className="card admin-stat" key={label}><Icon size={20} /><strong>{value ?? '—'}</strong><span>{label}</span></div>)}
      </div>
      <div className="card" style={{ marginTop: 18 }}><h3 style={{ marginTop: 0 }}>Admin workflow</h3><p className="card-sub">Use the left sidebar to manage only administrator functions. New job roles and skills are stored in the catalog and immediately become available to users.</p><div className="grid grid-3" style={{ marginTop: 16 }}><button className="btn btn-primary" onClick={() => { setTab('job-roles'); setTimeout(openNew, 0); }}><Plus size={15} /> Add Job Role</button><button className="btn btn-soft" onClick={() => setTab('skills')}><Cpu size={15} /> Manage Skills</button><button className="btn btn-soft" onClick={() => setTab('users')}><Users size={15} /> Manage Users</button></div></div>
    </>}

    {isCrud && <>
      <AdminPageHead title={TABS.find((x) => x[0] === tab)?.[1] || 'Admin'} sub={`Manage ${tab === 'job-roles' ? 'target job roles' : tab}.`} action={<button className="btn btn-primary" onClick={openNew}><Plus size={15} /> Add {tab === 'job-roles' ? 'Job Role' : tab.slice(0, -1).replace(/-/g, ' ')}</button>} />
      {err && <div className="form-err" style={{ marginBottom: 12 }}>{err}</div>}
      <div className="card">
        <div className="searchbar"><Search size={17} style={{ marginTop: 10, color: 'var(--muted)' }} /><input className="input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {loading ? <Loader label="Loading…" /> : !filtered.length ? <Empty title="Nothing here yet" sub="Add the first item using the button above." /> : <div className="table-wrap"><table className="tbl"><thead><tr>{tableCols.map((c) => <th key={c}>{c}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map((r) => <tr key={r._id}>{tableCols.map((c) => <td key={c}>{Array.isArray(r[c]) ? r[c].map((x) => typeof x === 'object' ? x.name : x).join(', ') : typeof r[c] === 'object' ? JSON.stringify(r[c]) : String(r[c] ?? '')}</td>)}<td style={{ whiteSpace: 'nowrap' }}><button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Pencil size={14} /></button>{' '}<button className="btn btn-danger btn-sm" onClick={() => remove(r._id)}><Trash2 size={14} /></button></td></tr>)}</tbody></table></div>}
      </div>
    </>}

    {tab === 'announce' && <>
      <AdminPageHead title="Announcements" sub="Send a platform notification to users." />
      <div className="card" style={{ maxWidth: 720 }}><div className="field"><label>Title</label><input className="input" value={announce.title} onChange={(e) => setAnnounce({ ...announce, title: e.target.value })} placeholder="New learning resources available" /></div><div className="field"><label>Message</label><textarea className="textarea" value={announce.message} onChange={(e) => setAnnounce({ ...announce, message: e.target.value })} placeholder="Tell users what changed…" /></div>{err && <div className="form-err" style={{ marginBottom: 10 }}>{err}</div>}{msg && <div className="form-ok" style={{ marginBottom: 10 }}>{msg}</div>}<button className="btn btn-primary" onClick={sendAnnounce}><Megaphone size={15} /> Send Announcement</button></div>
    </>}

    {editing && <Modal title={editing._isNew ? `Add ${tab === 'job-roles' ? 'Job Role' : tab}` : `Edit ${tab === 'job-roles' ? 'Job Role' : tab}`} onClose={() => setEditing(null)} wide>
      {tab === 'users' ? <><div className="field"><label>Name</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="field"><label>Role</label><select className="select" value={form.role || 'user'} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="user">user</option><option value="admin">admin</option></select></div><div className="field"><label>Target role</label><input className="input" value={form.targetRole || ''} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} /></div></> : tab === 'job-roles' ? <>
        <div className="grid grid-2"><div className="field"><label>Job role title *</label><input className="input" placeholder="Python Developer" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div><div className="field"><label>Track</label><select className="select" value={form.track || 'fullstack'} onChange={(e) => setForm({ ...form, track: e.target.value })}>{['fullstack','frontend','backend','data','ai','devops','mobile','uiux'].map((x) => <option key={x}>{x}</option>)}</select></div></div>
        <div className="grid grid-2"><div className="field"><label>Salary range</label><input className="input" placeholder="₹5–15 LPA" value={form.salaryRange || ''} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} /></div><div className="field"><label>Demand 1-5</label><input className="input" type="number" min="1" max="5" value={form.demand ?? 4} onChange={(e) => setForm({ ...form, demand: e.target.value })} /></div></div>
        <div className="field"><label>Description</label><textarea className="textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <RoleSkillPicker value={form.requiredSkills || []} onChange={(requiredSkills) => setForm({ ...form, requiredSkills })} skills={skills} />
      </> : <>{(SCHEMAS[tab] || []).map(([k, label, type]) => <div key={k} className="field"><label>{label}</label>{k === 'description' || k === 'guide' ? <textarea className="textarea" value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /> : <input className="input" type={type === 'number' ? 'number' : 'text'} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />}</div>)}{tab === 'projects' && <div className="field"><label>Skills (comma separated)</label><input className="input" value={typeof form.skills === 'string' ? form.skills : (form.skills || []).join(', ')} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>}</>}
      {err && <div className="form-err" style={{ marginBottom: 10 }}>{err}</div>}<div style={{ display: 'flex', gap: 10 }}><button className="btn btn-ghost" onClick={() => setEditing(null)} style={{ flex: 1 }}>Cancel</button><button className="btn btn-primary" onClick={save} style={{ flex: 1 }}>Save</button></div>
    </Modal>}
  </AdminLayout>;
}
