'use strict';

const dns = require('dns');
const mongoose = require('mongoose');

// On Windows / some ISP setups the system DNS server silently drops or
// refuses SRV record queries, which produces:
//   querySrv ECONNREFUSED _mongodb._tcp.cluster0…
// Pinning to Google + Cloudflare public resolvers fixes it before
// Mongoose makes the first Atlas connection attempt.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

mongoose.set('strictQuery', true);

// Attach lifecycle event listeners once; they fire on every reconnect too.
const _attachListeners = (() => {
  let attached = false;
  return () => {
    if (attached) return;
    attached = true;

    mongoose.connection.on('connected', () => {
      console.log(
        `[DB] MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`
      );
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected — waiting for Mongoose auto-reconnect…');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DB] MongoDB reconnected.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[DB] MongoDB error: ${err.message}`);
    });
  };
})();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in your .env file.');
  }

  _attachListeners();

  await mongoose.connect(uri, {
    retryWrites: true,
    w: 'majority',
    socketTimeoutMS: 45_000,
    serverSelectionTimeoutMS: 10_000,
  });
};

module.exports = connectDB;
