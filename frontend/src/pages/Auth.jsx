import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, Mail, Lock, User as UserIcon, CheckCircle2, ArrowLeft, Eye, EyeOff, Sparkles, Map, Bell, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

function BrandPanel({ title, sub }) {
  return (
    <div className="auth-brand">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20, position: 'relative', zIndex: 1 }}>
        <span className="brand-mark" style={{ background: 'rgba(255,255,255,.2)' }}><TrendingUp size={19} strokeWidth={2.6} /></span> SkillPath
      </Link>
      <h2>{title}</h2>
      <p>{sub}</p>
      <div className="auth-points">
        <div><Sparkles size={16} /> AI readiness score in seconds</div>
        <div><Map size={16} /> Personalized 6-stage roadmap</div>
        <div><Bell size={16} /> Realtime progress notifications</div>
      </div>
    </div>
  );
}

const Shell = ({ brandTitle, brandSub, children }) => (
  <div className="auth-wrap">
      <div className="auth-box">
        <BrandPanel title={brandTitle} sub={brandSub} />
        <div className="auth-form">{children}</div>
      </div>
  </div>
);

const inputIcon = { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--faint)' };
const F = ({ icon: Icon, ...props }) => (
  <div style={{ position: 'relative' }}>
    <span style={inputIcon}><Icon size={17} /></span>
    <input className="input" style={{ paddingLeft: 40 }} {...props} />
  </div>
);

// Shared 2FA / OTP entry step used by both Login and ForgotPassword flows.
function OtpStep({ title, sub, email, devOtp, otp, setOtp, onSubmit, onResend, busy, resendBusy, err, msg, extra, submitLabel = 'Verify' }) {
  const [cooldown, setCooldown] = useState(30);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => { await onResend(); setCooldown(30); };

  return (
    <>
      <h2>{title}</h2>
      <div className="sub">{sub} <strong style={{ color: 'var(--text)' }}>{email}</strong></div>
      {devOtp && (
        <div className="card" style={{ margin: '10px 0', padding: '10px 14px', fontSize: 12.5, color: 'var(--muted)' }}>
          <ShieldCheck size={14} style={{ verticalAlign: -2 }} /> SMTP isn't configured on this server, so here's your code for testing: <span className="kbd">{devOtp}</span>
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>6-digit code</label>
          <div style={{ position: 'relative' }}>
            <span style={inputIcon}><KeyRound size={17} /></span>
            <input
              className="input otp-input" style={{ paddingLeft: 40 }} inputMode="numeric" autoComplete="one-time-code"
              maxLength={6} placeholder="••••••" value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
        </div>
        {extra}
        {err && <div className="form-err" style={{ marginBottom: 12 }}>{err}</div>}
        {msg && <div className="form-ok" style={{ marginBottom: 12 }}><CheckCircle2 size={15} style={{ verticalAlign: -2 }} /> {msg}</div>}
        <button className="btn btn-primary btn-block" disabled={busy || otp.length !== 6}>{busy ? 'Verifying…' : submitLabel}</button>
      </form>
      <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 10 }} disabled={cooldown > 0 || resendBusy} onClick={resend}>
        {resendBusy ? 'Resending…' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
      </button>
    </>
  );
}

/* ---------------- LOGIN ---------------- */
export function Login() {
  const { login, verifyLoginOtp, resendLoginOtp, googleLogin, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || '/dashboard';

  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendBusy, setResendBusy] = useState(false);

  const submitCreds = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.email || !form.password) return setErr('Enter your email and password.');
    setBusy(true);
    try {
      const r = await login(form.email.trim(), form.password);
      setTempToken(r.tempToken); setDevOtp(r.devOtp || ''); setOtp(''); setStep('otp');
    } catch (e) { setErr(e?.response?.data?.error || e.message || 'Login failed.'); }
    finally { setBusy(false); }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try { const loggedInUser = await verifyLoginOtp(tempToken, otp); nav(loggedInUser?.role === 'admin' ? '/admin' : (from === '/admin' ? '/dashboard' : from), { replace: true }); }
    catch (e) { setErr(e?.response?.data?.error || e.message || 'Incorrect or expired code.'); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    setErr(''); setResendBusy(true);
    try { const r = await resendLoginOtp(tempToken); setTempToken(r.tempToken); setDevOtp(r.devOtp || ''); }
    catch (e) { setErr(e?.response?.data?.error || 'Could not resend code.'); }
    finally { setResendBusy(false); }
  };

  const onGoogleCredential = async (idToken) => {
    setErr(''); setBusy(true);
    try { const loggedInUser = await googleLogin(idToken); nav(loggedInUser?.role === 'admin' ? '/admin' : '/dashboard', { replace: true }); }
    catch (e) { setErr(e?.response?.data?.error || e.message || 'Google sign-in failed.'); }
    finally { setBusy(false); }
  };

  if (step === 'otp') {
    return (
      <Shell brandTitle="One more step 🔐" brandSub="For your security, manual login needs a quick 6-digit code sent to your email.">
        <OtpStep
          title="Verify it's you" sub="We emailed a 6-digit code to" email={form.email}
          devOtp={devOtp} otp={otp} setOtp={setOtp} onSubmit={submitOtp} onResend={resend}
          busy={busy} resendBusy={resendBusy} err={err} submitLabel="Verify & Login"
        />
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => { setStep('credentials'); setErr(''); }}>
          <ArrowLeft size={16} /> Back
        </button>
      </Shell>
    );
  }

  return (
    <Shell brandTitle="Welcome back, achiever 👋" brandSub="Log in to continue your journey: check your readiness score, follow your roadmap and keep the streak alive.">
      <h2>Login</h2>
      <div className="sub">Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign up free</Link></div>
      <form onSubmit={submitCreds}>
        <div className="field"><label>Email</label><F icon={Mail} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="field"><label>Password</label>
          <div style={{ position: 'relative' }}>
            <span style={inputIcon}><Lock size={17} /></span>
            <input className="input" style={{ paddingLeft: 40, paddingRight: 42 }} type={show ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--faint)' }}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Link to="/forgot-password" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--primary)' }}>Forgot password?</Link>
        </div>
        {err && <div className="form-err" style={{ marginBottom: 12 }}>{err}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Checking…' : 'Login'}</button>
      </form>
      <div className="divider">OR CONTINUE WITH</div>
      <GoogleSignInButton onCredential={onGoogleCredential} onError={setErr} disabled={busy} text="continue_with" />
      <div className="card" style={{ marginTop: 18, padding: '10px 14px', fontSize: 12.5, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <ShieldCheck size={15} style={{ marginTop: 1, flexShrink: 0 }} />
        Manual login is protected with two-factor email verification. We'll send a 6-digit code to your inbox every time you log in with a password.
      </div>
    </Shell>
  );
}

/* ---------------- SIGNUP ---------------- */
export function Signup() {
  const { signup, googleLogin } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.email || !form.password) return setErr('Please fill all fields.');
    if (form.password.length < 6) return setErr('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setErr('Passwords do not match.');
    setBusy(true);
    try { await signup(form.name.trim(), form.email.trim(), form.password); nav('/profile', { replace: true }); }
    catch (e) { setErr(e?.response?.data?.error || e.message || 'Signup failed.'); }
    finally { setBusy(false); }
  };

  const onGoogleCredential = async (idToken) => {
    setErr(''); setBusy(true);
    try { await googleLogin(idToken); nav('/profile', { replace: true }); }
    catch (e) { setErr(e?.response?.data?.error || e.message || 'Google sign-up failed.'); }
    finally { setBusy(false); }
  };

  return (
    <Shell brandTitle="Start your job-ready journey 🚀" brandSub="Create a free account and get your first AI skill gap analysis in under two minutes. No credit card needed.">
      <h2>Create account</h2>
      <div className="sub">Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Log in</Link></div>
      <form onSubmit={submit}>
        <div className="field"><label>Full name</label><F icon={UserIcon} placeholder="Ada Lovelace" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Email</label><F icon={Mail} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field"><label>Password</label><F icon={Lock} type="password" placeholder="Min 6 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="field"><label>Confirm</label><F icon={Lock} type="password" placeholder="Repeat" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></div>
        </div>
        {err && <div className="form-err" style={{ marginBottom: 12 }}>{err}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Sign Up Free'}</button>
      </form>
      <div className="divider">OR CONTINUE WITH</div>
      <GoogleSignInButton onCredential={onGoogleCredential} onError={setErr} disabled={busy} text="signup_with" />
    </Shell>
  );
}

/* ---------------- FORGOT PASSWORD (email OTP) ---------------- */
export function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const nav = useNavigate();

  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [resendBusy, setResendBusy] = useState(false);
  const [okMsg, setOkMsg] = useState('');

  const requestOtp = async () => {
    const { data } = await forgotPassword(email.trim());
    setDevOtp(data?.devOtp || '');
    return data;
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    setErr('');
    if (!email) return setErr('Enter your account email.');
    setBusy(true);
    try { await requestOtp(); setOtp(''); setStep('otp'); }
    catch (e) { setErr(e?.response?.data?.error || e.message || 'Failed to send the code.'); }
    finally { setBusy(false); }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setErr('');
    if (pw.password.length < 6) return setErr('Password must be at least 6 characters.');
    if (pw.password !== pw.confirm) return setErr('Passwords do not match.');
    setBusy(true);
    try {
      await resetPassword(email.trim(), otp, pw.password);
      setOkMsg('Password updated! Redirecting to login…');
      setTimeout(() => nav('/login'), 1600);
    } catch (e) { setErr(e?.response?.data?.error || e.message || 'Incorrect or expired code.'); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    setErr(''); setResendBusy(true);
    try { await requestOtp(); } catch (e) { setErr(e?.response?.data?.error || 'Could not resend code.'); }
    finally { setResendBusy(false); }
  };

  if (step === 'otp') {
    return (
      <Shell brandTitle="Set a new password ✨" brandSub="Enter the code we emailed you, then choose a strong new password.">
        <OtpStep
          title="Enter your reset code" sub="We emailed a 6-digit code to" email={email}
          devOtp={devOtp} otp={otp} setOtp={setOtp} onSubmit={submitReset} onResend={resend}
          busy={busy} resendBusy={resendBusy} err={err} msg={okMsg} submitLabel="Reset Password"
          extra={(
            <>
              <div className="field"><label>New password</label><F icon={Lock} type="password" placeholder="Min 6 chars" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></div>
              <div className="field"><label>Confirm password</label><F icon={Lock} type="password" placeholder="Repeat" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
            </>
          )}
        />
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => { setStep('email'); setErr(''); }}>
          <ArrowLeft size={16} /> Use a different email
        </button>
      </Shell>
    );
  }

  return (
    <Shell brandTitle="Locked out? No stress 🔑" brandSub="Enter your email and we'll send a 6-digit verification code to reset your password.">
      <h2>Forgot password</h2>
      <div className="sub">Remember it now? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Back to login</Link></div>
      <form onSubmit={submitEmail}>
        <div className="field"><label>Email</label><F icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {err && <div className="form-err" style={{ marginBottom: 12 }}>{err}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Sending…' : 'Send Verification Code'}</button>
      </form>
      <Link to="/login" className="btn btn-ghost btn-block" style={{ marginTop: 12 }}><ArrowLeft size={16} /> Back to Login</Link>
    </Shell>
  );
}

/* ---------------- Legacy /reset-password link → forward to the OTP flow ---------------- */
export function ResetPassword() {
  const nav = useNavigate();
  useEffect(() => { nav('/forgot-password', { replace: true }); }, [nav]);
  return null;
}
