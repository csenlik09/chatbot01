'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [backupStatus, setBackupStatus] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleDownloadBackup() {
    setBackupStatus('');
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatbot-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus('Backup downloaded');
    } catch {
      setBackupStatus('Failed to download backup');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowRestoreConfirm(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleConfirmRestore() {
    if (!pendingFile) return;
    setRestoring(true);
    setBackupStatus('');
    setShowRestoreConfirm(false);
    try {
      const text = await pendingFile.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setBackupStatus(result.error || 'Restore failed');
      } else {
        setBackupStatus('Data restored. Reload the page to see changes.');
      }
    } catch {
      setBackupStatus('Failed to restore: invalid JSON file');
    } finally {
      setRestoring(false);
      setPendingFile(null);
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

          <div className={styles.divider} />
          <h3 className={styles.sectionTitle}>Backup & Restore</h3>
          <p className={styles.sectionDescription}>
            Download a backup of all your data or restore from a previous backup.
          </p>
          <div className={styles.backupButtons}>
            <button className={styles.backupButton} onClick={handleDownloadBackup}>
              Download Backup
            </button>
            <button
              className={styles.backupButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
            >
              {restoring ? 'Restoring...' : 'Restore from Backup'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {showRestoreConfirm && (
            <div className={styles.confirmBox}>
              <p>This will replace ALL your current data (settings, conversations, projects, memories). This cannot be undone.</p>
              <div className={styles.confirmActions}>
                <button className={styles.confirmButton} onClick={handleConfirmRestore}>
                  Yes, Restore
                </button>
                <button className={styles.cancelButton} onClick={() => { setShowRestoreConfirm(false); setPendingFile(null); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {backupStatus && (
            <div className={`${styles.status} ${backupStatus.includes('Failed') || backupStatus.includes('invalid') ? styles.error : styles.success}`}>
              {backupStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
