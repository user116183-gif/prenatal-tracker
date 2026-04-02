/**
 * LoginScreen.js
 * Sign-in screen with email and password fields.
 * Uses Firebase Authentication to authenticate users.
 * On success, AuthContext detects the auth change and routes
 * the user based on their role (patient or clinician).
 *
 * Success Criteria Addressed: SC1 (users can sign in)
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

/**
 * LoginScreen renders the sign-in form and handles authentication.
 * @param {Object} props
 * @param {Object} props.navigation - React Navigation prop for screen transitions.
 * @returns {JSX.Element} The login screen.
 */
const LoginScreen = ({ navigation }) => {
  /** @type {string} Email input value. */
  const [email, setEmail] = useState('');

  /** @type {string} Password input value. */
  const [password, setPassword] = useState('');

  /**
   * Attempts to sign in with the provided email and password.
   * On success, AuthContext picks up the auth state change.
   * On failure, displays an alert with the error message.
   * @returns {Promise<void>}
   */
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Prenatal Activity Tracker</Text>

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
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      <View style={styles.buttonContainer}>
        <Button title="Sign In" onPress={handleLogin} color="#007BFF" />
      </View>

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
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
  buttonContainer: {
    marginTop: 8,
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

export default LoginScreen;
