'use client';

import { useState, useEffect } from 'react';
import styles from './ProjectInstructionsModal.module.css';

interface Props {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectInstructionsModal({ projectId, isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (isOpen && projectId) {
      fetch(`/api/projects/${projectId}`)
        .then((res) => res.json())
        .then((data) => {
          setName(data.name || '');
          setInstructions(data.instructions || '');
        })
        .catch(() => setStatus('Failed to load project'));
    }
  }, [isOpen, projectId]);

  async function handleSave() {
    setSaving(true);
    setStatus('');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, instructions }),
      });
      if (!res.ok) throw new Error();
      setStatus('Saved');
    } catch {
      setStatus('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Project Settings</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.form}>
          <label className={styles.label}>
            Project Name
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
            />
          </label>

          <label className={styles.label}>
            Instructions
            <span className={styles.hint}>
              These instructions are prepended as a system prompt to every chat in this project.
            </span>
            <textarea
              className={styles.textarea}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="You are a helpful assistant specialized in..."
              rows={8}
            />
          </label>

          {status && (
            <div className={`${styles.status} ${status === 'Saved' ? styles.success : styles.error}`}>
              {status}
            </div>
          )}

          <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
