'use client';

import { useState, useEffect } from 'react';
import styles from './MemoriesPanel.module.css';

interface Memory {
  id: string;
  content: string;
  createdAt: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoriesPanel({ isOpen, onClose }: Props) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus('');
      fetchMemories();
    }
  }, [isOpen]);

  async function fetchMemories() {
    try {
      const res = await fetch('/api/memories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMemories(data);
      }
    } catch {
      setStatus('Failed to load memories');
    }
  }

  async function handleAdd() {
    const content = newMemory.trim();
    if (!content) return;
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus(data.error);
      } else {
        setNewMemory('');
        fetchMemories();
      }
    } catch {
      setStatus('Failed to add memory');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/memories?id=${id}`, { method: 'DELETE' });
      fetchMemories();
    } catch {
      setStatus('Failed to delete memory');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Memories</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <p className={styles.description}>
          Memories are facts that persist across all conversations. They are
          included as context in every chat message.
        </p>

        <div className={styles.addRow}>
          <input
            type="text"
            className={styles.input}
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. User prefers Python"
            maxLength={500}
            disabled={loading}
          />
          <button
            className={styles.addButton}
            onClick={handleAdd}
            disabled={loading || !newMemory.trim()}
          >
            Add
          </button>
        </div>

        {status && (
          <div className={`${styles.status} ${status.includes('Failed') ? styles.error : styles.success}`}>
            {status}
          </div>
        )}

        <div className={styles.list}>
          {memories.length === 0 && (
            <p className={styles.empty}>No memories yet. Add one above.</p>
          )}
          {memories.map((memory) => (
            <div key={memory.id} className={styles.memoryItem}>
              <span className={styles.memoryContent}>{memory.content}</span>
              <button
                className={styles.deleteButton}
                onClick={() => handleDelete(memory.id)}
                title="Delete memory"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
