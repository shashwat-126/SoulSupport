"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAuthToken } from '@/lib/authToken';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function formatTime(value) {
  return new Date(value || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

// Strip lone/unmatched asterisks left over after bold/italic processing
function cleanText(str) {
  return str.replace(/\*/g, '');
}

// Renders inline markdown: **bold**, *italic*; strips lone * artifacts
function renderInline(text, baseKey) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*|\*([^*\n]+?)\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(cleanText(text.slice(lastIndex, match.index)));
    if (match[1] !== undefined) parts.push(<strong key={`${baseKey}-b${match.index}`}>{match[1]}</strong>);
    else parts.push(<em key={`${baseKey}-i${match.index}`}>{match[2]}</em>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(cleanText(text.slice(lastIndex)));
  return parts;
}

// Renders a bot message with basic markdown support
function MessageContent({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // Bullet list block — handle * with one or more spaces (e.g. "*   item")
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(<li key={i}>{renderInline(lines[i].replace(/^[-*]\s+/, ''), `li${i}`)}</li>);
        i++;
      }
      elements.push(<ul key={`ul${i}`} className="list-disc pl-4 space-y-0.5 my-1">{items}</ul>);
      continue;
    }

    // Numbered list block
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i}>{renderInline(lines[i].replace(/^\d+\.\s/, ''), `oli${i}`)}</li>);
        i++;
      }
      elements.push(<ol key={`ol${i}`} className="list-decimal pl-4 space-y-0.5 my-1">{items}</ol>);
      continue;
    }

    // Regular paragraph
    elements.push(<p key={i} className={elements.length > 0 ? 'mt-1' : ''}>{renderInline(line, `p${i}`)}</p>);
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

// Floating dots typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="sr-only">SoulBot is typing...</span>
      <span
        className="h-2 w-2 rounded-full bg-primary/60 animate-[bounce_1.4s_ease-in-out_infinite]"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-primary/60 animate-[bounce_1.4s_ease-in-out_infinite]"
        style={{ animationDelay: '200ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-primary/60 animate-[bounce_1.4s_ease-in-out_infinite]"
        style={{ animationDelay: '400ms' }}
      />
    </div>
  );
}

// Bot avatar component
function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-white shadow-md">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </div>
  );
}

// User avatar component
function UserAvatar({ name }) {
  const initial = name?.charAt(0)?.toUpperCase() || 'U';
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sage to-sage/70 text-white font-semibold text-sm shadow-md">
      {initial}
    </div>
  );
}

const USER_PROMPTS = [
  "Show my upcoming appointments",
  "I'm feeling stressed about exams",
  "Can you help me with anxiety?",
  "Who are the therapists?",
];

const THERAPIST_PROMPTS = [
  'Show my upcoming client sessions',
  'Show my pending session requests',
  'Tips for client engagement',
  'How to handle burnout',
];

const STORAGE_KEY = 'soulbot_chat_history';

export function SoulBot() {
  const { user, isTherapist } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollRef = useRef(null);

  const canUseChat = !!user;
  const userId = user?._id || user?.id;

  // Get storage key specific to user
  const getStorageKey = useCallback(() => {
    return userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
  }, [userId]);

  // Load conversation history from localStorage
  useEffect(() => {
    if (!canUseChat || isLoaded) return;

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }

    // Initialize with welcome message if no history
    const firstName = user?.fullName?.split(' ')[0] || 'there';
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        message: `Hi ${firstName}! I'm SoulBot, your mental wellness companion. I'm here to listen, provide support, and help you navigate any challenges you're facing. How are you feeling today?`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setIsLoaded(true);
  }, [canUseChat, user, isLoaded, getStorageKey]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!canUseChat || !isLoaded || messages.length === 0) return;

    // Don't save if there's a typing indicator
    const hasTyping = messages.some(m => m.typing);
    if (hasTyping) return;

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [messages, canUseChat, isLoaded, getStorageKey]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, sending]);

  const clearHistory = () => {
    const firstName = user?.fullName?.split(' ')[0] || 'there';
    const welcomeMessage = {
      id: 'welcome',
      role: 'assistant',
      message: `Hi ${firstName}! I'm SoulBot, your mental wellness companion. I'm here to listen, provide support, and help you navigate any challenges you're facing. How are you feeling today?`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
    try {
      localStorage.removeItem(getStorageKey());
    } catch (e) {
      console.warn('Failed to clear chat history:', e);
    }
  };

  const sendMessage = async (rawMessage) => {
    const text = String(rawMessage || input).trim();
    if (!text || sending || !canUseChat) {
      return;
    }

    setSending(true);
    setError('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      message: text,
      timestamp: new Date().toISOString(),
    };

    const assistantTempId = `assistant-${Date.now()}`;

    // Add user message and typing indicator
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantTempId,
        role: 'assistant',
        message: '',
        timestamp: new Date().toISOString(),
        typing: true,
      },
    ]);

    setInput('');

    try {
      const token = getAuthToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `Request failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/plain') && response.body) {
        // Streaming response from AI
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantTempId
                ? { ...m, message: fullText, typing: false, timestamp: new Date().toISOString() }
                : m
            )
          );
        }
      } else {
        // JSON response (intent-based or smart reply)
        const data = await response.json();
        const reply = data?.message || 'I could not generate a response.';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTempId
              ? { ...m, message: reply, typing: false, timestamp: new Date().toISOString() }
              : m
          )
        );
      }
    } catch (err) {
      // Update typing indicator with error message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantTempId
            ? {
                ...m,
                message:
                  'I apologize, but I encountered an issue while responding. Please try again in a moment.',
                typing: false,
              }
            : m
        )
      );
      setError(String(err?.message || err || 'Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  if (!canUseChat) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SoulBot</CardTitle>
          <CardDescription>Please log in to chat with SoulBot.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const prompts = isTherapist ? THERAPIST_PROMPTS : USER_PROMPTS;

  // Group messages by date for date separators
  const getDateKey = (timestamp) => new Date(timestamp).toDateString();
  let lastDateKey = null;

  return (
    <Card className="border-border/70 shadow-lg">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <BotAvatar />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">SoulBot</CardTitle>
              <CardDescription className="text-xs">
                {sending ? 'Typing...' : 'Online - here to help'}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-text-muted hover:text-charcoal"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex h-[calc(100vh-20rem)] min-h-[400px] max-h-[600px] flex-col overflow-hidden bg-gradient-to-b from-surface to-surface-alt/30 sm:h-[60vh]">
          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            {!isLoaded ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-text-muted">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">Loading conversation...</span>
                </div>
              </div>
            ) : (
              messages.map((m, index) => {
                const currentDateKey = getDateKey(m.timestamp);
                const showDateSeparator = currentDateKey !== lastDateKey;
                lastDateKey = currentDateKey;

                return (
                  <div key={m.id}>
                    {/* Date separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-surface-alt/80 text-text-muted text-xs px-3 py-1 rounded-full border border-border/50">
                          {formatDate(m.timestamp)}
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div
                      className={`flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Avatar */}
                      {m.role === 'assistant' ? (
                        <BotAvatar />
                      ) : (
                        <UserAvatar name={user?.fullName} />
                      )}

                      {/* Message bubble */}
                      <div
                        className={`group relative max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all hover:shadow-md ${
                          m.role === 'user'
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-white text-charcoal border border-border/60 rounded-bl-md'
                        }`}
                      >
                        {m.typing && !m.message ? (
                          <TypingIndicator />
                        ) : m.role === 'assistant' ? (
                          <MessageContent text={m.message} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{m.message}</p>
                        )}
                        <p
                          className={`mt-1.5 text-[10px] transition-opacity ${
                            m.role === 'user'
                              ? 'text-white/70'
                              : 'text-text-muted'
                          }`}
                        >
                          {formatTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-white/80 backdrop-blur-sm p-3 sm:p-4">
            {/* Quick Prompts */}
            <div className="mb-3 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={sending}
                  className="group max-w-full rounded-full border border-border bg-white px-3 py-1.5 text-left text-xs font-medium text-text-secondary shadow-sm transition-all hover:border-primary/40 hover:text-primary hover:shadow-md disabled:opacity-60"
                >
                  <span className="line-clamp-1 break-words">{prompt}</span>
                </button>
              ))}
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-end gap-2"
            >
              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Type a message..."
                  className="w-full min-h-[44px] max-h-[120px] resize-none rounded-2xl border border-border bg-white pl-4 pr-12 py-3 text-sm text-charcoal outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={sending}
                  style={{
                    height: 'auto',
                    overflow: 'hidden',
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 rounded-full shrink-0 shadow-md hover:shadow-lg transition-all"
                disabled={sending || !input.trim()}
              >
                {sending ? (
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </Button>
            </form>

            {error ? (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
