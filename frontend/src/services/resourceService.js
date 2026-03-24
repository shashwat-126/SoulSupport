import api from '@/lib/api';

export const resourceService = {
  async getResources(params = {}) {
    const response = await api.get('/resources', { params });
    return response.data;
  },

  async getResource(id) {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  },

  async createResource(data) {
    const response = await api.post('/resources', data);
    return response.data;
  },

  async updateResource(id, data) {
    const response = await api.put(`/resources/${id}`, data);
    return response.data;
  },

  async deleteResource(id) {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },
};
