import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScheduleView from '../src/components/ScheduleView';
import * as scheduleService from '../src/services/schedule';

jest.mock('../src/services/schedule', () => ({
  __esModule: true,
  getCurrentSchedule: jest.fn(),
  generateSchedule: jest.fn(),
}));

const samplePlan = {
  _id: 'p1',
  dailyHours: 3,
  source: 'groq',
  createdAt: '2026-06-16T00:00:00.000Z',
  generatedSchedule: {
    days: [{ date: '2026-06-17', blocks: [{ subject: 'Calculus', hours: 2 }] }],
  },
};

describe('ScheduleView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the empty state when there is no plan', async () => {
    scheduleService.getCurrentSchedule.mockResolvedValueOnce(null);
    render(<ScheduleView />);
    expect(await screen.findByText(/no schedule yet/i)).toBeInTheDocument();
  });

  it('renders an existing plan', async () => {
    scheduleService.getCurrentSchedule.mockResolvedValueOnce(samplePlan);
    render(<ScheduleView />);
    expect(await screen.findByText('2026-06-17')).toBeInTheDocument();
    expect(screen.getByText(/Calculus/)).toBeInTheDocument();
  });

  it('generates a schedule on submit', async () => {
    scheduleService.getCurrentSchedule.mockResolvedValueOnce(null);
    scheduleService.generateSchedule.mockResolvedValueOnce(samplePlan);
    const user = userEvent.setup();
    render(<ScheduleView />);
    await screen.findByText(/no schedule yet/i);

    await user.click(screen.getByRole('button', { name: /generate schedule/i }));

    await waitFor(() =>
      expect(scheduleService.generateSchedule).toHaveBeenCalledWith({ dailyHours: 3 })
    );
    expect(await screen.findByText('2026-06-17')).toBeInTheDocument();
  });
});
