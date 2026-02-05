import { NextRequest, NextResponse } from 'next/server';
import {
  getConversation,
  addMessageToConversation,
  getSettings,
  getProjectInstructions,
} from '@/lib/dataStore';
import { buildContextualQuery, sendChatMessage } from '@/lib/apiClient';
import { sanitizeInput, isValidMessage } from '@/utils/sanitize';
import type { Message, ChatResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message: rawMessage, conversationId } = body;

    if (typeof conversationId !== 'string' || !conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId.' } as ChatResponse,
        { status: 400 }
      );
    }

    if (typeof rawMessage !== 'string' || !isValidMessage(rawMessage)) {
      return NextResponse.json(
        { error: 'Invalid message. Must be 1-2000 characters.' } as ChatResponse,
        { status: 400 }
      );
    }

    const message = sanitizeInput(rawMessage);

    const conversation = getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found.' } as ChatResponse,
        { status: 404 }
      );
    }

    const settings = getSettings();
    if (!settings.apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Open Settings to set your API key.' } as ChatResponse,
        { status: 400 }
      );
    }

    // Store user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    addMessageToConversation(conversationId, userMessage);

    // Build context with project instructions
    const priorHistory = conversation.messages;
    let projectInstructions = '';
    if (conversation.projectId) {
      projectInstructions = getProjectInstructions(conversation.projectId);
    }
    const query = buildContextualQuery(message, priorHistory, projectInstructions);
    const apiResponse = await sendChatMessage(query, settings);

    // Store assistant response
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: apiResponse.answer,
      timestamp: Date.now(),
    };
    addMessageToConversation(conversationId, assistantMessage);

    return NextResponse.json({ message: assistantMessage } as ChatResponse);
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get response: ${errorMessage}` } as ChatResponse,
      { status: 500 }
    );
  }
}
