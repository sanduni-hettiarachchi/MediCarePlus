export const prescriptionService = {
	async createDraft(data) { return { ...data, status: 'draft' }; },
	async finalize(data) { return { ...data, status: 'finalized', finalizedAt: new Date().toISOString() }; },
	async createVersion(previousId, data) { return { ...data, previousId, status: 'finalized' }; },
	async listForPatient() { return []; },
};

export default prescriptionService;
