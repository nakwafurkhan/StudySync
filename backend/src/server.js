require('dotenv').config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start listening IMMEDIATELY so platform health checks (e.g. Render's
// /api/health probe) pass on cold starts — the health route reports DB state
// but doesn't require a live DB connection.
const server = app.listen(PORT, () => {
  console.log(`[server] StudySync API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// Connect to MongoDB in the background. Log failures but never block the
// server from accepting requests (Mongoose buffers queries until connected).
connectDB().catch((err) => {
  console.error('[db] Initial connection error:', err.message);
});

function shutdown(signal) {
  app.locals.draining = true;
  console.log(JSON.stringify({ event: 'shutdown', signal }));
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  server.close(async () => {
    await disconnectDB();
    clearTimeout(deadline);
    process.exit(0);
  });
  server.closeIdleConnections();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
module.exports = server;
