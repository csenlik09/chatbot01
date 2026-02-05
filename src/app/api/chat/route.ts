import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getOrCreateSession,
  addMessage,
  getMessages,
  getSettings,
} from '@/lib/sessionStore';
import { buildContextualQuery, sendChatMessage } from '@/lib/apiClient';
import { sanitizeInput, isValidMessage } from '@/utils/sanitize';
import type { Message, ChatResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Session management
    const cookieStore = await cookies();
    const existingSessionId = cookieStore.get('session_id')?.value;
    const session = getOrCreateSession(existingSessionId);

    // 2. Parse and validate input
    const body = await request.json();
    const rawMessage = body.message;
    if (typeof rawMessage !== 'string' || !isValidMessage(rawMessage)) {
      return NextResponse.json(
        { error: 'Invalid message. Must be 1-2000 characters.' } as ChatResponse,
        { status: 400 }
      );
    }
    const message = sanitizeInput(rawMessage);

    // 3. Check API settings
    const settings = getSettings(session.id);
    if (!settings.apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Open Settings to set your API key.' } as ChatResponse,
        { status: 400 }
      );
    }

    // 4. Store user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    addMessage(session.id, userMessage);

    // 5. Build context and call external API
    const history = getMessages(session.id);
    const priorHistory = history.slice(0, -1); // exclude current message
    const query = buildContextualQuery(message, priorHistory);
    const apiResponse = await sendChatMessage(query, settings);

    // 6. Store assistant response
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: apiResponse.answer,
      timestamp: Date.now(),
    };
    addMessage(session.id, assistantMessage);

    // 7. Return response with session cookie
    const response = NextResponse.json({ message: assistantMessage } as ChatResponse);
    if (existingSessionId !== session.id) {
      response.cookies.set('session_id', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get response: ${errorMessage}` } as ChatResponse,
      { status: 500 }
    );
  }
}
