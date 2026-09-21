// Google Sign-In (Google Identity Services) — verifies the ID token the
// frontend gets from Google's own "Sign in with Google" button. No Firebase
// involved: this talks to Google's OAuth2 servers directly.
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const isGoogleReady = () => !!client;

// Returns the verified Google payload: { sub, email, email_verified, name, picture, ... }
async function verifyGoogleIdToken(idToken) {
  if (!client) throw Object.assign(new Error('Google Sign-In is not configured on the server (missing GOOGLE_CLIENT_ID).'), { status: 500 });
  if (!idToken) throw Object.assign(new Error('Missing Google credential'), { status: 400 });
  const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw Object.assign(new Error('Google account has no email'), { status: 400 });
  return payload;
}

if (GOOGLE_CLIENT_ID) console.log('✅ Google Sign-In configured');
else console.log('ℹ️  Google Sign-In not configured — set GOOGLE_CLIENT_ID (and VITE_GOOGLE_CLIENT_ID on the frontend) to enable it.');

module.exports = { isGoogleReady, verifyGoogleIdToken };
