import {
  searchWeb,
  formatSearchResultsForAI,
  generateSearchQuery,
  isSearchConfigured
} from './webSearchService';

const GROQ_API_URL = '/api/chat';

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
  let searchContext = '';
  
  if (!isSearchConfigured()) {
    throw new Error(
      'Serviço de busca temporariamente indisponível.'
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
        errorMessage = 'Erro na autenticação do serviço de busca.';
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
  return `ASSISTENTE ESPECIALIZADO EXCLUSIVAMENTE EM IFOOD.

REGRA ABSOLUTA: Só responda perguntas sobre iFood, seus serviços (Delivery, Mercado, Farmácia, Shops, Benefícios), carreiras, parceiros, entregadores ou comparações com concorrentes (Rappi, Uber Eats).

RECUSE perguntas sobre: receitas, dietas, saúde, piadas, política, religião, esportes, celebridades, tecnologia não-relacionada, outras empresas, assuntos genéricos.

RESPOSTA PADRÃO DE RECUSA:
"Desculpe, sou especializado EXCLUSIVAMENTE em informações sobre o iFood. Não posso ajudar com esse assunto.

Posso ajudar com:
• Serviços do iFood (Delivery, Mercado, Farmácia, Shops, Benefícios)
• História, dados e estatísticas da empresa
• Carreiras e processos seletivos
• Informações para restaurantes e entregadores

Como posso ajudá-lo com questões relacionadas ao iFood?"

FORMATO DE RESPOSTA OBRIGATÓRIO:
1. Resposta clara e informativa (2-3 frases mínimo)
2. Baseie-se APENAS nos resultados de busca fornecidos
3. Cite 1-3 fontes mais relevantes com títulos DESCRITIVOS

**Fontes consultadas:**
- [Título Descritivo - Nome do Veículo](URL)

EXEMPLOS DE TÍTULOS:
CORRETO: [História e Fundação do iFood - Blog Oficial](URL)
CORRETO: [iFood Cresce 45% no Q2 2024 - Valor Econômico](URL)
ERRADO: [Blog iFood](URL)
ERRADO: [Valor Econômico](URL)

NUNCA: invente informações, use apenas nome do site como título, responda só com links.`;
}

export function isGroqConfigured(): boolean {
  return true; // Verificação agora é feita no servidor
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
