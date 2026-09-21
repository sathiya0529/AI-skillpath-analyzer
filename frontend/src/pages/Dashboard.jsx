import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gauge, Cpu, AlertTriangle, Map, BookOpen, Target, ArrowRight, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Loader, StatCard, Donut, HBars, Badge, Empty, ProgressBar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../services/api';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [savingRole, setSavingRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try { const { data } = await api.get('/dashboard'); setData(data); }
    catch (e) { setErr(errMsg(e, 'Failed to load dashboard')); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    load();
    api.get('/job-roles').then(({ data }) => setRoles(data.jobroles || data['job-roles'] || [])).catch(() => {});
  }, []);

  if (loading) return <DashboardLayout><Loader label="Loading your dashboard…" /></DashboardLayout>;
  if (err) return <DashboardLayout><div className="card">{err} <button className="btn btn-soft btn-sm" onClick={load} style={{ marginLeft: 8 }}>Retry</button></div></DashboardLayout>;

  const a = data.analysis;
  const catBars = (() => {
    const skills = data.user?.skills || [];
    const tech = skills.filter((s) => s.category !== 'soft');
    const soft = skills.filter((s) => s.category === 'soft');
    const avg = (arr) => arr.length ? Math.round(arr.reduce((s, x) => s + (x.level || 1), 0) / arr.length / 5 * 100) : 0;
    return [
      { label: 'Technical', value: avg(tech), suffix: '%' },
      { label: 'Soft skills', value: avg(soft), suffix: '%' },
      { label: 'Readiness', value: data.readiness, suffix: '%' },
      { label: 'Roadmap', value: data.learningProgress, suffix: '%' },
    ];
  })();

  return (
    <DashboardLayout>
      <div className="page-head">
        <div>
          <h1>Welcome back, {data.user?.name?.split(' ')[0]} 👋</h1>
          <p>{data.targetRole ? <>Targeting <strong>{data.targetRole}</strong> · keep pushing.</> : 'Set a target job role to unlock AI analysis.'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={15} /> Refresh</button>
          <Link to="/gap-analysis" className="btn btn-primary btn-sm"><Sparkles size={15} /> Run Analysis</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <label style={{ fontSize: 13, fontWeight: 800, display: 'block', marginBottom: 7 }}>TARGET JOB ROLE FOR ANALYTICS</label>
            <select className="select" value={data.targetRole || ''} disabled={savingRole} onChange={async (e) => {
              const targetRole = e.target.value;
              setRoleMsg(''); setSavingRole(true);
              try { await api.put('/auth/profile', { targetRole }); await refreshUser(); await load(); setRoleMsg('Target role saved. Run analysis to update your analytics.'); }
              catch (err) { setRoleMsg(errMsg(err, 'Could not save target role.')); }
              finally { setSavingRole(false); }
            }}>
              <option value="">Select a job role</option>
              {roles.map((r) => <option key={r._id} value={r.title}>{r.title}</option>)}
            </select>
          </div>
          <Link to="/gap-analysis" className="btn btn-primary"><Sparkles size={15} /> Open Analytics</Link>
        </div>
        {roleMsg && <div style={{ marginTop: 9, fontSize: 12.5, color: roleMsg.includes('saved') ? 'var(--success)' : 'var(--danger)' }}>{roleMsg}</div>}
      </div>

      <div className="grid grid-4">
        <StatCard icon={Gauge} color="linear-gradient(135deg,#C9974B,#5E9C86)" value={`${data.readiness}%`} label="Job Readiness" delta={data.readiness >= 75 ? 'Almost there' : data.readiness >= 40 ? 'In progress' : 'Just started'} deltaTone={data.readiness >= 75 ? 'green' : data.readiness >= 40 ? 'blue' : 'amber'} />
        <StatCard icon={Cpu} color="linear-gradient(135deg,#6C93B8,#6C93B8)" value={data.totalSkills} label="Total Skills" />
        <StatCard icon={AlertTriangle} color="linear-gradient(135deg,#f59e0b,#ef4444)" value={data.gaps} label="Skill Gaps" />
        <StatCard icon={Map} color="linear-gradient(135deg,#10b981,#6C93B8)" value={`${data.learningProgress}%`} label="Learning Progress" />
      </div>

      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <div className="card hover">
          <div className="card-title">Readiness Score</div>
          <div className="card-sub">vs {data.targetRole || 'your target role'}</div>
          <div style={{ marginTop: 12 }}><Donut value={data.readiness} size={165} label="READY" sub={a ? `Gap: ${a.gapPercent}% · ${a.missing?.length || 0} missing` : 'Run analysis to score'} /></div>
          <Link to="/gap-analysis" className="btn btn-soft btn-block" style={{ marginTop: 14 }}>View Full Analysis <ArrowRight size={15} /></Link>
        </div>
        <div className="card hover">
          <div className="card-title">Skill Analytics</div>
          <div className="card-sub">Category averages</div>
          <div style={{ marginTop: 16 }}><HBars data={catBars} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <Badge tone="green">{a?.strong?.length || 0} strong</Badge>
            <Badge tone="amber">{a?.weak?.length || 0} weak</Badge>
            <Badge tone="red">{a?.missing?.length || 0} missing</Badge>
            <Badge tone="blue">⚡ {data.xp} XP</Badge>
          </div>
        </div>
        <div className="card hover">
          <div className="card-title"><Target size={17} color="#C9974B" /> Target Job Role</div>
          <div className="card-sub">{data.targetRole || 'Not set yet'}</div>
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            <div className="card" style={{ padding: 14, background: 'var(--primary-soft)', border: 'none' }}>
              <div style={{ fontWeight: 800 }}>{data.targetRole || 'Pick your dream role'}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{a ? `${a.required?.length || 0} required skills tracked` : 'Analysis unlocks skill matching'}</div>
            </div>
            <Link to="/gap-analysis" className="btn btn-ghost btn-block">Change Role</Link>
            <Link to="/roadmap" className="btn btn-soft btn-block">My Roadmap · {data.learningProgress}%</Link>
            <ProgressBar value={data.learningProgress} thin />
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="card hover">
          <div className="card-title"><BookOpen size={17} color="#5E9C86" /> Recommended Resources</div>
          <div className="card-sub">Matched to your skill gaps</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {(data.recommendedResources || []).length === 0 && <Empty title="No recommendations yet" sub="Run an AI analysis to get resources matched to your gaps." action={<Link to="/gap-analysis" className="btn btn-primary btn-sm">Run Analysis</Link>} />}
            {(data.recommendedResources || []).map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 13px', border: '1px solid var(--border-soft)', borderRadius: 12 }}>
                <span style={{ flex: 1 }}><strong style={{ fontSize: 13.5 }}>{r.title}</strong><br /><span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.skill} · {r.free ? 'Free' : 'Paid'} · ⭐ {r.rating}</span></span>
                <ExternalLink size={15} color="var(--faint)" />
              </a>
            ))}
          </div>
        </div>
        <div className="card hover">
          <div className="card-title"><Sparkles size={17} color="#f59e0b" /> AI Insights</div>
          <div className="card-sub">From your latest analysis</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {(!a?.insights?.length) && <Empty title="No insights yet" sub="Your personalized AI feedback will appear here." />}
            {(a?.insights || []).slice(0, 4).map((t, i) => (
              <div key={i} style={{ fontSize: 13.5, lineHeight: 1.6, padding: '11px 13px', background: 'var(--primary-soft)', borderRadius: 12 }}>{t}</div>
            ))}
          </div>
          <div className="grid grid-2" style={{ marginTop: 14 }}>
            <Link to="/courses" className="btn btn-ghost btn-sm">Courses · {data.completedCourses} done</Link>
            <Link to="/progress" className="btn btn-ghost btn-sm">Track Progress</Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
