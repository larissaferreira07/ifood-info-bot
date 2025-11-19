import { useState, useCallback, useRef, useEffect } from 'react';
import { sendMessageToGroq, isGroqConfigured, type GroqMessage } from '@/services/groqService';
import { moderateContent } from '@/services/contentModeration';
import type { SearchStage } from '@/components/chat/SearchingIndicator';
import { THEME_MENU, type ThemeOption } from '@/data/themeMenu';
import {
  loadConversations,
  updateConversation,
  getCurrentConversationId,
  getConversationById,
  type Conversation,
} from '@/services/chatStorage';

export interface MessageAction {
  label: string;
  value: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  type: 'text' | 'theme-menu';
  actions?: MessageAction[];
  themeData?: {
    themes: ThemeOption[];
    breadcrumb?: ThemeOption[];
    title?: string;
  };
}

export interface SearchProgress {
  stage: SearchStage;
  resultsCount?: number;
  elapsedTime?: number;
  waitSeconds?: number;
}

export const useChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou o assistente virtual do iFood Info Bot.\n\nExplore os temas abaixo ou faça sua pergunta diretamente:',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      type: 'text',
    },
    {
      id: '2',
      text: '',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      type: 'theme-menu',
      themeData: {
        themes: THEME_MENU,
        title: 'Escolha um tema:',
      },
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<GroqMessage[]>([]);
  const [currentThemePath, setCurrentThemePath] = useState<ThemeOption[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (conversationId) {
      const conversation = getConversationById(conversationId);
      if (conversation && conversation.messages.length > 0) {
        setMessages(conversation.messages);
        setConversationHistory(conversation.conversationHistory);
        setCurrentConversationId(conversationId);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      updateConversation(currentConversationId, messages, conversationHistory);
    }
  }, [messages, conversationHistory, currentConversationId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      if (!isGroqConfigured()) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: 'A integracao com IA nao esta configurada. Por favor, configure a chave da API Groq no arquivo .env.\n\nVeja o arquivo CHATBOT_AI_README.md para instrucoes.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          type: 'text',
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const moderation = await moderateContent(text.trim());

      if (!moderation.isAllowed) {
        let responseText = '';

        if (moderation.category === 'inappropriate') {
          responseText = `Desculpe, não posso processar essa mensagem.\n\n${moderation.reason || 'O conteúdo enviado não é apropriado.'}\n\nPor favor, mantenha uma comunicação respeitosa e educada.`;
        } else if (moderation.category === 'off-topic') {
          responseText = `${moderation.reason || 'Esta pergunta está fora do meu escopo de conhecimento.'}\n\nSou especializado exclusivamente em informações sobre o iFood. Posso ajudá-lo com:\n\n- Serviços e funcionalidades do iFood\n- Números, estatísticas e dados da empresa\n- Carreiras e processos seletivos\n- Notícias e novidades\n- Comparações com concorrentes\n- Informações para restaurantes e entregadores\n\nComo posso ajudá-lo com questões relacionadas ao iFood?`;
        } else {
          responseText = moderation.reason || 'Conteúdo não permitido.';
        }

        const moderationMessage: Message = {
          id: Date.now().toString(),
          text: responseText,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          type: 'text',
        };
        setMessages((prev) => [...prev, moderationMessage]);
        return;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        text: text.trim(),
        sender: 'user',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(false);
      
      searchStartTimeRef.current = Date.now();
      let elapsedInterval: NodeJS.Timeout | null = null;

      try {
        setSearchProgress({ stage: 'searching', resultsCount: 0, elapsedTime: 0 });
        
        elapsedInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - searchStartTimeRef.current) / 1000);
          setSearchProgress((prev) => prev ? { ...prev, elapsedTime: elapsed } : null);
        }, 1000);

        const responseText = await sendMessageToGroq(
          text.trim(), 
          conversationHistory,
          {
            onSearchComplete: (resultsCount: number) => {
              if (elapsedInterval) clearInterval(elapsedInterval);
              const elapsed = Math.floor((Date.now() - searchStartTimeRef.current) / 1000);
              setSearchProgress({ stage: 'found', resultsCount, elapsedTime: elapsed });
              
              setTimeout(() => {
                setSearchProgress({ stage: 'analyzing', resultsCount, elapsedTime: elapsed + 1 });
              }, 800);
            },
            onRetrying: (waitSeconds: number) => {
              if (elapsedInterval) clearInterval(elapsedInterval);
              const elapsed = Math.floor((Date.now() - searchStartTimeRef.current) / 1000);
              setSearchProgress({ stage: 'waiting', waitSeconds, elapsedTime: elapsed });
            }
          }
        );

        if (elapsedInterval) clearInterval(elapsedInterval);
        const elapsed = Math.floor((Date.now() - searchStartTimeRef.current) / 1000);
        setSearchProgress({ stage: 'responding', elapsedTime: elapsed });
        
        await new Promise(resolve => setTimeout(resolve, 500));

        setConversationHistory((prev) => [
          ...prev,
          { role: 'user', content: text.trim() },
          { role: 'assistant', content: responseText },
        ]);

        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          type: 'text',
        };

        setMessages((prev) => [...prev, botResponse]);

        // Adicionar menu principal após a resposta
        setTimeout(() => {
          const menuMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: '',
            sender: 'bot',
            timestamp: new Date().toISOString(),
            type: 'theme-menu',
            themeData: {
              themes: THEME_MENU,
              title: 'Posso ajudar com mais alguma coisa?',
            },
          };

          setMessages((prev) => [...prev, menuMessage]);
        }, 500);
      } catch (error) {
        let errorText = 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';

        if (error instanceof Error) {
          errorText = error.message;
          
          if (error.message.includes('não configurada')) {
            errorText = `Configuração necessária: ${error.message}`;
          } else if (error.message.includes('Limite de buscas')) {
            errorText = 'Limite de buscas diário atingido. Tente novamente amanhã ou configure uma nova chave API.';
          } else if (error.message.includes('Chave da API')) {
            errorText = 'API de busca não está configurada corretamente. Verifique as configurações.';
          }
        }

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: errorText,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          type: 'text',
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        if (elapsedInterval) clearInterval(elapsedInterval);
        setSearchProgress(null);
        setIsTyping(false);
      }
    },
    [conversationHistory]
  );

  const handleThemeClick = useCallback((theme: ThemeOption) => {
    if (theme.subtopics) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: theme.label,
        sender: 'user',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      setMessages((prev) => [...prev, userMessage]);
      
      const newPath = [...currentThemePath, theme];
      setCurrentThemePath(newPath);

      setTimeout(() => {
        const menuMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: '',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          type: 'theme-menu',
          themeData: {
            themes: theme.subtopics,
            title: `Sobre ${theme.label}, o que você gostaria de saber?`,
          },
        };

        setMessages((prev) => [...prev, menuMessage]);
      }, 300);
    } 
    else if (theme.query) {
      setCurrentThemePath([]);
      sendMessage(theme.query);
    }
  }, [currentThemePath, sendMessage]);

  const handleBackToMainMenu = useCallback(() => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: 'Voltar ao início',
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentThemePath([]);

    setTimeout(() => {
      const menuMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Claro! Aqui está o menu principal:',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const themeMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: '',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        type: 'theme-menu',
        themeData: {
          themes: THEME_MENU,
          title: 'Escolha um tema:',
        },
      };

      setMessages((prev) => [...prev, menuMessage, themeMessage]);
    }, 300);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: '1',
        text: 'Olá! Sou o assistente virtual do iFood Info Bot.\n\nExplore os temas abaixo ou faça sua pergunta diretamente:',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        type: 'text',
      },
      {
        id: '2',
        text: '',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        type: 'theme-menu',
        themeData: {
          themes: THEME_MENU,
          title: 'Escolha um tema:',
        },
      },
    ]);
    setConversationHistory([]);
    setCurrentThemePath([]);
  }, []);

  return {
    messages,
    isTyping,
    searchProgress,
    inputValue,
    setInputValue,
    sendMessage,
    handleThemeClick,
    handleBackToMainMenu,
    clearChat,
    messagesEndRef,
    currentConversationId,
    setCurrentConversationId,
  };
};
