export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  messages: Message[];
  settings: ApiSettings;
  createdAt: number;
  lastAccessedAt: number;
}

export interface ApiSettings {
  apiUrl: string;
  apiKey: string;
  platform: string;
  userContext: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  message: Message;
  error?: string;
}

export interface SettingsRequest {
  apiUrl?: string;
  apiKey?: string;
  platform?: string;
  userContext?: string;
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
