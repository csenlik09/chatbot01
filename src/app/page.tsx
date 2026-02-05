'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import SettingsPanel from '@/components/SettingsPanel';
import ProjectInstructionsModal from '@/components/ProjectInstructionsModal';

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  async function handleNewChat(projectId: string | null) {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    const conv = await res.json();
    setActiveConversationId(conv.id);
    setSidebarKey((k) => k + 1);
    return conv.id as string;
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
  }

  // Called by ChatWindow when user sends a message with no active conversation
  const handleCreateAndSend = useCallback(async (): Promise<string> => {
    const newId = await handleNewChat(selectedProjectId);
    return newId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        key={sidebarKey}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProjectInstructions={(id) => setEditingProjectId(id)}
        onProjectSelect={setSelectedProjectId}
      />
      <ChatWindow
        conversationId={activeConversationId}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onConversationUpdate={() => setSidebarKey((k) => k + 1)}
        onAutoCreateChat={handleCreateAndSend}
      />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {editingProjectId && (
        <ProjectInstructionsModal
          projectId={editingProjectId}
          isOpen={true}
          onClose={() => setEditingProjectId(null)}
        />
      )}
    </div>
  );
}
