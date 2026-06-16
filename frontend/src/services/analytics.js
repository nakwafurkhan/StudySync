import api from './api';

export async function getSummary() {
  const res = await api.get('/analytics/summary');
  return res.data.summary;
}
