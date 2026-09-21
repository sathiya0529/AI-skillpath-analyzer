import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Target, CheckCircle2, AlertTriangle, XCircle, TrendingUp, BookOpen, FolderKanban, Award, ExternalLink, RefreshCw, Briefcase } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Loader, Donut, Badge, Empty, ProgressBar, LineChart } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../services/api';

export default function GapAnalysis() {
  const { user, refreshUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [improved, setImproved] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [r, l, h] = await Promise.all([api.get('/job-roles'), api.get('/analysis/latest'), api.get('/analysis/history')]);
        const list = r.data.jobroles || r.data['job-roles'] || [];
        setRoles(list);
        setRole(user?.targetRole || list[0]?.title || '');
        setAnalysis(l.data.analysis);
        setHistory(h.data.history || []);
      } catch (e) { setErr(errMsg(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  const run = async () => {
    if (!role) return setErr('Select a target job role first.');
    setBusy(true); setErr(''); setImproved(0);
    try {
      const { data } = await api.post('/analysis', { targetRole: role });
      setAnalysis(data.analysis);
      setImproved(data.improved || 0);
      const h = await api.get('/analysis/history');
      setHistory(h.data.history || []);
      await refreshUser();
    } catch (e) { setErr(errMsg(e)); }
    finally { setBusy(false); }
  };

  if (loading) return <DashboardLayout><Loader label="Loading analysis…" /></DashboardLayout>;

  const sel = roles.find((r) => r.title === role);
  const rec = analysis?.recommendations || {};

  return (
    <DashboardLayout>
      <div className="page-head">
        <div><h1>Skill Gap Analysis</h1><p>Compare your skills with your target role, powered by AI.</p></div>
        {history.length > 0 && <Badge tone="blue">{history.length} analyse(s) run</Badge>}
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 13, fontWeight: 800, display: 'flex', gap: 6, alignItems: 'center', marginBottom: 7 }}><Target size={14} /> TARGET JOB ROLE</label>
            <select className="select" value={role} onChange={async (e) => { const next = e.target.value; setRole(next); setErr(''); try { await api.put('/auth/profile', { targetRole: next }); await refreshUser(); } catch (error) { setErr(errMsg(error, 'Could not save target role.')); } }}>
              {roles.map((r) => <option key={r._id} value={r.title}>{r.title}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-lg" onClick={run} disabled={busy}>
            {busy ? <><RefreshCw size={18} className="spin" /> Analyzing…</> : <><Sparkles size={18} /> {analysis ? 'Re-Analyze Skills' : 'Run AI Analysis'}</>}
          </button>
        </div>
        {sel && <div style={{ marginTop: 12, fontSize: 13.5, color: 'var(--muted)' }}><Briefcase size={13} style={{ verticalAlign: -1 }} /> {sel.description} · <strong>{sel.salaryRange}</strong> · {sel.requiredSkills?.length} required skills</div>}
        {err && <div className="form-err" style={{ marginTop: 10 }}>{err}</div>}
        {improved > 0 && <div className="form-ok" style={{ marginTop: 10 }}>▲ {improved}% improvement since last analysis — great progress!</div>}
      </div>

      {!analysis && (
        <div className="card"><Empty icon={Sparkles} title="No analysis yet" sub="Select your target role above and hit Run AI Analysis to get your readiness score, gap breakdown and recommendations." action={<button className="btn btn-primary" onClick={run} disabled={busy}>Run First Analysis</button>} /></div>
      )}

      {analysis && (
        <>
          <div className="grid grid-3">
            <div className="card hover" style={{ textAlign: 'center' }}>
              <div className="card-title" style={{ justifyContent: 'center' }}>Job Readiness</div>
              <div style={{ marginTop: 8 }}><Donut value={analysis.readinessScore} size={170} label="READY" /></div>
            </div>
            <div className="card hover" style={{ textAlign: 'center' }}>
              <div className="card-title" style={{ justifyContent: 'center' }}>Skill Gap</div>
              <div style={{ marginTop: 8 }}><Donut value={analysis.gapPercent} size={170} label="GAP" /></div>
            </div>
            <div className="card hover">
              <div className="card-title"><TrendingUp size={17} color="#C9974B" /> Score History</div>
              <div className="card-sub">Readiness over time</div>
              <div style={{ marginTop: 12 }}><LineChart data={[...history].reverse().map((h) => h.readinessScore)} height={140} /></div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>Latest: {new Date(analysis.createdAt).toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginTop: 18 }}>
            <div className="card hover">
              <div className="card-title"><CheckCircle2 size={17} color="#10b981" /> Strong ({analysis.strong?.length || 0})</div>
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {(analysis.strong || []).map((s, i) => (
                  <div key={i}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}><span>{s.name}</span><span style={{ color: 'var(--muted)' }}>Lv {s.level}/{s.minLevel}</span></div>
                    <div style={{ marginTop: 4 }}><ProgressBar value={(s.level / 5) * 100} thin /></div></div>
                ))}
                {!analysis.strong?.length && <div style={{ fontSize: 13, color: 'var(--muted)' }}>None yet — complete roadmap tasks to build strengths.</div>}
              </div>
            </div>
            <div className="card hover">
              <div className="card-title"><AlertTriangle size={17} color="#d97706" /> Weak ({analysis.weak?.length || 0})</div>
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {(analysis.weak || []).map((s, i) => (
                  <div key={i}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}><span>{s.name}</span><span style={{ color: 'var(--muted)' }}>Lv {s.level} → {s.minLevel}</span></div>
                    <div style={{ marginTop: 4 }}><ProgressBar value={(s.level / s.minLevel) * 100} thin /></div></div>
                ))}
                {!analysis.weak?.length && <div style={{ fontSize: 13, color: 'var(--muted)' }}>No weak skills — excellent!</div>}
              </div>
            </div>
            <div className="card hover">
              <div className="card-title"><XCircle size={17} color="#ef4444" /> Missing ({analysis.missing?.length || 0})</div>
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {(analysis.missing || []).map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, padding: '9px 12px', background: 'rgba(239,68,68,.08)', borderRadius: 10 }}>
                    <span>{s.name}</span><Badge tone={s.weight >= 4 ? 'red' : 'amber'}>weight {s.weight}</Badge>
                  </div>
                ))}
                {!analysis.missing?.length && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Zero missing skills — interview ready! 🎉</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginTop: 18 }}>
            <div className="card hover">
              <div className="card-title">🧠 AI Insights</div>
              <div style={{ marginTop: 12, display: 'grid', gap: 9 }}>
                {(analysis.insights || []).map((t, i) => <div key={i} style={{ fontSize: 13.5, lineHeight: 1.6, padding: '10px 13px', background: 'var(--primary-soft)', borderRadius: 11 }}>{t}</div>)}
              </div>
              <div style={{ marginTop: 14 }}><Link to="/roadmap" className="btn btn-primary btn-block">Generate My Roadmap</Link></div>
            </div>
            <div className="card hover">
              <div className="card-title">📚 Current vs Required</div>
              <div style={{ marginTop: 12, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {(analysis.required || []).map((s, i) => {
                  const st = analysis.strong?.find((x) => x.name === s.name) ? 'green' : analysis.weak?.find((x) => x.name === s.name) ? 'amber' : 'red';
                  return <Badge key={i} tone={st}>{s.name}</Badge>;
                })}
              </div>
              <div className="card-sub" style={{ marginTop: 12 }}>Your skills: {(analysis.currentSkills || []).map((s) => s.name).join(', ') || '—'}</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-title">🎯 Recommended For Your Gaps</div>
            <div className="grid grid-2" style={{ marginTop: 14 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}><BookOpen size={15} /> COURSES</div>
                {(rec.courses || []).slice(0, 4).map((c, i) => (
                  <a key={i} href={c.url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: 10, border: '1px solid var(--border-soft)', borderRadius: 11, marginBottom: 8, fontSize: 13 }}>
                    <strong>{c.title}</strong><br /><span style={{ color: 'var(--muted)' }}>{c.provider} · {c.skill} · {c.free ? 'Free' : c.price}</span>
                  </a>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}><FolderKanban size={15} /> PROJECTS & CERTS</div>
                {(rec.projects || []).slice(0, 2).map((p, i) => (
                  <div key={i} style={{ padding: 10, border: '1px solid var(--border-soft)', borderRadius: 11, marginBottom: 8, fontSize: 13 }}><strong>{p.title}</strong><br /><span style={{ color: 'var(--muted)' }}>{p.difficulty} · {p.duration}</span></div>
                ))}
                {(rec.certifications || []).slice(0, 2).map((c, i) => (
                  <div key={i} style={{ padding: 10, border: '1px solid var(--border-soft)', borderRadius: 11, marginBottom: 8, fontSize: 13 }}><Award size={13} style={{ verticalAlign: -1 }} /> <strong>{c.title}</strong><br /><span style={{ color: 'var(--muted)' }}>{c.issuer} · {c.cost}</span></div>
                ))}
                <Link to="/courses" className="btn btn-ghost btn-sm">Browse all <ExternalLink size={13} /></Link>
              </div>
            </div>
          </div>
        </>
      )}
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </DashboardLayout>
  );
}
