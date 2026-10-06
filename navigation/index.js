export const roleScreens = {
	patient: ['Home', 'Medication', 'Health', 'Reminders', 'Profile'],
	caregiver: ['Profiles', 'Activity', 'Insights', 'Schedule', 'CareCircle'],
};

export const portalRoles = {
	doctor: ['PatientSummary', 'Prescription', 'DoctorNotes', 'HealthPlan'],
	nurse: ['MyPatients', 'PatientDetail', 'CareNotes'],
	pharmacist: ['ScanQR', 'Prescription', 'Refill'],
};

export const portalEntryPoints = {
	doctor: 'screens/doctor/DoctorPortalScreen.js',
	nurse: 'screens/nurse/MyPatients/MyPatientsScreen.js',
	pharmacist: 'screens/pharmacist/ScanQR/ScanQRScreen.js',
};

export const protectedRecords = ['doctorPrescription', 'doctorNote', 'patientHealthSummary'];

export default roleScreens;
