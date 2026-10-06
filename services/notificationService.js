export const notificationService = {
  async create(notification) { return notification; },
  async list() { return []; },
  async markRead(id) { return id; },
  async remove(id) { return id; },
};

export default notificationService;
