/**
 * ClinicianPatientListScreen.js
 * Patient list view for authenticated clinician users.
 *
 * Queries the Firestore "users" collection for documents where
 * assignedClinicianUID matches the current clinician's UID.
 * For each patient, fetches their weekly activity total and displays
 * a card with the patient's name and activity count.
 *
 * Tapping a patient card navigates to the ClinicianPatientDetailScreen
 * with the patient's UID and display name as route params.
 *
 * Success Criteria Addressed: SC5 (clinician views patient activities),
 * SC7 (multiple patients, no data overlap)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { computeWeeklyTotal } from '../utils/metrics';

/**
 * Cross-platform alert helper.
 * Falls back to window.alert on web where Alert.alert is unreliable.
 *
 * @param {string} title - Alert title.
 * @param {string} message - Alert body text.
 * @returns {void}
 */
var showAlert = function (title, message) {
  if (Platform.OS === 'web') {
    window.alert(title + '\n' + message);
  } else {
    import('react-native').then(function (rn) {
      rn.Alert.alert(title, message);
    });
  }
};

/**
 * Fetches the weekly activity count for a single patient by querying
 * their Firestore activities sub-collection. Activities are filtered
 * to the current ISO week (Monday 00:00 UTC – Sunday 23:59:59.999 UTC)
 * before counting.
 *
 * @param {string} patientUID - The UID of the patient whose activities to count.
 * @returns {Promise<number>} The number of activities this week.
 */
var fetchWeeklyTotalForPatient = async function (patientUID) {
  if (!db) return 0;

  try {
    var activitiesRef = collection(db, 'users/' + patientUID + '/activities');
    var snapshot = await getDocs(activitiesRef);

    var allActivities = [];
    snapshot.forEach(function (docSnap) {
      var data = docSnap.data();
      allActivities.push({
        userID: data.userID,
        activityType: data.activityType,
        timestamp: data.timestamp ? data.timestamp.toDate() : null,
      });
    });

    // Filter out null timestamps and compute.
    var validActivities = allActivities.filter(function (a) {
      return a.timestamp !== null;
    });
    return computeWeeklyTotal(validActivities);
  } catch (error) {
    console.error('Error fetching weekly total for ' + patientUID + ':', error.message);
    return 0;
  }
};

/**
 * ClinicianPatientListScreen renders the list of patients assigned to
 * the current clinician. Each patient card shows the patient's display
 * name and weekly activity count. Tapping a card navigates to the
 * Patient Detail screen.
 *
 * @param {Object} props - React Navigation screen props.
 * @param {Object} props.navigation - Navigation object for screen transitions.
 * @returns {JSX.Element} The clinician patient list screen.
 */
var ClinicianPatientListScreen = function (props) {
  var navigation = props.navigation;

  /** @type {Object|null} Current authenticated user from AuthContext. */
  var auth = useAuth();
  var user = auth.user;

  /**
   * @type {Array<Object>} List of patient objects with uid, displayName,
   * and weeklyTotal fields.
   */
  var _useState1 = useState([]);
  var patients = _useState1[0];
  var setPatients = _useState1[1];

  /** @type {boolean} True while patients are being fetched. */
  var _useState2 = useState(true);
  var loading = _useState2[0];
  var setLoading = _useState2[1];

  /**
   * useEffect: on mount (and when the clinician user changes), query
   * Firestore for all users whose assignedClinicianUID matches the
   * current clinician. For each patient, also fetch their weekly
   * activity total.
   */
  useEffect(function () {
    if (!user) return;

    if (!db) {
      console.error('ClinicianPatientListScreen: db is undefined.');
      setLoading(false);
      showAlert('Configuration Error', 'Firestore is not initialised.');
      return;
    }

    /**
     * Loads the list of assigned patients and their weekly totals.
     * Queries users where assignedClinicianUID === user.uid,
     * then fetches weekly activity counts for each patient.
     *
     * @returns {Promise<void>}
     */
    var loadPatients = async function () {
      try {
        var usersRef = collection(db, 'users');
        var q = query(usersRef, where('assignedClinicianUID', '==', user.uid));
        var snapshot = await getDocs(q);

        var patientList = [];
        for (var i = 0; i < snapshot.docs.length; i++) {
          var docSnap = snapshot.docs[i];
          var data = docSnap.data();

          var weeklyTotal = await fetchWeeklyTotalForPatient(docSnap.id);

          patientList.push({
            uid: docSnap.id,
            displayName: data.displayName || 'Unknown',
            weeklyTotal: weeklyTotal,
          });
        }

        setPatients(patientList);
      } catch (error) {
        console.error('Error loading patients:', error.message);
        showAlert('Error', 'Could not load patient list: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [user]);

  /**
   * Handles a tap on a patient card.
   * Navigates to the PatientDetail screen with the patient's UID and name.
   *
   * @param {string} patientUID - The UID of the selected patient.
   * @param {string} patientName - The display name of the selected patient.
   * @returns {void}
   */
  var handlePatientPress = function (patientUID, patientName) {
    navigation.navigate('PatientDetail', {
      patientUID: patientUID,
      patientName: patientName,
    });
  };

  /* ---------- Render ---------- */

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Please sign in to view patients.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#28a745" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {patients.length === 0 ? (
        <Text style={styles.emptyText}>
          No patients assigned yet. Patients will appear here once they
          register with your clinician UID.
        </Text>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
        >
          {patients.map(function (patient) {
            return (
              <TouchableOpacity
                key={patient.uid}
                style={styles.patientCard}
                onPress={function () {
                  handlePatientPress(patient.uid, patient.displayName);
                }}
                activeOpacity={0.7}
                accessibilityLabel={'View details for ' + patient.displayName}
                accessibilityRole="button"
              >
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.displayName}</Text>
                  <Text style={styles.patientSubtext}>
                    {patient.weeklyTotal + ' activit' + (patient.weeklyTotal === 1 ? 'y' : 'ies') + ' this week'}
                  </Text>
                </View>
                <Text style={styles.arrow}>{'>'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

/**
 * Styles for the ClinicianPatientListScreen component.
 */
var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  loader: {
    marginTop: 100,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    marginTop: 24,
    paddingHorizontal: 32,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  patientSubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: '#ccc',
    fontWeight: 'bold',
  },
});

export default ClinicianPatientListScreen;
