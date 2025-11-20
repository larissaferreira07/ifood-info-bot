import { useEffect, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { ChatSidebar } from './ChatSidebar';
import { WelcomeScreen } from './WelcomeScreen';
import {
  loadConversations,
  createNewConversation,
  addConversation,
  deleteConversation,
  updateConversation,
  renameConversation,
  setCurrentConversationId as setStorageConversationId,
  getCurrentConversationId,
  type Conversation,
} from '@/services/chatStorage';
import { cn } from '@/lib/utils';

export const ChatContainer = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const {
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
    setCurrentConversationId,
  } = useChat(activeConversationId || undefined);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadedConversations = loadConversations();
    
    if (loadedConversations.length === 0) {
      setConversations([]);
      setActiveConversationId(null);
      if (window.innerWidth < 768) {
        setIsSidebarVisible(false);
      }
    } else {
      setConversations(loadedConversations);
      const currentId = getCurrentConversationId();
      if (currentId && loadedConversations.find(c => c.id === currentId)) {
        setActiveConversationId(currentId);
      } else {
        setActiveConversationId(loadedConversations[0].id);
        setStorageConversationId(loadedConversations[0].id);
      }
    }
  }, [setCurrentConversationId]);

  useEffect(() => {
    const updatedConversations = loadConversations();
    setConversations(updatedConversations);
  }, [messages]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleActionClick = (value: string) => {
    sendMessage(value);
  };

  const handleNewConversation = () => {
    const newConversation = createNewConversation();
    addConversation(newConversation);
    setConversations(loadConversations());
    setActiveConversationId(newConversation.id);
    setCurrentConversationId(newConversation.id);
    clearChat();
    if (window.innerWidth < 768) {
      setIsSidebarVisible(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setCurrentConversationId(id);
    setStorageConversationId(id);
    setConversations(loadConversations());
    if (window.innerWidth < 768) {
      setIsSidebarVisible(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    deleteConversation(id);
    const remaining = loadConversations();
    setConversations(remaining);

    if (activeConversationId === id) {
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
        setCurrentConversationId(remaining[0].id);
        setStorageConversationId(remaining[0].id);
      } else {
        setActiveConversationId(null);
        clearChat();
        // Hide sidebar on mobile to show welcome screen
        if (window.innerWidth < 768) {
          setIsSidebarVisible(false);
        }
      }
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    renameConversation(id, newTitle);
    
    const updatedConversations = loadConversations();
    setConversations([...updatedConversations]);
  };

  const handleExitChat = () => {
    window.location.href = '/';
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* Sidebar - overlay no mobile, fixa no desktop */}
      <div
        className={cn(
          'fixed md:relative inset-0 md:inset-auto z-50 md:z-auto transition-all duration-300 border-r md:border-r',
          isSidebarVisible ? 'w-full md:w-[420px]' : 'w-0 -translate-x-full md:translate-x-0',
          !isSidebarVisible && 'hidden'
        )}
      >
        <ChatSidebar
          conversations={conversations}
          currentConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onExitChat={handleExitChat}
        />
      </div>

      {/* Área principal do chat - sempre visível */}
      <div className="flex-1 flex flex-col min-w-0 h-full w-full">
        {activeConversationId ? (
          <>
            <ChatHeader
              onClearChat={clearChat}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              onToggleSidebar={toggleSidebar}
              isSidebarVisible={isSidebarVisible}
            />
            <MessageList 
              messages={messages} 
              isTyping={isTyping}
              searchProgress={searchProgress}
              messagesEndRef={messagesEndRef}
              onActionClick={handleActionClick}
              onThemeClick={handleThemeClick}
              onBackClick={handleBackToMainMenu}
            />
            <InputArea
              value={inputValue}
              onChange={setInputValue}
              onSend={sendMessage}
              disabled={isTyping || searchProgress !== null}
            />
          </>
        ) : (
          <WelcomeScreen onNewChat={handleNewConversation} />
        )}
      </div>
    </div>
  );
};
