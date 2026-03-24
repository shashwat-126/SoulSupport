import api from '@/lib/api';

export const forumService = {
  async getPosts(params = {}) {
    const response = await api.get('/forum/posts', { params });
    return response.data;
  },

  async getPost(id) {
    const response = await api.get(`/forum/posts/${id}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/forum/categories');
    return response.data;
  },

  async createPost(data) {
    const response = await api.post('/forum/posts', data);
    return response.data;
  },

  async updatePost(id, data) {
    const response = await api.put(`/forum/posts/${id}`, data);
    return response.data;
  },

  async deletePost(id) {
    const response = await api.delete(`/forum/posts/${id}`);
    return response.data;
  },

  async likePost(id) {
    const response = await api.post(`/forum/posts/${id}/like`);
    return response.data;
  },

  async unlikePost(id) {
    const response = await api.delete(`/forum/posts/${id}/like`);
    return response.data;
  },

  async addComment(postId, data) {
    const response = await api.post(`/forum/posts/${postId}/comments`, data);
    return response.data;
  },

  async deleteComment(postId, commentId) {
    const response = await api.delete(`/forum/posts/${postId}/comments/${commentId}`);
    return response.data;
  },

  async likeComment(postId, commentId) {
    const response = await api.post(`/forum/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  },

  async unlikeComment(postId, commentId) {
    const response = await api.delete(`/forum/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  },
};
