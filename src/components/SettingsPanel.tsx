'use client';

import { useState, useEffect } from 'react';
import styles from './SettingsPanel.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsState {
  apiUrl: string;
  apiKey: string;
  platform: string;
  userContext: string;
}

export default function SettingsPanel({ isOpen, onClose }: Props) {
  const [settings, setSettings] = useState<SettingsState>({
    apiUrl: '',
    apiKey: '',
    platform: '',
    userContext: '',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus('');
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setSettings({
              apiUrl: data.settings.apiUrl || '',
              apiKey: '',
              platform: data.settings.platform || '',
              userContext: data.settings.userContext || '',
            });
          }
        })
        .catch(() => setStatus('Failed to load settings'));
    }
  }, [isOpen]);

  async function handleSave() {
    setSaving(true);
    setStatus('');

    try {
      const updates: Record<string, string> = {};
      if (settings.apiUrl) updates.apiUrl = settings.apiUrl;
      if (settings.apiKey) updates.apiKey = settings.apiKey;
      if (settings.platform) updates.platform = settings.platform;
      if (settings.userContext) updates.userContext = settings.userContext;

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.error) {
        setStatus(data.error);
      } else {
        setStatus('Settings saved');
        setSettings((prev) => ({ ...prev, apiKey: '' }));
      }
    } catch {
      setStatus('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>API Settings</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.form}>
          <label className={styles.label}>
            API Endpoint URL
            <input
              type="text"
              className={styles.input}
              value={settings.apiUrl}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, apiUrl: e.target.value }))
              }
              placeholder="https://...execute-api.../dev/chat?flow_name=prompt-only-flow"
            />
          </label>

          <label className={styles.label}>
            API Key
            <input
              type="password"
              className={styles.input}
              value={settings.apiKey}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              placeholder="Enter new API key (leave blank to keep current)"
            />
          </label>

          <label className={styles.label}>
            Platform (x-platform header)
            <input
              type="text"
              className={styles.input}
              value={settings.platform}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, platform: e.target.value }))
              }
              placeholder="adhoc"
            />
          </label>

          <label className={styles.label}>
            User Context (user_context field)
            <input
              type="text"
              className={styles.input}
              value={settings.userContext}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, userContext: e.target.value }))
              }
              placeholder="Senlik.Cihangir"
            />
          </label>

          {status && (
            <div
              className={`${styles.status} ${status.includes('Failed') ? styles.error : styles.success}`}
            >
              {status}
            </div>
          )}

          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
