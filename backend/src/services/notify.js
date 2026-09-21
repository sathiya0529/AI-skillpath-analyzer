// Realtime notification service (Socket.io + DB persistence)
const { Notification } = require('../models');

let io = null;
const setIO = (instance) => { io = instance; };

async function notifyUser(userEmail, { title, message, type = 'info', link = '' }) {
  const doc = await Notification.create({ userEmail, title, message, type, link });
  if (io) {
    io.to(`user:${userEmail}`).emit('notification', doc);
  }
  return doc;
}

async function broadcast({ title, message, type = 'info', link = '' }) {
  const doc = await Notification.create({ userEmail: 'all', title, message, type, link });
  if (io) io.emit('notification', doc);
  return doc;
}

module.exports = { setIO, notifyUser, broadcast };