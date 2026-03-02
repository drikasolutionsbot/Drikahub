import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DiscordMember {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface MemberSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMember?: (member: DiscordMember) => void;
}

// Mock data — será substituído por chamada real à API do Discord
const MOCK_MEMBERS: DiscordMember[] = [
  { id: "1", username: "rip_gojo0964", displayName: "KS_HAKEADO", avatar: "" },
  { id: "2", username: "kinsleyparker909997", displayName: "Hake" },
  { id: "3", username: "showsoldout", displayName: "hake" },
];

const MemberSearchModal = ({ open, onOpenChange, onSelectMember }: MemberSearchModalProps) => {
  const [search, setSearch] = useState("");

  const filtered = MOCK_MEMBERS.filter(
    (m) =>
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (member: DiscordMember) => {
    onSelectMember?.(member);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-card border-border">
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar membros</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Input
            placeholder="Buscar membro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-8 text-sm"
            autoFocus
          />
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        {/* Results */}
        <div className="max-h-[280px] overflow-y-auto">
          {search.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Digite para buscar membros do servidor
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <User className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum membro encontrado
              </p>
            </div>
          ) : (
            <div className="py-1">
              {filtered.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    {member.avatar && <AvatarImage src={member.avatar} />}
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold uppercase">
                      {member.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{member.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">@{member.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberSearchModal;
