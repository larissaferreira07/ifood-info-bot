import { 
  searchWeb, 
  formatSearchResultsForAI, 
  generateSearchQuery, 
  isSearchConfigured 
} from './webSearchService';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.PRIVATE_GROQ_API_KEY;

export const GROQ_MODELS = {
  LLAMA_70B: 'llama-3.1-70b-versatile',     
  LLAMA_8B: 'llama-3.1-8b-instant',         
  MIXTRAL: 'mixtral-8x7b-32768',            
  GEMMA_7B: 'gemma2-9b-it',                 
} as const;

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  onSearchComplete?: (resultsCount: number) => void;
  onRetrying?: (waitSeconds: number) => void;
}

export async function sendMessageToGroq(
  userMessage: string,
  conversationHistory: GroqMessage[] = [],
  options: GroqChatOptions = {}
): Promise<string> {
  if (!GROQ_API_KEY || GROQ_API_KEY === '') {
    throw new Error(
      'Chave API do Groq não configurada. Configure PRIVATE_GROQ_API_KEY no arquivo .env'
    );
  }

  let searchContext = '';
  
  if (!isSearchConfigured()) {
    throw new Error(
      'API de busca não configurada. Configure PRIVATE_TAVILY_API_KEY no arquivo .env para habilitar busca na web obrigatória.'
    );
  }

  const {
    model = GROQ_MODELS.LLAMA_8B, 
    temperature = 0.7,
    maxTokens = 800, 
    systemPrompt = getDefaultSystemPrompt(),
    onSearchComplete,
    onRetrying,
  } = options;

  try {
    const searchQuery = generateSearchQuery(userMessage);
    const searchResults = await searchWeb(searchQuery, 5);

    if (onSearchComplete && searchResults.results) {
      onSearchComplete(searchResults.results.length);
    }

    searchContext = formatSearchResultsForAI(searchResults);
  } catch (searchError) {
    
    let errorMessage = 'Não foi possível realizar a busca necessária para responder sua pergunta.';
    
    if (searchError instanceof Error) {
      if (searchError.message.includes('API')) {
        errorMessage = `Erro na API de busca: ${searchError.message}`;
      } else if (searchError.message.includes('401')) {
        errorMessage = 'Chave da API de busca inválida. Verifique PRIVATE_TAVILY_API_KEY no .env';
      } else if (searchError.message.includes('429')) {
        errorMessage = 'Limite de buscas excedido. Tente novamente mais tarde.';
      } else {
        errorMessage = `Erro na busca: ${searchError.message}`;
      }
    }
    
    throw new Error(errorMessage);
  }
  // ====== FIM DA BUSCA OBRIGATÓRIA ======

  // Construir histórico de mensagens
  // IMPORTANTE: Incluir o contexto da busca na web
  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    {
      role: 'user',
      content: `${searchContext}\n\n===== PERGUNTA DO USUÁRIO =====\n${userMessage}\n\nLEMBRETE CRÍTICO: Baseie sua resposta EXCLUSIVAMENTE nos resultados da busca acima e cite apenas as fontes MAIS RELEVANTES que você utilizou (1 a 3 principais)!`
    },
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        const waitTime = errorData.error?.message?.match(/try again in ([\d.]+)s/)?.[1];
        const seconds = waitTime ? Math.ceil(parseFloat(waitTime)) : 20;

        if (onRetrying) {
          onRetrying(seconds);
        }

        let remainingSeconds = seconds;
        while (remainingSeconds > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          remainingSeconds--;

          if (onRetrying && remainingSeconds > 0) {
            onRetrying(remainingSeconds);
          }
        }
        
        return sendMessageToGroq(userMessage, conversationHistory, options);
      }
      
      throw new Error(
        `Erro na API Groq: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('Nenhuma resposta retornada pela API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Erro desconhecido ao processar a requisição');
  }
}

function getDefaultSystemPrompt(): string {
  return `VOCÊ É UM ASSISTENTE ESPECIALIZADO EXCLUSIVAMENTE EM INFORMAÇÕES SOBRE IFOOD.

REGRA NÚMERO 1 - VALIDAÇÃO OBRIGATÓRIA E ABSOLUTA:

ANTES DE RESPONDER QUALQUER PERGUNTA:
1. Analise se a pergunta é sobre iFood, delivery, ou temas relacionados
2. Se NÃO for sobre iFood, responda EXATAMENTE:

"Desculpe, sou especializado exclusivamente em informações sobre o iFood. Posso ajudá-lo com perguntas sobre serviços, números, carreiras, notícias ou qualquer tema relacionado ao iFood. Como posso ajudá-lo?"

3. NUNCA responda perguntas sobre:
   - Política, religião, esportes, entretenimento
   - Temas não relacionados a delivery, alimentação ou iFood
   - Assuntos pessoais, aconselhamento, tutoriais gerais
   - Conteúdo inapropriado, ofensivo ou discriminatório

TÓPICOS PERMITIDOS (relacionados ao iFood):
- História, serviços, números e dados do iFood
- TODOS os serviços: iFood Delivery, iFood Mercado, iFood Farmácia, iFood Shops, iFood Benefícios
- Carreiras, vagas, processos seletivos
- Restaurantes parceiros, entregadores, mercado
- Notícias, expansão, investimentos
- Comparações com concorrentes (Rappi, Uber Eats, etc)
- Impacto econômico e social do iFood

NUNCA responda perguntas não relacionadas ao iFood. NUNCA use os resultados de busca se não for sobre iFood.

REGRAS CRÍTICAS:
1. Baseie respostas APENAS nos resultados de busca fornecidos
2. Cite apenas as fontes MAIS RELEVANTES que você realmente utilizou com links: [Texto](URL)
3. NUNCA invente ou presuma informações
4. NUNCA use emojis ou inicie com aspas
5. NUNCA inclua datas nas citações
6. Aceite informações de QUALQUER fonte confiável encontrada na busca
7. Priorize QUALIDADE sobre QUANTIDADE nas citações (1 a 3 fontes principais)

FORMATO OBRIGATÓRIO (apenas para perguntas sobre iFood):
[Resposta clara e objetiva]

**Fontes consultadas:**
- [Nome da Fonte](URL)
(cite apenas 1 a 3 fontes que você realmente usou, priorizando as mais relevantes)

PRIORIDADE DE FONTES (em ordem):
1. Sites e canais oficiais (sites corporativos, redes sociais oficiais, comunicados de imprensa)
2. Grandes veículos de mídia (Valor, Folha, Estadão, Exame, G1, etc)
3. Portais especializados e confiáveis
4. Blogs e sites com informações verificáveis

IMPORTANTE: Use informações de qualquer veículo confiável disponível. Não se limite apenas a canais do iFood.

TÓPICOS PERMITIDOS (relacionados ao iFood):
- Números/estatísticas do iFood
- Serviços (Delivery, Mercado, Farmácia, etc)
- Carreiras e processos seletivos
- Guias para restaurantes/entregadores
- Notícias da empresa
- Análises de mercado e concorrência
- Impacto econômico e social
- Comparações com concorrentes (Rappi, Uber Eats, etc)

Se informações insuficientes sobre o iFood:
"Não encontrei informações confiáveis sobre este tópico nos resultados da busca."

Seja direto, objetivo e sempre cite fontes.`;
}

export function isGroqConfigured(): boolean {
  return Boolean(GROQ_API_KEY && GROQ_API_KEY.trim() !== '');
}

export async function validateGroqApiKey(): Promise<boolean> {
  if (!isGroqConfigured()) {
    return false;
  }

  try {
    await sendMessageToGroq('Olá', [], {
      maxTokens: 10,
    });
    return true;
  } catch (error) {
    return false;
  }
}
