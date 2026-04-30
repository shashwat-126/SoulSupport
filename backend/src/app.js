const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const { mongoSanitizeCompat } = require('./middlewares/mongoSanitize.middleware');

const app = express();

// Render (and most PaaS) sit behind a reverse proxy – trust it so
// express-rate-limit reads the real client IP from X-Forwarded-For.
app.set('trust proxy', process.env.TRUST_PROXY === 'true' || !process.env.TRUST_PROXY ? 1 : process.env.TRUST_PROXY);

const corsOriginMap = {
  'https://soulsupport.utkarshcode.com': 'https://soulsupport.utkarshcode.com',
  'https://soul-support-hazel.vercel.app': 'https://soul-support-hazel.vercel.app',
  'http://localhost:3000': 'http://localhost:3000',
};

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = requestOrigin ? corsOriginMap[requestOrigin] : undefined;

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  } else if (requestOrigin) {
    console.warn(`[CORS] Blocked: ${requestOrigin}`);
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Security middleware
app.use(helmet());

// Rate limiting
app.use('/api/', apiLimiter);

// Body parser with size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(mongoSanitizeCompat);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', require('./routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
