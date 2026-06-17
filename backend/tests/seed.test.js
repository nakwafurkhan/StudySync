const db = require('./helpers/db');
const { seedDatabase, DEMO } = require('../seed');
const User = require('../src/models/User');
const Subject = require('../src/models/Subject');
const StudySession = require('../src/models/StudySession');
const StudyPlan = require('../src/models/StudyPlan');
const CalendarEvent = require('../src/models/CalendarEvent');

beforeAll(async () => db.connect());
afterEach(async () => db.clear());
afterAll(async () => db.close());

describe('seedDatabase', () => {
  it('creates a usable demo account with sample data', async () => {
    const summary = await seedDatabase();
    expect(summary.user).toBe(DEMO.email);

    const user = await User.findOne({ email: DEMO.email }).select('+passwordHash');
    expect(user).toBeTruthy();
    expect(await user.comparePassword(DEMO.password)).toBe(true);

    expect(await Subject.countDocuments({ userId: user.id })).toBe(4);
    expect(await StudySession.countDocuments({ userId: user.id })).toBeGreaterThan(5);
    expect(await StudyPlan.countDocuments({ userId: user.id })).toBe(1);
    expect(await CalendarEvent.countDocuments({ userId: user.id })).toBe(4);
  });

  it('is idempotent — re-seeding does not duplicate the user or pile up data', async () => {
    await seedDatabase();
    await seedDatabase();
    expect(await User.countDocuments({ email: DEMO.email })).toBe(1);
    const user = await User.findOne({ email: DEMO.email });
    expect(await Subject.countDocuments({ userId: user.id })).toBe(4);
  });
});
