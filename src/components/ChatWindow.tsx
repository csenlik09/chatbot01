'use client';

import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import TypingIndicator from './TypingIndicator';
import type { Message, ChatResponse } from '@/lib/types';
import styles from './ChatWindow.module.css';

interface Props {
  conversationId: string | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onConversationUpdate: () => void;
  onAutoCreateChat: () => Promise<string>;
}

export default function ChatWindow({
  conversationId,
  sidebarOpen,
  onToggleSidebar,
  onConversationUpdate,
  onAutoCreateChat,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeConvRef = useRef<string | null>(null);

  // Keep ref in sync so handleSend always has the latest
  useEffect(() => {
    activeConvRef.current = conversationId;
  }, [conversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    fetch(`/api/conversations/${conversationId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]));
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend(text: string) {
    let convId = activeConvRef.current;

    // Auto-create conversation if none exists
    if (!convId) {
      try {
        convId = await onAutoCreateChat();
        activeConvRef.current = convId;
      } catch {
        return;
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId: convId }),
      });
      const data: ChatResponse = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.error!,
            timestamp: Date.now(),
          },
        ]);
      } else if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }

      onConversationUpdate();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Failed to connect. Please check your settings and try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {!sidebarOpen && (
          <button className={styles.headerButton} onClick={onToggleSidebar} title="Open sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <h1>Chatbot</h1>
        <div style={{ width: 30 }} />
      </header>

      <div className={styles.messageList}>
        {!conversationId && messages.length === 0 && (
          <div className={styles.empty}>
            <p>Send a message to start a conversation.</p>
            <p className={styles.hint}>
              Configure your API settings using the gear icon in the sidebar.
            </p>
          </div>
        )}
        {conversationId && messages.length === 0 && !isLoading && (
          <div className={styles.empty}>
            <p>Send a message to start the conversation.</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <InputArea onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
