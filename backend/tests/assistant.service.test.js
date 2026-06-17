jest.mock('../src/services/groqClient', () => ({
  createChatCompletion: jest.fn(),
  getClient: jest.fn(),
}));

const { buildContext, chat } = require('../src/services/assistant.service');
const groqClient = require('../src/services/groqClient');

const summary = {
  totalHours: 3.5,
  totalSessions: 5,
  currentStreak: 3,
  todayMinutes: 45,
  dailyGoalMinutes: 240,
  perSubject: [{ subject: 'Calculus', loggedHours: 1.5, plannedHours: 4 }],
  upcomingDeadlines: [{ subject: 'Calculus', daysUntil: 3, atRisk: true }],
};
const subjects = [{ name: 'Calculus', priority: 'high', deadline: '2026-07-01' }];

describe('buildContext', () => {
  it('summarizes the student data into a grounded string', () => {
    const ctx = buildContext({ summary, subjects, sessions: [], calendar: [] });
    expect(ctx).toMatch(/streak: 3/);
    expect(ctx).toMatch(/Calculus/);
  });
});

describe('chat', () => {
  afterEach(() => jest.clearAllMocks());

  it('calls Groq in free-text mode and trims the reply', async () => {
    groqClient.createChatCompletion.mockResolvedValueOnce('  Focus on Calculus today.  ');
    const reply = await chat([{ role: 'user', content: 'What now?' }], 'ctx');
    expect(reply).toBe('Focus on Calculus today.');
    expect(groqClient.createChatCompletion).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ json: false })
    );
  });
});
