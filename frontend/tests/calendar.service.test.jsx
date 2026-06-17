import { listEvents, createEvent, deleteEvent } from '../src/services/calendar';
import api from '../src/services/api';

jest.mock('../src/services/api');

describe('calendar service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists events with range params', async () => {
    api.get.mockResolvedValueOnce({ data: { events: [{ _id: '1' }] } });
    const out = await listEvents('2026-06-01', '2026-06-30');
    expect(api.get).toHaveBeenCalledWith('/calendar', { params: { from: '2026-06-01', to: '2026-06-30' } });
    expect(out).toHaveLength(1);
  });

  it('creates an event', async () => {
    api.post.mockResolvedValueOnce({ data: { event: { _id: '2', title: 'Midterm' } } });
    const out = await createEvent({ title: 'Midterm', type: 'exam', date: '2026-07-01' });
    expect(api.post).toHaveBeenCalledWith('/calendar', { title: 'Midterm', type: 'exam', date: '2026-07-01' });
    expect(out._id).toBe('2');
  });

  it('deletes an event', async () => {
    api.delete.mockResolvedValueOnce({ data: {} });
    await deleteEvent('3');
    expect(api.delete).toHaveBeenCalledWith('/calendar/3');
  });
});
