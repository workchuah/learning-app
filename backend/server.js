require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./src/config/db');
const seedDefaultUser = require('./src/utils/seedDefaultUser');
const authRoutes = require('./src/routes/authRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const topicRoutes = require('./src/routes/topicRoutes');
const progressRoutes = require('./src/routes/progressRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const { UPLOADS_DIR } = require('./src/utils/fileStorage');

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);

// Trust proxy to get correct protocol (http vs https) behind reverse proxy like Render
app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || CLIENT_ORIGINS.length === 0 || CLIENT_ORIGINS.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/uploads', express.static(UPLOADS_DIR));

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'Chuah Learning App API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      courses: '/api/courses',
      topics: '/api/topics',
      progress: '/api/progress',
      admin: '/api/admin'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (for keep-alive)
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Keep-alive endpoint (lightweight ping)
app.get('/ping', (_req, res) => {
  res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

// Keep-alive mechanism to prevent server from sleeping
function setupKeepAlive() {
  const http = require('http');
  const https = require('https');
  const keepAliveInterval = 14 * 60 * 1000; // 14 minutes (before typical 15min timeout)
  
  const keepAlive = () => {
    // Use environment variable for production URL, or localhost for development
    const keepAliveUrl = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const pingUrl = `${keepAliveUrl}/ping`;
    
    // Use https if URL starts with https, otherwise http
    const client = pingUrl.startsWith('https') ? https : http;
    
    client.get(pingUrl, (res) => {
      console.log(`✅ Keep-alive ping successful at ${new Date().toISOString()}`);
    }).on('error', (err) => {
      // Only log warning if it's not a localhost connection issue
      if (!err.message.includes('ECONNREFUSED') || !keepAliveUrl.includes('localhost')) {
        console.warn(`⚠️ Keep-alive ping failed: ${err.message}`);
      }
    });
  };
  
  // Start keep-alive after server is ready
  setTimeout(() => {
    keepAlive();
    // Ping every 14 minutes
    setInterval(keepAlive, keepAliveInterval);
    console.log(`🔄 Keep-alive mechanism started (pinging every ${keepAliveInterval / 1000 / 60} minutes)`);
  }, 30000); // Wait 30 seconds after server starts
}

async function start() {
  try {
    await connectDB();
    await seedDefaultUser();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      // Setup keep-alive mechanism
      setupKeepAlive();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

