import api from '@/lib/api';

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const sessionService = {
  async getSessions(params = {}) {
    const response = await api.get('/sessions', { params });
    return response.data;
  },

  async getSession(id) {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },

  async getUpcoming() {
    const response = await api.get('/sessions/upcoming');
    return response.data;
  },

  async getAvailableSlots(therapistId, date) {
    const dateStr =
      typeof date === 'string' ? date : toLocalDateString(date instanceof Date ? date : new Date(date));
    const response = await api.get(`/sessions/available-slots/${therapistId}`, {
      params: { date: dateStr },
    });
    return response.data;
  },

  async createSession(data) {
    const response = await api.post('/sessions', data);
    return response.data;
  },

  async createSlotHold(data) {
    const response = await api.post('/sessions/holds', data);
    return response.data;
  },

  async confirmSlotHold(holdId, data = {}) {
    const response = await api.post(`/sessions/holds/${holdId}/confirm`, data);
    return response.data;
  },

  async updateSession(id, data) {
    const response = await api.put(`/sessions/${id}`, data);
    return response.data;
  },

  async updateSessionStatus(id, data) {
    const response = await api.put(`/sessions/${id}/status`, data);
    return response.data;
  },

  async getMeetingAccess(id) {
    const response = await api.get(`/sessions/${id}/meeting`);
    return response.data;
  },

  async updateCompletionStatus(id, data) {
    const response = await api.put(`/sessions/${id}/completion-status`, data);
    return response.data;
  },

  async cancelSession(id, cancelReason) {
    const payload = cancelReason ? { cancelReason } : undefined;
    const response = await api.delete(`/sessions/${id}`, payload ? { data: payload } : undefined);
    return response.data;
  },

  async cancelSessionAsTherapist(id, cancelReason) {
    const response = await api.put(`/sessions/${id}/status`, {
      status: 'cancelled_by_therapist',
      cancelReason,
    });
    return response.data;
  },
};
