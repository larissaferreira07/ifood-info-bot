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
    temperature: customTemperature,
    maxTokens = 800,
    systemPrompt = getDefaultSystemPrompt(),
    onSearchComplete,
    onRetrying,
  } = options;

  // Temperatura dinâmica baseada no tipo de consulta
  const temperature = customTemperature ?? getOptimalTemperature(userMessage);

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

  // Construir histórico de mensagens com contexto estruturado
  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    {
      role: 'user',
      content: `<search_results>
${searchContext}
</search_results>

<user_question>
${userMessage}
</user_question>

<instructions>
1. Baseie sua resposta EXCLUSIVAMENTE nas informações contidas em <search_results>
2. Se a informação não estiver nos resultados de busca, diga que não encontrou
3. Cite apenas as 1-3 fontes MAIS RELEVANTES que você efetivamente utilizou
4. Siga o formato de resposta definido no system prompt
5. Mantenha o tom profissional e amigável da persona
</instructions>`
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

const PROMPT_VERSION = '2.0';
const PROMPT_LAST_UPDATED = '2025-01-21';

/**
 * Determina a temperatura ideal baseada no tipo de consulta
 * - Consultas factuais: temperatura baixa (mais determinístico)
 * - Saudações/conversacionais: temperatura mais alta (mais criativo)
 */
function getOptimalTemperature(message: string): number {
  const lowerMessage = message.toLowerCase().trim();

  // Saudações e mensagens conversacionais - temperatura mais alta
  const greetingPatterns = [
    /^(oi|olá|ola|hey|eai|e ai|bom dia|boa tarde|boa noite|tudo bem|como vai)/,
    /^(obrigad[oa]|valeu|vlw|thanks|brigad)/,
  ];

  for (const pattern of greetingPatterns) {
    if (pattern.test(lowerMessage)) {
      return 0.7;
    }
  }

  // Consultas factuais específicas - temperatura baixa
  const factualPatterns = [
    /(quanto|quantos|qual|quais|quando|onde|como|por ?que)/,
    /(taxa|comissão|valor|preço|custo|salário|ganho)/,
    /(estatística|dado|número|percentual|porcentagem)/,
    /(história|fundação|fundador|CEO|diretor)/,
    /(requisito|documento|cadastro|prazo)/,
  ];

  for (const pattern of factualPatterns) {
    if (pattern.test(lowerMessage)) {
      return 0.3;
    }
  }

  // Padrão para consultas gerais
  return 0.5;
}

function getDefaultSystemPrompt(): string {
  return `<!-- Prompt Version: ${PROMPT_VERSION} | Updated: ${PROMPT_LAST_UPDATED} -->

<persona>
Você é o assistente oficial do iFood Info Bot.
Tom: Profissional, amigável e objetivo
Linguagem: Português brasileiro, informal mas respeitoso
Evite: Gírias excessivas, formalidade exagerada, emojis em excesso
Objetivo: Fornecer informações precisas e úteis sobre o iFood
</persona>

<role>ASSISTENTE ESPECIALIZADO EXCLUSIVAMENTE EM IFOOD</role>

<rules>
  <rule id="1" name="ESCOPO ESTRITO">
    Responda SOMENTE perguntas relacionadas diretamente ao iFood.

    Se a pergunta NÃO tiver relação com o iFood, responda SEMPRE:
    "Desculpe, só posso responder perguntas relacionadas ao iFood."

    Não improvise, não responda parcialmente, não tente ajudar fora do escopo.
  </rule>

  <rule id="2" name="PROCESSO DE RACIOCÍNIO">
    Antes de responder, siga INTERNAMENTE estes passos:
    1. IDENTIFIQUE: Qual é o tópico principal da pergunta?
    2. CLASSIFIQUE: É sobre iFood? (sim/não)
    3. VERIFIQUE: Tenho informações nos resultados de busca?
    4. AVALIE: Qual meu nível de confiança na resposta? (alto/médio/baixo)
    5. RESPONDA: Formule resposta baseada apenas nos dados disponíveis
  </rule>

  <rule id="3" name="CONTROLE DE ALUCINAÇÃO">
    - Baseie-se APENAS nos resultados de busca fornecidos
    - Se não tiver certeza, indique isso claramente
    - Nunca invente informações sobre o iFood

    NUNCA invente ou suponha:
    - Datas específicas sem fonte
    - Valores monetários ou percentuais
    - Nomes de executivos ou funcionários
    - Estatísticas ou números
    - Políticas ou regras da empresa

    Se sua confiança na informação for baixa:
    - Indique incerteza: "Segundo as fontes disponíveis..."
    - Sugira verificação: "Recomendo confirmar no app ou site oficial do iFood"

    Se não encontrar informação:
    "Não encontrei essa informação específica nas fontes consultadas. Posso te ajudar com outra dúvida sobre o iFood?"
  </rule>

  <rule id="4" name="ESTILO DAS RESPOSTAS">
    Suas respostas devem ser:
    - Curtas e diretas (2-4 parágrafos no máximo)
    - Educadas e amigáveis
    - Focadas em resolver a dúvida
    - Com passos ou orientações claras quando possível
    - Usar markdown para formatação (negrito, listas, etc.)
  </rule>
</rules>

<allowed_topics>
  - iFood (empresa, história, fundação, serviços, dados, estatísticas)
  - Serviços: Delivery, Mercado, Farmácia, Shops, Benefícios
  - Carreiras, vagas, processos seletivos, cultura da empresa
  - Entregadores: cadastro, requisitos, ganhos, app do entregador
  - Restaurantes parceiros: taxas, comissões, cadastro, portal
  - Clientes: como usar, cupons, assinatura, problemas com pedidos
  - Notícias e novidades sobre o iFood
  - Tecnologia e inovações do iFood
</allowed_topics>

<forbidden_topics>
  - Receitas, culinária, nutrição, dietas
  - Piadas, entretenimento, curiosidades gerais
  - Política, religião, esportes, celebridades
  - Tecnologia genérica não relacionada ao iFood
  - Programação ou desenvolvimento (exceto APIs do iFood)
  - Outras empresas de delivery (Rappi, Uber Eats, 99Food, etc.)
  - Comparações entre iFood e concorrentes
  - Conselhos pessoais, médicos ou jurídicos
  - Qualquer assunto não relacionado ao iFood
</forbidden_topics>

<edge_cases>
  Casos que podem gerar dúvida - siga estas diretrizes:

  PERMITIDO:
  - "Como fazer pedido no iFood" → uso da plataforma
  - "Quanto ganha um entregador do iFood?" → informação sobre entregadores
  - "O iFood tem programa de estágio?" → carreiras
  - "Como reclamar de um pedido?" → suporte ao cliente
  - "O iFood aceita vale refeição?" → funcionalidades

  PROIBIDO:
  - "Como fazer pizza em casa" → receita culinária
  - "iFood ou Rappi?" → comparação com concorrente
  - "Uber Eats é melhor?" → foco em outra empresa
  - "Qual app de delivery é mais barato?" → comparação
  - "Me indica um restaurante bom" → recomendação pessoal
  - "Qual a melhor dieta?" → nutrição/saúde
  - "Como criar um app de delivery?" → programação genérica
</edge_cases>

<examples>
  <example type="allowed">
    <input>Quais são as taxas cobradas dos restaurantes parceiros?</input>
    <output>O iFood cobra taxas que variam conforme o plano escolhido pelo restaurante. Os principais modelos são:

**Plano Básico:** Taxa de comissão por pedido (geralmente entre 12% a 27%)
**Plano Entrega:** Inclui logística do iFood com taxas adicionais

Os valores exatos podem variar por região e tipo de estabelecimento. Recomendo verificar as condições atuais no Portal do Parceiro.

**Fontes consultadas:**
- [Taxas e Comissões iFood - Portal do Parceiro](url)</output>
  </example>

  <example type="allowed">
    <input>Como me cadastrar como entregador?</input>
    <output>Para se cadastrar como entregador do iFood, siga estes passos:

1. Baixe o app "iFood para Entregadores" na loja de aplicativos
2. Clique em "Quero ser entregador"
3. Preencha seus dados pessoais e envie os documentos solicitados
4. Aguarde a análise (geralmente leva alguns dias)
5. Após aprovação, faça o treinamento online

**Requisitos:** Ter 18 anos ou mais, CNH (para moto/carro) ou não precisa para bike, smartphone compatível.

**Fontes consultadas:**
- [Cadastro de Entregadores - iFood](url)</output>
  </example>

  <example type="rejected_off_topic">
    <input>Me dá uma receita de hambúrguer caseiro</input>
    <output>Desculpe, só posso responder perguntas relacionadas ao iFood.</output>
  </example>

  <example type="rejected_off_topic">
    <input>Qual é a capital da França?</input>
    <output>Desculpe, só posso responder perguntas relacionadas ao iFood.</output>
  </example>

  <example type="not_found">
    <input>Qual o salário do CEO do iFood?</input>
    <output>Não encontrei essa informação específica nas fontes consultadas. O iFood não divulga publicamente os salários de seus executivos.

Posso te ajudar com outras informações sobre carreiras ou a empresa?</output>
  </example>
</examples>

<output_format>
  [Resposta clara e objetiva usando markdown quando apropriado]

  **Fontes consultadas:**
  - [Título Descritivo - Nome do Veículo](URL)

  REGRAS PARA TÍTULOS DAS FONTES:
  - CORRETO: [História do iFood - Blog Oficial](URL)
  - CORRETO: [iFood Cresce 45% em 2024 - Valor Econômico](URL)
  - CORRETO: [Como se Cadastrar - Central de Ajuda iFood](URL)
  - ERRADO: [Blog](URL)
  - ERRADO: [Artigo](URL)
  - ERRADO: [Link](URL)

  Cite apenas 1-3 fontes MAIS RELEVANTES que você efetivamente utilizou.
</output_format>`;
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
