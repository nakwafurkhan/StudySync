const { protect } = require('../src/middleware/auth');
const User = require('../src/models/User');
const tokenUtil = require('../src/utils/token');

jest.mock('../src/models/User');
jest.mock('../src/utils/token', () => ({
  ...jest.requireActual('../src/utils/token'),
  verifyToken: jest.fn(),
}));

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('protect middleware', () => {
  afterEach(() => jest.clearAllMocks());

  it('responds 401 when no token is present', async () => {
    const res = mockRes();
    const next = jest.fn();
    await protect({ cookies: {}, headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when the token is invalid', async () => {
    tokenUtil.verifyToken.mockImplementation(() => {
      throw new Error('bad token');
    });
    const res = mockRes();
    await protect({ cookies: { token: 'x' }, headers: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('responds 401 when the user no longer exists', async () => {
    tokenUtil.verifyToken.mockReturnValue({ sub: 'abc' });
    User.findById.mockResolvedValue(null);
    const res = mockRes();
    await protect({ cookies: { token: 'x' }, headers: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('attaches req.user and calls next on a valid cookie token', async () => {
    tokenUtil.verifyToken.mockReturnValue({ sub: 'abc' });
    const fakeUser = { id: 'abc', name: 'Tess' };
    User.findById.mockResolvedValue(fakeUser);
    const req = { cookies: { token: 'x' }, headers: {} };
    const next = jest.fn();
    await protect(req, mockRes(), next);
    expect(req.user).toBe(fakeUser);
    expect(next).toHaveBeenCalled();
  });

  it('falls back to the Authorization Bearer header', async () => {
    tokenUtil.verifyToken.mockReturnValue({ sub: 'abc' });
    User.findById.mockResolvedValue({ id: 'abc' });
    const next = jest.fn();
    await protect({ cookies: {}, headers: { authorization: 'Bearer tok' } }, mockRes(), next);
    expect(tokenUtil.verifyToken).toHaveBeenCalledWith('tok');
    expect(next).toHaveBeenCalled();
  });
});
