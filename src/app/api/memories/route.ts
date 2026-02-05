import { NextRequest, NextResponse } from 'next/server';
import { listMemories, addMemory, deleteMemory } from '@/lib/dataStore';

export async function GET() {
  try {
    const memories = listMemories();
    return NextResponse.json(memories);
  } catch (error) {
    console.error('List memories error:', error);
    return NextResponse.json({ error: 'Failed to list memories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ error: 'Memory content is required' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: 'Memory must be 500 characters or less' }, { status: 400 });
    }
    const memory = addMemory(content);
    return NextResponse.json(memory);
  } catch (error) {
    console.error('Add memory error:', error);
    return NextResponse.json({ error: 'Failed to add memory' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing memory id' }, { status: 400 });
    }
    const deleted = deleteMemory(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete memory error:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
