/**
 * SignUpScreen.js
 * Registration screen with email, password, display name, and role picker.
 * On sign-up, creates a Firebase Auth user and writes the user document
 * to Firestore (users/{uid}) with role, displayName, weeklyTarget: 7,
 * and assignedClinicianUID for patients.
 *
 * Success Criteria Addressed: SC1 (users can create an account, role selection)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

/**
 * SignUpScreen renders the registration form and handles account creation.
 * @param {Object} props
 * @param {Object} props.navigation - React Navigation prop for screen transitions.
 * @returns {JSX.Element} The sign-up screen.
 */
const SignUpScreen = ({ navigation }) => {
  /** @type {string} Display name input value. */
  const [displayName, setDisplayName] = useState('');

  /** @type {string} Email input value. */
  const [email, setEmail] = useState('');

  /** @type {string} Password input value. */
  const [password, setPassword] = useState('');

  /** @type {string} Selected role: "patient" or "clinician". */
  const [role, setRole] = useState('patient');

  /**
   * Attempts to create a new account with the provided details.
   * Creates a Firebase Auth user, then writes the user document to
   * Firestore with the selected role and other fields.
   * On success, AuthContext detects the auth change and routes the user.
   * On failure, displays an alert with the error message.
   * @returns {Promise<void>}
   */
  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      /** @type {Object} User data to write to Firestore. */
      const userData = {
        role: role,
        displayName: displayName,
        weeklyTarget: 7,
      };

      // Patients get an empty assignedClinicianUID as a placeholder.
      if (role === 'patient') {
        userData.assignedClinicianUID = '';
      }

      await setDoc(doc(db, 'users', uid), userData);
    } catch (error) {
      Alert.alert('Sign Up Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Prenatal Activity Tracker</Text>

      <TextInput
        style={styles.input}
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      <Text style={styles.roleLabel}>I am a:</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
          onPress={() => setRole('patient')}
        >
          <Text style={role === 'patient' ? styles.roleTextActive : styles.roleText}>
            Patient
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'clinician' && styles.roleButtonActive]}
          onPress={() => setRole('clinician')}
        >
          <Text style={role === 'clinician' ? styles.roleTextActive : styles.roleText}>
            Clinician
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Sign Up" onPress={handleSignUp} color="#007BFF" />
      </View>

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.link}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  roleButtonActive: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  roleText: {
    color: '#333',
    fontSize: 16,
  },
  roleTextActive: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    color: '#007BFF',
    fontSize: 14,
  },
});

export default SignUpScreen;
