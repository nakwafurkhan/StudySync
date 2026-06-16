import api from './api';

export async function listSessions(subjectId) {
  const res = await api.get('/sessions', {
    params: subjectId ? { subjectId } : undefined,
  });
  return res.data.sessions;
}

export async function createSession(payload) {
  const res = await api.post('/sessions', payload);
  return res.data.session;
}
