import { sendMessage } from '../src/services/assistant';
import api from '../src/services/api';

jest.mock('../src/services/api');

describe('assistant service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts the message history and returns the reply', async () => {
    api.post.mockResolvedValueOnce({ data: { reply: 'Study Calculus first.' } });
    const out = await sendMessage([{ role: 'user', content: 'hi' }]);
    expect(api.post).toHaveBeenCalledWith('/assistant/chat', { messages: [{ role: 'user', content: 'hi' }] });
    expect(out).toBe('Study Calculus first.');
  });
});
