import { Moon, Sun, MoreVertical, Trash2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  onClearChat: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
  isSidebarVisible?: boolean;
}

export const ChatHeader = ({
  onClearChat,
  isDarkMode,
  onToggleTheme,
  onToggleSidebar,
  isSidebarVisible,
}: ChatHeaderProps) => {
  return (
    <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-3 md:px-4 shadow-sm flex-shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-9 w-9 md:hidden shrink-0"
            title={isSidebarVisible ? 'Ocultar conversas' : 'Mostrar conversas'}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg md:text-xl shrink-0">
          iF
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-foreground text-sm md:text-base truncate">iFood Info Bot</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="h-9 w-9"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClearChat}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
