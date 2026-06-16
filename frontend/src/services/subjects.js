import api from './api';

export async function listSubjects() {
  const res = await api.get('/subjects');
  return res.data.subjects;
}

export async function createSubject(payload) {
  const res = await api.post('/subjects', payload);
  return res.data.subject;
}

export async function updateSubject(id, payload) {
  const res = await api.put(`/subjects/${id}`, payload);
  return res.data.subject;
}

export async function deleteSubject(id) {
  await api.delete(`/subjects/${id}`);
}
