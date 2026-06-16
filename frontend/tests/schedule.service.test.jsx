import { getCurrentSchedule, generateSchedule } from '../src/services/schedule';
import api from '../src/services/api';

jest.mock('../src/services/api');

describe('schedule service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the current plan', async () => {
    api.get.mockResolvedValueOnce({ data: { plan: { _id: 'p1', dailyHours: 3 } } });
    const out = await getCurrentSchedule();
    expect(api.get).toHaveBeenCalledWith('/schedule/current');
    expect(out._id).toBe('p1');
  });

  it('returns null when no plan exists (404)', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 404 } });
    expect(await getCurrentSchedule()).toBeNull();
  });

  it('rethrows non-404 errors', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 500 } });
    await expect(getCurrentSchedule()).rejects.toBeDefined();
  });

  it('generates a schedule', async () => {
    api.post.mockResolvedValueOnce({ data: { plan: { _id: 'p2' } } });
    const out = await generateSchedule({ dailyHours: 4 });
    expect(api.post).toHaveBeenCalledWith('/schedule/generate', { dailyHours: 4, startDate: undefined });
    expect(out._id).toBe('p2');
  });
});
