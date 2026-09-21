import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../services/api';

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem('skillpath_token')) await fetchMe();
      setLoading(false);
    })();
  }, [fetchMe]);

  const saveSession = (data) => {
    localStorage.setItem('skillpath_token', data.token);
    setUser(data.user);
  };

  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    saveSession(data);
  };

  // Step 1 of manual login: verify credentials, then a 6-digit code is emailed
  // to the user. Returns { twoFactorRequired: true, tempToken } — the caller
  // must then call verifyLoginOtp() to finish logging in.
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data; // { twoFactorRequired, tempToken, email, devOtp }
  };

  // Step 2 of manual login: submit the emailed code to finish logging in.
  const verifyLoginOtp = async (tempToken, otp) => {
    const { data } = await api.post('/auth/verify-login-otp', { tempToken, otp });
    saveSession(data);
    return data.user;
  };

  const resendLoginOtp = async (tempToken) => {
    const { data } = await api.post('/auth/resend-login-otp', { tempToken });
    return data; // { tempToken, devOtp }
  };

  // Real Google Sign-In (Google Identity Services). `idToken` comes from
  // Google's own button/popup and is verified against Google on the backend.
  // Single step — no additional email OTP, since Google already authenticated the person.
  const googleLogin = async (idToken) => {
    const { data } = await api.post('/auth/google', { idToken });
    saveSession(data);
    return data.user;
  };

  // Sends a 6-digit code to the account's email to start a password reset.
  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot', { email });
    return data; // { message, devOtp }
  };

  // Completes a password reset using the emailed code.
  const resetPassword = async (email, otp, password) => {
    const { data } = await api.post('/auth/reset', { email, otp, password });
    return data;
  };

  const logout = async () => {
    localStorage.removeItem('skillpath_token');
    setUser(null);
  };

  const refreshUser = fetchMe;

  return (
    <AuthCtx.Provider value={{ user, loading, login, verifyLoginOtp, resendLoginOtp, signup, googleLogin, forgotPassword, resetPassword, logout, refreshUser, setUser, errMsg }}>
      {children}
    </AuthCtx.Provider>
  );
}
