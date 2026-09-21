// Google Sign-In via Google Identity Services (GIS) — no Firebase.
// Loads Google's own script and renders Google's own button, which then
// hands us a signed ID token that the backend verifies directly with Google.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const isGoogleConfigured = Boolean(GOOGLE_CLIENT_ID);

let scriptPromise = null;

export function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.google);
    s.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}
