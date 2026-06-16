import { getSummary } from '../src/services/analytics';
import api from '../src/services/api';

jest.mock('../src/services/api');

describe('analytics service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches and unwraps the summary', async () => {
    api.get.mockResolvedValueOnce({ data: { summary: { totalHours: 5, totalSessions: 2 } } });
    const out = await getSummary();
    expect(api.get).toHaveBeenCalledWith('/analytics/summary');
    expect(out.totalHours).toBe(5);
  });
});
