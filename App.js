import React, { Component, useEffect, useRef, useState } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { onAuthStateChanged } from 'firebase/auth';
import dbService from './services/db';
import authService from './services/authService';
import { getFirebaseServices } from './firebase/firebaseConfig';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingScreen from './screens/auth/LandingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import SignUpScreen from './screens/auth/SignUpScreen';
import SignedOutScreen from './screens/auth/SignedOutScreen';
import SplashScreen from './screens/auth/SplashScreen';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import AccessibilityDisplayScreen from './screens/patient/AccessibilityDisplayScreen';
import AddCareNoteScreen from './screens/nurse/AddCareNoteScreen';
import AddMedicineDetailsScreen from './screens/patient/AddMedicineDetailsScreen';
import AddMedicineSheet from './screens/patient/AddMedicineSheet';
import AddPrescriptionScreen from './screens/patient/AddPrescriptionScreen';
import DoseScreen from './screens/patient/DoseScreen';
import EditDeleteMedicineScreen from './screens/patient/EditDeleteMedicineScreen';
import InviteCaregiverScreen from './screens/patient/InviteCaregiverScreen';
import InviteNurseScreen from './screens/patient/InviteNurseScreen';
import ManageAccessScreen from './screens/patient/ManageAccessScreen';
import MedicationDetailScreen from './screens/patient/MedicationDetailScreen';
import MedicineAddedScreen from './screens/patient/MedicineAddedScreen';
import MyPrescriptionsScreen from './screens/patient/MyPrescriptionsScreen';
import NotificationsScreen from './screens/patient/NotificationsScreen';
import PatientHistoryScreen from './screens/nurse/PatientHistoryScreen';
import PatientProfileScreen from './screens/patient/PatientProfileScreen';
import PatientActivityScreen from './screens/patient/PatientActivityScreen';
import PatientCareNotesScreen from './screens/patient/PatientCareNotesScreen';
import ReminderAlertScreen from './screens/patient/ReminderAlertScreen';
import ShareWithDoctorScreen from './screens/patient/ShareWithDoctorScreen';
import TodaysScheduleScreen from './screens/patient/TodaysScheduleScreen';
import YourMedicinesScreen from './screens/patient/YourMedicinesScreen';
import AdherenceCalendarScreen from './screens/caregiver/AdherenceCalendarScreen';
import CallOutcomeLogScreen from './screens/caregiver/CallOutcomeLogScreen';
import CaregiverActivityScreen from './screens/caregiver/CaregiverActivityScreen';
import CaregiverCareNotesScreen from './screens/caregiver/CaregiverCareNotesScreen';
import CaregiverInsightsScreen from './screens/caregiver/CaregiverInsightsScreen';
import CaregiverPendingRequestsScreen from './screens/caregiver/CaregiverPendingRequestsScreen';
import CaregiverProfilesScreen from './screens/caregiver/CaregiverProfilesScreen';
import ManageLinkedCaregiversScreen from './screens/caregiver/ManageLinkedCaregiversScreen';
import ManagePatientScheduleScreen from './screens/caregiver/ManagePatientScheduleScreen';
import RefillNotificationScreen from './screens/caregiver/RefillNotificationScreen';
import DoctorProfileScreen from './screens/doctor/DoctorProfileScreen';
import DoctorSignInScreen from './screens/doctor/DoctorSignInScreen';
import DoctorPatientsScreen from './screens/doctor/DoctorPatientsScreen';
import PrescriptionScreen from './screens/doctor/Prescription/PrescriptionScreen';
import DoctorNotesScreen from './screens/doctor/DoctorNotes/DoctorNotesScreen';
import HealthReportScreen from './screens/doctor/HealthReportScreen';
import HomeVisitSummaryScreen from './screens/doctor/HomeVisitSummaryScreen';
import PatientVisitsScreen from './screens/doctor/PatientVisitsScreen';
import PrescriptionsRefillsScreen from './screens/doctor/PrescriptionsRefillsScreen';
import RefillStatusScreen from './screens/doctor/RefillStatusScreen';
import EditCareNoteScreen from './screens/nurse/EditCareNoteScreen';
import NurseMyPatientsScreen from './screens/nurse/NurseMyPatientsScreen';
import NursePatientDetailScreen from './screens/nurse/NursePatientDetailScreen';
import NursePendingRequestsScreen from './screens/nurse/NursePendingRequestsScreen';
import NurseProfileScreen from './screens/nurse/NurseProfileScreen';
import NurseSignInScreen from './screens/nurse/NurseSignInScreen';
import PharmacistPatientMedicinesScreen from './screens/pharmacist/PharmacistPatientMedicinesScreen';
import PharmacistPatientsScreen from './screens/pharmacist/PharmacistPatientsScreen';
import PharmacistProfileScreen from './screens/pharmacist/PharmacistProfileScreen';
import RefillSummaryScreen from './screens/pharmacist/RefillSummaryScreen';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message || 'An unexpected error occurred'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { if (typeof window !== 'undefined' && window.location) { window.location.reload(); } else { console.log('Reload requested'); } }}>
            <Text style={styles.retryButtonText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Splash');
  const [userRole, setUserRole] = useState('patient');
  const [currentUser, setCurrentUser] = useState(null);
  const [caregiverAlerts, setCaregiverAlerts] = useState([]);
  const [screenParams, setScreenParams] = useState({});
  const [userPreferences, setUserPreferences] = useState({ language: 'en', largeText: false, highContrast: false, voiceReminders: true });
  const navigationStack = useRef(['Splash']);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected, isInternetReachable, refresh: retryConnection } = useNetInfo();
  const isOffline = isConnected === false || isInternetReachable === false;

  useEffect(() => {
    if (currentUser?.role !== 'caregiver' || !currentUser.patientId) {
      setCaregiverAlerts([]);
      return undefined;
    }
    return dbService.subscribeToAlerts(currentUser.patientId, setCaregiverAlerts);
  }, [currentUser]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        * { scrollbar-width: none; -ms-overflow-style: none; }
        *::-webkit-scrollbar { display: none; width: 0; height: 0; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Auto-login with onAuthStateChanged
  useEffect(() => {
    let unsubscribe = null;
    try {
      const { auth } = getFirebaseServices();
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user ? 'signed in' : 'signed out');
        if (user) {
          // User is signed in, fetch their role from Firestore
          try {
            const firestoreDb = dbService.getFirestoreDb?.();
            if (firestoreDb) {
              const { doc, getDoc } = require('firebase/firestore');
              const profileSnapshot = await getDoc(doc(firestoreDb, 'users', user.uid));
              if (profileSnapshot.exists()) {
                const currentUser = dbService.buildCurrentUser?.(user, profileSnapshot.data()) || {
                  ...profileSnapshot.data(),
                  id: user.uid,
                  uid: user.uid,
                };
                setCurrentUser(currentUser);
                setUserRole(currentUser.role);
                // Navigate to role's home screen
                setCurrentScreen((prevScreen) => {
                  if (prevScreen === 'Splash') return 'Splash';
                  if (currentUser.role === 'caregiver') return 'CaregiverProfiles';
                  if (currentUser.role === 'doctor') return 'DoctorPatients';
                  if (currentUser.role === 'nurse') return 'NurseMyPatients';
                  if (currentUser.role === 'pharmacist') return 'PharmacistPatients';
                  return 'TodaysSchedule';
                });
              } else {
                setCurrentUser(null);
              }
            } else {
              // Fallback to local cache if Firestore not available
              const userDoc = dbService.getUserById(user.uid);
              if (userDoc) {
                const currentUser = { ...userDoc, id: user.uid, uid: user.uid };
                setCurrentUser(currentUser);
                setUserRole(currentUser.role);
              } else {
                setCurrentUser(null);
              }
            }
          } catch (e) {
            console.warn('Error fetching user role:', e);
            setError('Error fetching user data: ' + e.message);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setIsLoadingAuth(false);
      });
    } catch (e) {
      console.error('Firebase initialization error:', e);
      setError('Firebase initialization error: ' + e.message);
      setIsLoadingAuth(false);
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const navigation = {
    navigate: (screenName, params = {}) => {
      navigationStack.current.push(screenName);
      setScreenParams(params);
      setCurrentScreen(screenName);
    },
    replace: (screenName, params = {}) => {
      navigationStack.current[navigationStack.current.length - 1] = screenName;
      setScreenParams(params);
      setCurrentScreen(screenName);
    },
    goBack: () => {
      if (navigationStack.current.length > 1) {
        navigationStack.current.pop();
        const previousScreen = navigationStack.current[navigationStack.current.length - 1];
        setCurrentScreen(previousScreen);
      } else {
        // If stack is empty or only has one screen, go to default based on role
        if (userRole === 'caregiver') setCurrentScreen('CaregiverProfiles');
        else if (userRole === 'doctor') setCurrentScreen('HomeVisitSummary');
        else if (userRole === 'nurse') setCurrentScreen('NurseMyPatients');
        else if (userRole === 'pharmacist') setCurrentScreen('PharmacistPatientMedicines');
        else setCurrentScreen('TodaysSchedule');
      }
    },
    reset: (screenName = 'Welcome') => {
      navigationStack.current = [screenName];
      setCurrentScreen(screenName);
    },
  };

  const handleNavigateTab = (tabKey) => {
    const caregiverRoutes = { schedule: 'ManagePatientSchedule', medicines: 'RefillNotification', insights: 'CaregiverInsights', activity: 'CaregiverActivity', profile: 'CaregiverProfiles' };
    const patientRoutes = { schedule: 'TodaysSchedule', medicines: 'YourMedicines', insights: 'CaregiverInsights', activity: 'PatientActivity', profile: 'PatientProfile' };
    const destination = (userRole === 'caregiver' ? caregiverRoutes : patientRoutes)[tabKey] || (userRole === 'caregiver' ? 'CaregiverProfiles' : 'TodaysSchedule');
    navigationStack.current = [destination]; // Reset stack on tab switch
    setCurrentScreen(destination);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    navigation.reset('Welcome');
    await authService.logout(navigation);
  };
  const route = { params: screenParams };
  const hasUnhandledAlert = caregiverAlerts.some((alert) => !alert.handled && alert.status !== 'handled');

  const renderScreen = () => {
    if (isLoadingAuth) return <SplashScreen navigation={navigation} currentUser={currentUser} />;
    const pharmacistBlockedScreens = ['HomeVisitSummary', 'PatientVisits', 'PrescriptionsRefills', 'HealthReport', 'AddCareNote', 'DoctorNotes', 'CareNotes', 'RefillStatus'];
    if (userRole === 'pharmacist' && pharmacistBlockedScreens.includes(currentScreen)) {
      return <PharmacistPatientMedicinesScreen navigation={navigation} route={route} />;
    }
    switch (currentScreen) {
      case 'Splash': return <SplashScreen navigation={navigation} currentUser={currentUser} />;
      case 'Welcome': return <WelcomeScreen navigation={navigation} />;
      case 'Landing': return <LandingScreen navigation={navigation} onSelectRole={setUserRole} />;
      case 'Login': return <LoginScreen navigation={navigation} onLoginSuccess={(user) => { setCurrentUser(user); setUserRole(user.role); setUserPreferences((current) => ({ ...current, language: user.language === 'si' ? 'si' : 'en', largeText: Boolean(user.largeText), highContrast: Boolean(user.highContrast), voiceReminders: user.voiceReminders !== false })); setCurrentScreen(user.role === 'caregiver' ? 'CaregiverProfiles' : 'TodaysSchedule'); }} />;
      case 'SignUp': return <SignUpScreen navigation={navigation} route={route} onSignUpSuccess={(user) => { setCurrentUser(user); setUserRole(user.role); setCurrentScreen(user.role === 'caregiver' ? 'CaregiverProfiles' : user.role === 'doctor' ? 'DoctorPatients' : user.role === 'pharmacist' ? 'PharmacistPatients' : user.role === 'nurse' ? 'NurseMyPatients' : 'TodaysSchedule'); }} />;
      case 'SignedOut': return <SignedOutScreen navigation={navigation} />;
      case 'TodaysSchedule': return <TodaysScheduleScreen navigation={navigation} onNavigateTab={handleNavigateTab} userPreferences={userPreferences} currentUser={currentUser} isOffline={isOffline} onRetryOffline={retryConnection} />;
      case 'DoseScreen': return <DoseScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'YourMedicines': return <YourMedicinesScreen navigation={navigation} onNavigateTab={handleNavigateTab} userPreferences={userPreferences} currentUser={currentUser} isOffline={isOffline} onRetryOffline={retryConnection} />;
      case 'AddMedicineSheet': return <AddMedicineSheet navigation={navigation} />;
      case 'AddMedicineDetails': return <AddMedicineDetailsScreen navigation={navigation} currentUser={currentUser} />;
      case 'MedicineAdded': return <MedicineAddedScreen navigation={navigation} route={route} />;
      case 'EditDeleteMedicine': return <EditDeleteMedicineScreen navigation={navigation} route={route} />;
      case 'MedicationDetail': return <MedicationDetailScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'ReminderAlert': return <ReminderAlertScreen navigation={navigation} route={route} currentUser={currentUser} userPreferences={userPreferences} />;
      case 'Notifications': return <NotificationsScreen navigation={navigation} currentUser={currentUser} isOffline={isOffline} onRetryOffline={retryConnection} />;
      case 'PatientActivity': return <PatientActivityScreen navigation={navigation} currentUser={currentUser} />;
      case 'PatientProfile': return <PatientProfileScreen navigation={navigation} onNavigateTab={handleNavigateTab} onLogout={handleLogout} userPreferences={userPreferences} currentUser={currentUser} />;
      case 'PatientCareNotes': return <PatientCareNotesScreen navigation={navigation} currentUser={currentUser} />;
      case 'AccessibilityDisplay': return <AccessibilityDisplayScreen navigation={navigation} userPreferences={userPreferences} currentUser={currentUser} onSavePreferences={setUserPreferences} />;
      case 'ShareWithDoctor': return <ShareWithDoctorScreen navigation={navigation} currentUser={currentUser} />;
      case 'ManageAccess': return <ManageAccessScreen navigation={navigation} currentUser={currentUser} />;
      case 'InviteCaregiver': return <InviteCaregiverScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'InviteNurse': return <InviteNurseScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'MyPrescriptions': return <MyPrescriptionsScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'AddPrescription': return <AddPrescriptionScreen navigation={navigation} currentUser={currentUser} />;
      case 'CaregiverProfiles': return <CaregiverProfilesScreen navigation={navigation} onNavigateTab={handleNavigateTab} onLogout={handleLogout} userPreferences={userPreferences} hasAlertBadge={hasUnhandledAlert} currentUser={currentUser} />;
      case 'CaregiverPendingRequests': return <CaregiverPendingRequestsScreen navigation={navigation} currentUser={currentUser} onNavigateTab={handleNavigateTab} />;
      case 'CaregiverActivity': return <CaregiverActivityScreen navigation={navigation} onNavigateTab={handleNavigateTab} userPreferences={userPreferences} hasAlertBadge={hasUnhandledAlert} currentUser={currentUser} />;
      case 'CaregiverCareNotes': return <CaregiverCareNotesScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'CallOutcomeLog': return <CallOutcomeLogScreen navigation={navigation} route={route} />;
      case 'ManagePatientSchedule': return <ManagePatientScheduleScreen navigation={navigation} onNavigateTab={handleNavigateTab} hasAlertBadge={hasUnhandledAlert} />;
      case 'ManageLinkedCaregivers': return <ManageLinkedCaregiversScreen navigation={navigation} currentUser={currentUser} />;
      case 'RefillNotification': return <RefillNotificationScreen navigation={navigation} route={route} onNavigateTab={handleNavigateTab} hasAlertBadge={hasUnhandledAlert} />;
      case 'CaregiverInsights': return <CaregiverInsightsScreen navigation={navigation} onNavigateTab={handleNavigateTab} userPreferences={userPreferences} hasAlertBadge={hasUnhandledAlert} />;
      case 'AdherenceCalendar': return <AdherenceCalendarScreen navigation={navigation} />;
      case 'DoctorSignIn': return <DoctorSignInScreen navigation={navigation} onDoctorSignIn={(professional) => { setCurrentUser(professional); setUserRole(professional.role); navigation.navigate(professional.role === 'pharmacist' ? 'PharmacistPatients' : 'DoctorPatients', { doctor: professional, pharmacist: professional }); }} />;
      case 'DoctorPatients': return <DoctorPatientsScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'HomeVisitSummary': return <HomeVisitSummaryScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'DoctorPrescription': return <PrescriptionScreen navigation={navigation} route={route} onBack={() => navigation?.goBack()} />;
      case 'DoctorNotes': return <DoctorNotesScreen navigation={navigation} route={route} />;
      case 'HealthReport': return <HealthReportScreen navigation={navigation} route={route} />;
      case 'PatientVisits': return <PatientVisitsScreen navigation={navigation} route={route} />;
      case 'PrescriptionsRefills': return <PrescriptionsRefillsScreen navigation={navigation} route={route} />;
      case 'RefillStatus': return <RefillStatusScreen navigation={navigation} route={route} />;
      case 'DoctorProfile': return <DoctorProfileScreen navigation={navigation} route={route} onLogout={handleLogout} />;
      case 'NurseSignIn': return <NurseSignInScreen navigation={navigation} onNurseSignIn={(nurse) => { setUserRole('nurse'); navigation.navigate('NurseMyPatients', { currentUser: nurse }); }} />;
      case 'NurseMyPatients': return <NurseMyPatientsScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'NursePatientDetail': return <NursePatientDetailScreen navigation={navigation} route={route} />;
      case 'AddCareNote': return <AddCareNoteScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'EditCareNote': return <EditCareNoteScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'PatientHistory': return <PatientHistoryScreen navigation={navigation} route={route} />;
      case 'InviteNurse': return <InviteNurseScreen navigation={navigation} />;
      case 'NurseProfile': return <NurseProfileScreen navigation={navigation} route={route} onLogout={handleLogout} />;
      case 'NursePendingRequests': return <NursePendingRequestsScreen navigation={navigation} currentUser={currentUser} />;
      case 'PharmacistPatients': return <PharmacistPatientsScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'PharmacistPatientMedicines': return <PharmacistPatientMedicinesScreen navigation={navigation} route={route} currentUser={currentUser} />;
      case 'PharmacistProfile': return <PharmacistProfileScreen navigation={navigation} route={route} onLogout={handleLogout} />;
      case 'RefillSummary': return <RefillSummaryScreen navigation={navigation} route={route} />;
      default: return <SplashScreen navigation={navigation} />;
    }
  };

  const isDarkContainer = userPreferences.highContrast;
  return (
    <ErrorBoundary>
      <View style={styles.mobileStage}>
        <View style={[styles.mobileFrame, isDarkContainer && styles.darkMobileFrame]}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={isDarkContainer ? 'light-content' : 'dark-content'} />
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <LanguageProvider language={userPreferences.language}>
              <ThemeProvider largeText={userPreferences.largeText} highContrast={userPreferences.highContrast}>
                {renderScreen()}
              </ThemeProvider>
            </LanguageProvider>
          </SafeAreaView>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  mobileStage: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  mobileFrame: { width: '100%', maxWidth: 420, height: '100%', maxHeight: 880, backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 },
  darkMobileFrame: { backgroundColor: '#000000' },
  safeArea: { flex: 1 },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 12, borderBottomWidth: 1, borderBottomColor: '#FCA5A5' },
  errorText: { color: '#DC2626', fontSize: 12, textAlign: 'center' },
  errorContainer: { flex: 1, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#991B1B', marginBottom: 10, textAlign: 'center' },
  errorMessage: { fontSize: 14, color: '#7F1D1D', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#DC2626', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
