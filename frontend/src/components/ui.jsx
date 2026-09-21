import { Inbox, X } from 'lucide-react';

/* ---------- primitives ---------- */
export const Loader = ({ label = 'Loading…' }) => (
  <div className="loader-wrap"><div style={{ textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto 12px' }} /><div style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 14 }}>{label}</div></div></div>
);

export const Empty = ({ icon: Icon = Inbox, title = 'Nothing here yet', sub = '', action = null }) => (
  <div className="empty">
    <div className="e-icon"><Icon size={26} /></div>
    <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16 }}>{title}</div>
    {sub && <div style={{ fontSize: 13.5, marginTop: 6, maxWidth: 380, marginInline: 'auto' }}>{sub}</div>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

export const ProgressBar = ({ value = 0, thin = false }) => (
  <div className={`pbar${thin ? ' thin' : ''}`}><div style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
);

export const Badge = ({ tone = 'blue', children }) => <span className={`badge b-${tone}`}>{children}</span>;

export const StatCard = ({ icon: Icon, color, value, label, delta = null, deltaTone = 'green' }) => (
  <div className="card stat-card hover">
    <div className="stat-icon" style={{ background: color }}><Icon size={21} /></div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {delta && <span className={`stat-delta badge b-${deltaTone}`}>{delta}</span>}
  </div>
);

export const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="modal-back" onClick={onClose}>
    <div className="modal" style={wide ? { maxWidth: 680 } : {}} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button className="icon-btn" onClick={onClose} style={{ width: 34, height: 34 }}><X size={17} /></button>
      </div>
      {children}
    </div>
  </div>
);

export const Avatar = ({ src, name = '?', size = 40 }) => {
  const url = src ? (src.startsWith('http') || src.startsWith('data:') ? src : src) : '';
  if (url) return <img src={url} alt={name} className="avatar" style={{ width: size, height: size }} onError={(e) => { e.target.style.display = 'none'; }} />;
  return <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>{String(name || '?').trim().charAt(0).toUpperCase()}</div>;
};

/* ---------- SVG charts (no deps) ---------- */
export const Donut = ({ value = 0, size = 150, label = '', sub = '' }) => {
  const r = 54, c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 75 ? '#10b981' : v >= 50 ? '#C9974B' : v >= 30 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--primary-soft)" strokeWidth="13" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="65" y="62" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--text)" fontFamily="Space Grotesk">{v}%</text>
        <text x="65" y="82" textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600">{label}</text>
      </svg>
      {sub && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{sub}</div>}
    </div>
  );
};

export const HBars = ({ data = [] }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
            <span>{d.label}</span><span style={{ color: 'var(--muted)' }}>{d.value}{d.suffix || ''}</span>
          </div>
          <div className="pbar thin"><div style={{ width: `${(d.value / max) * 100}%`, background: d.color || 'var(--grad)' }} /></div>
        </div>
      ))}
    </div>
  );
};

export const LineChart = ({ data = [], height = 130, color = '#C9974B' }) => {
  if (!data.length) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>Not enough data yet.</div>;
  const w = 560, h = height, pad = 10;
  const max = Math.max(...data, 10), min = Math.min(...data, 0);
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / Math.max(1, max - min)) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  const gid = `g${Math.random().toString(36).slice(2)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={color} stroke="var(--card)" strokeWidth="2" />)}
    </svg>
  );
};

export const Radar = ({ axes = [] }) => {
  // axes: [{label, value 0..100}]
  const n = Math.max(3, axes.length), R = 62, C = 80;
  const pt = (i, frac) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [C + R * frac * Math.cos(a), C + R * frac * Math.sin(a)]; };
  const poly = (frac) => axes.map((_, i) => pt(i, frac).join(',')).join(' ');
  const vals = axes.map((a, i) => pt(i, Math.max(4, a.value) / 100).join(',')).join(' ');
  return (
    <svg viewBox="0 0 160 160" style={{ width: '100%', maxWidth: 240, margin: '0 auto', display: 'block' }}>
      {[1, 0.66, 0.33].map((f) => <polygon key={f} points={poly(f)} fill="none" stroke="var(--border)" strokeWidth="1" />)}
      {axes.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />; })}
      <polygon points={vals} fill="rgba(201,151,75,.22)" stroke="#C9974B" strokeWidth="2" />
      {axes.map((a, i) => { const [x, y] = pt(i, 1.18); return <text key={i} x={x} y={y} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--muted)">{a.label}</text>; })}
    </svg>
  );
};
