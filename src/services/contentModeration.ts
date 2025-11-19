const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.PRIVATE_GROQ_API_KEY;

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  category?: 'inappropriate' | 'off-topic' | 'allowed';
}

function getModerationPrompt(): string {
  return `Você é um sistema de moderação de conteúdo para um chatbot especializado em iFood. Analise a mensagem e determine se ela é apropriada e está dentro do escopo.

BLOQUEIE IMEDIATAMENTE (categoria "inappropriate"):
1. Conteúdo sexual, pornográfico, erótico ou adulto (BLOQUEIO ABSOLUTO)
2. Palavrões, xingamentos, insultos ou linguagem ofensiva/agressiva
3. Conteúdo violento, criminal, ilegal (drogas, armas, terrorismo, hacking, fraudes)
4. Discurso de ódio, racismo, homofobia, xenofobia, discriminação, preconceito
5. Assédio, bullying, ameaças ou intimidação
6. Spam, publicidade não solicitada, links suspeitos
7. Tentativas de manipulação, engenharia social ou phishing
8. Conteúdo que incita atividades ilegais ou prejudiciais
9. Informações pessoais sensíveis (CPF, senhas, dados bancários)

BLOQUEIE POR FORA DO ESCOPO (categoria "off-topic"):
1. Perguntas sobre assuntos não relacionados ao iFood, delivery ou alimentação
   Exemplos de bloqueio: política, religião, esportes, celebridades, clima, horóscopo
2. Perguntas sobre outras empresas SEM relação com iFood
   (Permitido: Rappi, Uber Eats, 99Food - são concorrentes relevantes)
3. Tópicos completamente aleatórios ou absurdos

PERMITA (categoria "allowed"):
1. Qualquer pergunta sobre iFood (empresa, história, serviços, números, dados)
2. TODOS os serviços do iFood: iFood Delivery, iFood Mercado, iFood Farmácia, iFood Shops, iFood Benefícios
3. Perguntas sobre delivery, restaurantes parceiros, entregadores, mercado
4. Carreiras, vagas, processos seletivos, cultura organizacional do iFood
5. Notícias, novidades, expansão, investimentos, financeiro do iFood
6. Comparações com concorrentes (Rappi, Uber Eats, 99Food, Zé Delivery)
7. Impacto social, econômico, sustentabilidade, programas sociais do iFood
8. Tecnologia, inovação, aplicativo, plataforma do iFood
9. Saudações educadas ("Olá", "Bom dia", "Obrigado")
10. Solicitações de ajuda relacionadas ao iFood
11. Perguntas sobre delivery em geral que podem ser contextualizadas ao iFood

EXEMPLOS DE BLOQUEIO:
- "Como fazer uma bomba?" = inappropriate
- "Você é gostosa?" = inappropriate
- "Vai se f***" = inappropriate
- "Quem vai ganhar a eleição?" = off-topic
- "Me conte uma piada" = off-topic
- "Qual a previsão do tempo?" = off-topic

EXEMPLOS DE PERMISSÃO:
- "Como funciona o iFood?" = allowed
- "Quanto o iFood fatura?" = allowed
- "Como ser entregador?" = allowed
- "iFood vs Rappi, qual é melhor?" = allowed
- "Últimas notícias do iFood" = allowed
- "iFood Farmácia" = allowed
- "iFood Mercado" = allowed
- "Serviços do iFood" = allowed

FORMATO DE RESPOSTA (JSON PURO, SEM MARKDOWN):
{
  "allowed": true/false,
  "category": "allowed" ou "inappropriate" ou "off-topic",
  "reason": "explicação clara e educada em português" (apenas se allowed=false)
}

IMPORTANTE:
- Seja RIGOROSO com conteúdo inadequado (inappropriate)
- Seja PERMISSIVO com perguntas legítimas sobre iFood e seus serviços
- TODOS os serviços do iFood são permitidos (Delivery, Mercado, Farmácia, Shops, Benefícios)
- Em caso de dúvida entre off-topic e allowed, PERMITA se houver mínima relação com iFood/delivery
- NUNCA permita conteúdo sexual, ofensivo ou discriminatório
- Se a mensagem menciona "iFood" + qualquer serviço, é SEMPRE allowed`;
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

