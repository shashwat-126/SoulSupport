import api from '@/lib/api';

export const settingsService = {
  async getMySettings() {
    const response = await api.get('/profile/settings');
    return response.data?.data?.settings ?? response.data?.settings ?? {};
  },

  async updateMySettings(data) {
    const response = await api.put('/profile/settings', data);
    return response.data?.data?.settings ?? response.data?.settings ?? {};
  },

  async deleteMyAccount({ currentPassword, confirmText }) {
    const response = await api.delete('/profile/account', {
      data: { currentPassword, confirmText },
      timeout: 30000,
    });
    return response.data;
  },
};