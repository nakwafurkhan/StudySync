import api from './api';

export async function parseText(text) {
  const res = await api.post('/syllabus/parse', { text });
  return res.data;
}

export async function parseUrl(url) {
  const res = await api.post('/syllabus/parse', { url });
  return res.data;
}

export async function parseFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post('/syllabus/parse', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function importItems(items, course) {
  const res = await api.post('/syllabus/import', { items, course });
  return res.data;
}
