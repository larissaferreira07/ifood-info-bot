const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  category?: 'inappropriate' | 'off-topic' | 'allowed';
}

function getModerationPrompt(): string {
  return `Sistema de moderação para chatbot especializado em iFood.

PROCESSO:
1. Se conteúdo inapropriado → "inappropriate"
2. Se não for sobre iFood → "off-topic"
3. Se for sobre iFood → "allowed"

BLOQUEIE (inappropriate):
- Conteúdo sexual, pornográfico, erótico
- Palavrões, xingamentos, insultos
- Violência, drogas, armas, terrorismo
- Discriminação, racismo, homofobia
- Assédio, ameaças, bullying
- Spam, phishing, dados sensíveis

BLOQUEIE (off-topic):
- Receitas, culinária, nutrição, dietas
- Piadas, entretenimento, curiosidades
- Política, religião, esportes, celebridades
- Matemática, ciência, programação genérica
- Tecnologia não-relacionada ao iFood
- Conselhos pessoais
- Outras empresas sem relação com iFood

PERMITA (allowed):
- Perguntas sobre iFood (empresa, serviços, história)
- iFood Delivery, Mercado, Farmácia, Shops, Benefícios
- Carreiras, vagas, entregadores, parceiros
- Notícias, dados, estatísticas do iFood
- Comparações com Rappi, Uber Eats, 99Food
- Saudações básicas

FORMATO JSON (sem markdown):
{
  "allowed": true/false,
  "category": "allowed" | "inappropriate" | "off-topic",
  "reason": "explicação" (se allowed=false)
}

IMPORTANTE: Seja RIGOROSO com off-topic. Se não mencionar iFood, bloqueie.`;
}

export async function moderateContent(message: string): Promise<ModerationResult> {
  if (!message || message.trim().length === 0) {
    return {
      isAllowed: false,
      reason: 'Mensagem vazia',
      category: 'inappropriate',
    };
  }

  if (message.length > 1000) {
    return {
      isAllowed: false,
      reason: 'Mensagem muito longa. Por favor, seja mais conciso.',
      category: 'inappropriate',
    };
  }

  if (!GROQ_API_KEY || GROQ_API_KEY === '') {
    return {
      isAllowed: true,
      category: 'allowed',
    };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: getModerationPrompt() },
          { role: 'user', content: `Analise esta mensagem: "${message}"` },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      return {
        isAllowed: true,
        category: 'allowed',
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const moderationResult = JSON.parse(content);

    if (moderationResult.allowed) {
      return {
        isAllowed: true,
        category: 'allowed',
      };
    } else {
      return {
        isAllowed: false,
        reason: moderationResult.reason || 'Conteúdo não permitido',
        category: moderationResult.category === 'off-topic' ? 'off-topic' : 'inappropriate',
      };
    }
  } catch (error) {
    return {
      isAllowed: true,
      category: 'allowed',
    };
  }
}

