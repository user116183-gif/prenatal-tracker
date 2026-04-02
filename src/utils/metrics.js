/**
 * metrics.js
 * Pure metric functions for the Prenatal Activity Tracker.
 *
 * All three functions are synchronous and side-effect free — they accept
 * an array of activity documents (with plain JS Date timestamps) and
 * return a number. No Firestore calls, no async, no date libraries.
 *
 * ISO week logic is implemented manually using Date.prototype methods.
 *
 * Exported functions:
 *   computeWeeklyTotal(activities)
 *   computeAdherence(activities, weeklyTarget)
 *   computeStreak(activities)
 *
 * Success Criteria Addressed: SC4 (metric calculations)
 */

/**
 * Returns the Monday 00:00:00.000 UTC for the ISO week containing `date`.
 * ISO 8601 weeks start on Monday. When `date` falls on a Sunday (getUTCDay
 * === 0) we subtract 6 days; otherwise we subtract (getUTCDay - 1).
 *
 * @param {Date} date - Any date within the target ISO week.
 * @returns {Date} Monday 00:00:00.000 UTC of that week.
 */
const getISOWeekMonday = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns Sunday 23:59:59.999 UTC for the ISO week containing `date`.
 *
 * @param {Date} date - Any date within the target ISO week.
 * @returns {Date} Sunday 23:59:59.999 UTC of that week.
 */
const getISOWeekSunday = (date) => {
  const monday = getISOWeekMonday(date);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
};

/**
 * Computes the number of activities that fall within the current ISO week.
 *
 * The current ISO week is defined as Monday 00:00:00 UTC through
 * Sunday 23:59:59.999 UTC of the week that contains the current moment.
 * Activities are compared against this range using their `timestamp` field.
 *
 * @param {Array<Object>} activities - Array of activity documents from Firestore.
 *   Each object must have a `timestamp` property that is a JS Date object.
 * @returns {number} The count of activities within the current ISO week.
 *   Returns 0 if the array is empty or null.
 *
 * @example
 * // Today is Wednesday. Two activities this week, one last week.
 * const total = computeWeeklyTotal([
 *   { timestamp: new Date(), activityType: 'Walking', userID: 'u1' },
 *   { timestamp: twoDaysAgo, activityType: 'Stretching', userID: 'u1' },
 *   { timestamp: tenDaysAgo, activityType: 'Breathing', userID: 'u1' },
 * ]);
 * // total === 2
 */
const computeWeeklyTotal = (activities) => {
  if (!activities || activities.length === 0) return 0;

  const now = new Date();
  const weekStart = getISOWeekMonday(now);
  const weekEnd = getISOWeekSunday(now);

  let count = 0;
  for (const activity of activities) {
    const ts = new Date(activity.timestamp);
    if (ts >= weekStart && ts <= weekEnd) {
      count++;
    }
  }
  return count;
};

/**
 * Computes the adherence percentage for the current ISO week.
 *
 * Adherence is calculated as: (weeklyTotal / weeklyTarget) * 100
 * The result is capped at 100 — exceeding the target does not produce
 * a percentage greater than 100.
 *
 * @param {Array<Object>} activities - Array of activity documents from Firestore.
 *   Each object must have a `timestamp` property that is a JS Date object.
 * @param {number} [weeklyTarget=7] - The target number of activities for the week.
 *   Defaults to 7 if not provided. If 0 or negative, returns 0 immediately.
 * @returns {number} The adherence percentage (0 – 100).
 *   Returns 0 if the array is empty, null, or weeklyTarget is not positive.
 *
 * @example
 * // 5 out of 7 activities completed this week.
 * const adherence = computeAdherence(activities);
 * // adherence === 71.42857142857143
 *
 * @example
 * // Custom target of 10.
 * const adherence = computeAdherence(activities, 10);
 */
const computeAdherence = (activities, weeklyTarget) => {
  if (!activities || activities.length === 0) return 0;

  // Guard against non-positive targets to avoid division by zero or negative results.
  if (typeof weeklyTarget === 'number' && weeklyTarget <= 0) return 0;

  const target = (typeof weeklyTarget === 'number' && weeklyTarget > 0)
    ? weeklyTarget
    : 7;

  const weeklyTotal = computeWeeklyTotal(activities);
  const percentage = (weeklyTotal / target) * 100;
  return Math.min(percentage, 100);
};

/**
 * Computes the current activity streak in consecutive days.
 *
 * The algorithm works as follows:
 * 1. Extracts unique UTC calendar dates (YYYY-MM-DD) from all activities.
 * 2. Sorts them in descending order (most recent first).
 * 3. Determines the starting point:
 *    - If today has at least one activity, start counting from today.
 *    - If today has no activity but yesterday does, start from yesterday.
 *    - Otherwise the streak is 0 (broken).
 * 4. Counts consecutive days backward from the start point.
 *
 * @param {Array<Object>} activities - Array of activity documents from Firestore.
 *   Each object must have a `timestamp` property that is a JS Date object.
 * @returns {number} The number of consecutive days with at least one activity.
 *   Returns 0 if the array is empty, null, or the streak is broken.
 *
 * @example
 * // User logged today and the two previous days.
 * const streak = computeStreak(activities);
 * // streak === 3
 *
 * @example
 * // User didn't log today but logged yesterday and the day before.
 * const streak = computeStreak(activities);
 * // streak === 2
 */
const computeStreak = (activities) => {
  if (!activities || activities.length === 0) return 0;

  /**
   * Formats a Date as a YYYY-MM-DD string in UTC.
   * @param {Date} date - The date to format.
   * @returns {string} ISO date string (e.g. "2026-04-02").
   */
  const toUTCKey = (date) => {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  // Collect unique UTC dates from all activities.
  const dateSet = new Set();
  for (const activity of activities) {
    dateSet.add(toUTCKey(activity.timestamp));
  }
  const uniqueDates = [...dateSet].sort().reverse();

  // Determine "today" and "yesterday" keys.
  const today = new Date();
  const todayKey = toUTCKey(today);

  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const yesterdayKey = toUTCKey(yesterday);

  // Check if the streak is alive (most recent activity is today or yesterday).
  const mostRecent = uniqueDates[0];
  let startDate;

  if (mostRecent === todayKey) {
    startDate = new Date(today);
  } else if (mostRecent === yesterdayKey) {
    startDate = new Date(yesterday);
  } else {
    return 0;
  }

  // Count consecutive days backward from startDate.
  let streak = 0;
  for (const dateKey of uniqueDates) {
    const expectedKey = toUTCKey(startDate);
    if (dateKey === expectedKey) {
      streak++;
      startDate.setUTCDate(startDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export { computeWeeklyTotal, computeAdherence, computeStreak };
