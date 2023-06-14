export interface MessageItem {
  text: string;
  id: string;
  avatar: string;
  createdAt: Date;
  sent: boolean;
  conversationId: number;
  userId: string;
  role: 'user' | 'assistant' | 'system';
}
