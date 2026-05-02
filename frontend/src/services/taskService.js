import api from './api';

export const taskService = {
  async createTask(projectId, taskData) {
    const response = await api.post(`/api/projects/${projectId}/tasks`, taskData);
    return response.data;
  },

  async getProjectTasks(projectId) {
    const response = await api.get(`/api/projects/${projectId}/tasks`);
    return response.data;
  },

  async getTask(id) {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
  },

  async updateTask(id, data) {
    const response = await api.put(`/api/tasks/${id}`, data);
    return response.data;
  },

  async updateTaskStatus(id, status) {
    const response = await api.patch(`/api/tasks/${id}/status`, { status });
    return response.data;
  },

  async deleteTask(id) {
    await api.delete(`/api/tasks/${id}`);
  },

  async getDashboardStats(projectId) {
    const response = await api.get(`/api/dashboard/${projectId}/stats`);
    return response.data;
  },
};
