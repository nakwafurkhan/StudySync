jest.mock('../src/services/groqClient', () => ({
  createChatCompletion: jest.fn(),
  getClient: jest.fn(),
}));

const {
  buildPrompt,
  parseAndValidateSchedule,
  buildFallbackSchedule,
  generateSchedule,
} = require('../src/services/schedule.service');
const groqClient = require('../src/services/groqClient');

const subjects = [
  { name: 'Calculus', deadline: '2026-07-01', priority: 'high' },
  { name: 'Biology', deadline: '2026-07-10', priority: 'medium' },
];

describe('parseAndValidateSchedule', () => {
  it('parses valid JSON and keeps known blocks', () => {
    const raw = JSON.stringify({
      days: [{ date: '2026-06-17', blocks: [{ subject: 'Calculus', hours: 2 }] }],
    });
    const out = parseAndValidateSchedule(raw, { subjectNames: ['Calculus', 'Biology'], dailyHours: 3 });
    expect(out.days).toHaveLength(1);
    expect(out.days[0].blocks[0]).toEqual({ subject: 'Calculus', hours: 2 });
  });

  it('drops hallucinated subjects and non-positive hours', () => {
    const raw = JSON.stringify({
      days: [
        {
          date: '2026-06-17',
          blocks: [
            { subject: 'Calculus', hours: 2 },
            { subject: 'Astrology', hours: 1 },
            { subject: 'Biology', hours: -1 },
          ],
        },
      ],
    });
    const out = parseAndValidateSchedule(raw, { subjectNames: ['Calculus', 'Biology'], dailyHours: 5 });
    expect(out.days[0].blocks).toEqual([{ subject: 'Calculus', hours: 2 }]);
  });

  it('clamps a day total to the daily budget', () => {
    const raw = JSON.stringify({
      days: [
        {
          date: '2026-06-17',
          blocks: [
            { subject: 'Calculus', hours: 3 },
            { subject: 'Biology', hours: 3 },
          ],
        },
      ],
    });
    const out = parseAndValidateSchedule(raw, { subjectNames: ['Calculus', 'Biology'], dailyHours: 4 });
    const total = out.days[0].blocks.reduce((s, b) => s + b.hours, 0);
    expect(total).toBeCloseTo(4, 1);
  });

  it('throws on non-JSON input', () => {
    expect(() => parseAndValidateSchedule('not json', { subjectNames: ['Calculus'] })).toThrow();
  });

  it('throws when no valid days remain', () => {
    const raw = JSON.stringify({
      days: [{ date: '2026-06-17', blocks: [{ subject: 'Unknown', hours: 1 }] }],
    });
    expect(() =>
      parseAndValidateSchedule(raw, { subjectNames: ['Calculus'], dailyHours: 2 })
    ).toThrow();
  });
});

describe('buildPrompt', () => {
  it('returns system + user messages referencing subjects and budget', () => {
    const msgs = buildPrompt({ subjects, dailyHours: 4, startDate: '2026-06-17' });
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('system');
    expect(msgs[1].content).toMatch(/Calculus/);
    expect(msgs[1].content).toMatch(/4/);
  });
});

describe('buildFallbackSchedule', () => {
  it('builds a deterministic schedule using the known subjects', () => {
    const out = buildFallbackSchedule({ subjects, dailyHours: 4, startDate: '2026-06-17' });
    expect(out.days.length).toBeGreaterThan(0);
    expect(out.days[0].blocks.map((b) => b.subject)).toContain('Calculus');
  });
});

describe('generateSchedule', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns an openai schedule on valid JSON', async () => {
    groqClient.createChatCompletion.mockResolvedValueOnce(
      JSON.stringify({ days: [{ date: '2026-06-17', blocks: [{ subject: 'Calculus', hours: 2 }] }] })
    );
    const out = await generateSchedule({ subjects, dailyHours: 3, startDate: '2026-06-17' });
    expect(out.source).toBe('groq');
    expect(out.schedule.days[0].blocks[0].subject).toBe('Calculus');
  });

  it('retries once, then succeeds', async () => {
    groqClient.createChatCompletion
      .mockResolvedValueOnce('garbage{')
      .mockResolvedValueOnce(
        JSON.stringify({ days: [{ date: '2026-06-17', blocks: [{ subject: 'Biology', hours: 1 }] }] })
      );
    const out = await generateSchedule({ subjects, dailyHours: 3, startDate: '2026-06-17' });
    expect(groqClient.createChatCompletion).toHaveBeenCalledTimes(2);
    expect(out.source).toBe('groq');
  });

  it('falls back to a deterministic plan when the model keeps failing', async () => {
    groqClient.createChatCompletion.mockResolvedValue('still not json');
    const out = await generateSchedule({ subjects, dailyHours: 4, startDate: '2026-06-17' });
    expect(out.source).toBe('fallback');
    expect(out.schedule.days.length).toBeGreaterThan(0);
  });
});
