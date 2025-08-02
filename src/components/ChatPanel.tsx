import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APIClient } from '@/services/api';
import { Message, Session, StreamMessage } from '@/types';
import { Send, User, Bot, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatPanelProps {
  session: Session | null;
}

export function ChatPanel({ session }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!session) {
      setMessages([]);
      return;
    }

    loadMessages();
    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [session]);

  const loadMessages = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const data = await APIClient.getMessages(session.id);
      setMessages(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = () => {
    if (!session) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = APIClient.createSSEConnection(session.id);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const streamMessage: StreamMessage = JSON.parse(event.data);
        const message: Message = {
          role: streamMessage.sender,
          content: streamMessage.content,
          timestamp: streamMessage.timestamp,
          session_id: session.id
        };
        
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Lost connection to real-time updates"
      });
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      session_id: session.id
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      await APIClient.sendMessage(session.id, messageContent);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      });
      // Remove the user message on error
      setMessages(prev => prev.filter(m => m !== userMessage));
    } finally {
      setSending(false);
    }
  };

  const getRoleIcon = (role: Message['role']) => {
    switch (role) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'assistant':
        return <Bot className="w-4 h-4" />;
      case 'tool':
        return <Settings className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: Message['role']) => {
    switch (role) {
      case 'user':
        return 'default';
      case 'assistant':
        return 'secondary';
      case 'tool':
        return 'outline';
    }
  };

  if (!session) {
    return (
      <div className="w-96 h-full bg-card border-l border-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Session Selected</h3>
          <p className="text-sm">Choose a session to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Chat</h2>
        <p className="text-sm text-muted-foreground">
          Session: {session.name || session.id.slice(-8)}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Badge variant={getRoleBadgeVariant(message.role)} className="flex items-center space-x-1">
                    {getRoleIcon(message.role)}
                    <span className="capitalize">{message.role}</span>
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}