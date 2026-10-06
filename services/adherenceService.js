export const adherenceService = {
	async markDose(adherenceId, status) { return { adherenceId, status, updatedAt: new Date().toISOString() }; },
	async listHistory() { return []; },
};

export default adherenceService;
