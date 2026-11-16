const { randomUUID } = require('node:crypto');
const client = require('prom-client');
const mongoose = require('mongoose');
const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });
const duration = new client.Histogram({
  name: 'http_request_duration_seconds', help: 'API request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5], registers: [registry],
});
new client.Gauge({ name: 'studysync_database_ready', help: 'MongoDB connection readiness',
  registers: [registry], collect() { this.set(mongoose.connection.readyState === 1 ? 1 : 0); } });

function observe(req, res, next) {
  const requestId = randomUUID();
  res.setHeader('X-Request-Id', requestId);
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    // Route templates prevent user IDs and arbitrary URLs creating unlimited series.
    const route = req.route ? `${req.baseUrl}${req.route.path}` : 'unmatched';
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    duration.observe({ method: req.method, route, status: String(res.statusCode) }, seconds);
    if (process.env.NODE_ENV !== 'test') console.log(JSON.stringify({
      event: 'http_request', requestId, method: req.method, route,
      status: res.statusCode, durationMs: Math.round(seconds * 1000),
    }));
  });
  next();
}
module.exports = { observe, registry };
