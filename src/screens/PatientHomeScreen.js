/**
 * PatientHomeScreen.js
 * Home tab for authenticated patient users.
 *
 * Displays three activity types as a daily checklist: Walking, Stretching,
 * and Breathing. Each item shows a checkbox indicator — already completed
 * activities appear greyed out with a checkmark and cannot be tapped again.
 * Uncompleted items are tappable and log the activity to Firestore on tap.
 *
 * On mount, the screen queries the user's activities for today (UTC) to
 * determine which types have already been logged. After a successful log,
 * the local state is updated immediately without re-querying.
 *
 * When the device is offline, the activity is saved to an AsyncStorage
 * queue and synced to Firestore when connectivity is restored.
 *
 * Success Criteria Addressed: SC2 (activity logging with persistence)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../../firebase';
import { addToOfflineQueue, flushOfflineQueue } from '../utils/offlineQueue';

/**
 * Activity configuration for the three supported activity types.
 * Each entry defines the key, label, color, and Firestore value.
 * @type {Array<{key: string, label: string, color: string, type: string}>}
 */
var ACTIVITIES = [
  { key: 'walking', label: 'Walking', color: '#007BFF', type: 'Walking' },
  { key: 'stretching', label: 'Stretching', color: '#28a745', type: 'Stretching' },
  { key: 'breathing', label: 'Breathing', color: '#6f42c1', type: 'Breathing' },
];

/**
 * Cross-platform alert helper.
 * React Native Web's Alert.alert polyfill is unreliable — it often
 * silently does nothing. This helper falls back to window.alert on
 * web so the user always gets feedback.
 *
 * @param {string} title - Alert title.
 * @param {string} message - Alert body text.
 * @returns {void}
 */
var showAlert = function (title, message) {
  if (Platform.OS === 'web') {
    window.alert(title + '\n' + message);
  } else {
    import('react-native').then(function (rn) {
      rn.Alert.alert(title, message);
    });
  }
};

/**
 * Formats a Date as a YYYY-MM-DD string in UTC.
 *
 * @param {Date} date - The date to format.
 * @returns {string} ISO date string (e.g. "2026-04-03").
 */
var toUTCDateKey = function (date) {
  return date.getUTCFullYear() + '-'
    + String(date.getUTCMonth() + 1).padStart(2, '0') + '-'
    + String(date.getUTCDate()).padStart(2, '0');
};

/**
 * Returns the start (00:00:00.000 UTC) and end (23:59:59.999 UTC) of
 * today in UTC.
 *
 * @returns {{ start: Date, end: Date }} Today's UTC boundaries.
 */
var getTodayRangeUTC = function () {
  var now = new Date();
  var start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  var end = new Date(now);
  end.setUTCHours(23, 59, 59, 999);
  return { start: start, end: end };
};

/**
 * PatientHomeScreen renders a daily checklist of three activity types.
 * Already completed types are greyed out; uncompleted types are tappable
 * and log the activity to Firestore when pressed.
 *
 * @returns {JSX.Element} The patient home screen.
 */
var PatientHomeScreen = function () {
  /** @type {Object|null} Current authenticated user from AuthContext. */
  var auth = useAuth();
  var user = auth.user;

  /** @type {boolean} True while an activity is being logged. */
  var _useState1 = useState(false);
  var logging = _useState1[0];
  var setLogging = _useState1[1];

  /**
   * @type {Set<string>} Set of activity types already logged today.
   * Starts empty, populated by the mount query, and updated after each log.
   */
  var _useState2 = useState(new Set());
  var completedToday = _useState2[0];
  var setCompletedToday = _useState2[1];

  /**
   * @type {boolean} True while today's activities are being loaded.
   */
  var _useState3 = useState(true);
  var loading = _useState3[0];
  var setLoading = _useState3[1];

  /**
   * useEffect: on mount (and when user changes), flush the offline queue
   * and fetch today's completed activities to initialise the checklist.
   */
  useEffect(function () {
    if (!user) return;

    if (!db) {
      console.error('PatientHomeScreen: db is undefined.');
      setLoading(false);
      return;
    }

    // Flush any pending offline activities first.
    flushOfflineQueue().catch(function (err) {
      console.warn('flushOfflineQueue failed on mount:', err.message);
    });

    /**
     * Queries Firestore for activities logged today (UTC) and builds a
     * Set of completed activity types to initialise the checklist state.
     *
     * @returns {Promise<void>}
     */
    var loadTodayActivities = async function () {
      try {
        var todayRange = getTodayRangeUTC();
        var activitiesRef = collection(db, 'users/' + user.uid + '/activities');
        var q = query(activitiesRef, where('timestamp', '>=', todayRange.start));
        var snapshot = await getDocs(q);

        var completed = new Set();
        snapshot.forEach(function (docSnap) {
          var data = docSnap.data();
          if (data.activityType) {
            completed.add(data.activityType);
          }
        });
        setCompletedToday(completed);
      } catch (error) {
        console.error('Error loading today activities:', error.message);
      } finally {
        setLoading(false);
      }
    };

    loadTodayActivities();
  }, [user]);

  /**
   * Logs an activity to Firestore. If the write fails (e.g. offline),
   * the activity is saved to the offline queue in AsyncStorage instead.
   * On success, updates the local completedToday state immediately.
   *
   * @param {string} activityType - One of "Walking", "Stretching", "Breathing".
   * @returns {Promise<void>}
   */
  var handleLogActivity = useCallback(async function (activityType) {
    if (!user) {
      console.warn('handleLogActivity: user is null — aborting.');
      return;
    }

    if (!db) {
      console.error('handleLogActivity: db is undefined.');
      showAlert('Configuration Error', 'Firestore is not initialised.');
      return;
    }

    setLogging(true);

    try {
      var collectionRef = collection(db, 'users/' + user.uid + '/activities');
      await addDoc(collectionRef, {
        userID: user.uid,
        activityType: activityType,
        timestamp: serverTimestamp(),
      });

      // Update local state immediately — no need to re-query.
      setCompletedToday(function (prev) {
        var next = new Set(prev);
        next.add(activityType);
        return next;
      });

      showAlert('Logged!', activityType + ' activity recorded.');
    } catch (error) {
      console.warn('Firestore write failed, queuing offline:', error.message);
      try {
        await addToOfflineQueue({
          userID: user.uid,
          activityType: activityType,
        });

        // Still update local state for offline logging.
        setCompletedToday(function (prev) {
          var next = new Set(prev);
          next.add(activityType);
          return next;
        });

        showAlert('Saved offline', activityType + ' will sync when you reconnect.');
      } catch (queueError) {
        console.error('Offline queue write also failed:', queueError.message);
        showAlert('Error', 'Could not log activity: ' + error.message);
      }
    } finally {
      setLogging(false);
    }
  }, [user]);

  /* ---------- Render ---------- */

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Please sign in to log activities.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      </View>
    );
  }

  var completedCount = completedToday.size;
  var allDone = completedCount === 3;

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome!</Text>
      <Text style={styles.instruction}>Daily Activity Checklist</Text>

      {/* ---- Motivational message when all done ---- */}
      {allDone ? (
        <View style={styles.allDoneBanner}>
          <Text style={styles.allDoneText}>
            {'3/3 activities completed today!'}
          </Text>
        </View>
      ) : (
        <Text style={styles.progressText}>
          {completedCount + '/3 activities completed today'}
        </Text>
      )}

      {/* ---- Checklist items ---- */}
      {logging ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : (
        ACTIVITIES.map(function (activity) {
          var isCompleted = completedToday.has(activity.type);

          return (
            <TouchableOpacity
              key={activity.key}
              style={[
                styles.checklistItem,
                isCompleted && styles.checklistItemDone,
                !isCompleted && { borderLeftColor: activity.color },
              ]}
              onPress={isCompleted ? null : function () { handleLogActivity(activity.type); }}
              activeOpacity={isCompleted ? 1 : 0.7}
              accessibilityLabel={isCompleted
                ? activity.label + ' already completed'
                : 'Log ' + activity.label + ' activity'}
              accessibilityRole={isCompleted ? 'text' : 'button'}
            >
              {/* Checkbox circle */}
              <View style={[
                styles.checkbox,
                isCompleted ? styles.checkboxDone : { borderColor: activity.color },
              ]}>
                {isCompleted ? (
                  <Text style={styles.checkmark}>{'\u2713'}</Text>
                ) : null}
              </View>

              {/* Activity label */}
              <Text style={[
                styles.checklistLabel,
                isCompleted && styles.checklistLabelDone,
              ]}>
                {activity.label}
              </Text>

              {/* Status indicator */}
              <Text style={styles.statusLabel}>
                {isCompleted ? 'Done' : 'Tap to log'}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

/**
 * Styles for the PatientHomeScreen component.
 */
var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    marginTop: 24,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 15,
    color: '#888',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
    marginBottom: 20,
  },
  allDoneBanner: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  allDoneText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
  },
  checklistItemDone: {
    backgroundColor: '#f0f0f0',
    borderLeftColor: '#ccc',
    opacity: 0.7,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxDone: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checklistLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  checklistLabelDone: {
    color: '#999',
  },
  statusLabel: {
    fontSize: 13,
    color: '#aaa',
  },
});

export default PatientHomeScreen;
