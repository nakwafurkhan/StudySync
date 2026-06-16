import { render, screen } from '@testing-library/react';
import DashboardAnalytics from '../src/components/DashboardAnalytics';
import * as analyticsService from '../src/services/analytics';

jest.mock('../src/services/analytics', () => ({
  __esModule: true,
  getSummary: jest.fn(),
}));

// Stub Recharts so jsdom (no layout) doesn't choke on ResponsiveContainer.
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  BarChart: ({ children }) => children,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

const summary = {
  totalHours: 3.5,
  totalSessions: 3,
  hoursPerWeek: [{ week: '2026-06-15', hours: 1.5 }],
  perSubject: [
    { subject: 'Calculus', plannedHours: 4, loggedHours: 1.5, adherence: 0.38 },
    { subject: 'Biology', plannedHours: 1, loggedHours: 2, adherence: 1 },
  ],
  upcomingDeadlines: [
    { subject: 'Calculus', deadline: '2026-06-20', daysUntil: 3, atRisk: true, loggedHours: 1.5, plannedHours: 4 },
    { subject: 'Biology', deadline: '2026-07-30', daysUntil: 43, atRisk: false, loggedHours: 2, plannedHours: 1 },
  ],
};

describe('DashboardAnalytics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders totals, adherence and deadlines', async () => {
    analyticsService.getSummary.mockResolvedValueOnce(summary);
    render(<DashboardAnalytics />);

    expect(await screen.findByText('3.5')).toBeInTheDocument(); // total hours
    expect(screen.getByText('Sessions logged')).toBeInTheDocument();
    expect(screen.getByText('1.5h / 4h')).toBeInTheDocument(); // Calculus adherence
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText(/At risk/i)).toBeInTheDocument();
  });

  it('shows an empty hint when nothing has been logged', async () => {
    analyticsService.getSummary.mockResolvedValueOnce({
      totalHours: 0,
      totalSessions: 0,
      hoursPerWeek: [],
      perSubject: [],
      upcomingDeadlines: [],
    });
    render(<DashboardAnalytics />);
    expect(await screen.findByText(/no sessions logged yet/i)).toBeInTheDocument();
  });

  it('surfaces an error if the summary fails to load', async () => {
    analyticsService.getSummary.mockRejectedValueOnce(new Error('boom'));
    render(<DashboardAnalytics />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load analytics/i);
  });
});
