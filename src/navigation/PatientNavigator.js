/**
 * PatientNavigator.js
 * Bottom tab navigator for authenticated patient users.
 * Contains two tabs: Home (activity logging) and Summary (metrics).
 * Both tabs display placeholder screens for now; full implementations
 * will be added in later build steps.
 *
 * Success Criteria Addressed: SC1 (role-based navigation)
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import PatientSummaryScreen from '../screens/PatientSummaryScreen';

const Tab = createBottomTabNavigator();

/**
 * PatientNavigator renders the bottom tab navigation for patients.
 * Tab 1: Home — activity logging buttons (placeholder)
 * Tab 2: Summary — metrics and activity list (placeholder)
 * @returns {JSX.Element} The patient bottom tab navigator.
 */
const PatientNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: { fontSize: 13 },
        tabBarActiveTintColor: '#007BFF',
        headerStyle: { backgroundColor: '#007BFF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={PatientHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Summary"
        component={PatientSummaryScreen}
        options={{ title: 'Summary' }}
      />
    </Tab.Navigator>
  );
};

export default PatientNavigator;
