import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SyllabusImport from '../src/components/SyllabusImport';
import * as syl from '../src/services/syllabus';

jest.mock('../src/services/syllabus', () => ({
  __esModule: true,
  parseText: jest.fn(),
  parseUrl: jest.fn(),
  parseFile: jest.fn(),
  importItems: jest.fn(),
}));

const item = { title: 'Midterm', type: 'exam', dueDate: '2026-07-01', weightPercent: 30 };

const renderImport = () =>
  render(
    <MemoryRouter>
      <SyllabusImport />
    </MemoryRouter>
  );

describe('SyllabusImport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('extracts items from pasted text and lists them', async () => {
    syl.parseText.mockResolvedValueOnce({ course: 'CS101', items: [item] });
    const user = userEvent.setup();
    renderImport();

    await user.type(screen.getByLabelText(/syllabus text/i), 'Midterm July 1 30%');
    await user.click(screen.getByRole('button', { name: /extract/i }));

    expect(await screen.findByText('Midterm')).toBeInTheDocument();
    expect(syl.parseText).toHaveBeenCalledWith('Midterm July 1 30%');
  });

  it('imports the selected items to the calendar', async () => {
    syl.parseText.mockResolvedValueOnce({ course: 'CS101', items: [item] });
    syl.importItems.mockResolvedValueOnce({ created: 1 });
    const user = userEvent.setup();
    renderImport();

    await user.type(screen.getByLabelText(/syllabus text/i), 'x');
    await user.click(screen.getByRole('button', { name: /extract/i }));
    await screen.findByText('Midterm');

    await user.click(screen.getByRole('button', { name: /add 1 to calendar/i }));

    await waitFor(() => expect(syl.importItems).toHaveBeenCalledWith([item], 'CS101'));
    expect(await screen.findByText(/added 1 event/i)).toBeInTheDocument();
  });
});
