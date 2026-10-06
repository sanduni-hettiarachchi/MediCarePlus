export const doctorService = {
	async signIn(credentials) { return { ...credentials, role: 'doctor' }; },
	async verifyRegistrationNumber(registrationNumber) { return Boolean(registrationNumber); },
	async openPatientAccess(accessToken) { return { accessToken, status: 'authorized' }; },
	async getPatientSummary() { return null; },
	async addDoctorNote(note) { return note; },
	async addPrescription(prescription) { return { ...prescription, status: 'finalized' }; },
	async addHealthPlanItem(item) { return item; },
};

export default doctorService;
