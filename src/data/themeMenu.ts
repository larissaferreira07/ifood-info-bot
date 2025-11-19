export interface ThemeOption {
  id: string;
  label: string;
  query?: string; 
  subtopics?: ThemeOption[];
}

export const THEME_MENU: ThemeOption[] = [
  {
    id: 'estagio-genai',
    label: 'Programa de Estágio GenAI',
    subtopics: [
      {
        id: 'genai-sobre',
        label: 'Sobre o Programa',
        query: 'Como funciona o Programa de Estágio GenAI do iFood? Qual o objetivo e diferenciais?',
      },
      {
        id: 'genai-requisitos',
        label: 'Requisitos e Perfil',
        query: 'Quais são os requisitos para participar do Programa de Estágio GenAI?',
      },
      {
        id: 'genai-inscricao',
        label: 'Como se Inscrever',
        query: 'Como faço para me inscrever no Programa de Estágio GenAI do iFood?',
      },
      {
        id: 'genai-processo',
        label: 'Processo Seletivo',
        query: 'Como funciona o processo seletivo do Programa de Estágio GenAI?',
      },
      {
        id: 'genai-duracao',
        label: 'Duração e Formato',
        query: 'Qual a duração do Programa de Estágio GenAI e como funciona o formato?',
      },
      {
        id: 'genai-beneficios',
        label: 'Benefícios',
        query: 'Quais são os benefícios oferecidos no Programa de Estágio GenAI?',
      },
      {
        id: 'genai-aprendizado',
        label: 'Aprendizado e Projetos',
        query: 'O que vou aprender e em quais projetos vou trabalhar no Programa GenAI?',
      },
    ],
  },
  {
    id: 'numeros',
    label: 'Números e Estatísticas',
    subtopics: [
      {
        id: 'numeros-gerais',
        label: 'Visão Geral',
        query: 'Quais são os números atuais do iFood? (usuários, restaurantes, pedidos)',
      },
      {
        id: 'numeros-crescimento',
        label: 'Crescimento',
        query: 'Qual foi o crescimento do iFood nos últimos anos?',
      },
      {
        id: 'numeros-mercado',
        label: 'Participação de Mercado',
        query: 'Qual a participação de mercado do iFood no Brasil?',
      },
      {
        id: 'numeros-entregadores',
        label: 'Entregadores',
        query: 'Quantos entregadores trabalham com o iFood?',
      },
    ],
  },
  {
    id: 'servicos',
    label: 'Serviços',
    subtopics: [
      {
        id: 'servicos-delivery',
        label: 'iFood Delivery',
        query: 'Como funciona o iFood Delivery?',
      },
      {
        id: 'servicos-mercado',
        label: 'iFood Mercado',
        query: 'O que é o iFood Mercado e como funciona?',
      },
      {
        id: 'servicos-farmacia',
        label: 'iFood Farmácia',
        query: 'Como funciona o iFood Farmácia?',
      },
      {
        id: 'servicos-shop',
        label: 'iFood Shop',
        query: 'O que é o iFood Shop?',
      },
      {
        id: 'servicos-pago',
        label: 'iFood Pago',
        query: 'Como funciona o iFood Pago e quais serviços financeiros oferece?',
      },
      {
        id: 'servicos-beneficios',
        label: 'iFood Benefícios',
        query: 'O que é o iFood Benefícios?',
      },
    ],
  },
  {
    id: 'carreiras',
    label: 'Carreiras e Vagas',
    subtopics: [
      {
        id: 'carreiras-vagas',
        label: 'Vagas Disponíveis',
        query: 'Quais são as principais áreas com vagas abertas no iFood?',
      },
      {
        id: 'carreiras-processo',
        label: 'Processo Seletivo',
        query: 'Como funciona o processo seletivo do iFood?',
      },
      {
        id: 'carreiras-areas',
        label: 'Áreas de Atuação',
        query: 'Quais são as principais áreas de atuação dentro do iFood?',
      },
      {
        id: 'carreiras-dicas',
        label: 'Dicas para Candidatos',
        query: 'Quais dicas você pode dar para quem quer trabalhar no iFood?',
      },
      {
        id: 'carreiras-beneficios-empresa',
        label: 'Benefícios aos Colaboradores',
        query: 'Quais são os benefícios oferecidos aos colaboradores do iFood?',
      },
    ],
  },
  {
    id: 'parceiros',
    label: 'Para Restaurantes',
    subtopics: [
      {
        id: 'parceiros-cadastro',
        label: 'Como me Cadastrar',
        query: 'Como cadastrar meu restaurante no iFood?',
      },
      {
        id: 'parceiros-taxas',
        label: 'Taxas e Comissões',
        query: 'Quais são as taxas cobradas pelo iFood dos restaurantes?',
      },
      {
        id: 'parceiros-ferramentas',
        label: 'Ferramentas Disponíveis',
        query: 'Quais ferramentas o iFood oferece para restaurantes parceiros?',
      },
      {
        id: 'parceiros-suporte',
        label: 'Suporte ao Parceiro',
        query: 'Como funciona o suporte do iFood para restaurantes?',
      },
    ],
  },
  {
    id: 'entregadores',
    label: 'Para Entregadores',
    subtopics: [
      {
        id: 'entregadores-cadastro',
        label: 'Como me Cadastrar',
        query: 'Como me cadastrar como entregador do iFood?',
      },
      {
        id: 'entregadores-ganhos',
        label: 'Ganhos e Pagamentos',
        query: 'Como funcionam os ganhos e pagamentos dos entregadores do iFood?',
      },
      {
        id: 'entregadores-requisitos',
        label: 'Requisitos',
        query: 'Quais são os requisitos para ser entregador do iFood?',
      },
      {
        id: 'entregadores-beneficios',
        label: 'Benefícios',
        query: 'Quais benefícios o iFood oferece para entregadores?',
      },
    ],
  },
  {
    id: 'empresa',
    label: 'Sobre a Empresa',
    subtopics: [
      {
        id: 'empresa-historia',
        label: 'História',
        query: 'Qual é a história do iFood?',
      },
      {
        id: 'empresa-missao',
        label: 'Missão e Valores',
        query: 'Qual a missão e valores do iFood?',
      },
      {
        id: 'empresa-impacto',
        label: 'Impacto Social',
        query: 'Qual é o impacto social e econômico do iFood?',
      },
      {
        id: 'empresa-sustentabilidade',
        label: 'Sustentabilidade',
        query: 'Quais são as iniciativas de sustentabilidade do iFood?',
      },
      {
        id: 'empresa-inovacao',
        label: 'Inovação e Tecnologia',
        query: 'Como o iFood usa tecnologia e inovação?',
      },
    ],
  },
  {
    id: 'noticias',
    label: 'Notícias e Novidades',
    query: 'Quais são as últimas notícias e novidades do iFood?',
  },
];

export function findThemeById(id: string, themes: ThemeOption[] = THEME_MENU): ThemeOption | null {
  for (const theme of themes) {
    if (theme.id === id) {
      return theme;
    }
    if (theme.subtopics) {
      const found = findThemeById(id, theme.subtopics);
      if (found) return found;
    }
  }
  return null;
}

export function getThemePath(id: string, themes: ThemeOption[] = THEME_MENU, path: ThemeOption[] = []): ThemeOption[] | null {
  for (const theme of themes) {
    if (theme.id === id) {
      return [...path, theme];
    }
    if (theme.subtopics) {
      const found = getThemePath(id, theme.subtopics, [...path, theme]);
      if (found) return found;
    }
  }
  return null;
}
