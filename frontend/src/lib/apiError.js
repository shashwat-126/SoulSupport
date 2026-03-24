export function normalizeApiError(error) {
  if (!error) return 'Network error';
  if (typeof error === 'string') return error;

  const fromResponse = error.response?.data;
  const message =
    fromResponse?.error ||
    fromResponse?.message ||
    error.message ||
    'Network error';

  return message;
}