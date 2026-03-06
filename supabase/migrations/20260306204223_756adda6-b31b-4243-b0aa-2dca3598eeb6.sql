
ALTER TABLE public.store_configs
  ADD COLUMN IF NOT EXISTS ticket_embed_title text DEFAULT '🎫 Ticket de Suporte',
  ADD COLUMN IF NOT EXISTS ticket_embed_description text DEFAULT 'Seu ticket foi criado com sucesso! Aguarde atendimento.',
  ADD COLUMN IF NOT EXISTS ticket_embed_color text DEFAULT '#5865F2',
  ADD COLUMN IF NOT EXISTS ticket_embed_image_url text,
  ADD COLUMN IF NOT EXISTS ticket_embed_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS ticket_embed_footer text DEFAULT '',
  ADD COLUMN IF NOT EXISTS ticket_embed_button_label text DEFAULT '📩 Abrir Ticket',
  ADD COLUMN IF NOT EXISTS ticket_channel_id text;
