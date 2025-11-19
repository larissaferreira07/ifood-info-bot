const TAVILY_API_URL = 'https://api.tavily.com/search';
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface WebSearchResponse {
  results: SearchResult[];
  query: string;
  timestamp: string;
}

export function isSearchConfigured(): boolean {
  return Boolean(TAVILY_API_KEY && TAVILY_API_KEY !== '');
}


export async function searchWeb(
  query: string,
  maxResults: number = 5
): Promise<WebSearchResponse> {
  if (!isSearchConfigured()) {
    throw new Error(
      'API de busca não configurada. Configure VITE_TAVILY_API_KEY no arquivo .env'
    );
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: 'advanced',
        include_answer: false,
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erro na API Tavily: ${response.status} - ${errorData.error || errorData.message || 'Erro desconhecido'}`
      );
    }

    const data = await response.json();

    // Formatar resultados
    const results: SearchResult[] = (data.results || []).map((result: any) => ({
      title: result.title || 'Sem título',
      url: result.url || '',
      content: result.content || '',
      score: result.score || 0,
      published_date: result.published_date,
    }));

    return {
      results,
      query,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Erro desconhecido ao realizar busca na web');
  }
}

export function formatSearchResultsForAI(searchResponse: WebSearchResponse): string {
  if (!searchResponse.results || searchResponse.results.length === 0) {
    return 'NENHUM RESULTADO ENCONTRADO NA BUSCA WEB. Você deve informar ao usuário que não encontrou informações confiáveis sobre este tópico e não pode responder.';
  }

  let formatted = '=== RESULTADOS DA BUSCA NA WEB ===\n\n';
  formatted += `Query: ${searchResponse.query}\n`;
  formatted += `Data da busca: ${new Date(searchResponse.timestamp).toLocaleDateString('pt-BR')}\n\n`;
  formatted += `INSTRUÇÕES CRÍTICAS:\n`;
  formatted += `1. Você DEVE basear sua resposta EXCLUSIVAMENTE nos resultados abaixo\n`;
  formatted += `2. Cite APENAS as fontes MAIS RELEVANTES que você realmente utilizou (1 a 3 fontes principais)\n`;
  formatted += `3. Você NÃO PODE adicionar informações que não estejam nos resultados\n`;
  formatted += `4. Se os resultados forem insuficientes, INFORME que não encontrou informações confiáveis\n`;
  formatted += `5. SEMPRE inclua a seção "Fontes consultadas:" no final com links das fontes utilizadas\n`;
  formatted += `6. NÃO use aspas no início da mensagem\n`;
  formatted += `7. NÃO use emojis na resposta\n`;
  formatted += `8. NÃO inclua "Acessado em [data]" nas citações de fontes\n`;
  formatted += `9. Priorize QUALIDADE sobre quantidade nas citações de fontes\n\n`;
  formatted += `RESULTADOS (${searchResponse.results.length}):\n\n`;

  searchResponse.results.forEach((result, index) => {
    formatted += `--- RESULTADO ${index + 1} ---\n`;
    formatted += `Título: ${result.title}\n`;
    formatted += `URL: ${result.url}\n`;
    if (result.published_date) {
      formatted += `Data de publicação: ${result.published_date}\n`;
    }
    formatted += `Relevância: ${(result.score * 100).toFixed(0)}%\n`;
    formatted += `Conteúdo:\n${result.content}\n\n`;
  });

  formatted += '\n=== FIM DOS RESULTADOS ===\n\n';
  formatted += 'LEMBRE-SE: Cite apenas os URLs das fontes que você realmente utilizou (1 a 3 principais).\n';
  formatted += 'Priorize fontes mais relevantes e confiáveis. Não é obrigatório usar todos os resultados.\n';

  return formatted;
}

export function generateSearchQuery(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (!lowerMessage.includes('ifood')) {
    return `iFood ${userMessage}`;
  }
  
  return userMessage;
}
