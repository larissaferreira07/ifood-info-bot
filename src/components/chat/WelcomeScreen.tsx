import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Brain } from 'lucide-react';

interface WelcomeScreenProps {
  onNewChat: () => void;
}

export const WelcomeScreen = ({ onNewChat }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-6 bg-background overflow-hidden">
      <div className="max-w-2xl mx-auto text-center space-y-4 md:space-y-8">
        <div className="space-y-2 md:space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">
            iFood Info Bot
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-lg mx-auto">
            Seu assistente virtual para descobrir tudo sobre o iFood
          </p>
        </div>

        <div className="hidden md:grid md:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Informações Completas</h3>
            <p className="text-xs text-muted-foreground">Dados sobre serviços, carreiras e muito mais</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Respostas Inteligentes</h3>
            <p className="text-xs text-muted-foreground">IA treinada com fontes oficiais</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Múltiplas Conversas</h3>
            <p className="text-xs text-muted-foreground">Organize seus tópicos de interesse</p>
          </div>
        </div>

        <div className="pt-4 md:pt-6">
          <Button
            size="lg"
            onClick={onNewChat}
            className="gap-2 text-base px-8 rounded-full"
          >
            <Plus className="h-5 w-5" />
            Iniciar nova conversa
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/70 pt-2 md:pt-4">
          Dica: Explore os temas sugeridos ou faça sua pergunta diretamente
        </p>
      </div>
    </div>
  );
};
