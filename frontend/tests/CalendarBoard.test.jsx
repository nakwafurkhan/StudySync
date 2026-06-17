import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarBoard from '../src/components/CalendarBoard';
import * as cal from '../src/services/calendar';

jest.mock('../src/services/calendar', () => ({
  __esModule: true,
  listEvents: jest.fn(),
  createEvent: jest.fn(),
  deleteEvent: jest.fn(),
}));

describe('CalendarBoard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the month and its events', async () => {
    cal.listEvents.mockResolvedValue([
      { _id: '1', title: 'Midterm', type: 'exam', date: '2026-06-20', derived: false },
    ]);
    render(<CalendarBoard initialDate="2026-06-15" />);
    expect(await screen.findByText('June 2026')).toBeInTheDocument();
    expect(await screen.findByText('Midterm')).toBeInTheDocument();
  });

  it('adds an event on the selected day', async () => {
    cal.listEvents.mockResolvedValue([]);
    cal.createEvent.mockResolvedValueOnce({ _id: '9', title: 'Quiz', type: 'assignment', date: '2026-06-20' });
    const user = userEvent.setup();
    render(<CalendarBoard initialDate="2026-06-15" />);
    await screen.findByText('June 2026');

    await user.click(screen.getByRole('button', { name: '2026-06-20' }));
    await user.type(screen.getByLabelText(/event title/i), 'Quiz');
    await user.click(screen.getByRole('button', { name: /add event/i }));

    await waitFor(() =>
      expect(cal.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Quiz', date: '2026-06-20' })
      )
    );
  });

  it('navigates to the next month', async () => {
    cal.listEvents.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<CalendarBoard initialDate="2026-06-15" />);
    await screen.findByText('June 2026');
    await user.click(screen.getByRole('button', { name: /next month/i }));
    expect(await screen.findByText('July 2026')).toBeInTheDocument();
  });
});
