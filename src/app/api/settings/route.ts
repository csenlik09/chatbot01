import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/dataStore';
import type { SettingsResponse } from '@/lib/types';

export async function GET() {
  try {
    const settings = getSettings();
    const maskedSettings = {
      ...settings,
      apiKey: settings.apiKey ? '\u2022\u2022\u2022\u2022' + settings.apiKey.slice(-4) : '',
    };
    return NextResponse.json({ settings: maskedSettings } as SettingsResponse);
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
    const body = await request.json();
    const updates: Record<string, string> = {};

    if (typeof body.apiUrl === 'string') updates.apiUrl = body.apiUrl.trim();
    if (typeof body.apiKey === 'string') updates.apiKey = body.apiKey.trim();
    if (typeof body.platform === 'string') updates.platform = body.platform.trim();
    if (typeof body.userContext === 'string') updates.userContext = body.userContext.trim();

    const settings = updateSettings(updates);
    const maskedSettings = {
      ...settings,
      apiKey: settings.apiKey ? '\u2022\u2022\u2022\u2022' + settings.apiKey.slice(-4) : '',
    };

    return NextResponse.json({ settings: maskedSettings } as SettingsResponse);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' } as SettingsResponse,
      { status: 500 }
    );
  }
}
