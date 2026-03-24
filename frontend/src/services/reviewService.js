import api from '@/lib/api';

export const reviewService = {
  async createReview(data) {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  async getSessionReview(sessionId) {
    const response = await api.get(`/reviews/session/${sessionId}`);
    return response.data;
  },
};
