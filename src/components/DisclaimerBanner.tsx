import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const DISCLAIMER_KEY = 'ifood-info-bot-disclaimer-accepted';

interface DisclaimerDialogProps {
  open: boolean;
  onAccept: () => void;
}

export const DisclaimerDialog = ({ open, onAccept }: DisclaimerDialogProps) => {
  const handleAccept = () => {
    localStorage.setItem(DISCLAIMER_KEY, 'true');
    onAccept();
  };

  return (
    <Dialog open={open} modal>
      <DialogContent className="sm:max-w-2xl [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Aviso</DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-4 space-y-4 text-foreground/90">
            <div className="space-y-3">
              <p className="font-semibold text-base">Declaração de Independência</p>
              <p className="text-sm">
                Este projeto é uma iniciativa <strong>independente e não oficial</strong>, desenvolvida exclusivamente para fins educacionais e de estudo.
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-semibold text-base">Ausência de Vínculo</p>
              <ul className="text-sm space-y-2 list-disc list-inside ml-2">
                <li>Não possui qualquer vínculo ou parceria com o iFood ou suas empresas afiliadas</li>
                <li>Não representa, simula ou substitui nenhum produto, serviço ou canal oficial do iFood</li>
                <li>Todas as informações são baseadas em fontes públicas e podem estar desatualizadas</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-semibold text-base">Limitação de Responsabilidade</p>
              <p className="text-sm">
                O desenvolvedor não se responsabiliza por eventuais imprecisões, erros ou uso inadequado das informações fornecidas. Para informações oficiais e atualizadas, consulte sempre os canais oficiais do iFood.
              </p>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4 mt-4">
              <p className="text-xs text-muted-foreground">
                Ao prosseguir, você reconhece ter lido e compreendido este aviso e concorda em utilizar este projeto sob sua própria responsabilidade.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={handleAccept} className="w-full sm:w-auto px-8">
            Li e entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const checkDisclaimerAccepted = (): boolean => {
  return localStorage.getItem(DISCLAIMER_KEY) === 'true';
};
