import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, isGoogleConfigured, loadGoogleScript } from '../config/google';

// Renders Google's own "Sign in with Google" button and calls
// onCredential(idToken) once the person picks an account.
export default function GoogleSignInButton({ onCredential, onError, text = 'continue_with', disabled = false }) {
  const boxRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isGoogleConfigured || disabled) return;
    let cancelled = false;
    loadGoogleScript()
      .then((google) => {
        if (cancelled || !boxRef.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => onCredential(resp.credential),
        });
        google.accounts.id.renderButton(boxRef.current, {
          type: 'standard', theme: 'outline', size: 'large', text, shape: 'pill', width: 320,
        });
      })
      .catch((e) => { setFailed(true); onError?.(e.message); });
    return () => { cancelled = true; };
  }, [disabled]);

  if (!isGoogleConfigured) {
    return (
      <div className="card" style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--muted)', textAlign: 'center' }}>
        Google Sign-In isn't configured yet — add <code>GOOGLE_CLIENT_ID</code> / <code>VITE_GOOGLE_CLIENT_ID</code> (see README).
      </div>
    );
  }
  if (failed) {
    return <div className="form-err" style={{ textAlign: 'center' }}>Couldn't load Google Sign-In. Check your connection and refresh.</div>;
  }
  return <div ref={boxRef} style={{ display: 'flex', justifyContent: 'center', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} />;
}
