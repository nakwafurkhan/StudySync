require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
  } catch (err) {
    // Don't crash on a DB hiccup — the health route still reports status.
    console.error('[db] Initial connection error:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[server] StudySync API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
})();
