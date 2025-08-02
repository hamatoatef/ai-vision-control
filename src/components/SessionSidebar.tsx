import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APIClient } from '@/services/api';
import { Session } from '@/types';
import { Plus, Monitor, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SessionSidebarProps {
  onSessionSelect: (session: Session) => void;
  selectedSession: Session | null;
}

export function SessionSidebar({ onSessionSelect, selectedSession }: SessionSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await APIClient.getSessions();
      setSessions(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load sessions"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    try {
      const newSession = await APIClient.createSession();
      setSessions(prev => [newSession, ...prev]);
      onSessionSelect(newSession);
      toast({
        title: "Success",
        description: "New session created"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create session"
      });
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await APIClient.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        onSessionSelect(sessions[0] || null);
      }
      toast({
        title: "Success",
        description: "Session deleted"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete session"
      });
    }
  };

  return (
    <div className="w-80 h-full bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">AI Sessions</h2>
        <Button 
          onClick={createSession} 
          className="w-full"
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sessions yet. Create your first session!
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`p-3 cursor-pointer transition-all hover:bg-accent group ${
                  selectedSession?.id === session.id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => onSessionSelect(session)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {session.name || `Session ${session.id.slice(-8)}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => deleteSession(session.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}