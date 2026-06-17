import { exportSessionsCsv, exportCalendarCsv, exportReportPdf } from '../src/services/export';
import api from '../src/services/api';

jest.mock('../src/services/api');

describe('export service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: new Blob(['x']) });
  });

  it('requests the sessions CSV as a blob', async () => {
    await exportSessionsCsv();
    expect(api.get).toHaveBeenCalledWith('/export/sessions.csv', { responseType: 'blob' });
  });

  it('requests the calendar CSV as a blob', async () => {
    await exportCalendarCsv();
    expect(api.get).toHaveBeenCalledWith('/export/calendar.csv', { responseType: 'blob' });
  });

  it('requests the PDF report as a blob', async () => {
    await exportReportPdf();
    expect(api.get).toHaveBeenCalledWith('/export/report.pdf', { responseType: 'blob' });
  });
});
