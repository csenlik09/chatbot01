export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  projectId: string | null;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  instructions: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiSettings {
  apiUrl: string;
  apiKey: string;
  platform: string;
  userContext: string;
}

export interface AppData {
  settings: ApiSettings;
  projects: Project[];
  conversations: Conversation[];
}

export interface ChatRequest {
  message: string;
  conversationId: string;
}

export interface ChatResponse {
  message: Message;
  error?: string;
}

export interface SettingsResponse {
  settings: ApiSettings;
  error?: string;
}

export interface ExternalApiRequest {
  query: string;
  user_context: string;
}

export interface ExternalApiResponse {
  answer: string;
  flow_id?: string;
  flow_alias_id?: string;
}
