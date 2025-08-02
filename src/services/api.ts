import { Session, Message, VNCStatus } from '@/types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export class APIClient {
  // Session Management
  static async createSession(): Promise<Session> {
    const response = await fetch(`${API_BASE}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  }

  static async getSessions(): Promise<Session[]> {
    const response = await fetch(`${API_BASE}/api/sessions`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  }

  static async getSession(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch session');
    return response.json();
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete session');
  }

  static async getMessages(sessionId: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  }

  // Chat
  static async sendMessage(sessionId: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to send message');
  }

  static createSSEConnection(sessionId: string): EventSource {
    return new EventSource(`${API_BASE}/api/sessions/${sessionId}/stream`);
  }

  // VNC
  static async getVNCStatus(): Promise<VNCStatus> {
    const response = await fetch(`${API_BASE}/api/vnc/status`);
    if (!response.ok) throw new Error('Failed to fetch VNC status');
    return response.json();
  }

  static getScreenshotURL(): string {
    return `${API_BASE}/api/vnc/screenshot?t=${Date.now()}`;
  }
}