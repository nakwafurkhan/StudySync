const mongoose = require('mongoose');

/**
 * Connect to MongoDB. Accepts an explicit URI (handy for tests) and otherwise
 * falls back to MONGO_URI. If no URI is available the connection is skipped
 * rather than throwing, so the server can still boot for health checks.
 *
 * @param {string} [uri] - optional MongoDB connection string
 * @returns {Promise<import('mongoose').Mongoose|null>}
 */
async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn('[db] MONGO_URI not set — skipping MongoDB connection.');
    return null;
  }

  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(mongoUri);
  console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  return conn;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
