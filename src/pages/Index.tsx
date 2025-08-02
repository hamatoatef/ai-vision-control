import { useState } from 'react';
import { SessionSidebar } from '@/components/SessionSidebar';
import { VNCViewer } from '@/components/VNCViewer';
import { ChatPanel } from '@/components/ChatPanel';
import { Session } from '@/types';

const Index = () => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <SessionSidebar 
        onSessionSelect={setSelectedSession}
        selectedSession={selectedSession}
      />
      <VNCViewer />
      <ChatPanel session={selectedSession} />
    </div>
  );
};

export default Index;
