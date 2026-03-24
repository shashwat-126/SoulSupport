import { getAuthToken } from '@/lib/authToken';

export const chatService = {
  async getHistory() {
    const token = getAuthToken();
    if (!token) {
      throw new Error('You must be logged in');
    }

    const response = await fetch('/api/chat', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to load chat history');
    }

    return data;
  },

  async sendMessage(message, onToken) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('You must be logged in');
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      const data = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : { error: await response.text().catch(() => '') };
      throw new Error(data?.error || 'Failed to get assistant response');
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      const text = data?.message || '';
      if (text && onToken) {
        onToken(text, true);
      }
      return text;
    }

    if (!response.body) {
      throw new Error('No response stream available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const tokenChunk = decoder.decode(value, { stream: true });
      fullText += tokenChunk;
      if (onToken) {
        onToken(tokenChunk, false);
      }
    }

    return fullText;
  },
};
