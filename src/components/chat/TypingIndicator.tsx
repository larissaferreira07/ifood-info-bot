export const TypingIndicator = () => {
  return (
    <div className="flex w-full animate-fade-in">
      <div className="bg-card border border-border px-4 py-3 rounded-lg rounded-bl-none shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Digitando</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-dot" />
            <div
              className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-dot"
              style={{ animationDelay: '0.2s' }}
            />
            <div
              className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-dot"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
