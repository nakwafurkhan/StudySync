import { parseText, parseUrl, importItems } from '../src/services/syllabus';
import api from '../src/services/api';

jest.mock('../src/services/api');

describe('syllabus service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('parses pasted text', async () => {
    api.post.mockResolvedValueOnce({ data: { course: 'CS101', items: [] } });
    const out = await parseText('hello');
    expect(api.post).toHaveBeenCalledWith('/syllabus/parse', { text: 'hello' });
    expect(out.course).toBe('CS101');
  });

  it('parses a URL', async () => {
    api.post.mockResolvedValueOnce({ data: { course: '', items: [] } });
    await parseUrl('https://example.com/syllabus');
    expect(api.post).toHaveBeenCalledWith('/syllabus/parse', { url: 'https://example.com/syllabus' });
  });

  it('imports items', async () => {
    api.post.mockResolvedValueOnce({ data: { created: 2 } });
    const out = await importItems([{ title: 'a' }], 'CS101');
    expect(api.post).toHaveBeenCalledWith('/syllabus/import', { items: [{ title: 'a' }], course: 'CS101' });
    expect(out.created).toBe(2);
  });
});
