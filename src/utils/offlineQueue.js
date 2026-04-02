/**
 * offlineQueue.js
 * Manages offline activity logging using AsyncStorage.
 * When the device is offline, activities are queued locally.
 * On reconnect, the queue is flushed to Firestore and cleared.
 *
 * AsyncStorage key: "offlineQueue"
 * Queue format: JSON array of activity objects.
 *
 * Success Criteria Addressed: SC2 (offline support)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

/** @type {string} AsyncStorage key for the offline activity queue. */
const QUEUE_KEY = 'offlineQueue';

/**
 * Adds an activity to the offline queue in AsyncStorage.
 * If the queue already exists, the new activity is appended.
 * If no queue exists, a new JSON array is created.
 *
 * @param {Object} activity - The activity object to queue.
 * @param {string} activity.userID - The UID of the user logging the activity.
 * @param {string} activity.activityType - One of "Walking", "Stretching", "Breathing".
 * @returns {Promise<void>}
 */
export const addToOfflineQueue = async (activity) => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push(activity);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
};

/**
 * Reads all activities from the offline queue and writes each one
 * to Firestore under users/{userID}/activities.
 * After a successful write, the queue is cleared.
 * If the device is still offline, the write fails and the queue
 * is preserved for the next sync attempt.
 *
 * @returns {Promise<number>} The number of activities synced, or 0 if none were queued.
 */
export const flushOfflineQueue = async () => {
  try {
    if (!db) {
      console.error('flushOfflineQueue: db is undefined — cannot sync.');
      return 0;
    }

    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;

    const queue = JSON.parse(raw);
    if (queue.length === 0) return 0;

    let synced = 0;
    for (const activity of queue) {
      try {
        await addDoc(
          collection(db, `users/${activity.userID}/activities`),
          {
            userID: activity.userID,
            activityType: activity.activityType,
            timestamp: serverTimestamp(),
          }
        );
        synced++;
      } catch (error) {
        console.error('Error syncing activity to Firestore:', error);
      }
    }

    // Clear the queue after attempting to sync all items.
    await AsyncStorage.removeItem(QUEUE_KEY);
    return synced;
  } catch (error) {
    console.error('Error flushing offline queue:', error);
    return 0;
  }
};

/**
 * Returns the current number of activities waiting in the offline queue.
 * Useful for showing a badge or indicator to the user.
 *
 * @returns {Promise<number>} The number of queued activities.
 */
export const getOfflineQueueCount = async () => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    return JSON.parse(raw).length;
  } catch (error) {
    console.error('Error reading offline queue count:', error);
    return 0;
  }
};
