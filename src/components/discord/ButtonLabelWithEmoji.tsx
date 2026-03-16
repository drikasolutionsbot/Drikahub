import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const POPULAR_EMOJIS = [
  "📩", "🎫", "✅", "🛒", "🔒", "🔓", "⭐", "🎁", "💎", "🏆",
  "🚀", "⚡", "💬", "🔔", "❤️", "👍", "🎮", "🎯", "💡", "🔑",
  "🛡️", "⚙️", "📌", "✨", "💪", "🤝", "💥", "🌟", "🎊", "📢",
  "🔥", "💰", "📦", "👑", "🎉", "❌", "🔗", "📋", "🏷️", "🧾",
  "✉️", "📬", "🛎️", "🆘", "❓", "💳", "🪙", "🎟️", "📝", "🔐",
];

interface ButtonLabelWithEmojiProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ButtonLabelWithEmoji = ({ value, onChange, placeholder }: ButtonLabelWithEmojiProps) => {
  const [open, setOpen] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    // If label already starts with an emoji, replace it
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u;
    const cleaned = value.replace(emojiRegex, "").trim();
    onChange(`${emoji} ${cleaned}`);
    setOpen(false);
  };

  const removeEmoji = () => {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u;
    onChange(value.replace(emojiRegex, "").trim());
  };

  return (
    <div className="flex gap-1.5">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 h-10 w-10" type="button">
            <SmilePlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-2" align="end">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-medium text-muted-foreground">Emoji do Botão</p>
            <button
              onClick={removeEmoji}
              className="text-[10px] text-muted-foreground hover:text-foreground underline"
              type="button"
            >
              Remover
            </button>
          </div>
          <ScrollArea className="h-[180px]">
            <div className="grid grid-cols-8 gap-0.5">
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ButtonLabelWithEmoji;
