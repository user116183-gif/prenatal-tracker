/**
 * PatientNavigator.js
 * Bottom tab navigator for authenticated patient users.
 * Contains two tabs: Home (activity logging) and Summary (metrics).
 * Both tabs display placeholder screens for now; full implementations
 * will be added in later build steps.
 * Includes a sign out button in the header visible on all tabs.
 *
 * Success Criteria Addressed: SC1 (role-based navigation)
 */
import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import PatientSummaryScreen from '../screens/PatientSummaryScreen';

const Tab = createBottomTabNavigator();

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
 * PatientNavigator renders the bottom tab navigation for patients.
 * Tab 1: Home — activity logging buttons (placeholder)
 * Tab 2: Summary — metrics and activity list (placeholder)
 * A Sign Out button appears in the header on all tabs.
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
        headerRight: () => <SignOutButton />,
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
