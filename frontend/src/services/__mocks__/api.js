// Manual mock for the axios api client used in tests.
// Keeping it here means the real api.js (which reads import.meta.env) is never
// evaluated under Jest.
const api = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
};

export default api;
