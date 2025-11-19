import type { Message } from '@/hooks/useChat';
import type { GroqMessage } from '@/services/groqService';

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
  conversationHistory: GroqMessage[];
  unread: boolean;
}

const STORAGE_KEY = 'ifood-chat-conversations';
const CURRENT_CHAT_KEY = 'ifood-current-chat-id';

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Erro ao salvar conversas:', error);
  }
}

export function loadConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar conversas:', error);
    return [];
  }
}

export function createNewConversation(): Conversation {
  return {
    id: Date.now().toString(),
    title: 'Nova Conversa',
    lastMessage: 'Olá! Como posso ajudar?',
    timestamp: new Date().toISOString(),
    messages: [],
    conversationHistory: [],
    unread: false,
  };
}

export function updateConversation(
  conversationId: string,
  messages: Message[],
  conversationHistory: GroqMessage[]
): void {
  const conversations = loadConversations();
  const index = conversations.findIndex(c => c.id === conversationId);

  if (index !== -1) {
    const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot');
    const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
    
    const hasNewMessages = messages.length !== conversations[index].messages.length;
    
    conversations[index] = {
      ...conversations[index],
      messages,
      conversationHistory,
      lastMessage: lastBotMessage?.text.slice(0, 50) || lastUserMessage?.text.slice(0, 50) || 'Nova conversa',
      timestamp: hasNewMessages ? new Date().toISOString() : conversations[index].timestamp,
      title: conversations[index].title.startsWith('Nova Conversa') || conversations[index].title.length === 0 
        ? generateConversationTitle(messages)
        : conversations[index].title,
    };

    saveConversations(conversations);
  }
}

export function renameConversation(conversationId: string, newTitle: string): void {
  const conversations = loadConversations();
  const index = conversations.findIndex(c => c.id === conversationId);

  if (index !== -1) {
    conversations[index] = {
      ...conversations[index],
      title: newTitle,
    };

    saveConversations(conversations);
  }
}

function generateConversationTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.sender === 'user' && m.text.length > 3);
  if (firstUserMessage) {
    return firstUserMessage.text.slice(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '');
  }
  return 'Nova Conversa';
}

export function deleteConversation(conversationId: string): void {
  const conversations = loadConversations();
  const filtered = conversations.filter(c => c.id !== conversationId);
  saveConversations(filtered);
}

export function setCurrentConversationId(id: string): void {
  localStorage.setItem(CURRENT_CHAT_KEY, id);
}

export function getCurrentConversationId(): string | null {
  return localStorage.getItem(CURRENT_CHAT_KEY);
}

export function getConversationById(id: string): Conversation | null {
  const conversations = loadConversations();
  return conversations.find(c => c.id === id) || null;
}

export function addConversation(conversation: Conversation): void {
  const conversations = loadConversations();
  conversations.unshift(conversation);
  saveConversations(conversations);
  setCurrentConversationId(conversation.id);
}
