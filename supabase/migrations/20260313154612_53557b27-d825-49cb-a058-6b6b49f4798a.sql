UPDATE welcome_configs
SET embed_data = jsonb_set(
  embed_data::jsonb,
  '{description}',
  '"Olá **{username}**, seja bem-vindo(a) ao **{server}**! 🥳\n\nVocê é nosso membro **#{memberCount}**. Aproveite sua estadia!"'::jsonb
)
WHERE embed_data::jsonb->>'description' LIKE '%Use%{user}%para mencionar%';