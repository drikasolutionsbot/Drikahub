import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface WinnersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  winners: { discord_user_id: string; discord_username: string }[];
}

export default function WinnersModal({ open, onOpenChange, title, winners }: WinnersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Vencedores — {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {winners.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">Nenhum vencedor sorteado</p>
          ) : (
            winners.map((w, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {i + 1}º
                </div>
                <div>
                  <p className="font-medium text-foreground">{w.discord_username || "Desconhecido"}</p>
                  <p className="text-xs text-muted-foreground">ID: {w.discord_user_id}</p>
                </div>
                <Badge className="ml-auto" variant="default">🏆 Vencedor</Badge>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
