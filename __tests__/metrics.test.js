/**
 * metrics.test.js
 * Jest unit tests for the three pure metric functions:
 *   computeWeeklyTotal, computeAdherence, computeStreak
 *
 * All test data uses Date objects relative to "today" so the tests
 * remain deterministic regardless of when they run.
 */

const {
  computeWeeklyTotal,
  computeAdherence,
  computeStreak,
} = require('../src/utils/metrics');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a Date object set to noon UTC, N days before today.
 * @param {number} n - Number of days ago (0 = today).
 * @returns {Date} Date at 12:00:00.000 UTC, n days ago.
 */
const daysAgo = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(12, 0, 0, 0);
  return d;
};

/**
 * Returns a Date object at the exact start of day N days ago (00:00:00.000 UTC).
 * @param {number} n - Number of days ago.
 * @returns {Date} Date at 00:00:00.000 UTC, n days ago.
 */
const startOfDayDaysAgo = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Creates a mock activity document.
 * @param {number} daysBack - How many days ago the timestamp should be.
 * @param {string} [type='Walking'] - Activity type.
 * @returns {{ userID: string, activityType: string, timestamp: Date }}
 */
const makeActivity = (daysBack, type = 'Walking') => ({
  userID: 'test-uid-123',
  activityType: type,
  timestamp: daysAgo(daysBack),
});

/**
 * Returns the Monday 00:00:00 UTC of the current ISO week.
 * @returns {Date}
 */
const thisWeekMonday = () => {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

/**
 * Creates a mock activity guaranteed to fall within the current ISO week.
 * @param {number} daysFromMonday - 0 = Monday, 6 = Sunday of this week.
 * @param {string} [type='Walking'] - Activity type.
 * @returns {{ userID: string, activityType: string, timestamp: Date }}
 */
const makeThisWeekActivity = (daysFromMonday, type = 'Walking') => {
  const d = new Date(thisWeekMonday());
  d.setUTCDate(d.getUTCDate() + daysFromMonday);
  d.setUTCHours(12, 0, 0, 0);
  return { userID: 'test-uid-123', activityType: type, timestamp: d };
};

// ---------------------------------------------------------------------------
// computeWeeklyTotal
// ---------------------------------------------------------------------------

describe('computeWeeklyTotal', () => {
  test('returns 0 for an empty array', () => {
    expect(computeWeeklyTotal([])).toBe(0);
  });

  test('returns 0 for null input', () => {
    expect(computeWeeklyTotal(null)).toBe(0);
  });

  test('returns 0 for undefined input', () => {
    expect(computeWeeklyTotal(undefined)).toBe(0);
  });

  test('counts activities from today', () => {
    const activities = [
      makeActivity(0),
      makeActivity(0, 'Stretching'),
    ];
    expect(computeWeeklyTotal(activities)).toBe(2);
  });

  test('counts activities from earlier this week (2 days ago)', () => {
    const activities = [makeActivity(2)];
    expect(computeWeeklyTotal(activities)).toBe(1);
  });

  test('excludes activities from last week (8 days ago)', () => {
    const activities = [makeActivity(8)];
    expect(computeWeeklyTotal(activities)).toBe(0);
  });

  test('excludes activities from more than a week ago (20 days ago)', () => {
    const activities = [makeActivity(20)];
    expect(computeWeeklyTotal(activities)).toBe(0);
  });

  test('mix of this-week and last-week activities — only counts this week', () => {
    const activities = [
      makeActivity(0),
      makeActivity(1),
      makeActivity(2),
      makeActivity(8),
      makeActivity(15),
    ];
    expect(computeWeeklyTotal(activities)).toBe(3);
  });

  test('activity at midnight today (start of day) is included in this week', () => {
    const activities = [
      { userID: 'u1', activityType: 'Walking', timestamp: startOfDayDaysAgo(0) },
    ];
    expect(computeWeeklyTotal(activities)).toBe(1);
  });

  test('activity exactly at Sunday 23:59:59.999 of THIS week is included', () => {
    // Calculate this week's Sunday: (7 - getUTCDay()) days from now, or 0 if today is Sunday.
    const now = new Date();
    const day = now.getUTCDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const sundayEnd = new Date(now);
    sundayEnd.setUTCDate(now.getUTCDate() + daysUntilSunday);
    sundayEnd.setUTCHours(23, 59, 59, 999);

    const activities = [
      { userID: 'u1', activityType: 'Walking', timestamp: sundayEnd },
    ];
    expect(computeWeeklyTotal(activities)).toBe(1);
  });

  test('activity exactly at Monday 00:00:00 of NEXT week is excluded', () => {
    // Calculate next Monday's start.
    const now = new Date();
    const day = now.getUTCDay();
    const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
    const nextMondayStart = new Date(now);
    nextMondayStart.setUTCDate(now.getUTCDate() + daysUntilNextMonday);
    nextMondayStart.setUTCHours(0, 0, 0, 0);

    const activities = [
      { userID: 'u1', activityType: 'Walking', timestamp: nextMondayStart },
    ];
    expect(computeWeeklyTotal(activities)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeAdherence
// ---------------------------------------------------------------------------

describe('computeAdherence', () => {
  test('returns 0 for an empty array', () => {
    expect(computeAdherence([])).toBe(0);
  });

  test('returns 0 for null input', () => {
    expect(computeAdherence(null)).toBe(0);
  });

  test('returns 0 for undefined input', () => {
    expect(computeAdherence(undefined)).toBe(0);
  });

  test('returns correct percentage with default weeklyTarget of 7', () => {
    // 5 activities this week → (5/7) * 100 ≈ 71.43
    const activities = [
      makeThisWeekActivity(0),
      makeThisWeekActivity(1),
      makeThisWeekActivity(2),
      makeThisWeekActivity(3),
      makeThisWeekActivity(4),
    ];
    const result = computeAdherence(activities);
    expect(result).toBeCloseTo(71.42857, 2);
  });

  test('caps at 100 when total exceeds target', () => {
    // 10 activities this week with target 7 → should cap at 100
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeThisWeekActivity(i % 7)
    );
    expect(computeAdherence(activities)).toBe(100);
  });

  test('returns 0 when no activities are in the current week', () => {
    const activities = [makeActivity(8), makeActivity(15)];
    expect(computeAdherence(activities)).toBe(0);
  });

  test('uses default target of 7 when weeklyTarget is not provided', () => {
    const activities = [makeThisWeekActivity(0)];
    // (1/7) * 100 ≈ 14.29
    const result = computeAdherence(activities);
    expect(result).toBeCloseTo(14.28571, 2);
  });

  test('uses custom weeklyTarget when provided', () => {
    const activities = [makeThisWeekActivity(0)];
    // (1/5) * 100 = 20
    expect(computeAdherence(activities, 5)).toBe(20);
  });

  test('returns 100 when total exactly equals target', () => {
    const activities = [makeThisWeekActivity(0), makeThisWeekActivity(1), makeThisWeekActivity(2)];
    // (3/3) * 100 = 100
    expect(computeAdherence(activities, 3)).toBe(100);
  });

  test('returns 0 when weeklyTarget is 0 (avoid division by zero)', () => {
    const activities = [makeThisWeekActivity(0)];
    expect(computeAdherence(activities, 0)).toBe(0);
  });

  test('returns 0 when weeklyTarget is negative', () => {
    const activities = [makeThisWeekActivity(0)];
    expect(computeAdherence(activities, -3)).toBe(0);
  });

  test('handles fractional results correctly', () => {
    const activities = [makeThisWeekActivity(0), makeThisWeekActivity(1), makeThisWeekActivity(2)];
    // (3/4) * 100 = 75
    expect(computeAdherence(activities, 4)).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// computeStreak
// ---------------------------------------------------------------------------

describe('computeStreak', () => {
  test('returns 0 for an empty array', () => {
    expect(computeStreak([])).toBe(0);
  });

  test('returns 0 for null input', () => {
    expect(computeStreak(null)).toBe(0);
  });

  test('returns 0 for undefined input', () => {
    expect(computeStreak(undefined)).toBe(0);
  });

  test('returns 1 when only today has activity', () => {
    const activities = [makeActivity(0)];
    expect(computeStreak(activities)).toBe(1);
  });

  test('returns 3 for today + yesterday + day-before', () => {
    const activities = [
      makeActivity(0),
      makeActivity(1),
      makeActivity(2),
    ];
    expect(computeStreak(activities)).toBe(3);
  });

  test('returns 0 when last activity was 2+ days ago (streak broken)', () => {
    const activities = [makeActivity(2), makeActivity(3)];
    expect(computeStreak(activities)).toBe(0);
  });

  test('returns streak starting from yesterday when today has no activity', () => {
    // Today: nothing. Yesterday + day-before + day-before-that: activity.
    const activities = [
      makeActivity(1),
      makeActivity(2),
      makeActivity(3),
    ];
    expect(computeStreak(activities)).toBe(3);
  });

  test('counts streak correctly despite gap in middle', () => {
    // Today and yesterday have activity, then gap, then older activity.
    const activities = [
      makeActivity(0),
      makeActivity(1),
      makeActivity(5),
      makeActivity(6),
    ];
    expect(computeStreak(activities)).toBe(2);
  });

  test('multiple activities on the same day count as one day', () => {
    const activities = [
      makeActivity(0, 'Walking'),
      makeActivity(0, 'Stretching'),
      makeActivity(0, 'Breathing'),
      makeActivity(1),
    ];
    expect(computeStreak(activities)).toBe(2);
  });

  test('streak of 7 days', () => {
    const activities = [
      makeActivity(0),
      makeActivity(1),
      makeActivity(2),
      makeActivity(3),
      makeActivity(4),
      makeActivity(5),
      makeActivity(6),
    ];
    expect(computeStreak(activities)).toBe(7);
  });

  test('streak starts from yesterday when today is missing (6-day streak)', () => {
    // Yesterday and the 5 days before have activity. Today: nothing.
    const activities = [
      makeActivity(1),
      makeActivity(2),
      makeActivity(3),
      makeActivity(4),
      makeActivity(5),
      makeActivity(6),
    ];
    expect(computeStreak(activities)).toBe(6);
  });

  test('broken streak returns 0', () => {
    // Last activity was 3 days ago. Streak is broken.
    const activities = [makeActivity(3), makeActivity(4)];
    expect(computeStreak(activities)).toBe(0);
  });

  test('single activity yesterday gives streak of 1', () => {
    const activities = [makeActivity(1)];
    expect(computeStreak(activities)).toBe(1);
  });

  test('activities at different times on the same UTC day count once', () => {
    const today = new Date();
    const morning = new Date(today);
    morning.setUTCHours(8, 0, 0, 0);
    const evening = new Date(today);
    evening.setUTCHours(20, 0, 0, 0);

    const activities = [
      { userID: 'u1', activityType: 'Walking', timestamp: morning },
      { userID: 'u1', activityType: 'Stretching', timestamp: evening },
    ];
    expect(computeStreak(activities)).toBe(1);
  });
});
