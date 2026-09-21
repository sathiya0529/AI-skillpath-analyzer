import { useEffect, useState } from 'react';
import { Zap, Flame, CheckCircle2, TrendingUp, History } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Loader, StatCard, LineChart, Badge, Empty } from '../components/ui';
import api, { errMsg } from '../services/api';

export default function Progress() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/progress'); setData(data); }
      catch (e) { setErr(errMsg(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <DashboardLayout><Loader label="Loading progress…" /></DashboardLayout>;
  if (err) return <DashboardLayout><div className="card">{err}</div></DashboardLayout>;

  const p = data.progress || {};
  const analyses = data.analyses || [];
  const history = [...(p.history || [])].reverse();

  return (
    <DashboardLayout>
      <div className="page-head"><div><h1>My Progress</h1><p>Every task, course and project earns XP.</p></div></div>
      <div className="grid grid-4">
        <StatCard icon={Zap} color="linear-gradient(135deg,#5E9C86,#C9974B)" value={p.xp || 0} label="Total XP" />
        <StatCard icon={CheckCircle2} color="linear-gradient(135deg,#10b981,#6C93B8)" value={(p.completedTasks || []).length} label="Tasks Done" />
        <StatCard icon={CheckCircle2} color="linear-gradient(135deg,#6C93B8,#6C93B8)" value={(p.completedCourses || []).length + (p.completedProjects || []).length} label="Courses + Projects" />
        <StatCard icon={Flame} color="linear-gradient(135deg,#f59e0b,#ef4444)" value={analyses[0]?.readinessScore ? `${analyses[0].readinessScore}%` : '—'} label="Latest Readiness" />
      </div>

      <div className="grid grid-2" style={{ marginTop: 18, alignItems: 'start' }}>
        <div className="card hover">
          <div className="card-title"><TrendingUp size={17} color="#C9974B" /> Readiness Over Time</div>
          <div className="card-sub">Re-analyze after learning to grow this curve</div>
          <div style={{ marginTop: 14 }}>
            {analyses.length ? <LineChart data={[...analyses].reverse().map((a) => a.readinessScore)} height={170} /> : <Empty title="No analyses yet" sub="Run your first AI analysis to start tracking." />}
          </div>
          {analyses.length > 1 && (
            <div style={{ marginTop: 10 }}><Badge tone="green">▲ {(analyses[0].readinessScore || 0) - (analyses[analyses.length - 1].readinessScore || 0)} pts total growth</Badge></div>
          )}
        </div>
        <div className="card hover">
          <div className="card-title"><History size={17} color="#5E9C86" /> Activity Timeline</div>
          <div className="card-sub">{history.length} events</div>
          <div className="timeline" style={{ marginTop: 16, maxHeight: 380, overflowY: 'auto' }}>
            {history.length === 0 && <Empty title="No activity yet" sub="Complete roadmap tasks to earn XP." />}
            {history.map((h, i) => (
              <div key={i} className="timeline-item">
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{h.detail}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{h.at ? new Date(h.at).toLocaleString() : ''} · <strong style={{ color: 'var(--primary)' }}>+{h.xp} XP</strong></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
