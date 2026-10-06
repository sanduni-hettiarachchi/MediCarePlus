export const healthService = {
	async getSummary() { return null; },
	async saveProfile(profile) { return profile; },
	async addMeasurement(measurement) { return measurement; },
	async addCondition(condition) { return condition; },
	async listHistory() { return []; },
};

export default healthService;
