/**
 * Service for communicating with the Aurabot n8n webhook
 * Each user gets individual chat memory based on their userId
 */

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/aurabot';

export const aurabotService = {
  /**
   * Send a message to the Aurabot n8n workflow
   * @param {string} text - The user's message
   * @param {string} userId - Unique user identifier for session memory
   * @param {string} username - Display name of the user
   * @returns {Promise<string>} - The bot's reply
   */
  async sendMessage(text, userId, username) {
    if (!text?.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (!userId) {
      throw new Error('User ID is required for chat session');
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        userId: userId,
        username: username || 'Anonymous',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();

    // The n8n workflow returns { reply: "response text" }
    return data.reply || data.output || data.message || 'I could not generate a response.';
  },
};
