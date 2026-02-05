import { Message, ApiSettings, ExternalApiResponse } from './types';

const MAX_CONTEXT_CHARS = 6000;

export function buildContextualQuery(
  currentMessage: string,
  history: Message[]
): string {
  if (history.length === 0) return currentMessage;

  const lines = history.map(
    (m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  );

  // Trim oldest messages if context exceeds character budget
  let context = lines.join('\n');
  while (context.length > MAX_CONTEXT_CHARS && lines.length > 2) {
    lines.shift();
    context = lines.join('\n');
  }

  return `[Conversation History]\n${context}\n\n[Current Message]\n${currentMessage}`;
}

export async function sendChatMessage(
  query: string,
  settings: ApiSettings
): Promise<ExternalApiResponse> {
  const url = settings.apiUrl;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'x-platform': settings.platform,
    },
    body: JSON.stringify({
      query,
      user_context: settings.userContext,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API responded with status ${response.status}: ${text}`);
  }

  return response.json();
}
