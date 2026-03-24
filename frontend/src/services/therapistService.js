import api from '@/lib/api';

export const therapistService = {
  async getTherapists(params = {}) {
    const response = await api.get('/therapists', { params });
    return response.data;
  },

  async getTherapist(id) {
    const response = await api.get(`/therapists/${id}`);
    return response.data;
  },

  async updateProfile(id, data) {
    const response = await api.put(`/therapists/${id}`, data);
    return response.data;
  },

  async uploadPhoto(id, file) {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post(`/therapists/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getReviews(therapistId) {
    const response = await api.get(`/therapists/${therapistId}/reviews`);
    return response.data;
  },

  async checkAvailability(therapistId, date, time) {
    const response = await api.get(`/therapists/${therapistId}/availability`, {
      params: { date, time },
    });
    return response.data;
  },
};
