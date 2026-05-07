import api from './api';

export const tenantService = {
  async getMembership() {
    const response = await api.get('/api/tenants/membership');
    return response.data;
  },

  async createTenant(name) {
    const response = await api.post('/api/tenants', { name });
    return response.data;
  },

  async createInvite(email, role = 'member') {
    const response = await api.post('/api/tenants/invites', { email, role });
    return response.data;
  },

  async acceptInvite(token) {
    const response = await api.post('/api/tenants/invites/accept', { token });
    return response.data;
  },

  async leaveWorkspace() {
    const response = await api.post('/api/tenants/leave');
    return response.data;
  },

  async transferOwnership(email) {
    const response = await api.post('/api/tenants/transfer-ownership', { email });
    return response.data;
  },

  async deleteWorkspace() {
    const response = await api.delete('/api/tenants');
    return response.data;
  },
};
