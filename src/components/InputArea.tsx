'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import styles from './InputArea.module.css';

interface Props {
  onSend: (text: string, imageBase64?: string) => void;
  disabled: boolean;
}

export default function InputArea({ onSend, disabled }: Props) {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const trimmed = input.trim();
    if ((!trimmed && !imagePreview) || disabled) return;
    onSend(trimmed, imagePreview || undefined);
    setInput('');
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }
    compressAndPreview(file);
  }

  function compressAndPreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1024;
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.7);
        setImagePreview(dataUri);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className={styles.container}>
      {imagePreview && (
        <div className={styles.previewContainer}>
          <div className={styles.previewWrapper}>
            <img src={imagePreview} alt="Attached" className={styles.previewImage} />
            <button
              className={styles.removeImage}
              onClick={removeImage}
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      <div className={styles.inputWrapper}>
        <button
          className={styles.attachButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach image"
          title="Attach image"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          disabled={disabled}
          rows={1}
          maxLength={2000}
        />
        <button
          className={styles.sendButton}
          onClick={handleSubmit}
          disabled={disabled || (!input.trim() && !imagePreview)}
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 14V2M8 2L2 8M8 2L14 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
