/**
 * ClinicianNavigator.js
 * Native stack navigator for authenticated clinician users.
 * Contains two screens:
 *   1. PatientList — shows all assigned patients with weekly totals
 *   2. PatientDetail — per-patient metrics and activity list
 *
 * Navigation from list to detail passes patientUID and patientName
 * as route params. The stack navigator provides a default Back button
 * on the detail screen.
 *
 * Includes a sign out button in the header on all screens.
 *
 * Success Criteria Addressed: SC1 (role-based navigation),
 * SC5 (clinician views patient activities)
 */
import React, { useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ClinicianPatientListScreen from '../screens/ClinicianPatientListScreen';
import ClinicianPatientDetailScreen from '../screens/ClinicianPatientDetailScreen';

var Stack = createNativeStackNavigator();

/**
 * SignOutButton renders a touchable "Sign Out" label in the header.
 * Calls signOut from AuthContext on press.
 * @returns {JSX.Element} The sign out button component.
 */
var SignOutButton = function () {
  var auth = useAuth();
  var signOut = auth.signOut;

  /**
   * Handles sign out button press.
   * Signs the user out via AuthContext; App.js automatically
   * navigates to the Login screen when the user becomes null.
   */
  var handleSignOut = useCallback(async function () {
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
 * Screen 1: PatientList — list of assigned patients with weekly totals
 * Screen 2: PatientDetail — per-patient metrics and activity list
 * A Sign Out button appears in the header on all screens.
 * @returns {JSX.Element} The clinician stack navigator.
 */
var ClinicianNavigator = function () {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#28a745' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: function () { return <SignOutButton />; },
      }}
    >
      <Stack.Screen
        name="PatientList"
        component={ClinicianPatientListScreen}
        options={{ title: 'My Patients' }}
      />
      <Stack.Screen
        name="PatientDetail"
        component={ClinicianPatientDetailScreen}
        options={function ({ route }) {
          return { title: route.params.patientName || 'Patient Detail' };
        }}
      />
    </Stack.Navigator>
  );
};

export default ClinicianNavigator;
