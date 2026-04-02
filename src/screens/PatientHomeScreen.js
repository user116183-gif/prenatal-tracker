/**
 * PatientHomeScreen.js
 * Placeholder screen for the patient's Home tab.
 * In Step 2, this will be replaced with three large activity buttons:
 * Walking, Stretching, and Breathing. Tapping a button will log that
 * activity to Firestore.
 *
 * Success Criteria Addressed: (none yet — placeholder)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * PatientHomeScreen renders the home tab for patients.
 * Currently a placeholder; activity logging will be added in Step 2.
 * @returns {JSX.Element} The patient home screen placeholder.
 */
const PatientHomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Home</Text>
      <Text style={styles.subtitle}>
        Activity logging buttons will be added in Step 2.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default PatientHomeScreen;
