import api from './api';

export async function sendMessage(messages) {
  const res = await api.post('/assistant/chat', { messages });
  return res.data.reply;
}
