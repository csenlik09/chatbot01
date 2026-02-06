import { NextRequest, NextResponse } from 'next/server';
import { exportAllData, importAllData } from '@/lib/dataStore';

export async function GET() {
  try {
    const data = exportAllData();
    const json = JSON.stringify(data, null, 2);
    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="chatbot-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error('Backup export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    importAllData(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Backup import error:', error);
    const message = error instanceof Error ? error.message : 'Invalid backup file';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
