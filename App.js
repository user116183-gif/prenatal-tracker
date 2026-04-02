/**
 * App.js
 * Root component of the Prenatal Activity Tracker application.
 * Wraps the entire app in AuthProvider and handles role-based routing:
 *   - No user: shows Login / SignUp screens (Auth Stack)
 *   - Patient: renders PatientNavigator (bottom tabs: Home, Summary)
 *   - Clinician: renders ClinicianNavigator (stack: PatientList)
 * Shows a loading spinner while checking authentication state.
 *
 * Success Criteria Addressed: SC1 (role-based routing)
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth, AuthProvider } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import PatientNavigator from './src/navigation/PatientNavigator';
import ClinicianNavigator from './src/navigation/ClinicianNavigator';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

/**
 * RootNavigator handles routing based on authentication state and user role.
 * - loading: shows a centered ActivityIndicator
 * - no user: renders Login and SignUp screens
 * - user with role "patient": renders PatientNavigator
 * - user with role "clinician": renders ClinicianNavigator
 * @returns {JSX.Element} The appropriate navigator based on auth state.
 */
const RootNavigator = () => {
  const { user, role, loading } = useAuth();

  /** Show a loading spinner while checking auth state on app start. */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        /* Unauthenticated: show login and sign-up screens. */
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : role === 'clinician' ? (
        /* Clinician: show clinician stack navigator. */
        <Stack.Screen name="Clinician" component={ClinicianNavigator} />
      ) : (
        /* Patient (or unknown role): show patient tab navigator. */
        <Stack.Screen name="Patient" component={PatientNavigator} />
      )}
    </Stack.Navigator>
  );
};

/**
 * App is the entry point of the Prenatal Activity Tracker application.
 * Wraps RootNavigator in AuthProvider and NavigationContainer.
 * @returns {JSX.Element} The complete application.
 */
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
