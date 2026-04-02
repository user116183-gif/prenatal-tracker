/**
 * ClinicianPatientListScreen.js
 * Placeholder screen for the clinician's patient list.
 * In Step 5, this will display all assigned patients with a weekly
 * total badge per patient. Tapping a patient navigates to the
 * Patient Detail screen.
 *
 * Success Criteria Addressed: (none yet — placeholder)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * ClinicianPatientListScreen renders the list of assigned patients.
 * Currently a placeholder; patient list will be added in Step 5.
 * @returns {JSX.Element} The clinician patient list screen placeholder.
 */
const ClinicianPatientListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Patients</Text>
      <Text style={styles.subtitle}>
        Assigned patients with weekly totals will appear here in Step 5.
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

export default ClinicianPatientListScreen;
