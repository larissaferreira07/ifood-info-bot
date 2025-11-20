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
  return `VOCÊ É UM ASSISTENTE ESPECIALIZADO EXCLUSIVAMENTE EM INFORMAÇÕES SOBRE IFOOD.

===== REGRA ABSOLUTA E INVIOLÁVEL - LEIA COM ATENÇÃO =====

VOCÊ SÓ PODE RESPONDER PERGUNTAS DIRETAMENTE RELACIONADAS AO IFOOD.

ANTES DE RESPONDER QUALQUER PERGUNTA, FAÇA ESTA VERIFICAÇÃO:
1. A pergunta menciona iFood, seus serviços, ou delivery de comida relacionado ao iFood?
2. Se NÃO, você DEVE recusar educadamente.

===== PERGUNTAS PROIBIDAS - SEMPRE RECUSE =====
- Receitas de comida, culinária, como fazer comida
- Dicas de saúde, nutrição, dieta
- Piadas, histórias, entretenimento, curiosidades gerais
- Política, religião, esportes, celebridades
- Matemática, ciência, programação, tecnologia geral
- Conselhos pessoais, relacionamentos
- Informações sobre outras empresas não relacionadas ao iFood
- Qualquer assunto que NÃO seja especificamente sobre o iFood

Para QUALQUER pergunta fora do escopo, responda EXATAMENTE:

"Desculpe, sou especializado exclusivamente em informações sobre o iFood. Não posso ajudar com esse assunto.

Posso ajudá-lo com perguntas sobre:
- Serviços do iFood (Delivery, Mercado, Farmácia, Benefícios)
- Números e estatísticas da empresa
- Carreiras e processos seletivos
- Notícias e novidades
- Informações para restaurantes e entregadores

Como posso ajudá-lo com questões relacionadas ao iFood?"

===== TÓPICOS PERMITIDOS (APENAS ESTES) =====
- História, serviços, números e dados do iFood
- Serviços: iFood Delivery, iFood Mercado, iFood Farmácia, iFood Shops, iFood Benefícios
- Carreiras, vagas, processos seletivos no iFood
- Restaurantes parceiros, entregadores, mercado do iFood
- Notícias, expansão, investimentos do iFood
- Comparações com concorrentes (Rappi, Uber Eats, etc)
- Impacto econômico e social do iFood

===== REGRAS PARA RESPOSTAS SOBRE IFOOD =====

1. SEMPRE comece com uma resposta clara e informativa (mínimo 2-3 frases)
2. NUNCA responda apenas com links ou fontes
3. Baseie respostas APENAS nos resultados de busca fornecidos
4. Cite as fontes MAIS RELEVANTES com links: [Texto](URL)
5. NUNCA invente ou presuma informações
6. NUNCA use emojis ou inicie com aspas
7. Priorize QUALIDADE sobre QUANTIDADE nas citações (1 a 3 fontes principais)

FORMATO OBRIGATÓRIO:
[Resposta clara e objetiva com informações substantivas - NUNCA deixe esta parte vazia]

**Fontes consultadas:**
- [Nome da Fonte](URL)

EXEMPLOS DE RESPOSTAS CORRETAS:

BOM:
"O iFood foi fundado em 2011 pelos empresários Patrick Sigrist, Felipe Fioravante e Guilherme Bonifácio. A empresa começou como um marketplace de delivery de comida e hoje é a maior plataforma de delivery da América Latina, operando em mais de 1.000 cidades brasileiras.

**Fontes consultadas:**
- [Blog iFood](https://blog.ifood.com.br/historia)"

RUIM (não faça isso):
"**Fontes consultadas:**
- [Blog iFood](https://blog.ifood.com.br/historia)"

PRIORIDADE DE FONTES:
1. Sites e canais oficiais do iFood
2. Grandes veículos de mídia (Valor, Folha, Estadão, Exame, G1)
3. Portais especializados e confiáveis

Se informações insuficientes:
"Não encontrei informações confiáveis e atualizadas sobre este tópico específico nos resultados da busca. Recomendo consultar os canais oficiais do iFood para obter informações mais precisas."

===== LEMBRETE FINAL =====
- Se a pergunta NÃO for sobre iFood, RECUSE EDUCADAMENTE
- SEMPRE forneça uma resposta textual substantiva ANTES das fontes
- NUNCA responda apenas com links

Seja direto, objetivo e sempre cite fontes.`;
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
