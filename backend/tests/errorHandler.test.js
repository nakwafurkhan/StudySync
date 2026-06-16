const { notFound, errorHandler } = require('../src/middleware/errorHandler');

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((body) => {
    res.body = body;
    return res;
  });
  return res;
};

describe('error middleware', () => {
  it('notFound sets 404 and forwards an Error', () => {
    const res = mockRes();
    const next = jest.fn();
    notFound({ originalUrl: '/missing' }, res, next);
    expect(res.statusCode).toBe(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('errorHandler preserves a non-200 status and returns the message', () => {
    const res = mockRes();
    res.statusCode = 400;
    errorHandler(new Error('bad request'), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.message).toBe('bad request');
  });

  it('errorHandler defaults to 500 when status is still 200', () => {
    const res = mockRes();
    errorHandler(new Error('kaboom'), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body.message).toBe('kaboom');
  });
});
