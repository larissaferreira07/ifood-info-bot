import { Button } from '@/components/ui/button';
import { ChevronRight, Home, Hash, Briefcase, Store, Truck, Building2, Newspaper, UtensilsCrossed, GraduationCap } from 'lucide-react';
import { ThemeOption } from '@/data/themeMenu';

const themeIcons: Record<string, any> = {
  'estagio-genai': GraduationCap,
  'numeros': Hash,
  'servicos': Store,
  'carreiras': Briefcase,
  'parceiros': UtensilsCrossed,
  'entregadores': Truck,
  'empresa': Building2,
  'noticias': Newspaper,
};

interface ThemeMenuProps {
  themes: ThemeOption[];
  onThemeClick: (theme: ThemeOption) => void;
  onBackClick?: () => void;
  breadcrumb?: ThemeOption[];
  title?: string;
}

export const ThemeMenu = ({ 
  themes, 
  onThemeClick, 
  onBackClick,
  breadcrumb = [],
  title = 'Escolha um tema:'
}: ThemeMenuProps) => {
  const isMainThemes = themes.some(t => themeIcons[t.id]);
  
  return (
    <div className="space-y-4">
      {breadcrumb.length > 0 && onBackClick && (
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="h-7 px-2 hover:bg-muted/50 text-xs"
          >
            <Home className="w-3.5 h-3.5 mr-1.5" />
            Voltar ao início
          </Button>
        </div>
      )}

      {title && (
        <div className="text-sm font-semibold text-foreground/90">
          {title}
        </div>
      )}

      <div className={`grid gap-2 ${isMainThemes ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {themes.map((theme) => {
          const Icon = themeIcons[theme.id];
          const hasSubtopics = theme.subtopics && theme.subtopics.length > 0;
          
          return (
            <Button
              key={theme.id}
              variant="outline"
              size={isMainThemes ? "default" : "sm"}
              onClick={() => onThemeClick(theme)}
              className={`
                h-auto text-left justify-start group
                hover:bg-primary/5 hover:border-primary/50 hover:shadow-sm
                transition-all duration-200
                ${isMainThemes ? 'py-3 px-3' : 'py-2.5 px-3'}
              `}
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {Icon && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className={`font-medium group-hover:text-primary transition-colors truncate ${isMainThemes ? 'text-sm' : 'text-xs'}`}>
                    {theme.label}
                  </span>
                </div>
                {hasSubtopics && (
                  <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
