import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubjectManager from '../src/components/SubjectManager';
import * as subjectsService from '../src/services/subjects';

// Factory mock — avoids loading the real service (which imports the
// import.meta-based api client).
jest.mock('../src/services/subjects', () => ({
  __esModule: true,
  listSubjects: jest.fn(),
  createSubject: jest.fn(),
  updateSubject: jest.fn(),
  deleteSubject: jest.fn(),
}));

describe('SubjectManager', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders subjects returned by the service', async () => {
    subjectsService.listSubjects.mockResolvedValueOnce([
      { _id: '1', name: 'Calculus', deadline: '2026-07-01', priority: 'high' },
    ]);
    render(<SubjectManager />);
    expect(await screen.findByText('Calculus')).toBeInTheDocument();
  });

  it('shows an empty state when there are no subjects', async () => {
    subjectsService.listSubjects.mockResolvedValueOnce([]);
    render(<SubjectManager />);
    expect(await screen.findByText(/no subjects yet/i)).toBeInTheDocument();
  });

  it('adds a subject through the form', async () => {
    subjectsService.listSubjects.mockResolvedValueOnce([]);
    subjectsService.createSubject.mockResolvedValueOnce({
      _id: '9',
      name: 'Physics',
      deadline: '2026-08-01',
      priority: 'medium',
    });
    const user = userEvent.setup();
    render(<SubjectManager />);
    await screen.findByText(/no subjects yet/i);

    await user.type(screen.getByLabelText(/subject name/i), 'Physics');
    fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: '2026-08-01' } });
    await user.click(screen.getByRole('button', { name: /add subject/i }));

    await waitFor(() =>
      expect(subjectsService.createSubject).toHaveBeenCalledWith({
        name: 'Physics',
        deadline: '2026-08-01',
        priority: 'medium',
      })
    );
    expect(await screen.findByText('Physics')).toBeInTheDocument();
  });

  it('deletes a subject', async () => {
    subjectsService.listSubjects.mockResolvedValueOnce([
      { _id: '1', name: 'Calculus', deadline: '2026-07-01', priority: 'high' },
    ]);
    subjectsService.deleteSubject.mockResolvedValueOnce();
    const user = userEvent.setup();
    render(<SubjectManager />);
    await screen.findByText('Calculus');

    await user.click(screen.getByRole('button', { name: /delete calculus/i }));

    await waitFor(() => expect(subjectsService.deleteSubject).toHaveBeenCalledWith('1'));
    await waitFor(() => expect(screen.queryByText('Calculus')).not.toBeInTheDocument());
  });
});
