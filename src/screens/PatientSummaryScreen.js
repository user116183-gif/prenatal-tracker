/**
 * PatientSummaryScreen.js
 * Summary tab for authenticated patient users.
 *
 * Displays three metric tiles at the top (Streak, Weekly Total, Adherence %)
 * and a scrollable list of this week's activities below them.
 *
 * Data is fetched in real time via an onSnapshot listener on the user's
 * Firestore activities sub-collection. When new activities arrive (or old
 * ones are removed) the three metrics are recomputed using the pure
 * functions from src/utils/metrics.js.
 *
 * Success Criteria Addressed: SC3 (patient summary with streak, weekly
 * total, adherence percentage)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import {
  computeWeeklyTotal,
  computeAdherence,
  computeStreak,
} from '../utils/metrics';

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
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(title + '\n' + message);
  } else {
    import('react-native').then(function (rn) {
      rn.Alert.alert(title, message);
    });
  }
};

/**
 * Returns a human-readable relative day label for a given Date.
 * "Today" if the date is the current UTC calendar day.
 * "Yesterday" if the date is one day back.
 * Otherwise returns a three-letter weekday abbreviation ("Mon", "Tue", …).
 *
 * @param {Date} date - The date to label.
 * @returns {string} Relative day string.
 */
const getRelativeDay = (date) => {
  var now = new Date();
  var todayKey = now.getUTCFullYear() + '-'
    + String(now.getUTCMonth() + 1).padStart(2, '0') + '-'
    + String(now.getUTCDate()).padStart(2, '0');

  var dateKey = date.getUTCFullYear() + '-'
    + String(date.getUTCMonth() + 1).padStart(2, '0') + '-'
    + String(date.getUTCDate()).padStart(2, '0');

  if (dateKey === todayKey) return 'Today';

  var yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);
  var yesterdayKey = yesterday.getUTCFullYear() + '-'
    + String(yesterday.getUTCMonth() + 1).padStart(2, '0') + '-'
    + String(yesterday.getUTCDate()).padStart(2, '0');

  if (dateKey === yesterdayKey) return 'Yesterday';

  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getUTCDay()];
};

/**
 * Maps an activity type string to a colour for the activity list icon.
 *
 * @param {string} activityType - One of "Walking", "Stretching", "Breathing".
 * @returns {string} Hex colour string.
 */
const getActivityColor = (activityType) => {
  switch (activityType) {
    case 'Walking': return '#007BFF';
    case 'Stretching': return '#28a745';
    case 'Breathing': return '#6f42c1';
    default: return '#888';
  }
};

/**
 * PatientSummaryScreen renders the summary tab for patients.
 * Shows three metric tiles (Streak, Weekly Total, Adherence) and a
 * scrollable list of this week's activities fetched in real time.
 *
 * @returns {JSX.Element} The patient summary screen.
 */
const PatientSummaryScreen = () => {
  /** @type {Object|null} Current authenticated user from AuthContext. */
  var auth = useAuth();
  var user = auth.user;

  /** @type {Array<Object>} All activity documents for this user. */
  var [activities, setActivities] = useState([]);

  /** @type {boolean} True while the initial Firestore fetch is loading. */
  var [loading, setLoading] = useState(true);

  /**
   * useEffect: subscribe to the user's activities sub-collection in real
   * time. Converts Firestore Timestamps to JS Dates and stores the
   * normalised array in state. Unsubscribes on unmount.
   */
  useEffect(function () {
    if (!user) return;

    if (!db) {
      console.error('PatientSummaryScreen: db is undefined.');
      setLoading(false);
      showAlert('Configuration Error', 'Firestore is not initialised.');
      return;
    }

    var activitiesRef = collection(db, 'users/' + user.uid + '/activities');
    var q = query(activitiesRef, orderBy('timestamp', 'desc'));

    var unsubscribe = onSnapshot(
      q,
      function (snapshot) {
        var docs = [];
        snapshot.forEach(function (docSnap) {
          var data = docSnap.data();
          docs.push({
            id: docSnap.id,
            userID: data.userID,
            activityType: data.activityType,
            timestamp: data.timestamp ? data.timestamp.toDate() : null,
          });
        });
        setActivities(docs);
        setLoading(false);
      },
      function (error) {
        console.error('onSnapshot error:', error.message);
        setLoading(false);
        showAlert('Error', 'Could not load activities: ' + error.message);
      }
    );

    return function () {
      unsubscribe();
    };
  }, [user]);

  /**
   * Normalises activities to the shape expected by metric functions:
   * { userID, activityType, timestamp (Date) }. Filters out any docs
   * with a null timestamp.
   *
   * @returns {Array<Object>} Normalised activity array.
   */
  var getMetricActivities = function () {
    return activities
      .filter(function (a) { return a.timestamp !== null; })
      .map(function (a) {
        return {
          userID: a.userID,
          activityType: a.activityType,
          timestamp: a.timestamp,
        };
      });
  };

  /**
   * Filters activities to those within the current ISO week.
   * Uses the same Monday–Sunday UTC range as computeWeeklyTotal.
   *
   * @returns {Array<Object>} This week's activities.
   */
  var getThisWeekActivities = function () {
    var metricActivities = getMetricActivities();

    var now = new Date();
    var day = now.getUTCDay();
    var diff = day === 0 ? -6 : 1 - day;
    var monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + diff);
    monday.setUTCHours(0, 0, 0, 0);

    var sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    return metricActivities.filter(function (a) {
      return a.timestamp >= monday && a.timestamp <= sunday;
    });
  };

  /* ---------- Compute metrics ---------- */

  var metricData = getMetricActivities();
  var streak = computeStreak(metricData);
  var weeklyTotal = computeWeeklyTotal(metricData);
  var adherence = computeAdherence(metricData);

  var thisWeekActivities = getThisWeekActivities();

  /* ---------- Render ---------- */

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Please sign in to view your summary.</Text>
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

  return (
    <View style={styles.container}>
      {/* ---- Metric Tiles ---- */}
      <View style={styles.tilesRow}>
        {/* Streak Tile */}
        <View style={[styles.tile, { borderLeftColor: '#6f42c1' }]}>
          <Text style={styles.tileValue}>{streak}</Text>
          <Text style={styles.tileLabel}>Day Streak</Text>
        </View>

        {/* Weekly Total Tile */}
        <View style={[styles.tile, { borderLeftColor: '#007BFF' }]}>
          <Text style={styles.tileValue}>{weeklyTotal}</Text>
          <Text style={styles.tileLabel}>This Week</Text>
        </View>

        {/* Adherence Tile */}
        <View style={[styles.tile, { borderLeftColor: '#28a745' }]}>
          <Text style={styles.tileValue}>{adherence.toFixed(1)}%</Text>
          <Text style={styles.tileLabel}>Adherence</Text>
        </View>
      </View>

      {/* ---- Activity List Header ---- */}
      <Text style={styles.sectionTitle}>This Week's Activities</Text>

      {/* ---- Scrollable Activity List ---- */}
      {thisWeekActivities.length === 0 ? (
        <Text style={styles.emptyText}>
          No activities logged this week. Tap Home to log one!
        </Text>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
        >
          {thisWeekActivities.map(function (activity) {
            var color = getActivityColor(activity.activityType);
            var dayLabel = getRelativeDay(activity.timestamp);
            var timeStr = activity.timestamp
              ? activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <View key={activity.id} style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: color }]} />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityType}>{activity.activityType}</Text>
                  <Text style={styles.activityTime}>{dayLabel + ' at ' + timeStr}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

/**
 * Styles for the PatientSummaryScreen component.
 */
var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  loader: {
    marginTop: 100,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    marginTop: 24,
    paddingHorizontal: 32,
  },

  /* ---- Metric Tiles ---- */
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  tileValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  tileLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },

  /* ---- Section Title ---- */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    paddingHorizontal: 16,
  },

  /* ---- Activity List ---- */
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  activityTime: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
});

export default PatientSummaryScreen;
