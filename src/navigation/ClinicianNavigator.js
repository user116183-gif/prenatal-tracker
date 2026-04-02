/**
 * ClinicianNavigator.js
 * Native stack navigator for authenticated clinician users.
 * Shows the Patient List screen and will navigate to Patient Detail
 * when a patient is selected (added in Step 5).
 * Includes a sign out button in the header.
 *
 * Success Criteria Addressed: SC1 (role-based navigation)
 */
import React, { useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ClinicianPatientListScreen from '../screens/ClinicianPatientListScreen';

const Stack = createNativeStackNavigator();

/**
 * SignOutButton renders a touchable "Sign Out" label in the header.
 * Calls signOut from AuthContext on press.
 * @returns {JSX.Element} The sign out button component.
 */
const SignOutButton = () => {
  const { signOut } = useAuth();

  /**
   * Handles sign out button press.
   * Signs the user out via AuthContext; App.js automatically
   * navigates to the Login screen when the user becomes null.
   */
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut]);

  return (
    <TouchableOpacity onPress={handleSignOut} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Sign Out</Text>
    </TouchableOpacity>
  );
};

/**
 * ClinicianNavigator renders the stack navigation for clinicians.
 * Screen 1: PatientList — list of assigned patients (placeholder)
 * Screen 2: PatientDetail — per-patient activity view (added in Step 5)
 * A Sign Out button appears in the header on all screens.
 * @returns {JSX.Element} The clinician stack navigator.
 */
const ClinicianNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#28a745' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => <SignOutButton />,
      }}
    >
      <Stack.Screen
        name="PatientList"
        component={ClinicianPatientListScreen}
        options={{ title: 'My Patients' }}
      />
    </Stack.Navigator>
  );
};

export default ClinicianNavigator;
