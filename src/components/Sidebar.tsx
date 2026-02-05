'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Project, Conversation } from '@/lib/types';
import styles from './Sidebar.module.css';

type ConversationSummary = Omit<Conversation, 'messages'>;

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: (projectId: string | null) => void;
  onOpenSettings: () => void;
  onOpenProjectInstructions: (projectId: string) => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onOpenSettings,
  onOpenProjectInstructions,
}: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectMenuOpen, setProjectMenuOpen] = useState<string | null>(null);
  const [chatMenuOpen, setChatMenuOpen] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [projRes, convRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/conversations'),
      ]);
      setProjects(await projRes.json());
      setConversations(await convRes.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, activeConversationId]);

  const ungrouped = conversations.filter((c) => !c.projectId);

  function getProjectConversations(projectId: string) {
    return conversations.filter((c) => c.projectId === projectId);
  }

  function toggleProject(id: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateProject() {
    const name = prompt('Project name:');
    if (!name?.trim()) return;
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    refresh();
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('Delete this project? Chats will be ungrouped.')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjectMenuOpen(null);
    refresh();
  }

  async function handleDeleteChat(id: string) {
    if (!confirm('Delete this chat?')) return;
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    setChatMenuOpen(null);
    refresh();
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className={styles.overlay} onClick={onToggle} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <button className={styles.iconButton} onClick={onOpenSettings} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button className={styles.newChatButton} onClick={() => onNewChat(null)}>
            + New Chat
          </button>
        </div>

        <div className={styles.content}>
          {/* Projects section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span>Projects</span>
              <button className={styles.addButton} onClick={handleCreateProject} title="New project">
                +
              </button>
            </div>
            {projects.map((project) => (
              <div key={project.id} className={styles.projectGroup}>
                <div className={styles.projectRow}>
                  <button
                    className={styles.projectName}
                    onClick={() => toggleProject(project.id)}
                  >
                    <span className={styles.arrow}>
                      {expandedProjects.has(project.id) ? '\u25BE' : '\u25B8'}
                    </span>
                    {project.name}
                  </button>
                  <div className={styles.menuWrapper}>
                    <button
                      className={styles.menuButton}
                      onClick={() => setProjectMenuOpen(projectMenuOpen === project.id ? null : project.id)}
                    >
                      &hellip;
                    </button>
                    {projectMenuOpen === project.id && (
                      <div className={styles.menu}>
                        <button onClick={() => { onNewChat(project.id); setProjectMenuOpen(null); }}>
                          New Chat
                        </button>
                        <button onClick={() => { onOpenProjectInstructions(project.id); setProjectMenuOpen(null); }}>
                          Instructions
                        </button>
                        <button onClick={() => handleDeleteProject(project.id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {expandedProjects.has(project.id) && (
                  <div className={styles.projectChats}>
                    {getProjectConversations(project.id).map((conv) => (
                      <div key={conv.id} className={styles.chatItemWrapper}>
                        <button
                          className={`${styles.chatItem} ${activeConversationId === conv.id ? styles.active : ''}`}
                          onClick={() => onSelectConversation(conv.id)}
                        >
                          {conv.title}
                        </button>
                        <div className={styles.menuWrapper}>
                          <button
                            className={styles.menuButton}
                            onClick={() => setChatMenuOpen(chatMenuOpen === conv.id ? null : conv.id)}
                          >
                            &hellip;
                          </button>
                          {chatMenuOpen === conv.id && (
                            <div className={styles.menu}>
                              <button onClick={() => handleDeleteChat(conv.id)}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recent Chats section (ungrouped) */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span>Recent Chats</span>
            </div>
            {ungrouped.map((conv) => (
              <div key={conv.id} className={styles.chatItemWrapper}>
                <button
                  className={`${styles.chatItem} ${activeConversationId === conv.id ? styles.active : ''}`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  {conv.title}
                </button>
                <div className={styles.menuWrapper}>
                  <button
                    className={styles.menuButton}
                    onClick={() => setChatMenuOpen(chatMenuOpen === conv.id ? null : conv.id)}
                  >
                    &hellip;
                  </button>
                  {chatMenuOpen === conv.id && (
                    <div className={styles.menu}>
                      <button onClick={() => handleDeleteChat(conv.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {ungrouped.length === 0 && projects.length === 0 && (
              <p className={styles.empty}>No conversations yet</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
