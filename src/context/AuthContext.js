/**
 * AuthContext.js
 * Provides authentication state and user role to the entire application.
 * Listens to Firebase onAuthStateChanged and fetches the user's role
 * from the Firestore users/{uid} document.
 *
 * Exposed values:
 * - user: the current Firebase user object (null if signed out)
 * - role: "patient" | "clinician" | null
 * - loading: true while checking auth state
 * - signOut: async function to sign the user out
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

/** @type {React.Context} Authentication context. */
const AuthContext = createContext({});

/**
 * Custom hook to access the authentication context from any screen.
 * @returns {{ user: Object|null, role: string|null, loading: boolean, signOut: Function }}
 */
export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider wraps the app and manages authentication state.
 * On mount, subscribes to onAuthStateChanged. When a user is detected,
 * fetches their role from Firestore (users/{uid}.role).
 * On unmount, unsubscribes from the auth listener.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap.
 * @returns {JSX.Element} The AuthContext provider.
 */
export const AuthProvider = ({ children }) => {
  /** @type {Object|null} Current Firebase user. */
  const [user, setUser] = useState(null);

  /** @type {string|null} User role: "patient" or "clinician". */
  const [role, setRole] = useState(null);

  /** @type {boolean} True while checking auth state on app load. */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Auth state change listener.
     * Sets user and role when authenticated, clears them on sign-out.
     * @param {Object} firebaseUser - Firebase user object or null.
     */
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Signs the current user out of Firebase Authentication.
   * Clears user and role from context on success.
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
