import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Copy, ExternalLink, User, Hash, AtSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Winner {
  discord_user_id: string;
  discord_username?: string;
  discord_avatar?: string;
  entered_at?: string;
}

interface WinnersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  winners: Winner[];
}

export default function WinnersModal({ open, onOpenChange, title, winners }: WinnersModalProps) {
  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "ID copiado!" });
  };

  const getAvatarUrl = (w: Winner) => {
    if (w.discord_avatar) {
      return `https://cdn.discordapp.com/avatars/${w.discord_user_id}/${w.discord_avatar}.png?size=64`;
    }
    const defaultIndex = (BigInt(w.discord_user_id) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                {/* Position */}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {i + 1}º
                </div>

                {/* Avatar */}
                <img
                  src={getAvatarUrl(w)}
                  alt="avatar"
                  className="h-10 w-10 rounded-full shrink-0 border-2 border-primary/20"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`; }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="font-semibold text-foreground truncate">{w.discord_username || "Desconhecido"}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground font-mono">{w.discord_user_id}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-0.5"
                      onClick={() => copyId(w.discord_user_id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {w.entered_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Participou em {new Date(w.entered_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Badge + link */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge variant="default">🏆 Vencedor</Badge>
                  <a
                    href={`https://discord.com/users/${w.discord_user_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Perfil
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
