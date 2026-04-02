/**
 * PatientHomeScreen.js
 * Home tab for authenticated patient users.
 * Displays three large activity buttons: Walking, Stretching, and Breathing.
 * Tapping a button logs that activity to Firestore under
 * users/{uid}/activities with a server timestamp.
 *
 * When the device is offline, the activity is saved to an AsyncStorage
 * queue and synced to Firestore when connectivity is restored.
 * The UI never blocks — logging feels instant regardless of connectivity.
 *
 * Success Criteria Addressed: SC2 (activity logging with persistence)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../../firebase';
import { addToOfflineQueue, flushOfflineQueue } from '../utils/offlineQueue';

/**
 * Activity configuration for the three supported activity types.
 * Each entry defines the label, background color, and Firestore value.
 * @type {Array<{key: string, label: string, color: string, type: string}>}
 */
const ACTIVITIES = [
  { key: 'walking', label: 'Walking', color: '#007BFF', type: 'Walking' },
  { key: 'stretching', label: 'Stretching', color: '#28a745', type: 'Stretching' },
  { key: 'breathing', label: 'Breathing', color: '#6f42c1', type: 'Breathing' },
];

/**
 * PatientHomeScreen renders three large activity buttons.
 * Tapping a button logs that activity to Firestore (or the offline
 * queue if the device is not connected).
 * @returns {JSX.Element} The patient home screen.
 */
const PatientHomeScreen = () => {
  /** @type {Object|null} Current authenticated user from AuthContext. */
  const { user } = useAuth();

  /** @type {boolean} True while an activity is being logged. */
  const [logging, setLogging] = useState(false);

  /**
   * On mount (and whenever the user changes), attempt to flush any
   * pending offline activities from the AsyncStorage queue.
   * This ensures activities logged while offline are synced as soon
   * as the app regains connectivity.
   */
  useEffect(() => {
    if (user) {
      flushOfflineQueue();
    }
  }, [user]);

  /**
   * Logs an activity to Firestore. If the write fails (e.g. offline),
   * the activity is saved to the offline queue in AsyncStorage instead.
   * A brief success alert confirms the action to the user.
   *
   * @param {string} activityType - One of "Walking", "Stretching", "Breathing".
   * @returns {Promise<void>}
   */
  const handleLogActivity = useCallback(async (activityType) => {
    if (!user) return;
    setLogging(true);

    try {
      await addDoc(collection(db, `users/${user.uid}/activities`), {
        userID: user.uid,
        activityType: activityType,
        timestamp: serverTimestamp(),
      });
      Alert.alert('Logged!', `${activityType} activity recorded.`);
    } catch (error) {
      // Firestore write failed — queue the activity offline.
      console.warn('Firestore write failed, queuing offline:', error.message);
      await addToOfflineQueue({
        userID: user.uid,
        activityType: activityType,
      });
      Alert.alert('Saved offline', `${activityType} will sync when you reconnect.`);
    } finally {
      setLogging(false);
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome!</Text>
      <Text style={styles.instruction}>Log your activity for today:</Text>

      {logging ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : (
        ACTIVITIES.map((activity) => (
          <TouchableOpacity
            key={activity.key}
            style={[styles.button, { backgroundColor: activity.color }]}
            onPress={() => handleLogActivity(activity.type)}
            activeOpacity={0.7}
            accessibilityLabel={`Log ${activity.label} activity`}
            accessibilityRole="button"
          >
            <Text style={styles.buttonLabel}>{activity.label}</Text>
          </TouchableOpacity>
        ))}
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 15,
    color: '#888',
    marginBottom: 40,
  },
  button: {
    width: '100%',
    paddingVertical: 28,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loader: {
    marginBottom: 20,
  },
});

export default PatientHomeScreen;
