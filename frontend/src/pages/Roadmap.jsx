import { useEffect, useState } from 'react';
import { Map, Check, RefreshCw, Clock, Signal, ExternalLink, Flame } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Loader, Badge, Empty, ProgressBar } from '../components/ui';
import api, { errMsg } from '../services/api';

const DIFF = { Beginner: 'green', Intermediate: 'blue', Advanced: 'amber' };

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [stage, setStage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    try { const { data } = await api.get('/roadmap'); setRoadmap(data.roadmap); }
    catch (e) { setErr(errMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setBusy(true); setErr('');
    try { const { data } = await api.post('/roadmap'); setRoadmap(data.roadmap); setStage(0); }
    catch (e) { setErr(errMsg(e, 'Set a target role (Profile page) before generating a roadmap.')); }
    finally { setBusy(false); }
  };

  const toggle = async (si, ti) => {
    try {
      const { data } = await api.patch('/roadmap/task', { stageIdx: si, taskIdx: ti });
      setRoadmap(data.roadmap);
    } catch (e) { setErr(errMsg(e)); }
  };

  if (loading) return <DashboardLayout><Loader label="Loading roadmap…" /></DashboardLayout>;

  const stages = roadmap?.stages || [];
  const current = stages[stage];
  const totalHrs = stages.flatMap((s) => s.tasks).reduce((s, t) => s + (t.estHours || 0), 0);
  const doneCount = stages.flatMap((s) => s.tasks).filter((t) => t.status === 'done').length;

  return (
    <DashboardLayout>
      <div className="page-head">
        <div><h1>Learning Roadmap</h1><p>{roadmap ? `${roadmap.targetRole} · ${doneCount} tasks done · ~${totalHrs}h total` : 'Generate a personalized staged plan.'}</p></div>
        <button className="btn btn-primary btn-sm" onClick={generate} disabled={busy}>
          <RefreshCw size={15} /> {busy ? 'Generating…' : roadmap ? 'Regenerate' : 'Generate Roadmap'}
        </button>
      </div>

      {err && <div className="card" style={{ marginBottom: 14 }}><div className="form-err">{err}</div></div>}

      {!roadmap && (
        <div className="card"><Empty icon={Map} title="No roadmap yet" sub="Your roadmap is generated from your latest skill gaps — 6 stages from Foundation to Deployment, prioritized by what you need most." action={<button className="btn btn-primary" onClick={generate} disabled={busy}>Generate My Roadmap</button>} /></div>
      )}

      {roadmap && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
              <span>Overall progress</span><span>{roadmap.progress}%</span>
            </div>
            <ProgressBar value={roadmap.progress} />
          </div>
          <div className="roadmap-stages">
            {stages.map((s, i) => {
              const done = s.tasks.filter((t) => t.status === 'done').length;
              return <button key={i} className={`stage-pill${i === stage ? ' active' : ''}`} onClick={() => setStage(i)}>{i + 1}. {s.name} · {done}/{s.tasks.length}</button>;
            })}
          </div>
          {current && (
            <div className="card">
              <div className="card-title">Stage {stage + 1}: {current.name}</div>
              <div className="card-sub">{current.tasks.filter((t) => t.status === 'done').length}/{current.tasks.length} complete</div>
              <div style={{ marginTop: 14 }}>
                {current.tasks.map((t, ti) => (
                  <div key={ti} className={`task${t.status === 'done' ? ' done' : ''}`}>
                    <button className={`task-check${t.status === 'done' ? ' done' : ''}`} onClick={() => toggle(stage, ti)} title="Mark as complete">
                      {t.status === 'done' && <Check size={14} strokeWidth={3} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t-title" style={{ fontWeight: 800, fontSize: 14.5, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {t.skill}
                        {t.priority === 'high' && <span className="badge b-red"><Flame size={11} /> gap priority</span>}
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 4 }}>{t.description}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 9, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Badge tone={DIFF[t.difficulty] || 'blue'}><Signal size={11} /> {t.difficulty}</Badge>
                        <Badge tone="gray"><Clock size={11} /> ~{t.estHours}h</Badge>
                        {t.resourceUrl && <a href={t.resourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary)', display: 'flex', gap: 4, alignItems: 'center' }}><ExternalLink size={12} /> Learn</a>}
                      </div>
                    </div>
                    <button className={`btn btn-sm ${t.status === 'done' ? 'btn-ghost' : 'btn-soft'}`} onClick={() => toggle(stage, ti)}>
                      {t.status === 'done' ? 'Undo' : 'Complete'}
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button className="btn btn-ghost" disabled={stage === 0} onClick={() => setStage(stage - 1)}>← Prev Stage</button>
                <button className="btn btn-ghost" disabled={stage === stages.length - 1} onClick={() => setStage(stage + 1)} style={{ marginLeft: 'auto' }}>Next Stage →</button>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
