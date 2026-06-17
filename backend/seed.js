/**
 * Seed the database with a demo account and sample data so the app looks
 * populated the moment you open it. Run with: `npm run seed`.
 *
 * The seeding logic is exported as `seedDatabase()` (assumes an active mongoose
 * connection) so it can be unit-tested; the bottom block wires up the
 * connection when this file is run directly.
 */
require('dotenv').config();

const { connectDB, disconnectDB } = require('./src/config/db');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const StudySession = require('./src/models/StudySession');
const StudyPlan = require('./src/models/StudyPlan');
const CalendarEvent = require('./src/models/CalendarEvent');

const DEMO = { name: 'Demo Student', email: 'demo@studysync.app', password: 'demo1234' };

const dayMs = 24 * 60 * 60 * 1000;
const shift = (n) => new Date(Date.now() + n * dayMs);
const iso = (d) => d.toISOString().slice(0, 10);

async function seedDatabase() {
  // 1. Demo user (idempotent — reuse if it already exists).
  let user = await User.findOne({ email: DEMO.email });
  if (!user) {
    const passwordHash = await User.hashPassword(DEMO.password);
    user = await User.create({ name: DEMO.name, email: DEMO.email, passwordHash });
  }
  const userId = user.id;

  // 2. Wipe the demo user's previous data so re-seeding is clean.
  await Promise.all([
    Subject.deleteMany({ userId }),
    StudySession.deleteMany({ userId }),
    StudyPlan.deleteMany({ userId }),
    CalendarEvent.deleteMany({ userId }),
  ]);

  // 3. Subjects.
  const subjects = await Subject.create([
    { userId, name: 'Calculus II', deadline: shift(10), priority: 'high' },
    { userId, name: 'Organic Chemistry', deadline: shift(18), priority: 'medium' },
    { userId, name: 'Statistics', deadline: shift(6), priority: 'high' },
    { userId, name: 'Spanish', deadline: shift(25), priority: 'low' },
  ]);
  const byName = Object.fromEntries(subjects.map((s) => [s.name, s]));

  // 4. Study sessions — a 6-day streak plus a few more across two weeks.
  const sessionPlan = [
    [0, 'Calculus II', 45], [0, 'Statistics', 30],
    [-1, 'Organic Chemistry', 60], [-2, 'Calculus II', 50],
    [-3, 'Spanish', 20], [-4, 'Statistics', 40], [-5, 'Calculus II', 35],
    [-8, 'Organic Chemistry', 55], [-11, 'Spanish', 25], [-13, 'Statistics', 45],
  ];
  await StudySession.create(
    sessionPlan.map(([d, name, mins]) => ({
      userId,
      subjectId: byName[name]._id,
      date: shift(d),
      durationMinutes: mins,
      completed: true,
    }))
  );

  // 5. A current AI-style study plan for the next 5 days.
  const planDays = Array.from({ length: 5 }, (_, i) => ({
    date: iso(shift(i)),
    blocks: [
      { subject: 'Calculus II', hours: 1.5 },
      { subject: 'Statistics', hours: 1 },
      ...(i % 2 === 0 ? [{ subject: 'Organic Chemistry', hours: 0.5 }] : [{ subject: 'Spanish', hours: 0.5 }]),
    ],
  }));
  await StudyPlan.create({
    userId,
    subjects: subjects.map((s) => ({ name: s.name, deadline: s.deadline, priority: s.priority })),
    dailyHours: 3,
    generatedSchedule: { days: planDays },
    source: 'groq',
  });

  // 6. Calendar events (exams / assignments with weights).
  await CalendarEvent.create([
    { userId, title: 'Calculus II: Midterm', type: 'exam', date: shift(10), weightPercent: 30 },
    { userId, title: 'Statistics: Final', type: 'exam', date: shift(6), weightPercent: 40 },
    { userId, title: 'Organic Chemistry: Problem Set 4', type: 'assignment', date: shift(5), weightPercent: 10 },
    { userId, title: 'Spanish: Essay draft', type: 'deadline', date: shift(12), weightPercent: 15 },
  ]);

  return {
    user: DEMO.email,
    subjects: subjects.length,
    sessions: sessionPlan.length,
    plans: 1,
    events: 4,
  };
}

async function run() {
  await connectDB();
  const summary = await seedDatabase();
  console.log('[seed] Done:', summary);
  console.log(`[seed] Demo login → ${DEMO.email} / ${DEMO.password}`);
  await disconnectDB();
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] Failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, DEMO };
