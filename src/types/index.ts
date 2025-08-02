export interface Session {
  id: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
  session_id?: string;
}

export interface VNCStatus {
  running: boolean;
  host?: string;
  port?: number;
  display?: string;
}

export interface StreamMessage {
  type: 'message';
  sender: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
}