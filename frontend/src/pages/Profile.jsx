import { useEffect, useState } from 'react';
import { Camera, Save, Briefcase, MapPin, Link as LinkIcon, Github, Linkedin, Phone } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Loader, Avatar, Badge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../services/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(null);
  const [roles, setRoles] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) setForm({ ...user });
    api.get('/job-roles').then(({ data }) => setRoles(data.jobroles || data['job-roles'] || [])).catch(() => {});
  }, [user]);

  // Clean up the object URL we create for the local preview so we don't leak memory
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  if (!form) return <DashboardLayout><Loader /></DashboardLayout>;
  const set = (k, v) => setForm({ ...form, [k]: v });

  const save = async (e) => {
    e.preventDefault();
    setErr(''); setMsg(''); setBusy(true);
    try {
      await api.put('/auth/profile', form);
      await refreshUser();
      setMsg('Profile saved successfully ✓');
    } catch (e) { setErr(errMsg(e, 'Failed to save')); }
    finally { setBusy(false); }
  };

  const avatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview while the upload is in flight
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    setAvatarBusy(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.post('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const updatedUser = await refreshUser();

      // Prefer the real URL from the server (works after reload too), falling back
      // to whatever refreshUser gave us. Cache-bust so the browser doesn't keep
      // showing the old image cached at the same URL.
      const newUrl = data?.photoURL || data?.user?.photoURL || updatedUser?.photoURL || updatedUser?.data?.photoURL;
      if (newUrl) {
        const busted = `${newUrl.split('?')[0]}?t=${Date.now()}`;
        set('photoURL', busted);
      }

      // Drop the temporary blob preview now that the permanent URL is showing
      URL.revokeObjectURL(localUrl);
      setAvatarPreview(null);
      setMsg('Profile picture updated ✓');
    } catch (e) {
      URL.revokeObjectURL(localUrl);
      setAvatarPreview(null);
      setErr(errMsg(e, 'Avatar upload failed'));
    }
    finally { setAvatarBusy(false); }
  };

  return (
    <DashboardLayout>
      <div className="page-head"><div><h1>My Profile</h1><p>This powers your AI analysis — keep it fresh.</p></div>
        <Badge tone={form.role === 'admin' ? 'amber' : 'blue'}>{form.role === 'admin' ? 'ADMIN' : 'LEARNER'}</Badge></div>
      <div className="grid" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar src={avatarPreview || form.photoURL} name={form.name} size={110} />
            <label style={{ position: 'absolute', bottom: 2, right: 2, width: 34, height: 34, borderRadius: 99, background: 'var(--grad)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }} title="Upload profile picture">
              <Camera size={16} />
              <input type="file" accept="image/*" onChange={avatar} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 12 }}>{form.name}</div>
          <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{form.email}</div>
          {form.headline && <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600 }}>{form.headline}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            <Badge tone="blue">{(form.skills || []).length} skills</Badge>
            {form.targetRole && <Badge tone="green">{form.targetRole}</Badge>}
          </div>
          {avatarBusy && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10 }}>Uploading…</div>}
          {form.resume?.url && <a href={form.resume.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>View Resume</a>}
        </div>

        <form className="card" onSubmit={save}>
          <div className="grid grid-2">
            <div className="field"><label>Full name</label><input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="field"><label><Briefcase size={13} style={{ verticalAlign: -1 }} /> Headline</label><input className="input" placeholder="Aspiring Full-Stack Developer" value={form.headline || ''} onChange={(e) => set('headline', e.target.value)} /></div>
          </div>
          <div className="field"><label>Bio</label><textarea className="textarea" placeholder="Tell us about your goals…" value={form.bio || ''} onChange={(e) => set('bio', e.target.value)} /></div>
          <div className="grid grid-2">
            <div className="field"><label><MapPin size={13} style={{ verticalAlign: -1 }} /> Location</label><input className="input" placeholder="Coimbatore, India" value={form.location || ''} onChange={(e) => set('location', e.target.value)} /></div>
            <div className="field"><label><Phone size={13} style={{ verticalAlign: -1 }} /> Phone</label><input className="input" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
          </div>
          <div className="grid grid-2">
            <div className="field"><label><LinkIcon size={13} style={{ verticalAlign: -1 }} /> Website</label><input className="input" placeholder="https://" value={form.website || ''} onChange={(e) => set('website', e.target.value)} /></div>
            <div className="field"><label><Github size={13} style={{ verticalAlign: -1 }} /> GitHub</label><input className="input" placeholder="github.com/you" value={form.github || ''} onChange={(e) => set('github', e.target.value)} /></div>
          </div>
          <div className="grid grid-2">
            <div className="field"><label><Linkedin size={13} style={{ verticalAlign: -1 }} /> LinkedIn</label><input className="input" placeholder="linkedin.com/in/you" value={form.linkedin || ''} onChange={(e) => set('linkedin', e.target.value)} /></div>
            <div className="field"><label>🎯 Target Job Role</label>
              <select className="select" value={form.targetRole || ''} onChange={(e) => set('targetRole', e.target.value)}>
                <option value="">— Select —</option>
                {roles.map((r) => <option key={r._id} value={r.title}>{r.title}</option>)}
              </select>
            </div>
          </div>
          {err && <div className="form-err" style={{ marginBottom: 10 }}>{err}</div>}
          {msg && <div className="form-ok" style={{ marginBottom: 10 }}>{msg}</div>}
          <button className="btn btn-primary" disabled={busy}><Save size={16} /> {busy ? 'Saving…' : 'Save Profile'}</button>
        </form>
      </div>
      <style>{`@media(max-width:860px){.grid[style]{grid-template-columns:1fr !important}}`}</style>
    </DashboardLayout>
  );
}
