export type SearchStage = 'searching' | 'found' | 'analyzing' | 'responding' | 'waiting';

interface SearchingIndicatorProps {
  stage: SearchStage;
  resultsCount?: number;
  elapsedTime?: number;
  waitSeconds?: number;
}

export const SearchingIndicator = ({ 
  stage, 
  resultsCount = 0,
  waitSeconds = 0
}: SearchingIndicatorProps) => {
  const getStageText = () => {
    switch (stage) {
      case 'searching':
        return 'Buscando informações';
      case 'found':
        return `${resultsCount} fonte${resultsCount !== 1 ? 's' : ''} encontrada${resultsCount !== 1 ? 's' : ''}`;
      case 'analyzing':
        return 'Analisando fontes';
      case 'responding':
        return 'Gerando resposta';
      case 'waiting':
        return waitSeconds && waitSeconds > 0 
          ? `Processando dados (${waitSeconds}s)`
          : 'Processando dados';
    }
  };

  return (
    <div className="flex w-full animate-fade-in">
      <div className="flex items-center gap-2 px-1 py-2">
        <span className="text-sm text-muted-foreground">{getStageText()}</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-pulse-dot" />
          <div
            className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-pulse-dot"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-pulse-dot"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>
    </div>
  );
};
