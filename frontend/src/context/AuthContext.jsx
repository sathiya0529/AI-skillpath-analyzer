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

  
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data; 
  };

 
  const verifyLoginOtp = async (tempToken, otp) => {
    const { data } = await api.post('/auth/verify-login-otp', { tempToken, otp });
    saveSession(data);
    return data.user;
  };

  const resendLoginOtp = async (tempToken) => {
    const { data } = await api.post('/auth/resend-login-otp', { tempToken });
    return data; 
  };

  const googleLogin = async (idToken) => {
    const { data } = await api.post('/auth/google', { idToken });
    saveSession(data);
    return data.user;
  };

  
  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot', { email });
    return data; 
  };

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
