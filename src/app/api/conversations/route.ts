import { NextRequest, NextResponse } from 'next/server';
import { listConversations, createConversation } from '@/lib/dataStore';

export async function GET() {
  try {
    const conversations = listConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = typeof body.projectId === 'string' ? body.projectId : null;
    const conversation = createConversation(projectId);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
