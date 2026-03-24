'use strict';

// dotenv MUST load before any other require so every module sees process.env.
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { startSessionCompletionJob } = require('./services/sessionCompletion.service');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // 1. Connect to DB first — throws on failure so the server never opens a
  //    port without a working database.
  await connectDB();

  // 2. Start background jobs only after DB is live.
  startSessionCompletionJob();

  // 3. Start HTTP server.
  const server = app.listen(PORT, () => {
    console.log(
      `[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });

  // 4. Graceful shutdown on SIGTERM / SIGINT (Docker stop, Ctrl+C).
  const shutdown = (signal) => {
    console.log(`[Server] ${signal} — shutting down gracefully…`);
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // 5. Catch any unhandled rejections that escape try/catch elsewhere.
  process.on('unhandledRejection', (err) => {
    console.error(`[Server] Unhandled rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

start().catch((err) => {
  console.error(`[Server] Failed to start: ${err.message}`);
  process.exit(1);
});
