const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a list room
    socket.on('join-list', (listId) => {
      socket.join(`list-${listId}`);
      console.log(`User ${socket.id} joined list-${listId}`);
    });

    // Leave a list room
    socket.on('leave-list', (listId) => {
      socket.leave(`list-${listId}`);
      console.log(`User ${socket.id} left list-${listId}`);
    });

    // Handle todo events
    socket.on('todo-added', (data) => {
      socket.to(`list-${data.listId}`).emit('todo-added', data);
    });

    socket.on('todo-updated', (data) => {
      socket.to(`list-${data.listId}`).emit('todo-updated', data);
    });

    socket.on('todo-deleted', (data) => {
      socket.to(`list-${data.listId}`).emit('todo-deleted', data);
    });

    socket.on('list-updated', (data) => {
      socket.to(`list-${data._id}`).emit('list-updated', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});