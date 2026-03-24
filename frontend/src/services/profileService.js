import api from '@/lib/api';

const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;

function validateProfilePhoto(file) {
  if (!file) {
    throw new Error('Please choose an image file to upload.');
  }

  if (typeof file.type === 'string' && !file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed (jpg, png, gif, webp).');
  }

  if (typeof file.size === 'number' && file.size > MAX_PROFILE_PHOTO_BYTES) {
    throw new Error('Profile photo must be 2MB or smaller.');
  }
}

export const profileService = {
  async getMyProfile() {
    const response = await api.get('/profile/me');
    return response.data;
  },

  async getPublicProfile(id) {
    const response = await api.get(`/profile/${id}`);
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/profile/update', data);
    return response.data;
  },

  async uploadPhoto(file) {
    validateProfilePhoto(file);

    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post('/profile/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
