const socketIO = require('socket.io');
const Notification = require('../models/Notification.model');

let io = null;

const initSocket = (server, allowedOrigins) => {
  io = socketIO(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join room / register user
    socket.on('register', ({ userId, role }) => {
      if (userId) {
        socket.userId = userId;
        socket.join(userId.toString());
        console.log(`👤 User registered to socket: ${userId} (${role})`);
      }
      if (role) {
        socket.role = role.toLowerCase();
        socket.join(role.toLowerCase());
        console.log(`👥 Role registered to socket: ${role.toLowerCase()}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const sendNotification = async ({ title, message, type, role, userId }) => {
  try {
    // 1. Store in MongoDB
    const notification = await Notification.create({
      title,
      message,
      type,
      role: role ? role.toLowerCase() : 'all',
      userId,
      isRead: false
    });

    // 2. Emit via Socket.IO
    if (io) {
      if (userId) {
        // Send to specific user
        io.to(userId.toString()).emit('notification:new', notification);
        console.log(`📡 Emitted personal notification to user ${userId}`);
      } else if (role) {
        // Send to specific role
        io.to(role.toLowerCase()).emit('notification:new', notification);
        console.log(`📡 Emitted role notification to role ${role}`);
      } else {
        // Broadcast to everyone
        io.emit('notification:new', notification);
        console.log(`📡 Emitted broadcast notification`);
      }
    }

    return notification;
  } catch (err) {
    console.error('❌ Error sending notification:', err.message);
  }
};

module.exports = {
  initSocket,
  sendNotification,
  getIo: () => io
};
