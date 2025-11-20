import ReactMarkdown from 'react-markdown';
import { Message } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeMenu } from './ThemeMenu';
import type { ThemeOption } from '@/data/themeMenu';

interface MessageItemProps {
  message: Message;
  onActionClick?: (value: string) => void;
  onThemeClick?: (theme: ThemeOption) => void;
  onBackClick?: () => void;
}

// Função para gerar um título a partir da URL
const getTitleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Tentar extrair título significativo do pathname primeiro
    const pathname = urlObj.pathname;
    if (pathname && pathname !== '/' && pathname !== '') {
      const parts = pathname.split('/').filter(p => p);
      if (parts.length > 0) {
        // Pegar a última parte do caminho que geralmente é mais específica
        const lastPart = parts[parts.length - 1]
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\.html?$/i, '')
          .replace(/\.php$/i, '')
          .replace(/\.aspx?$/i, '');
        
        // Se a parte tem conteúdo significativo (não é só números)
        if (lastPart && !/^\d+$/.test(lastPart)) {
          // Capitalizar cada palavra
          const title = lastPart
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          // Limitar o tamanho
          return title.length > 45 ? title.substring(0, 42) + '...' : title;
        }
      }
    }

    // Fallback: usar o domínio de forma amigável
    // Remover TLD e capitalizar
    const domainParts = domain.split('.');
    const mainDomain = domainParts[0];
    
    // Se for subdomínio conhecido, usar formato especial
    if (domainParts.length > 2) {
      const subdomain = domainParts[0];
      const baseDomain = domainParts[1];
      
      const subdomainFormatted = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
      const baseDomainFormatted = baseDomain.charAt(0).toUpperCase() + baseDomain.slice(1);
      
      return `${subdomainFormatted} - ${baseDomainFormatted}`;
    }
    
    // Apenas capitalizar o domínio principal
    return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
  } catch {
    return 'Ver fonte';
  }
};

export const MessageItem = ({ message, onActionClick, onThemeClick, onBackClick }: MessageItemProps) => {
  const isUser = message.sender === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.type === 'theme-menu' && message.themeData) {
    return (
      <div className="w-full animate-fade-in px-3">
        <div className="flex w-full justify-start">
          <div className="w-full px-4 py-3 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md bg-white dark:bg-card border border-border/50 rounded-bl-none overflow-hidden">
            <ThemeMenu
              themes={message.themeData.themes}
              onThemeClick={onThemeClick || (() => {})}
              onBackClick={message.themeData.breadcrumb?.length ? onBackClick : undefined}
              breadcrumb={message.themeData.breadcrumb}
              title={message.themeData.title}
            />
            <div className="text-[10px] mt-3 text-muted-foreground/70 text-left">
              {time}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasSources = !isUser && message.text.includes('**Fontes consultadas:**');
  
  let mainContent = message.text;
  let sourcesContent = '';
  
  if (hasSources) {
    const parts = message.text.split('**Fontes consultadas:**');
    mainContent = parts[0].trim();
    sourcesContent = parts[1]?.trim() || '';
  }

  return (
    <div className="w-full animate-fade-in space-y-2 px-3">
      <div
        className={cn(
          'flex w-full',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        <div
          className={cn(
            'w-full px-4 py-3 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden',
            isUser
              ? 'bg-primary/20 dark:bg-primary/25 border-l-4 border-primary rounded-br-none'
              : 'bg-white dark:bg-card border border-border/50 rounded-bl-none'
          )}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 break-words overflow-wrap-anywhere">
            {isUser ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground break-words">{message.text}</div>
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="text-sm leading-relaxed my-1">{children}</p>,
                  strong: ({ children }) => {
                    const text = String(children);
                    if (text.includes('Nota sobre contradições')) {
                      return (
                        <div className="mt-2 mb-1">
                          <strong className="font-semibold text-amber-600 dark:text-amber-500 text-sm">{children}</strong>
                        </div>
                      );
                    }
                    return <strong className="font-bold text-foreground">{children}</strong>;
                  },
                  em: ({ children }) => <em className="italic text-muted-foreground text-xs">{children}</em>,
                  ul: ({ children }) => <ul className="list-none space-y-0.5 my-1">{children}</ul>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  h1: ({ children }) => <h1 className="text-base font-bold my-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold my-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold my-1.5">{children}</h3>,
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary font-medium underline hover:text-primary/80 transition-colors"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {mainContent}
              </ReactMarkdown>
            )}
          </div>
          
          {/* Seção de Fontes Minimalista */}
          {hasSources && sourcesContent && (
            <div className="mt-4 pt-3 border-t border-border/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Fontes
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <ReactMarkdown
                  components={{
                    ul: ({ children }) => <ul className="list-none space-y-1.5">{children}</ul>,
                    li: ({ children }) => (
                      <li className="flex items-start gap-1.5 text-muted-foreground/80">
                        <span className="text-muted-foreground/50 mt-0.5 text-xs shrink-0">•</span>
                        <span className="flex-1 leading-relaxed min-w-0">{children}</span>
                      </li>
                    ),
                    a: ({ children, href }) => {
                      const title = href ? getTitleFromUrl(href) : String(children);
                      return (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:underline transition-colors text-[11px] font-medium inline-block break-words max-w-full"
                          title={href}
                        >
                          {title}
                        </a>
                      );
                    },
                  }}
                >
                  {sourcesContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          <div
            className={cn(
              'text-[10px] mt-2 text-muted-foreground/60',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {time}
          </div>
        </div>
      </div>
      
      {!isUser && message.actions && message.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onActionClick?.(action.value)}
              className="transition-all hover:scale-105 hover:bg-primary/10 hover:border-primary hover:text-primary border-border/50 shadow-sm"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
