const { randomUUID } = require('crypto');

class RealtimeService {
  constructor() {
    this.clients = new Map();
  }

  subscribe(req, res, user) {
    const clientId = randomUUID();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const pingInterval = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    this.clients.set(clientId, {
      userId: String(user._id),
      userType: user.userType,
      res,
      pingInterval,
    });

    this.sendToClient(res, 'connected', {
      connected: true,
      userId: String(user._id),
      userType: user.userType,
      timestamp: new Date().toISOString(),
    });

    req.on('close', () => {
      this.unsubscribe(clientId);
    });
  }

  unsubscribe(clientId) {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    clearInterval(client.pingInterval);
    this.clients.delete(clientId);
  }

  sendToClient(res, eventName, payload) {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  emitToUser(userId, eventName, payload) {
    const id = String(userId);

    for (const client of this.clients.values()) {
      if (client.userId === id) {
        this.sendToClient(client.res, eventName, payload);
      }
    }
  }

  emitToAll(eventName, payload) {
    for (const client of this.clients.values()) {
      this.sendToClient(client.res, eventName, payload);
    }
  }

  emitSlotUpdate({ therapistId, sessionDate, slotHour, state, sessionId }) {
    this.emitToAll('slot.updated', {
      therapistId: String(therapistId),
      sessionDate,
      slotHour,
      state,
      sessionId: String(sessionId),
      timestamp: new Date().toISOString(),
    });
  }

  emitSessionUpdate({ therapistId, userId, session, action }) {
    const payload = {
      action,
      therapistId: String(therapistId),
      userId: String(userId),
      session,
      timestamp: new Date().toISOString(),
    };

    this.emitToUser(therapistId, 'session.updated', payload);
    this.emitToUser(userId, 'session.updated', payload);
  }
}

module.exports = new RealtimeService();
