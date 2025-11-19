import { Message } from '@/hooks/useChat';
import type { SearchProgress } from '@/hooks/useChat';
import type { ThemeOption } from '@/data/themeMenu';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { SearchingIndicator } from './SearchingIndicator';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  searchProgress: SearchProgress | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onActionClick?: (value: string) => void;
  onThemeClick?: (theme: ThemeOption) => void;
  onBackClick?: () => void;
}

export const MessageList = ({ 
  messages, 
  isTyping, 
  searchProgress,
  messagesEndRef, 
  onActionClick,
  onThemeClick,
  onBackClick,
}: MessageListProps) => {
  return (
    <div 
      className="flex-1 overflow-y-auto p-6 pb-6 relative flex justify-center bg-background transition-colors duration-300"
    >
      <div className="space-y-4 w-full max-w-4xl">
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            onActionClick={onActionClick}
            onThemeClick={onThemeClick}
            onBackClick={onBackClick}
          />
        ))}
        {searchProgress && (
          <SearchingIndicator 
            stage={searchProgress.stage}
            resultsCount={searchProgress.resultsCount}
            elapsedTime={searchProgress.elapsedTime}
            waitSeconds={searchProgress.waitSeconds}
          />
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
        {/* Espaçador para evitar mensagem colada no input */}
        <div className="h-6" />
      </div>
    </div>
  );
};
