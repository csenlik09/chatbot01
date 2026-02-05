import fs from 'fs';
import path from 'path';
import type { AppData, Conversation, Project, Message, ApiSettings } from './types';

const DATA_DIR = process.env.DATA_DIR || (process.env.NODE_ENV === 'production' ? '/data' : './data');
const DATA_FILE = path.join(DATA_DIR, 'chatbot-data.json');
const MAX_MESSAGES_PER_CONVERSATION = 100;

const DEFAULT_SETTINGS: ApiSettings = {
  apiUrl: 'https://95tw6665.execute-api.us-east-2.amazonaws.com/dev/chat?flow_name=prompt-only-flow',
  apiKey: '',
  platform: 'adhoc',
  userContext: 'user',
};

// In-memory cache attached to globalThis for HMR safety
const g = globalThis as typeof globalThis & { __appData?: AppData };

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readData(): AppData {
  if (g.__appData) return g.__appData;

  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const initial: AppData = {
      settings: { ...DEFAULT_SETTINGS },
      projects: [],
      conversations: [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    g.__appData = initial;
    return initial;
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(raw) as AppData;
  g.__appData = data;
  return data;
}

function writeData(data: AppData): void {
  ensureDataDir();
  g.__appData = data;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Settings ---

export function getSettings(): ApiSettings {
  const data = readData();
  return data.settings;
}

export function updateSettings(updates: Partial<ApiSettings>): ApiSettings {
  const data = readData();
  if (updates.apiUrl !== undefined) data.settings.apiUrl = updates.apiUrl;
  if (updates.apiKey !== undefined) data.settings.apiKey = updates.apiKey;
  if (updates.platform !== undefined) data.settings.platform = updates.platform;
  if (updates.userContext !== undefined) data.settings.userContext = updates.userContext;
  writeData(data);
  return data.settings;
}

// --- Conversations ---

export function listConversations(): Omit<Conversation, 'messages'>[] {
  const data = readData();
  return data.conversations
    .map(({ messages: _messages, ...rest }) => rest)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): Conversation | null {
  const data = readData();
  return data.conversations.find((c) => c.id === id) || null;
}

export function createConversation(projectId: string | null): Conversation {
  const data = readData();
  const now = Date.now();
  const conv: Conversation = {
    id: crypto.randomUUID(),
    projectId,
    title: 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  data.conversations.push(conv);
  writeData(data);
  return conv;
}

export function deleteConversation(id: string): boolean {
  const data = readData();
  const idx = data.conversations.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  data.conversations.splice(idx, 1);
  writeData(data);
  return true;
}

export function addMessageToConversation(conversationId: string, message: Message): void {
  const data = readData();
  const conv = data.conversations.find((c) => c.id === conversationId);
  if (!conv) return;

  conv.messages.push(message);
  conv.updatedAt = Date.now();

  // Auto-generate title from first user message
  if (conv.title === 'New Chat' && message.role === 'user') {
    conv.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
  }

  // Cap messages
  if (conv.messages.length > MAX_MESSAGES_PER_CONVERSATION) {
    const first = conv.messages[0];
    conv.messages = [first, ...conv.messages.slice(-(MAX_MESSAGES_PER_CONVERSATION - 1))];
  }

  writeData(data);
}

export function updateConversation(
  id: string,
  updates: { title?: string; projectId?: string | null }
): Conversation | null {
  const data = readData();
  const conv = data.conversations.find((c) => c.id === id);
  if (!conv) return null;

  if (updates.title !== undefined) conv.title = updates.title;
  if (updates.projectId !== undefined) conv.projectId = updates.projectId;
  conv.updatedAt = Date.now();
  writeData(data);
  return conv;
}

// --- Projects ---

export function listProjects(): Project[] {
  const data = readData();
  return [...data.projects].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(id: string): Project | null {
  const data = readData();
  return data.projects.find((p) => p.id === id) || null;
}

export function createProject(name: string): Project {
  const data = readData();
  const now = Date.now();
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    instructions: '',
    createdAt: now,
    updatedAt: now,
  };
  data.projects.push(project);
  writeData(data);
  return project;
}

export function updateProject(
  id: string,
  updates: { name?: string; instructions?: string }
): Project | null {
  const data = readData();
  const project = data.projects.find((p) => p.id === id);
  if (!project) return null;

  if (updates.name !== undefined) project.name = updates.name;
  if (updates.instructions !== undefined) project.instructions = updates.instructions;
  project.updatedAt = Date.now();
  writeData(data);
  return project;
}

export function deleteProject(id: string): boolean {
  const data = readData();
  const idx = data.projects.findIndex((p) => p.id === id);
  if (idx === -1) return false;

  // Ungroup all conversations in this project
  for (const conv of data.conversations) {
    if (conv.projectId === id) {
      conv.projectId = null;
    }
  }

  data.projects.splice(idx, 1);
  writeData(data);
  return true;
}

export function getProjectInstructions(projectId: string): string {
  const data = readData();
  const project = data.projects.find((p) => p.id === projectId);
  return project?.instructions || '';
}
