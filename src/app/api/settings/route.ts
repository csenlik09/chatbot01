import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getOrCreateSession,
  getSettings,
  updateSettings,
} from '@/lib/sessionStore';
import type { SettingsResponse } from '@/lib/types';

function setSessionCookie(response: NextResponse, sessionId: string, existingId: string | undefined) {
  if (existingId !== sessionId) {
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60,
      path: '/',
    });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const existingSessionId = cookieStore.get('session_id')?.value;
    const session = getOrCreateSession(existingSessionId);

    const settings = getSettings(session.id);

    // Mask the API key for the frontend
    const maskedSettings = {
      ...settings,
      apiKey: settings.apiKey ? '••••' + settings.apiKey.slice(-4) : '',
    };

    const response = NextResponse.json({ settings: maskedSettings } as SettingsResponse);
    setSessionCookie(response, session.id, existingSessionId);
    return response;
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' } as SettingsResponse,
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const existingSessionId = cookieStore.get('session_id')?.value;
    const session = getOrCreateSession(existingSessionId);

    const body = await request.json();
    const updates: Record<string, string> = {};

    if (typeof body.apiUrl === 'string') updates.apiUrl = body.apiUrl.trim();
    if (typeof body.apiKey === 'string') updates.apiKey = body.apiKey.trim();
    if (typeof body.platform === 'string') updates.platform = body.platform.trim();
    if (typeof body.userContext === 'string') updates.userContext = body.userContext.trim();

    const settings = updateSettings(session.id, updates);

    // Mask the API key for the response
    const maskedSettings = {
      ...settings,
      apiKey: settings.apiKey ? '••••' + settings.apiKey.slice(-4) : '',
    };

    const response = NextResponse.json({ settings: maskedSettings } as SettingsResponse);
    setSessionCookie(response, session.id, existingSessionId);
    return response;
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' } as SettingsResponse,
      { status: 500 }
    );
  }
}
