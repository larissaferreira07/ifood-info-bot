import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
}

const MAX_CHARS = 500;

export const InputArea = ({ value, onChange, onSend, disabled }: InputAreaProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value.length;
  const isOverLimit = charCount > MAX_CHARS;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isOverLimit && !disabled) {
        onSend(value);
      }
    }
  };

  const handleSend = () => {
    if (value.trim() && !isOverLimit && !disabled) {
      onSend(value);
    }
  };

  return (
    <div className="border-t border-border bg-card p-3 md:p-4 flex-shrink-0">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Digite sua pergunta sobre o iFood..."
            className="resize-none min-h-[44px] max-h-[120px] pr-12"
            rows={1}
            disabled={disabled}
          />
          <div
            className={`absolute right-2 bottom-2 text-xs transition-colors ${
              isOverLimit
                ? 'text-destructive font-medium'
                : isFocused
                ? 'text-muted-foreground'
                : 'text-transparent'
            }`}
          >
            {charCount}/{MAX_CHARS}
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!value.trim() || isOverLimit || disabled}
          size="icon"
          className="h-11 w-11 flex-shrink-0 transition-all hover:scale-105"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
