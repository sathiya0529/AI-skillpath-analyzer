import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { CheckCircle2, Info, AlertTriangle, Trophy, X } from 'lucide-react';

const SockCtx = createContext();
export const useSocket = () => useContext(SockCtx);

const ICONS = { success: CheckCircle2, info: Info, warning: AlertTriangle, achievement: Trophy };
const COLORS = { success: '#10b981', info: '#C9974B', warning: '#f59e0b', achievement: '#5E9C86' };

// Ask the browser for permission to show OS-level popup notifications.
// Must be called after a user gesture works best, but calling it on load
// also works — Chrome will just show its own permission prompt once.
function ensureBrowserPermission() {
  if (!('Notification' in window)) return; // unsupported browser
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Show a real Chrome/OS popup notification (like WhatsApp Web).
function showBrowserNotification(n) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const popup = new Notification(n.title || 'SkillPath', {
    body: n.message || '',
    icon: '/favicon.ico', // change to your logo path if you have one
    tag: n._id, // prevents the same notification id from stacking twice
  });

  popup.onclick = () => {
    window.focus();
    if (n.link) window.location.href = n.link;
    popup.close();
  };
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(false);

  const pushToast = useCallback((n) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { ...n, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  useEffect(() => {
    if (!user?.email) { setNotifications([]); return; }

    ensureBrowserPermission(); // ask once when a user is logged in

    api.get('/auth/notifications').then(({ data }) => setNotifications(data.notifications || [])).catch(() => {});
    const url = import.meta.env.VITE_SOCKET_URL || undefined; // same-origin by default
    const socket = io(url, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => { setConnected(true); socket.emit('join', user.email); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('notification', (n) => {
      setNotifications((prev) => (prev.some((x) => x._id === n._id) ? prev : [n, ...prev].slice(0, 30)));
      pushToast(n);
      showBrowserNotification(n); // <-- new: real Chrome/OS popup
    });
    return () => socket.disconnect();
  }, [user?.email, pushToast]);

  const unread = notifications.filter((n) => !n.read).length;
  const markRead = async (id) => {
    setNotifications((p) => p.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try { await api.post(`/auth/notifications/${id}/read`); } catch {}
  };
  const markAllRead = async () => {
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    try { await api.post('/auth/notifications/read-all'); } catch {}
  };

  return (
    <SockCtx.Provider value={{ notifications, unread, markRead, markAllRead, connected, pushToast }}>
      {children}
      <div className="toasts">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div key={t.id} className="toast">
              <Icon size={20} color={COLORS[t.type] || '#C9974B'} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{t.title}</div>
                <div style={{ color: 'var(--muted)', marginTop: 2 }}>{t.message}</div>
              </div>
              <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--faint)' }}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </SockCtx.Provider>
  );
}