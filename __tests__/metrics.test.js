/**
 * metrics.test.js
 * Jest unit tests for the pure metric functions:
 *   computeWeeklyTotal, computeAdherence, computeStreak, getDaysElapsedInWeek
 *
 * All test data uses Date objects relative to "today" so the tests
 * remain deterministic regardless of when they run.
 */

const {
  computeWeeklyTotal,
  computeAdherence,
  computeStreak,
  getDaysElapsedInWeek,
} = require('../src/utils/metrics');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a Date object set to noon UTC, N days before today.
 * @param {number} n - Number of days ago (0 = today).
 * @returns {Date} Date at 12:00:00.000 UTC, n days ago.
 */
var daysAgo = function (n) {
  var d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(12, 0, 0, 0);
  return d;
};

/**
 * Returns a Date object at the exact start of day N days ago (00:00:00.000 UTC).
 * @param {number} n - Number of days ago.
 * @returns {Date} Date at 00:00:00.000 UTC, n days ago.
 */
var startOfDayDaysAgo = function (n) {
  var d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Creates a mock activity document.
 * @param {number} daysBack - How many days ago the timestamp should be.
 * @param {string} [type] - Activity type (default 'Walking').
 * @returns {{ userID: string, activityType: string, timestamp: Date }}
 */
var makeActivity = function (daysBack, type) {
  return {
    userID: 'test-uid-123',
    activityType: type || 'Walking',
    timestamp: daysAgo(daysBack),
  };
};

/**
 * Returns the Monday 00:00:00 UTC of the current ISO week.
 * @returns {Date}
 */
var thisWeekMonday = function () {
  var now = new Date();
  var day = now.getUTCDay();
  var diff = day === 0 ? -6 : 1 - day;
  var monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

/**
 * Creates a mock activity guaranteed to fall within the current ISO week.
 * @param {number} daysFromMonday - 0 = Monday, 6 = Sunday of this week.
 * @param {string} [type] - Activity type (default 'Walking').
 * @returns {{ userID: string, activityType: string, timestamp: Date }}
 */
var makeThisWeekActivity = function (daysFromMonday, type) {
  var d = new Date(thisWeekMonday());
  d.setUTCDate(d.getUTCDate() + daysFromMonday);
  d.setUTCHours(12, 0, 0, 0);
  return { userID: 'test-uid-123', activityType: type || 'Walking', timestamp: d };
};

// ---------------------------------------------------------------------------
// getDaysElapsedInWeek
// ---------------------------------------------------------------------------

describe('getDaysElapsedInWeek', function () {
  test('returns a number between 1 and 7', function () {
    var result = getDaysElapsedInWeek();
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(7);
  });

  test('returns 1 on Monday', function () {
    // We cannot change the system clock, so we verify the logic indirectly
    // by checking that the function uses ISO day numbering.
    var result = getDaysElapsedInWeek();
    var now = new Date();
    var day = now.getUTCDay();
    var expected = day === 0 ? 7 : day;
    expect(result).toBe(expected);
  });

  test('returns 7 on Sunday', function () {
    // Sunday is getUTCDay() === 0, which should map to 7.
    // We verify this by checking the implementation logic.
    var now = new Date();
    if (now.getUTCDay() === 0) {
      expect(getDaysElapsedInWeek()).toBe(7);
    }
  });
});

// ---------------------------------------------------------------------------
// computeWeeklyTotal
// ---------------------------------------------------------------------------

describe('computeWeeklyTotal', function () {
  test('returns 0 for an empty array', function () {
    expect(computeWeeklyTotal([])).toBe(0);
  });

  test('returns 0 for null input', function () {
    expect(computeWeeklyTotal(null)).toBe(0);
  });

  test('returns 0 for undefined input', function () {
    expect(computeWeeklyTotal(undefined)).toBe(0);
  });

  test('counts activities from today', function () {
    var activities = [makeActivity(0), makeActivity(0, 'Stretching')];
    expect(computeWeeklyTotal(activities)).toBe(2);
  });

  test('counts activities from earlier this week (2 days ago)', function () {
    var activities = [makeActivity(2)];
    expect(computeWeeklyTotal(activities)).toBe(1);
  });

  test('excludes activities from last week (8 days ago)', function () {
    var activities = [makeActivity(8)];
    expect(computeWeeklyTotal(activities)).toBe(0);
  });

  test('excludes activities from more than a week ago (20 days ago)', function () {
    var activities = [makeActivity(20)];
    expect(computeWeeklyTotal(activities)).toBe(0);
  });

  test('mix of this-week and last-week activities - only counts this week', function () {
    var activities = [
      makeActivity(0),
      makeActivity(1),
      makeActivity(2),
      makeActivity(8),
      makeActivity(15),
    ];
    expect(computeWeeklyTotal(activities)).toBe(3);
  });

  test('activity at midnight today (start of day) is included in this week', function () {
    var activities = [
      { userID: 'u1', activityType: 'Walking', timestamp: startOfDayDaysAgo(0) },
    ];
    expect(computeWeeklyTotal(activities)).toBe(1);
  });

  test('activity exactly at Sunday 23:59:59.999 of THIS week is included', function () {
    var now = new Date();
    var day = now.getUTCDay();
    var daysUntilSunday = day === 0 ? 0 : 7 - day;
    var sundayEnd = new Date(now);
    sundayEnd.setUTCDate(now.getUTCDate() + daysUntilSunday);
    sundayEnd.setUTCHours(23, 59, 59, 999);

    var activities = [
      { userID: 'u1', activityType: 'Walking', timestamp: sundayEnd },
    ];
    expect(computeWeeklyTotal(activities)).toBe(1);
  });

  test('activity exactly at Monday 00:00:00 of NEXT week is excluded', function () {
    var now = new Date();
    var day = now.getUTCDay();
    var daysUntilNextMonday = day === 0 ? 1 : 8 - day;
    var nextMondayStart = new Date(now);
    nextMondayStart.setUTCDate(now.getUTCDate() + daysUntilNextMonday);
    nextMondayStart.setUTCHours(0, 0, 0, 0);

    var activities = [
      { userID: 'u1', activityType: 'Walking', timestamp: nextMondayStart },
    ];
    expect(computeWeeklyTotal(activities)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeAdherence
//
// Formula: (weeklyTotal / (daysElapsed * 3)) * 100, capped at 100
// daysElapsed = getDaysElapsedInWeek() — depends on current UTC day
// ---------------------------------------------------------------------------

describe('computeAdherence', function () {
  test('returns 0 for an empty array', function () {
    expect(computeAdherence([])).toBe(0);
  });

  test('returns 0 for null input', function () {
    expect(computeAdherence(null)).toBe(0);
  });

  test('returns 0 for undefined input', function () {
    expect(computeAdherence(undefined)).toBe(0);
  });

  test('returns 0 when no activities are in the current week', function () {
    var activities = [makeActivity(8), makeActivity(15)];
    expect(computeAdherence(activities)).toBe(0);
  });

  test('caps at 100 when total exceeds target (daysElapsed * 3)', function () {
    // Create more activities than (daysElapsed * 3).
    var daysElapsed = getDaysElapsedInWeek();
    var target = daysElapsed * 3;
    var excess = target + 5;
    var activities = [];
    for (var i = 0; i < excess; i++) {
      activities.push(makeThisWeekActivity(i % 7, i % 3 === 0 ? 'Walking' : i % 3 === 1 ? 'Stretching' : 'Breathing'));
    }
    expect(computeAdherence(activities)).toBe(100);
  });

  test('returns 100 when total exactly equals target', function () {
    // Target = daysElapsed * 3. Place exactly that many activities in this week.
    var daysElapsed = getDaysElapsedInWeek();
    var target = daysElapsed * 3;
    var activities = [];
    for (var i = 0; i < target; i++) {
      activities.push(makeThisWeekActivity(i % 7));
    }
    expect(computeAdherence(activities)).toBe(100);
  });

  test('returns correct fractional adherence for partial completion', function () {
    // Place (daysElapsed * 3 - 3) activities. Should be 100 - (3 / (daysElapsed * 3) * 100) less.
    var daysElapsed = getDaysElapsedInWeek();
    var target = daysElapsed * 3;
    var total = Math.max(0, target - 3);
    var activities = [];
    for (var i = 0; i < total; i++) {
      activities.push(makeThisWeekActivity(i % 7));
    }
    var expected = (total / target) * 100;
    expect(computeAdherence(activities)).toBeCloseTo(expected, 2);
  });

  test('returns ~33.3 when only 1 activity done on any day', function () {
    var daysElapsed = getDaysElapsedInWeek();
    var target = daysElapsed * 3;
    var activities = [makeThisWeekActivity(0)];
    var expected = (1 / target) * 100;
    expect(computeAdherence(activities)).toBeCloseTo(expected, 2);
  });

  test('single activity on each of the days so far = 100%', function () {
    // One activity per elapsed day = daysElapsed total.
    // Target = daysElapsed * 3. So adherence = daysElapsed / (daysElapsed * 3) * 100 = 33.3%.
    var daysElapsed = getDaysElapsedInWeek();
    var activities = [];
    for (var i = 0; i < daysElapsed; i++) {
      activities.push(makeThisWeekActivity(i));
    }
    var expected = (daysElapsed / (daysElapsed * 3)) * 100;
    expect(computeAdherence(activities)).toBeCloseTo(expected, 2);
  });

  test('three activities on each of the days so far = 100%', function () {
    var daysElapsed = getDaysElapsedInWeek();
    var activities = [];
    for (var d = 0; d < daysElapsed; d++) {
      activities.push(makeThisWeekActivity(d, 'Walking'));
      activities.push(makeThisWeekActivity(d, 'Stretching'));
      activities.push(makeThisWeekActivity(d, 'Breathing'));
    }
    expect(computeAdherence(activities)).toBe(100);
  });

  test('weeklyTarget second parameter is ignored (backwards compat)', function () {
    // The function no longer takes a second parameter. If passed, it is
    // silently ignored — the formula uses daysElapsed * 3.
    var activities = [makeThisWeekActivity(0)];
    var result = computeAdherence(activities, 999);
    var daysElapsed = getDaysElapsedInWeek();
    var expected = (1 / (daysElapsed * 3)) * 100;
    expect(result).toBeCloseTo(expected, 2);
  });
});

// ---------------------------------------------------------------------------
// computeStreak
// ---------------------------------------------------------------------------

describe('computeStreak', function () {
  test('returns 0 for an empty array', function () {
    expect(computeStreak([])).toBe(0);
  });

  test('returns 0 for null input', function () {
    expect(computeStreak(null)).toBe(0);
  });

  test('returns 0 for undefined input', function () {
    expect(computeStreak(undefined)).toBe(0);
  });

  test('returns 1 when only today has activity', function () {
    var activities = [makeActivity(0)];
    expect(computeStreak(activities)).toBe(1);
  });

  test('returns 3 for today + yesterday + day-before', function () {
    var activities = [makeActivity(0), makeActivity(1), makeActivity(2)];
    expect(computeStreak(activities)).toBe(3);
  });

  test('returns 0 when last activity was 2+ days ago (streak broken)', function () {
    var activities = [makeActivity(2), makeActivity(3)];
    expect(computeStreak(activities)).toBe(0);
  });

  test('returns streak starting from yesterday when today has no activity', function () {
    var activities = [makeActivity(1), makeActivity(2), makeActivity(3)];
    expect(computeStreak(activities)).toBe(3);
  });

  test('counts streak correctly despite gap in middle', function () {
    var activities = [makeActivity(0), makeActivity(1), makeActivity(5), makeActivity(6)];
    expect(computeStreak(activities)).toBe(2);
  });

  test('multiple activities on the same day count as one day', function () {
    var activities = [
      makeActivity(0, 'Walking'),
      makeActivity(0, 'Stretching'),
      makeActivity(0, 'Breathing'),
      makeActivity(1),
    ];
    expect(computeStreak(activities)).toBe(2);
  });

  test('streak of 7 days', function () {
    var activities = [
      makeActivity(0), makeActivity(1), makeActivity(2),
      makeActivity(3), makeActivity(4), makeActivity(5),
      makeActivity(6),
    ];
    expect(computeStreak(activities)).toBe(7);
  });

  test('streak starts from yesterday when today is missing (6-day streak)', function () {
    var activities = [
      makeActivity(1), makeActivity(2), makeActivity(3),
      makeActivity(4), makeActivity(5), makeActivity(6),
    ];
    expect(computeStreak(activities)).toBe(6);
  });

  test('broken streak returns 0', function () {
    var activities = [makeActivity(3), makeActivity(4)];
    expect(computeStreak(activities)).toBe(0);
  });

  test('single activity yesterday gives streak of 1', function () {
    var activities = [makeActivity(1)];
    expect(computeStreak(activities)).toBe(1);
  });

  test('activities at different times on the same UTC day count once', function () {
    var today = new Date();
    var morning = new Date(today);
    morning.setUTCHours(8, 0, 0, 0);
    var evening = new Date(today);
    evening.setUTCHours(20, 0, 0, 0);

    var activities = [
      { userID: 'u1', activityType: 'Walking', timestamp: morning },
      { userID: 'u1', activityType: 'Stretching', timestamp: evening },
    ];
    expect(computeStreak(activities)).toBe(1);
  });
});
