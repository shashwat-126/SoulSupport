import api from '@/lib/api';

export const adminService = {
  async getAnalytics() {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  async getUnverifiedTherapists(params = {}) {
    const response = await api.get('/admin/therapists/unverified', { params });
    return response.data;
  },

  async setTherapistVerified(profileId, isVerified) {
    const response = await api.put(`/admin/therapists/${profileId}/verify`, { isVerified });
    return response.data;
  },

  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async setUserActive(userId, isActive) {
    const response = await api.put(`/admin/users/${userId}/active`, { isActive });
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
};