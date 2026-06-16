import { listSessions, createSession } from '../src/services/sessions';
import api from '../src/services/api';

jest.mock('../src/services/api');

describe('sessions service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists sessions', async () => {
    api.get.mockResolvedValueOnce({ data: { sessions: [{ _id: 's1' }] } });
    const out = await listSessions();
    expect(api.get).toHaveBeenCalledWith('/sessions', { params: undefined });
    expect(out).toHaveLength(1);
  });

  it('lists sessions filtered by subject', async () => {
    api.get.mockResolvedValueOnce({ data: { sessions: [] } });
    await listSessions('abc');
    expect(api.get).toHaveBeenCalledWith('/sessions', { params: { subjectId: 'abc' } });
  });

  it('creates a session', async () => {
    api.post.mockResolvedValueOnce({ data: { session: { _id: 's2', durationMinutes: 30 } } });
    const out = await createSession({ subjectId: 'x', durationMinutes: 30 });
    expect(api.post).toHaveBeenCalledWith('/sessions', { subjectId: 'x', durationMinutes: 30 });
    expect(out._id).toBe('s2');
  });
});
