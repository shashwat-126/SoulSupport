"use client";

import { createContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const push = useCallback((type, title, description) => {
    const id = crypto.randomUUID();
    const payload = { id, type, title, description };
    setMessages((prev) => [...prev, payload]);
    toast[type === 'error' ? 'error' : 'success'](title || description || 'Updated');
    return id;
  }, []);

  const remove = useCallback((id) => setMessages((prev) => prev.filter((m) => m.id !== id)), []);

  return (
    <NotificationContext.Provider value={{ messages, push, remove }}>
      {children}
    </NotificationContext.Provider>
  );
}
