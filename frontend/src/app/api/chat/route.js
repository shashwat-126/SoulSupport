import { NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/server-auth';

export const runtime = 'nodejs';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS = [
  'google/gemma-2-9b-it:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
];
const HISTORY_LIMIT = 15;
const THERAPIST_LIMIT = 12;
const OPENROUTER_TIMEOUT_MS = 30000;
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || null;
const FALLBACK_MESSAGE =
  'I am having trouble reaching the AI service right now. I can still help with your appointments and therapists if you ask that directly, or you can try again in a moment.';
const UPCOMING_SESSION_STATUSES = new Set(['pending', 'confirmed']);
const ENDED_SESSION_STATUSES = new Set([
  'cancelled_by_user',
  'cancelled_by_therapist',
  'expired',
]);
const SUPPORTED_CHAT_USER_TYPES = new Set(['user', 'therapist']);

const memoryStore = globalThis.__soulSupportChatMemory || new Map();
globalThis.__soulSupportChatMemory = memoryStore;

async function callN8nFallback(userMessage, userId, userName) {
  if (!N8N_WEBHOOK_URL) return null;
  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: userMessage, userId, username: userName || 'User' }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.reply || data?.output || data?.message || null;
  } catch {
    return null;
  }
}

function logChatRouteError(context, error) {
  console.error(`[chat route] ${context}`, error);
}

function logChatRouteWarning(context, error) {
  console.warn(`[chat route] ${context}`, error);
}

function getBearerToken(request) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7).trim();
}

function getApiBaseUrl() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

function getUserKey(user) {
  return String(user?._id || user?.id || user?.email || 'anonymous');
}

async function fetchBackendJson(path, token) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl || !token) return null;

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    logChatRouteWarning(`Failed backend fetch for ${path}`, error);
    return null;
  }
}

function extractSessions(payload) {
  const sessions = payload?.data?.sessions;
  return Array.isArray(sessions) ? sessions : [];
}

function extractTherapists(payload) {
  const therapists = payload?.data?.therapists;
  return Array.isArray(therapists) ? therapists : [];
}

function getHistory(userKey) {
  const history = memoryStore.get(userKey);
  return Array.isArray(history) ? history : [];
}

function toReadableDate(dateValue) {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dedupeNames(names) {
  return [...new Set(names.filter(Boolean).map((name) => String(name).trim()))];
}

function summarizeSessions(sessions, therapistNameMap, limit = 8) {
  return sessions.slice(0, limit).map((s) => {
    const therapistName = s?.therapist?.name || therapistNameMap.get(String(s.therapistId)) || 'Therapist';
    return `- ${toReadableDate(s.sessionDate)} with ${therapistName} (${s.status})`;
  });
}

function summarizeHistory(history) {
  return history.map((m) => {
    const speaker = m.role === 'assistant' ? 'Assistant' : 'User';
    const clipped = String(m.message || '').replace(/\s+/g, ' ').trim().slice(0, 220);
    return `- ${speaker}: ${clipped}`;
  });
}

function getSessionDisplayName(session, userType, therapistNameMap) {
  if (userType === 'therapist') {
    return session?.user?.name || session?.user?.email || 'Client';
  }

  return session?.therapist?.name || therapistNameMap.get(String(session?.therapistId)) || 'Therapist';
}

function detectIntent(userMessage) {
  const normalized = userMessage.toLowerCase();

  if (/who are (the )?therapists|list (all )?therapists|available therapists|show therapists/.test(normalized)) {
    return 'THERAPIST_LIST';
  }

  if (
    /show my appointments|show my upcoming appointments|list my appointments|upcoming appointments|upcoming sessions|my sessions|do i have (any )?(sessions|appointments)|my (bookings|schedule)/.test(
      normalized
    )
  ) {
    return 'APPOINTMENTS';
  }

  if (/show my pending session requests|pending session requests|pending requests/.test(normalized)) {
    return 'THERAPIST_PENDING_REQUESTS';
  }

  if (/who is my therapist tomorrow|therapist tomorrow|session tomorrow/.test(normalized)) {
    return 'THERAPIST_TOMORROW';
  }

  if (/who is my client tomorrow|client tomorrow|my schedule tomorrow/.test(normalized)) {
    return 'CLIENT_TOMORROW';
  }

  if (/what(?:'?s| is) my name|who am i/.test(normalized)) {
    return 'WHO_AM_I';
  }

  if (/my (profile|account|info|information|details)|tell me about (my|myself)|what do you know about me/.test(normalized)) {
    return 'MY_INFO';
  }

  return null;
}

function buildIntentReply(intent, context) {
  if (!intent) return null;

  if (intent === 'WHO_AM_I') {
    return `Your name is ${context.userName}. Your account email is ${context.userEmail}.`;
  }

  if (intent === 'MY_INFO') {
    const upcomingCount = context.upcomingSessions.length;
    const lines = [
      `Here's what I know about you:`,
      `- Name: ${context.userName}`,
      `- Email: ${context.userEmail}`,
      `- Account type: ${context.userType}`,
      `- Upcoming appointments: ${upcomingCount > 0 ? upcomingCount : 'none'}`,
    ];
    if (upcomingCount > 0) {
      context.upcomingSessions.slice(0, 3).forEach((s) => {
        const name = getSessionDisplayName(s, context.userType, context.therapistNameMap);
        lines.push(`  • ${toReadableDate(s.sessionDate)} with ${name} (${s.status})`);
      });
    }
    return lines.join('\n');
  }

  if (intent === 'THERAPIST_LIST') {
    if (!context.therapists.length) {
      return 'I could not find therapists available right now. Please check the Therapists page in your dashboard.';
    }

    const list = context.therapists.slice(0, THERAPIST_LIMIT).map((therapist, idx) => {
      const title = therapist.specializations?.length
        ? `${therapist.fullName} - ${therapist.specializations.slice(0, 2).join(', ')}`
        : therapist.fullName;
      return `${idx + 1}. ${title}`;
    });

    return [
      'Here are the therapists currently available on the platform:',
      ...list,
      '',
      'You can open the Therapists page to view full profiles and book a session.',
    ].join('\n');
  }

  if (intent === 'APPOINTMENTS') {
    if (!context.upcomingSessions.length) {
      return context.userType === 'therapist'
        ? 'You currently have no upcoming client sessions.'
        : 'You currently have no upcoming appointments. You can book one from Dashboard > Therapists.';
    }

    const lines = context.upcomingSessions.slice(0, 8).map((s, idx) => {
      const participantName = getSessionDisplayName(s, context.userType, context.therapistNameMap);
      return `${idx + 1}. ${toReadableDate(s.sessionDate)} with ${participantName} (${s.status})`;
    });

    return [context.userType === 'therapist' ? 'Your upcoming client sessions:' : 'Your upcoming appointments:', ...lines].join('\n');
  }

  if (intent === 'THERAPIST_PENDING_REQUESTS') {
    if (context.userType !== 'therapist') {
      return 'Pending session requests are only available on therapist accounts.';
    }

    if (!context.pendingSessions.length) {
      return 'You do not have any pending session requests right now.';
    }

    const lines = context.pendingSessions.slice(0, 8).map((session, idx) => {
      const clientName = getSessionDisplayName(session, context.userType, context.therapistNameMap);
      return `${idx + 1}. ${toReadableDate(session.sessionDate)} with ${clientName}`;
    });

    return ['Your pending session requests:', ...lines].join('\n');
  }

  if (intent === 'THERAPIST_TOMORROW') {
    if (context.userType !== 'user') {
      return null;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toDateString();
    const tomorrowSessions = context.upcomingSessions.filter(
      (s) => new Date(s.sessionDate).toDateString() === tomorrowDate
    );

    if (!tomorrowSessions.length) {
      return 'You do not have a session scheduled for tomorrow.';
    }

    const therapistNames = dedupeNames(
      tomorrowSessions.map(
        (s) => s?.therapist?.name || context.therapistNameMap.get(String(s.therapistId)) || 'Therapist'
      )
    );

    return `Your therapist${therapistNames.length > 1 ? 's' : ''} tomorrow: ${therapistNames.join(', ')}.`;
  }

  if (intent === 'CLIENT_TOMORROW') {
    if (context.userType !== 'therapist') {
      return null;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toDateString();
    const tomorrowSessions = context.upcomingSessions.filter(
      (s) => new Date(s.sessionDate).toDateString() === tomorrowDate
    );

    if (!tomorrowSessions.length) {
      return 'You do not have any client sessions scheduled for tomorrow.';
    }

    const clientNames = dedupeNames(
      tomorrowSessions.map((s) => getSessionDisplayName(s, context.userType, context.therapistNameMap))
    );

    return `Your client${clientNames.length > 1 ? 's' : ''} tomorrow: ${clientNames.join(', ')}.`;
  }

  return null;
}

async function buildUserContext(user) {
  const now = new Date();
  const token = user.__accessToken || null;

  const [sessionsPayload, therapistsPayload] = await Promise.all([
    fetchBackendJson(`/sessions?limit=40`, token),
    fetchBackendJson(`/therapists?limit=${THERAPIST_LIMIT}`, token),
  ]);

  const allSessions = extractSessions(sessionsPayload);
  const therapists = extractTherapists(therapistsPayload);

  const upcomingSessions = allSessions
    .filter((s) => UPCOMING_SESSION_STATUSES.has(s?.status) && new Date(s?.sessionDate) >= now)
    .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate))
    .slice(0, 8);

  const pendingSessions = allSessions
    .filter((s) => s?.status === 'pending' && new Date(s?.sessionDate) >= now)
    .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate))
    .slice(0, 8);

  const cancelledSessions = allSessions
    .filter((s) => ENDED_SESSION_STATUSES.has(s?.status))
    .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate))
    .slice(0, 8);

  const userKey = getUserKey(user);
  const recentHistory = getHistory(userKey).slice(-HISTORY_LIMIT);

  const therapistNameMap = new Map(
    therapists
      .map((t) => {
        const id = String(t._id || t.id || t.userId || '');
        if (!id) return null;
        return [id, t.user?.fullName || t.fullName || t.name || 'Therapist'];
      })
      .filter(Boolean)
  );

  const therapistDirectory = therapists.map((t) => ({
    fullName: t.user?.fullName || t.fullName || t.name || 'Therapist',
    email: t.user?.email || t.email || '',
    specializations: Array.isArray(t.specializations) ? t.specializations : [],
    bio: t.user?.bio || t.bio || '',
  }));

  const upcomingSummary = summarizeSessions(upcomingSessions, therapistNameMap);
  const cancelledSummary = summarizeSessions(cancelledSessions, therapistNameMap);

  const therapistSummary = therapistDirectory.map((t) => {
    const tags = t.specializations?.length ? ` (${t.specializations.slice(0, 2).join(', ')})` : '';
    return `- ${t.fullName}${tags}`;
  });

  const historySummary = summarizeHistory(recentHistory.slice().reverse());

  const platformCapabilities = [
    'Browse therapists and view profiles',
    'Book, reschedule, and cancel appointments',
    'View upcoming and cancelled sessions',
    'Participate in community forum and resources',
    'Manage profile and account settings',
  ];

  return {
    userType: user.userType,
    userName: user.fullName,
    userEmail: user.email,
    upcomingSessions,
    pendingSessions,
    cancelledSessions,
    chatHistory: recentHistory.slice().reverse(),
    therapists: therapistDirectory,
    therapistNameMap,
    platformCapabilities,
    text: [
      `User profile: ${user.fullName} (${user.email}), role: ${user.userType}.`,
      `User name: ${user.fullName}`,
      `User email: ${user.email}`,
      `Upcoming sessions (${upcomingSessions.length}):`,
      ...(upcomingSummary.length ? upcomingSummary : ['- none']),
      `Cancelled/expired sessions (${cancelledSessions.length}):`,
      ...(cancelledSummary.length ? cancelledSummary : ['- none']),
      `Therapists on platform (${therapistSummary.length}):`,
      ...(therapistSummary.length ? therapistSummary : ['- none']),
      `Recent chat history (${recentHistory.length}):`,
      ...(historySummary.length ? historySummary : ['- none']),
      'Platform capabilities:',
      ...platformCapabilities.map((capability) => `- ${capability}`),
      'Do not provide medical diagnosis, prescriptions, or emergency crisis instructions beyond recommending professional/emergency support when needed.',
    ].join('\n'),
  };
}

function buildSystemMessage(contextText) {
  return [
    'You are SoulSupport AI, a personalized assistant for this mental health support platform.',
    'Help users with emotional wellbeing, therapy related questions, and platform usage.',
    'Be supportive, empathetic, clear, and practical.',
    'Always personalize the response using the provided user profile and platform data.',
    'When listing appointments or therapists, format with short headings and numbered bullets.',
    'Do not give medical diagnoses, medication instructions, or claims of being a licensed clinician.',
    'If user describes immediate danger or self-harm intent, advise contacting emergency services or local crisis hotline immediately.',
    'When asked about appointments, cancellations, therapist schedule, or account activity, rely only on the provided user context.',
    'If details are missing, say what is missing and suggest the exact dashboard path to check.',
    '',
    'User Context:',
    contextText,
  ].join('\n');
}

function maybeHandleSmartIntent(userMessage, context) {
  const normalized = userMessage.toLowerCase();

  if (/how do i cancel my session|cancel my session|cancel appointment/.test(normalized)) {
    return context.userType === 'therapist'
      ? 'To cancel a client session: open Therapist Dashboard > Sessions, choose the booking, click cancel, and provide a cancellation reason when prompted.'
      : 'To cancel a session: open Dashboard > Sessions, find the booking, click cancel, and add a reason if prompted. If cancellation is blocked near start time, contact support through Resources or your therapist in advance.';
  }

  if (/stress relief tips|anxiety tips|calm down/.test(normalized)) {
    return [
      'Here are quick stress-relief steps you can use right now:',
      '1. Breathe slowly: inhale 4 sec, hold 4 sec, exhale 6 sec for 2 minutes.',
      '2. Grounding: name 5 things you see, 4 feel, 3 hear, 2 smell, 1 taste.',
      '3. Body reset: unclench jaw, drop shoulders, stretch neck for 60 seconds.',
      '4. Reduce overload: pick one small next task and do only that for 10 minutes.',
      '5. If this feels persistent, schedule a therapist session from your dashboard for personalized support.',
    ].join('\n');
  }

  if (context.userType === 'therapist' && /how do i manage my schedule|manage my schedule|schedule tips/.test(normalized)) {
    return [
      'To manage your schedule effectively:',
      '1. Open Therapist Dashboard > Sessions to review pending and confirmed bookings.',
      '2. Confirm pending requests quickly so clients know their slot is secured.',
      '3. Keep your availability updated in Therapist Dashboard > Profile.',
      '4. If you need to cancel, provide a clear reason so the client gets proper context.',
    ].join('\n');
  }

  return null;
}

async function saveMessage(userId, role, message) {
  if (!message?.trim()) return;
  const history = getHistory(userId);
  history.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    message: message.trim(),
    timestamp: new Date(),
  });
  if (history.length > HISTORY_LIMIT * 4) {
    history.splice(0, history.length - HISTORY_LIMIT * 4);
  }
  memoryStore.set(userId, history);
}

export async function GET(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!SUPPORTED_CHAT_USER_TYPES.has(auth.user.userType)) {
    return NextResponse.json({ error: 'Chatbot is not available for this account type' }, { status: 403 });
  }

  const userKey = getUserKey(auth.user);
  const messages = getHistory(userKey).slice(-HISTORY_LIMIT);

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      message: m.message,
      timestamp: m.timestamp,
    })),
  });
}

export async function POST(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!SUPPORTED_CHAT_USER_TYPES.has(auth.user.userType)) {
    return NextResponse.json({ error: 'Chatbot is not available for this account type' }, { status: 403 });
  }

  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterApiKey) {
    return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY on server' }, { status: 500 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    logChatRouteWarning('Invalid request JSON payload', error);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const userMessage = String(payload?.message || '').trim();
  if (!userMessage) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  if (userMessage.length > 2000) {
    return NextResponse.json({ error: 'Message is too long (max 2000 characters)' }, { status: 400 });
  }

  const token = getBearerToken(request);
  const user = {
    ...auth.user,
    __accessToken: token,
  };

  const userKey = getUserKey(user);
  const recentHistory = getHistory(userKey).slice(-HISTORY_LIMIT);

  await saveMessage(userKey, 'user', userMessage);

  const context = await buildUserContext(user);
  const intent = detectIntent(userMessage);
  const intentReply = buildIntentReply(intent, context);

  if (intentReply) {
    await saveMessage(userKey, 'assistant', intentReply);
    return NextResponse.json({
      message: intentReply,
      streamed: false,
      source: 'intent-db',
    });
  }

  const smartReply = maybeHandleSmartIntent(userMessage, context);

  if (smartReply) {
    await saveMessage(userKey, 'assistant', smartReply);
    return NextResponse.json({
      message: smartReply,
      streamed: false,
      source: 'smart-intent',
    });
  }

  const llmMessages = [
    { role: 'system', content: buildSystemMessage(context.text) },
    ...recentHistory
      .reverse()
      .map((m) => ({ role: m.role, content: m.message }))
      .filter((m) => m.content),
    { role: 'user', content: userMessage },
  ];

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), OPENROUTER_TIMEOUT_MS);

  let openRouterResponse;
  try {
    openRouterResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'SoulSupport Dashboard Assistant',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODELS[0],
        messages: llmMessages,
        stream: true,
        temperature: 0.5,
        max_tokens: 700,
      }),
      signal: abortController.signal,
    });
  } catch (error) {
    logChatRouteError('OpenRouter request failed', error);
    const n8nReply = await callN8nFallback(userMessage, userKey, user.fullName);
    const reply = n8nReply || FALLBACK_MESSAGE;
    await saveMessage(userKey, 'assistant', reply);
    return NextResponse.json({ message: reply, streamed: false, source: n8nReply ? 'n8n-fallback' : 'fallback' });
  } finally {
    clearTimeout(timeout);
  }

  if (!openRouterResponse.ok || !openRouterResponse.body) {
    const errorBody = await openRouterResponse.text().catch(() => '');
    logChatRouteWarning(`OpenRouter non-OK response: ${openRouterResponse.status}`, errorBody);
    const n8nReply = await callN8nFallback(userMessage, userKey, user.fullName);
    const reply = n8nReply || FALLBACK_MESSAGE;
    await saveMessage(userKey, 'assistant', reply);
    return NextResponse.json({ message: reply, streamed: false, source: n8nReply ? 'n8n-fallback' : 'fallback' });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = openRouterResponse.body.getReader();

  let assistantText = '';
  let buffer = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let providerDone = false;
        while (true) {
          if (providerDone) break;
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) {
              continue;
            }

            const data = trimmed.slice(5).trim();
            if (!data) {
              continue;
            }

            if (data === '[DONE]') {
              providerDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const token = parsed?.choices?.[0]?.delta?.content || '';
              if (token) {
                assistantText += token;
                controller.enqueue(encoder.encode(token));
              }
            } catch (error) {
              logChatRouteWarning('Failed to parse streamed provider chunk', error);
            }
          }
        }

        // Flush any remaining bytes from the decoder.
        buffer += decoder.decode();
        if (buffer.includes('data:')) {
          const trailingLine = buffer.trim();
          const trailingData = trailingLine.startsWith('data:') ? trailingLine.slice(5).trim() : '';
          if (trailingData && trailingData !== '[DONE]') {
            try {
              const parsed = JSON.parse(trailingData);
              const token = parsed?.choices?.[0]?.delta?.content || '';
              if (token) {
                assistantText += token;
                controller.enqueue(encoder.encode(token));
              }
            } catch (error) {
              logChatRouteWarning('Failed to parse trailing streamed provider chunk', error);
            }
          }
        }

        if (!assistantText.trim()) {
          const n8nReply = await callN8nFallback(userMessage, userKey, user.fullName);
          const finalMessage = n8nReply || FALLBACK_MESSAGE;
          await saveMessage(userKey, 'assistant', finalMessage);
          controller.enqueue(encoder.encode(finalMessage));
        } else {
          await saveMessage(userKey, 'assistant', assistantText.trim());
        }

        controller.close();
      } catch {
        if (!assistantText.trim()) {
          try {
            const n8nReply = await callN8nFallback(userMessage, userKey, user.fullName);
            const finalMessage = n8nReply || FALLBACK_MESSAGE;
            await saveMessage(userKey, 'assistant', finalMessage);
            controller.enqueue(encoder.encode(finalMessage));
          } catch (enqueueError) {
            logChatRouteWarning('Failed to enqueue fallback response token', enqueueError);
          }
        } else {
          await saveMessage(userKey, 'assistant', assistantText.trim());
        }
        controller.close();
      } finally {
        try {
          await reader.cancel();
        } catch (cancelError) {
          logChatRouteWarning('Failed to cancel streamed response reader', cancelError);
        }
      }
    },
    async cancel() {
      try {
        await reader.cancel();
      } catch (cancelError) {
        logChatRouteWarning('Failed to cancel stream during consumer shutdown', cancelError);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
