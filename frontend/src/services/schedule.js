import api from './api';

/** Returns the current study plan, or null if none has been generated yet. */
export async function getCurrentSchedule() {
  try {
    const res = await api.get('/schedule/current');
    return res.data.plan;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

/** Generates (and persists) a new study plan. */
export async function generateSchedule({ dailyHours, startDate } = {}) {
  const res = await api.post('/schedule/generate', { dailyHours, startDate });
  return res.data.plan;
}
