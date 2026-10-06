export const medicationService = {
	async create(medicine) { return { ...medicine, id: `medicine-${Date.now()}` }; },
	async list() { return []; },
	async update(id, changes) { return { id, ...changes }; },
	async remove(id) { return id; },
};

export default medicationService;
