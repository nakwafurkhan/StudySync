import api from './api';

export async function listEvents(from, to) {
  const res = await api.get('/calendar', { params: { from, to } });
  return res.data.events;
}

export async function createEvent(payload) {
  const res = await api.post('/calendar', payload);
  return res.data.event;
}

export async function deleteEvent(id) {
  await api.delete(`/calendar/${id}`);
}
