jest.mock('../src/services/groqClient', () => ({
  createChatCompletion: jest.fn(),
  getClient: jest.fn(),
}));

const {
  buildSyllabusPrompt,
  parseAndValidateSyllabus,
  extractSyllabus,
  weightToPriority,
} = require('../src/services/syllabus.service');
const groqClient = require('../src/services/groqClient');

const validJson = JSON.stringify({
  course: 'CS101',
  items: [{ title: 'Midterm', type: 'exam', dueDate: '2026-07-01', weightPercent: 30 }],
});

describe('buildSyllabusPrompt', () => {
  it('includes the syllabus text in the user message', () => {
    const msgs = buildSyllabusPrompt('Exam on July 1, worth 30%');
    expect(msgs).toHaveLength(2);
    expect(msgs[1].content).toMatch(/Exam on July 1/);
  });
});

describe('parseAndValidateSyllabus', () => {
  it('parses course and items', () => {
    const out = parseAndValidateSyllabus(validJson);
    expect(out.course).toBe('CS101');
    expect(out.items[0]).toEqual({ title: 'Midterm', type: 'exam', dueDate: '2026-07-01', weightPercent: 30 });
  });

  it('drops untitled items, coerces bad type, nulls bad date/weight', () => {
    const raw = JSON.stringify({
      course: '',
      items: [
        { title: '', type: 'exam', dueDate: '2026-07-01' },
        { title: 'Essay', type: 'nonsense', dueDate: 'whenever', weightPercent: 250 },
      ],
    });
    const out = parseAndValidateSyllabus(raw);
    expect(out.items).toHaveLength(1);
    expect(out.items[0]).toEqual({ title: 'Essay', type: 'deadline', dueDate: null, weightPercent: null });
  });

  it('throws on non-JSON and on empty/missing items', () => {
    expect(() => parseAndValidateSyllabus('not json')).toThrow();
    expect(() => parseAndValidateSyllabus(JSON.stringify({ course: 'x' }))).toThrow();
    expect(() => parseAndValidateSyllabus(JSON.stringify({ items: [{ type: 'exam' }] }))).toThrow();
  });
});

describe('extractSyllabus', () => {
  afterEach(() => jest.clearAllMocks());

  it('throws on empty text', async () => {
    await expect(extractSyllabus('')).rejects.toThrow();
  });

  it('returns parsed result on valid JSON', async () => {
    groqClient.createChatCompletion.mockResolvedValueOnce(validJson);
    const out = await extractSyllabus('some syllabus text');
    expect(out.course).toBe('CS101');
    expect(out.items).toHaveLength(1);
  });

  it('retries once then succeeds', async () => {
    groqClient.createChatCompletion.mockResolvedValueOnce('garbage{').mockResolvedValueOnce(validJson);
    const out = await extractSyllabus('text');
    expect(groqClient.createChatCompletion).toHaveBeenCalledTimes(2);
    expect(out.items).toHaveLength(1);
  });

  it('throws when the model keeps failing', async () => {
    groqClient.createChatCompletion.mockResolvedValue('still not json');
    await expect(extractSyllabus('text')).rejects.toThrow();
  });
});

describe('weightToPriority', () => {
  it('maps weights to priority buckets', () => {
    expect(weightToPriority(40)).toBe('high');
    expect(weightToPriority(20)).toBe('medium');
    expect(weightToPriority(5)).toBe('low');
    expect(weightToPriority(null)).toBe('medium');
  });
});
