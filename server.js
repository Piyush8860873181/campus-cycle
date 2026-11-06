require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const offerRoutes = require('./routes/offerRoutes');
const messageRoutes = require('./routes/messageRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const impactRoutes = require('./routes/impactRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'CampusCycle API',
    time: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io real-time chat handling
io.on('connection', (socket) => {
  console.log(`[Socket] Student connected: ${socket.id}`);

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
    console.log(`[Socket] Socket ${socket.id} joined conv_${conversationId}`);
  });

  socket.on('send_message', (data) => {
    if (data.conversationId) {
      io.to(`conv_${data.conversationId}`).emit('receive_message', data);
    }
  });

  socket.on('offer_updated', (data) => {
    if (data.conversationId) {
      io.to(`conv_${data.conversationId}`).emit('offer_status_changed', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Student disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 CampusCycle Backend running on http://localhost:${PORT}`);
  });
});
