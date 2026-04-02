/**
 * PatientSummaryScreen.js
 * Placeholder screen for the patient's Summary tab.
 * In Step 4, this will display three metric tiles (Weekly Total,
 * Adherence %, Streak) and a scrollable list of this week's activities.
 *
 * Success Criteria Addressed: (none yet — placeholder)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * PatientSummaryScreen renders the summary tab for patients.
 * Currently a placeholder; metrics will be added in Step 4.
 * @returns {JSX.Element} The patient summary screen placeholder.
 */
const PatientSummaryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Summary</Text>
      <Text style={styles.subtitle}>
        Weekly total, adherence, and streak will be shown here in Step 4.
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

export default PatientSummaryScreen;
