import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl mx-auto text-center space-y-12 py-20">

          <div className="space-y-6 animate-slide-up">
            <h1 className="text-6xl md:text-7xl font-bold text-foreground tracking-tight">
              iFood Info Bot
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Assistente virtual <span className="font-semibold">não oficial</span> que centraliza informações públicas do iFood de forma interativa e acessível
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Link to="/chat" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 rounded-full">
                Começar conversa
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

        </div>
      </main>

      <footer className="border-t border-border/50 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">iFood Info Bot</span> • Desenvolvido por Larissa Ferreira
            </div>
            <div className="text-center md:text-right">
              Projeto independente sem vínculo oficial com o iFood
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
