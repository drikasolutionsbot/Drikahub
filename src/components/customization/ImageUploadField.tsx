import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

const ImageUploadField = ({ label, value, onChange, folder = "embeds" }: ImageUploadFieldProps) => {
  const { tenantId } = useTenant();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${tenantId}/${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("tenant-assets")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("tenant-assets").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err.message || "Tente novamente"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... ou faça upload"
          className="bg-background border-border text-sm flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        </Button>
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground"
            onClick={() => onChange("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {value && (
        <img
          src={value}
          alt="Preview"
          className="h-12 w-12 rounded border border-border object-cover mt-1"
          onError={e => (e.currentTarget.style.display = "none")}
        />
      )}
      <input ref={inputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleUpload} />
    </div>
  );
};

export default ImageUploadField;
