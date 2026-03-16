export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface Message {
  id?: string;
  conversationId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  type: 'text' | 'audio' | 'image';
}
