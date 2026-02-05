'use client';

import { useState } from 'react';
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

  async function handleNewChat(projectId: string | null) {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    const conv = await res.json();
    setActiveConversationId(conv.id);
    setSidebarKey((k) => k + 1);
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
  }

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
      />
      <ChatWindow
        conversationId={activeConversationId}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onConversationUpdate={() => setSidebarKey((k) => k + 1)}
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
