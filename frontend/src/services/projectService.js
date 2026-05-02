import api from './api';

export const projectService = {
  async createProject(name, description) {
    const response = await api.post('/api/projects', { name, description });
    return response.data;
  },

  async getProjects() {
    const response = await api.get('/api/projects');
    return response.data;
  },

  async getProject(id) {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  async updateProject(id, data) {
    const response = await api.put(`/api/projects/${id}`, data);
    return response.data;
  },

  async deleteProject(id) {
    await api.delete(`/api/projects/${id}`);
  },

  async addMember(projectId, email) {
    const response = await api.post(`/api/projects/${projectId}/members`, { email });
    return response.data;
  },

  async removeMember(projectId, userId) {
    const response = await api.delete(`/api/projects/${projectId}/members/${userId}`);
    return response.data;
  },
};
