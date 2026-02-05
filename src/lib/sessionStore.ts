import { Session, Message, ApiSettings } from './types';

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_SESSIONS = 1000;
const MAX_MESSAGES_PER_SESSION = 100;

const DEFAULT_SETTINGS: ApiSettings = {
  apiUrl: process.env.CHAT_API_URL || 'https://95tw6665.execute-api.us-east-2.amazonaws.com/dev/chat?flow_name=prompt-only-flow',
  apiKey: process.env.CHAT_API_KEY || '',
  platform: process.env.CHAT_API_PLATFORM || 'adhoc',
  userContext: process.env.CHAT_USER_CONTEXT || 'user',
};

// Attach to globalThis for HMR safety in dev mode
const globalForSessions = globalThis as typeof globalThis & {
  __sessions?: Map<string, Session>;
};
const sessions = globalForSessions.__sessions ?? new Map<string, Session>();
globalForSessions.__sessions = sessions;

function cleanup(): void {
  const now = Date.now();

  // Evict expired sessions
  for (const [id, session] of sessions) {
    if (now - session.lastAccessedAt > SESSION_TTL) {
      sessions.delete(id);
    }
  }

  // If still over limit, evict oldest by lastAccessedAt
  if (sessions.size > MAX_SESSIONS) {
    const sorted = [...sessions.entries()].sort(
      (a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt
    );
    const toRemove = sorted.slice(0, sessions.size - MAX_SESSIONS);
    for (const [id] of toRemove) {
      sessions.delete(id);
    }
  }
}

export function getOrCreateSession(sessionId: string | undefined): Session {
  cleanup();

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    session.lastAccessedAt = Date.now();
    return session;
  }

  const newSession: Session = {
    id: crypto.randomUUID(),
    messages: [],
    settings: { ...DEFAULT_SETTINGS },
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  };
  sessions.set(newSession.id, newSession);
  return newSession;
}

export function addMessage(sessionId: string, message: Message): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.messages.push(message);
  session.lastAccessedAt = Date.now();

  // Cap messages: keep first message + most recent ones
  if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
    const first = session.messages[0];
    session.messages = [first, ...session.messages.slice(-(MAX_MESSAGES_PER_SESSION - 1))];
  }
}

export function getMessages(sessionId: string): Message[] {
  const session = sessions.get(sessionId);
  return session ? session.messages : [];
}

export function getSettings(sessionId: string): ApiSettings {
  const session = sessions.get(sessionId);
  return session ? session.settings : { ...DEFAULT_SETTINGS };
}

export function updateSettings(sessionId: string, updates: Partial<ApiSettings>): ApiSettings {
  const session = sessions.get(sessionId);
  if (!session) return { ...DEFAULT_SETTINGS };

  if (updates.apiUrl !== undefined) session.settings.apiUrl = updates.apiUrl;
  if (updates.apiKey !== undefined) session.settings.apiKey = updates.apiKey;
  if (updates.platform !== undefined) session.settings.platform = updates.platform;
  if (updates.userContext !== undefined) session.settings.userContext = updates.userContext;
  session.lastAccessedAt = Date.now();

  return session.settings;
}

export function clearMessages(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.messages = [];
    session.lastAccessedAt = Date.now();
  }
}
