import { useState } from 'react';
import { Sun, Moon, Monitor, Bell, Lock, LogOut, Save, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../services/api';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, logout, forgotPassword, resetPassword, refreshUser } = useAuth();
  const nav = useNavigate();
  const [notifs, setNotifs] = useState(user?.preferences?.emailNotifs !== false);
  const [pwStep, setPwStep] = useState('idle'); // 'idle' | 'otp'
  const [pw, setPw] = useState({ otp: '', next: '', confirm: '' });
  const [devOtp, setDevOtp] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const savePrefs = async () => {
    setErr(''); setMsg('');
    try {
      await api.put('/auth/profile', { preferences: { theme, emailNotifs: notifs } });
      await refreshUser();
      setMsg('Preferences saved ✓');
    } catch (e) { setErr(errMsg(e)); }
  };

  const doLogout = async () => { await logout(); nav('/'); };

  return (
    <DashboardLayout>
      <div className="page-head"><div><h1>Settings</h1><p>Theme, notifications & account.</p></div></div>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">🎨 Appearance</div>
          <div className="card-sub">Theme applies instantly across the app</div>
          <div className="theme-swatches" style={{ marginTop: 14 }}>
            {[['light', Sun, 'Light'], ['dark', Moon, 'Dark'], ['system', Monitor, 'System']].map(([v, Icon, label]) => (
              <button key={v} className={theme === v ? 'active' : ''} onClick={() => setTheme(v)}><Icon size={16} /> {label}</button>
            ))}
          </div>
          <div className="card-title" style={{ marginTop: 22 }}><Bell size={16} /> Notifications</div>
          <label className="checkbox-row" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={notifs} onChange={(e) => setNotifs(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            Realtime & email-style notifications
          </label>
          {err && <div className="form-err" style={{ marginTop: 10 }}>{err}</div>}
          {msg && <div className="form-ok" style={{ marginTop: 10 }}>{msg}</div>}
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={savePrefs}><Save size={16} /> Save Preferences</button>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card">
            <div className="card-title"><Lock size={16} /> Password</div>
            <div className="card-sub">We'll email a 6-digit code to confirm it's you before changing it.</div>
            <div style={{ marginTop: 12 }}>
              {pwStep === 'idle' && (
                <button className="btn btn-ghost" onClick={async () => {
                  setErr(''); setMsg('');
                  try {
                    const { data } = await forgotPassword(user.email);
                    setDevOtp(data?.devOtp || '');
                    setPw({ otp: '', next: '', confirm: '' });
                    setPwStep('otp');
                  } catch (e) { setErr(errMsg(e)); }
                }}>Send Verification Code</button>
              )}
              {pwStep === 'otp' && (
                <>
                  {devOtp && (
                    <div className="card" style={{ margin: '10px 0', padding: '10px 14px', fontSize: 12.5, color: 'var(--muted)' }}>
                      <ShieldCheck size={14} style={{ verticalAlign: -2 }} /> SMTP isn't configured — code for testing: <span className="kbd">{devOtp}</span>
                    </div>
                  )}
                  <div className="field"><label>6-digit code</label><input className="input otp-input" inputMode="numeric" maxLength={6} value={pw.otp} onChange={(e) => setPw({ ...pw, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })} /></div>
                  <div className="grid grid-2" style={{ gap: 12 }}>
                    <div className="field"><label>New password</label><input className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
                    <div className="field"><label>Confirm</label><input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={() => setPwStep('idle')}>Cancel</button>
                    <button className="btn btn-primary" onClick={async () => {
                      setErr(''); setMsg('');
                      if (pw.otp.length !== 6) return setErr('Enter the 6-digit code.');
                      if (pw.next.length < 6) return setErr('New password must be 6+ characters.');
                      if (pw.next !== pw.confirm) return setErr('Passwords do not match.');
                      try {
                        await resetPassword(user.email, pw.otp, pw.next);
                        setMsg('Password changed ✓'); setPwStep('idle'); setPw({ otp: '', next: '', confirm: '' });
                      } catch (e) { setErr(errMsg(e, 'Incorrect or expired code')); }
                    }}>Update Password</button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-title">👤 Account</div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6 }}>Signed in as <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>.</div>
            <button className="btn btn-danger" style={{ marginTop: 14 }} onClick={doLogout}><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
