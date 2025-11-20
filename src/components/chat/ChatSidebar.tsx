import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { MoreVertical, Pencil, Trash2, LogOut } from 'lucide-react';
import type { Conversation } from '@/services/chatStorage';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onExitChat?: () => void;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onExitChat,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredConversations(
        conversations.filter(
          c =>
            c.title.toLowerCase().includes(query) ||
            c.lastMessage.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, conversations]);

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function handleRenameClick(conversationId: string, currentTitle: string) {
    setEditingId(conversationId);
    setEditingValue(currentTitle);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }

  function handleRenameSubmit() {
    if (editingId && editingValue.trim()) {
      onRenameConversation(editingId, editingValue.trim());
      setEditingId(null);
      setEditingValue('');
    }
  }

  function handleRenameCancel() {
    setEditingId(null);
    setEditingValue('');
  }

  function handleDeleteClick(conversationId: string) {
    setDeleteConfirmId(conversationId);
  }

  function handleDeleteConfirm() {
    if (deleteConfirmId) {
      onDeleteConversation(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-background border-r overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Conversas</h2>
            <div className="flex items-center gap-1">
              <Button
                onClick={onNewConversation}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                title="Nova conversa"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Button>
              {onExitChat && (
                <Button
                  onClick={onExitChat}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  title="Sair do chat"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 border-none"
            />
          </div>
        </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-2 space-y-1 overflow-hidden">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isEditing = editingId === conversation.id;
              
              return (
              <div
                key={conversation.id}
                className={cn(
                  'relative group rounded-lg p-2 transition-all duration-200 ease-in-out',
                  !isEditing && 'cursor-pointer hover:bg-muted/50',
                  currentConversationId === conversation.id && 'bg-muted'
                )}
                onClick={() => !isEditing && onSelectConversation(conversation.id)}
              >
                <div className="flex items-start gap-1 w-full">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    {isEditing ? (
                      <Input
                        ref={inputRef}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameSubmit();
                          } else if (e.key === 'Escape') {
                            handleRenameCancel();
                          }
                        }}
                        onBlur={handleRenameSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="h-auto p-0 border-0 shadow-none bg-transparent font-medium text-sm mb-0.5 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    ) : (
                      <h3 className="font-medium text-sm truncate mb-0.5">
                        {conversation.title}
                      </h3>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-0">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(conversation.timestamp)}
                      </span>
                      
                      {/* Menu de ações - minimalista */}
                      {!isEditing && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="h-5 w-5 p-0 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-transparent rounded"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="min-w-[130px] p-1 border-border/50" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameClick(conversation.id, conversation.title);
                              }}
                              className="text-xs py-1.5 px-2 cursor-pointer hover:bg-muted/40 focus:bg-muted/40"
                            >
                              <Pencil className="mr-2 h-3 w-3" />
                              Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(conversation.id);
                              }}
                              className="text-destructive/80 hover:text-destructive hover:bg-muted/40 focus:bg-muted/40 focus:text-destructive text-xs py-1.5 px-2 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    {conversation.unread && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      </ScrollArea>
    </div>

    {/* AlertDialog de Confirmação de Exclusão */}
    <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. A conversa e todas as mensagens serão removidas permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
