const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { connectDB } = require('./src/config/db');
const { setIO } = require('./src/services/notify');
const { errorHandler } = require('./src/middleware/auth');
const routes = require('./src/routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','), credentials: true },
});
setIO(io);

io.on('connection', (socket) => {
  socket.on('join', (email) => {
    if (email) socket.join(`user:${email}`);
    socket.join('user:all');
  });
  socket.emit('connected', { ok: true, at: new Date() });
});

app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/api/health', (_r, res) => res.json({ ok: true, service: 'skillpath-backend', at: new Date() }));
app.use('/api', routes);
app.use('/api', (_r, res) => res.status(404).json({ error: 'API route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
(async () => {
  await connectDB();
  if (process.env.SEED_ON_BOOT !== 'false') {
    try { await require('./src/utils/seed').seed(); } catch (e) { console.warn('Seed skipped:', e.message); }
  }
  server.listen(PORT, '0.0.0.0', () => console.log(`🚀 SkillPath API on http://0.0.0.0:${PORT}  (+ Socket.io realtime)`));
})();
