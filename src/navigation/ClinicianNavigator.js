/**
 * ClinicianNavigator.js
 * Native stack navigator for authenticated clinician users.
 * Shows the Patient List screen and will navigate to Patient Detail
 * when a patient is selected (added in Step 5).
 *
 * Success Criteria Addressed: SC1 (role-based navigation)
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClinicianPatientListScreen from '../screens/ClinicianPatientListScreen';

const Stack = createNativeStackNavigator();

/**
 * ClinicianNavigator renders the stack navigation for clinicians.
 * Screen 1: PatientList — list of assigned patients (placeholder)
 * Screen 2: PatientDetail — per-patient activity view (added in Step 5)
 * @returns {JSX.Element} The clinician stack navigator.
 */
const ClinicianNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#28a745' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
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
