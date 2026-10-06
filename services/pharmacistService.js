export const pharmacistService = {
	async requestQrAccess(token) { return { token, status: 'pending' }; },
	async recordDispensing(record) { return record; },
	async updateRefill(refill) { return refill; },
};

export default pharmacistService;
