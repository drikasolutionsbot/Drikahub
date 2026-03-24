import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// ═══ OpenAI helpers ═══

async function openaiChat(
  apiKey: string,
  messages: any[],
  options: { stream?: boolean; model?: string } = {},
): Promise<Response> {
  const model = options.model || "gpt-4o-mini";
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: options.stream ?? false,
      ...(options.stream ? {} : { max_tokens: 4096 }),
    }),
  });
  return response;
}

async function openaiText(apiKey: string, messages: any[], model?: string): Promise<string> {
  const resp = await openaiChat(apiKey, messages, { stream: false, model });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${body}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

// ═══ Replicate helper ═══

async function replicateGenerateImage(apiToken: string, prompt: string): Promise<string> {
  // Create prediction using SDXL Lightning
  const createResp = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 4,
        guidance_scale: 0,
      },
    }),
  });

  if (!createResp.ok) {
    const body = await createResp.text();
    throw new Error(`Replicate create error ${createResp.status}: ${body}`);
  }

  let prediction = await createResp.json();

  // If Prefer: wait didn't resolve, poll
  if (prediction.status !== "succeeded" && prediction.status !== "failed") {
    const getUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollResp = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (!pollResp.ok) {
        const body = await pollResp.text();
        throw new Error(`Replicate poll error ${pollResp.status}: ${body}`);
      }
      prediction = await pollResp.json();
      if (prediction.status === "succeeded" || prediction.status === "failed") break;
    }
  }

  if (prediction.status === "failed") {
    throw new Error(`Replicate failed: ${prediction.error || "Unknown error"}`);
  }

  const output = prediction.output;
  if (Array.isArray(output) && output.length > 0) return output[0];
  if (typeof output === "string") return output;
  throw new Error("Replicate returned no image output");
}

// ═══ System Prompts ═══

const systemPrompts: Record<string, string> = {
  copy: `Você é um copywriter profissional de elite especializado em vendas online e Discord.
Crie textos altamente persuasivos, chamativos e que convertem. Use gatilhos mentais como urgência, escassez, prova social e autoridade.
Sempre responda em português brasileiro. Formate com markdown quando útil.
Se o usuário fornecer contexto sobre o produto/serviço, use-o para personalizar a copy.
Entregue resultados de nível profissional — como se um especialista de marketing tivesse escrito.`,

  description: `Você é um especialista de elite em criar descrições de produtos para lojas online no Discord.
Crie descrições irresistíveis, claras e que destaquem benefícios. Use emojis de forma estratégica.
Sempre responda em português brasileiro. Formate com markdown.
Estruture a descrição com: título chamativo, benefícios principais, detalhes do produto e call-to-action.
Entregue resultados premium — texto pronto para usar diretamente.`,

  embed: `Você é um designer profissional de embeds do Discord. Crie textos formatados para embeds Discord.
Use formatação Discord: **negrito**, *itálico*, > citações, \`código\`.
Sempre responda em português brasileiro.
Retorne o conteúdo organizado em seções: título, descrição e campos sugeridos.
O resultado deve ser profissional e pronto para copiar e usar.`,

  strategy: `Você é um consultor sênior de vendas e marketing digital especializado em comunidades Discord.
Dê conselhos práticos, estratégias avançadas e planos de ação para aumentar vendas, engajamento e retenção de membros.
Sempre responda em português brasileiro. Use exemplos reais e dicas acionáveis.
Seja direto, objetivo e entregue valor real — como uma consultoria premium.`,

  prompt_enhancer: `Você é um especialista de elite em engenharia de prompts de IA.
O usuário vai te enviar uma ideia simples em poucas palavras.
Sua tarefa é transformar isso em um prompt profissional, detalhado e otimizado.

Regras:
1. Analise a intenção do usuário
2. Expanda com detalhes técnicos, estilo, tom, público-alvo
3. Se parecer ser para imagem, crie um prompt em INGLÊS otimizado para geração de imagem
4. Se parecer ser para texto/copy, crie um prompt em português detalhado
5. Retorne o prompt melhorado formatado em markdown
6. Inclua uma breve explicação do que foi melhorado

Sempre responda em português brasileiro, exceto o prompt de imagem que deve ser em inglês.`,

  image_prompt: `You are an expert AI image prompt engineer. The user will describe what they need (banner, logo, thumbnail, etc.).
Your task is to create a detailed, optimized prompt in ENGLISH for image generation with Stable Diffusion XL.
Return ONLY the prompt, no explanations. Include style, colors, composition, lighting, mood, and technical details.
Be specific and descriptive. Include negative prompt concepts to avoid.`,

  analyze: `Você é um assistente de IA avançado e analista visual. Quando o usuário envia uma imagem ou documento, analise detalhadamente o conteúdo.
Para imagens: descreva o que vê, identifique elementos, cores, textos, logos, pessoas, objetos.
Para documentos/textos: resuma, extraia informações-chave, organize os dados.
Sempre responda em português brasileiro de forma clara e estruturada com markdown.
Se o usuário fornecer contexto adicional sobre seu negócio/produto, use-o para personalizar e enriquecer sua análise.`,
};

// ═══ Multimodal content builder ═══

function buildUserContent(userPrompt: string, userAttachments?: any[]) {
  if (!userAttachments || userAttachments.length === 0) return userPrompt;
  const parts: any[] = [];
  if (userPrompt.trim()) parts.push({ type: "text", text: userPrompt });
  for (const att of userAttachments) {
    if (att.type === "image" && att.data) {
      parts.push({ type: "image_url", image_url: { url: att.data, detail: "high" } });
    }
  }
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

// ═══ Main handler ═══

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, prompt, context, attachments, action, originalContent } = await req.json();

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY não configurada. Adicione nas configurações do projeto.");

    const replicateToken = Deno.env.get("REPLICATE_API_TOKEN");

    // ═══ ACTION: improve_prompt ═══
    if (action === "improve_prompt") {
      const result = await openaiText(openaiKey, [
        { role: "system", content: systemPrompts.prompt_enhancer },
        ...(context ? [{ role: "user", content: `Contexto do negócio: ${context}` }] : []),
        { role: "user", content: `Melhore este prompt: "${prompt}"` },
      ], "gpt-4o");
      return new Response(JSON.stringify({ improved_prompt: result, model_used: "gpt-4o" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ ACTION: generate_variations ═══
    if (action === "generate_variations") {
      const result = await openaiText(openaiKey, [
        {
          role: "system",
          content: `Você é um especialista criativo. O usuário vai te enviar um conteúdo gerado por IA.
Sua tarefa é criar 3 variações diferentes desse conteúdo, cada uma com um tom/abordagem diferente:

1. **Variação Profissional** — Tom corporativo e sofisticado
2. **Variação Criativa** — Tom ousado, criativo e chamativo
3. **Variação Direta** — Tom objetivo, curto e impactante

Separe cada variação com --- e identifique-as claramente.
Sempre responda em português brasileiro com markdown.`,
        },
        ...(context ? [{ role: "user", content: `Contexto: ${context}` }] : []),
        { role: "user", content: `Crie 3 variações deste conteúdo:\n\n${originalContent}` },
      ], "gpt-4o");
      return new Response(JSON.stringify({ variations: result, model_used: "gpt-4o" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine effective type
    const effectiveType = (attachments && attachments.length > 0 && type !== "image") ? "analyze" : type;
    const systemPrompt = systemPrompts[effectiveType] || systemPrompts.copy;

    // ═══ IMAGE GENERATION (OpenAI refine + Replicate generate) ═══
    if (type === "image") {
      if (!replicateToken) {
        throw new Error("REPLICATE_API_TOKEN não configurada. Adicione nas configurações do projeto.");
      }

      console.log("Step 1: Refining prompt with OpenAI...");
      const enhancedPrompt = await openaiText(openaiKey, [
        { role: "system", content: systemPrompts.image_prompt },
        ...(context ? [{ role: "user", content: `Context: ${context}` }] : []),
        { role: "user", content: prompt },
      ], "gpt-4o");

      console.log("Step 2: Generating image with Replicate SDXL...");
      const imageUrl = await replicateGenerateImage(replicateToken, enhancedPrompt);

      console.log("Image generated successfully:", imageUrl);
      return new Response(JSON.stringify({
        image_url: imageUrl,
        text: `✅ Imagem gerada com sucesso!\n\n**Prompt original:** ${prompt}\n**Prompt otimizado:** ${enhancedPrompt}`,
        enhanced_prompt: enhancedPrompt,
        model_used: "gpt-4o + sdxl-lightning",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ TEXT GENERATION (streaming via OpenAI) ═══
    const userContent = buildUserContent(prompt, attachments);
    const messages = [
      { role: "system", content: systemPrompt },
      ...(context ? [{ role: "user", content: `Contexto: ${context}` }] : []),
      { role: "user", content: userContent },
    ];

    // Use gpt-4o for analyze (vision), gpt-4o-mini for text
    const model = effectiveType === "analyze" ? "gpt-4o" : "gpt-4o-mini";
    const response = await openaiChat(openaiKey, messages, { stream: true, model });

    if (!response.ok) {
      const body = await response.text();
      console.error("OpenAI streaming error:", response.status, body);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições da OpenAI excedido. Aguarde alguns segundos e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "OPENAI_API_KEY inválida. Verifique a chave nas configurações." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Erro OpenAI: ${body}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Streaming response from OpenAI model: ${model}`);
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Model-Used": model,
      },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
