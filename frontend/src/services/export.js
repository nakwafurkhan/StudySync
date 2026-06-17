import api from './api';

/** Fetch a file (with the auth cookie) and trigger a browser download. */
async function download(path, filename) {
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const exportSessionsCsv = () => download('/export/sessions.csv', 'studysync-sessions.csv');
export const exportCalendarCsv = () => download('/export/calendar.csv', 'studysync-calendar.csv');
export const exportReportPdf = () => download('/export/report.pdf', 'studysync-report.pdf');
