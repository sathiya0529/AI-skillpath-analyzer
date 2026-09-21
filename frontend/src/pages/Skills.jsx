import { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, FileText, Sparkles, Cpu, Heart } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Loader, Badge, Empty } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../services/api';

const LEVELS = ['—', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

export default function Skills() {
  const { user, refreshUser } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'technical', level: 3, years: 1 });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [extracted, setExtracted] = useState(null);

  useEffect(() => {
    api.get('/skills').then(({ data }) => setCatalog(data.skills || [])).catch(() => {});
  }, []);
  if (!user) return <DashboardLayout><Loader /></DashboardLayout>;

  const skills = user.skills || [];
  const tech = skills.filter((s) => s.category !== 'soft');
  const soft = skills.filter((s) => s.category === 'soft');

  const add = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim()) return setErr('Enter a skill name.');
    setBusy(true);
    try {
      await api.post('/skills', form);
      await refreshUser();
      setForm({ name: '', category: 'technical', level: 3, years: 1 });
    } catch (e) { setErr(errMsg(e)); }
    finally { setBusy(false); }
  };

  const remove = async (name) => {
    try { await api.delete(`/skills/${encodeURIComponent(name)}`); await refreshUser(); }
    catch (e) { setErr(errMsg(e)); }
  };

  const uploadResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeBusy(true); setErr(''); setExtracted(null);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const { data } = await api.post('/auth/resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      setExtracted(data.extracted || []);
    } catch (e) { setErr(errMsg(e, 'Resume upload failed')); }
    finally { setResumeBusy(false); }
  };

  const SkillRow = ({ s }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--border-soft)', borderRadius: 13, background: 'var(--bg-soft)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{s.name}</div>
        <div className="level-dots" style={{ marginTop: 7 }}>
          {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= (s.level || 1) ? 'on' : ''} />)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Badge tone={(s.level || 1) >= 4 ? 'green' : (s.level || 1) >= 3 ? 'blue' : 'amber'}>{LEVELS[s.level || 1]}</Badge>
        <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 4 }}>{s.years || 1}y exp</div>
      </div>
      <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => remove(s.name)} title="Remove"><Trash2 size={15} /></button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="page-head"><div><h1>My Skills</h1><p>{skills.length} skills · these drive your readiness score.</p></div></div>

      <div className="card" style={{ marginBottom: 18, background: 'linear-gradient(135deg, rgba(99,102,241,.08), rgba(6,182,212,.08))' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="f-icon" style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--grad)', color: '#fff', display: 'grid', placeItems: 'center' }}><FileText size={22} /></div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 800 }}>Upload resume for AI extraction 📄</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>PDF or TXT — skills are detected and merged into your profile. {user.resume?.filename && <>Current: <strong>{user.resume.filename}</strong></>}</div>
          </div>
          <label className="btn btn-primary">
            <Upload size={16} /> {resumeBusy ? 'Analyzing…' : 'Upload Resume'}
            <input type="file" accept=".pdf,.txt,.md,.doc,.docx" onChange={uploadResume} style={{ display: 'none' }} />
          </label>
        </div>
        {extracted && (
          <div style={{ marginTop: 14, padding: 13, background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-soft)' }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 8 }}><Sparkles size={14} style={{ verticalAlign: -2 }} /> Extracted {extracted.length} skill(s):</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{extracted.map((s, i) => <span key={i} className="chip">{s.name} <Badge tone="blue">Lv {s.level}</Badge></span>)}</div>
          </div>
        )}
      </div>

      {err && <div className="card" style={{ marginBottom: 14 }}><div className="form-err">{err}</div></div>}

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={add}>
          <div className="card-title"><Plus size={17} color="#C9974B" /> Add a Skill</div>
          <div className="card-sub">Or pick from {catalog.length} known skills</div>
          <div style={{ marginTop: 14 }}>
            <div className="field"><label>Skill name</label>
              <input className="input" list="skill-catalog" placeholder="e.g. React" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <datalist id="skill-catalog">{catalog.map((s) => <option key={s._id} value={s.name} />)}</datalist>
            </div>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="field"><label>Category</label>
                <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="technical">Technical</option><option value="soft">Soft skill</option>
                </select></div>
              <div className="field"><label>Years</label>
                <input className="input" type="number" min="0" max="20" value={form.years} onChange={(e) => setForm({ ...form, years: e.target.value })} /></div>
            </div>
            <div className="field"><label>Proficiency: {LEVELS[form.level]} ({form.level}/5)</label>
              <input type="range" min="1" max="5" value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} /></div>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Adding…' : 'Add Skill'}</button>
          </div>
        </form>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card">
            <div className="card-title"><Cpu size={17} color="#6C93B8" /> Technical ({tech.length})</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 9 }}>
              {tech.length === 0 && <Empty title="No technical skills" sub="Add your first one — or upload a resume." />}
              {tech.map((s, i) => <SkillRow key={i} s={s} />)}
            </div>
          </div>
          <div className="card">
            <div className="card-title"><Heart size={17} color="#8C7AA6" /> Soft Skills ({soft.length})</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 9 }}>
              {soft.length === 0 && <Empty title="No soft skills" sub="Communication & teamwork matter in hiring." />}
              {soft.map((s, i) => <SkillRow key={i} s={s} />)}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
