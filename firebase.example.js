// firebase.example.js — copy to firebase.js and fill in your values
// This file shows the full Firebase initialisation pattern.
// firebase.js is gitignored because it contains real API keys.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase configuration object.
 * Replace each placeholder with your project's values from
 * Firebase Console > Project Settings > Your apps > Web app.
 */
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

/** Initialised Firebase app instance. */
const app = initializeApp(firebaseConfig);

/** Firebase Authentication instance. */
export const auth = getAuth(app);

/** Cloud Firestore instance. */
export const db = getFirestore(app);
