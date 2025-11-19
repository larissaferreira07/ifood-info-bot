import { Button } from '@/components/ui/button';

interface QuickRepliesProps {
  onSelect: (text: string) => void;
}

const defaultSuggestions = [
  'Números atuais do iFood',
  'Últimas notícias',
  'Como funciona?',
];

export const QuickReplies = ({ onSelect }: QuickRepliesProps) => {
  return (
    <div className="border-t border-border bg-card p-3">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {defaultSuggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className="flex-shrink-0 transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground border-border whitespace-nowrap"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
};
