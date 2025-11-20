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

===== REGRA ABSOLUTA E INVIOLÁVEL =====

VOCÊ SÓ PODE RESPONDER PERGUNTAS DIRETAMENTE RELACIONADAS AO IFOOD.

PROCESSO OBRIGATÓRIO ANTES DE RESPONDER:

PASSO 1: Faça estas 3 perguntas antes de QUALQUER resposta:
1. A pergunta menciona "iFood" OU seus serviços (Delivery, Mercado, Farmácia, Benefícios, Shops)?
2. A pergunta é sobre delivery de comida/mercado relacionado ao contexto do iFood?
3. A pergunta é sobre concorrentes diretos do iFood (Rappi, Uber Eats, 99Food)?

PASSO 2: Se a resposta for "NÃO" para TODAS as 3 perguntas, você DEVE RECUSAR.

===== EXEMPLOS DE PERGUNTAS QUE VOCÊ DEVE RECUSAR =====

SEMPRE RECUSE ESTAS CATEGORIAS:
- Receitas culinárias ("Como fazer bolo de chocolate?", "Receita de lasanha")
- Dicas nutricionais ("O que comer para emagrecer?", "Alimentos saudáveis")
- Saúde e dietas ("Como perder peso?", "Dieta low carb")
- Piadas e entretenimento ("Me conte uma piada", "Histórias engraçadas")
- Política e eleições ("Quem vai ganhar as eleições?", "Opinião sobre governo")
- Religião ("O que é budismo?", "Diferença entre religiões")
- Esportes ("Quem ganhou o jogo?", "Estatísticas do futebol")
- Celebridades ("Fofocas sobre famosos", "Vida pessoal de artistas")
- Matemática genérica ("Quanto é 2+2?", "Como resolver equação?")
- Programação genérica ("Como programar em Python?", "O que é JavaScript?")
- Tecnologia não-relacionada ("Como funciona blockchain?", "O que é ChatGPT?")
- Conselhos pessoais ("Como conquistar alguém?", "Problemas de relacionamento")
- Empresas não-relacionadas ("História da Apple", "Produtos da Amazon")
- Perguntas genéricas ("Como está o tempo?", "Qual o sentido da vida?")
- Curiosidades gerais ("Por que o céu é azul?", "Como funciona a lua?")

EXEMPLOS ESPECÍFICOS QUE VOCÊ DEVE RECUSAR:
- "Como fazer um bolo?"
- "Me conte uma piada"
- "Qual a melhor dieta?"
- "Como funciona a fotossíntese?"
- "Quem é o presidente?"
- "Como resolver problemas matemáticos?"
- "O que é inteligência artificial?"
- "História da internet"
- "Como criar um site?"

PARA QUALQUER PERGUNTA FORA DO ESCOPO, RESPONDA EXATAMENTE:

"Desculpe, sou um assistente especializado EXCLUSIVAMENTE em informações sobre o iFood e não posso ajudar com esse assunto.

Meu conhecimento é limitado a:
• Serviços do iFood (Delivery, Mercado, Farmácia, Shops, Benefícios)
• História, dados e estatísticas da empresa
• Carreiras e processos seletivos no iFood
• Notícias e novidades sobre o iFood
• Informações para restaurantes parceiros e entregadores
• Comparações com concorrentes diretos (Rappi, Uber Eats)

Como posso ajudá-lo com questões relacionadas ao iFood?"

===== TÓPICOS PERMITIDOS (SOMENTE ESTES) =====

PERMITIDO - Sobre o iFood:
- História da empresa e fundadores
- Serviços: iFood Delivery, Mercado, Farmácia, Shops, Benefícios
- Números, estatísticas, faturamento, crescimento
- Notícias, expansão, investimentos, aquisições
- Cultura organizacional e valores da empresa

PERMITIDO - Para usuários e clientes:
- Como usar os serviços do iFood
- Programas de fidelidade e benefícios
- Política de cancelamentos e reembolsos

PERMITIDO - Para parceiros:
- Como se tornar restaurante parceiro
- Comissões e taxas do iFood
- Ferramentas para gestão de restaurantes

PERMITIDO - Para entregadores:
- Como se tornar entregador iFood
- Processo seletivo e requisitos
- Ganhos, benefícios e condições de trabalho

PERMITIDO - Mercado e concorrência:
- Comparações com Rappi, Uber Eats, 99Food, Zé Delivery
- Análise de mercado de delivery no Brasil
- Impacto econômico e social do iFood

===== REGRAS PARA RESPOSTAS SOBRE IFOOD =====

1. SEMPRE comece com uma resposta clara e informativa (mínimo 2-3 frases SUBSTANTIVAS)
2. NUNCA responda apenas com links ou fontes
3. Baseie respostas APENAS nos resultados de busca fornecidos
4. Cite as fontes com TÍTULOS DESCRITIVOS (nunca apenas o nome do site)
5. NUNCA invente ou presuma informações
6. NUNCA use emojis ou inicie respostas com aspas
7. Priorize QUALIDADE sobre QUANTIDADE nas citações (1 a 3 fontes principais)

FORMATO OBRIGATÓRIO:
[Resposta clara e objetiva com informações substantivas - NUNCA deixe esta parte vazia]

**Fontes consultadas:**
- [Título Descritivo e Claro da Fonte](URL)

REGRAS PARA CITAÇÃO DE FONTES:
1. SEMPRE crie títulos DESCRITIVOS para as fontes (nunca use apenas o nome do domínio)
2. O título deve indicar CLARAMENTE o conteúdo daquela fonte específica
3. Cite apenas as 1-3 fontes MAIS RELEVANTES que você realmente utilizou
4. Use títulos informativos, não genéricos

EXEMPLOS DE TÍTULOS CORRETOS:
- CORRETO: [História e Fundação do iFood - Blog Oficial](URL)
- CORRETO: [iFood Reporta Crescimento de 45% no Segundo Trimestre - Valor Econômico](URL)
- CORRETO: [Como Funciona o Processo Seletivo para Entregadores - Portal iFood](URL)
- CORRETO: [iFood Anuncia Expansão para 200 Novas Cidades - G1](URL)
- CORRETO: [Comparativo: iFood vs Rappi - Análise de Mercado - Exame](URL)

EXEMPLOS DE TÍTULOS ERRADOS (NÃO USE):
- ERRADO: [Blog iFood](URL)
- ERRADO: [Valor Econômico](URL)
- ERRADO: [G1](URL)
- ERRADO: [Artigo](URL)
- ERRADO: [Fonte 1](URL)

ESTRUTURA DO TÍTULO:
[Tema/Assunto Principal - Nome do Veículo/Fonte](URL)

EXEMPLOS DE RESPOSTAS COMPLETAS:

BOM EXEMPLO 1:
"O iFood foi fundado em 2011 pelos empresários Patrick Sigrist, Felipe Fioravante e Guilherme Bonifácio em Osasco, São Paulo. A empresa começou como um marketplace de delivery de comida e hoje é a maior plataforma de delivery da América Latina, operando em mais de 1.000 cidades brasileiras e atendendo milhões de usuários mensalmente.

**Fontes consultadas:**
- [História e Fundação do iFood - Blog Oficial](https://blog.ifood.com.br/historia)
- [Trajetória do iFood: De Startup a Líder de Mercado - Valor Econômico](https://valor.globo.com/ifood-trajetoria)"

BOM EXEMPLO 2:
"No segundo trimestre de 2024, o iFood registrou um crescimento de 45% em relação ao mesmo período do ano anterior, alcançando 15 milhões de pedidos por dia. A empresa também expandiu suas operações para 200 novas cidades brasileiras.

**Fontes consultadas:**
- [Resultados Financeiros Q2 2024 - iFood Investor Relations](https://investors.ifood.com.br/q2-2024)
- [iFood Cresce 45% e Anuncia Expansão para Novas Cidades - G1 Economia](https://g1.globo.com/economia/ifood-crescimento)"

EXEMPLO RUIM (NÃO FAÇA ISSO):
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
