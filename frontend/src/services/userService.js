import api from '@/lib/api';

export const userService = {
  async getMe() {
    return await api.get('/auth/me');
  },

  async getById(id) {
    return await api.get(`/users/${id}`);
  },

  async updateProfile({ id, data }) {
    return await api.put(`/users/${id}`, data);
  },

  async deleteUser(id) {
    return await api.delete(`/users/${id}`);
  },

  async updateAvatar(id, file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return await api.put(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getStats(id) {
    return await api.get(`/users/${id}/stats`);
  },
};
