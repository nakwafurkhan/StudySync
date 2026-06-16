import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../src/services/subjects';
import api from '../src/services/api';

jest.mock('../src/services/api');

describe('subjects service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists subjects (unwraps res.data.subjects)', async () => {
    api.get.mockResolvedValueOnce({ data: { subjects: [{ _id: '1', name: 'Math' }] } });
    const out = await listSubjects();
    expect(api.get).toHaveBeenCalledWith('/subjects');
    expect(out).toEqual([{ _id: '1', name: 'Math' }]);
  });

  it('creates a subject', async () => {
    api.post.mockResolvedValueOnce({ data: { subject: { _id: '2', name: 'Bio' } } });
    const payload = { name: 'Bio', deadline: '2026-07-01', priority: 'low' };
    const out = await createSubject(payload);
    expect(api.post).toHaveBeenCalledWith('/subjects', payload);
    expect(out._id).toBe('2');
  });

  it('updates a subject', async () => {
    api.put.mockResolvedValueOnce({ data: { subject: { _id: '3', priority: 'high' } } });
    const out = await updateSubject('3', { priority: 'high' });
    expect(api.put).toHaveBeenCalledWith('/subjects/3', { priority: 'high' });
    expect(out.priority).toBe('high');
  });

  it('deletes a subject', async () => {
    api.delete.mockResolvedValueOnce({ data: {} });
    await deleteSubject('4');
    expect(api.delete).toHaveBeenCalledWith('/subjects/4');
  });
});
