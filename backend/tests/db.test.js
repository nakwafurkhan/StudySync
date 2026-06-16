jest.mock('mongoose', () => ({
  set: jest.fn(),
  connect: jest.fn().mockResolvedValue({ connection: { host: 'test-host' } }),
  disconnect: jest.fn().mockResolvedValue(undefined),
}));

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('connectDB', () => {
  afterEach(() => jest.clearAllMocks());

  it('connects when an explicit URI is provided', async () => {
    const conn = await connectDB('mongodb://localhost/studysync-test');
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost/studysync-test');
    expect(conn.connection.host).toBe('test-host');
  });

  it('falls back to MONGO_URI from the environment', async () => {
    process.env.MONGO_URI = 'mongodb://localhost/env-uri';
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost/env-uri');
    delete process.env.MONGO_URI;
  });

  it('skips connection and returns null when no URI is available', async () => {
    delete process.env.MONGO_URI;
    const conn = await connectDB();
    expect(mongoose.connect).not.toHaveBeenCalled();
    expect(conn).toBeNull();
  });

  it('disconnects', async () => {
    await disconnectDB();
    expect(mongoose.disconnect).toHaveBeenCalled();
  });
});
