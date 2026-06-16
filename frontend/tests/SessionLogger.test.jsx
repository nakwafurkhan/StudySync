import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SessionLogger from '../src/components/SessionLogger';
import * as subjectsService from '../src/services/subjects';
import * as sessionsService from '../src/services/sessions';

jest.mock('../src/services/subjects', () => ({
  __esModule: true,
  listSubjects: jest.fn(),
  createSubject: jest.fn(),
  updateSubject: jest.fn(),
  deleteSubject: jest.fn(),
}));
jest.mock('../src/services/sessions', () => ({
  __esModule: true,
  listSessions: jest.fn(),
  createSession: jest.fn(),
}));

const renderLogger = () =>
  render(
    <MemoryRouter>
      <SessionLogger />
    </MemoryRouter>
  );

describe('SessionLogger', () => {
  beforeEach(() => jest.clearAllMocks());

  it('prompts to add a subject when the user has none', async () => {
    subjectsService.listSubjects.mockResolvedValueOnce([]);
    sessionsService.listSessions.mockResolvedValueOnce([]);
    renderLogger();
    expect(await screen.findByText(/add a subject first/i)).toBeInTheDocument();
  });

  it('renders existing sessions', async () => {
    subjectsService.listSubjects.mockResolvedValueOnce([{ _id: 'sub1', name: 'Calculus' }]);
    sessionsService.listSessions.mockResolvedValueOnce([
      { _id: 'sess1', subjectId: { _id: 'sub1', name: 'Biology' }, durationMinutes: 30, date: '2026-06-15' },
    ]);
    renderLogger();
    expect(await screen.findByText('Biology')).toBeInTheDocument();
    expect(screen.getByText(/30 min/)).toBeInTheDocument();
  });

  it('logs a session and prepends it to the list', async () => {
    subjectsService.listSubjects.mockResolvedValueOnce([{ _id: 'sub1', name: 'Calculus' }]);
    sessionsService.listSessions.mockResolvedValueOnce([]);
    sessionsService.createSession.mockResolvedValueOnce({
      _id: 'sess1',
      subjectId: { _id: 'sub1', name: 'Calculus' },
      durationMinutes: 45,
      date: '2026-06-16',
      notes: 'Limits',
    });
    const user = userEvent.setup();
    renderLogger();

    const durationInput = await screen.findByLabelText(/duration/i);
    fireEvent.change(durationInput, { target: { value: '45' } });
    await user.click(screen.getByRole('button', { name: /log session/i }));

    await waitFor(() =>
      expect(sessionsService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ subjectId: 'sub1', durationMinutes: 45 })
      )
    );
    expect(await screen.findByText(/45 min/)).toBeInTheDocument();
  });
});
